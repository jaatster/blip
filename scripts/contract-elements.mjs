#!/usr/bin/env node
/**
 * CONTRACT.md's table of elements, written from the Custom Elements Manifests (which `pnpm cem` writes from the
 * elements' JSDoc), so the contract names the attributes, properties, methods and events the elements have; and
 * its line on what @blip/elements exports, from the source.
 *
 *   node scripts/contract-elements.mjs           rewrite the table in CONTRACT.md
 *   node scripts/contract-elements.mjs --check   fail if the table is out of date
 *
 * tests/unit/node/docs-contract.test.ts fails when the table and the manifests disagree.
 */
import { existsSync, readFileSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
/** The packages with elements, in the order the table lists them. */
const PACKAGES = ["elements", "game", "effects", "icons"];
const START = "<!-- elements: written by scripts/contract-elements.mjs from the Custom Elements Manifests. Run it after pnpm cem. -->";
const END = "<!-- /elements -->";

const code = (s) => `\`${s}\``;
const clean = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

/** One row per element: tag, module, attributes, the properties and methods without an attribute, events. */
export function rows(root = ROOT) {
  const out = [];
  for (const pkg of PACKAGES) {
    const file = join(root, "packages", pkg, "custom-elements.json");
    if (!existsSync(file)) continue;
    const cem = JSON.parse(readFileSync(file, "utf8"));
    const found = [];
    for (const mod of cem.modules ?? []) {
      for (const d of mod.declarations ?? []) {
        if (!d.customElement || !d.tagName) continue;
        const module = `@blip/${pkg}/${mod.path.replace(/^src\//, "").replace(/\.(ts|js)$/, "")}`;
        const attributes = (d.attributes ?? []).map((a) => code(a.name));
        const pub = (m) => m.privacy !== "private" && m.privacy !== "protected" && !m.static && !m.name.startsWith("#") && !m.name.startsWith("_");
        const members = (d.members ?? []).filter(pub);
        const fields = members.filter((m) => m.kind === "field" && !m.attribute).map((m) => m.name);
        const readonly = new Set(members.filter((m) => m.kind === "field" && !m.attribute && m.readonly).map((m) => m.name));
        const methods = members.filter((m) => m.kind === "method").map((m) => `${m.name}()`);
        // Read-only properties together, as "a, b (read-only)"; then the writable ones; then the methods.
        const ro = fields.filter((f) => readonly.has(f));
        const rw = fields.filter((f) => !readonly.has(f));
        const other = [...rw.map(code), ...(ro.length ? [`${ro.map(code).join(", ")} (read-only)`] : []), ...methods.map(code)];
        const events = (d.events ?? []).filter((e) => e.name).map((e) => code(e.name) + (/\bcancelable\b/i.test(clean(e.description || e.summary)) ? " (cancelable)" : ""));
        found.push([code(`<${d.tagName}>`), code(module), attributes.join(", "), other.join(", "), events.join(", ")]);
      }
    }
    out.push(...found.sort((a, b) => a[0].localeCompare(b[0])));
  }
  return out;
}

export function table(root = ROOT) {
  return [
    "| Element | Module | Attributes | Other properties and methods | Events |",
    "|---|---|---|---|---|",
    ...rows(root).map((r) => `| ${r.join(" | ")} |`.replace(/ {2,}/g, " ")),
  ].join("\n");
}

/**
 * The row of the JavaScript APIs table for @blip/elements: what its public modules export besides the element
 * classes, read from their source (a module starting with _ is private; what a public module re-exports counts).
 */
export function exportsRow(root = ROOT) {
  const dir = join(root, "packages", "elements", "src");
  const files = readdirSync(dir).filter((f) => f.endsWith(".ts") && !f.startsWith("_") && f !== "index.ts" && !f.endsWith(".d.ts") && !f.endsWith(".test.ts")).sort();
  const fns = new Set(), types = new Set();
  for (const f of files) {
    const src = readFileSync(join(dir, f), "utf8");
    for (const m of src.matchAll(/^export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm)) fns.add(m[1]);
    for (const m of src.matchAll(/^export\s+(?:interface|type)\s+([A-Za-z_$][\w$]*)/gm)) types.add(m[1]);
    for (const m of src.matchAll(/^export\s+type\s*\{([^}]*)\}/gm)) for (const n of m[1].split(",")) if (n.trim()) types.add(n.trim().split(/\s+as\s+/).pop());
  }
  const list = (names) => [...names].sort().map(code).join(", ");
  return `| \`@blip/elements\` | One module per element (\`@blip/elements/<name>\`), each defining its tag; the index defines them all. The element classes, ${[...fns].sort().map((f) => code(`${f}()`)).join(", ")}, and the types ${list(types)}. |`;
}
const ROW = /^\| `@blip\/elements` \|.*\|$/m;

export function contractTable(contract) {
  const a = contract.indexOf(START), b = contract.indexOf(END);
  if (a < 0 || b < a) throw new Error(`contract-elements: CONTRACT.md has no table markers. Put the table between\n  ${START}\n  ${END}`);
  return contract.slice(a + START.length, b).trim();
}

export function compare(root = ROOT) {
  const contract = readFileSync(join(root, "CONTRACT.md"), "utf8");
  const want = table(root);
  const row = exportsRow(root);
  return { contract, want, row, upToDate: contractTable(contract) === want && contract.match(ROW)?.[0] === row };
}

// Run as a script (not when bundled into another tool).
const self = fileURLToPath(import.meta.url);
if (process.argv[1] && /[\\/]scripts[\\/]contract-elements\.mjs$/.test(self) && realpathSync(process.argv[1]) === realpathSync(self)) {
  const { contract, want, row, upToDate } = compare();
  if (process.argv.includes("--check")) {
    if (!upToDate) {
      console.error("contract-elements: CONTRACT.md's elements (their table, and what @blip/elements exports) are out of date. Run: node scripts/contract-elements.mjs");
      process.exit(1);
    }
    console.log(`contract-elements: CONTRACT.md lists all ${rows().length} elements as their manifests describe them.`);
  } else {
    const a = contract.indexOf(START), b = contract.indexOf(END);
    if (a < 0 || b < a) throw new Error("contract-elements: CONTRACT.md has no table markers.");
    if (!ROW.test(contract)) throw new Error("contract-elements: CONTRACT.md has no row for @blip/elements in its JavaScript APIs table.");
    const next = (contract.slice(0, a + START.length) + "\n" + want + "\n" + contract.slice(b)).replace(ROW, row);
    if (next !== contract) writeFileSync(join(ROOT, "CONTRACT.md"), next);
    console.log(`contract-elements: ${rows().length} elements${next !== contract ? ", CONTRACT.md updated" : ", CONTRACT.md already up to date"}.`);
  }
}
