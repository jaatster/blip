import type { ReactNode } from "react";
import { useCurrentFrame } from "remotion";
import { TICK, seeded, ticks } from "./grid";
import { H, W, useCanvas } from "./Pixels";

/**
 * Blip's screen changes (@jaatster/blip-effects' transitions), worked out from the frame. Each scene plays its own
 * half: "out" at its end, "in" at the next one's start, so two scenes never have to share a frame.
 *
 *   <Mosaic at={OUT} mode="out">…the scene…</Mosaic>     the picture breaks into ever bigger blocks (2 to 12 pixels)
 *   <Dissolve at={OUT} mode="out" />                       the TV's: a grid of ink cells fills in random order
 *   <Iris at={OUT} mode="out" x={…} y={…} />              a platformer's: an ink circle closes on a point
 */

/** The mosaic's block sizes in Blip pixels, a Blip frame each, as the effects kit's. */
export const MOSAIC = [2, 3, 4, 6, 8, 12];
/** How long each takes, in video frames. */
export const MOSAIC_FRAMES = MOSAIC.length * TICK;
export const DISSOLVE_FRAMES = 9 * TICK;
export const IRIS_FRAMES = 10 * TICK;

/** The mosaic's SVG filters, once per stage: an even block takes a 2 x 2 sample from its middle, then fills. */
export const MosaicFilters = () => (
  <svg aria-hidden="true" style={{ position: "absolute", inlineSize: 0, blockSize: 0 }}>
    {MOSAIC.map((m) => {
      const b = m * 4, odd = b % 2, at = odd ? (b - 1) / 2 : b / 2 - 1;
      return (
        <filter key={m} id={`v-mosaic-${m}`} x="0" y="0" width="1" height="1" colorInterpolationFilters="sRGB">
          <feFlood x={at} y={at} width={2 - odd} height={2 - odd} />
          <feComposite width={b} height={b} />
          <feTile result="t" />
          <feComposite in="SourceGraphic" in2="t" operator="in" />
          <feMorphology operator="dilate" radius={at} />
        </filter>
      );
    })}
  </svg>
);

/** Its children in blocks: growing from `at` ("out", then held at 12 until the cut), or shrinking to sharp ("in"). */
export const Mosaic = ({ at, mode, children }: { readonly at: number; readonly mode: "in" | "out"; readonly children: ReactNode }) => {
  const frame = useCurrentFrame();
  const k = ticks(frame, at);
  const i = mode === "out" ? (k < 0 ? -1 : Math.min(k, MOSAIC.length - 1)) : k < 0 ? MOSAIC.length - 1 : MOSAIC.length - 1 - (k + 1);
  return <div style={{ position: "absolute", inset: 0, filter: i >= 0 ? `url(#v-mosaic-${MOSAIC[i]})` : undefined }}>{children}</div>;
};

const CELL = 8;
const COLS = Math.ceil(W / CELL), ROWS = Math.ceil(H / CELL);

/** The TV's dissolve: 8-pixel ink cells, a ninth of them a Blip frame, in a random order (a new one to clear). */
export const Dissolve = ({ at, mode, seed = 7 }: { readonly at: number; readonly mode: "in" | "out"; readonly seed?: number }) => {
  const frame = useCurrentFrame();
  const k = ticks(frame, at);
  const step = mode === "out" ? Math.min(9, Math.max(0, k + 1)) : 9 - Math.min(9, Math.max(0, k + 1));
  const ref = useCanvas((ctx, el) => {
    const rnd = seeded(seed), order = Array.from({ length: COLS * ROWS }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [order[i], order[j]] = [order[j]!, order[i]!];
    }
    ctx.fillStyle = getComputedStyle(el).getPropertyValue("--blip-ink");
    const n = Math.round((order.length * step) / 9);
    for (let i = 0; i < n; i++) ctx.fillRect((order[i]! % COLS) * CELL, Math.floor(order[i]! / COLS) * CELL, CELL, CELL);
  }, step);
  return step > 0 ? <canvas ref={ref} className="v-pixels" width={W} height={H} style={{ zIndex: 100 }} /> : null;
};

/** The platformer's iris: ink everywhere but a circle round (x, y) that closes ("out") or opens ("in"), a pixel circle. */
export const Iris = ({ at, mode, x, y }: { readonly at: number; readonly mode: "in" | "out"; readonly x: number; readonly y: number }) => {
  const frame = useCurrentFrame();
  const k = Math.min(10, Math.max(0, ticks(frame, at) + 1));
  // Ten steps: the radius falls fast, then slows near the point, then shuts.
  const RADII = [300, 220, 160, 115, 80, 55, 36, 22, 12, 0];
  const r = mode === "out" ? (k === 0 ? Infinity : RADII[k - 1]!) : k === 0 ? 0 : k >= 10 ? Infinity : RADII[9 - k]!;
  const ref = useCanvas((ctx, el) => {
    ctx.fillStyle = getComputedStyle(el).getPropertyValue("--blip-ink");
    for (let py = 0; py < H; py++) {
      const dy = py + 0.5 - y, span = r * r - dy * dy;
      if (span <= 0) { ctx.fillRect(0, py, W, 1); continue; }
      const half = Math.floor(Math.sqrt(span));
      ctx.fillRect(0, py, Math.max(0, Math.round(x) - half), 1);
      ctx.fillRect(Math.round(x) + half, py, W, 1);
    }
  }, r);
  return r === Infinity ? null : <canvas ref={ref} className="v-pixels" width={W} height={H} style={{ zIndex: 100 }} />;
};
