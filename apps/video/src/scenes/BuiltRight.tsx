import type { CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Beat } from "../lib/Beat";
import { TICK, at, p, ticks } from "../lib/grid";
import { Burst, Life, Sky, bayerMask } from "../lib/Pixels";
import { Music, Sfx } from "../lib/Sound";
import { DemoFrame, RIGHT, SPLIT_CLEAR, SplitText, type Part } from "../lib/Split";
import { Snap } from "../lib/Snap";
import { Stage } from "../lib/Stage";
import { DISSOLVE_FRAMES, Dissolve, MOSAIC_FRAMES, Mosaic } from "../lib/Transitions";

/** Bars 45-48 of the theme: the hook again. */
export const BUILT_RIGHT = { bar: 45, bars: 4 };

// Two things the build checks. Left, what; right, it working:
//   32 KB  a budget well with its 34 KB line: the components' CSS drops in four big pieces, stacking like a
//          puzzle game, and the last piece clicks in under the line. One more tries, does not fit, shakes and is
//          refused: the build fails over budget (apps/docs assets.json: 32.5 KB of a 34 KB limit).
//   AA     one card with one line on the sky, while the scene steps Day, Sunset, Night (a second each), and a badge
//          pops under the card with that text's contrast (worked out from DESIGN.md's colours).
type Scheme = "day" | "sunset" | "night";
const PARTS: readonly Part[] = [
  { at: at(0, 1), title: "32 KB", line: "All the CSS, every component, gzipped. The build fails over budget." },
  { at: at(1, 3), title: "AA", line: "Contrast for every text pair, every scheme and palette." },
];
const FRAME = at(0, 1, 2);
const PIECES = ["Buttons", "Dialogs", "Tables", "Tiles"].map((name, i) => ({ name, land: at(0, 2, 1) + i * 16 }));
const EXTRA = PIECES.at(-1)!.land + at(0, 0, 2);
const REFUSED = EXTRA + 4 * TICK;
const AA = at(1, 3, 1);
const SCHEMES: readonly (readonly [frame: number, scheme: Scheme, ratio: string])[] = [
  [AA, "day", "16.7:1"],
  [AA + 52, "sunset", "16.6:1"],
  [AA + 104, "night", "14.7:1"],
];

// The well: 140 wide, a row of 32 a piece (8 KB), the line at 34 KB; the bottom is row 166 of the 300 x 176 frame.
const WELL = { x: 80, w: 140, bottom: 166, kb: 4 };
const LIMIT = WELL.bottom - 34 * WELL.kb;
const ROW = 8 * WELL.kb;
const FALL_SPEED = 26;

/** A piece's top at `frame`: falling 26 pixels a Blip frame from above the well until it lands on `top`. */
const fallen = (frame: number, land: number, top: number) => {
  const k = ticks(frame, land);
  return k >= 0 ? top : Math.max(-30, top + k * FALL_SPEED);
};

// Pieces are labelled in Pixel Bop at scale 1: short names, and its capitals stay clear at this size.
const piece = (extra: CSSProperties): CSSProperties => ({
  position: "absolute", blockSize: p(ROW - 2), display: "grid", placeItems: "center", color: "var(--blip-ink)",
  ...extra,
});

const Budget = ({ frame }: { readonly frame: number }) => {
  const settled = frame >= PIECES.at(-1)!.land && frame < EXTRA;
  const gone = frame >= REFUSED + 6 * TICK ? Math.min(4, ticks(frame, REFUSED + 6 * TICK) + 1) : 0;
  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--blip-surface-panel)" }}>
      {/* The well: a sunken box with an outline, and the budget's line across its top. */}
      <div className="blip-box" data-variant="outline" style={{ position: "absolute", left: p(WELL.x - 4), top: p(LIMIT - 12), inlineSize: p(WELL.w + 8), blockSize: p(WELL.bottom - LIMIT + 16), "--blip-r": 2, "--blip-shape": "var(--blip-shape-2)", "--blip-shape-inner": "var(--blip-shape-2-inner)", background: "var(--blip-surface-sunken)" } as CSSProperties} />
      <div style={{ position: "absolute", left: p(WELL.x - 10), top: p(LIMIT - 1), inlineSize: p(WELL.w + 20), blockSize: p(1), backgroundImage: `repeating-linear-gradient(90deg, var(--blip-danger) 0 ${p(4)}, transparent ${p(4)} ${p(6)})` }} />
      <span className="blip-label" style={{ position: "absolute", left: p(WELL.x + WELL.w + 14), top: p(LIMIT - 4), color: "var(--blip-danger-text)" }}>34 KB</span>

      {PIECES.map((pc, i) => {
        if (frame < pc.land - 8 * TICK) return null;
        const top = WELL.bottom - (i + 1) * ROW;
        const last = i === PIECES.length - 1 && settled;
        return (
          <div key={pc.name} className="blip-box blip-display" data-scale="1" data-variant={last ? "candy" : "soft"} data-tone={last ? "success" : "accent"}
            style={piece({ left: p(WELL.x + (i % 2 ? 8 : 0)), top: p(fallen(frame, pc.land, top)), inlineSize: p(WELL.w - 8) })}>
            {pc.name}
          </div>
        );
      })}

      {/* One more piece: it lands on top, over the line, shakes in the danger tone and dithers away, refused. */}
      {frame >= EXTRA - 6 * TICK && gone < 4 && (
        <Beat at={REFUSED}>
          <div className={frame >= REFUSED ? "blip-shake" : undefined} style={{ position: "absolute", inset: 0, mask: gone ? bayerMask(16 - 4 * gone) : undefined }}>
            <div className="blip-box blip-display" data-scale="1" data-variant="candy" data-tone="danger"
              style={piece({ left: p(WELL.x + 24), top: p(fallen(frame, EXTRA, WELL.bottom - PIECES.length * ROW - ROW / 2)), inlineSize: p(WELL.w - 48), blockSize: p(ROW / 2 - 2) })}>
              + 4 KB
            </div>
          </div>
        </Beat>
      )}
    </div>
  );
};

/** The demo is a 150 x 88 scene seen twice as big (.v-x2), like Modular's: one card, one line, one badge. */
const LW = 150, LH = 88;

/** The card and its badge, in one scheme: drawn twice while the scene dithers to the next. */
const Contrast = ({ frame, i }: { readonly frame: number; readonly i: number }) => {
  const [from, scheme, ratio] = SCHEMES[i]!;
  const badge = from + 8 + 4 * TICK;
  return (
    <div data-blip-scheme={scheme} style={{ position: "absolute", inset: 0, background: "var(--blip-bg)" }}>
      <div data-blip-pixel="" className="v-x2" style={{ position: "absolute", left: 0, top: 0, inlineSize: p(LW), blockSize: p(LH) }}>
        <Sky scheme={scheme} w={LW} h={LH} />
        <article className="blip-box blip-card" data-size="sm" style={{ position: "absolute", left: p(17), top: p(16), inlineSize: p(116), display: "grid", placeItems: "center" }}>
          <Snap><p style={{ margin: 0, fontSize: "var(--blip-size-title)", fontWeight: 700, whiteSpace: "nowrap" }}>Catch the stars</p></Snap>
        </article>
        {frame >= badge && (
          <Beat at={badge}>
            <div style={{ position: "absolute", left: 0, right: 0, top: p(52), display: "grid", justifyItems: "center" }}>
              <Snap><span className="blip-box blip-tag blip-pop-in" data-tone="success" data-size="lg">{ratio} AA</span></Snap>
            </div>
          </Beat>
        )}
      </div>
    </div>
  );
};

const ContrastDemo = ({ frame }: { readonly frame: number }) => {
  const i = Math.max(0, SCHEMES.filter((s) => s[0] <= frame).length - 1);
  const k = ticks(frame, SCHEMES[i]![0]);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Contrast frame={frame} i={i} />
      {i > 0 && k < 3 && (
        <div style={{ position: "absolute", inset: 0, mask: bayerMask(16 - 4 * (k + 1)) }}>
          <Contrast frame={frame} i={i - 1} />
        </div>
      )}
    </div>
  );
};

export const BuiltRight = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  return (
    <Stage scheme="night" mosaicIn>
      <AbsoluteFill>
        <Sky scheme="night" avoid={SPLIT_CLEAR} />
        <Life avoid={SPLIT_CLEAR} shooting={[at(1, 1)]} seed={41} />
      </AbsoluteFill>

      <SplitText eyebrow="Built right" parts={PARTS} />
      <DemoFrame at={FRAME}>
        <Mosaic at={frame < AA ? AA - MOSAIC_FRAMES : AA} mode={frame < AA ? "out" : "in"}>
          {frame < AA ? <Budget frame={frame} /> : <ContrastDemo frame={frame} />}
        </Mosaic>
      </DemoFrame>
      {/* The last piece clicking in: sparkles round it, in stage pixels (the frame's top left is (RIGHT.x, RIGHT.y)). */}
      <Burst at={PIECES.at(-1)!.land + TICK} kind="sparkle" box={[RIGHT.x + WELL.x, RIGHT.y + WELL.bottom - PIECES.length * ROW, WELL.w, ROW]} count={8} seed={6} />

      {PARTS.map((pt, n) => <Sfx key={pt.title} name={n ? "step@5" : "step"} at={pt.at} volume={0.4} />)}
      <Sfx name="open" at={FRAME} volume={0.5} />
      {PIECES.map((pc, n) => <Sfx key={pc.name} name={n ? `step@${[0, 3, 5, 7][n]}` : "step"} at={pc.land} volume={0.5} />)}
      <Sfx name="success" at={PIECES.at(-1)!.land + TICK} volume={0.5} />
      <Sfx name="bump" at={REFUSED} volume={0.5} />
      <Sfx name="error" at={REFUSED + TICK} volume={0.55} />
      {SCHEMES.map(([f], n) => <Sfx key={f} name={n ? `blip@${[0, 3, 5][n]}` : "blip"} at={f} volume={0.45} />)}
      {SCHEMES.map(([f], n) => <Sfx key={`b${f}`} name={`coin@${[4, 7, 12][n]}`} at={f + 8 + 8 * TICK} volume={0.45} />)}

      {music && <Music bar={BUILT_RIGHT.bar} bars={BUILT_RIGHT.bars} />}
      <Dissolve at={at(4) - DISSOLVE_FRAMES} mode="out" seed={8} />
    </Stage>
  );
};
