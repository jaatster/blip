#!/usr/bin/env node
/**
 * Blip's diagnostic codes, read from the source: every PP-XNNN code a package raises (with `warn()`,
 * `checkName()`, `console.warn` or the token build's `problem()`), where, and with what message. The table of codes
 * in CONTRACT.md is written from this list, so it never falls behind the source.
 *
 *   node scripts/diagnostics.mjs           rewrite the table in CONTRACT.md
 *   node scripts/diagnostics.mjs --check   fail if the table is out of date (a code in the source is not in it, or
 *                                          a code in it is no longer raised)
 *
 * The docs site's diagnostics page reads the same scan (apps/docs/src/lib/data.ts), and
 * tests/unit/node/docs-diagnostics.test.ts fails when the table and the source disagree.
 */
import { existsSync, readFileSync, readdirSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// ------------------------------------------------------------------ the ranges

/**
 * What each prefix covers. The codes themselves, and what raises them, come from the source; a new prefix needs a
 * line here (the script fails until it has one).
 */
export const RANGES = {
  T: "Reading the token files and the resolver (`PP-T003` also: a resolver with no `scheme` or `pixel` modifier), token names, types, values (colours, dimensions, durations, whole pixels, font families and weights), aliases, and contrast: `PP-T060` a text pair under AA, labels on a disabled control's dither included; `PP-T061` the focus ring under 3:1; `PP-T062` a candy's label, and white on slate's ink dither",
  A: "Accessibility: a control or a dialog without an accessible name",
  E: "An element without the native markup it upgrades: a control, a `<dialog>`, a tooltip's trigger",
  N: "A navigation element without the parts it wires together",
  M: "A menu without its button or its list",
  C: "A command palette without its `<dialog>`, input or list",
  W: "The world backdrop: no world colours (`tokens.css` is not loaded), an `avoid` that is not a selector list",
  I: "An icon name that does not exist",
};
/** The order of the table: the build first, then the browser, roughly from most to least common. */
const ORDER = ["T", "A", "E", "N", "M", "C", "W", "I"];

// ------------------------------------------------------------------ the scan

/** The arguments of the call that starts at `open` (the index of its "("), as source text. */
function callArgs(s, open) {
  const args = [];
  let depth = 0, start = open + 1, quote = "", tpl = 0;
  for (let i = open; i < s.length; i++) {
    const c = s[i];
    if (quote) {
      if (c === "\\") i++;
      else if (quote === "`" && c === "$" && s[i + 1] === "{") (tpl++, i++);
      else if (quote === "`" && tpl && c === "}") tpl--;
      else if (c === quote && !tpl) quote = "";
      continue;
    }
    if (c === '"' || c === "'" || c === "`") quote = c;
    else if ("([{".includes(c)) depth++;
    else if (")]}".includes(c)) {
      depth--;
      if (depth === 0) {
        args.push(s.slice(start, i).trim());
        return args;
      }
    } else if (c === "," && depth === 1) {
      args.push(s.slice(start, i).trim());
      start = i + 1;
    }
  }
  return args;
}
/** A string literal's text, with ${…} shown as an ellipsis; undefined for anything else. */
function literal(arg) {
  const m = arg?.match(/^(["'`])([\s\S]*)\1$/);
  return m ? m[2].replace(/\$\{[^}]*\}/g, "…").replace(/\\(["'`])/g, "$1") : undefined;
}

/**
 * Every code raised in the packages' source and build scripts: code -> [{ file, line, message, fix? }], sorted by
 * code. A code only mentioned (in a comment, or in a doc string showing how to call warn()) is not counted.
 */
export function scan(root = ROOT) {
  const codes = new Map();
  const scanFile = (rel) => {
    const lines = readFileSync(join(root, rel), "utf8").split("\n");
    const comment = rel.endsWith(".py") ? /^\s*#/ : /^\s*(\*|\/\/|\/\*)/;
    lines.forEach((line, i) => {
      if (comment.test(line)) return;
      for (const m of line.matchAll(/PP-[A-Z]\d{3}/g)) {
        const code = m[0];
        let message;
        let fix;
        const at = (name) => line.lastIndexOf(`${name}(`, m.index);
        if (at("problem") >= 0) {
          const a = callArgs(line, at("problem") + "problem".length);
          message = literal(a[3]);
          fix = literal(a[4]);
        } else if (at("warn") >= 0 && !line.includes("console.warn")) {
          message = literal(callArgs(line, at("warn") + "warn".length)[1]);
        } else if (line.includes("console.warn")) {
          message = literal(callArgs(line, line.indexOf("console.warn(") + "console.warn".length)[0])?.replace(/^Blip PP-[A-Z]\d{3}:\s*/, "");
        } else if (/checkName\(/.test(line)) message = "<element> has no accessible name. Add text or aria-label.";
        if (!message) continue;
        const list = codes.get(code) ?? [];
        list.push({ file: rel, line: i + 1, message, ...(fix ? { fix } : {}) });
        codes.set(code, list);
      }
    });
  };
  const walk = (rel) => {
    for (const f of readdirSync(join(root, rel)).sort()) {
      const p = `${rel}/${f}`;
      if (f === "node_modules" || f === "dist" || f.startsWith(".")) continue;
      if (statSync(join(root, p)).isDirectory()) walk(p);
      else if (/\.(ts|mjs|js|py)$/.test(f) && !f.endsWith(".d.ts") && !f.endsWith(".test.ts")) scanFile(p);
    }
  };
  for (const pkg of readdirSync(join(root, "packages")).sort()) {
    for (const sub of ["src", "scripts"]) if (existsSync(join(root, "packages", pkg, sub))) walk(`packages/${pkg}/${sub}`);
  }
  return new Map([...codes].sort(([a], [b]) => a.localeCompare(b)));
}

// ------------------------------------------------------------------ who raises them

/** The tags a module defines (`define("pp-x"` or `PixelElement.define("pp-x"`). */
const tagsIn = (text) => [...text.matchAll(/define\(\s*["'](pp-[a-z0-9-]+)["']/g)].map((m) => m[1]);

/** What raises a code at this place, in words: an element's tag, a function, or the token build. */
function raiser(root, file) {
  if (/^packages\/[^/]+\/scripts\//.test(file)) return file.startsWith("packages/tokens/") ? "the token build and `blip-tokens`" : `the ${file.split("/")[1]} build`;
  const text = readFileSync(join(root, file), "utf8");
  const own = tagsIn(text);
  if (own.length) return own.map((t) => `\`<${t}>\``).join(", ");
  // A private base class (_overlay.ts): the elements of its package that extend it.
  const dir = dirname(file);
  const base = file.split("/").pop().replace(/\.ts$/, "");
  if (base.startsWith("_")) {
    const users = readdirSync(join(root, dir)).sort().filter((f) => f.endsWith(".ts") && !f.endsWith(".d.ts") && readFileSync(join(root, dir, f), "utf8").includes(`./${base}.js`));
    const tags = users.flatMap((f) => tagsIn(readFileSync(join(root, dir, f), "utf8")));
    if (tags.length) return tags.map((t) => `\`<${t}>\``).join(", ");
  }
  const pkg = file.split("/")[1];
  if (/checkName\(/.test(text)) return `\`checkName()\` in \`@jaatster/blip-${pkg}\``;
  return `\`@jaatster/blip-${pkg}\``;
}

// ------------------------------------------------------------------ the table

/** "`PP-T001` to `PP-T004`, `PP-T010`, `PP-T020` and `PP-T021`": runs of consecutive codes. */
export function runs(codes) {
  const nums = codes.map((c) => ({ c, n: Number(c.slice(4)) })).sort((a, b) => a.n - b.n);
  const out = [];
  for (let i = 0; i < nums.length; ) {
    let j = i;
    while (j + 1 < nums.length && nums[j + 1].n === nums[j].n + 1) j++;
    const a = `\`${nums[i].c}\``, b = `\`${nums[j].c}\``;
    out.push(j === i ? a : j === i + 1 ? `${a} and ${b}` : `${a} to ${b}`);
    i = j + 1;
  }
  return out.join(", ");
}

const START = "<!-- diagnostics: written by scripts/diagnostics.mjs from the source. Run it after adding or retiring a code. -->";
const END = "<!-- /diagnostics -->";

/** The markdown table of the codes, one row per prefix. Throws when a prefix has no entry in RANGES. */
export function table(codes, root = ROOT) {
  const byPrefix = new Map();
  for (const [code, occ] of codes) {
    const p = code[3];
    if (!RANGES[p]) throw new Error(`diagnostics: ${code} (${occ[0].file}:${occ[0].line}) starts a new range, PP-${p}. Add what it covers to RANGES in scripts/diagnostics.mjs.`);
    const row = byPrefix.get(p) ?? { codes: [], raisers: new Set() };
    row.codes.push(code);
    for (const o of occ) row.raisers.add(raiser(root, o.file));
    byPrefix.set(p, row);
  }
  const rows = [...byPrefix].sort(([a], [b]) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99));
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  return [
    "| Range | Raised by | Covers | Codes today |",
    "|---|---|---|---|",
    ...rows.map(([p, r]) => `| \`PP-${p}\` | ${cap([...r.raisers].join(", "))} | ${RANGES[p]} | ${runs(r.codes)} |`),
  ].join("\n");
}

/** Every code a markdown table lists, with runs ("`PP-T001` to `PP-T004`") expanded. */
export function codesIn(markdown) {
  const out = new Set();
  for (const line of markdown.split("\n").filter((l) => l.startsWith("|"))) {
    for (const m of line.matchAll(/`PP-([A-Z])(\d{3})` to `PP-\1(\d{3})`/g)) for (let n = Number(m[2]); n <= Number(m[3]); n++) out.add(`PP-${m[1]}${String(n).padStart(3, "0")}`);
    for (const m of line.matchAll(/PP-[A-Z]\d{3}/g)) out.add(m[0]);
  }
  return out;
}

/** The generated part of CONTRACT.md, between its markers. */
export function contractTable(contract) {
  const a = contract.indexOf(START), b = contract.indexOf(END);
  if (a < 0 || b < a) throw new Error("diagnostics: CONTRACT.md has no table markers. Put the table between\n  " + START + "\n  " + END);
  return contract.slice(a + START.length, b).trim();
}

/** How CONTRACT.md's table compares with the source. */
export function compare(root = ROOT) {
  const codes = scan(root);
  const contract = readFileSync(join(root, "CONTRACT.md"), "utf8");
  const listed = codesIn(contractTable(contract));
  const raised = new Set(codes.keys());
  return {
    codes,
    contract,
    missing: [...raised].filter((c) => !listed.has(c)),
    stale: [...listed].filter((c) => !raised.has(c)),
    upToDate: contractTable(contract) === table(codes, root),
  };
}

// ------------------------------------------------------------------ run

// Run as a script (not when bundled into another tool, such as the docs site).
const self = fileURLToPath(import.meta.url);
if (process.argv[1] && /[\\/]scripts[\\/]diagnostics\.mjs$/.test(self) && realpathSync(process.argv[1]) === realpathSync(self)) {
  const check = process.argv.includes("--check");
  const { codes, contract, missing, stale, upToDate } = compare();
  if (check) {
    for (const c of missing) console.error(`diagnostics: ${c} is raised in ${relative(ROOT, join(ROOT, codes.get(c)[0].file))}:${codes.get(c)[0].line} but CONTRACT.md does not list it.`);
    for (const c of stale) console.error(`diagnostics: CONTRACT.md lists ${c}, which nothing raises any more. Retired codes stay retired: say so in the changelog.`);
    if (!upToDate) {
      console.error("diagnostics: CONTRACT.md's table is out of date. Run: node scripts/diagnostics.mjs");
      process.exit(1);
    }
    console.log(`diagnostics: CONTRACT.md lists all ${codes.size} codes.`);
  } else {
    const a = contract.indexOf(START), b = contract.indexOf(END);
    if (a < 0 || b < a) throw new Error("diagnostics: CONTRACT.md has no table markers.");
    const next = contract.slice(0, a + START.length) + "\n" + table(codes) + "\n" + contract.slice(b);
    if (next !== contract) writeFileSync(join(ROOT, "CONTRACT.md"), next);
    console.log(`diagnostics: ${codes.size} codes in ${new Set([...codes.keys()].map((c) => c[3])).size} ranges${next !== contract ? ", CONTRACT.md updated" : ", CONTRACT.md already up to date"}.`);
  }
}
