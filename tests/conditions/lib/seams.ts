/**
 * The seams lane's measuring: every candy box of an example, shot alone (everything that is not a box's own painting
 * made invisible) at several device pixel ratios on one page, and compared with the same box at 1x, where every
 * pixel is crisp. The definitions of tests/unit/node/box-seams.test.ts:
 *
 *   blended   a device pixel whose colour the box never shows at 1x (off its palette)
 *   seam      a blended pixel where the box at 1x is one colour all round it (inside the fill, a band, the outline
 *             or the drop), so no edge can explain it: two of the box's layers meeting edge to edge
 *
 * Each box is compared in its own frame: from its own top-left corner, snapped as Chromium paints it (round(x) at 1x,
 * round(x * dpr) at dpr), and from its right and bottom edges for its far half, so a box whose width moves with its
 * label's rasterising still lines up with itself. "All round" counts only pixels the box paints itself at 1x (a shot
 * with every box keyed in a colour of its own), never what shows behind it: a parent, the page, a neighbour. A pixel
 * within 2 of a colour the box shows, in every channel, is rounding, not a blend.
 */
import type { CDPSession, Page } from "@playwright/test";
import { decode, type Image } from "./png.js";
import { HIDE_GLYPHS } from "./text.js";

/** Leaves only the boxes' own painting: no glyphs, pictures or controls, and nothing else's paint. */
export const BOXES_ONLY = `${HIDE_GLYPHS}
#example :is(svg, img, canvas, video, iframe, object, embed, picture, hr) { visibility: hidden !important; }
#example :is(input, select, textarea, progress, meter):not(.pp-box) { visibility: hidden !important; }
html, body, #example, #example :not(.pp-box), #example :not(.pp-box)::before, #example :not(.pp-box)::after {
  background: none !important; border-color: transparent !important; box-shadow: none !important; outline-color: transparent !important;
}
#example :not(.pp-box)::before, #example :not(.pp-box)::after { visibility: hidden !important; }`;

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
  /** The box's pixel, CSS px. */
  p: number;
  /** How far its drop (and a hover lift) reaches past its right and bottom edges, CSS px. */
  drop: number;
  /** How far its focus ring reaches all round, CSS px (0 without focus). */
  ring: number;
  /** Indices of the boxes it sits inside. */
  ancestors: number[];
  /** The box (tag, classes, state, label), and the component around it. */
  name: string;
  context: string;
}

/** The visible boxes of the example, in document order. Runs in the page. */
export function collectBoxes(page: Page): Promise<Box[]> {
  return page.evaluate(() => {
    const root = document.getElementById("example")!;
    const all = [...root.querySelectorAll<HTMLElement>(".pp-box")];
    const shown = all.filter((b) => {
      const r = b.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && b.checkVisibility({ visibilityProperty: true, opacityProperty: true });
    });
    const index = new Map(shown.map((b, i) => [b, i]));
    const name = (e: Element) => `${e.tagName.toLowerCase()}${[...e.classList].filter((c) => c.startsWith("pp-") && c !== "pp-box").slice(0, 2).map((c) => `.${c}`).join("")}`;
    return shown.map((b) => {
      const cs = getComputedStyle(b);
      // The padding box: the box's layers are drawn from it (a switch's knob has a transparent border).
      const o = b.getBoundingClientRect(), bl = parseFloat(cs.borderLeftWidth), bt = parseFloat(cs.borderTopWidth);
      const r = { x: o.x + bl, y: o.y + bt, width: o.width - bl - parseFloat(cs.borderRightWidth), height: o.height - bt - parseFloat(cs.borderBottomWidth) };
      const p = parseFloat(cs.getPropertyValue("--pp-pixel")) || 2;
      const before = getComputedStyle(b, "::before");
      // The drop: ::before reaches past the box by it (inset: 0 -drop -drop 0).
      const drop = Math.max(0, -parseFloat(before.right) || 0, -parseFloat(before.bottom) || 0);
      const ring = cs.filter !== "none" ? 2 * p : 0;
      const ancestors: number[] = [];
      for (let a = b.parentElement?.closest(".pp-box"); a; a = a.parentElement?.closest(".pp-box")) if (index.has(a as HTMLElement)) ancestors.push(index.get(a as HTMLElement)!);
      const label = b.textContent!.trim().replace(/\s+/g, " ").slice(0, 24);
      const state = [...b.attributes].filter((x) => /^(data-pp-state|data-variant|data-tone|aria-(pressed|selected|current|checked|disabled)|disabled)$/.test(x.name)).map((x) => (x.value ? `${x.name}=${x.value}` : x.name)).join(" ");
      const context = b.parentElement?.closest("[class*='pp-']:not(.pp-box)");
      return {
        x: r.x, y: r.y, w: r.width, h: r.height, p, drop, ring,
        ancestors,
        name: `${name(b)}${state ? ` [${state}]` : ""}${label ? ` "${label}"` : ""}`,
        context: context && root.contains(context) ? name(context) : "",
      };
    });
  });
}

export interface Render {
  dpr: number;
  boxes: Box[];
  img: Image;
  /** The shot's top-left corner in device px of the page. */
  ox: number;
  oy: number;
  /** At 1x: which box paints each pixel (its index), or -1 for none. */
  owner?: Int32Array;
}

/**
 * Which box paints each pixel at 1x: every box's layers painted in a colour of its own (its masks kept, no focus
 * ring), shot once. A box is only "one colour all round" where it paints itself, not where what lies behind it (a
 * parent, the page) shows through its corners, past its edges or under its transparent parts.
 */
export async function ownersAt1x(page: Page, cdp: CDPSession, one: Render, clip: { x: number; y: number; width: number; height: number }): Promise<Int32Array> {
  await page.evaluate(() => {
    const shown = [...document.querySelectorAll<HTMLElement>("#example .pp-box")].filter((b) => {
      const r = b.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && b.checkVisibility({ visibilityProperty: true, opacityProperty: true });
    });
    shown.forEach((b, i) => b.style.setProperty("--lanes-key", `rgb(0, ${(i + 1) >> 8}, ${(i + 1) & 255})`));
    const style = document.createElement("style");
    style.id = "lanes-key";
    style.textContent = "#example .pp-box { filter: none !important; } #example .pp-box::before, #example .pp-box::after { background: var(--lanes-key) !important; }";
    document.head.append(style);
  });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png", clip: { ...clip, scale: 1 }, optimizeForSpeed: true });
  const img = decode(Buffer.from(data, "base64"));
  await page.evaluate(() => {
    document.getElementById("lanes-key")?.remove();
    for (const b of document.querySelectorAll<HTMLElement>("#example .pp-box")) b.style.removeProperty("--lanes-key");
  });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const owner = new Int32Array(img.width * img.height);
  for (let k = 0; k < owner.length; k++) {
    const r = img.data[k * 3]!, g = img.data[k * 3 + 1]!, b = img.data[k * 3 + 2]!;
    const i = r === 0 ? ((g << 8) | b) - 1 : -1;
    owner[k] = i >= 0 && i < one.boxes.length ? i : -1;
  }
  return owner;
}

/** The ratio every clip edge must be a multiple of, so it lands on whole device pixels at every ratio we shoot
    (1.25 = 5/4, 1.5 = 3/2, 1.75 = 7/4, 2.625 = 21/8). */
const GRID = 8;

/** One rectangle (CSS px, on the GRID) holding every box's region, within the viewport. */
export function clipFor(boxes: Box[], width: number, height: number): { x: number; y: number; width: number; height: number } | null {
  if (!boxes.length) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const b of boxes) {
    const e = extent(b, true);
    x0 = Math.min(x0, b.x - e.before);
    y0 = Math.min(y0, b.y - e.before);
    x1 = Math.max(x1, b.x + b.w + e.after);
    y1 = Math.max(y1, b.y + b.h + e.after);
  }
  // A margin for the shifted shot and for boxes that move a little between ratios.
  x0 = Math.max(0, Math.floor((x0 - GRID) / GRID) * GRID);
  y0 = Math.max(0, Math.floor((y0 - GRID) / GRID) * GRID);
  x1 = Math.min(Math.floor(width / GRID) * GRID, Math.ceil((x1 + GRID) / GRID) * GRID);
  y1 = Math.min(Math.floor(height / GRID) * GRID, Math.ceil((y1 + GRID) / GRID) * GRID);
  return x1 > x0 && y1 > y0 ? { x: x0, y: y0, width: x1 - x0, height: y1 - y0 } : null;
}

/** Switches the page to a device pixel ratio in place (CDP), waits for it to paint, and shoots the clip. */
export async function shootAt(page: Page, cdp: CDPSession, viewport: { width: number; height: number }, dpr: number, clip: { x: number; y: number; width: number; height: number }): Promise<Render> {
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: viewport.width, height: viewport.height, deviceScaleFactor: dpr, mobile: false });
  const seen = await page.evaluate(() => new Promise<number>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(devicePixelRatio)))));
  if (seen !== dpr) throw new Error(`The page did not switch to ${dpr}x (it reports ${seen}x)`);
  const boxes = await collectBoxes(page);
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png", clip: { ...clip, scale: 1 }, optimizeForSpeed: true });
  const img = decode(Buffer.from(data, "base64"));
  if (img.width !== Math.round(clip.width * dpr) || img.height !== Math.round(clip.height * dpr)) throw new Error(`A ${clip.width} x ${clip.height} clip at ${dpr}x came back ${img.width} x ${img.height}`);
  return { dpr, boxes, img, ox: Math.round(clip.x * dpr), oy: Math.round(clip.y * dpr) };
}

/**
 * How far a box's painting reaches before its top-left and past its bottom-right, CSS px: a pixel either way for
 * rounding, its drop, and (with `ring`) its focus ring. The ring is a drop-shadow of the whole shape, drawn as a
 * filter on a layer of its own, so it has no layers to part: it is checked for blends at whole ratios, not for seams.
 */
export const extent = (b: Box, ring: boolean) => ({ before: b.p + (ring ? b.ring : 0), after: b.drop + b.p + (ring ? b.ring : 0) });

/** A box's region in a render, in device px of the shot, clamped to it. */
function regionOf(r: Render, b: Box, ring: boolean) {
  const d = r.dpr, e = extent(b, ring);
  return {
    x0: Math.max(0, Math.floor((b.x - e.before) * d) - r.ox),
    y0: Math.max(0, Math.floor((b.y - e.before) * d) - r.oy),
    x1: Math.min(r.img.width, Math.ceil((b.x + b.w + e.after) * d) - r.ox),
    y1: Math.min(r.img.height, Math.ceil((b.y + b.h + e.after) * d) - r.oy),
  };
}

/** Which device pixels of box i's region another box (not one it sits inside) paints, or may: 1 where excluded. */
function excluded(r: Render, i: number, reg: ReturnType<typeof regionOf>): Uint8Array {
  const w = reg.x1 - reg.x0, h = reg.y1 - reg.y0, d = r.dpr;
  const out = new Uint8Array(Math.max(0, w * h));
  const box = r.boxes[i]!;
  r.boxes.forEach((o, j) => {
    if (j === i || box.ancestors.includes(j)) return;
    const e = extent(o, true);
    const ox0 = Math.floor((o.x - e.before) * d) - r.ox - reg.x0, oy0 = Math.floor((o.y - e.before) * d) - r.oy - reg.y0;
    const ox1 = Math.ceil((o.x + o.w + e.after) * d) - r.ox - reg.x0, oy1 = Math.ceil((o.y + o.h + e.after) * d) - r.oy - reg.y0;
    for (let y = Math.max(0, oy0); y < Math.min(h, oy1); y++) out.fill(1, y * w + Math.max(0, ox0), y * w + Math.max(0, Math.min(w, ox1)));
  });
  return out;
}

const colourAt = (img: Image, x: number, y: number) => {
  const k = (y * img.width + x) * 3;
  return (img.data[k]! << 16) | (img.data[k + 1]! << 8) | img.data[k + 2]!;
};

/** Whether a colour is one the box shows, give or take 2 in each channel (compositing rounds). */
function shows(palette: Set<number>, c: number): boolean {
  if (palette.has(c)) return true;
  for (const q of palette) {
    if (Math.abs(((c >> 16) & 255) - ((q >> 16) & 255)) <= 2 && Math.abs(((c >> 8) & 255) - ((q >> 8) & 255)) <= 2 && Math.abs((c & 255) - (q & 255)) <= 2) return true;
  }
  return false;
}

/** The colours a box shows in a render (its region, less what other boxes paint). */
export function paletteOf(r: Render, i: number): Set<number> {
  const reg = regionOf(r, r.boxes[i]!, true);
  const ex = excluded(r, i, reg);
  const out = new Set<number>();
  const w = reg.x1 - reg.x0;
  for (let y = reg.y0; y < reg.y1; y++) for (let x = reg.x0; x < reg.x1; x++) if (!ex[(y - reg.y0) * w + (x - reg.x0)]) out.add(colourAt(r.img, x, y));
  return out;
}

export interface Found {
  /** Device pixels looked at. */
  checked: number;
  blended: number;
  seams: number;
  /** The first offending pixel, CSS px of the page. */
  first?: [number, number];
  /** The most visible seam: its contrast with the colour all round it, and its largest channel difference. */
  worst?: { contrast: number; channel: number; colour: number; around: number };
}

const lum = (c: number) => {
  const f = (v: number) => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f((c >> 16) & 255) + 0.7152 * f((c >> 8) & 255) + 0.0722 * f(c & 255);
};
/** Seams this faint (under 1.15:1 and 24 apart in every channel) are real but below what anyone sees: where two
    layers of the same colour meet over a slightly different one. They still fail; the label says which kind. */
export const faint = (w: Found["worst"]): boolean => !!w && w.contrast < 1.15 && w.channel < 24;

/** How a seam pixel stands out from the colour all round it. */
export function visibility(c: number, around: number): { contrast: number; channel: number } {
  const [a, b] = [lum(c), lum(around)].sort((x, y) => y - x);
  const channel = Math.max(Math.abs(((c >> 16) & 255) - ((around >> 16) & 255)), Math.abs(((c >> 8) & 255) - ((around >> 8) & 255)), Math.abs((c & 255) - (around & 255)));
  return { contrast: (a! + 0.05) / (b! + 0.05), channel };
}

/** Device pixels of box i in render r that are off its palette. */
export function blends(r: Render, i: number, palette: Set<number>): Found {
  const reg = regionOf(r, r.boxes[i]!, true);
  const ex = excluded(r, i, reg);
  const w = reg.x1 - reg.x0;
  const found: Found = { checked: 0, blended: 0, seams: 0 };
  for (let y = reg.y0; y < reg.y1; y++) {
    for (let x = reg.x0; x < reg.x1; x++) {
      if (ex[(y - reg.y0) * w + (x - reg.x0)]) continue;
      found.checked++;
      if (shows(palette, colourAt(r.img, x, y))) continue;
      found.blended++;
      found.first ??= [(x + r.ox) / r.dpr, (y + r.oy) / r.dpr];
    }
  }
  return found;
}

/**
 * Seams of box i in render r (a fractional ratio) against the same box at 1x (`ideal`): blended pixels where every
 * 1x pixel within tol = 1/dpr + 0.5 CSS px of them is the same colour.
 */
export function seams(r: Render, ideal: Render, i: number, palette: Set<number>): Found {
  const b = r.boxes[i]!, b1 = ideal.boxes[i]!, d = r.dpr, p = b.p;
  const reg = regionOf(r, b, false);
  const ex = excluded(r, i, reg);
  const reg1 = regionOf(ideal, b1, true);
  const ex1 = excluded(ideal, i, reg1);
  const w = reg.x1 - reg.x0, w1 = reg1.x1 - reg1.x0;
  // The box's corner at each ratio, as Chromium snaps it; and how much its whole-pixel size moved.
  const oxd = Math.round(b.x * d), oyd = Math.round(b.y * d), ox1 = Math.round(b1.x), oy1 = Math.round(b1.y);
  const W = Math.floor(b.w / p + 1e-6) * p, W1 = Math.floor(b1.w / p + 1e-6) * p;
  const H = Math.floor(b.h / p + 1e-6) * p, H1 = Math.floor(b1.h / p + 1e-6) * p;
  const mapX = (k: number) => (k < W / 2 ? k : k - (W - W1));
  const mapY = (k: number) => (k < H / 2 ? k : k - (H - H1));
  const owner = ideal.owner!;
  const tol = 1 / d + 0.5;
  const found: Found = { checked: 0, blended: 0, seams: 0 };
  for (let y = reg.y0; y < reg.y1; y++) {
    for (let x = reg.x0; x < reg.x1; x++) {
      if (ex[(y - reg.y0) * w + (x - reg.x0)]) continue;
      found.checked++;
      if (shows(palette, colourAt(r.img, x, y))) continue;
      found.blended++;
      const X = x + r.ox, Y = y + r.oy;
      const kx0 = Math.floor((X - oxd) / d - tol), kx1 = Math.floor((X + 1 - oxd) / d + tol - 1e-6);
      const ky0 = Math.floor((Y - oyd) / d - tol), ky1 = Math.floor((Y + 1 - oyd) / d + tol - 1e-6);
      let colour = -1, uniform = true;
      for (let ky = ky0; ky <= ky1 && uniform; ky++) {
        for (let kx = kx0; kx <= kx1 && uniform; kx++) {
          const ix = ox1 + mapX(kx) - ideal.ox, iy = oy1 + mapY(ky) - ideal.oy;
          // Outside the box's 1x region, or a pixel it does not paint itself at 1x: not known to be its own colour.
          if (ix < reg1.x0 || iy < reg1.y0 || ix >= reg1.x1 || iy >= reg1.y1 || ex1[(iy - reg1.y0) * w1 + (ix - reg1.x0)] || owner[iy * ideal.img.width + ix] !== i) uniform = false;
          else {
            const c = colourAt(ideal.img, ix, iy);
            if (colour === -1) colour = c;
            else if (c !== colour) uniform = false;
          }
        }
      }
      if (!uniform) continue;
      found.seams++;
      found.first ??= [X / d, Y / d];
      const shown = colourAt(r.img, x, y), v = visibility(shown, colour);
      if (!found.worst || v.contrast > found.worst.contrast || (v.contrast === found.worst.contrast && v.channel > found.worst.channel)) found.worst = { ...v, colour: shown, around: colour };
    }
  }
  return found;
}
