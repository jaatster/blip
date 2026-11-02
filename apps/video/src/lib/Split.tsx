import type { ReactNode } from "react";
import { useCurrentFrame } from "remotion";
import { Beat } from "./Beat";
import { STEP, TICK, p } from "./grid";
import { DropTitle, Typed, letterLands } from "./Text";

/**
 * The showcase every "a part, and it working" scene uses: one centred column read top to bottom, on fixed lines so
 * every scene lines up with the next. Nothing is framed: the parts stand on the night sky itself, as Blip's candy
 * stands on its world, and what they do happens to the whole screen. The stage is 480 x 270 Blip pixels:
 *
 *   y 14      the scene's name, small (POP, scale 1)
 *   y 26-50   the part's name, big (POP, scale 3), dropping in a letter at a time
 *   y 62-214  the hero: the part itself, large and centred, working (HERO, 400 x 152, unframed)
 *   y 224     one line saying what it is, centred (OUTLINE, 12 px)
 *
 * The sky round them stays clear of the moon and the clouds (pass SHOW_CLEAR to Sky and Life as `avoid`).
 */
export const HERO = { x: 40, y: 62, w: 400, h: 152 } as const;
export const SHOW_CLEAR = [[24, 8, 456, 252]] as const;
/** Kept for the scenes still written against the old names. */
export const RIGHT = HERO;
export const SPLIT_CLEAR = SHOW_CLEAR;

export type Part = {
  /** The frame this part takes over. */
  readonly at: number;
  readonly title: string;
  readonly line: string;
};

/** When a part's title has landed and its line starts typing. */
export const lineAt = (part: Part) => part.at + [...part.title.replace(/ /g, "")].length * TICK + STEP;

/** The scene's name and the part's name above the hero, and its line under it. */
export const SplitText = ({ eyebrow, parts }: { readonly eyebrow: string; readonly parts: readonly Part[] }) => {
  const frame = useCurrentFrame();
  const i = parts.filter((pt) => pt.at <= frame).length - 1;
  const part = parts[Math.max(0, i)]!;
  return (
    <>
      <div style={{ position: "absolute", insetInline: 0, top: p(12), display: "grid", justifyItems: "center", gap: p(4) }}>
        <span className="blip-display blip-pop" data-scale="1" data-pop={eyebrow}>{eyebrow}</span>
        {/* The title falls into its own room, clipped at its top, so its letters never cross the scene's name. */}
        <div style={{ blockSize: p(30), display: "grid", alignContent: "end", overflow: "hidden", paddingInline: p(2) }}>
          {i >= 0 && <DropTitle key={i} text={part.title} lands={letterLands(part.title, part.at + TICK, TICK)} scale={3} outline={1} />}
        </div>
      </div>
      <div style={{ position: "absolute", insetInline: p(40), top: p(222), blockSize: p(36), textAlign: "center" }}>
        {i >= 0 && <Typed key={i} text={part.line} at={lineAt(part)} every={1} className="blip-outline" style={{ fontSize: p(12), fontWeight: 700, lineHeight: 1.5 }} />}
      </div>
    </>
  );
};

/**
 * The hero: the part, popping in at `at`, laid out in its own 400 x 152 box and centred there. No frame, no fill, not
 * clipped: it stands on the sky. Things it sends out (sparkles, coins, Pip's jump) may leave the box.
 */
export const DemoFrame = ({ at, children }: { readonly at: number; readonly kind?: string; readonly scheme?: string; readonly children: ReactNode }) => (
  <Beat at={at}>
    <section className="blip-pop-in" style={{ position: "absolute", left: p(HERO.x), top: p(HERO.y), inlineSize: p(HERO.w), blockSize: p(HERO.h) }}>
      {children}
    </section>
  </Beat>
);
