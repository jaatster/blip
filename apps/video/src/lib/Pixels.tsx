import { spriteCanvas } from "@jaatster/blip-game/canvas.js";
import { drawWorld } from "@jaatster/blip-effects/world.js";
import { useLayoutEffect, useRef } from "react";
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
