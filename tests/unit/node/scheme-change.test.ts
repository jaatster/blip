/**
 * Auto's change of time of day, filmed in Chromium: Day to Sunset at 17:00, Sunset to Night at 19:00, Night to Day at
 * 6:00, with Playwright's clock driving autoScheme() and the dither held at each of its frames.
 *
 * At every step, before the change, at each frame of the dither, after it and every ten seconds of the minute after
 * (where the old palette walk stepped), every text pair the scheme roles make is measured on the screen: 4.5:1 for
 * text, 3:1 for outlines and the focus ring. During the dither every pixel shows the old picture or the new one,
 * never a mix, in whole cells of the dither: a palette is never seen half way to another.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { inflateSync } from "node:zlib";
import type { Browser, Page } from "playwright";
import { STYLES, assets, contrast, launch, open, type Assets } from "./base-page.ts";

/** Foreground role, background role, the contrast it needs: the token build's pairs (BLIP-T060, BLIP-T061). */
const PAIRS: [string, string, number][] = [];
for (const s of ["bg", "surface", "surface-raised", "surface-sunken", "surface-panel"]) PAIRS.push(["text", s, 4.5], ["text-muted", s, 4.5]);
for (const i of ["accent", "info", "success", "warning", "danger"]) {
  for (const s of ["bg", "surface", "surface-raised"]) PAIRS.push([`${i}-text`, s, 4.5]);
  PAIRS.push([`${i}-on`, i, 4.5], [`${i}-on`, `${i}-light`, 4.5]);
}
for (const s of ["bg", "surface"]) PAIRS.push(["link-visited", s, 4.5]);
PAIRS.push(["selection-text", "selection-bg", 4.5], ["text-inverse", "text", 4.5], ["line", "bg", 3], ["line", "surface", 3]);

// Each pair is drawn as a swatch of the foreground on a strip of the background, with some real text beside them.
const body = `<main style="padding:12px">
  <p style="margin:0 0 8px">Level 3: Cloud Castle. Collect every coin before the timer runs out. <a href="#">Read the rules</a></p>
  <p class="blip-muted" style="margin:0 0 8px">Best time 1:42. Saved a moment ago.</p>
  ${PAIRS.map(([fg, bg], k) => `<div data-pair="${k}" style="display:inline-block;margin:0 4px 4px 0;padding:6px;background:var(--blip-${bg})"><i style="display:block;inline-size:8px;block-size:8px;background:var(--blip-${fg})"></i></div>`).join("")}
  <div data-ring style="display:inline-block;padding:6px;background:var(--blip-bg)"><i style="display:block;inline-size:8px;block-size:8px;background:var(--blip-focus)"></i></div>
</main>`;
const head = `${STYLES}<script type="module">import { autoScheme } from "/core.js"; autoScheme();</script>`;

/** Holds every animation on the view transition's pictures at its start, so the test can step it frame by frame. */
function hold(): void {
  const animate = Element.prototype.animate;
  Element.prototype.animate = function (this: Element, keyframes, options) {
    const a = animate.call(this, keyframes, options);
    if (typeof options === "object" && options.pseudoElement?.startsWith("::view-transition")) {
      a.pause();
      (window as unknown as { held: Animation[] }).held.push(a);
    }
    return a;
  };
  (window as unknown as { held: Animation[] }).held = [];
}

interface Shot {
  width: number;
  height: number;
  px: Uint8Array;
}
/** Decodes a Playwright screenshot (8-bit RGBA or RGB PNG, not interlaced). */
function png(buf: Buffer): Shot {
  let pos = 8, width = 0, height = 0, type = 6;
  const idat: Buffer[] = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), name = buf.toString("ascii", pos + 4, pos + 8), data = buf.subarray(pos + 8, pos + 8 + len);
    if (name === "IHDR") [width, height, type] = [data.readUInt32BE(0), data.readUInt32BE(4), data[9]!];
    else if (name === "IDAT") idat.push(data);
    pos += 12 + len;
  }
  const ch = type === 6 ? 4 : 3, raw = inflateSync(Buffer.concat(idat)), stride = width * ch, px = new Uint8Array(width * height * 4);
  let prev = new Uint8Array(stride), p = 0;
  for (let y = 0; y < height; y++) {
    const f = raw[p++]!, cur = new Uint8Array(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? cur[x - ch]! : 0, b = prev[x]!, c = x >= ch ? prev[x - ch]! : 0, pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
      cur[x] = (raw[p++]! + [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][f]!) & 255;
    }
    for (let x = 0; x < width; x++) px.set([cur[x * ch]!, cur[x * ch + 1]!, cur[x * ch + 2]!, 255], (y * width + x) * 4);
    prev = cur;
  }
  return { width, height, px };
}
const at = (s: Shot, x: number, y: number) => `rgb(${s.px[(y * s.width + x) * 4]}, ${s.px[(y * s.width + x) * 4 + 1]}, ${s.px[(y * s.width + x) * 4 + 2]})`;

/** Measures every pair on the screen: the swatch's middle against its strip's corner. */
async function pairs(page: Page): Promise<{ pair: string; ratio: number; min: number }[]> {
  const shot = png(await page.screenshot());
  const boxes = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>("[data-pair], [data-ring]")].map((e) => {
    const r = e.getBoundingClientRect();
    return [Math.round(r.x), Math.round(r.y)];
  }));
  const out = PAIRS.map(([fg, bg, min], k) => {
    const [x, y] = boxes[k]!;
    return { pair: `${fg} on ${bg}`, ratio: contrast(at(shot, x! + 10, y! + 10), at(shot, x! + 1, y! + 1)), min };
  });
  // The focus ring: yellow, with an ink edge; one of the two stands 3:1 against the page.
  const [x, y] = boxes.at(-1)!;
  const edge = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--blip-focus-edge"));
  out.push({ pair: "focus ring on bg", ratio: Math.max(contrast(at(shot, x! + 10, y! + 10), at(shot, x! + 1, y! + 1)), contrast(edge, at(shot, x! + 1, y! + 1))), min: 3 });
  return out;
}
const failing = (list: { pair: string; ratio: number; min: number }[]) => list.filter((p) => p.ratio < p.min).map((p) => `${p.pair} ${p.ratio.toFixed(2)}:1`);

let browser: Browser;
let a: Assets;
beforeAll(async () => {
  [a, browser] = await Promise.all([assets(), launch()]);
}, 60_000);
afterAll(() => browser?.close());

describe.each([
  ["day", "sunset", [16, 59, 30]],
  ["sunset", "night", [18, 59, 30]],
  ["night", "day", [5, 59, 30]],
] as const)("%s to %s", (from, to, [h, m, s]) => {
  it("keeps every text pair readable at every step, and dithers whole palettes without mixing them", async () => {
    const page = await open(browser, a, { head, body, before: async (p) => {
      await p.clock.install({ time: new Date(2026, 5, 21, h, m, s) });
      await p.addInitScript(hold);
    } });
    const scheme = () => page.evaluate(() => document.documentElement.dataset.blipScheme);
    expect(await scheme()).toBe(from);
    expect(failing(await pairs(page)), `${from}, before`).toEqual([]);
    const before = png(await page.screenshot());

    // The minute's tick. The scheme changes behind a view transition whose dither is held at each of its frames.
    await page.clock.runFor(60_000);
    const held = () => page.evaluate(() => (window as unknown as { held: Animation[] }).held.length);
    for (let tries = 0; tries < 50 && !(await held()); tries++) await page.waitForTimeout(10);
    const dithers = await held(), frames: Shot[] = [];
    if (dithers) {
      for (const t of [20, 60, 100]) {
        await page.evaluate((t) => void ((window as unknown as { held: Animation[] }).held[0]!.currentTime = t), t);
        frames.push(png(await page.screenshot()));
      }
      await page.evaluate(() => (window as unknown as { held: Animation[] }).held[0]!.finish());
      for (let tries = 0; tries < 100 && (await page.evaluate(() => !!document.activeViewTransition)); tries++) await page.waitForTimeout(10);
    }
    expect(await scheme()).toBe(to);
    expect(failing(await pairs(page)), `${to}, at the change`).toEqual([]);
    const after = png(await page.screenshot());

    // The minute after, ten seconds at a time (where a palette walk would step; anything still moving is held at
    // that moment): every pair stays readable, and nothing creeps between the two palettes.
    for (let step = 1; step <= 6; step++) {
      await page.clock.runFor(10_000);
      await page.evaluate((t) => document.getAnimations().forEach((x) => (x.pause(), (x.currentTime = t))), step * 10_000 - 1);
      expect(failing(await pairs(page)), `${to}, ${step * 10} s after the change`).toEqual([]);
      expect(Buffer.compare(Buffer.from(png(await page.screenshot()).px), Buffer.from(after.px)), `${step * 10} s after`).toBe(0);
    }

    // The dither: every pixel of every frame is the old picture's or the new one's, in whole 2 x 2 cells, and the
    // new picture's share grows a quarter at a time.
    expect(dithers, "the change runs one dither").toBe(1);
    frames.forEach((f, k) => {
      let mixed = 0, changed = 0, shown = 0, split = 0;
      for (let y = 0; y + 1 < f.height; y += 2) {
        for (let x = 0; x + 1 < f.width; x += 2) {
          const cell = [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]].map(([px, py]) => {
            const o = (py! * f.width + px!) * 4, same = (s: Shot) => s.px[o] === f.px[o] && s.px[o + 1] === f.px[o + 1] && s.px[o + 2] === f.px[o + 2];
            const isOld = same(before), isNew = same(after);
            if (!isOld && !isNew) mixed++;
            return isOld === isNew ? undefined : isNew;
          }).filter((v) => v !== undefined);
          if (!cell.length) continue;
          changed++;
          if (cell.every(Boolean)) shown++;
          else if (cell.some(Boolean)) split++;
        }
      }
      expect(mixed, `frame ${k + 1}: pixels that are neither picture`).toBe(0);
      expect(split, `frame ${k + 1}: cells split between the pictures`).toBe(0);
      expect(shown / changed, `frame ${k + 1}: the new picture's share`).toBeCloseTo((k + 1) / 4, 1);
    });
    await page.context().close();
  }, 30_000);
});

it("changes at once with fade: false: no view transition, no dither", async () => {
  const page = await open(browser, a, {
    head: `${STYLES}<script type="module">import { autoScheme } from "/core.js"; autoScheme(document.querySelector("section"), { fade: false });</script>`,
    body: '<section data-blip-scheme="day"><p>Text</p></section>',
    before: async (p) => {
      await p.clock.install({ time: new Date(2026, 5, 21, 18, 59, 30) });
      await p.addInitScript(hold);
    },
  });
  await page.clock.runFor(60_000);
  expect(await page.evaluate(() => [document.querySelector("section")!.dataset.blipScheme, !!document.activeViewTransition, (window as unknown as { held: Animation[] }).held.length])).toEqual(["night", false, 0]);
  await page.context().close();
}, 30_000);
