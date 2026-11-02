#!/usr/bin/env node
/**
 * Blip's shadcn/ui registry, written from the sources so it never drifts from them:
 *
 *   registry.json       the index: every item, without its files' content (as the shadcn directory asks)
 *   <name>.json         one item each, its files' content inlined
 *
 *   node scripts/registry.mjs                          write apps/docs/public/r (prepare.mjs runs it for the site)
 *   node scripts/registry.mjs --out <dir>              write somewhere else
 *   node scripts/registry.mjs --check                  build and validate, write nothing
 *   node scripts/registry.mjs --list                   one line per item: type, files, dependencies
 *
 * Where each part comes from:
 *
 *   setup      the CSS packages at their current versions, imported into the app's Tailwind CSS file inside
 *              layer(components): under Tailwind's utilities and over its reset, the order @jaatster/blip-core/layers.css
 *              gives a page that can import it first (the shadcn CLI adds imports after `@import "tailwindcss"`)
 *   theme      shadcn's CSS variables mapped onto Blip's scheme roles by reference (THEME below), so schemes and
 *              palettes keep working; every role named must exist in the tokens' manifest or core's CSS
 *   utils      the helpers the components import (packages/react/src/internal/*), as lib files
 *   <page>     one item per component page in ITEMS: title, description and also-known-as names from the docs page's
 *              front matter, the file from packages/react/src/components/<page>.tsx, its imports rewritten for the
 *              app (internal helpers to @/lib/blip/*, other components to @/components/blip/*, the generated
 *              element wrappers to @jaatster/blip-react), and its dependencies read from those imports
 *
 * Components install to components/blip/<page>.tsx, beside shadcn's own components/ui/, not over them: their props
 * are Blip's, and `shadcn init` has already written a ui/button.tsx. Items depend on each other by namespace
 * (@blip/utils), so the files work from any host once components.json maps @blip to it.
 *
 * Plain Node, no dependencies. The two JSON schemas in scripts/shadcn/ are ui.shadcn.com/schema/registry.json and
 * registry-item.json as of November 2026 (refresh with curl); validate() checks every item against them before
 * anything is written. tests/unit/node/registry.test.ts runs this and checks the result.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
/** Where the site serves the registry, and the namespace items name each other by. */
export const HOMEPAGE = "https://jaatster.com/blip";
export const NAMESPACE = "@blip";
export const OUT = "apps/docs/public/r";

/** The component pages that have an item. Each needs packages/react/src/components/<page>.tsx; add a page here to ship it. */
export const ITEMS = ["button", "card", "badge", "tag", "input", "field", "checkbox", "switch", "alert", "dialog", "tabs"];

/** Where installed files go, as shadcn target placeholders: through the app's components.json aliases. */
const COMPONENTS = "@components/blip";
const LIB = "@lib/blip";
/** How installed files import each other: the CLI rewrites these to the app's aliases. */
const IMPORT_COMPONENTS = "@/components/blip";
const IMPORT_LIB = "@/lib/blip";

/** The CSS the setup item imports, in order. Each file's package becomes a dependency. */
const CSS = ["@jaatster/blip-font/font.css", "@jaatster/blip-tokens/tokens.css", "@jaatster/blip-tokens/palettes.css", "@jaatster/blip-core/core.css", "@jaatster/blip-components/components.css"];
/** The layer Blip goes in, inside the app's Tailwind CSS: over `base` (preflight), under `utilities`. */
const LAYER = "components";

/**
 * shadcn's variables (ui.shadcn.com/docs/theming) and the Blip scheme role each takes. By reference, so they follow
 * data-blip-scheme and data-blip-palette. Only roles whose pairs the tokens' contrast check covers.
 */
export const THEME = {
  background: "bg",
  foreground: "text",
  card: "surface",
  "card-foreground": "text",
  popover: "surface-raised",
  "popover-foreground": "text",
  primary: "accent",
  "primary-foreground": "accent-on",
  secondary: "surface-panel",
  "secondary-foreground": "text",
  muted: "surface-sunken",
  "muted-foreground": "text-muted",
  // shadcn's accent is a hover surface, not a brand colour: the selection pair.
  accent: "selection-bg",
  "accent-foreground": "selection-text",
  // Mostly text and tints in shadcn's styles today, so the role that is safe as text.
  destructive: "danger-text",
  border: "line",
  input: "line",
  ring: "focus",
  "chart-1": "candy-blue",
  "chart-2": "candy-green",
  "chart-3": "candy-orange",
  "chart-4": "candy-purple",
  "chart-5": "candy-pink",
  sidebar: "surface",
  "sidebar-foreground": "text",
  "sidebar-primary": "accent",
  "sidebar-primary-foreground": "accent-on",
  "sidebar-accent": "selection-bg",
  "sidebar-accent-foreground": "selection-text",
  "sidebar-border": "line",
  "sidebar-ring": "focus",
};
/** Tailwind theme variables the theme sets: the face, a one-pixel ink drop for every shadow, stepped easing. */
const DROP = "var(--blip-pixel) var(--blip-pixel) 0 0 var(--blip-drop)";
export const TAILWIND = {
  "font-sans": "var(--blip-font-ui)",
  "font-heading": "var(--blip-font-ui)",
  "font-mono": "var(--blip-font-mono)",
  ...Object.fromEntries(["2xs", "xs", "sm", "", "md", "lg", "xl", "2xl"].map((s) => [s ? `shadow-${s}` : "shadow", DROP])),
  "ease-in": "var(--blip-ease-4)",
  "ease-out": "var(--blip-ease-4)",
  "ease-in-out": "var(--blip-ease-4)",
  "default-transition-timing-function": "var(--blip-ease-4)",
};

// ------------------------------------------------------------------ reading the repository

const read = (root, rel) => readFileSync(join(root, rel), "utf8");
const json = (root, rel) => JSON.parse(read(root, rel));
const version = (root, pkg) => json(root, `packages/${pkg}/package.json`).version;

/** A docs page's front matter: the flat keys, and `equivalents` as lists (the docs' own parser, apps/docs/src/lib/data.ts, reads it the same way). */
export function frontMatter(source) {
  const block = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const out = { equivalents: {} };
  let parent = null;
  const unquote = (v) => {
    const s = v.replace(/\s+#.*$/, "").trim().replace(/^(["'])(.*)\1$/, "$2");
    return s === "null" || s === "" ? null : s;
  };
  for (const line of block.split("\n")) {
    const sub = line.match(/^\s+([\w-]+):\s*(.*)$/);
    if (sub && parent === "equivalents") {
      out.equivalents[sub[1]] = (unquote(sub[2]) ?? "").split(",").map((s) => s.trim()).filter(Boolean);
      continue;
    }
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (!kv) continue;
    const v = unquote(kv[2]);
    if (kv[1] !== "equivalents") out[kv[1]] = v;
    parent = v === null ? kv[1] : null;
  }
  return out;
}

/** A docs page's first sentence, as plain text (data.ts's summary()). */
export function summary(source) {
  const body = source.replace(/^---\n[\s\S]*?\n---\n/, "").replace(/^\s*#[^\n]*\n/, "");
  const para = body.split(/\n\s*\n/).find((p) => p.trim() && !/^\s*(#|\||```)/.test(p)) ?? "";
  const plain = para.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/`([^`]+)`/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\s+/g, " ").trim();
  return (plain.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? plain).trim();
}

/** Every component page: slug, package folder and front matter. */
function pages(root) {
  const out = new Map();
  for (const pkg of readdirSync(join(root, "packages")).sort()) {
    const dir = `packages/${pkg}/docs`;
    if (!existsSync(join(root, dir))) continue;
    for (const f of readdirSync(join(root, dir)).sort()) {
      if (!f.endsWith(".md")) continue;
      const source = read(root, `${dir}/${f}`);
      out.set(f.slice(0, -3), { slug: f.slice(0, -3), pkg, file: `${dir}/${f}`, source, meta: frontMatter(source) });
    }
  }
  return out;
}

/** The module specifiers a file imports or re-exports, comments left out. */
export function specifiers(code) {
  const bare = code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  return [...bare.matchAll(/^\s*(?:import|export)\b[^;]*?\bfrom\s*"([^"]+)"|^\s*import\s*"([^"]+)"/gm)].map((m) => m[1] ?? m[2]);
}

/** The names of the components a file exports (forwardRef components and re-exported wrappers). */
const exportsOf = (code) => [
  ...[...code.matchAll(/^export const ([A-Z]\w*) = /gm)].map((m) => m[1]),
  ...[...code.matchAll(/^export \{([^}]*)\} from/gm)].flatMap((m) => m[1].split(",").map((s) => s.trim()).filter((s) => /^[A-Z]/.test(s))),
];

// ------------------------------------------------------------------ building

class RegistryError extends Error {}
const fail = (message) => {
  throw new RegistryError(`registry: ${message}`);
};

/**
 * Builds the registry in memory: { registry, items } where items maps each name to its JSON. Throws (with the file
 * and what to do) when the sources disagree: a page in ITEMS without a docs page or React file, an import of a
 * component that has no item, a package import that is not Blip's, a theme role the tokens do not have.
 */
export function build({ root = ROOT } = {}) {
  const docs = pages(root);
  const items = new Map();
  const dep = (name) => `${NAMESPACE}/${name}`;
  const pin = (pkg) => `@jaatster/blip-${pkg}@^${version(root, pkg)}`;
  const docsUrl = (slug) => `${HOMEPAGE}/components/${slug}/`;
  const author = `Blip <${HOMEPAGE}>`;

  // setup: the CSS packages, imported under Tailwind's utilities.
  const cssPackages = [...new Set(CSS.map((f) => f.split("/").slice(0, 2).join("/")))];
  for (const f of CSS) {
    const [, name, ...rest] = f.split("/");
    const pkg = name.replace(/^blip-/, "");
    const exp = json(root, `packages/${pkg}/package.json`).exports ?? {};
    if (!(`./${rest.join("/")}` in exp) && !existsSync(join(root, "packages", pkg, ...rest))) fail(`setup imports ${f}, which @jaatster/blip-${pkg} does not export`);
  }
  items.set("setup", {
    name: "setup",
    type: "registry:lib",
    title: "Blip setup",
    description: `Blip's CSS from npm (the faces, the tokens and palettes, the building blocks and every component), imported into your Tailwind CSS in layer(${LAYER}): over Tailwind's reset, under its utilities.`,
    author,
    dependencies: cssPackages.map((p) => pin(p.replace("@jaatster/blip-", ""))),
    css: Object.fromEntries(CSS.map((f) => [`@import "${f}" layer(${LAYER})`, {}])),
    docs: `Blip's CSS is imported into your Tailwind CSS file, under Tailwind's utilities. Put data-blip-scheme="day" (or "sunset", "night") on <html>: ${HOMEPAGE}/start/#shadcn`,
    meta: { docs: `${HOMEPAGE}/start/#shadcn` },
  });

  // theme: shadcn's variables onto Blip's roles.
  const known = new Set(json(root, "packages/tokens/dist/json/manifest.json").map((t) => t.cssVar));
  for (const f of readdirSync(join(root, "packages/core/src/css"))) if (f.endsWith(".css")) for (const m of read(root, `packages/core/src/css/${f}`).matchAll(/(--blip-[a-z0-9-]+)\s*:/g)) known.add(m[1]);
  const roles = Object.fromEntries(Object.entries(THEME).map(([k, role]) => [k, `var(--blip-${role})`]));
  const named = [...Object.values(roles), ...Object.values(TAILWIND)].flatMap((v) => [...v.matchAll(/var\((--blip-[a-z0-9-]+)\)/g)].map((m) => m[1]));
  const unknown = [...new Set(named.filter((n) => !known.has(n)))];
  if (unknown.length) fail(`the theme maps onto ${unknown.join(", ")}, which neither the tokens' manifest nor @jaatster/blip-core defines`);
  items.set("theme", {
    name: "theme",
    type: "registry:theme",
    title: "Blip theme",
    description: "shadcn/ui's colours, radius, shadows, font and easing set from Blip's scheme roles: its schemes and palettes, ink borders, square corners, one-pixel drops, stepped motion and the yellow focus ring.",
    author,
    registryDependencies: [dep("setup")],
    cssVars: {
      theme: { ...TAILWIND },
      // The same in light and dark: Blip's scheme switches the roles (data-blip-scheme), not the .dark class.
      light: { ...roles, radius: "0rem" },
      dark: { ...roles },
    },
    css: {
      // A variable set on :root resolves there: repeat the mapping where a scheme or palette is set on part of a page.
      "@layer base": { "[data-blip-scheme], [data-blip-palette]": Object.fromEntries(Object.entries(roles).map(([k, v]) => [`--${k}`, v])) },
    },
    docs: `shadcn's components now take Blip's colours: switch them with data-blip-scheme and data-blip-palette, not .dark. The full pixel look comes with Blip's own components (npx shadcn add ${NAMESPACE}/button).`,
    meta: { docs: `${HOMEPAGE}/start/#shadcn` },
  });

  // components, and the helpers they import.
  const internal = new Set();
  for (const slug of ITEMS) {
    const page = docs.get(slug) ?? fail(`ITEMS names ${slug}, which has no docs page (packages/*/docs/${slug}.md)`);
    const sub = page.pkg === "game" || page.pkg === "blocks" ? `${page.pkg}/` : "";
    const path = `packages/react/src/components/${sub}${slug}.tsx`;
    if (!existsSync(join(root, path))) fail(`${slug} has no React file of its own (${path})`);
    let content = read(root, path);
    const dependencies = new Set();
    const registryDependencies = new Set([dep("setup")]);
    for (const spec of specifiers(content)) {
      let to = null;
      if (spec === "react" || spec.startsWith("react/")) continue;
      const own = spec.match(/^(?:\.\.\/)+internal\/([\w-]+)\.js$/);
      const sibling = spec.match(/^\.\/([\w-]+)\.js$/);
      const generated = spec.match(/^(?:\.\.\/)+generated\/([\w-]+)\.js$/);
      const blip = spec.match(/^@jaatster\/blip-([\w-]+)/);
      if (own) {
        internal.add(own[1]);
        registryDependencies.add(dep("utils"));
        to = `${IMPORT_LIB}/${own[1]}`;
      } else if (sibling) {
        if (!ITEMS.includes(sibling[1])) fail(`${path} imports ./${sibling[1]}.js, which has no item: add "${sibling[1]}" to ITEMS`);
        registryDependencies.add(dep(sibling[1]));
        to = `${IMPORT_COMPONENTS}/${sibling[1]}`;
      } else if (generated) {
        dependencies.add(pin("react"));
        to = generated[1] === "elements" ? "@jaatster/blip-react" : `@jaatster/blip-react/${generated[1]}`;
      } else if (blip) {
        dependencies.add(pin(blip[1]));
      } else fail(`${path} imports "${spec}": an item may import react, Blip's packages and its own helpers, nothing else`);
      if (to) content = content.replaceAll(`"${spec}"`, `"${to}"`);
    }
    const meta = page.meta;
    items.set(slug, {
      name: slug,
      type: "registry:ui",
      title: meta.name,
      description: summary(page.source),
      author,
      ...(dependencies.size ? { dependencies: [...dependencies].sort() } : {}),
      registryDependencies: [...registryDependencies].sort((a, b) => (a === dep("setup") ? -1 : b === dep("setup") ? 1 : a.localeCompare(b))),
      files: [{ path, type: "registry:ui", target: `${COMPONENTS}/${slug}.tsx`, content }],
      meta: {
        status: meta.status,
        docs: docsUrl(slug),
        package: meta.package,
        css: meta.css,
        ...(meta.element ? { element: meta.element } : {}),
        react: exportsOf(content),
        import: `import { ${meta.react} } from "${IMPORT_COMPONENTS}/${slug}";`,
        equivalents: meta.equivalents,
      },
    });
  }

  // utils: the internal helpers the components import, and the ones those import.
  const files = [];
  for (let queue = [...internal].sort(); queue.length; ) {
    const name = queue.shift();
    const path = ["ts", "tsx"].map((e) => `packages/react/src/internal/${name}.${e}`).find((p) => existsSync(join(root, p))) ?? fail(`no packages/react/src/internal/${name}.ts(x)`);
    if (files.some((f) => f.path === path)) continue;
    let content = read(root, path);
    for (const spec of specifiers(content)) {
      if (spec === "react" || spec.startsWith("react/")) continue;
      const rel = spec.match(/^\.\/([\w-]+)\.js$/) ?? fail(`${path} imports "${spec}": the helpers may import react and each other only`);
      if (!internal.has(rel[1])) (internal.add(rel[1]), queue.push(rel[1]));
      content = content.replaceAll(`"${spec}"`, `"./${rel[1]}"`);
    }
    files.push({ path, type: "registry:lib", target: `${LIB}/${path.split("/").pop()}`, content });
  }
  items.set("utils", {
    name: "utils",
    type: "registry:lib",
    title: "Blip component helpers",
    description: "The props, class and attribute helpers Blip's components share, in lib/blip.",
    author,
    files: files.sort((a, b) => a.path.localeCompare(b.path)),
    meta: { docs: `${HOMEPAGE}/start/#shadcn` },
  });

  const order = ["setup", "theme", "utils", ...ITEMS];
  const ordered = new Map(order.map((n) => [n, { $schema: "https://ui.shadcn.com/schema/registry-item.json", ...items.get(n) }]));
  const registry = {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: "blip",
    homepage: HOMEPAGE,
    items: [...ordered.values()].map(({ $schema, ...item }) => ({ ...item, ...(item.files ? { files: item.files.map(({ content, ...f }) => f) } : {}) })),
  };
  return { registry, items: ordered };
}

// ------------------------------------------------------------------ validating

/** The two schemas, vendored in scripts/shadcn/. */
export function schemas(root = ROOT) {
  return { item: json(root, "scripts/shadcn/registry-item.schema.json"), registry: json(root, "scripts/shadcn/registry.schema.json") };
}

/**
 * The problems with a value against a JSON Schema (draft-07), as "path: message" lines; empty when it is valid.
 * Enough of the draft for shadcn's two schemas: type, enum, const, properties, required, additionalProperties,
 * items, if/then/else, allOf, anyOf, oneOf, not, false, and $ref to #/definitions or to the item schema by URL.
 */
export function validate(schema, value, { root = schema, refs = {} } = {}, at = "$") {
  if (schema === true || schema === undefined) return [];
  if (schema === false) return [`${at}: not allowed`];
  const out = [];
  const sub = (s, v, p) => validate(s, v, { root, refs }, p);
  if (schema.$ref) {
    if (schema.$ref.startsWith("#/")) return sub(schema.$ref.slice(2).split("/").reduce((o, k) => o[k], root), value, at);
    const target = refs[schema.$ref] ?? fail(`validate: no schema for ${schema.$ref}`);
    return validate(target, value, { root: target, refs }, at);
  }
  const typeOf = (v) => (Array.isArray(v) ? "array" : v === null ? "null" : Number.isInteger(v) ? "integer" : typeof v);
  if (schema.type) {
    const types = [schema.type].flat();
    const t = typeOf(value);
    if (!types.includes(t) && !(t === "integer" && types.includes("number"))) return [`${at}: should be ${types.join(" or ")}, is ${t}`];
  }
  if (schema.enum && !schema.enum.includes(value)) out.push(`${at}: ${JSON.stringify(value)} is not one of ${schema.enum.join(", ")}`);
  if ("const" in schema && value !== schema.const) out.push(`${at}: should be ${JSON.stringify(schema.const)}`);
  if (typeOf(value) === "object") {
    for (const r of schema.required ?? []) if (!(r in value)) out.push(`${at}: needs "${r}"`);
    for (const [k, v] of Object.entries(value)) {
      if (schema.properties && k in schema.properties) out.push(...sub(schema.properties[k], v, `${at}.${k}`));
      else if ("additionalProperties" in schema) out.push(...sub(schema.additionalProperties, v, `${at}.${k}`));
    }
  }
  if (typeOf(value) === "array" && schema.items) value.forEach((v, i) => out.push(...sub(schema.items, v, `${at}[${i}]`)));
  if (schema.if) {
    const branch = sub(schema.if, value, at).length ? schema.else : schema.then;
    if (branch) out.push(...sub(branch, value, at));
  }
  for (const s of schema.allOf ?? []) out.push(...sub(s, value, at));
  if (schema.anyOf && !schema.anyOf.some((s) => !sub(s, value, at).length)) out.push(`${at}: matches none of anyOf`);
  if (schema.oneOf && schema.oneOf.filter((s) => !sub(s, value, at).length).length !== 1) out.push(`${at}: should match exactly one of oneOf`);
  if (schema.not && !sub(schema.not, value, at).length) out.push(`${at}: matches what "not" forbids`);
  return out;
}

/** Every problem with a built registry against the schemas, by file. */
export function problems(built, root = ROOT) {
  const { item, registry } = schemas(root);
  const refs = { "https://ui.shadcn.com/schema/registry-item.json": item };
  const out = validate(registry, built.registry, { refs }).map((p) => `registry.json ${p}`);
  for (const [name, json] of built.items) out.push(...validate(item, json, { refs }).map((p) => `${name}.json ${p}`));
  return out;
}

// ------------------------------------------------------------------ writing

/** Writes registry.json and one <name>.json per item into dir (emptied first). */
export function write(built, dir) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const text = (v) => JSON.stringify(v, null, 2) + "\n";
  writeFileSync(join(dir, "registry.json"), text(built.registry));
  for (const [name, item] of built.items) writeFileSync(join(dir, `${name}.json`), text(item));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const outAt = args.indexOf("--out");
  const dir = outAt >= 0 ? args[outAt + 1] : join(ROOT, OUT);
  try {
    const built = build();
    const bad = problems(built);
    if (bad.length) fail(`the items do not match shadcn's schema:\n  ${bad.join("\n  ")}`);
    if (args.includes("--list")) {
      for (const item of built.items.values()) {
        const deps = [...(item.dependencies ?? []), ...(item.registryDependencies ?? [])];
        console.log(`${item.name.padEnd(10)} ${item.type.padEnd(15)} ${String(item.files?.length ?? 0).padStart(2)} files  ${deps.join(" ")}`);
      }
    } else if (!args.includes("--check")) {
      write(built, dir);
      console.log(`registry: ${built.items.size} items in ${relative(process.cwd(), dir) || "."}`);
    } else console.log(`registry: ${built.items.size} items, valid`);
  } catch (e) {
    if (!(e instanceof RegistryError)) throw e;
    console.error(e.message);
    process.exit(1);
  }
}
