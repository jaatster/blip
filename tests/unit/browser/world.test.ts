/**
 * The world backdrop (@jaatster/blip-effects, drawWorld): the TV's landscape, drawn a pixel at a time. It must come out the
 * same every time, whatever the random service or the clock say, so screenshots and the TV agree. The pinned hashes
 * use a made-up palette, so they change only when the drawing changes, not when a world colour is retuned.
 */
import { afterEach, beforeEach, describe, expect, inject, it } from "vitest";
import { provide, type Scheme } from "@jaatster/blip-core";
import { drawWorld, worldPalette, type DrawWorldOptions, type WorldLayer } from "../../../packages/effects/src/world.ts";

/** 44 distinct colours, one per palette slot. */
const PALETTE = Array.from({ length: 44 }, (_, i) => (0x102030 + i * 0x050b17) & 0xffffff);

/** A 2D context that keeps the ImageData drawWorld puts, instead of painting it. */
function draw(scheme: Scheme, w = 320, h = 180, options: DrawWorldOptions = { palette: PALETTE }): ImageData {
  let image: ImageData | undefined;
  const ctx = {
    createImageData: (cw: number, ch: number) => new ImageData(cw, ch),
    putImageData: (img: ImageData) => void (image = img),
  } as unknown as CanvasRenderingContext2D;
  drawWorld(ctx, scheme, w, h, options);
  if (!image) throw new Error("drawWorld put no picture");
  return image;
}

async function hash(image: ImageData): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", image.data);
  return [...new Uint8Array(digest).slice(0, 8)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

let restore: () => void = () => undefined;
beforeEach(() => {
  restore = provide({ seed: 42, clock: () => new Date(2026, 5, 21, 12, 0) });
});
afterEach(() => restore());

describe("drawWorld", () => {
  it("draws the same picture every time", async () => {
    for (const scheme of ["day", "sunset", "night"] as const) {
      expect(await hash(draw(scheme)), scheme).toBe(await hash(draw(scheme)));
    }
  });

  it("keeps each time of day's picture (320 x 180, the TV's), and larger and smaller worlds", async () => {
    const hashes = {
      day: await hash(draw("day")),
      sunset: await hash(draw("sunset")),
      night: await hash(draw("night")),
      "day 400 x 200": await hash(draw("day", 400, 200)),
      "night 640 x 360": await hash(draw("night", 640, 360)),
      "sunset 320 x 120": await hash(draw("sunset", 320, 120)),
    };
    expect(new Set(Object.values(hashes)).size).toBe(6);
    expect(hashes).toMatchInlineSnapshot(`
      {
        "day": "9f325f1d342c2ab2",
        "day 400 x 200": "b929eb595e3c6fd1",
        "night": "dff27e96acccb5d7",
        "night 640 x 360": "470d07e8b31443c5",
        "sunset": "109ef32e5523b743",
        "sunset 320 x 120": "6459a837c82de767",
      }
    `);
  });

  it("does not depend on the random service or the clock", async () => {
    const pinned = await hash(draw("night", 400, 200));
    const again = provide({ seed: 999, clock: () => new Date(2031, 0, 1, 3, 0) });
    try {
      expect(await hash(draw("night", 400, 200))).toBe(pinned);
    } finally {
      again();
    }
  });

  it("draws the sun at sunset and the moon and stars at night (the features option)", async () => {
    const day = await hash(draw("day"));
    expect(await hash(draw("sunset"))).not.toBe(day);
    expect(await hash(draw("night"))).not.toBe(day);
    expect(await hash(draw("day", 320, 180, { palette: PALETTE, features: "night" }))).toBe(await hash(draw("night")));
  });

  it("keeps the moon and the sun clear of boxes to avoid, the same way every time", async () => {
    /** How many pixels of palette slot k lie in the box [x0, y0, x1, y1) of a 320 x 180 picture. */
    const count = (image: ImageData, k: number, [x0, y0, x1, y1] = [0, 0, 320, 180]) => {
      let n = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * image.width + x) * 4, rgb = (image.data[i]! << 16) | (image.data[i + 1]! << 8) | image.data[i + 2]!;
          if (rgb === PALETTE[k]) n++;
        }
      }
      return n;
    };
    const MOON = 29, SUN = 28;
    // A box over the TV's moon (at 200, 30): the moon goes to the nearest clear place, whole and outside the box.
    const box = [180, 10, 230, 60] as const;
    const night = draw("night", 320, 180, { palette: PALETTE, avoid: [box] });
    expect(count(night, MOON, box)).toBe(0);
    expect(count(night, MOON)).toBe(count(draw("night"), MOON));
    expect(await hash(night)).not.toBe(await hash(draw("night")));
    expect(await hash(night)).toBe(await hash(draw("night", 320, 180, { palette: PALETTE, avoid: [box] })));
    // A box clear of the moon changes nothing: the TV's picture.
    expect(await hash(draw("night", 320, 180, { palette: PALETTE, avoid: [[0, 100, 20, 120]] }))).toBe(await hash(draw("night")));
    // The sun slides along the horizon, out of a box over it (at 160, 84).
    const low = [140, 66, 182, 100] as const;
    const sunset = draw("sunset", 320, 180, { palette: PALETTE, avoid: [low] });
    expect(count(draw("sunset"), SUN, low)).toBeGreaterThan(0);
    expect(count(sunset, SUN, low)).toBe(0);
    expect(count(sunset, SUN)).toBeGreaterThan(0);
    // With no clear place anywhere in the sky above the peaks, not even across it, the moon stays out of sight
    // rather than sit behind the words.
    const covered = draw("night", 320, 180, { palette: PALETTE, avoid: [[0, 0, 320, 60]] });
    expect(count(covered, MOON)).toBe(0);
  });

  it("bakes the clouds in unless told not to", async () => {
    expect(await hash(draw("day", 320, 180, { palette: PALETTE, clouds: false }))).not.toBe(await hash(draw("day")));
  });

  it("draws one layer alone, clear elsewhere, and the five layers stack into the whole picture", async () => {
    const layers: WorldLayer[] = ["sky", "peaks", "hills", "near", "ground"];
    const whole = draw("night");
    const stacked = new Uint32Array(whole.width * whole.height);
    for (const layer of layers) {
      const alone = new Uint32Array(draw("night", 320, 180, { palette: PALETTE, layer }).data.buffer);
      if (layer !== "sky") expect(alone.some((p) => p === 0), `${layer} is clear somewhere`).toBe(true);
      alone.forEach((p, i) => p && (stacked[i] = p));
    }
    expect(stacked).toEqual(new Uint32Array(whole.data.buffer));
    // Every pixel of the whole picture is opaque and one of the palette's colours.
    const colours = new Set(PALETTE);
    const strays: number[] = [];
    for (let i = 0; i < whole.data.length; i += 4) {
      const rgb = (whole.data[i]! << 16) | (whole.data[i + 1]! << 8) | whole.data[i + 2]!;
      if (whole.data[i + 3] !== 255 || !colours.has(rgb)) strays.push(i / 4);
    }
    expect(strays).toEqual([]);
  });

  it("lands on a real canvas exactly as drawn", () => {
    const canvas = Object.assign(document.createElement("canvas"), { width: 320, height: 180 });
    const ctx = canvas.getContext("2d")!;
    drawWorld(ctx, "sunset", 320, 180, { palette: PALETTE });
    expect(ctx.getImageData(0, 0, 320, 180).data).toEqual(draw("sunset").data);
  });
});

describe("drawWorld with the tokens' colours", () => {
  let style: HTMLStyleElement;
  beforeEach(() => {
    style = document.head.appendChild(Object.assign(document.createElement("style"), { textContent: inject("tokensCss") }));
  });
  afterEach(() => style.remove());

  it("reads 44 colours per time of day from the --chu-world-* tokens", () => {
    const day = worldPalette("day"), night = worldPalette("night");
    expect(day).toHaveLength(44);
    expect(night).toHaveLength(44);
    // Every slot is set (an unset one reads as 0, black, which no world colour is).
    expect(day.filter((c) => c === 0)).toEqual([]);
    expect(night.filter((c) => c === 0)).toEqual([]);
    // The first 28 are the time of day's own; the sky things, flowers and lights are shared.
    expect(day.slice(0, 28)).not.toEqual(night.slice(0, 28));
    expect(day.slice(28)).toEqual(night.slice(28));
  });

  it("draws the same picture every time from the page's tokens", async () => {
    for (const scheme of ["day", "sunset", "night"] as const) {
      const fromTokens = draw(scheme, 320, 180, {});
      expect(await hash(fromTokens), scheme).toBe(await hash(draw(scheme, 320, 180, {})));
      expect(await hash(fromTokens), scheme).toBe(await hash(draw(scheme, 320, 180, { palette: worldPalette(scheme) })));
    }
    expect(await hash(draw("day", 320, 180, {}))).not.toBe(await hash(draw("night", 320, 180, {})));
  });

  it("takes the night sky from the palette (data-chu-palette); Day and Sunset are the same in every palette", () => {
    const presets = document.head.appendChild(Object.assign(document.createElement("style"), { textContent: inject("palettesCss") }));
    const html = document.documentElement;
    try {
      const candy = { day: worldPalette("day"), night: worldPalette("night") };
      html.dataset.chuPalette = "grape";
      expect(worldPalette("night").slice(0, 28)).not.toEqual(candy.night.slice(0, 28));
      // Grape is the TV's own night: its sky starts at #3A3E7C.
      expect(worldPalette("night")[0]).toBe(0x3a3e7c);
      expect(worldPalette("day")).toEqual(candy.day);
    } finally {
      delete html.dataset.chuPalette;
      presets.remove();
    }
  });
});
