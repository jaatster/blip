// The token build's engine, shared by the package's own build (build.mjs) and the blip-tokens command (cli.mjs):
// reads a W3C DTCG 2025.10 resolver and its sources, validates every token, resolves aliases, checks contrast, and
// turns the result into CSS, JSON, JS/TS, Android, iOS and Figma files. Nothing here writes to disk. No dependencies.

import { readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** This package: Blip's own resolver and sources. */
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const NS = "blip";
/** A theme's $ref into Blip's sources ("node_modules/@jaatster/blip-tokens/src/…") is found wherever it is installed. */
const PACKAGE_REF = /^(?:\.\/)?(?:node_modules\/)?@blip\/tokens\//;

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

// ------------------------------------------------------------------ reading and checking

const TYPES = new Set(["color", "dimension", "duration", "number", "fontFamily", "fontWeight", "cubicBezier"]);
const NAME_RE = /^[^${}.][^{}.]*$/;
const HEX_RE = /^#[0-9A-F]{6}$/i;
const INTENTS = ["accent", "info", "success", "warning", "danger"];

/** The text pairs every scheme must pass, as [foreground, background, minimum ratio]. */
const PAIRS = [];
for (const s of ["bg", "surface.base", "surface.raised", "surface.sunken", "surface.panel"]) PAIRS.push(["text.base", s, 4.5], ["text.muted", s, 4.5]);
for (const intent of INTENTS) {
  for (const s of ["bg", "surface.base", "surface.raised"]) PAIRS.push([`${intent}.text`, s, 4.5]);
  PAIRS.push([`${intent}.on`, `${intent}.base`, 4.5], [`${intent}.on`, `${intent}.light`, 4.5]);
}
for (const s of ["bg", "surface.base"]) PAIRS.push(["link.visited", s, 4.5]);
PAIRS.push(["line.base", "bg", 3], ["line.base", "surface.base", 3], ["selection.text", "selection.bg", 4.5], ["text.inverse", "text.base", 4.5]);
// A disabled candy is dithered: its label must still read on the dither as well as on the candy. Intents label with
// their own colour; plain candies with ink, on the dither or (cream) cream's own. Slate's ink dither is checked below.
for (const intent of INTENTS) PAIRS.push([`${intent}.on`, "disabled.dither", 4.5]);
PAIRS.push(["ink.base", "disabled.dither", 4.5], ["ink.base", "disabled.dither-cream", 4.5]);

/**
 * Reads a resolver and everything it points at, and checks it: names, types, values, aliases, then contrast.
 * Problems are collected with their code, file (relative to `base`), JSON pointer, message and fix; reading stops at
 * the first stage that has any. A `theme` resolver may leave out what Blip's own gives (its sets, its modifiers,
 * its resolution order), so a theme lists only Blip's files and its own for each context.
 */
export function readTokens({ resolverFile = join(ROOT, "blip.resolver.json"), base = ROOT, theme = false } = {}) {
  const problems = [];
  const report = [];
  const problem = (code, file, pointer, message, fix) => problems.push({ code, file: relative(base, file), pointer, message, fix });
  const done = () => ({ problems, report });

  const readJson = (file) => {
    try {
      return JSON.parse(readFileSync(file, "utf8"));
    } catch (e) {
      problem("PP-T001", file, "", `Could not read JSON: ${e.message}`, "Check the file exists and is valid JSON.");
      return {};
    }
  };

  // The resolver, with every file $ref made absolute: Blip's from this package, a theme's from its own folder.
  const absolute = (node, from) => {
    if (Array.isArray(node)) return node.map((n) => absolute(n, from));
    if (!node || typeof node !== "object") return node;
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      out[k] = k === "$ref" && typeof v === "string" && !v.startsWith("#") ? (PACKAGE_REF.test(v) ? join(ROOT, v.replace(PACKAGE_REF, "")) : resolve(from, v)) : absolute(v, from);
    }
    return out;
  };
  const RESOLVER_FILE = resolve(resolverFile);
  let resolver = absolute(readJson(RESOLVER_FILE), dirname(RESOLVER_FILE));
  if (problems.length) return done();
  if (resolver.version !== "2025.10") {
    problem("PP-T002", RESOLVER_FILE, "/version", `Resolver version is "${resolver.version}".`, 'Set "version": "2025.10".');
  }
  if (theme) {
    const own = absolute(JSON.parse(readFileSync(join(ROOT, "blip.resolver.json"), "utf8")), ROOT);
    resolver = {
      ...resolver,
      sets: { ...own.sets, ...resolver.sets },
      modifiers: { ...own.modifiers, ...resolver.modifiers },
      resolutionOrder: resolver.resolutionOrder ?? own.resolutionOrder,
    };
  }
  const MODIFIERS = resolver.modifiers ?? {};
  for (const [name, m] of Object.entries(MODIFIERS)) {
    const n = Object.keys(m.contexts ?? {}).length;
    if (n < 2) problem("PP-T003", RESOLVER_FILE, `/modifiers/${name}`, `Modifier "${name}" has ${n} context(s).`, "Give it at least two contexts, or make it a set.");
    if (m.default && !(m.default in (m.contexts ?? {}))) problem("PP-T004", RESOLVER_FILE, `/modifiers/${name}/default`, `Default "${m.default}" is not a context.`, `Use one of: ${Object.keys(m.contexts ?? {}).join(", ")}.`);
  }
  for (const name of ["scheme", "pixel"]) {
    if (!MODIFIERS[name]?.contexts) problem("PP-T003", RESOLVER_FILE, `/modifiers/${name}`, `There is no "${name}" modifier.`, `Add the "${name}" modifier with its contexts (see Blip's own resolver).`);
  }
  if (problems.length) return done();

  /** Loads a source (a $ref to a file, or inline tokens) and remembers which file each token came from. */
  const loadSource = (src) => (src.$ref ? { file: src.$ref, tokens: readJson(src.$ref) } : { file: RESOLVER_FILE, tokens: src });
  const sourcesOf = (item) => (item.$ref?.startsWith("#/sets/") ? resolver.sets?.[item.$ref.slice(7)]?.sources ?? [] : item.sources ?? []);

  /** Merges the resolution order for one input, e.g. { scheme: "night", pixel: "2" }. Later sources win. */
  const resolveInput = (input) => {
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
  };

  /** Walks a token tree into a flat list, inheriting $type from groups. */
  const flatten = (tree, origin) => {
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
  };

  const validate = (tok) => {
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
  };

  /** Resolves aliases ({a.b}) to their final values, catching missing targets and cycles. */
  const resolveAliases = (tokens) => {
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
  };

  // Every input: each scheme at the default pixel, and each pixel size.
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
    return [p, tree.pixel?.$value?.value];
  }));
  if (problems.length) return done();

  // Which paths come from the scheme files (they change with the scheme); everything else is shared.
  const schemePaths = new Set();
  for (const scheme of schemes) for (const s of MODIFIERS.scheme.contexts[scheme]) flatten(loadSource(s).tokens, new Map()).forEach((t) => schemePaths.add(t.path));
  const tokens = resolved[DEFAULT.scheme];
  const shared = tokens.filter((t) => !schemePaths.has(t.path) && t.path !== "pixel");
  const roles = (scheme) => resolved[scheme].filter((t) => schemePaths.has(t.path));
  const colorScheme = (scheme) => MODIFIERS.scheme.contexts[scheme].map((s) => loadSource(s).tokens.$extensions?.[NS]?.colorScheme).filter(Boolean).pop() ?? "light";
  const model = { problems, report, schemes, pixels, DEFAULT, pixelValues, resolved, schemePaths, tokens, shared, roles, colorScheme };

  // Contrast. A problem points at the token to change: the theme's own when it set one of the pair, else the scheme's.
  const ownFile = (file) => !relative(ROOT, file).startsWith("..");
  const find = (scheme, path) => resolved[scheme].find((t) => t.path === path);
  const blame = (scheme, paths) => {
    const list = paths.map((p) => find(scheme, p)).filter(Boolean);
    return list.find((t) => !ownFile(t.file)) ?? list.find((t) => schemePaths.has(t.path)) ?? list[0];
  };
  for (const scheme of schemes) {
    const c = Object.fromEntries(resolved[scheme].filter((t) => t.type === "color").map((t) => [t.path, hexOf(t.resolved)]));
    for (const [fg, bg, min] of PAIRS) {
      const ratio = contrast(c[fg], c[bg]);
      report.push({ scheme, fg, bg, ratio, min });
      const at = blame(scheme, [fg, bg]);
      if (ratio < min) problem("PP-T060", at.file, `/${at.path.replaceAll(".", "/")}`, `${scheme}: ${fg} ${c[fg]} on ${bg} ${c[bg]} is ${ratio.toFixed(2)}:1; it needs ${min}:1.`, "Darken or lighten one of the two in this scheme (WCAG 2.2 AA).");
    }
    // The focus ring is yellow with an ink edge: one of them must stand 3:1 against the page.
    const ring = Math.max(contrast(c["focus.base"], c.bg), contrast(c["focus.edge"], c.bg));
    report.push({ scheme, fg: "focus ring", bg: "bg", ratio: ring, min: 3 });
    const at = blame(scheme, ["focus.base", "focus.edge", "bg"]);
    if (ring < 3) problem("PP-T061", at.file, at.path === "bg" ? "/bg" : "/focus", `${scheme}: the focus ring is ${ring.toFixed(2)}:1 against the page.`, "Change the scheme's page colour or the ring's edge.");
  }
  if (problems.length) return model;

  // Plain candies (data-tone="teal" and so on) take ink labels, slate takes white: check them on every band.
  const hex = (path) => hexOf(find(DEFAULT.scheme, path).resolved);
  const candies = tokens.map((t) => /^candy\.([^.]+)\.base$/.exec(t.path)?.[1]).filter(Boolean);
  for (const c of candies) for (const band of ["base", "light"]) {
    const label = c === "slate" ? "white" : "ink.base";
    const ratio = contrast(hex(label), hex(`candy.${c}.${band}`));
    report.push({ scheme: "all", fg: label, bg: `candy.${c}.${band}`, ratio, min: 4.5 });
    if (ratio < 4.5) problem("PP-T062", find(DEFAULT.scheme, `candy.${c}.${band}`).file, `/candy/${c}/${band}`, `${label} on candy ${c} ${band} is ${ratio.toFixed(2)}:1; it needs 4.5:1.`, "Adjust the candy, or give it a different label colour in box.css.");
  }
  // A disabled slate candy is dithered with ink (box.css), under its white label.
  const slate = contrast(hex("white"), hex("ink.base"));
  report.push({ scheme: "all", fg: "white", bg: "ink.base", ratio: slate, min: 4.5 });
  if (slate < 4.5) problem("PP-T062", find(DEFAULT.scheme, "ink.base").file, "/ink/base", `white on ink.base, the dither over a disabled slate candy, is ${slate.toFixed(2)}:1; it needs 4.5:1.`, "Darken ink, or give slate's disabled dither another colour in box.css.");
  return model;
}

/** The problems as the build prints them: a count, then each with its code, place, message and fix. */
export function formatProblems(problems) {
  let text = `\nBlip tokens: ${problems.length} problem${problems.length > 1 ? "s" : ""}\n\n`;
  for (const p of problems) text += `  ${p.code}  ${p.file}${p.pointer ? ` at ${p.pointer}` : ""}\n    ${p.message}\n    Fix: ${p.fix}\n\n`;
  return text;
}

/** How many pairs passed, and the five closest to the line. */
export function formatReport({ report, schemes }) {
  const weakest = [...report].sort((a, b) => a.ratio / a.min - b.ratio / b.min).slice(0, 5);
  return [`Contrast: ${report.length} pairs pass in ${schemes.length} schemes. Closest to the line:`, ...weakest.map((r) => `  ${r.scheme.padEnd(7)} ${r.fg} on ${r.bg}: ${r.ratio.toFixed(2)}:1 (needs ${r.min})`)].join("\n");
}

// ------------------------------------------------------------------ naming

/** candy.red.base -> candy-red; surface.base -> surface; world.day.sky.1 -> world-day-sky-1 */
const kebab = (path) => path.split(".").filter((p, i, a) => !(p === "base" && i === a.length - 1)).join("-");
const cssVar = (path) => `--pp-${kebab(path)}`;
const camel = (path) => kebab(path).replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase()).replace(/^(\d)/, "_$1");
const pascal = (path) => { const c = camel(path); return c.charAt(0).toUpperCase() + c.slice(1); };
const isPixelNumber = (t) => t.type === "number" && t.ext?.unit === "pixel";
const path2figma = (path) => path.split(".").join("/");
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

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

/** tokens.css: every token as a custom property in @layer pp.tokens, the schemes on their attribute. */
export function tokensCss(model, header) {
  const { schemes, pixels, DEFAULT, pixelValues, shared, roles, colorScheme } = model;
  const pixelDerived = shared.filter(isPixelNumber);
  const fixed = shared.filter((t) => !isPixelNumber(t));
  const durations = shared.filter((t) => t.type === "duration" && t.path.startsWith("duration."));
  const schemeBlock = (scheme) => `${decls(roles(scheme))}\n    --pp-scheme: ${scheme};\n    color-scheme: ${colorScheme(scheme)};`;
  const dark = schemes.includes("night") ? `  @media screen and (prefers-color-scheme: dark) { :root:not([data-pp-scheme]) {\n${schemeBlock("night")}\n  } }\n` : "";
  return `/* ${header} */
@layer pp.reset, pp.tokens, pp.base, pp.core, pp.components, pp.kits, pp.utilities;

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

  /* Schemes. Day is the default; the device's dark mode picks Night until a scheme is set. Paper is always Day. */
  :root, [data-pp-scheme="${DEFAULT.scheme}"] {
${schemeBlock(DEFAULT.scheme)}
  }
${schemes.filter((s) => s !== DEFAULT.scheme).map((s) => `  @media screen { [data-pp-scheme="${s}"] {\n${schemeBlock(s)}\n  } }`).join("\n")}
${dark}
  /* Reduced motion: every move is instant. */
  @media (prefers-reduced-motion: reduce) {
    :root {
${durations.map((t) => `      ${cssVar(t.path)}: 0ms;`).join("\n")}
    }
  }
}
`;
}

/** Every output, by its path in dist: CSS, JSON, JS/TS, Android, iOS and Figma. */
export function outputs(model, header) {
  const { schemes, pixels, DEFAULT, pixelValues, schemePaths, tokens, shared, roles } = model;
  const files = { "css/tokens.css": tokensCss(model, header) };

  // JSON ---------------------------------------------------------------
  const plain = (t) => {
    const v = t.resolved;
    switch (t.type) {
      case "color": return hexOf(v);
      // Dimensions in CSS px: rem (the type sizes) at the browser's default text size, 16 px.
      case "dimension": return v.unit === "rem" ? v.value * 16 : v.value;
      case "duration": return v.value;
      default: return v;
    }
  };
  const flat = (list) => Object.fromEntries(list.map((t) => [kebab(t.path), plain(t)]));
  const json = {
    pixel: pixelValues,
    shared: flat(shared),
    schemes: Object.fromEntries(schemes.map((s) => [s, flat(roles(s))])),
  };
  files["json/tokens.json"] = JSON.stringify(json, null, 2) + "\n";
  files["json/manifest.json"] = JSON.stringify(
    tokens.map((t) => ({ name: kebab(t.path), path: t.path, cssVar: cssVar(t.path), type: t.type, unit: t.ext?.unit, alias: t.alias, description: t.description, scheme: schemePaths.has(t.path) })), null, 2) + "\n";

  // JS / TS ------------------------------------------------------------
  {
    const sharedNames = shared.map((t) => kebab(t.path));
    const roleNames = roles(DEFAULT.scheme).map((t) => kebab(t.path));
    files["js/index.js"] = `// ${header}
export const pixel = ${JSON.stringify(pixelValues)};
export const shared = ${JSON.stringify(json.shared, null, 2)};
export const schemes = ${JSON.stringify(json.schemes, null, 2)};
export const schemeNames = ${JSON.stringify(schemes)};
/** The CSS custom property for a token: cssVar("surface") is "var(--pp-surface)". */
export const cssVar = (name) => \`var(--pp-\${name})\`;
/** A size counted in pixels, in CSS px at a pixel size: px("space-4", 2) is 8. */
export const px = (name, size = ${pixelValues[DEFAULT.pixel]}) => shared[name] * size;
`;
    files["js/index.d.ts"] = `// ${header}
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
`;
  }

  // Android (Compose + XML) --------------------------------------------
  {
    const argb = (hex) => `0xFF${hex.slice(1)}`;
    const colorsShared = shared.filter((t) => t.type === "color");
    files["android/BlipTokens.kt"] = `// ${header}
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
    const xml = (list) => `<?xml version="1.0" encoding="utf-8"?>\n<!-- ${header} -->\n<resources>\n${list.map((t) => `    <color name="pp_${kebab(t.path).replaceAll("-", "_")}">${hexOf(t.resolved)}</color>`).join("\n")}\n</resources>\n`;
    files["android/res/values/blip_colors.xml"] = xml([...colorsShared, ...roles("day")]);
    files["android/res/values-night/blip_colors.xml"] = xml(roles("night"));
    files["android/res/values/blip_dimens.xml"] = `<?xml version="1.0" encoding="utf-8"?>\n<!-- ${header} -->\n<resources>\n${shared.filter(isPixelNumber).map((t) => `    <dimen name="pp_${kebab(t.path).replaceAll("-", "_")}">${t.resolved * pixelValues[DEFAULT.pixel]}dp</dimen>`).join("\n")}\n</resources>\n`;
  }

  // iOS (SwiftUI) ------------------------------------------------------
  {
    const swiftColor = (hex) => `Color(blipHex: 0x${hex.slice(1)})`;
    files["ios/BlipTokens.swift"] = `// ${header}
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
  }

  // Figma variables ----------------------------------------------------
  {
    const rgba = (hex) => { const [r, g, b] = hexToRgb(hex); return { r: r / 255, g: g / 255, b: b / 255, a: 1 }; };
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
    files["figma/variables.json"] = JSON.stringify(figma, null, 2) + "\n";
  }
  return files;
}
