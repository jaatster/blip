#!/usr/bin/env node
/**
 * Size budgets, checked after a build. Prints a table and exits 1 if anything is over (or missing).
 *
 *   pnpm build && pnpm budgets
 *
 * Sizes are gzip -9 of what ships, in KB of 1024 bytes, except the font: WOFF2 is already compressed and servers send
 * it as it is, so its budget is the file size. Nothing here is a dependency of its own: Node's zlib, plus the esbuild
 * the package builds already use, to minify a module the way an app's bundler would ship it.
 *
 * What each line measures:
 *
 * - tokens.css, core.css, components CSS: the files as shipped (core and components minified).
 * - palettes.css, 5 KB: the presets, opt in (data-pp-palette). Eleven of them, each about 50 colours (the accents,
 *   the warning where it moves, Night's page, ink and sky), so about 0.4 KB a preset.
 * - core JS: all of @jaatster/blip-core's JavaScript (elements, controllers, timeline, services), bundled and minified.
 * - Each element module: one module of @jaatster/blip-elements, the game kit, the effects kit or the icons, minified with
 *   @jaatster/blip-* left out (the core runtime is the core JS line; the icon data is the icons line). Found by looking
 *   for modules that define a pp-* element. The effects world renderer is exempt here: it is an effect (a landscape
 *   drawn in the browser instead of an image), budgeted with the effects.
 * - Effects JS + CSS, 18 KB: PLAN.md's first estimate was 12 KB, made before the world renderer was finished (five
 *   layers, wide screens, parallax, drifting clouds, birds and shooting stars: about 6.1 KB on its own). The effects
 *   are measured as a page that opts in loads them: effects.bundle.js, which carries the parts of the core runtime
 *   they use (about 0.9 KB), plus effects.min.css. That was 12.8 KB before avoid; without the core runtime it
 *   would be 11.9 KB. 13 KB kept the honest, self-contained measure instead of moving core out of sight. 14 KB
 *   since the world learned avoid (about 0.9 KB): it keeps the sun, the moon, flaring stars and shooting stars
 *   clear of the text over it, found by measuring the page, which a picture cannot do. 15 KB since the world learned
 *   to pause (about 0.55 KB): <pp-motion-toggle>, the page-wide pause WCAG 2.2.2 asks for wherever the world drifts,
 *   flares or has events, and the world stopping and carrying on at once. 18 KB since attract mode (about 2.4 KB:
 *   1.9 KB of script, 0.45 KB of CSS): <pp-attract>, a short demo of real markup played by a pixel pointer from a
 *   script, which a recording cannot be (it is the page's own components, in every scheme, pixel and language), and
 *   which undoes its own changes between loops and stops with the motion toggle. Other growth still fails.
 * - Sound: sound.bundle.js, the whole kit as a page loads it.
 * - Pixel Bop: the WOFF2 file.
 * - Icons index.js: all the icon path data (about 190 icons).
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const KB = 1024;
const at = (...p) => join(ROOT, "packages", ...p);
const gzip = (bytes) => gzipSync(bytes, { level: 9 }).length;

/** Modules exempt from the per-element line, and why. */
const EXEMPT = { "effects/src/world.ts": "an effect: counted in the effects line" };

const missing = [];
const read = (file) => {
  if (existsSync(file)) return readFileSync(file);
  missing.push(relative(ROOT, file));
  return null;
};
const gzFile = (file) => {
  const b = read(file);
  return b === null ? null : gzip(b);
};
const bundle = async (entry, external = ["@jaatster/blip-*"]) => {
  if (!existsSync(entry)) {
    missing.push(relative(ROOT, entry));
    return null;
  }
  const r = await build({ entryPoints: [entry], bundle: true, minify: true, format: "esm", target: "es2022", write: false, external, logLevel: "silent" });
  return gzip(r.outputFiles[0].contents);
};
const sum = (...n) => (n.some((x) => x === null) ? null : n.reduce((a, b) => a + b, 0));

const rows = [];
const row = (name, file, size, limitKB, note = "") => rows.push({ name, file, size, limit: limitKB * KB, note });

row("tokens.css", "tokens/dist/css/tokens.css", gzFile(at("tokens/dist/css/tokens.css")), 4);
row("palettes.css", "tokens/dist/css/palettes.css", gzFile(at("tokens/dist/css/palettes.css")), 5);
row("core.css", "core/dist/core.min.css", gzFile(at("core/dist/core.min.css")), 6);
row("core JS", "core/dist/js/index.js (bundled)", await bundle(at("core/dist/js/index.js"), []), 3);
row("all components CSS", "components/dist/components.min.css", gzFile(at("components/dist/components.min.css")), 30);

// Element modules: every module that defines a pp-* element.
const defines = /\b(?:customElements|PixelElement|\w+)\.define\(\s*["']pp-/;
for (const pkg of ["elements", "game", "effects", "icons"]) {
  const src = at(pkg, "src");
  if (!existsSync(src)) continue;
  for (const f of readdirSync(src).sort()) {
    if (!f.endsWith(".ts") || f.startsWith("_") || f === "index.ts" || f.endsWith(".d.ts") || f.endsWith(".test.ts")) continue;
    const file = join(src, f);
    if (!defines.test(readFileSync(file, "utf8"))) continue;
    const key = `${pkg}/src/${f}`;
    if (EXEMPT[key]) {
      rows.push({ name: `element ${pkg}/${f.replace(/\.ts$/, "")}`, file: key, size: await bundle(file), limit: Infinity, note: `exempt: ${EXEMPT[key]}` });
      continue;
    }
    row(`element ${pkg}/${f.replace(/\.ts$/, "")}`, key, await bundle(file, ["@jaatster/blip-*", "./index.js"]), 3);
  }
}

row("effects JS + CSS", "effects/dist/effects.bundle.js + effects.min.css", sum(gzFile(at("effects/dist/effects.bundle.js")), gzFile(at("effects/dist/effects.min.css"))), 18);
row("sound", "sound/dist/sound.bundle.js", gzFile(at("sound/dist/sound.bundle.js")), 3);
{
  const woff2 = at("font/dist/pixel-bop.woff2");
  const size = existsSync(woff2) ? statSync(woff2).size : (missing.push(relative(ROOT, woff2)), null);
  row("Pixel Bop woff2", "font/dist/pixel-bop.woff2 (file size)", size, 15);
}
row("icons index.js", "icons/dist/index.js", gzFile(at("icons/dist/index.js")), 6);

// The table.
const kb = (n) => (n === null ? "missing" : `${(n / KB).toFixed(2)} KB`);
const W = { name: 34, file: 52, size: 10, limit: 8 };
const line = (a, b, c, d, e) => `${a.padEnd(W.name)} ${b.padEnd(W.file)} ${c.padStart(W.size)} ${d.padStart(W.limit)}  ${e}`;
console.log(line("Budget", "Measures (in packages/)", "gzip", "limit", "status"));
console.log("-".repeat(W.name + W.file + W.size + W.limit + 14));
let failed = 0;
for (const r of rows) {
  const over = r.size === null || r.size > r.limit;
  if (over) failed++;
  const status = r.size === null ? "MISSING" : r.limit === Infinity ? r.note : over ? `OVER by ${r.size - r.limit} B` : `ok ${Math.round((100 * r.size) / r.limit)}%`;
  console.log(line(r.name, r.file, kb(r.size), r.limit === Infinity ? "-" : `${r.limit / KB} KB`, status));
}
console.log();
if (missing.length) console.error(`budgets: not built yet: ${[...new Set(missing)].join(", ")}.\n  Fix: run pnpm build first.`);
if (failed) {
  console.error(`budgets: ${failed} over budget. Make it smaller, or change the budget in scripts/budgets.mjs with a reason.`);
  process.exit(1);
}
console.log(`budgets: all ${rows.filter((r) => r.limit !== Infinity).length} within budget.`);
