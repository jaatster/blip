/** Colour arithmetic for the foundations pages: WCAG contrast, and the pairs the token build checks. */
import { tokens } from "./data";

export function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}
export function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m) as [number, number];
  return (x + 0.05) / (y + 0.05);
}
export const ratio = (n: number) => `${n.toFixed(n >= 10 ? 1 : 2)}:1`;

export type SchemeName = "day" | "sunset" | "night";
export const SCHEMES: { id: SchemeName; title: string; hours: string }[] = [
  { id: "day", title: "Day", hours: "6:00 to 17:00" },
  { id: "sunset", title: "Sunset", hours: "17:00 to 19:00" },
  { id: "night", title: "Night", hours: "19:00 to 6:00" },
];

export interface Pair {
  fg: string;
  bg: string;
  min: number;
  label: string;
}
/** The text pairs the token build fails on (packages/tokens/scripts/tokens.mjs, PAIRS), in the same order. */
export function pairs(): Pair[] {
  const out: Pair[] = [];
  const surfaces: [string, string][] = [["bg", "the page"], ["surface", "a surface"], ["surface-raised", "a raised surface"], ["surface-sunken", "a sunken well"], ["surface-panel", "a panel"]];
  for (const [s, name] of surfaces) out.push({ fg: "text", bg: s, min: 4.5, label: `Text on ${name}` }, { fg: "text-muted", bg: s, min: 4.5, label: `Muted text on ${name}` });
  for (const intent of ["accent", "info", "success", "warning", "danger"]) {
    for (const [s, name] of [["bg", "the page"], ["surface", "a surface"], ["surface-raised", "a raised surface"]] as const) out.push({ fg: `${intent}-text`, bg: s, min: 4.5, label: `${cap(intent)} text on ${name}` });
    out.push({ fg: `${intent}-on`, bg: intent, min: 4.5, label: `Label on ${intent} candy` }, { fg: `${intent}-on`, bg: `${intent}-light`, min: 4.5, label: `Label on soft ${intent}` });
  }
  out.push({ fg: "link-visited", bg: "bg", min: 4.5, label: "Visited link on the page" }, { fg: "link-visited", bg: "surface", min: 4.5, label: "Visited link on a surface" });
  out.push({ fg: "line", bg: "bg", min: 3, label: "Control outline on the page" }, { fg: "line", bg: "surface", min: 3, label: "Control outline on a surface" }, { fg: "selection-text", bg: "selection-bg", min: 4.5, label: "Selected text" }, { fg: "text-inverse", bg: "text", min: 4.5, label: "Inverse text" });
  // A disabled candy is dithered: its label still reads on the dither (intents label with their own colour, plain
  // candies with ink, cream on its own dither).
  for (const intent of ["accent", "info", "success", "warning", "danger"]) out.push({ fg: `${intent}-on`, bg: "disabled-dither", min: 4.5, label: `Label on disabled ${intent}` });
  out.push({ fg: "ink", bg: "disabled-dither", min: 4.5, label: "Ink label on a disabled candy" }, { fg: "ink", bg: "disabled-dither-cream", min: 4.5, label: "Ink label on disabled cream" });
  return out;
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export interface CheckedPair extends Pair {
  scheme: SchemeName;
  fgHex: string;
  bgHex: string;
  ratio: number;
  pass: boolean;
}
export function checkedPairs(): CheckedPair[] {
  const t = tokens();
  return SCHEMES.flatMap(({ id }) =>
    pairs().map((p) => {
      // A scheme role, or a shared colour (ink) that is the same in every scheme.
      const fgHex = String(t.schemes[id][p.fg] ?? t.shared[p.fg]), bgHex = String(t.schemes[id][p.bg] ?? t.shared[p.bg]);
      const r = contrast(fgHex, bgHex);
      return { ...p, scheme: id, fgHex, bgHex, ratio: r, pass: r >= p.min };
    }),
  );
}

/** HSV helpers for the theme builder's derivation (light: 0.65 saturation, full value; shade: 0.84 value). */
export function hsv(hex: string): [number, number, number] {
  const [r, g, b] = rgb(hex).map((c) => c / 255) as [number, number, number];
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [((h * 60) + 360) % 360, max ? d / max : 0, max];
}
