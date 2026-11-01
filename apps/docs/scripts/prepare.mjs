#!/usr/bin/env node
// Prepares the docs site from the built packages, so the site never drifts from them.
//
//   public/chu/<package>/…        the packages' CSS and fonts as built, and their ES modules minified one file at a
//                                time (imports stay as they are, so the import map wires them exactly as a CDN user
//                                would)
//   src/generated/assets.json    the import map, which module defines which element, and sizes measured against
//                                the plan's budgets
//
// Run by `pnpm --filter @jaatster/blip-docs build` (and dev). Build the packages first:
//   pnpm -r --filter "./packages/**" run build
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { execFileSync } from "node:child_process";
import { build, transform } from "esbuild";

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = resolve(APP, "../..");
const OUT = join(APP, "public/chu");
const GEN = join(APP, "src/generated");
const pkg = (name, ...rest) => join(ROOT, "packages", name, ...rest);
const gz = (buf) => gzipSync(buf, { level: 9 }).length;

const required = [
  pkg("font", "dist", "pixel-bop.woff2"), pkg("tokens", "dist", "css", "tokens.css"), pkg("core", "dist", "core.min.css"),
  pkg("components", "dist", "components.min.css"), pkg("components", "dist", "popover-nub.min.css"), pkg("elements", "dist", "index.js"), pkg("effects", "dist", "index.js"),
  pkg("game", "dist", "index.js"), pkg("blocks", "dist", "blocks.min.css"), pkg("sound", "dist", "index.js"), pkg("icons", "dist", "icons.json"),
];
const missing = required.filter((f) => !existsSync(f));
if (missing.length) {
  console.error(`docs: the packages are not built (missing ${missing.map((f) => relative(ROOT, f)).join(", ")}).\n  Run: pnpm -r --filter "./packages/**" run build`);
  process.exit(1);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(GEN, { recursive: true });

const copy = (from, to) => {
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
};

/** Every .js file under dir (not bundles, not maps), relative paths. */
function modules(dir, base = dir) {
  const out = [];
  for (const f of readdirSync(dir).sort()) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out.push(...modules(p, base));
    else if (f.endsWith(".js") && !f.endsWith(".bundle.js")) out.push(relative(base, p));
  }
  return out;
}

const defines = {}; // tag -> URL of the module that defines it
let jsBytes = 0;
async function copyModules(name, from, to) {
  for (const rel of modules(from)) {
    const source = readFileSync(join(from, rel), "utf8");
    const { code } = await transform(source, { loader: "js", format: "esm", minify: true, target: "es2022", legalComments: "none" });
    const dest = join(OUT, to, rel);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, code);
    jsBytes += code.length;
    const url = `/chu/${to}/${rel}`.replaceAll("\\", "/");
    for (const m of source.matchAll(/define\(\s*"(chu-[a-z0-9-]+)"/g)) defines[m[1]] ??= url;
  }
}

// ------------------------------------------------------------------ copy

copy(pkg("font", "font.css"), join(OUT, "font/font.css"));
for (const f of readdirSync(pkg("font", "dist"))) if (f.endsWith(".woff2")) copy(pkg("font", "dist", f), join(OUT, "font/dist", f));
copy(pkg("tokens", "dist", "css", "tokens.css"), join(OUT, "tokens/tokens.css"));
// The presets (data-chu-palette), and the palette maths the palette maker shares with the presets' generator.
copy(pkg("tokens", "dist", "css", "palettes.css"), join(OUT, "tokens/palettes.css"));
copy(pkg("tokens", "scripts", "palette.mjs"), join(OUT, "tokens/palette.mjs"));
copy(pkg("core", "dist", "core.min.css"), join(OUT, "core/core.css"));
copy(pkg("components", "dist", "components.min.css"), join(OUT, "components/components.css"));
// The popover's nub, opt-in (anchored container queries): loaded with a <link> after the components, as adopters do.
copy(pkg("components", "dist", "popover-nub.min.css"), join(OUT, "components/popover-nub.css"));
copy(pkg("game", "dist", "game.min.css"), join(OUT, "game/game.css"));
copy(pkg("blocks", "dist", "blocks.min.css"), join(OUT, "blocks/blocks.css"));
copy(pkg("effects", "dist", "effects.min.css"), join(OUT, "effects/effects.css"));
copy(pkg("icons", "dist", "sprite.svg"), join(OUT, "icons/sprite.svg"));

await copyModules("tokens", pkg("tokens", "dist", "js"), "tokens");
await copyModules("core", pkg("core", "dist", "js"), "core/js");
for (const name of ["elements", "game", "blocks", "effects", "sound"]) await copyModules(name, pkg(name, "dist"), name);
mkdirSync(join(OUT, "icons"), { recursive: true });
for (const f of ["index.js", "element.js"]) {
  const source = readFileSync(pkg("icons", "dist", f), "utf8");
  const { code } = await transform(source, { loader: "js", format: "esm", minify: true, target: "es2022", legalComments: "none" });
  writeFileSync(join(OUT, "icons", f), code);
  for (const m of source.matchAll(/define\(\s*"(chu-[a-z0-9-]+)"/g)) defines[m[1]] ??= `/chu/icons/${f}`;
}

const importMap = {
  imports: {
    "@jaatster/blip-core": "/chu/core/js/index.js",
    "@jaatster/blip-tokens": "/chu/tokens/index.js",
    "@jaatster/blip-elements": "/chu/elements/index.js",
    "@jaatster/blip-elements/": "/chu/elements/",
    "@jaatster/blip-effects": "/chu/effects/index.js",
    "@jaatster/blip-effects/": "/chu/effects/",
    "@jaatster/blip-game": "/chu/game/index.js",
    "@jaatster/blip-game/": "/chu/game/",
    "@jaatster/blip-sound": "/chu/sound/index.js",
    "@jaatster/blip-icons": "/chu/icons/index.js",
    "@jaatster/blip-icons/": "/chu/icons/",
  },
};
// The core modules every element needs: preloaded with the first element on a page, so they arrive together.
const coreModules = modules(pkg("core", "dist", "js")).map((rel) => `/chu/core/js/${rel}`.replaceAll("\\", "/"));

// ------------------------------------------------------------------ budgets (gzipped, as the packages report them)

/** One module bundled and minified with the other packages left out, as scripts/build-ts-package.mjs measures it. */
async function moduleSize(entry) {
  const r = await build({ entryPoints: [entry], bundle: true, minify: true, format: "esm", target: "es2022", write: false, external: ["@jaatster/blip-*"], logLevel: "silent" });
  return gz(r.outputFiles[0].contents);
}
const fileGz = (f) => gz(readFileSync(f));

const elements = [];
for (const f of readdirSync(pkg("elements", "src")).sort()) {
  if (!f.endsWith(".ts") || f === "index.ts" || f.startsWith("_") || f.endsWith(".d.ts") || f.endsWith(".test.ts")) continue;
  const js = f.replace(/\.ts$/, ".js");
  if (existsSync(pkg("elements", "dist", js))) elements.push({ name: f.replace(/\.ts$/, ""), bytes: await moduleSize(pkg("elements", "dist", js)) });
}
elements.sort((a, b) => b.bytes - a.bytes);
const effectsJs = await moduleSize(pkg("effects", "dist", "index.js"));
const effectsCss = fileGz(pkg("effects", "dist", "effects.min.css"));
const KB = 1024;

/**
 * The budgets as CI checks them: the repository's scripts/budgets.mjs is run and its table read, so the docs show
 * exactly what CI enforces. Without that script, the same measures are taken here.
 */
function ciBudgets() {
  const script = join(ROOT, "scripts", "budgets.mjs");
  if (!existsSync(script)) return null;
  let out = "";
  try {
    out = execFileSync(process.execPath, [script], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    out = e.stdout ?? ""; // over budget exits 1, but the table is still there
  }
  const rows = [];
  for (const line of out.split("\n")) {
    const m = line.match(/^(.+?)\s{2,}(.+?)\s{2,}([\d.]+) KB\s+([\d.]+ KB|-)\s{2}(.*)$/);
    if (!m) continue;
    rows.push({ name: m[1].trim(), file: m[2].trim(), bytes: Math.round(Number(m[3]) * KB), limit: m[4] === "-" ? null : Math.round(Number(m[4].replace(" KB", "")) * KB), status: m[5].trim() });
  }
  return rows.length ? rows : null;
}
const ci = ciBudgets();
let budgets;
if (ci) {
  const find = (name) => ci.find((r) => r.name === name);
  const els = ci.filter((r) => r.name.startsWith("element ") && r.limit !== null).sort((a, b) => b.bytes - a.bytes);
  const pick = (id, name, label, note) => {
    const r = find(name);
    return r && { id, label, bytes: r.bytes, limit: r.limit, note };
  };
  budgets = [
    pick("components", "all components CSS", "All component CSS", "components.min.css: every component"),
    pick("tokens", "tokens.css", "Tokens", "tokens.css: three schemes, three pixel sizes"),
    pick("core-css", "core.css", "Building blocks", "core.css: the box, type, icons, motion"),
    pick("core-js", "core JS", "Core runtime", "the element base, controllers, timeline, services"),
    els[0] && { id: "element", label: "Largest element", bytes: els[0].bytes, limit: els[0].limit, note: `${els[0].name.replace("element ", "")}: each of the ${els.length} is under ${els[0].limit / KB} KB` },
    pick("effects", "effects JS + CSS", "Effects", "the world, transitions, text, bursts, CRT and attract mode, with their CSS"),
    pick("sound", "sound", "Sound", "eleven chip sounds, synthesised: no audio files"),
    pick("font", "Pixel Bop woff2", "Display font", "pixel-bop.woff2: Latin; Cyrillic and Greek in their own files"),
    pick("icons", "icons index.js", "Icons", `all ${JSON.parse(readFileSync(pkg("icons", "dist", "icons.json"), "utf8")).icons.length} icons as path data`),
  ].filter(Boolean);
} else {
  budgets = [
    { id: "components", label: "All component CSS", bytes: fileGz(pkg("components", "dist", "components.min.css")), limit: 30 * KB, note: "components.min.css: every component" },
    { id: "tokens", label: "Tokens", bytes: fileGz(pkg("tokens", "dist", "css", "tokens.css")), limit: 4 * KB, note: "tokens.css: three schemes, three pixel sizes" },
    { id: "element", label: "Largest element", bytes: elements[0]?.bytes ?? 0, limit: 3 * KB, note: `${elements[0]?.name ?? "none"}: every element is under 3 KB` },
    { id: "effects", label: "Effects", bytes: effectsJs + effectsCss, limit: 12 * KB, note: "the world, transitions, text, bursts and CRT, with their CSS" },
    { id: "font", label: "Display font", bytes: statSync(pkg("font", "dist", "pixel-bop.woff2")).size, limit: 15 * KB, note: "pixel-bop.woff2: Latin; Cyrillic and Greek in their own files" },
  ];
}
const kits = {
  core: { css: fileGz(pkg("core", "dist", "core.min.css")), js: await moduleSize(pkg("core", "dist", "js", "index.js")) },
  game: { css: fileGz(pkg("game", "dist", "game.min.css")), js: await moduleSize(pkg("game", "dist", "index.js")) },
  blocks: { css: fileGz(pkg("blocks", "dist", "blocks.min.css")) },
  effects: { css: effectsCss, js: effectsJs, world: await moduleSize(pkg("effects", "dist", "world.js")) },
  sound: { js: await moduleSize(pkg("sound", "dist", "index.js")) },
  icons: { sprite: fileGz(pkg("icons", "dist", "sprite.svg")), js: await moduleSize(pkg("icons", "dist", "index.js")) },
  font: { display: statSync(pkg("font", "dist", "pixel-bop.woff2")).size, ui: statSync(pkg("font", "dist", "pixelify-sans.woff2")).size },
};

writeFileSync(join(GEN, "assets.json"), JSON.stringify({ importMap, defines, coreModules, budgets, budgetsFrom: ci ? "scripts/budgets.mjs" : "docs", elements, kits }, null, 2) + "\n");
console.log(`docs: staged the packages in public/chu (${Object.keys(defines).length} elements, ${(jsBytes / 1024).toFixed(1)} KB of minified modules)`);
for (const b of budgets) console.log(`  ${b.label.padEnd(20)} ${(b.bytes / 1024).toFixed(1).padStart(5)} KB of ${b.limit / 1024} KB${b.bytes > b.limit ? "  OVER" : ""}`);
