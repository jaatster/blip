#!/usr/bin/env node
/**
 * Builds @blip/icons from the pixel maps in src/*.icons (one file per category).
 *
 *   pnpm --filter @blip/icons build        (or, in packages/icons: node scripts/build.mjs)
 *
 * 1. Validates every map: a header '@ <kebab-name> tags: word, word', then exactly 12 rows of 12 'X' or '.'.
 *    Names are unique across all files. Every map keeps the chunky rules: no line one pixel thick and no lone
 *    pixel, unless its header says 'thin' ('@ <name> thin tags: …'). Errors name the file, the line (and column)
 *    and the fix; all of them are listed at once.
 * 2. Traces each icon into one SVG path: closed contours around the union of its pixels, outlines clockwise and
 *    holes anticlockwise (so it fills the same with nonzero or evenodd), collinear points merged, whole numbers
 *    only. Each path is drawn back onto the grid and must cover exactly the pixels in the map.
 * 3. Writes:
 *      dist/svg/<name>.svg       one file per icon
 *      dist/sprite.svg           <symbol id="blip-icon-<name>">, for <svg><use href="sprite.svg#blip-icon-<name>"/></svg>
 *      dist/index.js, .d.ts      icons (name to path data), type IconName, iconSvg()
 *      dist/icons.json           categories, and the name, category, tags and path of every icon
 *      dist/element.js, .d.ts    <blip-icon>, compiled from src/element.ts
 *      examples/icons.html       the gallery fragment: the set by category, in buttons, in text, large
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { execFileSync } from "node:child_process";

const PKG = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(PKG, "src");
const DIST = join(PKG, "dist");
const N = 12;
const SVG_NS = "http://www.w3.org/2000/svg";

/** Category ids are file names. This sets their order and titles; a new file is listed last, titled by its name. */
const CATEGORIES = {
  arrows: "Arrows and navigation",
  actions: "Actions",
  status: "Status",
  media: "Media",
  files: "Files and text",
  communication: "Communication and people",
  commerce: "Commerce",
  devices: "Devices and system",
  weather: "Weather and time",
  game: "Game",
  misc: "Miscellaneous",
};

// ------------------------------------------------------------------------------------------------ read and check

const files = readdirSync(SRC).filter((f) => f.endsWith(".icons")).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
function rank(file) {
  const i = Object.keys(CATEGORIES).indexOf(file.replace(/\.icons$/, ""));
  return i < 0 ? Infinity : i;
}

const errors = [];
const icons = [];
const seen = new Map();
/** Records a problem at a file and line (and column); they are reported together, in file order. */
const fail = (file, line, text, col) => errors.push({ order: files.indexOf(file) * 1e6 + line, text: `src/${file}${line ? `:${line}` : ""}${col ? `:${col}` : ""}: ${text}` });

for (const file of files) {
  const category = file.replace(/\.icons$/, "");
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(category)) fail(file, 0, `a category file is named in kebab-case, e.g. "${kebab(category)}.icons".`);
  const lines = readFileSync(join(SRC, file), "utf8").split(/\r?\n/);
  let icon = null;
  const close = (line) => {
    if (!icon) return;
    if (icon.rows.length < N) fail(file, icon.line, `"${icon.name}" has ${icon.rows.length} rows; its block ends at line ${line}. Draw exactly 12 rows of 12 'X' or '.' under the header, with no blank or comment lines between them.`);
    else if (!icon.rows.some((r) => r.includes("X"))) fail(file, icon.line, `"${icon.name}" has no pixels. Draw it with 'X'.`);
    else if (!icon.bad) icons.push(icon);
    icon = null;
  };
  lines.forEach((text, i) => {
    const line = i + 1;
    const raw = text.trimEnd();
    if (raw.startsWith("@")) {
      close(line);
      const m = /^@\s+(\S+)(\s+thin)?(?:\s+tags:(.*))?$/.exec(raw);
      if (!m) return fail(file, line, `a header is '@ <kebab-name> tags: word, word' (or '@ <kebab-name> thin tags: …' for an icon allowed one-pixel lines), e.g. '@ heart tags: love, like, favourite'.`);
      const [, name, thin, tagText] = m;
      if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) fail(file, line, `"${name}" is not a kebab-case name (lower-case letters and digits, single hyphens). Try "${kebab(name)}".`);
      if (tagText === undefined || !tagText.trim()) fail(file, line, `"${name}" has no tags. Add a few words people would search for: '@ ${name} tags: word, word'.`);
      const tags = (tagText ?? "").split(",").map((t) => t.trim()).filter(Boolean);
      for (const t of tags) if (!/^[a-z0-9]+(?:[ -][a-z0-9]+)*$/.test(t)) fail(file, line, `the tag "${t}" of "${name}" should be lower-case words, e.g. "${kebab(t).replace(/-/g, " ")}".`);
      const dupes = tags.filter((t, j) => tags.indexOf(t) !== j);
      if (dupes.length) fail(file, line, `"${name}" lists the tag "${dupes[0]}" twice. Remove one.`);
      if (seen.has(name)) fail(file, line, `"${name}" is already drawn at ${seen.get(name)}. Names are unique across all files: rename one.`);
      else seen.set(name, `src/${file}:${line}`);
      icon = { name, category, tags, rows: [], line, file, thin: Boolean(thin) };
      return;
    }
    if (raw === "" || raw.startsWith("#")) return close(line);
    if (!icon) return fail(file, line, `expected an icon header ('@ <name> tags: word, word') or a '#' comment, found "${raw.slice(0, 24)}".`);
    const bad = [...raw].findIndex((c) => c !== "X" && c !== ".");
    if (icon.rows.length >= N) {
      if (icon.rows.length === N) {
        icon.bad = true;
        fail(file, line, bad >= 0
          ? `found "${raw.slice(0, 24)}" after the 12 rows of "${icon.name}". End the block with a blank line, or make it a '#' comment.`
          : `"${icon.name}" has more than 12 rows. An icon is exactly 12 x 12: remove a row, or start a new icon with a header.`);
      }
      icon.rows.push(raw);
      return;
    }
    if (bad >= 0) fail(file, line, `"${raw[bad]}" in "${icon.name}" (row ${icon.rows.length + 1}). Use 'X' for a pixel and '.' for empty.`, bad + 1);
    else if (raw.length !== N) fail(file, line, `row ${icon.rows.length + 1} of "${icon.name}" is ${raw.length} wide. Every row is exactly 12 ('X' or '.'): ${raw.length > N ? "remove" : "add"} ${Math.abs(raw.length - N)}.`);
    if (bad >= 0 || raw.length !== N) icon.bad = true;
    icon.rows.push(raw);
  });
  close(lines.length + 1);
}

// The chunky rules (docs/icons.md), so every icon reads at 24 px: every line is at least two pixels thick and no pixel
// stands alone. A one-pixel line is three or more pixels, side by side or corner to corner, that each have no pixel
// above and below them (a flat line) or none left and right (a steep one); a staircase of single pixels is both, and
// is reported once, as a diagonal. A lone pixel touches nothing on a side. A header that says 'thin' opts out.
for (const icon of icons) {
  if (icon.thin) continue;
  const ink = (y, x) => y >= 0 && y < N && x >= 0 && x < N && icon.rows[y][x] === "X";
  const flat = (y, x) => !ink(y - 1, x) && !ink(y + 1, x);
  const steep = (y, x) => !ink(y, x - 1) && !ink(y, x + 1);
  const reported = new Set();
  for (const [isThin, kind] of [[flat, "flat"], [steep, "steep"]]) {
    const seen = new Set();
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (!ink(y, x) || !isThin(y, x) || seen.has(y * N + x)) continue;
      const group = [], todo = [[y, x]];
      seen.add(y * N + x);
      while (todo.length) {
        const [cy, cx] = todo.pop();
        group.push([cy, cx]);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const ny = cy + dy, nx = cx + dx;
          if (ink(ny, nx) && isThin(ny, nx) && !seen.has(ny * N + nx)) { seen.add(ny * N + nx); todo.push([ny, nx]); }
        }
      }
      if (group.length < 3 || group.every(([gy, gx]) => reported.has(gy * N + gx))) continue;
      for (const [gy, gx] of group) reported.add(gy * N + gx);
      const [fy, fx] = group.sort((a, b) => a[0] - b[0] || a[1] - b[1])[0];
      const what = group.every(([gy, gx]) => flat(gy, gx) && steep(gy, gx)) ? "diagonal" : kind;
      fail(icon.file, icon.line + fy + 1, `"${icon.name}" has a one-pixel ${what} line, ${group.length} pixels long, from row ${fy + 1}, column ${fx + 1}. Every line is two pixels thick: thicken it, or cut it out of a solid shape. If it has to stay thin, say so in the header: '@ ${icon.name} thin tags: …'.`, fx + 1);
    }
  }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (ink(y, x) && flat(y, x) && steep(y, x) && !reported.has(y * N + x))
      fail(icon.file, icon.line + y + 1, `"${icon.name}" has a lone pixel at row ${y + 1}, column ${x + 1}: it touches no other pixel on a side, so it reads as dust. Join it to a neighbour or remove it.`, x + 1);
  }
}

if (!icons.length && !errors.length) errors.push({ order: 0, text: `src: no icons found. Add a category file such as src/actions.icons.` });
if (errors.length) {
  errors.sort((a, b) => a.order - b.order);
  console.error(`@blip/icons: ${errors.length} problem${errors.length > 1 ? "s" : ""} in the pixel maps:\n  ${errors.map((e) => e.text).join("\n  ")}`);
  process.exit(1);
}

function kebab(s) {
  return s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() || "icon";
}

// ------------------------------------------------------------------------------------------------------- trace

/**
 * The boundary of the pixels as directed unit edges with the inside on the right (clockwise on screen), linked into
 * loops. Where two pixels touch only at a corner the walk turns left, carrying on through the corner: a one-pixel
 * diagonal stays one outline (and one hole) instead of a run of separate squares, which halves the subpaths.
 */
function trace(rows) {
  const on = (x, y) => x >= 0 && y >= 0 && x < N && y < N && rows[y][x] === "X";
  const key = (x, y) => y * 64 + x;
  const out = new Map();
  const add = (x1, y1, x2, y2) => {
    const k = key(x1, y1);
    if (!out.has(k)) out.set(k, []);
    out.get(k).push([x2, y2]);
  };
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (!on(x, y)) continue;
      if (!on(x, y - 1)) add(x, y, x + 1, y);
      if (!on(x + 1, y)) add(x + 1, y, x + 1, y + 1);
      if (!on(x, y + 1)) add(x + 1, y + 1, x, y + 1);
      if (!on(x - 1, y)) add(x, y + 1, x, y);
    }
  }
  const loops = [];
  while (out.size) {
    // Start at the top-most, left-most vertex with one way out.
    let start = Infinity;
    for (const [k, list] of out) if (list.length === 1 && k < start) start = k;
    if (start === Infinity) start = Math.min(...out.keys());
    let x = start % 64, y = Math.floor(start / 64), dx = 0, dy = 0;
    const pts = [[x, y]];
    do {
      const k = key(x, y);
      const list = out.get(k);
      let i = 0;
      if (list.length > 1) {
        // Prefer a left turn: (dx, dy) turned left on screen is (dy, -dx).
        const l = list.findIndex(([nx, ny]) => nx - x === dy && ny - y === -dx);
        i = l >= 0 ? l : 0;
      }
      const [nx, ny] = list.splice(i, 1)[0];
      if (!list.length) out.delete(k);
      dx = nx - x;
      dy = ny - y;
      x = nx;
      y = ny;
      pts.push([x, y]);
    } while (key(x, y) !== start);
    // Keep the corners only, starting at the top-left one.
    pts.pop();
    const corners = pts.filter((p, i) => {
      const a = pts[(i - 1 + pts.length) % pts.length], b = pts[(i + 1) % pts.length];
      return (p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0]) !== 0;
    });
    let first = 0;
    corners.forEach((p, i) => { if (key(...p) < key(...corners[first])) first = i; });
    loops.push([...corners.slice(first), ...corners.slice(0, first)]);
  }
  loops.sort((a, b) => key(...a[0]) - key(...b[0]));
  return loops;
}

/** Shortest path data for the loops: absolute or relative per command, the closing side left to 'z'. */
function pathData(loops) {
  const pair = (a, b) => `${a}${b < 0 ? "" : " "}${b}`;
  const pick = (abs, rel) => (rel.length <= abs.length ? rel : abs);
  let d = "", cx = 0, cy = 0;
  for (const loop of loops) {
    const [sx, sy] = loop[0];
    d += d ? pick(`M${pair(sx, sy)}`, `m${pair(sx - cx, sy - cy)}`) : `M${pair(sx, sy)}`;
    for (let i = 1; i < loop.length; i++) {
      const [px, py] = loop[i - 1], [x, y] = loop[i];
      d += x !== px ? pick(`H${x}`, `h${x - px}`) : pick(`V${y}`, `v${y - py}`);
    }
    d += "z";
    cx = sx;
    cy = sy;
  }
  return d;
}

/** Reads path data back (M m H h V v z only) and fills the grid by both fill rules, to prove the trace. */
function rasterise(d) {
  const edges = [];
  let x = 0, y = 0, sx = 0, sy = 0;
  for (const [, cmd, args] of d.matchAll(/([MmHhVvZz])([^MmHhVvZz]*)/g)) {
    const n = (args.match(/-?\d+/g) ?? []).map(Number);
    const to = (nx, ny) => { if (nx === x) edges.push([x, y, ny]); x = nx; y = ny; };
    if (cmd === "M") { x = sx = n[0]; y = sy = n[1]; }
    else if (cmd === "m") { x = sx = x + n[0]; y = sy = y + n[1]; }
    else if (cmd === "H") to(n[0], y);
    else if (cmd === "h") to(x + n[0], y);
    else if (cmd === "V") to(x, n[0]);
    else if (cmd === "v") to(x, y + n[0]);
    else to(sx, sy);
  }
  const grid = (rule) => Array.from({ length: N }, (_, py) => Array.from({ length: N }, (_, px) => {
    let wind = 0, cross = 0;
    for (const [ex, y1, y2] of edges) {
      if (ex > px + 0.5 && Math.min(y1, y2) < py + 0.5 && Math.max(y1, y2) > py + 0.5) { wind += y2 > y1 ? 1 : -1; cross++; }
    }
    return (rule === "nonzero" ? wind !== 0 : cross % 2 === 1) ? "X" : ".";
  }).join(""));
  return { nonzero: grid("nonzero"), evenodd: grid("evenodd") };
}

const warnings = [];
for (const icon of icons) {
  const edge = icon.rows[0].includes("X") || icon.rows[N - 1].includes("X") || icon.rows.some((r) => r[0] === "X" || r[N - 1] === "X");
  if (edge) warnings.push(`src/${icon.file}:${icon.line}: "${icon.name}" touches the edge of the grid. Keep a one-pixel margin unless the shape cannot fit without it.`);
  icon.path = pathData(trace(icon.rows));
  const back = rasterise(icon.path);
  for (const rule of ["nonzero", "evenodd"]) {
    const bad = back[rule].findIndex((r, i) => r !== icon.rows[i]);
    if (bad >= 0) fail(icon.file, icon.line, `the traced path of "${icon.name}" does not fill row ${bad + 1} correctly with ${rule}. This is a bug in scripts/build.mjs.`);
  }
}
if (errors.length) {
  console.error(`@blip/icons: ${errors.map((e) => e.text).join("\n  ")}`);
  process.exit(1);
}

// -------------------------------------------------------------------------------------------------------- write

const byName = [...icons].sort((a, b) => (a.name < b.name ? -1 : 1));
const categories = [...new Set(icons.map((i) => i.category))].map((id) => ({ id, title: CATEGORIES[id] ?? id[0].toUpperCase() + id.slice(1).replace(/-/g, " ") }));
const pkg = JSON.parse(readFileSync(join(PKG, "package.json"), "utf8"));
const header = `@blip/icons ${pkg.version}: generated by scripts/build.mjs from src/*.icons. Do not edit. MIT licence.`;

rmSync(DIST, { recursive: true, force: true });
mkdirSync(join(DIST, "svg"), { recursive: true });
mkdirSync(join(PKG, "examples"), { recursive: true });

const attrs = `fill="currentColor" shape-rendering="crispEdges"`;
for (const i of icons) {
  writeFileSync(join(DIST, "svg", `${i.name}.svg`), `<svg xmlns="${SVG_NS}" viewBox="0 0 12 12" width="24" height="24" ${attrs}><path d="${i.path}"/></svg>\n`);
}

writeFileSync(
  join(DIST, "sprite.svg"),
  `<svg xmlns="${SVG_NS}">\n<!-- ${header} -->\n${byName.map((i) => `<symbol id="blip-icon-${i.name}" viewBox="0 0 12 12" ${attrs}><path d="${i.path}"/></symbol>`).join("\n")}\n</svg>\n`,
);

writeFileSync(
  join(DIST, "icons.json"),
  JSON.stringify({ version: pkg.version, grid: N, categories, icons: icons.map(({ name, category, tags, path }) => ({ name, category, tags, path })) }, null, 1) + "\n",
);

writeFileSync(
  join(DIST, "index.js"),
  `/* ${header} */

/** SVG path data for every icon, drawn on a 12 x 12 grid (viewBox "0 0 12 12"). Fill it with currentColor. */
export const icons = Object.freeze({
${byName.map((i) => `  "${i.name}": "${i.path}",`).join("\n")}
});

const escape = (s) => String(s).replace(/[&<>"]/g, (c) => \`&#\${c.charCodeAt(0)};\`);

/**
 * An <svg class="blip-icon"> string for one icon. Hidden from assistive technology unless it has a label, which makes
 * it an image with that name. size "lg" draws it 24 pixels square instead of 12.
 */
export function iconSvg(name, { label, size, class: className } = {}) {
  if (!Object.hasOwn(icons, name)) throw new RangeError(\`@blip/icons: there is no icon named "\${name}".\`);
  const px = size === "lg" ? 48 : 24;
  return \`<svg xmlns="${SVG_NS}" class="blip-icon\${className ? " " + escape(className) : ""}"\${size === "lg" ? ' data-size="lg"' : ""} viewBox="0 0 12 12" width="\${px}" height="\${px}" ${attrs} \${label ? \`role="img" aria-label="\${escape(label)}"\` : 'aria-hidden="true"'}><path d="\${icons[name]}"/></svg>\`;
}
`,
);

writeFileSync(
  join(DIST, "index.d.ts"),
  `/* ${header} */

/** The name of every Blip icon. */
export type IconName =
${byName.map((i) => `  | "${i.name}"`).join("\n")};

/** SVG path data for every icon, drawn on a 12 x 12 grid (viewBox "0 0 12 12"). Fill it with currentColor. */
export declare const icons: Readonly<Record<IconName, string>>;

export interface IconSvgOptions {
  /** Names the icon for assistive technology (role="img" and aria-label). Without it the icon is aria-hidden. */
  label?: string;
  /** "lg" draws the icon 24 pixels square (data-size="lg"); the default is 12. */
  size?: "md" | "lg";
  /** More classes, after "blip-icon". */
  class?: string;
}

/** An <svg class="blip-icon"> string for one icon. Throws a RangeError for a name that is not an icon. */
export declare function iconSvg(name: IconName, options?: IconSvgOptions): string;
`,
);

// The element: esbuild for the code (the icon data stays in index.js, shared), tsc for the types.
const { build } = await import("esbuild");
await build({
  entryPoints: [join(SRC, "element.ts")],
  outfile: join(DIST, "element.js"),
  bundle: true,
  format: "esm",
  target: "es2022",
  minify: true,
  legalComments: "none",
  banner: { js: `/* ${header} */` },
  plugins: [{ name: "shared-data", setup: (b) => b.onResolve({ filter: /^\.\/index\.js$/ }, () => ({ path: "./index.js", external: true })) }],
  logLevel: "warning",
});
execFileSync(process.execPath, [join(PKG, "../../node_modules/typescript/bin/tsc"), "-p", join(PKG, "tsconfig.json")], { stdio: "inherit", cwd: PKG });

writeFileSync(join(PKG, "examples", "icons.html"), examples());

// The docs list every icon by category between two markers; rewrite that part so it never drifts from src/.
const docs = join(PKG, "docs", "icons.md");
const doc = readFileSync(docs, "utf8");
const list = categories.map((c) => {
  const names = icons.filter((i) => i.category === c.id).map((i) => `\`${i.name}\``);
  return `**${c.title}** (${names.length}): ${names.join(", ")}.`;
}).join("\n\n");
const marked = doc.replace(/(<!-- icons:start[^>]*-->)[\s\S]*?(<!-- icons:end -->)/, `$1\n${list}\n$2`);
if (marked === doc && !doc.includes(list)) warnings.push(`docs/icons.md: the "<!-- icons:start -->" and "<!-- icons:end -->" markers are missing, so its category list was not updated.`);
writeFileSync(docs, marked);

// ------------------------------------------------------------------------------------------------------ report

const gz = (file) => gzipSync(readFileSync(file), { level: 9 }).length;
const svgBytes = icons.map((i) => readFileSync(join(DIST, "svg", `${i.name}.svg`)).length);
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
console.log(`@blip/icons: ${icons.length} icons in ${categories.length} categories`);
for (const c of categories) console.log(`  ${c.title.padEnd(28)} ${String(icons.filter((i) => i.category === c.id).length).padStart(3)}`);
console.log(`  index.js     ${kb(readFileSync(join(DIST, "index.js")).length)}, ${kb(gz(join(DIST, "index.js")))} gzip (all ${icons.length} paths)`);
console.log(`  sprite.svg   ${kb(readFileSync(join(DIST, "sprite.svg")).length)}, ${kb(gz(join(DIST, "sprite.svg")))} gzip`);
console.log(`  element.js   ${gz(join(DIST, "element.js"))} B gzip, without the data it imports from index.js${gz(join(DIST, "element.js")) > 3072 ? "  OVER THE 3 KB BUDGET" : ""}`);
console.log(`  svg/*.svg    ${Math.round(svgBytes.reduce((a, b) => a + b, 0) / svgBytes.length)} B on average (${Math.min(...svgBytes)} to ${Math.max(...svgBytes)})`);
if (warnings.length) console.warn(`  ${warnings.length} warning${warnings.length > 1 ? "s" : ""}:\n    ${warnings.join("\n    ")}`);

// ---------------------------------------------------------------------------------------------------- examples

function svg(name, { label, size, cls } = {}) {
  const i = icons.find((x) => x.name === name);
  if (!i) throw new Error(`examples: no icon "${name}"`);
  return `<svg class="blip-icon${cls ? ` ${cls}` : ""}"${size ? ` data-size="${size}"` : ""} viewBox="0 0 12 12" ${label ? `role="img" aria-label="${label}"` : `aria-hidden="true"`}><path d="${i.path}"/></svg>`;
}

function examples() {
  const p = (n) => `calc(${n} * var(--blip-pixel))`;
  const row = (inner, label) => `<div class="blip-example-icons-row">\n  <span class="blip-label blip-muted">${label}</span>\n  ${inner.join("\n  ")}\n</div>`;
  const button = (name, label, extra = "") => `<button class="blip-box blip-button" data-icon-only${extra} aria-label="${label}">${svg(name)}</button>`;
  const set = categories.map((c) => {
    const list = icons.filter((i) => i.category === c.id);
    return `<h3 class="blip-label blip-muted">${c.title} <span class="blip-caption">${list.length}</span></h3>
<ul class="blip-example-icons-set" role="list">
${list.map((i) => `  <li title="${i.name}: ${i.tags.join(", ")}">${svg(i.name)}<span>${i.name}</span></li>`).join("\n")}
</ul>`;
  });
  return `<!-- Icons: ${icons.length} on a 12 x 12 pixel grid. Generated by packages/icons/scripts/build.mjs from src/*.icons: edit those, then run the build. -->
<style>
  .blip-example-icons-row { display: flex; flex-wrap: wrap; align-items: center; gap: ${p(4)}; margin-block-end: ${p(8)}; }
  .blip-example-icons-row > .blip-label:first-child { inline-size: ${p(40)}; }
  .blip-example-icons-text { display: inline-flex; align-items: center; gap: ${p(2)}; margin-inline-end: ${p(6)}; }
  .blip-example-icons-set { display: grid; grid-template-columns: repeat(auto-fill, minmax(${p(44)}, 1fr)); gap: ${p(2)}; margin: ${p(4)} 0 ${p(12)}; padding: 0; list-style: none; }
  .blip-example-icons-set li { display: flex; flex-direction: column; align-items: center; gap: ${p(3)}; padding: ${p(4)} ${p(1)}; }
  .blip-example-icons-set span { font-size: var(--blip-size-caption); line-height: 1.2; color: var(--blip-text-muted); text-align: center; overflow-wrap: anywhere; }
</style>

${row([
  button("plus", "Add level"),
  button("edit", "Rename save", ' data-variant="soft"'),
  button("trash", "Delete save", ' data-tone="danger"'),
  button("heart", "Like", ' data-tone="pink"'),
  button("star", "Favourite", ' data-tone="purple"'),
  button("play", "Play", ' data-tone="success"'),
  button("settings", "Settings", ' data-tone="slate"'),
  button("search", "Search", ' data-variant="outline"'),
  button("more-horizontal", "More", ' data-variant="ghost"'),
  `<button class="blip-box blip-button" data-tone="success">${svg("check")}Saved</button>`,
  `<button class="blip-box blip-button" data-variant="soft">${svg("download")}Export</button>`,
  `<button class="blip-box blip-button" data-variant="outline">Next${svg("arrow-right")}</button>`,
  `<button class="blip-box blip-button" data-size="sm">${svg("plus")}New</button>`,
  `<button class="blip-box blip-button" data-size="lg" data-tone="warning">${svg("bolt")}Boost</button>`,
], "Buttons")}

${row([
  `<span class="blip-example-icons-text blip-body">${svg("success")}Saved to the cloud</span>`,
  `<span class="blip-example-icons-text blip-small" style="color: var(--blip-warning-text)">${svg("warning")}Low battery</span>`,
  `<span class="blip-example-icons-text blip-small" style="color: var(--blip-danger-text)">${svg("error")}Upload failed</span>`,
  `<span class="blip-example-icons-text blip-label">${svg("clock")}12:34</span>`,
  `<a class="blip-example-icons-text blip-small" href="#icons">Read the docs${svg("external")}</a>`,
], "In text")}

${row(["coin", "gem", "heart", "star", "key", "potion", "sword", "shield", "trophy", "rocket"].map((n) => svg(n, { size: "lg" })), "Large")}

${row([
  `<blip-icon name="heart" label="Liked"></blip-icon>`,
  `<blip-icon name="bell"></blip-icon>`,
  `<blip-icon name="wifi" label="Connected"></blip-icon>`,
  `<blip-icon name="battery-half" label="Battery half full"></blip-icon>`,
  `<blip-icon name="gamepad" data-size="lg"></blip-icon>`,
], "Element")}

${set.join("\n\n")}
`;
}
