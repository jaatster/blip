/**
 * The world: the TV's soft pastel landscape, drawn in the browser a pixel at a time (PixelScene.java, the TV spec §3,
 * §9). Five layers, back to front: SKY (the six-stop sky, Bayer-dithered; the sun at sunset; the moon and stars at
 * night; clouds), PEAKS (mountains with a lit face, a shadow face and zigzag snow), HILLS (round trees and pines on
 * the middle hills), NEAR (the near hills, bushes and tufts) and GROUND (grass, a grass lip over the dirt, pebbles,
 * flowers).
 *
 *   <div style="position: relative"><pp-world scheme="day" parallax></pp-world> ...content... </div>
 *   <pp-world avoid=".pp-hero-title, .pp-hero-lead"></pp-world>   // the sun and moon keep clear of the words
 *   drawWorld(canvas.getContext("2d"), "night");        // the TV's 320 x 180 picture
 *
 * At 320 x 180 the picture is the TV's, pixel for pixel. Bigger worlds keep the TV's composition in the middle and
 * carry on to the sides in 350-pixel periods of the same landscape; taller ones stretch the sky. Colours are the
 * --pp-world-* tokens, so a palette pack can repaint the world.
 */
import { PixelElement, duration, every, pixel, reducedMotion, run, schemeAt, seeded, services, warn, type Scheme } from "@jaatster/blip-core";
import { SPARKLE, abgr, device, later, mirror, on, pixelCanvas, rgb, sprite } from "./_pixel.js";

export type WorldLayer = "sky" | "peaks" | "hills" | "near" | "ground";
/** 44 colours as 0xRRGGBB, in the order of worldPalette(). */
export type WorldPalette = readonly number[];
export interface DrawWorldOptions {
  /** Colours to draw with; read from the tokens at `from` (default: the document) when left out. */
  palette?: WorldPalette;
  from?: Element;
  /** Which time of day's sky things to draw (sun, moon, stars); the scheme by default. */
  features?: Scheme;
  /** Bake the clouds into the sky (default true). */
  clouds?: boolean;
  /** Draw one layer only, transparent elsewhere. */
  layer?: WorldLayer;
  /** Boxes the sun, the moon, the stars and the clouds keep clear of, in world pixels: [x0, y0, x1, y1], the ends left out. */
  avoid?: readonly WorldBox[];
}
/** A box in world pixels, [x0, y0, x1, y1] with the ends left out: something the sky's things keep clear of. */
export type WorldBox = readonly [number, number, number, number];

const LAYERS: readonly WorldLayer[] = ["sky", "peaks", "hills", "near", "ground"];
/** The TV's world, the ground line, and how far the landscape repeats to the sides. */
const W0 = 320, H0 = 180, GROUND = 160, PERIOD = 350;
/** Spare pixels round a sliding layer: sideways (the TV's MARGIN) and up and down. */
const MX = 12, MY = 8;
/** How far each layer slides for a step of parallax: sideways (the TV's DRIFT, one more for the ground), up and down. */
const DRIFT = [0, 1, 2, 3, 4], LIFT = [4, 3, 2, 1, 0];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** Peaks {x, top, steepness in tenths}, highest first: lower ones are drawn later and stand in front. */
const PEAKS = [[134, 66, 9], [238, 68, 12], [36, 70, 10], [336, 72, 13], [290, 79, 11], [186, 80, 14], [-14, 82, 12], [86, 84, 10]];
const LIP = [0, 1, 1, 2, 2, 1, 0, 0, 1, 2, 1, 0, 1, 1, 0];
const BUSHES = [[18, 5], [26, 4], [88, 4], [238, 5], [247, 4], [300, 5]];
/** Clouds {centre x, centre y, size in tenths}; a cloud sprite is 38 x 16 with its centre at (11, 10). */
const CLOUDS = [[122, 22, 10], [212, 46, 8], [286, 22, 9], [28, 64, 7]];
const PUFFS = [[0, 0, 6], [7, -3, 7], [15, 0, 6], [-7, 1, 4], [21, 2, 4]];
const BIRD = [["X...X", ".X.X.", "..X.."], [".....", "XX.XX", "..X.."]];
const SHOOTING_STAR = ["........dd", "......cc..", "....bb....", "..aa......", "WW........"];
/** A flock: where each bird flies relative to the leader (mirrored when flying left). */
const FLOCK = [[0, 0], [-7, -3], [-12, 2]];
/** How far round itself each sky thing keeps clear of a box: the moon (9 pixels round, its glow to 11), the sun (14),
    a flaring star (its arms, 2), plus a margin of 5. A shooting star's whole streak is a 42 x 21 box. */
const MOON_R = 11, SUN_R = 14, CLEAR = 5, STREAK = [32, 0, 42, 21];

// Palette slots: the time of day's 28, then the shared sky things, flowers, and two lights.
const SLOTS = "sky-1 sky-2 sky-3 sky-4 sky-5 sky-6 cloud-light cloud-body cloud-shade mountain-lit mountain-shadow mountain-edge snow-lit snow-shadow tree-lit tree-shadow hill-mid hill-mid-edge hill-near hill-near-edge hill-bush grass grass-top grass-lip dirt dirt-shadow dirt-pebble bird".split(" ");
const SHARED = "sky-sun sky-moon sky-crater sky-moon-glow sky-star sky-star-warm sky-trail-1 sky-trail-2 sky-trail-3 sky-trail-4 flower-1 flower-2 flower-3 flower-4".split(" ");
const enum S {
  CLOUD_L = 6, CLOUD, CLOUD_S, MTN_L, MTN_S, MTN_E, SNOW, SNOW_S, TREE_L, TREE_S, MID, MID_E, NEAR, NEAR_E, BUSH, GRASS,
  GRASS_E, GRASS_D, DIRT, DIRT_S, PEB, BIRD, SUN, MOON, CRATER, GLOW, STAR, STAR_WARM, TRAIL, FLOWER = 38, WHITE = 42, SPARK,
}

/** The world's colours for a time of day, from the --pp-world-* tokens at an element. */
export function worldPalette(scheme: Scheme, from: Element = document.documentElement): number[] {
  const style = getComputedStyle(from);
  const names = [...SLOTS.map((s) => `--pp-world-${scheme}-${s}`), ...SHARED.map((s) => `--pp-world-${s}`), "--pp-white", "--pp-candy-yellow-light"];
  if (!style.getPropertyValue(names[0]!).trim()) warn("PP-W001", "No world colours: load @jaatster/blip-tokens/tokens.css.", from);
  return names.map((n) => rgb(style.getPropertyValue(n)));
}

const blend = (a: number, b: number, t: number) =>
  [16, 8, 0].reduce((c, s) => c | (Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * t) << s), 0);
/** Two palettes mixed slot by slot, t of the way from a to b: the steps of a change of time of day. */
const mix = (a: WorldPalette, b: WorldPalette, t: number) => a.map((c, i) => blend(c, b[i]!, t));
const mod = (a: number, n: number) => ((a % n) + n) % n;
const midHill = (x: number) => Math.round(106 + 6 * Math.sin(x * 0.06 + 2) + 3 * Math.sin(x * 0.15));
const nearHill = (x: number) => Math.round(124 + 5 * Math.sin(x * 0.05 + 0.5) + 2 * Math.sin(x * 0.2));
/** Seeds per period: the middle one (0) keeps the TV's, so a 320 x 180 world is the TV's picture. */
const rand = (seed: number, k: number) => seeded(seed + 7919 * k);
const f32 = Math.fround;

/**
 * How a world h rows high lays out the TV's 180: the land keeps to the bottom. A taller world stretches its sky; a
 * shorter one gives up rows where it hurts least, first dirt (up to 10), then meadow (16), then sky, so mountains stay.
 * dg and dl move the ground and the rest of the land down from the TV's rows; the sky's gradient runs from top for g
 * rows to the horizon, and y() places a TV sky row in it.
 */
const rowsOf = (h: number) => {
  const e = Math.max(0, H0 - h), dirt = Math.min(e, 10), dl = h - H0 + dirt + Math.min(e - dirt, 16), hz = 112 + dl, g = Math.max(112, hz);
  return { dg: h - H0 + dirt, dl, g, top: hz - g, y: (y: number) => hz - g + Math.round((y * g) / 112) };
};

/** Whether the box [x0, y0, x1, y1) crosses any of the boxes. */
const crosses = (boxes: readonly WorldBox[] | undefined, x0: number, y0: number, x1: number, y1: number): boolean =>
  !!boxes?.some(([a, b, c, d]) => x0 < c && x1 > a && y0 < d && y1 > b);

/**
 * The night's stars {x, y} in world pixels: the TV's sixty in the middle, the same density everywhere else. Each star
 * keeps clear of the boxes to avoid by a flare's arms and the margin, so none sits between words or under letters,
 * and every star shown can flare.
 */
function starsOf(w: number, h: number, avoid?: readonly WorldBox[]): number[][] {
  const { g, top } = rowsOf(h), cx = Math.floor((w - W0) / 2), rows = Math.round((70 * g) / 112), out: number[][] = [], m = 2 + CLEAR;
  for (let j = 0; j * 70 < rows; j++) {
    for (let k = Math.floor(-cx / W0) - 1; k <= Math.floor((w - cx) / W0); k++) {
      const r = seeded(3 + 7919 * k + 104729 * j);
      for (let i = 0; i < 60; i++) {
        const x = Math.trunc(r() * W0) + W0 * k + cx, y = Math.trunc(r() * 70) + 70 * j;
        if (y < rows && !crosses(avoid, x - m, top + y - m, x + m + 1, top + y + m + 1)) out.push([x, top + y, i % 4 ? S.STAR : S.STAR_WARM]);
      }
    }
  }
  return out;
}

/**
 * Where a fw x fh thing whose top-left corner would be at (x, y) can go so that it crosses none of the boxes: that
 * place if it is clear, else the nearest clear top-left (fewest pixels across plus down) with its top on rows
 * y0..y1 and the thing inside the world's w columns. Ties go to the higher row, then to the earlier place along it.
 * Null when there is none.
 */
function clearOf(boxes: readonly WorldBox[], x: number, y: number, fw: number, fh: number, w: number, y0: number, y1: number): [number, number] | null {
  if (!crosses(boxes, x, y, x + fw, y + fh)) return [x, y];
  let best: [number, number] | null = null, far = Infinity;
  for (let py = y0; py <= y1; py++) {
    const dy = Math.abs(py - y);
    if (dy >= far) continue;
    // On this row, the top-lefts each box rules out, as runs [first, last].
    const runs = boxes.filter(([, b, , d]) => py < d && py + fh > b).map(([a, , c]) => [a - fw + 1, c - 1] as const);
    for (const px of [x, 0, w - fw, ...runs.flatMap(([a, c]) => [a - 1, c + 1])]) {
      if (px < 0 || px > w - fw || runs.some(([a, c]) => px >= a && px <= c)) continue;
      const d = Math.abs(px - x) + dy;
      if (d < far) [best, far] = [[px, py], d];
    }
  }
  return best;
}

/** The sun's and moon's centres in a w x h world; null for one kept out of sight. */
interface SkyPlaces {
  moon: readonly [number, number] | null;
  sun: readonly [number, number] | null;
  /** Boxes the clouds keep out of. */
  avoid?: readonly WorldBox[];
}

/** Whether a cloud whose sprite's top-left is (x, y) would sit behind a box to avoid (38 x 16, a pixel of margin). */
const cloudHits = (avoid: readonly WorldBox[] | undefined, x: number, y: number): boolean => crosses(avoid, x - 1, y - 1, x + 39, y + 17);

/**
 * Where the sun and moon go: the TV's places, unless one would cross a box to avoid. Then the moon takes the nearest
 * clear place in the sky above the peaks (its own row first), and the sun slides along the horizon, its lane, to the
 * nearest clear place. With none, each goes to the same place across the sky if that is clear, and is otherwise left
 * out: nothing in the sky sits behind the words.
 */
function skyPlaces(w: number, h: number, avoid: readonly WorldBox[] = []): SkyPlaces {
  const cx = Math.floor((w - W0) / 2), sky = rowsOf(h);
  const moon = [200 + cx, sky.y(30)] as const, sun = [160 + cx, 84 + sky.dl] as const;
  if (!avoid.length) return { moon, sun };
  const top = 66 + sky.dl;
  const go = ([x, y]: readonly [number, number], r: number, y0: number, y1: number): [number, number] | null => {
    const d = 2 * r + 1, at = clearOf(avoid, x - r, y - r, d, d, w, y0, y1) ?? clearOf(avoid, w - 1 - x - r, y - r, d, d, w, y - r, y - r - 1);
    return at && [at[0] + r, at[1] + r];
  };
  const m = MOON_R + CLEAR, n = SUN_R + CLEAR;
  return { moon: go(moon, m, 0, top - 2 * m - 2), sun: go(sun, n, sun[1] - n, sun[1] - n), avoid };
}

/** The clouds of the periods k0..k1 {x, y (TV sky row), size}: the TV's in the middle, the others moved a little. */
function cloudsOf(k0: number, k1: number): number[][] {
  const out: number[][] = [];
  for (let k = k0; k <= k1; k++) {
    const r = rand(23, k);
    for (const [x, y, s] of CLOUDS) {
      out.push(k ? [x! + PERIOD * k + Math.round((r() - 0.5) * 60), Math.max(14, y! + Math.round((r() - 0.5) * 16)), s! + Math.round(r() - 0.5)] : [x!, y!, s!]);
    }
  }
  return out;
}

type Put = (x: number, y: number, c: number) => void;

/** Puffs in three tones: a highlight on each puff's upper left, the body, and a shaded flat bottom. */
function cloud(put: Put, c: Uint32Array, cx: number, cy: number, size: number): void {
  const s = f32(size / 10);
  for (const [px, py, r] of PUFFS) {
    for (let y = -r!; y <= r!; y++) {
      for (let x = -r!; x <= r!; x++) {
        if (x * x + y * y > r! * r!) continue;
        const fx = f32(cx + f32((px! + x) * s)), fy = f32(cy + f32((py! + y) * s));
        if (fy > f32(cy + 4 * s)) continue;
        put(Math.round(fx), Math.round(fy), c[fy > f32(cy + 2 * s) ? S.CLOUD_S : x + y < f32(-r! * f32(0.6)) ? S.CLOUD_L : S.CLOUD]!);
      }
    }
  }
}

/**
 * Paints layer l of a w x h world into buf (bw x bh), whose first column is world x -mx and first row world y -my.
 * ext carries a sliding layer's fill a few rows further down, so a slide never opens a gap.
 */
function paint(buf: Uint32Array, bw: number, bh: number, mx: number, my: number, w: number, h: number, l: number, c: Uint32Array, features: Scheme, clouds: boolean, ext = 0, at: SkyPlaces = skyPlaces(w, h)): void {
  // TV x 0 sits at world x cx; the land is dy rows down from the TV's (rowsOf).
  const cx = Math.floor((w - W0) / 2), sky = rowsOf(h), dy = l === 4 ? sky.dg : sky.dl;
  const set: Put = (x, y, col) => {
    x += mx;
    y += my;
    if (x >= 0 && y >= 0 && x < bw && y < bh) buf[y * bw + x] = col;
  };
  const land: Put = (x, y, col) => set(x + cx, y + dy, col);
  const t0 = -mx - cx, t1 = bw - mx - cx, k0 = Math.floor((t0 - 40) / PERIOD), k1 = Math.floor((t1 + 40) / PERIOD);
  const periods = Array.from({ length: k1 - k0 + 1 }, (_, i) => k0 + i);

  if (l === 0) {
    for (let y = 0; y < bh; y++) {
      const Y = y - my, t = f32(Math.min(f32(Math.max(0, Y - sky.top) / sky.g), 1) * 5), i = Math.trunc(t), f = f32(t - i) * 16;
      const a = c[i]!, b = c[Math.min(i + 1, 5)]!;
      for (let x = 0; x < bw; x++) buf[y * bw + x] = f > BAYER[(Y & 3) * 4 + ((x - mx) & 3)]! ? b : a;
    }
    if (features === "night") {
      for (const [x, y, col] of starsOf(w, h, at.avoid)) set(x!, y!, c[col!]!);
      const [ox, oy] = at.moon ?? [];
      if (ox !== undefined && oy !== undefined) {
        for (let y = -9; y <= 9; y++) {
          for (let x = -9; x <= 9; x++) {
            const d = x * x + y * y;
            if (d <= 81) set(ox + x, oy + y, c[(x - 2) ** 2 + (y + 2) ** 2 < 5 || (x + 3) ** 2 + (y - 3) ** 2 < 3 ? S.CRATER : S.MOON]!);
            else if (d <= 130 && BAYER[((y + 16) & 3) * 4 + ((x + 16) & 3)]! < 6) set(ox + x, oy + y, c[S.GLOW]!);
          }
        }
      }
    }
    if (features === "sunset" && at.sun) for (let y = -14; y <= 14; y++) for (let x = -14; x <= 14; x++) if (x * x + y * y <= 196) set(at.sun[0] + x, at.sun[1] + y, c[S.SUN]!);
    // Clouds that would pass behind the words are left out of the picture.
    if (clouds) for (const [x, y, s] of cloudsOf(k0, k1)) if (!cloudHits(at.avoid, x! + cx - 11, sky.y(y!) - 10)) cloud(set, c, x! + cx, sky.y(y!), s!);
  } else if (l === 1) {
    // Each peak has its own steepness, sharp at the top and flaring towards the base, its sides a little ragged; lit
    // left of a leaning ridge, with snow on top. Other periods leave out the peak the middle one already has, and
    // are a little lower, so they never reach into the middle's picture.
    const peaks = periods.flatMap((k) => {
      if (!k) return PEAKS;
      const r = rand(101, k);
      return PEAKS.filter((p) => p[0] !== (k > 0 ? -14 : 336)).map(([x, t, s]) => [x! + PERIOD * k, t! + Math.trunc(r() * 9), s!]);
    }).sort((a, b) => a[1]! - b[1]!);
    for (const [px, top, steep] of peaks) {
      for (let y = top!; y < 114 + ext; y++) {
        const d = y - top!;
        const half = Math.round(f32(f32((d * steep!) / 10) + f32((d * d) / 80))) + (mod(d * 3 + px!, 4) === 3 ? 1 : 0);
        const ridge = px! + (Math.trunc(d / 4) % 2) + Math.trunc(d / 7);
        for (let x = px! - half; x <= px! + half; x++) {
          const lit = x < ridge, snow = 5 + Math.abs(mod(x + px!, 6) - 3) - (lit ? 0 : 1);
          land(x, y, c[d < snow ? (lit ? S.SNOW : S.SNOW_S) : lit ? (x === px! - half && d > 0 ? S.MTN_E : S.MTN_L) : S.MTN_S]!);
        }
      }
    }
  } else if (l === 2) {
    // A row of trees, round ones and pines in two tones, along the top of the middle hills.
    for (const k of periods) {
      const r = rand(5, k), a = k ? PERIOD * k - 18 : -18, b = k ? PERIOD * k + 332 : 338;
      for (let tx = a; tx < b; tx += 6 + Math.trunc(r() * 6)) {
        const pine = r() < 0.4, s = 3 + Math.trunc(r() * 2), base = midHill(tx);
        if (pine) {
          for (let y = 0; y <= s * 3; y++) {
            const half = Math.trunc(y / 3) + Math.trunc((y % 3) / 2);
            for (let x = tx - half; x <= tx + half; x++) land(x, base - s * 3 + y, c[x < tx ? S.TREE_L : S.TREE_S]!);
          }
        } else {
          for (let v = -s; v <= s; v++) for (let u = -s; u <= s; u++) if (u * u + v * v <= s * s + (s >> 1)) land(tx + u, base - s + v, c[u + v < 0 ? S.TREE_L : S.TREE_S]!);
        }
      }
    }
    for (let X = -mx; X < bw - mx; X++) {
      const h0 = midHill(X - cx);
      for (let y = h0; y < GROUND + ext; y++) set(X, y + dy, c[y === h0 ? S.MID_E : S.MID]!);
    }
  } else if (l === 3) {
    for (let X = -mx; X < bw - mx; X++) {
      const h0 = nearHill(X - cx);
      for (let y = h0; y < GROUND + ext; y++) set(X, y + dy, c[y === h0 ? S.NEAR_E : S.NEAR]!);
    }
    for (const k of periods) {
      // Grass tufts on the meadow, a dark v with a light tip; then the bushes.
      const r = rand(17, k), a = k ? PERIOD * k - 15 : -12, n = k ? PERIOD : 344;
      for (let i = 0; i < 46; i++) {
        const x = a + Math.trunc(r() * n), y = nearHill(x) + 4 + Math.trunc(r() * (GROUND - nearHill(x) - 7));
        land(x, y, c[S.BUSH]!);
        land(x - 1, y - 1, c[S.BUSH]!);
        land(x + 1, y - 1, c[S.BUSH]!);
        land(x + 1, y - 2, c[S.NEAR_E]!);
      }
      for (const [b, s] of BUSHES) {
        const bx = b! + PERIOD * k, by = nearHill(bx);
        for (let y = -s!; y <= 0; y++) for (let x = -s!; x <= s!; x++) if (x * x + y * y <= s! * s!) land(bx + x, by + y, c[x < 0 && y < -s! / 2 ? S.NEAR_E : S.BUSH]!);
      }
    }
  } else {
    // The ground: grass, a lip of grass hanging over the dirt, pebbles; then grass tips and flowers.
    for (let X = -mx; X < bw - mx; X++) {
      const x = X - cx, lip = LIP[mod(x, LIP.length)]!;
      for (let y = GROUND; y < H0 + ext; y++) {
        set(X, y + dy, c[y < GROUND + 5 ? (y === GROUND ? S.GRASS_E : S.GRASS) : y < GROUND + 5 + lip ? S.GRASS_D : y === GROUND + 5 + lip ? S.DIRT_S : mod(x * 5 + y * 11, 29) ? S.DIRT : S.PEB]!);
      }
    }
    for (const k of periods) {
      const r = rand(9, k), a = k ? PERIOD * k - 15 : -12, n = k ? PERIOD : 344;
      for (let x = a; x < a + n; x += 3) if (r() < 0.6) land(x, GROUND - 1, c[S.GRASS]!);
      for (let i = 0; i < 40; i++) land(a + Math.trunc(r() * n), GROUND + 1 + Math.trunc(r() * 3), c[S.FLOWER + (i % 4)]!);
    }
  }
}

/** Packs a palette for ImageData. */
const pack = (pal: WorldPalette) => Uint32Array.from(pal, abgr);

/**
 * Draws the world (all five layers, or one) into a 2D context at (0, 0), w x h world pixels: 320 x 180 is the TV's
 * picture. Scale the canvas up by whole numbers with `image-rendering: pixelated`.
 */
export function drawWorld(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, scheme: Scheme, w = W0, h = H0, options: DrawWorldOptions = {}): void {
  const img = ctx.createImageData(w, h), buf = new Uint32Array(img.data.buffer);
  const c = pack(options.palette ?? worldPalette(scheme, options.from)), at = skyPlaces(w, h, options.avoid);
  for (let l = 0; l < LAYERS.length; l++) {
    if (!options.layer || options.layer === LAYERS[l]) paint(buf, w, h, 0, 0, w, h, l, c, options.features ?? scheme, options.clouds ?? true, 0, at);
  }
  ctx.putImageData(img, 0, 0);
}

const isScheme = (s: string | null): s is Scheme => s === "day" || s === "sunset" || s === "night";

/**
 * <pp-world>: the world as a backdrop filling its positioned container. Each world pixel is the page's pixel
 * (--pp-pixel) times `zoom`, made a whole number of device pixels; the canvas is drawn at the world's own resolution
 * and scaled up crisply, and only redrawn when its size, its screen or its time of day changes.
 *
 * Attributes: scheme (day, sunset, night, auto, or left out to follow the page), parallax, clouds (drift; "none"
 * for none), stars (stars flare at night), events (birds by day, a shooting star at night), zoom, avoid (a selector
 * list of what the sun, the moon, the stars, the clouds and shooting stars keep clear of).
 *
 * @summary The dithered world backdrop: sky, mountains, hills and meadow, for Day, Sunset and Night.
 * @attr {"day" | "sunset" | "night" | "auto"} scheme - The time of day; "auto" follows the clock. Left out, the
 * page's scheme.
 * @attr {boolean} parallax - The layers slide against the pointer, a whole pixel at a time, and lift a little as the
 * world scrolls past. "false" is off.
 * @attr {"drift" | "none"} clouds - Present (or "drift"): the clouds drift, a whole pixel at a time. "none": no
 * clouds. Left out (or "false"): still clouds.
 * @attr {boolean} stars - Stars flare now and then at night. "false" is off.
 * @attr {boolean} events - Now and then a flock of birds by day, a shooting star at night. "false" is off.
 * @attr {number} [zoom=1] - Page pixels per world pixel, a whole number.
 * @attr {string} avoid - A selector list of things the sky keeps clear of (".pp-hero-title, .pp-hero-lead"), matched in
 * the world's container (its parent, or the nearest ancestor that holds a match). The sun, the moon and shooting stars
 * go where they cross none of those boxes: the nearest clear place in their lane of the sky, else the same place across
 * the sky if that is clear, else out of sight. Stars and clouds that would sit behind them are left out. Whole pixels,
 * the same every time, and looked at again when anything resizes.
 * @cssprop --pp-pixel - The world pixel (times zoom).
 */
export class PixelWorld extends PixelElement {
  static observedAttributes = ["scheme", "parallax", "clouds", "stars", "events", "zoom", "avoid"];
  declare parallax: boolean;
  declare stars: boolean;
  declare events: boolean;
  /** "drift", "none", or null for still clouds. */
  declare clouds: string | null;
  declare zoom: string | null;
  /** The avoid attribute: a selector list, or null. */
  declare avoid: string | null;

  #redraw = (): void => {};
  #check = (_fade: boolean): void => {};

  /** The scheme attribute: day, sunset, night, auto, or inherit (the page's). */
  get scheme(): string {
    return this.getAttribute("scheme") ?? "inherit";
  }
  set scheme(value: string) {
    this.setAttribute("scheme", value);
  }

  attributeChangedCallback(name: string): void {
    if (name === "scheme") this.#check(false);
    else this.#redraw();
  }

  protected override connected(): void {
    const el = this, { signal } = this, html = document.documentElement;
    el.querySelector(":scope > .pp-world-stage")?.remove();
    const stage = el.appendChild(Object.assign(document.createElement("div"), { className: "pp-world-stage" }));
    const things = Object.assign(document.createElement("div"), { className: "pp-world-things" });
    const layers = LAYERS.map((name) => Object.assign(pixelCanvas(), { className: `pp-world-${name}` }));
    stage.append(layers[0]!, things, ...layers.slice(1));
    el.setAttribute("aria-hidden", "true");

    // The world as drawn: its size in world pixels, CSS pixels per world pixel, a sliding layer's margins, its colours.
    let w = 0, h = 0, s = 2, dpr = 1, mx = 0, my = 0, visible = true, slide = [0, 0], timer = 0, drawn = "", elapsed = 0;
    let scheme: Scheme | undefined, features: Scheme = "day", pal: WorldPalette | undefined, fading: AbortController | undefined;
    // What the sky keeps clear of: boxes in world pixels.
    let avoid: WorldBox[] = [], refit = 0;
    // Drifting clouds keep their place across redraws: each is at base + v x elapsed seconds, wrapping round.
    let clouds: { c: HTMLCanvasElement; base: number; y: number; v: number; at: number }[] = [], sparks: HTMLCanvasElement[] = [], stars: number[][] = [];
    const slid: string[] = [], palettes = new Map<Scheme, WorldPalette>();
    const palette = (k: Scheme) => palettes.get(k) ?? palettes.set(k, worldPalette(k, el)).get(k)!;
    /** Whether a flag is on: present, and not "false". */
    const has = (name: string) => on(el, name);

    /** The time of day this world shows now. */
    const resolve = (): Scheme => {
      const a = el.getAttribute("scheme");
      if (isScheme(a)) return a;
      if (a === "auto") return schemeAt(services.now());
      const v = getComputedStyle(el).getPropertyValue("--_pp-world-scheme").trim();
      return isScheme(v) ? v : "day";
    };
    /** CSS pixels per world pixel (a whole number of device pixels), and the world's size in world pixels. */
    const measure = () => {
      const r = el.getBoundingClientRect(), px = device(pixel(el) * Math.max(1, Math.trunc(Number(el.getAttribute("zoom")) || 1)));
      return [px, Math.ceil(r.width / px), Math.ceil(r.height / px)] as const;
    };
    /** Puts a sprite's top-left corner at world pixel (x, y). */
    const place = (c: HTMLElement, x: number, y: number) => void (c.style.translate = `${x * s}px ${y * s}px`);
    /** Sets one of world.css's private properties (--_pp-world-*) on an element. */
    const prop = (e: HTMLElement, name: string, v: number | string) => e.style.setProperty(`--_pp-world-${name}`, `${v}`);
    /** Lays a canvas out a device pixel to a canvas pixel; world.css scales it up by the world pixel's whole number of
        device pixels. */
    const size = (c: HTMLCanvasElement) => (Object.assign(c.style, { width: `${c.width / dpr}px`, height: `${c.height / dpr}px` }), c);
    const thing = (cw: number, ch: number) => size(Object.assign(things.appendChild(pixelCanvas()), { width: cw, height: ch }));
    const cloudX = (d: (typeof clouds)[number]) => -38 - mx + mod(d.base + d.v * elapsed + 38 + mx, w + 2 * mx + 38);

    /** The elements named by avoid: matched in the world's container (its parent), or the nearest ancestor of it that
        holds a match. */
    const avoided = (): Element[] => {
      const list = el.getAttribute("avoid")?.trim();
      if (!list) return [];
      try {
        for (let scope = el.parentElement; scope; scope = scope.parentElement) {
          const found = [...scope.querySelectorAll(list)].filter((n) => !el.contains(n));
          if (found.length) return found;
        }
      } catch {
        warn("PP-W002", `avoid="${list}" is not a selector list.`, el);
      }
      return [];
    };
    /** Their boxes in world pixels, taller by the sky's lift when it slides with the scroll, so it never slides onto
        them. The world's picture is anchored at its bottom left. */
    const boxes = (list = avoided()): WorldBox[] => {
      if (!list.length || !w) return [];
      const r = el.getBoundingClientRect(), lift = has("parallax") && !reducedMotion() ? 2 * LIFT[0]! : 0;
      return list.map((n) => n.getBoundingClientRect()).filter((b) => b.width && b.height).map((b) => [
        Math.floor((b.left - r.left) / s), Math.floor((b.top - r.bottom) / s) + h - lift,
        Math.ceil((b.right - r.left) / s), Math.ceil((b.bottom - r.bottom) / s) + h + lift,
      ] as const).filter(([x0, y0, x1, y1]) => x1 > 0 && x0 < w && y1 > 0 && y0 < h);
    };
    /** Slides the layers kx steps sideways and ky steps up or down, each by its drift, in whole pixels: world.css
        steps each layer's place there and rounds it, so a slide cut short still lands on a whole pixel. */
    const parallax = (kx: number, ky: number, force = false) => {
      if (!has("parallax") || reducedMotion()) kx = ky = 0;
      else if (!visible && !force) return;
      slide = [kx, ky];
      layers.forEach((c, l) => {
        const x = -Math.round(kx * DRIFT[l]!), y = Math.round(ky * LIFT[l]!), t = `${x} ${y}`;
        if (force || slid[l] !== t) {
          slid[l] = t;
          for (const e of l ? [c] : [c, things]) prop(e, "x", x), prop(e, "y", y);
        }
      });
    };

    /** Draws every layer and sprite in a palette, with features' sun, moon and stars. */
    const paintAll = (p: WorldPalette, f: Scheme) => {
      const [px, ww, hh] = measure();
      // Hidden (a closed tab panel, a hidden attribute): draw again whenever it shows, whatever its size.
      if (!ww || !hh) return void (drawn = "");
      // clouds="false" (a framework's false) is as if left out: still clouds.
      const still = reducedMotion(), slides = has("parallax") && !still, cloudy = has("clouds") ? el.getAttribute("clouds") : null;
      s = px;
      dpr = devicePixelRatio;
      w = ww;
      h = hh;
      mx = slides ? MX : 0;
      my = slides ? MY : 0;
      pal = p;
      features = f;
      drawn = `${s} ${w} ${h}`;
      el.style.backgroundColor = `#${p[0]!.toString(16).padStart(6, "0")}`;
      // The picture keeps to the bottom left. It and everything in it move by whole device pixels only (the browser
      // puts each moved box on a whole one), and canvases are scaled up by a whole number of device pixels, so every
      // world pixel lands on whole device pixels.
      const r = el.getBoundingClientRect();
      stage.style.translate = `0px ${(Math.round(r.bottom * dpr) - Math.round(r.top * dpr)) / dpr - h * s}px`;
      prop(stage, "px", `${s}px`);
      prop(stage, "k", Math.round(s * dpr));

      // Keep the sky's things clear of what avoid names, and look again whenever one of those resizes.
      const list = avoided();
      watch.disconnect();
      for (const n of list) watch.observe(n);
      avoid = boxes(list);
      const at = skyPlaces(w, h, avoid);

      const c = pack(p);
      layers.forEach((canvas, l) => {
        const lx = l ? mx : 0, bw = w + 2 * lx, bh = h + 2 * my, buf = new Uint32Array(bw * bh);
        paint(buf, bw, bh, lx, my, w, h, l, c, f, cloudy === null || (still && cloudy !== "none"), my, at);
        // Keep only the rows the layer uses.
        let first = 0, last = bh;
        while (first < bh && !buf.subarray(first * bw, (first + 1) * bw).some(Boolean)) first++;
        while (last > first && !buf.subarray((last - 1) * bw, last * bw).some(Boolean)) last--;
        if (first >= last) [first, last] = [0, 1];
        Object.assign(canvas, { width: bw, height: last - first });
        canvas.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(buf.buffer, first * bw * 4, (last - first) * bw * 4), bw, last - first), 0, 0);
        Object.assign(size(canvas).style, { left: `${-lx * s}px`, top: `${(first - my) * s}px` });
      });

      // The sky's moving things. Clouds are drawn again in the new colours where they are; sparkles live at night;
      // a flock or a shooting star already on its way carries on.
      clouds.forEach((d) => d.c.remove());
      clouds = [];
      if (cloudy !== null && cloudy !== "none" && !still) {
        const { y: skyY } = rowsOf(h), cx = Math.floor((w - W0) / 2);
        for (const [x, y, k] of cloudsOf(Math.floor((-mx - cx - 40) / PERIOD), Math.floor((w + mx - cx + 40) / PERIOD))) {
          const sp = thing(38, 16), buf = new Uint32Array(38 * 16);
          cloud((qx, qy, col) => void (qx >= 0 && qy >= 0 && qx < 38 && qy < 16 && (buf[qy * 38 + qx] = col)), c, 11, 10, k!);
          sp.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(buf.buffer), 38, 16), 0, 0);
          const d = { c: sp, base: x! + cx - 11, y: skyY(y!) - 10, v: k! / 10, at: 0 };
          place(sp, (d.at = Math.round(cloudX(d))), d.y);
          sp.hidden = cloudHits(avoid, d.at, d.y);
          clouds.push(d);
        }
      }
      if (f !== "night") sparks.splice(0).forEach((x) => x.remove());
      else if (!sparks.length) sparks = [thing(5, 5), thing(5, 5)].map((x) => Object.assign(x, { hidden: true }));
      things.querySelectorAll("canvas").forEach(size);
      stars = f === "night" ? starsOf(w, h, avoid) : [];
      slid.length = 0;
      parallax(slide[0]!, slide[1]!, true);
    };

    /** Draws the time of day afresh: its colours read from the tokens again, any fade dropped. */
    const draw = () => {
      fading?.abort();
      fading = undefined;
      palettes.clear();
      paintAll(palette((scheme = resolve())), scheme);
    };
    /** Draws again at a new size or with new options, in the colours on screen (mid-fade too). */
    const redraw = () => (fading && pal ? paintAll(pal, features) : draw());

    /** A change of time of day: at once, or stepped through the palettes over a minute, as the page's palette steps. */
    const check = (fade: boolean) => {
      const next = resolve(), from = scheme, step = duration("scheme-step", 10_000, el);
      if (next === from) return;
      if (!fade || !from || !pal || !step) return draw();
      scheme = next;
      fading?.abort();
      const a = pal, b = palette(next), mine = (fading = new AbortController());
      run(Array.from({ length: 6 }, (_, i) => ({ at: (i + 1) * step, do: () => paintAll(mix(a, b, (i + 1) / 6), (i + 1) * 2 < 6 ? from : next) })),
        { signal: AbortSignal.any([signal, mine.signal]), instant: false }).then(() => fading === mine && (fading = undefined));
    };

    /** Runs fn on an irregular beat while connected, in view, shown and moving. */
    const beat = (first: number, fn: () => void, next: () => number) => {
      const tick = () => {
        if (visible && !document.hidden && !reducedMotion()) fn();
        later(next(), tick, signal);
      };
      later(first, tick, signal);
    };

    // At night a real star flares now and then: small, big, small, gone (at most two at once).
    beat(1000, () => {
      const c = sparks.find((x) => x.hidden);
      if (!c || !has("stars") || !stars.length || !pal) return;
      const star = stars[services.between(0, stars.length - 1)]!, colours = [abgr(pal[S.SPARK]!), abgr(pal[S.WHITE]!)];
      const show = (big: 0 | 1) => sprite(c, SPARKLE[big], "SW", colours);
      place(c, star[0]! - 2, star[1]! - 2);
      show(0);
      c.hidden = false;
      run([{ at: 3 * 40, do: () => show(1) }, { at: 9 * 40, do: () => show(0) }, { at: 12 * 40, do: () => (c.hidden = true) }], { signal, instant: false });
    }, () => 600 + services.between(0, 899));

    // Now and then: by day and at sunset a flock of three crosses the sky; at night a shooting star streaks down.
    beat(5000 + services.between(0, 10_000), () => {
      if (!has("events") || !pal) return;
      const skyY = rowsOf(h).y;
      if (features === "night") {
        let x0 = Math.round(w * (0.4375 + services.random() * 0.5)), y0 = skyY(6 + services.between(0, 33));
        // Its whole streak keeps clear of what avoid names: the nearest clear start in its part of the sky, else the
        // same start across the sky if that is clear, else no shooting star this time.
        const [ox, oy, sw, sh] = STREAK, box = (x: number, y1: number) => clearOf(avoid, x - ox! - CLEAR, y0 - oy! - CLEAR, sw! + 2 * CLEAR, sh! + 2 * CLEAR, w, skyY(6) - CLEAR, y1);
        const clear = box(x0, skyY(39) - CLEAR) ?? box(w - x0, 0);
        if (!clear) return;
        [x0, y0] = [clear[0] + ox! + CLEAR, clear[1] + oy! + CLEAR];
        const c = thing(10, 5);
        sprite(c, SHOOTING_STAR, "Wabcd", [pal[S.WHITE]!, ...pal.slice(S.TRAIL, S.TRAIL + 4)].map(abgr));
        c.hidden = true;
        run(Array.from({ length: 10 }, (_, f) => ({ at: f * 40, do: () => (f === 9 ? c.remove() : (place(c, x0 - f * 4, y0 + f * 2), (c.hidden = false))) })), { signal, instant: false })
          .then(() => c.remove());
        return;
      }
      const dir = services.random() < 0.5 ? 1 : -1, y = skyY(18 + services.between(0, 39)), colour = [abgr(pal[S.BIRD]!)];
      const birds = FLOCK.map(() => thing(5, 3)), flight = new AbortController();
      let x = dir > 0 ? -20 : w + 20, step = 0;
      signal.addEventListener("abort", () => flight.abort(), { once: true, signal: flight.signal });
      flight.signal.addEventListener("abort", () => birds.forEach((b) => b.remove()), { once: true });
      every(80, () => {
        if (!visible) return;
        x += dir;
        if (dir > 0 ? x > w + 20 : x < -20) return flight.abort();
        birds.forEach((b, i) => {
          if (step % 2 === 0) sprite(b, BIRD[(step / 2 + i) % 2]!, "X", colour);
          place(b, x + FLOCK[i]![0]! * dir, y + FLOCK[i]![1]!);
        });
        step++;
      }, flight.signal);
    }, () => 60_000 + services.between(0, 60_000));

    // Clouds drift right at a tenth of their size in pixels a second, a whole pixel at a time, wrapping round.
    every(250, () => {
      if (!visible || reducedMotion()) return;
      elapsed += 0.25;
      for (const d of clouds) {
        const x = Math.round(cloudX(d));
        if (x !== d.at) {
          place(d.c, (d.at = x), d.y);
          // A drifting cloud passes behind the words out of sight, and comes back past them.
          d.c.hidden = cloudHits(avoid, x, d.y);
        }
      }
    }, signal);
    every(60_000, () => check(true), signal);

    const resize = new ResizeObserver(() => {
      if (measure().join(" ") === drawn) return;
      clearTimeout(timer);
      timer = window.setTimeout(redraw, w ? 60 : 0);
    });
    // Something the sky avoids has resized (its text wrapped, a font arrived): draw again if its box has moved.
    function watched(): void {
      clearTimeout(refit);
      refit = window.setTimeout(() => w && JSON.stringify(boxes()) !== JSON.stringify(avoid) && redraw(), 60);
    }
    const watch = new ResizeObserver(watched);
    const seen = new IntersectionObserver((entries) => void (visible = !!entries.at(-1)?.isIntersecting));
    // Following the page: its scheme switches, Auto's minute ticks (stepped, as the page's palette is), its pixel.
    const page = new MutationObserver((records) => {
      check(html.hasAttribute("data-pp-scheme-fade"));
      if (records.some((r) => r.attributeName === "data-pp-pixel") && measure().join(" ") !== drawn) redraw();
    });
    resize.observe(el);
    seen.observe(el);
    page.observe(html, { attributes: true, subtree: true, attributeFilter: ["data-pp-scheme", "data-pp-pixel"] });
    // Dark mode, reduced motion, and the window moving to a screen with another device pixel ratio (and back): draw
    // again, in that screen's whole device pixels.
    for (const q of ["(prefers-color-scheme: dark)", "(prefers-reduced-motion: reduce)", `(resolution: ${devicePixelRatio}dppx)`]) this.on(matchMedia(q), "change", draw);
    // Parallax: the layers slide against the pointer, and lift as the world scrolls by.
    this.on(window, "pointermove", (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      parallax(Math.max(-1, Math.min(1, (e.clientX - r.left - r.width / 2) / (r.width / 2 || 1))) * 3, slide[1]!);
    }, { passive: true });
    this.on(window, "scroll", () => {
      const r = el.getBoundingClientRect();
      parallax(slide[0]!, -Math.max(-1, Math.min(1, (r.top + r.height / 2 - innerHeight / 2) / (innerHeight / 2 + r.height / 2 || 1))) * 2);
    }, { passive: true });
    signal.addEventListener("abort", () => {
      resize.disconnect();
      watch.disconnect();
      seen.disconnect();
      page.disconnect();
      clearTimeout(timer);
      clearTimeout(refit);
      this.#redraw = () => {};
      this.#check = () => {};
    }, { once: true });
    this.#redraw = redraw;
    this.#check = check;
    draw();
  }
}

mirror(PixelWorld, ["parallax", "stars", "events"], ["clouds", "zoom", "avoid"]);
PixelElement.define("pp-world", PixelWorld);

declare global {
  interface HTMLElementTagNameMap {
    "pp-world": PixelWorld;
  }
}
