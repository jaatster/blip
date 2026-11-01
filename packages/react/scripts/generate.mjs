#!/usr/bin/env node
/**
 * Generates the React wrappers for Blip's custom elements from the Custom Elements Manifests.
 *
 *   node scripts/generate.mjs        (part of this package's build)
 *
 * Reads packages/{elements,game,effects}/custom-elements.json (written by `pnpm cem` at the repository root) and
 * writes src/generated/{elements,game,effects}.ts: for each element, a props interface (attributes as typed props,
 * writable properties, on<Event> handlers typed by the event's detail, with the manifest's descriptions) and a
 * component made by createComponent() (src/internal/element.ts). Element and detail types are imported, type only,
 * from the element packages. Change an element's JSDoc, run `pnpm cem`, and build: the wrappers follow.
 *
 * blip-icon is not wrapped: <Icon> (src/icons.tsx) draws the SVG itself, so it renders on the server too.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG = join(HERE, "..");
const PACKAGES = join(PKG, "..");
const REPO = "https://github.com/jaatster/blip/blob/main/packages";

/**
 * Per element: another component name, no children (it draws its own), its text as children, or host classes the
 * docs require that the element does not add itself.
 */
const OVERRIDES = {
  "blip-command": { name: "CommandPalette" },
  "blip-number": { name: "NumberStepper" },
  "blip-segmented": { classes: ["blip-box", "blip-segmented"] },
  "blip-rating": { empty: true },
  "blip-sprite": { empty: true },
  "blip-hearts": { empty: true },
  "blip-world": { empty: true },
  "blip-drop-text": { textChildren: true },
  "blip-typewriter": { textChildren: true },
  "blip-icon": { skip: true },
};
/**
 * Attributes that are a switch with one value: a boolean prop that writes that value when true. `data-width="full"`
 * is `fullWidth`, as on Button and ButtonGroup: one name for one idea.
 */
const SWITCHES = { "data-width": ["fullWidth", "full"] };
/** Names that are DOM globals in a detail type, never imported. */
const GLOBALS = new Set(["CustomEvent", "Event", "HTMLElement", "HTMLButtonElement", "HTMLTableCellElement", "HTMLTableRowElement", "HTMLInputElement", "File", "FileList", "Element", "Array", "Record", "Promise", "Partial", "Readonly"]);

/**
 * The classes an element puts on itself when it connects (`static box = true` adds blip-box, `static classes`), read
 * from its source. The wrapper renders them from the start, so the markup is styled before the element upgrades
 * and in server HTML, and React keeps them when className changes.
 */
function hostClasses(source, className) {
  const start = source.search(new RegExp(`class ${className}\\b`));
  if (start < 0) return [];
  let depth = 0;
  let end = source.indexOf("{", start);
  for (let i = end; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}" && --depth === 0) {
      end = i;
      break;
    }
  }
  const body = source.slice(start, end);
  const classes = /static (?:override )?box = true/.test(body) ? ["blip-box"] : [];
  const list = /static (?:override )?classes(?::[^=]+)? = \[([^\]]*)\]/.exec(body)?.[1] ?? "";
  for (const m of list.matchAll(/"([^"]+)"/g)) classes.push(m[1]);
  return classes;
}

const pascal = (s) => s.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
const camel = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const FIELD_FOR = { for: "htmlFor", readonly: "readOnly" };

/** The docs page for each element tag, from the docs' front matter. */
function docsPages() {
  const pages = new Map();
  for (const pkg of readdirSync(PACKAGES)) {
    const dir = join(PACKAGES, pkg, "docs");
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".md"))) {
      const fm = /^---\n([\s\S]*?)\n---/.exec(readFileSync(join(dir, f), "utf8"))?.[1] ?? "";
      const el = /^element:\s*(.+)$/m.exec(fm)?.[1]?.trim();
      if (!el || el === "null") continue;
      for (const tag of el.split(",").map((t) => t.trim())) pages.set(tag, `${REPO}/${pkg}/docs/${f}`);
    }
  }
  return pages;
}

/** A JSDoc block, indented. */
function doc(lines, indent = "") {
  const text = lines.filter((l) => l !== undefined && l !== null).flatMap((l) => String(l).split("\n"));
  while (text.length && !text.at(-1).trim()) text.pop();
  if (!text.length) return "";
  if (text.length === 1) return `${indent}/** ${text[0].replace(/\*\//g, "*\\/")} */\n`;
  return `${indent}/**\n${text.map((l) => `${indent} *${l ? ` ${l.replace(/\*\//g, "*\\/")}` : ""}`).join("\n")}\n${indent} */\n`;
}

function generate(pkg, pages) {
  const file = join(PACKAGES, pkg, "custom-elements.json");
  if (!existsSync(file)) {
    console.error(`generate: ${file} is missing.\n  Fix: run pnpm cem at the repository root.`);
    process.exit(1);
  }
  const manifest = JSON.parse(readFileSync(file, "utf8"));
  const dts = (mod) => {
    const p = join(PACKAGES, pkg, "dist", mod.replace(/^src\//, "").replace(/\.ts$/, ".d.ts"));
    return existsSync(p) ? readFileSync(p, "utf8") : "";
  };

  const imports = new Map(); // module specifier -> Set of names
  // A name is imported once, from the first module that gives it (blip-menu and blip-command share ActionDetail).
  const need = (spec, name) => {
    if ([...imports].some(([other, names]) => other !== spec && names.has(name))) return;
    (imports.get(spec) ?? imports.set(spec, new Set()).get(spec)).add(name);
  };
  const blocks = [];
  const names = [];
  let helpers = new Set(["createComponent", "type ElementProps"]);

  for (const mod of manifest.modules) {
    for (const d of mod.declarations ?? []) {
      if (!d.customElement || !d.tagName) continue;
      const o = OVERRIDES[d.tagName] ?? {};
      if (o.skip) continue;
      const name = o.name ?? pascal(d.tagName.replace(/^blip-/, ""));
      const spec = `@blip/${pkg}/${mod.path.replace(/^src\//, "").replace(/\.ts$/, "")}`;
      need(spec, d.name);
      // A type is imported from the element's own module, else from another public module of the package that
      // exports it (an inherited event's detail, re-exported next to a sibling element), else a private one.
      const exports = (path, id) => new RegExp(`export (?:declare )?(?:interface|type|class|const|function) ${id}\\b|export (?:type )?\\{[^}]*\\b${id}\\b`).test(dts(path));
      const candidates = [mod.path, ...manifest.modules.map((m) => m.path).filter((p) => p !== mod.path).sort((a, b) => Number(/\/_/.test(a)) - Number(/\/_/.test(b)))];
      const typeOf = (text) => {
        for (const id of text.match(/\b[A-Z][A-Za-z0-9]*\b/g) ?? []) {
          if (GLOBALS.has(id)) continue;
          const from = candidates.find((p) => exports(p, id));
          if (!from) throw new Error(`${d.tagName}: type "${id}" in "${text}" is not exported by @blip/${pkg}. Export it, or write the type out in the JSDoc.`);
          need(`@blip/${pkg}/${from.replace(/^src\//, "").replace(/\.ts$/, "")}`, id);
        }
        return text;
      };

      const members = d.members ?? [];
      const props = [];
      const attrSpec = {};
      for (const a of d.attributes ?? []) {
        if (a.name === "role" || a.name.startsWith("aria-") || a.name.startsWith("data-blip-")) continue;
        const toggle = SWITCHES[a.name];
        const prop = toggle?.[0] ?? (a.name.startsWith("data-") ? camel(a.name.slice(5)) : (FIELD_FOR[a.name] ?? camel(a.name)));
        const field = a.fieldName ? members.find((m) => m.kind === "field" && m.name === a.fieldName) : undefined;
        const writable = field && !field.readonly ? field.name : undefined;
        const shadowed = members.some((m) => m.name === a.name);
        const type = toggle ? "boolean" : typeOf((a.type?.text ?? field?.type?.text ?? "string").replace(/\s*\|\s*/g, " | "));
        const written = toggle ? `Attribute \`${a.name}="${toggle[1]}"\`.` : `Attribute \`${a.name}\`.`;
        props.push({ prop, type, doc: [a.description, written, a.default !== undefined ? `@default ${a.default}` : undefined] });
        attrSpec[prop] = [a.name, writable, shadowed, toggle?.[1]];
      }
      const propSpec = [];
      for (const m of members) {
        if (m.kind !== "field" || m.readonly || m.attribute || m.static) continue;
        if (Object.values(attrSpec).some(([, w]) => w === m.name)) continue;
        props.push({ prop: m.name, type: typeOf(m.type?.text ?? "unknown"), doc: [m.description, `Property \`${m.name}\`.`] });
        propSpec.push(m.name);
      }
      const eventSpec = {};
      for (const e of d.events ?? []) {
        const prop = `on${pascal(e.name.replace(/^blip-/, ""))}`;
        props.push({ prop, type: `(event: ${typeOf(e.type?.text ?? "CustomEvent")}) => void`, doc: [e.description, `Event \`${e.name}\`.`] });
        eventSpec[prop] = e.name;
      }
      const own = props.map((p) => p.prop);
      const extra = o.empty ? " & NoChildren" : o.textChildren ? " & TextChildren" : "";
      if (o.empty) helpers.add("type NoChildren");
      if (o.textChildren) helpers.add("type TextChildren");
      const omit = [...own, ...(o.empty || o.textChildren ? ["children"] : [])];
      const classes = o.classes ?? hostClasses(readFileSync(join(PACKAGES, pkg, mod.path), "utf8"), d.name);
      const page = pages.get(d.tagName);
      const summary = d.summary ?? d.description?.split("\n")[0] ?? name;

      let out = doc([`Props for {@link ${name}}: \`<${d.tagName}>\`.`]);
      out += `export type ${name}Props = ElementProps<${d.name}${omit.length ? `, ${omit.map((k) => JSON.stringify(k)).join(" | ")}` : ""}>${extra} & {\n`;
      for (const p of props) out += doc(p.doc, "  ") + `  ${p.prop}?: ${p.type};\n`;
      out += "};\n\n";
      out += doc([
        summary,
        "",
        d.summary && d.description ? d.description : undefined,
        d.summary && d.description ? "" : undefined,
        `Renders \`<${d.tagName}${classes.length ? ` class="${classes.join(" ")}"` : ""}>\` (${spec}, loaded on the client when it first`,
        "mounts). The ref is the element.",
        page ? `@see ${page}` : undefined,
      ]);
      const specLines = [`  tag: ${JSON.stringify(d.tagName)},`, `  name: ${JSON.stringify(name)},`, `  load: () => import(${JSON.stringify(spec)}),`];
      if (classes.length) specLines.push(`  className: ${JSON.stringify(classes.join(" "))},`);
      if (Object.keys(attrSpec).length) {
        specLines.push(`  attributes: {`);
        for (const [prop, [attr, writable, shadowed, on]] of Object.entries(attrSpec)) {
          const tuple = [JSON.stringify(attr)];
          if (writable || shadowed || on) tuple.push(writable ? JSON.stringify(writable) : "undefined");
          if (shadowed || on) tuple.push(shadowed ? "true" : "false");
          if (on) tuple.push(JSON.stringify(on));
          specLines.push(`    ${/^[a-z][a-zA-Z0-9]*$/.test(prop) ? prop : JSON.stringify(prop)}: [${tuple.join(", ")}],`);
        }
        specLines.push(`  },`);
      }
      if (propSpec.length) specLines.push(`  properties: [${propSpec.map((p) => JSON.stringify(p)).join(", ")}],`);
      if (Object.keys(eventSpec).length) specLines.push(`  events: { ${Object.entries(eventSpec).map(([p, e]) => `${p}: ${JSON.stringify(e)}`).join(", ")} },`);
      if (o.empty) specLines.push(`  empty: true,`);
      if (o.textChildren) specLines.push(`  textChildren: true,`);
      // Pure, so a bundler drops the wrappers an app does not use.
      out += `export const ${name} = /*#__PURE__*/ createComponent<${d.name}, ${name}Props>({\n${specLines.join("\n")}\n});\n`;
      blocks.push(out);
      names.push([name, d.tagName]);
    }
  }

  const head = [
    `// Generated by packages/react/scripts/generate.mjs from @blip/${pkg}/custom-elements.json. Do not edit:`,
    "// change the element's JSDoc, run `pnpm cem` at the repository root, then build this package.",
    '"use client";',
    ...[...imports].sort(([a], [b]) => a.localeCompare(b)).map(([spec, set]) => `import type { ${[...set].sort().join(", ")} } from ${JSON.stringify(spec)};`),
    `import { ${[...helpers].sort((a, b) => a.replace("type ", "").localeCompare(b.replace("type ", ""))).join(", ")} } from "../internal/element.js";`,
    "",
  ].join("\n");
  mkdirSync(join(PKG, "src/generated"), { recursive: true });
  writeFileSync(join(PKG, "src/generated", `${pkg}.ts`), `${head}\n${blocks.join("\n")}`);
  return names;
}

const pages = docsPages();
for (const pkg of ["elements", "game", "effects"]) {
  const names = generate(pkg, pages);
  console.log(`src/generated/${pkg}.ts: ${names.map(([n, t]) => `${n} <${t}>`).join(", ")}`);
}
