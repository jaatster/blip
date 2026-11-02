import type { ReactNode } from "react";
import { useCurrentFrame } from "remotion";
import { Beat } from "./Beat";
import { STEP, TICK, p } from "./grid";
import { DropTitle, Typed, letterLands } from "./Text";

/**
 * The showcase screen every "a part, and it working" scene uses, read top to bottom in one centred column, so they all
 * sit the same way. The stage is 480 x 270 Blip pixels:
 *
 *   TOP     y 8 to 40: the scene's name small, then the part's name in POP dropping in (one line).
 *   MIDDLE  x 90, y 44, 300 x 176: one framed demo, the part working. Nothing else lives here.
 *   BOTTOM  y 228 to 264: one or two lines saying what it is, centred under the demo.
 *
 * The sky round them stays clear (pass SPLIT_CLEAR to Sky and Life as `avoid`).
 */
export const RIGHT = { x: 90, y: 44, w: 300, h: 176 } as const;
export const SPLIT_CLEAR = [[60, 4, 420, 266]] as const;

export type Part = {
  /** The frame this part takes over. */
  readonly at: number;
  readonly title: string;
  readonly line: string;
};

/** When a part's title has landed and its line starts typing. */
export const lineAt = (part: Part) => part.at + [...part.title.replace(/ /g, "")].length * TICK + STEP;

/** The top and the bottom: the scene's name and the part's name above the demo, its line under it. */
export const SplitText = ({ eyebrow, parts }: { readonly eyebrow: string; readonly parts: readonly Part[] }) => {
  const frame = useCurrentFrame();
  const i = parts.filter((pt) => pt.at <= frame).length - 1;
  const part = parts[Math.max(0, i)]!;
  return (
    <>
      <div style={{ position: "absolute", insetInline: 0, top: p(6), display: "grid", justifyItems: "center", gap: p(3) }}>
        <span className="blip-display blip-pop" data-scale="1" data-pop={eyebrow}>{eyebrow}</span>
        {/* The title falls into its own room, clipped at its top, so its letters never cross the scene's name. */}
        <div style={{ blockSize: p(22), display: "grid", alignContent: "end", overflow: "hidden", paddingInline: p(2) }}>
          {i >= 0 && <DropTitle key={i} text={part.title} lands={letterLands(part.title, part.at + TICK, TICK)} scale={2} outline={1} />}
        </div>
      </div>
      <div style={{ position: "absolute", left: p(RIGHT.x), top: p(RIGHT.y + RIGHT.h + 8), inlineSize: p(RIGHT.w), blockSize: p(36), textAlign: "center" }}>
        {i >= 0 && <Typed key={i} text={part.line} at={lineAt(part)} every={1} className="blip-outline" style={{ fontSize: p(12), fontWeight: 700, lineHeight: 1.5 }} />}
      </div>
    </>
  );
};

/**
 * The middle: one framed demo, popping in at `at`. "stage" is the game kit's framed stage (put a World or Sky in it, at
 * w={RIGHT.w} h={RIGHT.h}); "panel" is a cream card. Its children are laid out in its own 300 x 176 box, clipped to it.
 */
export const DemoFrame = ({ at, kind = "stage", scheme, children }: { readonly at: number; readonly kind?: "stage" | "panel"; readonly scheme?: string; readonly children: ReactNode }) => (
  <Beat at={at}>
    <section
      className={kind === "stage" ? "blip-stage blip-pop-in" : "blip-box blip-card blip-pop-in"}
      data-frame={kind === "stage" ? "" : undefined}
      data-blip-scheme={scheme}
      style={{ position: "absolute", left: p(RIGHT.x), top: p(RIGHT.y), inlineSize: p(RIGHT.w), blockSize: p(RIGHT.h), padding: 0, overflow: "hidden" }}
    >
      {children}
    </section>
  </Beat>
);
