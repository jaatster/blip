import { createElement, type CSSProperties } from "react";
import { useCurrentFrame } from "remotion";
import { Beat } from "./Beat";
import { TICK, p, ticks } from "./grid";
import { typedCount } from "./Pixels";

type TypedProps = {
  readonly text: string;
  readonly at: number;
  /** Frames a letter: 2.5 is Blip's 50 ms letter. */
  readonly every?: number;
  readonly caret?: boolean;
  readonly className?: string;
  readonly style?: CSSProperties;
};

/**
 * <blip-typewriter>'s markup and look (@jaatster/blip-effects), typed from the frame: the untyped rest is laid out
 * but hidden, so nothing moves, and the caret blinks for six beats once the last letter is in.
 */
export const Typed = ({ text, at, every = 2.5, caret = true, className, style }: TypedProps) => {
  const frame = useCurrentFrame();
  const n = typedCount(frame, at, text.length, every);
  return (
    <Beat at={at + Math.ceil(text.length * every)} from={at}>
      {createElement(
        "blip-typewriter",
        { caret: caret ? "" : undefined, className, style },
        <span aria-hidden="true">
          <span className="blip-typewriter-typed">{text.slice(0, n)}</span>
          <span className="blip-typewriter-rest">{text.slice(n)}</span>
        </span>,
      )}
    </Beat>
  );
};

/** Where a falling letter is, a Blip frame at a time: down from above, landed on the fifth, a little bounce. */
const FALL = [-44, -24, -10, -3, 0, -3, 0];
export const LAND = 4;

type DropProps = {
  readonly text: string;
  /** The frame each letter lands on. */
  readonly lands: readonly number[];
  readonly scale: number;
  /** Ink outline and drop, in Blip pixels (POP's is one). */
  readonly outline?: number;
  readonly tone?: string;
};

/** A POP title whose letters fall in one by one, each landing on its frame (a beat of the music). */
export const DropTitle = ({ text, lands, scale, outline = 1, tone }: DropProps) => {
  const frame = useCurrentFrame();
  return (
    <span
      className="blip-display blip-pop v-drop"
      data-pop={text}
      data-tone={tone}
      style={{ "--blip-scale": scale, "--_p": p(outline) } as CSSProperties}
    >
      {[...text].map((ch, i) => {
        const k = ticks(frame, (lands[i] ?? Infinity) - LAND * TICK);
        return (
          <span
            key={i}
            className="blip-drop-text-letter"
            data-pop={ch}
            style={{ animation: "none", visibility: k < 0 ? "hidden" : "visible", translate: `0 ${p(FALL[Math.min(k, FALL.length - 1)] ?? 0)}` }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
};
