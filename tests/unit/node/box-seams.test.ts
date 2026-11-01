/**
 * The box on real screens, in Chromium at real device pixel ratios: a button, a cream card and a radio at eight
 * fractional offsets, on even and odd CSS pixels, at the default pixel (2 CSS px) and a TV's (4).
 *
 * At 100%, 200% and 300% every pixel lands on whole screen pixels: no screen pixel of a box is a blend. At 125%,
 * 175% and 262.5% (and 150% at odd positions) a Blip pixel spans a fraction of screen pixels, so outer edges
 * can be soft; but no screen pixel blends where the box is one colour all round (inside a band, the fill, the
 * outline or the drop). Those were the seams where two of the box's mask layers met edge to edge.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { inflateSync } from "node:zlib";
import type { Browser, Page } from "playwright";
import { boxAssets, boxPage, launch, type BoxAssets } from "./box-page.ts";

const OFFSETS = [0, 0.1, 0.25, 0.33, 0.5, 0.67, 0.75, 0.9];
const KINDS = ["b", "c", "r"] as const;
const PALETTE: Record<(typeof KINDS)[number], string[]> = {
  b: ["1a1530", "33a3ff", "7fc8ff", "1478d6", "ffffff", "f4f7ff"],
  c: ["1a1530", "fff8ee", "f4f7ff"],
  r: ["1a1530", "33a3ff", "7fc8ff", "1478d6", "f4f7ff"],
};
/** The boxes at pixel size P (CSS px), spaced to match. */
const body = (P: number) => `<div data-chu-pixel="${P}">${[["e", 20], ["o", 21]].flatMap(([row, base], k) => OFFSETS.map((f, i) => {
  const x = Number(base) + i * 45 * P + f, y = Number(base) + k * 115 * P + f;
  return `<button class="p chu-box chu-button" id="b${row}${i}" style="left:${x}px;top:${y}px"></button>`
    + `<div class="p chu-box chu-card" id="c${row}${i}" style="left:${x}px;top:${y + 35 * P}px;width:${32 * P}px;height:${20 * P}px"></div>`
    + `<span class="p chu-box chu-radio" id="r${row}${i}" style="left:${x}px;top:${y + 70 * P}px"><input type="radio" checked name="r${row}${i}"></span>`;
})).join("")}</div>`;
const style = ".p { position: absolute; } button.chu-button { inline-size: calc(32 * var(--chu-pixel)); padding: 0; }";

interface Image { width: number; height: number; data: Uint8Array }
/** Decodes Playwright's screenshots: 8-bit RGB or RGBA, not interlaced. */
function decode(png: Buffer): Image {
  let pos = 8, width = 0, height = 0, channels = 4;
  const idat: Buffer[] = [];
  while (pos < png.length) {
    const len = png.readUInt32BE(pos), type = png.toString("ascii", pos + 4, pos + 8), data = png.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") { width = data.readUInt32BE(0); height = data.readUInt32BE(4); channels = data[9] === 6 ? 4 : 3; }
    else if (type === "IDAT") idat.push(data);
    pos += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat)), stride = width * channels, out = new Uint8Array(width * height * 3);
  let prev = new Uint8Array(stride), p = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[p++]!, cur = new Uint8Array(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels]! : 0, b = prev[x]!, c = x >= channels ? prev[x - channels]! : 0;
      const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
      const pred = [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][filter]!;
      cur[x] = (raw[p++]! + pred) & 255;
    }
    for (let x = 0; x < width; x++) out.set(cur.subarray(x * channels, x * channels + 3), (y * width + x) * 3);
    prev = cur;
  }
  return { width, height, data: out };
}
const hex = (img: Image, x: number, y: number) => [...img.data.subarray((y * img.width + x) * 3, (y * img.width + x) * 3 + 3)].map((v) => v.toString(16).padStart(2, "0")).join("");

let browser: Browser;
let assets: BoxAssets;
beforeAll(async () => {
  assets = boxAssets();
  browser = await launch();
}, 60_000);
afterAll(() => browser?.close());

async function shoot(dpr: number, P: number): Promise<{ img: Image; rects: Record<string, number[]> }> {
  const page: Page = await boxPage(browser, assets, { body: body(P), style, components: ["button", "card", "radio"], scheme: "day", context: { viewport: { width: 380 * P, height: 235 * P }, deviceScaleFactor: dpr } });
  const rects = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll(".p")].map((e) => { const b = e.getBoundingClientRect(); return [e.id, [b.x, b.y, b.width, b.height]]; })));
  const img = decode(await page.screenshot());
  await page.context().close();
  return { img, rects };
}

/** Per box: screen pixels off its palette, and of those the ones where the box is one colour all round. */
function count(dpr: number, P: number, shot: { img: Image; rects: Record<string, number[]> }, ideal: Record<string, Map<string, string>>) {
  const result: { id: string; blended: number; seams: number }[] = [];
  for (const k of KINDS) for (const row of ["e", "o"]) for (let i = 0; i < OFFSETS.length; i++) {
    const id = `${k}${row}${i}`, [x, y, w, h] = shot.rects[id]!, pal = new Set(PALETTE[k]);
    // The box is painted from a whole screen pixel; allow one either way, and half a CSS px for its mask tiles.
    const ox = Math.round(x! * dpr), oy = Math.round(y! * dpr), tol = 1 / dpr + 0.5;
    let blended = 0, seams = 0;
    for (let Y = Math.floor((y! - 3 * P) * dpr); Y < Math.ceil((y! + h! + 5 * P) * dpr); Y++) for (let X = Math.floor((x! - 3 * P) * dpr); X < Math.ceil((x! + w! + 5 * P) * dpr); X++) {
      if (pal.has(hex(shot.img, X, Y))) continue;
      blended++;
      const seen = new Set<string>();
      for (let ay = Math.floor(((Y - oy) / dpr - tol) / P); ay <= Math.floor(((Y + 1 - oy) / dpr + tol - 1e-6) / P); ay++)
        for (let ax = Math.floor(((X - ox) / dpr - tol) / P); ax <= Math.floor(((X + 1 - ox) / dpr + tol - 1e-6) / P); ax++) seen.add(ideal[k]!.get(`${ax},${ay}`) ?? "?");
      if (seen.size === 1 && !seen.has("?")) seams++;
    }
    result.push({ id, blended, seams });
  }
  return result;
}

describe.each([2, 4])("box: whole pixels on real screens, %s px pixel", (P) => {
  let ideal: Record<string, Map<string, string>>;
  beforeAll(async () => {
    // Each box's colours pixel by pixel, from a whole CSS px at 100%, where every pixel is crisp.
    const { img, rects } = await shoot(1, P);
    ideal = {};
    for (const k of KINDS) {
      const [x, y, w, h] = rects[`${k}e0`]!, cells = new Map<string, string>();
      for (let cy = -3; cy < (h! + 5 * P) / P; cy++) for (let cx = -3; cx < (w! + 5 * P) / P; cx++) cells.set(`${cx},${cy}`, hex(img, Math.round(x!) + cx * P, Math.round(y!) + cy * P));
      ideal[k] = cells;
    }
  }, 60_000);

  it.each([1, 2, 3])("at %sx, no screen pixel of any box is a blend, at any offset", async (dpr) => {
    const blends = count(dpr, P, await shoot(dpr, P), ideal).filter((r) => r.blended);
    expect(blends).toEqual([]);
  }, 30_000);

  it.each([1.25, 1.5, 1.75, 2.625])("at %sx, no seams: nothing blends where a box is one colour all round", async (dpr) => {
    const result = count(dpr, P, await shoot(dpr, P), ideal);
    expect(result.filter((r) => r.seams)).toEqual([]);
    // The edges are soft here (screen pixels cannot all fall on the pixel grid), so the boxes are drawn at all.
    expect(result.some((r) => r.blended)).toBe(true);
  }, 30_000);
});
