import type { CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Beat } from "../lib/Beat";
import { TICK, at, p, ticks } from "../lib/grid";
import { Life, Sky, Sprite } from "../lib/Pixels";
import { Music, Sfx } from "../lib/Sound";
import { Site } from "../lib/Site";
import { RIGHT, SPLIT_CLEAR, SplitText, type Part } from "../lib/Split";
import { Stage } from "../lib/Stage";
import { Dissolve, MOSAIC_FRAMES } from "../lib/Transitions";

/** Bars 27-30 of the theme. */
export const RESPONSIVE = { bar: 27, bars: 4 };

// Responsive: the left names the layout (desktop, tablet, phone); the right is Questboard, the dashboard template,
// live in a pixel window, drawn twice the size so it reads. Attract mode's pointer takes the window's corner and drags
// it narrower, two Blip frames a step, and at each stop the page is the layout for that width (its shell answers to its
// container): the full sidebar from 1024 px, a rail of icons under it, the bottom bar under 600 px. Desktop and tablet
// pages are wider than the window, so it shows their left side, where the change is; the phone page fits whole.
// Each width is its own settled page, mounted from the start, so every held frame is the same however it is reached.
const STOPS = [
  { win: 300, page: 1112 },
  { win: 248, page: 760 },
  { win: 196, page: 392 },
];
const WINDOW = at(0, 1);
const ENTER = at(1);
const DRAGS = [at(1, 1), at(2, 1)];
const DRAG_STEPS = 3;
const STEP_FRAMES = 2 * TICK;
const dragEnd = (d: number) => d + DRAG_STEPS * STEP_FRAMES;
const GLIDE = dragEnd(DRAGS[1]!) + TICK;
const PARTS: readonly Part[] = [
  { at: WINDOW, title: "Desktop", line: "A sidebar and the full app bar." },
  { at: dragEnd(DRAGS[0]!), title: "Tablet", line: "The sidebar folds to a rail of icons." },
  { at: dragEnd(DRAGS[1]!), title: "Phone", line: "A bottom bar takes over." },
];
// The window: a 16-pixel title bar over the page, which fills the rest of the right's height at twice the size.
const BAR = 16;
const BODY = RIGHT.h - BAR - 2;
const PAGE_H = BODY * 2;

/** Which stop the page is at, and the window's width: three even steps while it is dragged, the page changing at the end. */
function stateAt(frame: number) {
  let stop = 0, win = STOPS[0]!.win;
  DRAGS.forEach((d, i) => {
    if (frame < d) return;
    const k = Math.min(DRAG_STEPS, Math.floor((frame - d) / STEP_FRAMES) + 1);
    win = Math.round(STOPS[i]!.win + ((STOPS[i + 1]!.win - STOPS[i]!.win) * k) / DRAG_STEPS);
    stop = k === DRAG_STEPS ? i + 1 : i;
  });
  return { stop, win };
}

export const Responsive = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  const { stop, win } = stateAt(frame);
  // Once a phone, the window, still held, glides to the middle of the right in four even steps.
  const glide = Math.max(0, Math.min(4, ticks(frame, GLIDE) + 1));
  const x = RIGHT.x + Math.round(((RIGHT.w - win) / 2) * (glide / 4));
  const corner = [x + win - 5, RIGHT.y + RIGHT.h - 5] as const;
  const holding = DRAGS.some((d) => frame >= d - TICK && frame < dragEnd(d) + TICK) || (frame >= GLIDE && frame < GLIDE + 5 * TICK);
  const enter = Math.min(6, ticks(frame, ENTER) + 1) / 6;
  const from = [470, 250] as const;
  const pointer = frame < ENTER ? null : [Math.round(from[0] + (corner[0] - from[0]) * enter), Math.round(from[1] + (corner[1] - from[1]) * enter)] as const;

  return (
    <Stage scheme="night" mosaicOut={at(4) - MOSAIC_FRAMES}>
      <AbsoluteFill>
        <Sky scheme="night" avoid={SPLIT_CLEAR} />
        <Life avoid={SPLIT_CLEAR} seed={47} shooting={[at(3, 1)]} />
      </AbsoluteFill>

      <SplitText eyebrow="Responsive" parts={PARTS} />

      <Beat at={WINDOW}>
        <section className="blip-box blip-window blip-pop-in" style={{ position: "absolute", left: p(x), top: p(RIGHT.y), inlineSize: p(win), blockSize: p(RIGHT.h), display: "grid", gridTemplateRows: "auto 1fr" }}>
          <header className="blip-window-bar">
            <h2 className="blip-window-title blip-display blip-pop" data-pop="Questboard">Questboard</h2>
          </header>
          <div className="blip-window-body" style={{ padding: 0, position: "relative", overflow: "hidden" }}>
            {STOPS.map((s, i) => (
              <div key={s.page} style={{ position: "absolute", left: 0, top: 0, visibility: i === stop ? "visible" : "hidden" }}>
                <Site page="templates/dashboard/index.html" width={s.page} height={PAGE_H} zoom={2} />
              </div>
            ))}
            {/* The grip: three stepped pairs of ink pixels in the corner, the handle the pointer takes. */}
            <span aria-hidden="true" style={{ position: "absolute", right: p(2), bottom: p(2), inlineSize: p(6), blockSize: p(6) }}>
              {[[4, 0], [2, 2], [4, 2], [0, 4], [2, 4], [4, 4]].map(([gx, gy]) => (
                <span key={`${gx}${gy}`} style={{ position: "absolute", left: p(gx!), top: p(gy!), inlineSize: p(1), blockSize: p(1), background: "var(--blip-text)" } as CSSProperties} />
              ))}
            </span>
          </div>
        </section>
      </Beat>

      {pointer && (
        <div style={{ position: "absolute", left: p(pointer[0]), top: p(pointer[1] + (holding ? 1 : 0)), zIndex: 50 }}>
          <Sprite name="pointer" />
        </div>
      )}

      <Sfx name="open" at={WINDOW} volume={0.6} />
      <Sfx name="look" at={ENTER} volume={0.4} />
      {DRAGS.map((d) => <Sfx key={`g${d}`} name="select" at={d - TICK} volume={0.5} />)}
      {DRAGS.flatMap((d, i) =>
        Array.from({ length: DRAG_STEPS }, (_, k) => <Sfx key={`s${d}${k}`} name={`step@${[12, 10, 8, 7, 5, 3][i * DRAG_STEPS + k]}`} at={d + k * STEP_FRAMES} volume={0.45} />),
      )}
      {PARTS.slice(1).map((pt) => <Sfx key={`c${pt.at}`} name="coin@7" at={pt.at} volume={0.4} />)}

      {music && <Music bar={RESPONSIVE.bar} bars={RESPONSIVE.bars} />}
      <Dissolve at={0} mode="in" seed={6} />
    </Stage>
  );
};
