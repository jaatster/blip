import type { ReactNode } from "react";
import { useCurrentFrame } from "remotion";
import { Beat } from "./Beat";
import { STEP, TICK, p } from "./grid";
import { DropTitle, Typed, letterLands } from "./Text";

/**
 * The split screen every "which part, and it working" scene uses, so they all sit the same way. The stage is 480 x 270
 * Blip pixels:
 *
 *   LEFT   x 24, 156 wide, centred top to bottom: the scene's name small, the part's name in POP dropping in, one or two
 *          lines saying what it is. Nothing else lives on the left.
 *   RIGHT  x 200, y 24, 256 x 222: one framed demo, the part working. Nothing else lives on the right.
 *
 * The sky between them stays clear (pass SPLIT_CLEAR to Sky and Life as `avoid`).
 */
export const LEFT = { x: 24, w: 156 } as const;
export const RIGHT = { x: 200, y: 24, w: 256, h: 222 } as const;
export const SPLIT_CLEAR = [[16, 16, 188, 254], [192, 16, 464, 254]] as const;

export type Part = {
  /** The frame this part takes over the left. */
  readonly at: number;
  readonly title: string;
  readonly line: string;
};

/** When a part's title has landed and its line starts typing. */
export const lineAt = (part: Part) => part.at + [...part.title.replace(/ /g, "")].length * TICK + STEP;

/** The left column: the scene's name, then the current part's name and its line, each part dropping in afresh. */
export const SplitText = ({ eyebrow, parts }: { readonly eyebrow: string; readonly parts: readonly Part[] }) => {
  const frame = useCurrentFrame();
  const i = parts.filter((pt) => pt.at <= frame).length - 1;
  const part = parts[Math.max(0, i)]!;
  return (
    // A fixed top, not centred, and fixed room for each part: nothing on the left moves as a line types in.
    <div style={{ position: "absolute", left: p(LEFT.x), top: p(72), inlineSize: p(LEFT.w), display: "grid", alignContent: "start", gap: p(8) }}>
      <span className="blip-display blip-pop" data-scale="1" data-pop={eyebrow}>{eyebrow}</span>
      {i >= 0 && (
        <>
          {/* The title falls into its own room, clipped at its top, so its letters never cross the scene's name. */}
          <div style={{ blockSize: p(52), display: "grid", alignContent: "end", overflow: "hidden", paddingBlockStart: p(2), paddingInlineEnd: p(2) }}>
            <DropTitle key={i} text={part.title} lands={letterLands(part.title, part.at + TICK, TICK)} scale={2} outline={1} />
          </div>
          <div style={{ blockSize: p(76) }}>
            <Typed key={i} text={part.line} at={lineAt(part)} every={1} className="blip-outline" style={{ fontSize: p(12), fontWeight: 700, lineHeight: 1.5 }} />
          </div>
        </>
      )}
    </div>
  );
};

/**
 * The right: one framed demo, popping in at `at`. "stage" is the game kit's framed stage (put a World or Sky in it);
 * "panel" is a cream card. Its children are laid out in its own 256 x 222 box, clipped to it.
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
