import { useLayoutEffect, useRef, useState } from "react";
import { useCurrentFrame } from "remotion";
import { TICK, p, ticks } from "./grid";
import { W, Sprite } from "./Pixels";

export type Move = {
  /** The frame it sets off. */
  readonly at: number;
  /** What it goes to: a selector on the stage. */
  readonly to: string;
  /** The frame it presses there, if it does. */
  readonly press?: number;
};

/** How long a press dips, in video frames. */
export const PRESS = 3 * TICK;
/** Whether `frame` is during the press at `at`. */
export const pressing = (frame: number, at: number | undefined) => at !== undefined && frame >= at && frame < at + PRESS;
/** Whether the pointer of `moves` is over `to` at `frame` (arrived, and not yet gone on). */
export const over = (moves: readonly Move[], to: string, frame: number) => {
  const i = moves.filter((m) => m.at <= frame).length - 1;
  return i >= 0 && moves[i]!.to === to && frame >= moves[i]!.at + 6 * TICK;
};

/**
 * Attract mode's pointer (@jaatster/blip-effects): the game kit's pixel pointer hops to each control in six even
 * steps, a Blip frame each and on whole pixels, rests there, and dips a pixel while it presses. It finds each control
 * on the stage by its selector, so it lands on the real thing wherever the layout puts it.
 */
export const Pointer = ({ moves, from = [W + 10, 200] }: { readonly moves: readonly Move[]; readonly from?: readonly [number, number] }) => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLDivElement>(null);
  const [spots, setSpots] = useState<Record<string, readonly [number, number]>>({});

  // Where each control is, in Blip pixels on the stage: a little in from its top left, where a hand would point.
  useLayoutEffect(() => {
    const stage = ref.current?.closest(".v-stage");
    if (!stage) return;
    const s = stage.getBoundingClientRect(), k = W / s.width;
    const next: Record<string, readonly [number, number]> = {};
    for (const { to } of moves) {
      const el = stage.querySelector(to);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      next[to] = [Math.round((r.left - s.left + r.width * 0.55) * k), Math.round((r.top - s.top + r.height * 0.6) * k)];
    }
    if (JSON.stringify(next) !== JSON.stringify(spots)) setSpots(next);
  });

  const i = moves.filter((m) => m.at <= frame).length - 1;
  let x = from[0], y = from[1];
  if (i >= 0) {
    const a = i > 0 ? spots[moves[i - 1]!.to] ?? from : from, b = spots[moves[i]!.to] ?? a;
    const k = Math.min(6, ticks(frame, moves[i]!.at) + 1) / 6;
    x = Math.round(a[0] + (b[0] - a[0]) * k);
    y = Math.round(a[1] + (b[1] - a[1]) * k);
  }
  const dip = i >= 0 && pressing(frame, moves[i]!.press) ? 1 : 0;
  return (
    <div ref={ref} style={{ position: "absolute", left: p(x), top: p(y + dip), zIndex: 50, pointerEvents: "none" }}>
      <Sprite name="pointer" />
    </div>
  );
};
