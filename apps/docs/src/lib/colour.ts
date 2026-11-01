/** Colour arithmetic for the foundations pages: WCAG contrast, the pairs the token build checks, and the palettes. */
import { json, tokens, tokenSource } from "./data";

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
  /** Why the pair is checked. */
  why: string;
}
interface ContrastData {
  intents: string[];
  pairs: { fg: string; bg: Record<string, string>; min: number; why: string }[];
}
/** A token path as the custom property's name: accent.base is accent, surface.raised is surface-raised. */
const kebab = (path: string) => path.split(".").filter((p, i, a) => !(p === "base" && i === a.length - 1)).join("-");
/** The pairs the token build fails on, in the same order: both read @blip/tokens' contrast.json. */
export function pairs(): Pair[] {
  const data = json<ContrastData>("packages/tokens/contrast.json");
  return data.pairs.flatMap(({ fg, bg, min, why }) =>
    (fg.includes("{intent}") ? data.intents : [""]).flatMap((intent) => {
      const fill = (s: string) => s.replaceAll("{intent}", intent).replaceAll("{Intent}", cap(intent));
      return Object.entries(bg).map(([b, label]) => ({ fg: kebab(fill(fg)), bg: kebab(fill(b)), min, label: fill(label), why }));
    }),
  );
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export interface CheckedPair extends Pair {
  scheme: SchemeName;
  fgHex: string;
  bgHex: string;
  ratio: number;
  pass: boolean;
}
/** Every pair the token build checks, in each scheme of a palette (Candy, the default, when none is named). */
export function checkedPairs(palette?: string): CheckedPair[] {
  const t = tokens();
  const schemes = palette && palette !== t.palette ? t.palettes![palette]!.schemes : t.schemes;
  return SCHEMES.flatMap(({ id }) =>
    pairs().map((p) => {
      // A scheme role, or a shared colour that is the same in every scheme.
      const fgHex = String(schemes[id][p.fg] ?? t.shared[p.fg]), bgHex = String(schemes[id][p.bg] ?? t.shared[p.bg]);
      const r = contrast(fgHex, bgHex);
      return { ...p, scheme: id, fgHex, bgHex, ratio: r, pass: r >= p.min };
    }),
  );
}

/** HSV helpers for the palette maker's derivation (light: 0.65 saturation, full value; shade: 0.84 value). */
export function hsv(hex: string): [number, number, number] {
  const [r, g, b] = rgb(hex).map((c) => c / 255) as [number, number, number];
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [((h * 60) + 360) % 360, max ? d / max : 0, max];
}

export interface Palette {
  /** Its data-blip-palette value; Candy, the default, is set by having none. */
  id: string;
  name: string;
  description: string;
  credit?: string;
  default: boolean;
  /** Every scheme's roles in it. */
  schemes: Record<SchemeName, Record<string, string>>;
}
/** Every palette, the default (Candy) first, read from tokens.json and the default palette's own file. */
export function palettes(): Palette[] {
  const t = tokens();
  if (!t.palette) return [];
  const own = tokenSource(`palettes/${t.palette}.tokens.json`);
  return [
    { id: t.palette, name: own.$extensions?.blip?.name ?? t.palette, description: own.$description ?? "", default: true, schemes: t.schemes },
    ...Object.entries(t.palettes ?? {}).map(([id, p]) => ({ id, name: p.name, description: p.description, credit: p.credit, default: false, schemes: p.schemes })),
  ];
}
