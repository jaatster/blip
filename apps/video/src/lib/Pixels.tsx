import { spriteCanvas } from "@jaatster/blip-game/canvas.js";
import { drawWorld } from "@jaatster/blip-effects/world.js";
import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { useCurrentFrame } from "remotion";
import { TICK, seeded, ticks } from "./grid";

/** The stage in Blip pixels: 1080p at four CSS pixels each. */
export const W = 480;
export const H = 270;

/** A canvas a Blip pixel per pixel, over the whole stage, redrawn by `draw` when `key` changes. */
function useCanvas(draw: (ctx: CanvasRenderingContext2D, el: HTMLCanvasElement) => void, key: unknown) {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, el.width, el.height);
    draw(ctx, el);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return ref;
}

/** Blip's world: the TV's landscape at the stage's own size, in the scheme around it. */
export const World = ({ scheme }: { readonly scheme: "day" | "sunset" | "night" }) => {
  const ref = useCanvas((ctx, el) => drawWorld(ctx, scheme, W, H, { from: el }), scheme);
  return <canvas ref={ref} className="v-pixels" width={W} height={H} />;
};

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/**
 * The page transition of @jaatster/blip-effects, on the frame: the screen fills with ink through the 4 x 4 Bayer
 * matrix in eight steps a Blip frame apart ("out"), or clears out of it ("in").
 */
export const Dither = ({ at, mode }: { readonly at: number; readonly mode: "in" | "out" }) => {
  const frame = useCurrentFrame();
  const step = Math.min(8, Math.max(0, ticks(frame, at) + 1));
  const cover = mode === "out" ? step * 2 : 16 - step * 2;
  const ref = useCanvas((ctx, el) => {
    ctx.fillStyle = getComputedStyle(el).getPropertyValue("--blip-ink");
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (BAYER[(y & 3) * 4 + (x & 3)]! < cover) ctx.fillRect(x, y, 1, 1);
  }, cover);
  return cover > 0 ? <canvas ref={ref} className="v-pixels" width={W} height={H} style={{ zIndex: 100 }} /> : null;
};

/** A dialog's scrim: ink through the Bayer matrix, `level` of every 16 pixels (8 is half), never a see-through wash. */
export const Scrim = ({ level }: { readonly level: number }) => {
  const ref = useCanvas((ctx, el) => {
    ctx.fillStyle = getComputedStyle(el).getPropertyValue("--blip-ink");
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (BAYER[(y & 3) * 4 + (x & 3)]! < level) ctx.fillRect(x, y, 1, 1);
  }, level);
  return <canvas ref={ref} className="v-pixels" width={W} height={H} />;
};

type BurstKind = "sparkle" | "coin" | "star" | "confetti";
type BurstProps = {
  readonly at: number;
  readonly kind: BurstKind;
  /** The box it bursts from, in Blip pixels on the stage. */
  readonly box: readonly [x: number, y: number, w: number, h: number];
  readonly count?: number;
  readonly seed?: number;
  /** Blip pixels per sprite pixel. */
  readonly scale?: number;
};

const CANDY = ["red", "orange", "yellow", "green", "teal", "blue", "purple", "pink"];

/**
 * The bursts of @jaatster/blip-effects (sparkles round the edge, coins that rise and slow, stars that fly out and
 * fall, confetti that flutters down), worked out from the frame instead of run on the clock, with the game kit's
 * sprites, a Blip frame a step and whole pixels.
 */
export const Burst = ({ at, kind, box, count = kind === "confetti" ? 24 : 6, seed = 1, scale = 1 }: BurstProps) => {
  const frame = useCurrentFrame();
  const t = ticks(frame, at);
  const ref = useCanvas((ctx, el) => {
    if (t < 0) return;
    const rnd = seeded(seed), [bx, by, bw, bh] = box;
    const sprite = (name: string) => spriteCanvas(name, { from: el });
    const draw = (name: string, x: number, y: number) => {
      const s = sprite(name);
      if (s) ctx.drawImage(s, Math.round(x - (s.width * scale) / 2), Math.round(y - (s.height * scale) / 2), s.width * scale, s.height * scale);
    };
    for (let i = 0; i < count; i++) {
      if (kind === "sparkle") {
        // Round the edge, a few at a time: small, full, small, gone.
        const side = rnd(), u = rnd(), delay = Math.floor(rnd() * 8), k = t - delay;
        const x = side < 0.5 ? bx + u * bw : side < 0.75 ? bx - 4 : bx + bw + 4;
        const y = side < 0.25 ? by - 4 : side < 0.5 ? by + bh + 4 : by + u * bh;
        if (k >= 0 && k < 7) draw(k >= 2 && k < 5 ? "sparkle" : "sparkle-small", x, y);
      } else if (kind === "coin") {
        const x = bx + bw / 2 + (rnd() - 0.5) * bw * 0.6, vy = -5 - rnd() * 2, k = t - i;
        if (k >= 0 && k < 14) draw("coin", x, by + vy * k + 0.35 * k * k);
      } else if (kind === "star") {
        // Out of the edge all round, fast, then falling.
        const a = (i / count) * 2 * Math.PI + rnd() * 0.4, v = 4 + rnd() * 3, dx = Math.cos(a), dy = Math.sin(a);
        const x = bx + bw / 2 + dx * (bw / 2 + v * t), y = by + bh / 2 + dy * (bh / 2 + v * t) + 0.3 * t * t;
        if (t < 24) draw("star", x, y);
      } else {
        const x0 = bx + rnd() * bw, vy = 1 + rnd() * 1.5, phase = rnd() * 6, c = CANDY[i % CANDY.length]!;
        const k = t - Math.floor(rnd() * 6);
        if (k < 0 || k > 60) continue;
        ctx.fillStyle = getComputedStyle(el).getPropertyValue(`--blip-candy-${c}`);
        ctx.fillRect(Math.round(x0 + Math.sin(phase + k / 3) * 4), Math.round(by + vy * k), 2 * scale, 2 * scale);
      }
    }
  }, t);
  return <canvas ref={ref} className="v-pixels" width={W} height={H} />;
};

/** How many letters are typed `frame` frames in, at one a Blip frame (or `every` frames). */
export const typedCount = (frame: number, at: number, length: number, every = TICK) =>
  Math.max(0, Math.min(length, Math.floor((frame - at) / every) + 1));

type Box = readonly [x0: number, y0: number, x1: number, y1: number];
const inside = (boxes: readonly Box[], x: number, y: number, pad: number) =>
  boxes.some(([x0, y0, x1, y1]) => x >= x0 - pad && x < x1 + pad && y >= y0 - pad && y < y1 + pad);

/** The world's sky alone: its dithered gradient, and at Night the moon and stars, kept clear of `avoid`. */
export const Sky = ({ scheme, avoid = [], palette }: { readonly scheme: "day" | "sunset" | "night"; readonly avoid?: readonly Box[]; readonly palette?: string }) => {
  // Its colours are the tokens round it, so a palette set above it (data-blip-palette) gives it that night's sky.
  const ref = useCanvas((ctx, el) => drawWorld(ctx, scheme, W, H, { from: el, layer: "sky", avoid }), `${scheme} ${palette}`);
  return <canvas ref={ref} className="v-pixels" width={W} height={H} />;
};

/**
 * The night sky's own life, worked out from the frame: stars that flare one at a time (small, full, small, gone, the
 * game kit's sparkles) each on its own few beats, and a shooting star at each of `shooting`, all clear of `avoid`.
 */
export const Life = ({ avoid = [], shooting = [], count = 12, seed = 5 }: { readonly avoid?: readonly Box[]; readonly shooting?: readonly number[]; readonly count?: number; readonly seed?: number }) => {
  const frame = useCurrentFrame();
  const t = ticks(frame, 0);
  const ref = useCanvas((ctx, el) => {
    const rnd = seeded(seed);
    for (let i = 0; i < count; i++) {
      let x = 0, y = 0;
      for (let tries = 0; tries < 40; tries++) {
        x = 12 + Math.floor(rnd() * (W - 24));
        y = 10 + Math.floor(rnd() * (H - 40));
        if (!inside(avoid, x, y, 8)) break;
      }
      // A flare every 5 to 9 beats (10 Blip frames a beat), each star on its own phase.
      const period = 10 * (5 + Math.floor(rnd() * 5)), k = (t + Math.floor(rnd() * period)) % period;
      if (k >= 7) continue;
      const s = spriteCanvas(k >= 2 && k < 5 ? "sparkle" : "sparkle-small", { from: el });
      if (s) ctx.drawImage(s, x - (s.width >> 1), y - (s.height >> 1));
    }
    const star = getComputedStyle(el).getPropertyValue("--blip-world-star").trim() || "#F3EFFF";
    for (const [n, at] of shooting.entries()) {
      const k = ticks(frame, at);
      if (k < 0 || k > 18) continue;
      const r = seeded(seed + 31 * (n + 1)), x0 = 40 + Math.floor(r() * (W - 200)), y0 = 8 + Math.floor(r() * 30);
      // Three pixels right and one down a frame for 12 frames, a trail of 8 behind it that then shortens to nothing.
      const head = Math.min(k, 12), length = k < 12 ? 8 : 8 - (k - 12) * 1.5;
      ctx.fillStyle = star;
      for (let j = 0; j < length; j++) {
        const x = Math.round(x0 + 3 * (head - j * 0.5)), y = Math.round(y0 + head - j * 0.5);
        if ((j < 2 || j % 2 === 0) && !inside(avoid, x, y, 2)) ctx.fillRect(x, y, 1, 1);
      }
    }
  }, t);
  return <canvas ref={ref} className="v-pixels" width={W} height={H} />;
};

/** One of the game kit's sprites, drawn a Blip pixel per sprite pixel (or `scale`), at its own size. */
export const Sprite = ({ name, scale = 1, style }: { readonly name: string; readonly scale?: number; readonly style?: CSSProperties }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const s = el && spriteCanvas(name, { from: el });
    if (!el || !s) return;
    el.width = s.width;
    el.height = s.height;
    el.style.inlineSize = `calc(${s.width * scale} * var(--blip-pixel))`;
    el.style.blockSize = `calc(${s.height * scale} * var(--blip-pixel))`;
    el.getContext("2d")!.drawImage(s, 0, 0);
  }, [name, scale]);
  return <canvas ref={ref} style={{ imageRendering: "pixelated", display: "block", ...style }} />;
};

/**
 * A CSS mask of the pixels of each 4 x 4 Bayer cell under `level` (of 16), a Blip pixel per cell pixel: what is under
 * it shows through `level` sixteenths of the pixels, for a change that dithers from one look to the next.
 */
export const bayerMask = (level: number) => {
  const rects = BAYER.flatMap((b, i) => (b < level ? [`<rect x='${i % 4}' y='${i >> 2}' width='1' height='1'/>`] : [])).join("");
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 4' shape-rendering='crispEdges'>${rects}</svg>`)}") 0 0 / calc(4 * var(--blip-pixel)) calc(4 * var(--blip-pixel)) repeat`;
};
