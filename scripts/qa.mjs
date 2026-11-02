#!/usr/bin/env node
/**
 * The checks for one component or kit part, and only those: what to run while you build it.
 *
 *   pnpm qa <name>                       tabs, button, world, attract, hud, blip-counter, text…
 *   pnpm qa <name> --fast                without the Playwright runs (visual and accessibility)
 *   pnpm qa <name> --update-snapshots    writes its visual baselines; look at every picture before you commit them
 *
 * It finds the item by name: its docs pages (packages/<package>/docs/<name>.md, else the pages whose front matter
 * names the element <blip-name> or the stylesheet <name>.css, so `counter` finds the HUD and `text` the three text
 * effects), the stylesheets and elements their front matter names, and the examples named after them. Then:
 *
 *   files    what is missing: a docs page, an example, a stylesheet's header comment, visual baselines for this
 *            platform, a unit test that mentions its element, its element's row in CONTRACT.md
 *   lint     stylelint on its stylesheets, after regenerating the public custom properties (as pnpm lint:css does)
 *   docs     tests/unit/node/docs-components.test.ts on its pages: they name only what the code has, and all of it
 *   cem      its packages' Custom Elements Manifests are up to date
 *   budgets  its rows of scripts/budgets.mjs: its element modules and its package's line (measured from dist)
 *   unit     the Vitest files that mention it: its tag, its class, its element class, module or stylesheet, or its
 *            name in the file name
 *   visual   its examples in Day, Sunset and Night (and at 390 wide when responsive), against the baselines
 *   a11y     axe on its examples in Day and Night, and with each overlay open
 *
 * A check with nothing to check is skipped. A table at the end sums up; the exit code is 1 when a check fails or
 * something is missing, 2 when the name finds nothing. The Playwright runs wait for scripts/heavy.mjs's lock and use
 * the test server on BLIP_TEST_PORT (4180; started when nothing is listening). They load the elements from dist, so a
 * note says which package to build when a source is newer than its build.
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { heavy } from "./heavy.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const at = (rel) => join(ROOT, rel);
const exists = (rel) => existsSync(at(rel));
const read = (rel) => readFileSync(at(rel), "utf8");
const list = (rel) => (exists(rel) ? readdirSync(at(rel)).sort() : []);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const BIN = {
  stylelint: at("node_modules/stylelint/bin/stylelint.mjs"),
  vitest: at("tests/node_modules/vitest/vitest.mjs"),
  playwright: at("tests/node_modules/@playwright/test/cli.js"),
};
const SCHEMES = ["day", "sunset", "night"];
/** Each package's line in scripts/budgets.mjs, besides the element modules. */
const PACKAGE_BUDGET = { core: "core.css", components: "all components CSS", effects: "effects JS + CSS", sound: "sound", font: "Pixel Bop woff2", icons: "icons index.js" };

// The command line.
const USAGE = "usage: pnpm qa <name> [--fast] [--update-snapshots[=all|changed|missing]]";
const args = process.argv.slice(2).filter((a) => a !== "--");
const update = args.find((a) => /^--update-snapshots(=\w+)?$/.test(a));
const fast = args.includes("--fast");
const unknown = args.filter((a) => a.startsWith("-") && a !== "--fast" && a !== update);
const names = args.filter((a) => !a.startsWith("-"));
if (unknown.length || names.length !== 1) {
  if (unknown.length) console.error(`qa: unknown option ${unknown.join(", ")}`);
  console.error(USAGE);
  process.exit(2);
}
if (fast && update) {
  console.error("qa: --update-snapshots writes baselines in the visual run, which --fast skips. Drop one of them.");
  process.exit(2);
}

// What the repository has.
const PACKAGES = list("packages").filter((p) => exists(`packages/${p}/package.json`));
const frontMatter = (text) => {
  const block = /^---\n([\s\S]*?)\n---/.exec(text)?.[1] ?? "";
  return Object.fromEntries([...block.matchAll(/^([a-z][\w-]*):[ \t]*(.*)$/gm)].map((m) => [m[1], m[2].trim().replace(/^"(.*)"$/, "$1")]));
};
const DOCS = PACKAGES.flatMap((pkg) =>
  list(`packages/${pkg}/docs`).filter((f) => f.endsWith(".md")).map((f) => {
    const file = `packages/${pkg}/docs/${f}`;
    const meta = frontMatter(read(file));
    return { pkg, name: f.slice(0, -3), file, meta, tags: !meta.element || meta.element === "null" ? [] : meta.element.split(/,\s*/) };
  }),
);
/** Every element: its package, module and class. */
const ELEMENTS = new Map();
for (const pkg of PACKAGES) {
  if (!exists(`packages/${pkg}/custom-elements.json`)) continue;
  for (const mod of JSON.parse(read(`packages/${pkg}/custom-elements.json`)).modules ?? []) {
    for (const d of mod.declarations ?? []) if (d.tagName) ELEMENTS.set(d.tagName, { pkg, module: `packages/${pkg}/${mod.path}`, className: d.name });
  }
}
const UNIT = ["unit/node", "unit/browser"].flatMap((d) => list(`tests/${d}`).filter((f) => f.endsWith(".test.ts")).map((f) => `${d}/${f}`));
const RESPONSIVE = [.../RESPONSIVE[^=]*=\s*\[([^\]]*)\]/.exec(read("tests/page/manifest.ts"))?.[1].matchAll(/"([^"]+)"/g) ?? []].map((m) => m[1]);

/** The item: its docs pages, stylesheets, elements, modules, other scripts and examples. */
function find(input) {
  const name = basename(input).replace(/[<>]/g, "").replace(/\.(md|css|html|ts|js)$/, "").replace(/^blip-/, "");
  let docs = DOCS.filter((d) => d.name === name);
  if (!docs.length) docs = DOCS.filter((d) => d.tags.includes(`blip-${name}`));
  if (!docs.length) docs = DOCS.filter((d) => d.meta.css === `${name}.css`);
  const css = new Set();
  const tags = new Set(docs.flatMap((d) => d.tags));
  for (const d of docs) {
    if (!/^[\w-]+\.css$/.test(d.meta.css ?? "")) continue;
    for (const f of [`packages/${d.pkg}/src/${d.meta.css}`, `packages/${d.pkg}/${d.meta.css}`]) if (exists(f)) css.add(f);
  }
  const code = PACKAGES.filter((p) => !["react", "tokens"].includes(p));
  for (const p of code) if (exists(`packages/${p}/src/${name}.css`)) css.add(`packages/${p}/src/${name}.css`);
  if (ELEMENTS.has(`blip-${name}`)) tags.add(`blip-${name}`);
  const modules = [...new Set([...tags].filter((t) => ELEMENTS.has(t)).map((t) => ELEMENTS.get(t).module))];
  const scripts = code.map((p) => `packages/${p}/src/${name}.ts`).filter((f) => exists(f) && !modules.includes(f));
  const examples = [];
  for (const n of new Set([name, ...docs.map((d) => d.name)])) {
    for (const pkg of PACKAGES) if (exists(`packages/${pkg}/examples/${n}.html`)) examples.push({ pkg, name: n, file: `packages/${pkg}/examples/${n}.html` });
  }
  const found = docs.length || css.size || tags.size || scripts.length || examples.length;
  return found ? { name, docs, css: [...css], tags: [...tags], modules, scripts, examples } : null;
}

/** Names that look like the one asked for, for a "did you mean". */
function near(name) {
  const known = new Set([...DOCS.map((d) => d.name), ...[...ELEMENTS.keys()].map((t) => t.replace(/^blip-/, ""))]);
  const distance = (a, b) => {
    const row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let prev = row[0];
      row[0] = i;
      for (let j = 1; j <= b.length; j++) [prev, row[j]] = [row[j], Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))];
    }
    return row[b.length];
  };
  return [...known].filter((k) => distance(k, name) <= 2 || (name.length > 2 && (k.includes(name) || name.includes(k)))).sort();
}

const item = find(names[0]);
if (!item) {
  const name = basename(names[0]).replace(/^blip-/, "");
  const like = near(name);
  console.error(`qa: nothing is called "${names[0]}": no packages/*/docs/${name}.md, packages/*/examples/${name}.html, ` +
    `packages/*/src/${name}.css or <blip-${name}> element.`);
  console.error(like.length ? `  Did you mean ${like.join(", ")}?` : "  Use the name of a docs page or an element: pnpm qa tabs, pnpm qa world.");
  process.exit(2);
}
const { name } = item;

/** Runs a Node script, collecting what it prints. */
function run(script, argv, cwd = ROOT, env = {}) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(process.execPath, [script, ...argv], { cwd, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1", ...env } });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("error", (e) => resolve({ code: 1, out: String(e), ms: Date.now() - started }));
    child.on("close", (code) => resolve({ code: code ?? 1, out, ms: Date.now() - started }));
  });
}
const lines = (out) => out.split("\n").map((l) => l.trimEnd()).filter(Boolean);
const tail = (out, n = 60) => lines(out).slice(-n);
const vitestSummary = (out) =>
  /^\s*Tests\s+(.+?)\s*$/m.exec(out)?.[1].replace(/\s*\|\s*\d+ skipped|\s*\(\d+\)$/g, "") ??
  (lines(out).find((l) => /error|no test files/i.test(l)) ?? lines(out).at(-1) ?? "").trim().slice(0, 100);
const playwrightSummary = (out) => lines(out).filter((l) => /^\s+\d+ (passed|failed|flaky|skipped|did not run|interrupted)/.test(l)).map((l) => l.trim()).join(", ");

// The checks. Each returns { status: "ok" | "FAIL" | "skip", summary, details?: string[] }.
const notes = [];
const unitFiles = (() => {
  const words = new Set([name, ...item.docs.map((d) => d.name)]);
  const patterns = [
    ...[...words].map((w) => `blip-${esc(w)}(?![\\w-])`),
    ...item.tags.map((t) => `${esc(t)}(?![\\w-])`),
    ...item.tags.filter((t) => ELEMENTS.has(t)).map((t) => `\\b${ELEMENTS.get(t).className}\\b`),
    ...[...item.modules, ...item.scripts].map((m) => esc(m.replace(/^packages\//, "").replace(/\.ts$/, "."))),
    ...item.css.map((f) => `["'\`/]${esc(basename(f))}["'\`]`),
  ];
  const mention = new RegExp(patterns.join("|"));
  const named = new RegExp(`(?:^|-)(?:${[...words].map(esc).join("|")})(?:-|$)`);
  return UNIT.filter((f) => f !== "unit/node/docs-components.test.ts" && (named.test(basename(f, ".test.ts")) || mention.test(read(`tests/${f}`))));
})();

const checks = {
  async files() {
    const missing = [];
    const docsFor = (pkg) => `packages/${pkg}/docs/${name}.md`;
    // Where its docs page goes: beside its stylesheet, or in components for a core element.
    const home = (item.css[0] ?? item.modules[0])?.split("/")[1].replace(/^elements$/, "components") ?? item.examples[0]?.pkg ?? "components";
    const pageOnly = !item.docs.length && !item.css.length && !item.tags.length && !item.scripts.length;
    if (pageOnly) notes.push(`${item.examples.map((e) => e.file).join(", ")}: an example made of other parts, with no docs page of its own.`);
    else if (!item.docs.length) {
      missing.push(`${docsFor(home)} is missing. Write it: front matter (name, package, css, element, react, status), then usage, ` +
        `anatomy, variants, states, accessibility, content, do and don't, API (AUTHORING.md, "Files for a component"; ` +
        `packages/components/docs/button.md is the reference).`);
    }
    for (const d of item.docs) {
      if (item.examples.some((e) => e.name === d.name)) continue;
      missing.push(`packages/${d.pkg}/examples/${d.name}.html is missing. Write it: an HTML fragment with every variant and state ` +
        `and real content (data-blip-state="hover focus active" forces a state). It is also ${d.name}'s visual test and accessibility scan.`);
    }
    for (const f of item.css) {
      if (!/^\s*\/\*/.test(read(f))) missing.push(`${f} has no header comment. Start it as button.css does: what it is, its markup, its attributes and states (CONTRACT.md: the header and the docs page are its API).`);
    }
    let baselines = 0;
    for (const e of item.examples) {
      const shots = SCHEMES.flatMap((s) => [`${e.name}-${s}-1280.png`, ...(RESPONSIVE.includes(e.name) ? [`${e.name}-${s}-390.png`] : [])]);
      const dir = `tests/visual/__screenshots__/${process.platform}/${e.pkg}`;
      const absent = shots.filter((s) => !exists(`${dir}/${s}`));
      baselines += shots.length - absent.length;
      if (absent.length && !update) {
        missing.push(`${dir} has no ${absent.join(", ")}. Make them with pnpm qa ${name} --update-snapshots, then look at every picture.`);
      }
    }
    const contract = read("CONTRACT.md");
    for (const t of item.tags) {
      const el = ELEMENTS.get(t);
      if (!el) {
        missing.push(`<${t}> is in no custom-elements.json. Give its class a JSDoc comment and register it with BlipElement.define("${t}", …), then run pnpm cem.`);
        continue;
      }
      if (!contract.includes(`| \`<${t}>\` |`)) missing.push(`CONTRACT.md has no row for <${t}>. Run pnpm cem, then node scripts/contract-elements.mjs.`);
      const tested = unitFiles.some((f) => new RegExp(`${esc(t)}(?![\\w-])|\\b${el.className}\\b|${esc(el.module.replace(/^packages\//, "").replace(/\.ts$/, "."))}`).test(read(`tests/${f}`)));
      if (!tested) {
        missing.push(`No unit test mentions <${t}> (${el.className}, ${el.module}). Add one in tests/unit/browser/: ` +
          `${el.pkg === "elements" ? "elements-api.test.ts" : `${el.pkg}-boolean.test.ts`} shows the pattern (mount the markup, act, check the DOM and events).`);
      }
    }
    // The Playwright runs and the budgets read dist: say when it is older than the sources.
    for (const pkg of new Set([...item.modules, ...item.css, ...item.scripts].map((f) => f.split("/")[1]))) {
      const newest = (rel, ext) => {
        if (!exists(rel)) return 0;
        const walk = (d) => readdirSync(at(d)).flatMap((f) => (statSync(at(`${d}/${f}`)).isDirectory() ? walk(`${d}/${f}`) : f.endsWith(ext) ? [statSync(at(`${d}/${f}`)).mtimeMs] : []));
        return Math.max(0, ...walk(rel));
      };
      const src = Math.max(newest(`packages/${pkg}/src`, ".ts"), newest(`packages/${pkg}/src`, ".css"));
      const dist = Math.max(newest(`packages/${pkg}/dist`, ".js"), newest(`packages/${pkg}/dist`, ".css"));
      if (exists(`packages/${pkg}/dist`) ? src > dist : src > 0) {
        notes.push(`packages/${pkg}/dist is older than its sources: the Playwright runs load its elements and the budgets measure it. Build it: pnpm --filter @jaatster/blip-${pkg} build`);
      }
    }
    const found = [
      item.docs.length && `${item.docs.length} docs page${item.docs.length > 1 ? "s" : ""}`,
      item.examples.length && `${item.examples.length} example${item.examples.length > 1 ? "s" : ""}`,
      baselines && `${baselines} baselines`,
      item.tags.length && `${item.tags.length} element${item.tags.length > 1 ? "s" : ""} in CONTRACT.md`,
    ].filter(Boolean).join(", ");
    return missing.length ? { status: "FAIL", summary: `${missing.length} missing`, details: missing } : { status: "ok", summary: found };
  },

  async lint() {
    const files = item.css.filter((f) => /^packages\/[^/]+\/src\//.test(f));
    if (!files.length) return { status: "skip", summary: "no stylesheet" };
    const props = await run("packages/stylelint-config/scripts/public-properties.mjs", []);
    if (props.code) return { status: "FAIL", summary: "public-properties.mjs failed", details: tail(props.out), ms: props.ms };
    const r = await run(BIN.stylelint, files);
    return { status: r.code ? "FAIL" : "ok", summary: files.map((f) => basename(f)).join(", "), details: r.code ? tail(r.out) : [], ms: props.ms + r.ms };
  },

  async docs() {
    if (!item.docs.length) return { status: "skip", summary: "no docs page" };
    const pattern = item.docs.map((d) => esc(`${d.pkg}/docs/${d.name}.md`)).join("|");
    const r = await run(BIN.vitest, ["run", "unit/node/docs-components.test.ts", "-t", pattern], at("tests"));
    return { status: r.code ? "FAIL" : "ok", summary: vitestSummary(r.out), details: r.code ? tail(r.out) : [], ms: r.ms };
  },

  async cem() {
    const pkgs = [...new Set(item.tags.filter((t) => ELEMENTS.has(t)).map((t) => ELEMENTS.get(t).pkg))];
    if (!pkgs.length) return { status: "skip", summary: "no element" };
    const r = await run("scripts/cem.mjs", ["--check", ...pkgs]);
    return { status: r.code ? "FAIL" : "ok", summary: pkgs.map((p) => `@jaatster/blip-${p}`).join(", "), details: r.code ? tail(r.out) : [], ms: r.ms };
  },

  async budgets() {
    const rows = item.modules.map((m) => `element ${m.split("/")[1]}/${basename(m, ".ts")}`);
    for (const f of [...item.css, ...item.modules, ...item.scripts]) if (PACKAGE_BUDGET[f.split("/")[1]]) rows.push(PACKAGE_BUDGET[f.split("/")[1]]);
    const wanted = [...new Set(rows)];
    if (!wanted.length) return { status: "skip", summary: "no budget line" };
    const r = await run("scripts/budgets.mjs", []);
    const got = wanted.map((w) => {
      const l = r.out.split("\n").find((x) => x.slice(0, 34).trim() === w);
      const status = l ? /\s(ok \d+%|OVER by \d+ B|MISSING|exempt: .*)$/.exec(l)?.[1] ?? "?" : "no such line";
      return { w, status, ok: /^(ok|exempt)/.test(status) };
    });
    const bad = got.filter((g) => !g.ok);
    const details = bad.map((g) => `${g.w}: ${g.status}`);
    if (bad.some((g) => g.status === "MISSING")) details.push("Not built yet: pnpm build (or pnpm --filter @jaatster/blip-<package> build).");
    if (bad.some((g) => g.status.startsWith("OVER"))) details.push("Make it smaller, or change the budget in scripts/budgets.mjs with a reason.");
    return { status: bad.length ? "FAIL" : "ok", summary: got.map((g) => `${g.w} ${g.status}`).join(", "), details, ms: r.ms };
  },

  async unit() {
    if (!unitFiles.length) return { status: "skip", summary: "no unit test mentions it" };
    const r = await run(BIN.vitest, ["run", ...unitFiles], at("tests"));
    const summary = `${vitestSummary(r.out)} in ${unitFiles.map((f) => basename(f, ".test.ts")).join(", ")}`;
    return { status: r.code ? "FAIL" : "ok", summary, details: r.code ? tail(r.out) : [], ms: r.ms };
  },

  async visual() {
    return playwright("visual", update ? [update] : []);
  },

  async a11y() {
    return playwright("a11y", []);
  },
};

let release = null;
/** One Playwright project, filtered to the item's examples (test titles start "<package>/<example> <scheme>"). */
async function playwright(project, extra) {
  if (fast) return { status: "skip", summary: "--fast" };
  if (!item.examples.length) return { status: "skip", summary: "no example" };
  release ??= await heavy(`pnpm qa ${name}`);
  const grep = `(^| )(${item.examples.map((e) => esc(`${e.pkg}/${e.name}`)).join("|")}) (${SCHEMES.join("|")})( |,|$)`;
  const r = await run(BIN.playwright, ["test", `--project=${project}`, "--grep", grep, ...extra], at("tests"));
  return { status: r.code ? "FAIL" : "ok", summary: playwrightSummary(r.out) || lines(r.out).at(-1) || "", details: r.code ? tail(r.out, 80) : [], ms: r.ms };
}

// Run them, one after another.
const where = [...item.docs.map((d) => d.file), ...item.css, ...item.tags.map((t) => `<${t}>`), ...item.examples.map((e) => e.file)];
console.log(`qa ${name}: ${where.join(", ")}\n`);
const started = Date.now();
const results = [];
for (const [id, check] of Object.entries(checks)) {
  let result;
  try {
    result = await check();
  } catch (e) {
    result = { status: "FAIL", summary: "crashed", details: String(e?.stack ?? e).split("\n") };
  }
  results.push({ id, ...result });
  const time = result.ms ? ` (${(result.ms / 1000).toFixed(1)}s)` : "";
  console.log(`${id} ${result.status === "FAIL" ? "FAILED" : result.status === "skip" ? "skipped" : "ok"}${time}`);
  if (result.status === "FAIL") console.log(`${result.details.map((l) => `  ${l}`).join("\n")}\n`);
}
release?.();

// The table.
const W = { id: 8, status: 6, time: 7 };
const sec = (ms) => (ms ? `${(ms / 1000).toFixed(1)}s` : "");
console.log(`\n${"Check".padEnd(W.id)} ${"Result".padEnd(W.status)} ${"Time".padStart(W.time)}  What`);
console.log("-".repeat(W.id + W.status + W.time + 50));
for (const r of results) console.log(`${r.id.padEnd(W.id)} ${r.status.padEnd(W.status)} ${sec(r.ms).padStart(W.time)}  ${r.summary}`);
for (const n of notes) console.log(`\nNote: ${n}`);
const failed = results.filter((r) => r.status === "FAIL");
const ran = results.filter((r) => r.status !== "skip").length;
const total = `${((Date.now() - started) / 1000).toFixed(0)}s`;
console.log(failed.length ? `\nqa ${name}: ${failed.length} of ${ran} checks failed (${failed.map((r) => r.id).join(", ")}), in ${total}.` : `\nqa ${name}: all ${ran} checks passed in ${total}.`);
process.exit(failed.length ? 1 : 0);
