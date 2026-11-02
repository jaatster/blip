import { Fragment, createElement, type CSSProperties } from "react";
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
// A title rising into place: 6, 3, 1 pixels low, then set, so its letters never cross what is above it.
const RISE = [6, 3, 1, 0];
export const LAND = 4;

type DropProps = {
  readonly text: string;
  /** The frame each letter lands on. */
  readonly lands: readonly number[];
  readonly scale: number;
  /** Ink outline and drop, in Blip pixels (POP's is one). */
  readonly outline?: number;
  readonly tone?: string;
  /** "rise": each letter comes up 6 pixels in three steps instead of falling in from high (for titles over things). */
  readonly motion?: "drop" | "rise";
};

/** A POP title whose letters fall in one by one, each landing on its frame (a beat of the music). */
export const DropTitle = ({ text, lands, scale, outline = 1, tone, motion = "drop" }: DropProps) => {
  const path = motion === "rise" ? RISE : FALL;
  const lead = motion === "rise" ? RISE.length - 1 : LAND;
  const frame = useCurrentFrame();
  return (
    <span
      className="blip-display blip-pop v-drop"
      data-pop={text}
      data-tone={tone}
      style={{ "--blip-scale": scale, "--_p": p(outline) } as CSSProperties}
    >
      {/* Each word keeps together, so a long title wraps between words, never inside one. */}
      {text.split(" ").map((word, w, words) => {
        const start = words.slice(0, w).reduce((n, x) => n + x.length + 1, 0);
        return (
          <Fragment key={w}>
            {w > 0 && " "}
            <span style={{ display: "inline-block", whiteSpace: "nowrap" }}>
              {[...word].map((ch, c) => {
                const k = ticks(frame, (lands[start + c] ?? Infinity) - lead * TICK);
                return (
                  <span
                    key={c}
                    className="blip-drop-text-letter"
                    data-pop={ch}
                    style={{ animation: "none", visibility: k < 0 ? "hidden" : "visible", translate: `0 ${p(path[Math.min(k, path.length - 1)] ?? 0)}` }}
                  >
                    {ch}
                  </span>
                );
              })}
            </span>
          </Fragment>
        );
      })}
    </span>
  );
};

/** Landing frames for each character of `text`, a letter every `every` frames from `from`; a space lands with the
 * letter before it, so only letters count. */
export const letterLands = (text: string, from: number, every: number) => {
  let n = 0;
  return [...text].map((ch) => (ch === " " ? from + Math.max(0, n - 1) * every : from + n++ * every));
};
