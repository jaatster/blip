import type { ReactNode } from "react";
import { useCurrentFrame } from "remotion";
import { Beat } from "./Beat";
import { STEP, TICK, p } from "./grid";
import { DropTitle, letterLands } from "./Text";

/**
 * The showcase every "a part, and it working" scene uses: one centred column read top to bottom, on fixed lines so
 * every scene lines up with the next. Nothing is framed: the parts stand on the night sky itself, as Blip's candy
 * stands on its world, and what they do happens to the whole screen. The stage is 480 x 270 Blip pixels:
 *
 *   y 32-68   the part's name, big (POP, scale 3), rising in a letter at a time
 *   y 80-232  the hero: the part itself, large and centred, working (HERO, 400 x 152, unframed)
 *
 * No line of text explains it: the parts show themselves. The title and the hero sit as one group, centred top to
 * bottom on the stage (with the usual optical lift), so there is no empty band at the foot.
 *
 * The sky round them stays clear of the moon and the clouds (pass SHOW_CLEAR to Sky and Life as `avoid`).
 */
export const HERO = { x: 40, y: 80, w: 400, h: 152 } as const;
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

/** When the run of parts sharing part i's title began: its title rises in once, then holds. */
const firstAt = (parts: readonly Part[], i: number) => {
  let j = i;
  while (j > 0 && parts[j - 1]!.title === parts[i]!.title) j--;
  return parts[j]!.at;
};

/** When a part's title has landed and its line starts typing. */
export const lineAt = (part: Part) => part.at + [...part.title.replace(/ /g, "")].length * TICK + STEP;

/** When part i's title starts erasing, last letter first, a Blip frame a letter, so the last one goes as the next part arrives. */
const eraseFrom = (parts: readonly Part[], i: number) => {
  const next = parts[i + 1];
  return next ? next.at - [...parts[i]!.title.replace(/ /g, "")].length * TICK : Infinity;
};

/** Each letter's erase frame for part i's title: from its end, one a Blip frame. */
const erasesOf = (parts: readonly Part[], i: number) => {
  const from = eraseFrom(parts, i), text = parts[i]!.title;
  const letters = [...text].filter((ch) => ch !== " ").length;
  let n = 0;
  return [...text].map((ch) => (ch === " " ? from + (letters - n) * TICK : from + (letters - 1 - n++) * TICK));
};

/**
 * The part's name above the hero. With a `lead` ("Make", "Works on") the lead stays up the whole scene and only the
 * rest of the title changes: it erases a letter a Blip frame from its end, and the next one rises in after it. The
 * line is laid out round the longest title, so the lead never moves. (`eyebrow` is the scene's name and each part's
 * `line` what it is: kept for reference, not shown.)
 */
export const SplitText = ({ eyebrow, parts, lead }: { readonly eyebrow: string; readonly parts: readonly Part[]; readonly lead?: string }) => {
  const frame = useCurrentFrame();
  const i = parts.filter((pt) => pt.at <= frame).length - 1;
  const part = parts[Math.max(0, i)]!;
  if (lead) {
    const longest = parts.reduce((a, b) => (b.title.length > a.title.length ? b : a)).title;
    const from = parts[0]!.at + TICK;
    const leadLands = letterLands(lead, from, TICK);
    const restFrom = (j: number) => (j ? parts[j]!.at + TICK : leadLands.at(-1)! + TICK);
    return (
      <div style={{ position: "absolute", insetInline: 0, top: p(32), display: "grid", justifyItems: "center" }}>
        <div style={{ display: "grid" }}>
          {/* The longest title, unseen: it sets where the line starts. */}
          <div style={{ gridArea: "1 / 1" }}>
            <DropTitle text={`${lead} ${longest}`} lands={[]} scale={3} outline={1} motion="rise" />
          </div>
          <div style={{ gridArea: "1 / 1", justifySelf: "start", display: "flex", columnGap: p(12) }}>
            <DropTitle text={lead} lands={leadLands} scale={3} outline={1} motion="rise" />
            {i >= 0 && <DropTitle key={part.title} text={part.title} lands={letterLands(part.title, restFrom(i), TICK)} erases={erasesOf(parts, i)} scale={3} outline={1} motion="rise" />}
          </div>
        </div>
      </div>
    );
  }
  return (
    <>
      {/* The title, alone at the top: big, centred, its letters rising into place a Blip frame apart. Not clipped. */}
      <div style={{ position: "absolute", insetInline: 0, top: p(32), display: "grid", justifyItems: "center" }}>
        {/* Keyed by its text: a title the next part shares stays put, and only its line changes. */}
        {i >= 0 && <DropTitle key={part.title} text={part.title} lands={letterLands(part.title, firstAt(parts, i) + TICK, TICK)} scale={3} outline={1} motion="rise" />}
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
