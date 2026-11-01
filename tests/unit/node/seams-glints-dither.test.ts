/**
 * The box's glints and disabled dither on real screens, in Chromium at real device pixel ratios (box-seams.test.ts
 * has the method):
 *
 *   glints   On a cream box the light band and the glints are the same white. Each glint's layer starts a pixel
 *            higher, see-through there, so at 125% to 262.5% no cream shows between the band and a glint just below
 *            it (it did at 150%, 175% and 262.5%), and at 100% the pixels over the glints keep their own colour.
 *   dither   A disabled box's dither is drawn unsmoothed: at a fractional ratio every screen pixel inside it is the
 *            dither's colour or the fill's, never a mix (smoothed, the tiles' edges let what lies under them through
 *            as a faint grid).
 *   shows    A disabled segment, menu item and command result always show their dither, by Day, Sunset and Night
 *            (a bare segment's dither matched the sunken rail under it).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { inflateSync } from "node:zlib";
import type { Browser, Page } from "playwright";
import { boxAssets, boxPage, launch, type BoxAssets } from "./box-page.ts";

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
/** Whether a colour is one of these, give or take 2 in each channel (compositing rounds). */
const near = (c: string, palette: Iterable<string>) => [...palette].some((q) => [0, 2, 4].every((i) => Math.abs(parseInt(c.slice(i, i + 2), 16) - parseInt(q.slice(i, i + 2), 16)) <= 2));

let browser: Browser;
let assets: BoxAssets;
beforeAll(async () => {
  assets = boxAssets();
  browser = await launch();
}, 60_000);
afterAll(() => browser?.close());

async function shot(body: string, dpr: number, { components = [] as string[], scheme = "day", size = [800, 400] } = {}): Promise<{ page: Page; img: Image; rects: Record<string, number[]> }> {
  const page = await boxPage(browser, assets, { body, components, scheme, style: ".p { position: absolute; }", context: { viewport: { width: size[0]!, height: size[1]! }, deviceScaleFactor: dpr } });
  const rects = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll("[id]")].map((e) => { const b = e.getBoundingClientRect(); return [e.id, [b.x, b.y, b.width, b.height]]; })));
  return { page, img: decode(await page.screenshot()), rects };
}

describe("seams: a white glint under a white band", () => {
  const N = 20;
  // Cream boxes with a keycap's corners and bands (a one-pixel light band, and two on a large key) and the default
  // two, laid out in a line of text as keycaps are: each at another fraction of a pixel across and down, and of
  // another width.
  const BANDS = [1, 2, 3];
  const body = BANDS.map((band, k) => `<p style="position:absolute;left:20px;top:${20 + k * 60}px;margin:0;font:13px/1.37 sans-serif;white-space:nowrap">${Array.from({ length: N }, (_, i) => `<span style="display:inline-block;width:${12 + i / N}px"></span><span class="blip-box" data-tone="neutral" data-blip-r="2" id="g${band}-${i}" style="--blip-band-top:${band};--blip-band-bottom:3;display:inline-block;vertical-align:${(i % 5) * 0.37}px;width:${35 + ((i * 3) % N) / N}px;height:24px"></span>`).join("")}</p>`).join("");

  /**
   * Per box: screen pixels off its palette at 1x where it is one colour all round at 1x (within tol CSS px), each box
   * against itself at 1x: from its top-left corner, and for its far half from its right edge, as the seams lane does
   * (a box of fractional width is a whole pixel wider or narrower at some ratios).
   */
  function seams(r: { img: Image; rects: Record<string, number[]> }, one: { img: Image; rects: Record<string, number[]> }, dpr: number) {
    const out: string[] = [];
    for (const id of Object.keys(one.rects).filter((k) => k.startsWith("g"))) {
      const [x, y, w, h] = r.rects[id]!, [x1, y1, w1] = one.rects[id]!;
      const ox = Math.round(x! * dpr), oy = Math.round(y! * dpr), ox1 = Math.round(x1!), oy1 = Math.round(y1!), tol = 1 / dpr + 0.5;
      const W = Math.floor(w! / 2 + 1e-6) * 2, W1 = Math.floor(w1! / 2 + 1e-6) * 2;
      const mapX = (k: number) => (k < W / 2 ? k : k - (W - W1));
      const palette = new Set<string>();
      for (let cy = -2; cy < h! + 4; cy++) for (let cx = -2; cx < w1! + 4; cx++) palette.add(hex(one.img, ox1 + cx, oy1 + cy));
      let n = 0;
      for (let Y = Math.floor((y! - 2) * dpr); Y < Math.ceil((y! + h! + 4) * dpr); Y++) for (let X = Math.floor((x! - 2) * dpr); X < Math.ceil((x! + w! + 4) * dpr); X++) {
        if (near(hex(r.img, X, Y), palette)) continue;
        const seen = new Set<string>();
        for (let ky = Math.floor((Y - oy) / dpr - tol); ky <= Math.floor((Y + 1 - oy) / dpr + tol - 1e-6); ky++)
          for (let kx = Math.floor((X - ox) / dpr - tol); kx <= Math.floor((X + 1 - ox) / dpr + tol - 1e-6); kx++) seen.add(kx < -2 || ky < -2 || kx >= w1! + 4 || ky >= h! + 4 ? "?" : hex(one.img, ox1 + mapX(kx), oy1 + ky));
        if (seen.size === 1 && !seen.has("?")) n++;
      }
      if (n) out.push(`${id}: ${n}`);
    }
    return out;
  }

  let one: { img: Image; rects: Record<string, number[]> };
  beforeAll(async () => {
    // Every box at 100%, where every pixel is crisp.
    const { page, img, rects } = await shot(body, 1, { size: [1100, 240] });
    one = { img, rects };
    await page.context().close();
  }, 60_000);

  it.each([1.25, 1.5, 1.75, 2.625])("at %sx, no cream shows between the band and a glint, at any position or width", async (dpr) => {
    const { page, img, rects } = await shot(body, dpr, { size: [1100, 240] });
    expect(seams({ img, rects }, one, dpr)).toEqual([]);
    await page.context().close();
  }, 30_000);

  it.each([1, 2])("at %sx, the glints paint their four pixels white and their reach paints nothing", async (dpr) => {
    // Accent boxes (a light blue band, so a white glint shows anywhere) with no band and bands of one to three
    // pixels, each beside a twin without glints: the two differ in the four glint pixels and nowhere else.
    const twins = [0, 1, 2, 3].flatMap((band) => ["", "--blip-box-glint:transparent;"].map((off, k) => `<span class="p blip-box" id="a${band}${k ? "-off" : ""}" style="${off}--blip-band-top:${band};left:${20 + k * 60}px;top:${20 + band * 44}px;width:48px;height:32px"></span>`)).join("");
    const { page, img, rects } = await shot(twins, dpr);
    for (const band of [0, 1, 2, 3]) {
      const [x, y] = rects[`a${band}`]!, [x2] = rects[`a${band}-off`]!;
      const differ: string[] = [];
      for (let row = 0; row < 16; row++) for (let col = 0; col < 24; col++) {
        // The middle of each pixel (2 CSS px a pixel).
        const X = Math.round((x! + col * 2 + 1) * dpr), Y = Math.round((y! + row * 2 + 1) * dpr), X2 = Math.round((x2! + col * 2 + 1) * dpr);
        if (hex(img, X, Y) !== hex(img, X2, Y)) differ.push(`${col},${row} ${hex(img, X, Y)}`);
      }
      // Radius 3: the glints sit 3 pixels in, two at row 2 from column 3, one below their left at row 3, and one at
      // the right, 4 pixels in from the right edge (column 20 of 24).
      expect(differ, `band ${band}`).toEqual(["3,2 ffffff", "4,2 ffffff", "20,2 ffffff", "2,3 ffffff"]);
    }
    await page.context().close();
  });
});

describe("seams: the disabled dither", () => {
  const OFFSETS = [0, 0.25, 0.5, 0.75];
  const body = OFFSETS.map((f, i) => `<button class="p blip-box blip-button" data-variant="outline" disabled id="d${i}" style="left:${20 + i * 140 + f}px;top:${20 + f}px;inline-size:120px;block-size:80px;padding:0"></button>`).join("");

  it.each([1.25, 1.5, 1.75, 2.625])("at %sx, every screen pixel inside the dither is its colour or the fill's", async (dpr) => {
    const { page, img, rects } = await shot(body, dpr, { components: ["button"] });
    const [fill, dither] = await page.$eval("#d0", (e) => ["--blip-box-fill", "--blip-box-dither"].map((n) => {
      const probe = document.body.appendChild(document.createElement("i"));
      probe.style.color = getComputedStyle(e).getPropertyValue(n);
      const c = getComputedStyle(probe).color.match(/\d+/g)!.slice(0, 3).map((d) => Number(d).toString(16).padStart(2, "0")).join("");
      probe.remove();
      return c;
    }));
    expect(fill).not.toBe(dither);
    const mixed: string[] = [];
    for (let i = 0; i < OFFSETS.length; i++) {
      // Inside the outline and its corners: 8 CSS px in from every edge.
      const [x, y, w, h] = rects[`d${i}`]!;
      let n = 0;
      for (let Y = Math.ceil((y! + 8) * dpr); Y < Math.floor((y! + h! - 8) * dpr); Y++) for (let X = Math.ceil((x! + 8) * dpr); X < Math.floor((x! + w! - 8) * dpr); X++) if (!near(hex(img, X, Y), [fill!, dither!])) n++;
      if (n) mixed.push(`d${i}: ${n}`);
    }
    expect(mixed).toEqual([]);
    await page.context().close();
  }, 30_000);
});

describe("seams: a disabled box always shows its dither", () => {
  const body = `<div class="blip-box blip-segmented" role="radiogroup" aria-label="Players">
      <button class="blip-box" type="button" role="radio" aria-checked="false" id="seg-rest">1P</button>
      <button class="blip-box" type="button" role="radio" aria-checked="true">2P</button>
      <button class="blip-box" type="button" role="radio" aria-checked="false" disabled id="seg">4P</button>
    </div>
    <fieldset class="blip-box blip-segmented" disabled id="rail">
      <legend class="blip-sr-only">Sound</legend>
      <label class="blip-box" id="seg-off"><input type="radio" name="s" value="off">Off</label>
      <label class="blip-box"><input type="radio" name="s" value="on" checked>On</label>
    </fieldset>
    <div class="blip-box blip-menu-list" role="menu" aria-label="Level"><button class="blip-box blip-menu-item" role="menuitem" aria-disabled="true" id="menu"><span class="blip-menu-label">Publish</span></button></div>
    <div class="blip-box blip-command" role="listbox" aria-label="Results" style="display:block;inline-size:200px"><div class="blip-box blip-command-item" role="option" aria-disabled="true" id="command"><span class="blip-command-label">Publish</span></div></div>`;

  it.each(["day", "sunset", "night"])("%s: without its dither a disabled segment, menu item and command result look different", async (scheme) => {
    const { page } = await shot(body, 1, { components: ["segmented", "menu", "command"], scheme });
    await page.addStyleTag({ content: ".off, .off::after { --blip-box-dither: transparent !important; }" });
    const changed = async (id: string) => {
      const clip = await page.$eval(`#${id}`, (e) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height }; });
      const a = decode(await page.screenshot({ clip }));
      await page.$eval(`#${id}`, (e) => e.classList.add("off"));
      const b = decode(await page.screenshot({ clip }));
      await page.$eval(`#${id}`, (e) => e.classList.remove("off"));
      let n = 0;
      for (let k = 0; k < a.data.length; k += 3) if (a.data[k] !== b.data[k] || a.data[k + 1] !== b.data[k + 1] || a.data[k + 2] !== b.data[k + 2]) n++;
      return n / (a.width * a.height);
    };
    // A dither covers a quarter of the box or more (half its pixels, less the label and the corners).
    for (const id of ["seg", "seg-off", "menu", "command"]) expect(await changed(id), `${scheme} #${id}`).toBeGreaterThan(0.2);
    // The segment beside it at rest has no dither at all.
    expect(await changed("seg-rest"), `${scheme} #seg-rest`).toBe(0);
    await page.context().close();
  });
});
