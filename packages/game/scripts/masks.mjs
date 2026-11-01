#!/usr/bin/env node
// Prints the CSS masks for the glyphs drawn inside game components, made from the same pixel maps as the sprites, so
// a glyph and its sprite never drift apart. Paste the output into the component's CSS when a map changes.
//
//   pnpm --filter @blip/game build && node packages/game/scripts/masks.mjs
//
// For each glyph: "<name>-ink" is the whole silhouette, outline included (paint it ink, behind), and "<name>-fill" is
// everything inside the outline (paint it the glyph's colours, in front).
import { pixels, paths } from "../dist/_pixels.js";

const url = (rows, keep) => {
  const d = paths(rows.map((r) => [...r].map((c) => (keep(c) ? "x" : ".")).join(""))).get("x") ?? "";
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${rows[0].length} ${rows.length}' shape-rendering='crispEdges'%3E%3Cpath d='${d}'/%3E%3C/svg%3E")`;
};

/** The sprites' outline rule: ink on every clear pixel that touches the fill on a side. */
const outline = (fill) => {
  const at = (x, y) => (fill[y - 1]?.[x - 1] ?? ".") !== ".";
  return Array.from({ length: fill.length + 2 }, (_, y) => Array.from({ length: fill[0].length + 2 }, (_, x) =>
    at(x, y) ? "c" : at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1) ? "o" : ".").join(""));
};

// The D-pad: a plus with arms five pixels wide.
const dpad = outline(Array.from({ length: 13 }, (_, y) => Array.from({ length: 13 }, (_, x) => (x >= 4 && x <= 8) || (y >= 4 && y <= 8) ? "c" : ".").join("")));

const glyphs = { pointer: pixels("pointer"), arrow: pixels("arrow"), dpad };
for (const [name, rows] of Object.entries(glyphs)) {
  console.log(`/* ${name}: ${rows[0].length} x ${rows.length}\n${rows.map((r) => `   ${r}`).join("\n")} */`);
  console.log(`--_${name}-ink: ${url(rows, (c) => c !== ".")};`);
  console.log(`--_${name}-fill: ${url(rows, (c) => c !== "." && c !== "o")};\n`);
}
