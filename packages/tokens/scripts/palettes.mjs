#!/usr/bin/env node
// Writes the palettes (src/palettes/<id>.tokens.json) from their recipes, with palette.mjs: the same few numbers
// the docs' palette maker turns, or the colours a well-known theme starts from. Run it after changing a recipe, then
// build, which checks every one of them in every scheme.
//
// Usage: node scripts/palettes.mjs

import { mkdirSync, realpathSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, readTokens, formatProblems } from "./tokens.mjs";
import { makePalette, contrast } from "./palette.mjs";

/** The palettes. The first is Blip's own (the default); the rest are presets, in palettes.css. */
export const RECIPES = [
  {
    id: "candy", name: "Candy",
    description: "Blip's own: a blue Day, a pink Sunset, and a sky-blue Night on charcoal.",
    recipe: { hue: 228, lightness: 0.205 },
    // Day and Sunset keep their candies; only Night is worked out.
    keep: {
      "palette.day.accent": ["{candy.blue.base}", "{candy.blue.light}", "{candy.blue.shade}", "{tone.accent-day}"],
      "palette.sunset.accent": ["{candy.pink.base}", "{candy.pink.light}", "{candy.pink.shade}", "{tone.accent-sunset}"],
      "palette.day.warning": ["{candy.orange.base}", "{candy.orange.light}", "{candy.orange.shade}", "{tone.warning-light}"],
      "palette.sunset.warning": ["{candy.orange.base}", "{candy.orange.light}", "{candy.orange.shade}", "{tone.warning-light}"],
      "palette.night.warning": ["{candy.orange.base}", "{candy.orange.light}", "{candy.orange.shade}", "{candy.orange.light}"],
    },
  },
  {
    id: "grape", name: "Grape",
    description: "The TV's own Night: purple on deep indigo, and purple all day.",
    recipe: { accent: "#9166FF", bg: "#22244F" },
    keep: {
      "palette.day.accent": ["{candy.purple.base}", "{candy.purple.light}", "{candy.purple.shade}"],
      "palette.sunset.accent": ["{candy.purple.base}", "{candy.purple.light}", "{candy.purple.shade}"],
      "palette.night.accent": ["{candy.purple.base}", "{candy.purple.light}", "{candy.purple.shade}", "{tone.accent-night}"],
      "palette.night": { bg: "{deep.3}", "surface.base": "{deep.4}", "surface.raised": "{deep.5}", "surface.sunken": "{deep.2}", "text.base": "{tone.star}", "text.muted": "#C3BEEA", "line.base": "#8F89C8", "line.soft": "#45478A", ink: "#1A1530" },
      // The TV's night sky, as it was.
      "world.night": {
        "sky.1": "#3A3E7C", "sky.2": "#45478A", "sky.3": "#544F97", "sky.4": "#685AA2", "sky.5": "#7E64A8", "sky.6": "#9670AC",
        "cloud.light": "#8F89C8", "cloud.body": "#7B75B8", "cloud.shade": "#6A64A8",
        "mountain.lit": "#5B5A9E", "mountain.shadow": "#4E4D8F", "mountain.edge": "#6E6CB0", "snow.lit": "#C3BEEA", "snow.shadow": "#9893CF",
        "tree.lit": "#4E6E92", "tree.shadow": "#42607F", "hill.mid": "#58779A", "hill.mid-edge": "#678AA9", "hill.near": "#4F7887", "hill.near-edge": "#5F8B98", "hill.bush": "#466C7A",
        "grass.base": "#4F8B72", "grass.top": "#66A387", "grass.lip": "#417A62", "dirt.base": "#7D6175", "dirt.shadow": "#6D5367", "dirt.pebble": "#907388", bird: "#6C6A9E",
      },
    },
  },
  { id: "ember", name: "Ember", description: "Soft orange on charcoal. Warnings turn amber, so they never look like the main button.", recipe: { hue: 55, lightness: 0.235 } },
  { id: "azure", name: "Azure", description: "Blue on a dusk tinted blue.", recipe: { hue: 250, lightness: 0.235, tint: 0.028 } },
  { id: "mint", name: "Mint", description: "Mint on ash, with a touch of green in the dark.", recipe: { hue: 165, lightness: 0.235, tint: 0.012 } },
  { id: "bubblegum", name: "Bubblegum", description: "Pink on a dusk tinted pink.", recipe: { hue: 345, lightness: 0.235, tint: 0.028 } },
  { id: "dracula", name: "Dracula", description: "Purple on Dracula's blue-grey, with its near-white text.", credit: "After Dracula by Zeno Rocha (MIT), draculatheme.com", recipe: { accent: "#BD93F9", bg: "#282A36", text: "#F8F8F2", muted: "#6272A4" } },
  { id: "nord", name: "Nord", description: "Nord's frost blue on its polar night.", credit: "After Nord by Arctic Ice Studio (MIT), nordtheme.com", recipe: { accent: "#88C0D0", bg: "#2E3440", text: "#ECEFF4" } },
  { id: "catppuccin", name: "Catppuccin", description: "Mocha's mauve on its deep base, with lavender text.", credit: "After Catppuccin Mocha (MIT), catppuccin.com", recipe: { accent: "#CBA6F7", bg: "#1E1E2E", text: "#CDD6F4", muted: "#A6ADC8" } },
  { id: "gruvbox", name: "Gruvbox", description: "Gruvbox's blue on its warm charcoal, with cream text.", credit: "After Gruvbox by Pavel Pertsev (MIT)", recipe: { accent: "#83A598", lightness: 0.277, tint: 0.008, baseHue: 60, text: "#EBDBB2", muted: "#A89984" } },
  { id: "tokyo-night", name: "Tokyo Night", description: "Tokyo Night's blue on its ink-blue dark.", credit: "After Tokyo Night by enkia (MIT)", recipe: { accent: "#7AA2F7", bg: "#1A1B26", text: "#C0CAF5", muted: "#A9B1D6" } },
  { id: "rose-pine", name: "Rosé Pine", description: "Rosé Pine's rose on its deep pine-purple.", credit: "After Rosé Pine (MIT), rosepinetheme.com", recipe: { accent: "#EBBCBA", bg: "#191724", text: "#E0DEF4", muted: "#908CAA" } },
];

/** What a palette must read on, from the tokens as they are. */
export function sceneOf(model) {
  const hex = (scheme, path) => {
    const v = model.resolved[scheme].find((t) => t.path === path).resolved;
    return (v.hex ?? "#" + v.components.map((c) => Math.round(c * 255).toString(16).padStart(2, "0")).join("")).toUpperCase();
  };
  const surfaces = (s) => ["bg", "surface.base", "surface.raised"].map((p) => hex(s, p));
  return {
    ink: hex("day", "ink.base"),
    warning: hex("day", "warning.base"),
    day: surfaces("day"),
    sunset: surfaces("sunset"),
    night: { text: ["info.text", "success.text", "warning.text", "danger.text", "link.visited"].map((p) => hex("night", p)) },
  };
}

const ROLES = ["base", "light", "shade", "text"];
const srgb = (hex) => ({ colorSpace: "srgb", components: [1, 3, 5].map((i) => Math.round((parseInt(hex.slice(i, i + 2), 16) / 255) * 10000) / 10000), hex });

/** A palette's token file: its recipe worked out, what it keeps laid over that, as nested DTCG tokens. */
export function paletteFile({ id, name, description, credit, recipe, keep = {} }, scene) {
  const flat = makePalette(recipe, scene);
  for (const [group, value] of Object.entries(keep)) {
    if (Array.isArray(value)) value.forEach((v, i) => (flat[`${group}.${ROLES[i]}`] = v));
    else for (const [k, v] of Object.entries(value)) flat[`${group}.${k}`] = v;
  }
  const tree = {
    $schema: "https://www.designtokens.org/schemas/2025.10/format.json",
    $description: description,
    $extensions: { blip: { name, ...(credit ? { credit } : {}) } },
    $type: "color",
  };
  for (const [path, v] of Object.entries(flat).sort(([a], [b]) => order(a) - order(b) || a.localeCompare(b, "en", { numeric: true }))) {
    const keys = path.split(".");
    let node = tree;
    for (const k of keys.slice(0, -1)) node = node[k] ??= {};
    node[keys.at(-1)] = { $value: v.startsWith("{") ? v : srgb(v) };
  }
  tree.palette.$description = "The accent of each time of day, the warning, and Night's page, text, lines and ink. The scheme roles read these.";
  tree.world.night.$description = "The night sky and ground in this palette.";
  return tree;
}
const order = (path) => ["palette.day", "palette.sunset", "palette.night", "world"].findIndex((p) => path.startsWith(p));

// Run as a script (not imported by a test or the docs).
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const model = readTokens();
  if (model.problems.some((p) => !p.code.startsWith("BLIP-T06"))) {
    process.stderr.write(formatProblems(model.problems));
    process.exit(1);
  }
  const scene = sceneOf(model);
  const dir = join(ROOT, "src/palettes");
  mkdirSync(dir, { recursive: true });
  for (const r of RECIPES) {
    writeFileSync(join(dir, `${r.id}.tokens.json`), JSON.stringify(paletteFile(r, scene), null, 2) + "\n");
    const flat = makePalette(r.recipe, scene);
    console.log(`${r.id.padEnd(12)} night ${flat["palette.night.bg"]}  accent ${flat["palette.night.accent.base"]}  label ${contrast(flat["palette.night.ink"], flat["palette.night.accent.base"]).toFixed(1)}:1`);
  }
  console.log(`Wrote ${RECIPES.length} palettes to src/palettes. Build to check them.`);
}
