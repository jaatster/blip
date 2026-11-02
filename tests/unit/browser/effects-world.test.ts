/**
 * The world (@jaatster/blip-effects) keeps off text and on whole device pixels: no star sits between words or under
 * letters, every canvas and every slide lands on whole device pixels at 125%, 175% and 262.5%, and a parallax slide
 * cut short still lands on a whole world pixel.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, inject, it } from "vitest";
import { provide } from "@jaatster/blip-core";
import { drawWorld, type DrawWorldOptions, type WorldBox } from "../../../packages/effects/src/world.ts";
import motionCss from "../../../packages/core/src/css/motion.css?raw";
import worldCss from "../../../packages/effects/src/world.css?raw";
import { mount } from "../support/dom.ts";

/** 44 distinct colours, one per palette slot; slots 32 and 33 are the stars. */
const PALETTE = Array.from({ length: 44 }, (_, i) => (0x102030 + i * 0x050b17) & 0xffffff);
const STARS = new Set([PALETTE[32], PALETTE[33]]);

function draw(options: DrawWorldOptions = {}): ImageData {
  let image: ImageData | undefined;
  const ctx = {
    createImageData: (w: number, h: number) => new ImageData(w, h),
    putImageData: (img: ImageData) => void (image = img),
  } as unknown as CanvasRenderingContext2D;
  drawWorld(ctx, "night", 320, 180, { palette: PALETTE, clouds: false, ...options });
  return image!;
}
const rgbAt = (img: ImageData, x: number, y: number) => {
  const i = (y * img.width + x) * 4;
  return (img.data[i]! << 16) | (img.data[i + 1]! << 8) | img.data[i + 2]!;
};
/** Every star pixel of a picture, as "x,y". */
const starsIn = (img: ImageData) => {
  const out = new Set<string>();
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) if (STARS.has(rgbAt(img, x, y))) out.add(`${x},${y}`);
  return out;
};

let restore: () => void = () => undefined;
beforeEach(() => {
  restore = provide({ seed: 42, clock: () => new Date(2026, 5, 21, 23, 0) });
});
afterEach(() => restore());

describe("stars and the words over the sky", () => {
  // Words over the left of the sky, clear of the moon (at 200, 30), so nothing else moves.
  const box: WorldBox = [20, 18, 140, 44];
  /** A flare's arms (2) and the margin (5): no star comes nearer the words than that. */
  const near = ([x, y]: number[]) => x! >= box[0] - 7 && x! < box[2] + 7 && y! >= box[1] - 7 && y! < box[3] + 7;

  it("leaves out every star on or near a box to avoid, and moves no other star", () => {
    const all = starsIn(draw()), kept = starsIn(draw({ avoid: [box] }));
    const onWords = [...all].map((p) => p.split(",").map(Number)).filter(near);
    expect(onWords.length, "the TV's sky has stars where the words go").toBeGreaterThan(0);
    expect([...kept].map((p) => p.split(",").map(Number)).filter(near)).toEqual([]);
    expect(kept).toEqual(new Set([...all].filter((p) => !near(p.split(",").map(Number)))));
  });

  it("keeps every star with no boxes to avoid", () => {
    expect(starsIn(draw({ avoid: [] }))).toEqual(starsIn(draw()));
  });
});

describe("<blip-world> at fractional device pixel ratios", () => {
  let style: HTMLStyleElement;
  beforeAll(async () => {
    await import("../../../packages/effects/src/world.ts");
  });
  beforeEach(() => {
    style = document.head.appendChild(Object.assign(document.createElement("style"), { textContent: inject("tokensCss") + worldCss }));
  });
  // The page's own ratio, put back after each test: deleting the stand-in would delete the property itself.
  const own = Object.getOwnPropertyDescriptor(window, "devicePixelRatio");
  afterEach(() => {
    style.remove();
    if (own) Object.defineProperty(window, "devicePixelRatio", own);
    else delete (window as { devicePixelRatio?: number }).devicePixelRatio;
  });
  const ratio = (dpr: number) => Object.defineProperty(window, "devicePixelRatio", { value: dpr, configurable: true });
  /** Whether a length is a whole number of device pixels (computed styles keep about six significant digits). */
  const whole = (css: number, dpr: number) => Math.abs(css * dpr - Math.round(css * dpr)) < 0.01;
  /** A translate's two lengths in CSS pixels ("0px" is both). */
  const moved = (el: Element) => [...getComputedStyle(el).translate.split(" ").map(parseFloat), 0].slice(0, 2).map((v) => v || 0);

  for (const dpr of [1.25, 1.75, 2.625]) {
    it(`makes the world pixel and every canvas whole device pixels at ${dpr}`, () => {
      ratio(dpr);
      // An odd size at an odd place, so nothing lines up by luck.
      const box = mount(`<div style="position:absolute;left:10.3px;top:7.6px;width:301px;height:151px"><blip-world scheme="night" parallax clouds="none"></blip-world></div>`);
      const stage = box.querySelector<HTMLElement>(".blip-world-stage")!;
      const k = Math.round(2 * dpr);
      expect(stage.style.getPropertyValue("--_blip-world-k")).toBe(String(k));
      expect(parseFloat(stage.style.getPropertyValue("--_blip-world-px"))).toBeCloseTo(k / dpr, 9);
      // The stage moves by whole device pixels only.
      expect(moved(stage).every((v) => whole(v, dpr))).toBe(true);
      const canvases = [...stage.querySelectorAll<HTMLCanvasElement>(":scope > canvas")];
      expect(canvases).toHaveLength(5);
      for (const c of canvases) {
        // Laid out a device pixel to a canvas pixel, placed on whole device pixels, scaled up by k.
        expect(parseFloat(c.style.width) * dpr).toBeCloseTo(c.width, 2);
        expect(parseFloat(c.style.height) * dpr).toBeCloseTo(c.height, 2);
        expect(whole(parseFloat(c.style.left), dpr) && whole(parseFloat(c.style.top), dpr)).toBe(true);
        expect(getComputedStyle(c).scale).toBe(String(k));
      }
    });
  }

  it("slides each layer to a whole number of world pixels against the pointer", async () => {
    ratio(1.25);
    const box = mount(`<div style="position:relative;width:400px;height:200px"><blip-world scheme="day" parallax clouds="none"></blip-world></div>`);
    const layers = [...box.querySelectorAll<HTMLElement>(".blip-world-stage > *")];
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 0, clientY: 100 }));
    const x = layers.map((l) => l.style.getPropertyValue("--_blip-world-x"));
    // The sky and its things stay put; each layer nearer slides further, by whole world pixels.
    expect(x.map(Number)).toEqual([0, 0, 3, 6, 9, 12]);
    // Once the slide has landed, each place is a whole number of device pixels.
    await expect.poll(() => getComputedStyle(layers[5]!).translate).not.toBe("0px");
    await new Promise((r) => setTimeout(r, 200));
    for (const l of layers) expect(moved(l).every((v) => whole(v, 1.25))).toBe(true);
  });
});

describe("world.css: a slide cut short", () => {
  let style: HTMLStyleElement;
  beforeEach(() => {
    // The slide's two steps are core's --blip-ease-2.
    style = document.head.appendChild(Object.assign(document.createElement("style"), { textContent: inject("tokensCss") + motionCss + worldCss }));
  });
  afterEach(() => style.remove());

  it("rounds a layer's place to a whole world pixel at every step of the slide", () => {
    const stage = mount(`<div class="blip-world-stage" style="--_blip-world-px: 2.4px"><canvas width="4" height="4"></canvas></div>`);
    const layer = stage.firstElementChild as HTMLElement;
    expect(getComputedStyle(layer).translate).toBe("0px");
    // Two steps from 0 to 3 world pixels: the middle step is 1.5, which the translate rounds to 2.
    layer.style.setProperty("--_blip-world-x", "3");
    const slide = layer.getAnimations()[0]!;
    expect(slide).toBeDefined();
    slide.pause();
    slide.currentTime = 60;
    expect(getComputedStyle(layer).getPropertyValue("--_blip-world-x").trim()).toBe("1.5");
    expect(getComputedStyle(layer).translate).toBe("4.8px");
    // Cut short there and sent on to 6: it starts from 1.5, and its middle step (3.75) lands on 4 pixels, not 3.75.
    layer.style.setProperty("--_blip-world-x", "6");
    const on = layer.getAnimations().find((a) => a !== slide)!;
    on.pause();
    on.currentTime = 60;
    expect(getComputedStyle(layer).getPropertyValue("--_blip-world-x").trim()).toBe("3.75");
    expect(getComputedStyle(layer).translate).toBe("9.6px");
  });
});

describe("<blip-world> and the palette", () => {
  let style: HTMLStyleElement;
  beforeAll(async () => {
    await import("../../../packages/effects/src/world.ts");
  });
  beforeEach(() => {
    style = document.head.appendChild(Object.assign(document.createElement("style"), { textContent: inject("tokensCss") + inject("palettesCss") + worldCss }));
  });
  afterEach(() => {
    style.remove();
    delete document.documentElement.dataset.blipPalette;
  });

  it("paints the night sky again when the page's palette changes", async () => {
    const box = mount(`<div style="position:absolute;left:0;top:0;width:320px;height:180px"><blip-world scheme="night" clouds="none"></blip-world></div>`);
    const layer = box.querySelector<HTMLCanvasElement>(".blip-world-stage > canvas")!;
    /** The colours along the sky's top row: a sky stop, and maybe a star. */
    const top = () => {
      const { data } = layer.getContext("2d")!.getImageData(0, 0, layer.width, 1);
      const out = new Set<number>();
      for (let i = 0; i < data.length; i += 4) out.add((data[i]! << 16) | (data[i + 1]! << 8) | data[i + 2]!);
      return out;
    };
    await expect.poll(() => top().size).toBeGreaterThan(0);
    const world = box.querySelector("blip-world")!;
    /** The night sky's six stops, as the page has them now. */
    const sky = () => new Set([1, 2, 3, 4, 5, 6].map((i) => parseInt(getComputedStyle(world).getPropertyValue(`--blip-world-night-sky-${i}`).trim().slice(1), 16)));
    const candy = sky();
    expect([...top()].some((c) => candy.has(c))).toBe(true);
    // Grape is the TV's own night, purple: none of its sky is Candy's charcoal.
    document.documentElement.dataset.blipPalette = "grape";
    const grape = sky();
    expect([...grape].some((c) => candy.has(c))).toBe(false);
    await expect.poll(() => [...top()].some((c) => grape.has(c))).toBe(true);
    box.remove();
  });
});
