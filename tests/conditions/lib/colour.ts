/** WCAG 2.2 contrast, from colours as numbers (0xRRGGBB) or as the browser computes them ("rgb(…)", "rgba(…)"). */

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** A computed colour: rgb(), rgba(), color(srgb …) or #hex. Null for anything else (a keyword, a gradient). */
export function parse(css: string): RGBA | null {
  const s = css.trim();
  if (s.startsWith("#")) {
    const h = s.length === 4 ? [...s.slice(1)].map((c) => c + c).join("") : s.slice(1);
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 };
  }
  let m = s.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const v = m[1]!.split(/[\s,/]+/).filter(Boolean).map((x) => (x.endsWith("%") ? (parseFloat(x) / 100) * 255 : parseFloat(x)));
    return { r: v[0]!, g: v[1]!, b: v[2]!, a: v[3] ?? 1 };
  }
  m = s.match(/^color\(srgb ([^)]+)\)$/);
  if (m) {
    const v = m[1]!.split(/[\s/]+/).filter(Boolean).map(parseFloat);
    return { r: v[0]! * 255, g: v[1]! * 255, b: v[2]! * 255, a: v[3] ?? 1 };
  }
  if (s === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
  return null;
}

const channel = (v: number) => {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

export const luminance = (r: number, g: number, b: number): number => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

export const lumOf = (c: number): number => luminance((c >> 16) & 255, (c >> 8) & 255, c & 255);

export function ratio(l1: number, l2: number): number {
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Contrast of a colour (with its alpha) laid over an opaque backdrop (0xRRGGBB). */
export function contrastOver(fg: RGBA, backdrop: number): number {
  const br = (backdrop >> 16) & 255, bg = (backdrop >> 8) & 255, bb = backdrop & 255;
  const a = fg.a;
  return ratio(luminance(fg.r * a + br * (1 - a), fg.g * a + bg * (1 - a), fg.b * a + bb * (1 - a)), luminance(br, bg, bb));
}

export const contrast = (a: number, b: number): number => ratio(lumOf(a), lumOf(b));

export const toNumber = (c: RGBA): number => (Math.round(c.r) << 16) | (Math.round(c.g) << 8) | Math.round(c.b);

export const css = (c: RGBA): string => `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}${c.a < 1 ? ` / ${c.a.toFixed(2)}` : ""})`;
