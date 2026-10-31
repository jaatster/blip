#!/usr/bin/env node
// Builds Blip's tokens from the W3C DTCG 2025.10 sources and resolver: validates them, checks contrast, and
// writes CSS, JSON, JS/TS, Android, iOS and Figma outputs. No dependencies.
//
// Usage: node scripts/build.mjs [--check]   (--check validates and checks contrast without writing)

import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const CHECK_ONLY = process.argv.includes("--check");
const NS = "blip";

// ------------------------------------------------------------------ errors

const problems = [];
/** Records a problem with where it is and how to fix it; the build fails at the end if there are any. */
function problem(code, file, pointer, message, fix) {
  problems.push({ code, file: relative(ROOT, file), pointer, message, fix });
}
function failIfProblems() {
  if (!problems.length) return;
  console.error(`\nBlip tokens: ${problems.length} problem${problems.length > 1 ? "s" : ""}\n`);
  for (const p of problems) {
    console.error(`  ${p.code}  ${p.file}${p.pointer ? ` at ${p.pointer}` : ""}\n    ${p.message}\n    Fix: ${p.fix}\n`);
  }
  process.exit(1);
}

// ------------------------------------------------------------------ resolver

const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    problem("PP-T001", file, "", `Could not read JSON: ${e.message}`, "Check the file exists and is valid JSON.");
    return {};
  }
};

const RESOLVER_FILE = join(ROOT, "blip.resolver.json");
const resolver = readJson(RESOLVER_FILE);
if (resolver.version !== "2025.10") {
  problem("PP-T002", RESOLVER_FILE, "/version", `Resolver version is "${resolver.version}".`, 'Set "version": "2025.10".');
}

/** Loads a source (a $ref to a file, or inline tokens) and remembers which file each token came from. */
function loadSource(src) {
  if (src.$ref) {
    const file = join(ROOT, src.$ref);
    return { file, tokens: readJson(file) };
  }
  return { file: RESOLVER_FILE, tokens: src };
}
function sourcesOf(item) {
  if (item.$ref?.startsWith("#/sets/")) return resolver.sets[item.$ref.slice(7)].sources;
  return item.sources ?? [];
}
const MODIFIERS = resolver.modifiers ?? {};
for (const [name, m] of Object.entries(MODIFIERS)) {
  const n = Object.keys(m.contexts ?? {}).length;
  if (n < 2) problem("PP-T003", RESOLVER_FILE, `/modifiers/${name}`, `Modifier "${name}" has ${n} context(s).`, "Give it at least two contexts, or make it a set.");
  if (m.default && !(m.default in m.contexts)) problem("PP-T004", RESOLVER_FILE, `/modifiers/${name}/default`, `Default "${m.default}" is not a context.`, `Use one of: ${Object.keys(m.contexts).join(", ")}.`);
}

/** Merges the resolution order for one input, e.g. { scheme: "night", pixel: "2" }. Later sources win. */
function resolveInput(input) {
  const merged = {};
  const origin = new Map(); // token path -> file
  const mergeInto = (target, src, file, path) => {
    for (const [k, v] of Object.entries(src)) {
      if (k === "$schema") continue;
      const p = path ? `${path}.${k}` : k;
      if (v && typeof v === "object" && !Array.isArray(v) && !("$value" in v) && !k.startsWith("$")) {
        target[k] ??= {};
        mergeInto(target[k], v, file, p);
      } else {
        target[k] = v;
        if (!k.startsWith("$")) origin.set(p, file);
      }
    }
  };
  for (const item of resolver.resolutionOrder ?? []) {
    let sources;
    if (item.$ref?.startsWith("#/modifiers/")) {
      const name = item.$ref.slice(12);
      const m = MODIFIERS[name];
      sources = m.contexts[input[name] ?? m.default] ?? [];
    } else sources = sourcesOf(item);
    for (const s of sources) {
      const { file, tokens } = loadSource(s);
      mergeInto(merged, tokens, file, "");
    }
  }
  return { tree: merged, origin };
}

// ------------------------------------------------------------------ flatten and validate

const TYPES = new Set(["color", "dimension", "duration", "number", "fontFamily", "fontWeight", "cubicBezier"]);
const NAME_RE = /^[^${}.][^{}.]*$/;

/** Walks a token tree into a flat list, inheriting $type from groups. */
function flatten(tree, origin) {
  const out = [];
  const walk = (node, path, type) => {
    const t = node.$type ?? type;
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith("$")) continue;
      const p = path ? `${path}.${k}` : k;
      if (!NAME_RE.test(k)) {
        problem("PP-T010", origin.get(p) ?? RESOLVER_FILE, `/${p.replaceAll(".", "/")}`, `"${k}" is not a valid token name.`, "Names may not start with $ or contain {, } or a dot.");
        continue;
      }
      if (v && typeof v === "object" && "$value" in v) out.push({ path: p, type: v.$type ?? t, value: v.$value, description: v.$description, ext: v.$extensions?.[NS], file: origin.get(p) });
      else if (v && typeof v === "object") walk(v, p, t);
    }
  };
  walk(tree, "", undefined);
  return out;
}

const HEX_RE = /^#[0-9A-F]{6}$/i;
function validate(tok) {
  const at = `/${tok.path.replaceAll(".", "/")}`;
  const file = tok.file ?? RESOLVER_FILE;
  if (!tok.type) return problem("PP-T020", file, at, `Token "${tok.path}" has no $type.`, "Add $type to the token or its group.");
  if (!TYPES.has(tok.type)) return problem("PP-T021", file, at, `Unknown $type "${tok.type}".`, `Use one of: ${[...TYPES].join(", ")}.`);
  const v = tok.value;
  if (typeof v === "string" && v.startsWith("{")) return; // alias, checked when resolving
  switch (tok.type) {
    case "color":
      if (v?.colorSpace !== "srgb" || !Array.isArray(v.components) || v.components.length !== 3) problem("PP-T030", file, at, "A colour must be { colorSpace: \"srgb\", components: [r, g, b], hex }.", "Write the colour in the 2025.10 object form.");
      else if (v.hex && !HEX_RE.test(v.hex)) problem("PP-T031", file, at, `"${v.hex}" is not a 6-digit hex colour.`, "Use #RRGGBB.");
      else if (v.hex) {
        const fromHex = hexToRgb(v.hex).map((c) => c / 255);
        if (fromHex.some((c, i) => Math.abs(c - v.components[i]) > 0.002)) problem("PP-T032", file, at, `hex ${v.hex} and components [${v.components}] disagree.`, "Regenerate the components from the hex.");
      }
      break;
    case "dimension":
      if (typeof v?.value !== "number" || !["px", "rem"].includes(v.unit)) problem("PP-T040", file, at, "A dimension must be { value: number, unit: \"px\" | \"rem\" }.", "Fix the value.");
      break;
    case "duration":
      if (typeof v?.value !== "number" || !["ms", "s"].includes(v.unit)) problem("PP-T041", file, at, "A duration must be { value: number, unit: \"ms\" | \"s\" }.", "Fix the value.");
      break;
    case "number":
      if (typeof v !== "number") problem("PP-T042", file, at, "A number token needs a number.", "Fix the value.");
      else if (tok.ext?.unit === "pixel" && !Number.isInteger(v)) problem("PP-T043", file, at, `${v} pixels is off the grid.`, "Pixel sizes are whole numbers: every pixel is the same size.");
      break;
    case "fontFamily":
      if (!(typeof v === "string" || (Array.isArray(v) && v.every((s) => typeof s === "string")))) problem("PP-T044", file, at, "A font family is a string or an array of strings.", "Fix the value.");
      break;
    case "fontWeight":
      if (!(typeof v === "number" && v >= 1 && v <= 1000)) problem("PP-T045", file, at, "A font weight is a number from 1 to 1000.", "Fix the value.");
      break;
  }
}

/** Resolves aliases ({a.b}) to their final values, catching missing targets and cycles. */
function resolveAliases(tokens) {
  const byPath = new Map(tokens.map((t) => [t.path, t]));
  const resolveOne = (t, seen) => {
    if (!(typeof t.value === "string" && t.value.startsWith("{"))) return t;
    const ref = t.value.slice(1, -1);
    if (seen.has(ref)) {
      problem("PP-T050", t.file, `/${t.path.replaceAll(".", "/")}`, `Alias cycle: ${[...seen, ref].join(" -> ")}.`, "Point one of these at a real value.");
      return t;
    }
    const target = byPath.get(ref);
    if (!target) {
      problem("PP-T051", t.file, `/${t.path.replaceAll(".", "/")}`, `"${t.path}" points at "{${ref}}", which does not exist.`, "Fix the path, or add the token it points at.");
      return t;
    }
    const final = resolveOne(target, new Set([...seen, ref]));
    if (final.type && t.type && final.type !== t.type) problem("PP-T052", t.file, `/${t.path.replaceAll(".", "/")}`, `"${t.path}" is a ${t.type} but points at a ${final.type}.`, "Point it at a token of the same type.");
    return final;
  };
  for (const t of tokens) {
    const final = resolveOne(t, new Set([t.path]));
    t.alias = typeof t.value === "string" && t.value.startsWith("{") ? t.value.slice(1, -1) : undefined;
    t.resolved = final.value;
    t.type ??= final.type;
    t.ext ??= final.ext;
  }
  return tokens;
}

// ------------------------------------------------------------------ colour maths

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
const hexOf = (v) => (v.hex ?? "#" + v.components.map((c) => Math.round(c * 255).toString(16).padStart(2, "0")).join("")).toUpperCase();
function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// ------------------------------------------------------------------ build every input

const schemes = Object.keys(MODIFIERS.scheme.contexts);
const pixels = Object.keys(MODIFIERS.pixel.contexts);
const DEFAULT = { scheme: MODIFIERS.scheme.default, pixel: MODIFIERS.pixel.default };

const resolved = {};
for (const scheme of schemes) {
  const { tree, origin } = resolveInput({ ...DEFAULT, scheme });
  const tokens = flatten(tree, origin);
  tokens.forEach(validate);
  resolved[scheme] = resolveAliases(tokens);
}
const pixelValues = Object.fromEntries(pixels.map((p) => {
  const { tree } = resolveInput({ ...DEFAULT, pixel: p });
  return [p, tree.pixel.$value.value];
}));
failIfProblems();

// Which paths come from the scheme files (they change with the scheme); everything else is shared.
const schemePaths = new Set();
for (const scheme of schemes) {
  const file = join(ROOT, MODIFIERS.scheme.contexts[scheme][0].$ref);
  flatten(readJson(file), new Map()).forEach((t) => schemePaths.add(t.path));
}
const base = resolved[DEFAULT.scheme];
const shared = base.filter((t) => !schemePaths.has(t.path) && t.path !== "pixel");
const roles = (scheme) => resolved[scheme].filter((t) => schemePaths.has(t.path));
const colorScheme = (scheme) => readJson(join(ROOT, MODIFIERS.scheme.contexts[scheme][0].$ref)).$extensions?.[NS]?.colorScheme ?? "light";

// ------------------------------------------------------------------ contrast gate

const roleHex = (scheme) => Object.fromEntries(roles(scheme).map((t) => [t.path, hexOf(t.resolved)]));
const PAIRS = [];
const surfaces = ["bg", "surface.base", "surface.raised", "surface.sunken", "surface.panel"];
for (const s of surfaces) PAIRS.push(["text.base", s, 4.5], ["text.muted", s, 4.5]);
for (const intent of ["accent", "info", "success", "warning", "danger"]) {
  for (const s of ["bg", "surface.base", "surface.raised"]) PAIRS.push([`${intent}.text`, s, 4.5]);
  PAIRS.push([`${intent}.on`, `${intent}.base`, 4.5], [`${intent}.on`, `${intent}.light`, 4.5]);
}
for (const s of ["bg", "surface.base"]) PAIRS.push(["link.visited", s, 4.5]);
PAIRS.push(["line.base", "bg", 3], ["line.base", "surface.base", 3], ["selection.text", "selection.bg", 4.5], ["text.inverse", "text.base", 4.5]);

const report = [];
for (const scheme of schemes) {
  const c = roleHex(scheme);
  for (const [fg, bg, min] of PAIRS) {
    const ratio = contrast(c[fg], c[bg]);
    report.push({ scheme, fg, bg, ratio, min });
    if (ratio < min) problem("PP-T060", MODIFIERS.scheme.contexts[scheme][0].$ref, `/${fg.replaceAll(".", "/")}`, `${scheme}: ${fg} ${c[fg]} on ${bg} ${c[bg]} is ${ratio.toFixed(2)}:1; it needs ${min}:1.`, "Darken or lighten one of the two in this scheme (WCAG 2.2 AA).");
  }
  // The focus ring is yellow with an ink edge: one of them must stand 3:1 against the page.
  const ring = Math.max(contrast(c["focus.base"], c.bg), contrast(c["focus.edge"], c.bg));
  report.push({ scheme, fg: "focus ring", bg: "bg", ratio: ring, min: 3 });
  if (ring < 3) problem("PP-T061", MODIFIERS.scheme.contexts[scheme][0].$ref, "/focus", `${scheme}: the focus ring is ${ring.toFixed(2)}:1 against the page.`, "Change the scheme's page colour or the ring's edge.");
}
failIfProblems();

// Plain candies (data-tone="teal" and so on) take ink labels, slate takes white: check them on every band.
{
  const hex = (path) => hexOf(base.find((t) => t.path === path).resolved);
  const candies = Object.keys(readJson(join(ROOT, "src/primitives/color.tokens.json")).candy).filter((k) => !k.startsWith("$"));
  for (const c of candies) for (const band of ["base", "light"]) {
    const label = c === "slate" ? "white" : "ink.base";
    const ratio = contrast(hex(label), hex(`candy.${c}.${band}`));
    report.push({ scheme: "all", fg: label, bg: `candy.${c}.${band}`, ratio, min: 4.5 });
    if (ratio < 4.5) problem("PP-T062", "src/primitives/color.tokens.json", `/candy/${c}/${band}`, `${label} on candy ${c} ${band} is ${ratio.toFixed(2)}:1; it needs 4.5:1.`, "Adjust the candy, or give it a different label colour in box.css.");
  }
  failIfProblems();
}
const weakest = [...report].sort((a, b) => a.ratio / a.min - b.ratio / b.min).slice(0, 5);
console.log(`Contrast: ${report.length} pairs pass in ${schemes.length} schemes. Closest to the line:`);
for (const r of weakest) console.log(`  ${r.scheme.padEnd(7)} ${r.fg} on ${r.bg}: ${r.ratio.toFixed(2)}:1 (needs ${r.min})`);
if (CHECK_ONLY) process.exit(0);

// ------------------------------------------------------------------ naming

/** candy.red.base -> candy-red; surface.base -> surface; world.day.sky.1 -> world-day-sky-1 */
const kebab = (path) => path.split(".").filter((p, i, a) => !(p === "base" && i === a.length - 1)).join("-");
const cssVar = (path) => `--pp-${kebab(path)}`;
const camel = (path) => kebab(path).replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase()).replace(/^(\d)/, "_$1");
const pascal = (path) => { const c = camel(path); return c.charAt(0).toUpperCase() + c.slice(1); };
const isPixelNumber = (t) => t.type === "number" && t.ext?.unit === "pixel";

function cssValue(t) {
  if (t.alias && !isPixelNumber(t)) return `var(${cssVar(t.alias)})`;
  const v = t.resolved;
  switch (t.type) {
    case "color": return hexOf(v);
    case "dimension": return `${v.value}${v.unit}`;
    case "duration": return `${v.value}${v.unit}`;
    case "number": return isPixelNumber(t) ? `calc(${v} * var(--pp-pixel))` : String(v);
    case "fontFamily": return (Array.isArray(v) ? v : [v]).map((f) => (/^[a-z-]+$/.test(f) ? f : `"${f}"`)).join(", ");
    case "fontWeight": return String(v);
    case "cubicBezier": return `cubic-bezier(${v.join(", ")})`;
  }
  return String(v);
}
const decls = (list, indent = "    ") => list.map((t) => `${indent}${cssVar(t.path)}: ${cssValue(t)};`).join("\n");

// ------------------------------------------------------------------ outputs

rmSync(DIST, { recursive: true, force: true });
const out = (file, text) => {
  const f = join(DIST, file);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, text);
};
const HEADER = "Blip tokens. Generated by packages/tokens/scripts/build.mjs from the DTCG sources: do not edit.";

// CSS ----------------------------------------------------------------
{
  const pixelDerived = shared.filter(isPixelNumber);
  const fixed = shared.filter((t) => !isPixelNumber(t));
  const durations = shared.filter((t) => t.type === "duration" && t.path.startsWith("duration."));
  const schemeBlock = (scheme) => `${decls(roles(scheme))}\n    --pp-scheme: ${scheme};\n    color-scheme: ${colorScheme(scheme)};`;
  // Only the roles that fade when Auto changes the time of day are registered (base.css lists them).
  const FADES = /^(bg|surface\.|text\.|line\.|accent\.(base|light|shade|text)$)/;
  const props = roles(DEFAULT.scheme).filter((t) => t.type === "color" && FADES.test(t.path)).map((t) =>
    `@property ${cssVar(t.path)} { syntax: "<color>"; inherits: true; initial-value: ${hexOf(t.resolved)}; }`).join("\n");
  const css = `/* ${HEADER} */
@layer pp.reset, pp.tokens, pp.base, pp.core, pp.components, pp.kits, pp.utilities;

/* Scheme colours are registered so a change of scheme can step through the palettes (see data-pp-scheme-fade). */
${props}

@layer pp.tokens {
  :root {
    --pp-pixel: ${pixelValues[DEFAULT.pixel]}px;
${decls(fixed)}
  }

  /* Sizes counted in pixels. Declared wherever the pixel can change, so a section with data-pp-pixel scales. */
  :root, [data-pp-pixel] {
${decls(pixelDerived)}
  }
${pixels.map((p) => `  [data-pp-pixel="${p}"] { --pp-pixel: ${pixelValues[p]}px; }`).join("\n")}

  /* Schemes. Day is the default; the device's dark mode picks Night until a scheme is set. */
  :root, [data-pp-scheme="${DEFAULT.scheme}"] {
${schemeBlock(DEFAULT.scheme)}
  }
${schemes.filter((s) => s !== DEFAULT.scheme).map((s) => `  [data-pp-scheme="${s}"] {\n${schemeBlock(s)}\n  }`).join("\n")}
  @media (prefers-color-scheme: dark) {
    :root:not([data-pp-scheme]) {
${decls(roles("night"), "      ")}
      --pp-scheme: night;
      color-scheme: dark;
    }
  }

  /* Reduced motion: every move is instant. */
  @media (prefers-reduced-motion: reduce) {
    :root {
${durations.map((t) => `      ${cssVar(t.path)}: 0ms;`).join("\n")}
    }
  }
}
`;
  out("css/tokens.css", css);
}

// JSON ---------------------------------------------------------------
const plain = (t) => {
  const v = t.resolved;
  switch (t.type) {
    case "color": return hexOf(v);
    case "dimension": case "duration": return v.value;
    default: return v;
  }
};
const flat = (list) => Object.fromEntries(list.map((t) => [kebab(t.path), plain(t)]));
const json = {
  pixel: pixelValues,
  shared: flat(shared),
  schemes: Object.fromEntries(schemes.map((s) => [s, flat(roles(s))])),
};
out("json/tokens.json", JSON.stringify(json, null, 2) + "\n");
out("json/manifest.json", JSON.stringify(
  base.map((t) => ({ name: kebab(t.path), path: t.path, cssVar: cssVar(t.path), type: t.type, unit: t.ext?.unit, alias: t.alias, description: t.description, scheme: schemePaths.has(t.path) })), null, 2) + "\n");

// JS / TS ------------------------------------------------------------
{
  const sharedNames = shared.map((t) => kebab(t.path));
  const roleNames = roles(DEFAULT.scheme).map((t) => kebab(t.path));
  out("js/index.js", `// ${HEADER}
export const pixel = ${JSON.stringify(pixelValues)};
export const shared = ${JSON.stringify(json.shared, null, 2)};
export const schemes = ${JSON.stringify(json.schemes, null, 2)};
export const schemeNames = ${JSON.stringify(schemes)};
/** The CSS custom property for a token: cssVar("surface") is "var(--pp-surface)". */
export const cssVar = (name) => \`var(--pp-\${name})\`;
/** A size counted in pixels, in CSS px at a pixel size: px("space-4", 2) is 8. */
export const px = (name, size = ${pixelValues[DEFAULT.pixel]}) => shared[name] * size;
`);
  out("js/index.d.ts", `// ${HEADER}
export type SchemeName = ${schemes.map((s) => JSON.stringify(s)).join(" | ")};
export type PixelSize = ${pixels.join(" | ")};
export type SharedToken = ${sharedNames.map((n) => JSON.stringify(n)).join(" | ")};
export type RoleToken = ${roleNames.map((n) => JSON.stringify(n)).join(" | ")};
export type TokenName = SharedToken | RoleToken;
export type PixelToken = ${shared.filter(isPixelNumber).map((t) => JSON.stringify(kebab(t.path))).join(" | ")};
export declare const pixel: Record<\`\${PixelSize}\`, number>;
export declare const shared: Record<SharedToken, string | number | string[]>;
export declare const schemes: Record<SchemeName, Record<RoleToken, string>>;
export declare const schemeNames: SchemeName[];
export declare function cssVar(name: TokenName): string;
export declare function px(name: PixelToken, size?: PixelSize): number;
`);
}

// Android (Compose + XML) --------------------------------------------
{
  const argb = (hex) => `0xFF${hex.slice(1)}`;
  const colorsShared = shared.filter((t) => t.type === "color");
  const kt = `// ${HEADER}
package blip.tokens

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

object BlipTokens {
    /** The default Blip pixel, in dp. Sizes are whole numbers of pixels. */
    val Pixel: Dp = ${pixelValues[DEFAULT.pixel]}.dp

    /** A size counted in pixels, at a pixel size in dp. */
    fun px(pixels: Int, pixel: Dp = Pixel): Dp = pixel * pixels

    object Colors {
${colorsShared.map((t) => `        val ${pascal(t.path)} = Color(${argb(hexOf(t.resolved))})`).join("\n")}
    }

    class Scheme(
${roles(DEFAULT.scheme).map((t) => `        val ${camel(t.path)}: Color,`).join("\n")}
    )

${schemes.map((s) => `    val ${s.charAt(0).toUpperCase() + s.slice(1)} = Scheme(\n${roles(s).map((t) => `        ${camel(t.path)} = Color(${argb(hexOf(t.resolved))}),`).join("\n")}\n    )`).join("\n\n")}

    object Size {
${shared.filter(isPixelNumber).map((t) => `        const val ${pascal(t.path)} = ${t.resolved} // pixels`).join("\n")}
    }

    object Duration {
${shared.filter((t) => t.type === "duration").map((t) => `        const val ${pascal(t.path)} = ${t.resolved.value}L // ms`).join("\n")}
    }
}
`;
  out("android/BlipTokens.kt", kt);
  const xml = (list) => `<?xml version="1.0" encoding="utf-8"?>\n<!-- ${HEADER} -->\n<resources>\n${list.map((t) => `    <color name="pp_${kebab(t.path).replaceAll("-", "_")}">${hexOf(t.resolved)}</color>`).join("\n")}\n</resources>\n`;
  out("android/res/values/blip_colors.xml", xml([...colorsShared, ...roles("day")]));
  out("android/res/values-night/blip_colors.xml", xml(roles("night")));
  out("android/res/values/blip_dimens.xml", `<?xml version="1.0" encoding="utf-8"?>\n<!-- ${HEADER} -->\n<resources>\n${shared.filter(isPixelNumber).map((t) => `    <dimen name="pp_${kebab(t.path).replaceAll("-", "_")}">${t.resolved * pixelValues[DEFAULT.pixel]}dp</dimen>`).join("\n")}\n</resources>\n`);
}

// iOS (SwiftUI) ------------------------------------------------------
{
  const swiftColor = (hex) => `Color(blipHex: 0x${hex.slice(1)})`;
  const sw = `// ${HEADER}
import SwiftUI

public enum BlipTokens {
    /// The default Blip pixel, in points. Sizes are whole numbers of pixels.
    public static let pixel: CGFloat = ${pixelValues[DEFAULT.pixel]}

    /// A size counted in pixels, at a pixel size in points.
    public static func px(_ pixels: Int, pixel: CGFloat = pixel) -> CGFloat { CGFloat(pixels) * pixel }

    public enum Colors {
${shared.filter((t) => t.type === "color").map((t) => `        public static let ${camel(t.path)} = ${swiftColor(hexOf(t.resolved))}`).join("\n")}
    }

    public struct Scheme {
${roles(DEFAULT.scheme).map((t) => `        public let ${camel(t.path)}: Color`).join("\n")}
    }

${schemes.map((s) => `    public static let ${s} = Scheme(\n${roles(s).map((t, i, a) => `        ${camel(t.path)}: ${swiftColor(hexOf(t.resolved))}${i < a.length - 1 ? "," : ""}`).join("\n")}\n    )`).join("\n\n")}

    public enum Size {
${shared.filter(isPixelNumber).map((t) => `        public static let ${camel(t.path)} = ${t.resolved} // pixels`).join("\n")}
    }

    public enum Duration {
${shared.filter((t) => t.type === "duration").map((t) => `        public static let ${camel(t.path)}: Double = ${t.resolved.value / 1000}`).join("\n")}
    }
}

extension Color {
    init(blipHex hex: UInt32) {
        self.init(red: Double((hex >> 16) & 0xFF) / 255, green: Double((hex >> 8) & 0xFF) / 255, blue: Double(hex & 0xFF) / 255)
    }
}
`;
  out("ios/BlipTokens.swift", sw);
}

// Figma variables ----------------------------------------------------
{
  const rgba = (hex) => { const [r, g, b] = hexToRgb(hex); return { r: r / 255, g: g / 255, b: b / 255, a: 1 }; };
  const slash = (path) => kebab(path).replaceAll("-", "/").replace(/\/(\d)/g, "/$1");
  const figma = {
    collections: [
      { name: "Primitives", modes: ["Value"], variables: shared.filter((t) => t.type === "color").map((t) => ({ name: path2figma(t.path), type: "COLOR", description: t.description, values: { Value: rgba(hexOf(t.resolved)) } })) },
      { name: "Scheme", modes: schemes.map(cap), variables: roles(DEFAULT.scheme).map((t) => ({
        name: path2figma(t.path), type: "COLOR", description: t.description,
        values: Object.fromEntries(schemes.map((s) => { const r = roles(s).find((x) => x.path === t.path); return [cap(s), r.alias ? { alias: path2figma(r.alias), collection: "Primitives" } : rgba(hexOf(r.resolved))]; })),
      })) },
      { name: "Size", modes: pixels.map((p) => `${p}px`), variables: shared.filter(isPixelNumber).map((t) => ({ name: path2figma(t.path), type: "FLOAT", description: t.description, values: Object.fromEntries(pixels.map((p) => [`${p}px`, t.resolved * pixelValues[p]])) })) },
    ],
  };
  out("figma/variables.json", JSON.stringify(figma, null, 2) + "\n");
  void slash;
}
function path2figma(path) { return path.split(".").join("/"); }
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

console.log(`Wrote ${relative(process.cwd(), DIST)}: css, json, js, android, ios, figma (${base.length} tokens, ${schemes.length} schemes, ${pixels.length} pixel sizes).`);
