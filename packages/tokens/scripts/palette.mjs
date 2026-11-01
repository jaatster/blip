// Palettes: the accent of each time of day and Night's dark base, worked out from a few numbers (the levers) in
// OKLCH, every text colour nudged until it passes AA. Shared by the presets' generator (palettes.mjs) and the docs'
// palette maker, so a palette made by hand comes out the way the presets did. No dependencies, no Node: it runs in
// the browser as it is.

// ------------------------------------------------------------------ colour maths

const lin = (x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4);
const gam = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
function oklchLinear(L, C, h) {
  const a = C * Math.cos((h * Math.PI) / 180), b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}
const inGamut = (c) => c.every((v) => v >= -1e-4 && v <= 1 + 1e-4);

/** An OKLCH colour as #RRGGBB, its chroma lowered until it fits sRGB (the hue and lightness stay). */
export function oklch(L, C, h) {
  L = Math.min(1, Math.max(0, L));
  let c = Math.max(0, C), rgb = oklchLinear(L, c, h);
  if (!inGamut(rgb)) {
    let lo = 0, hi = c;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchLinear(L, mid, h))) lo = mid;
      else hi = mid;
    }
    rgb = oklchLinear(L, lo, h);
  }
  return "#" + rgb.map((v) => Math.round(Math.min(1, Math.max(0, gam(Math.min(1, Math.max(0, v))))) * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
}

/** #RRGGBB as [lightness, chroma, hue] in OKLCH. */
export function toOklch(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360];
}

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
/** The WCAG 2.2 contrast ratio of two #RRGGBB colours. */
export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
const worst = (c, list) => Math.min(...list.map((b) => contrast(c, b)));

/** The colour at L, C, h, made lighter (up) or darker (down) a step at a time until it reads at `min` on all of `on`. */
function readable(L, C, h, on, min, up) {
  for (let k = L; up ? k <= 1 : k >= 0; k += up ? 0.005 : -0.005) {
    const c = oklch(k, C, h);
    if (worst(c, on) >= min) return c;
  }
  return oklch(up ? 1 : 0, 0, h);
}

// ------------------------------------------------------------------ the levers

/** The palette maker's sliders: the accent's hue and strength, and the night page's tint and lightness. */
export const LEVERS = {
  hue: { min: 0, max: 359, step: 1, label: "Accent hue" },
  strength: { min: 0.4, max: 1.3, step: 0.05, label: "Accent strength" },
  tint: { min: 0, max: 0.08, step: 0.002, label: "Night's tint" },
  lightness: { min: 0.15, max: 0.33, step: 0.005, label: "Night's lightness" },
};

/**
 * The TV's night ground (trees, hills, grass, dirt, birds): every palette's ground is worked out from it, a little
 * quieter and as light as the palette's page, so the ground stays the ground whatever the sky does.
 */
export const NIGHT_GROUND = {
  "tree.lit": "#4E6E92", "tree.shadow": "#42607F",
  "hill.mid": "#58779A", "hill.mid-edge": "#678AA9", "hill.near": "#4F7887", "hill.near-edge": "#5F8B98", "hill.bush": "#466C7A",
  "grass.base": "#4F8B72", "grass.top": "#66A387", "grass.lip": "#417A62",
  "dirt.base": "#7D6175", "dirt.shadow": "#6D5367", "dirt.pebble": "#907388",
  bird: "#6C6A9E",
};

// ------------------------------------------------------------------ a palette

/**
 * A palette from a recipe: the levers, or colours to start from.
 *
 *   hue, strength       the accent: OKLCH hue, and how colourful (1 is a candy's)
 *   tint, lightness     Night's page: OKLCH chroma (0 is a neutral charcoal) and lightness
 *   baseHue             the hue the page is tinted with (default: the accent's)
 *   accent              a colour to start the accent from instead of hue and strength
 *   bg                  a colour to start the page from instead of tint, lightness and baseHue
 *   text, muted         Night's body and secondary text, if not the near-white and grey worked out from the page
 *   warning             the hue of a warning that must not look like the accent (default: amber, when the accent is
 *                       within 15 degrees of the warning's orange)
 *
 * `scene` gives what the palette has to read on, from the tokens: the light ink that labels Day's and Sunset's
 * candies, those schemes' page and surfaces, Night's intent and link colours, which its surfaces must carry, and
 * the warning's orange. Returns token paths and #RRGGBB values: palette.<scheme>.accent.*, Night's palette.night.*
 * and world.night.*, and palette.<scheme>.warning.* when the warning moves.
 */
export function makePalette(recipe, scene) {
  const r = { strength: 1, tint: 0, lightness: 0.235, ...recipe };
  let [h, k] = [r.hue ?? 0, r.strength];
  let [L, C, bh] = [r.lightness, r.tint, r.baseHue];
  if (r.bg) [L, C, bh] = toOklch(r.bg);
  bh ??= h;
  if (C < 0.002) C = 0;
  // Night's surfaces must carry its intents' text (a fixed candy light each): a page too light for one is darkened.
  for (let guard = 0; guard < 40 && worst(oklch(L + 0.08, C * 1.1, bh), scene.night.text) < 4.5; guard++) L -= 0.005;
  const night = [L - 0.04, L, L + 0.04, L + 0.08].map((l, i) => oklch(l, i === 3 ? C * 1.1 : C, bh));
  const [sunken, bg, surface, raised] = night;
  const ink = oklch(Math.max(0.16, L - 0.07), C * 0.8, bh);
  const surfaces = [bg, surface, raised, sunken];
  const text = r.text && worst(r.text, surfaces) >= 4.5 ? r.text.toUpperCase() : readable(0.965, Math.min(C * 0.6, 0.01), bh, surfaces, 4.5, true);
  const muted = (() => {
    if (r.muted) {
      const [ml, mc, mh] = toOklch(r.muted);
      return readable(ml, mc, mh, surfaces, 4.5, true);
    }
    return readable(0.8, C * 1.2, bh, surfaces, 4.5, true);
  })();
  const line = readable(0.7, C * 1.6, bh, [bg, surface], 3, true);
  const lineSoft = oklch(L + 0.12, C * 1.3, bh);

  // The candy: one for all three times of day, light enough for an ink label at Night and by Day (4.5:1).
  let aL, aC;
  if (r.accent) {
    [aL, aC, h] = toOklch(r.accent);
    k = 1;
  } else [aL, aC] = [0.76, 0.15 * k];
  const labels = [ink, scene.ink];
  for (; aL < 0.95 && worst(oklch(aL, aC, h), labels) < 4.5; aL += 0.005);
  const base = oklch(aL, aC, h);
  const light = readable(Math.max(aL + 0.1, 0.86), (aC * 2) / 3, h, labels, 4.5, true);
  const shade = oklch(aL - 0.13, (aC * 16) / 15, h);
  const nightText = readable(Math.max(0.84, aL), (aC * 11) / 15, h, [bg, surface, raised], 4.5, true);
  // By Day and Sunset the accent as text is the same hue, darker, until it reads on their page and surfaces.
  const dayText = (s) => readable(Math.min(aL, 0.62), Math.max(aC, 0.1) * 0.95, h, scene[s], 4.5, false);
  const gap = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
  const warningHue = r.warning ?? (aC >= 0.06 && gap(h, toOklch(scene.warning)[2]) <= 15 ? 78 : undefined);

  const out = {};
  for (const s of ["day", "sunset"]) Object.assign(out, { [`palette.${s}.accent.base`]: base, [`palette.${s}.accent.light`]: light, [`palette.${s}.accent.shade`]: shade, [`palette.${s}.accent.text`]: dayText(s) });
  // A warning as orange as the accent would read as a main button: it turns amber (a candy of its own, still not
  // yellow, which is focus), with the same bands and text as the accent's.
  if (warningHue !== undefined) {
    const wL = 0.8, wC = 0.165;
    const w = { base: oklch(wL, wC, warningHue), light: readable(0.89, 0.11, warningHue + 4, labels, 4.5, true), shade: oklch(0.67, 0.15, warningHue - 6) };
    for (const s of ["day", "sunset"]) Object.assign(out, { [`palette.${s}.warning.base`]: w.base, [`palette.${s}.warning.light`]: w.light, [`palette.${s}.warning.shade`]: w.shade, [`palette.${s}.warning.text`]: readable(0.6, 0.13, warningHue - 6, scene[s], 4.5, false) });
    Object.assign(out, { "palette.night.warning.base": w.base, "palette.night.warning.light": w.light, "palette.night.warning.shade": w.shade, "palette.night.warning.text": readable(0.89, 0.11, warningHue + 4, [bg, surface, raised], 4.5, true) });
  }
  Object.assign(out, {
    "palette.night.bg": bg, "palette.night.surface.base": surface, "palette.night.surface.raised": raised, "palette.night.surface.sunken": sunken,
    "palette.night.text.base": text, "palette.night.text.muted": muted,
    "palette.night.line.base": line, "palette.night.line.soft": lineSoft,
    "palette.night.ink": ink,
    "palette.night.accent.base": base, "palette.night.accent.light": light, "palette.night.accent.shade": shade, "palette.night.accent.text": nightText,
  });

  // The world at night: the page's colour for the sky, glowing faintly in the accent at the horizon; clouds,
  // mountains and snow lighter in the same; the ground the TV's, quieter, as light as the page.
  const wc = Math.max(C, 0.006), wh = C ? bh : h;
  [0.03, 0.06, 0.09, 0.125, 0.16, 0.2].forEach((d, i) => (out[`world.night.sky.${i + 1}`] = i < 3 ? oklch(L + d, wc, wh) : oklch(L + d, wc + 0.014 * (i - 2) * k, h)));
  Object.assign(out, {
    "world.night.cloud.light": oklch(L + 0.27, wc + 0.004, wh), "world.night.cloud.body": oklch(L + 0.22, wc + 0.004, wh), "world.night.cloud.shade": oklch(L + 0.17, wc + 0.004, wh),
    "world.night.mountain.lit": oklch(L + 0.14, wc + 0.006, wh), "world.night.mountain.shadow": oklch(L + 0.1, wc + 0.006, wh), "world.night.mountain.edge": oklch(L + 0.19, wc + 0.006, wh),
    "world.night.snow.lit": oklch(0.8, wc, wh), "world.night.snow.shadow": oklch(0.68, wc, wh),
  });
  for (const [slot, v] of Object.entries(NIGHT_GROUND)) {
    const [gl, gc, gh] = toOklch(v);
    out[`world.night.${slot}`] = oklch(gl * 0.82 + (L - 0.235) * 0.8, gc * 0.55, gh);
  }
  return out;
}
