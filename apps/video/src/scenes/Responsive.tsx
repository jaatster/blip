import type { CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Beat } from "../lib/Beat";
import { TICK, at, p, ticks } from "../lib/grid";
import { Life, Sky, Sprite } from "../lib/Pixels";
import { Music, Sfx } from "../lib/Sound";
import { Site } from "../lib/Site";
import { SHOW_CLEAR, SplitText, type Part } from "../lib/Split";
import { Stage } from "../lib/Stage";
import { Dissolve, MOSAIC_FRAMES } from "../lib/Transitions";

/** Bars 27-30 of the theme. */
export const RESPONSIVE = { bar: 27, bars: 4 };

// Responsive: the left names the layout (desktop, tablet, phone); the right is Questboard, the dashboard template,
// live in a pixel window, drawn twice the size so it reads. Attract mode's pointer takes the window's corner and drags
// it narrower, two Blip frames a step, and at each stop the page is the layout for that width (its shell answers to its
// container): the full sidebar from 1024 px, a rail of icons under it, the bottom bar under 600 px. Desktop and tablet
// pages are wider than the window, so it shows their top left, down to the page's title: the app bar and the sidebar
// or rail, where the change is. The phone needs its height for the bottom bar, so the last drag pulls the corner down
// as well as in. The window stands on the night sky, centred; each drag keeps its top left, then it glides back to the
// middle.
// Each width is its own settled page, mounted from the start, so every held frame is the same however it is reached.
// Each stop: the window's size in Blip pixels and the page's width in CSS pixels, its height the window's body at 2x.
// Each window's edges fall in the page's own gaps, measured from the page, so nothing shows half cut: the desktop's
// right edge between the app bar's links and the period (740), its bottom between the second and third sidebar rows
// (186); the tablet's right edge between the period and the app bar's actions (642), its bottom under the title and
// above the rail's third icon (184); the phone whole and 288 high, so its bottom bar sits clear under the period, and
// the window shows it down to the bar's drop (284), not the strip of page under the bar.
const STOPS = [
  { win: 372, h: 111, page: 1112, pageH: 186 },
  { win: 323, h: 110, page: 760, pageH: 184 },
  { win: 198, h: 160, page: 392, pageH: 288 },
];
const WINDOW = at(0, 1);
const ENTER = at(1);
const DRAGS = [at(1, 1), at(2, 1)];
const DRAG_STEPS = 3;
const STEP_FRAMES = 2 * TICK;
const dragEnd = (d: number) => d + DRAG_STEPS * STEP_FRAMES;
const PARTS: readonly Part[] = [
  { at: WINDOW, title: "Desktop", line: "A sidebar and the full app bar." },
  { at: dragEnd(DRAGS[0]!), title: "Tablet", line: "The sidebar folds to a rail of icons." },
  { at: dragEnd(DRAGS[1]!), title: "Phone", line: "A bottom bar takes over." },
];
// The window stands on the sky in the hero's room, y 58 to 218, centred both ways: a 16-pixel title bar over the
// page, which fills the rest at twice the size.
const CENTRE = [240, 138] as const;
const BOTTOM = 218;
const left = (s: (typeof STOPS)[number]) => Math.round(CENTRE[0] - s.win / 2);
const top = (s: (typeof STOPS)[number]) => Math.round(CENTRE[1] - s.h / 2);

/**
 * Where the window is: which stop its page is at, its size (three even steps while it is dragged, the page changing at
 * the end) and its top left (held through a drag, then four even steps back to the middle).
 */
function stateAt(frame: number) {
  let stop = 0, win = STOPS[0]!.win, h = STOPS[0]!.h, x = left(STOPS[0]!), y = top(STOPS[0]!);
  DRAGS.forEach((d, i) => {
    if (frame < d) return;
    const a = STOPS[i]!, b = STOPS[i + 1]!;
    const k = Math.min(DRAG_STEPS, Math.floor((frame - d) / STEP_FRAMES) + 1);
    win = Math.round(a.win + ((b.win - a.win) * k) / DRAG_STEPS);
    h = Math.round(a.h + ((b.h - a.h) * k) / DRAG_STEPS);
    stop = k === DRAG_STEPS ? i + 1 : i;
    const g = Math.max(0, Math.min(4, ticks(frame, dragEnd(d) + TICK) + 1));
    x = Math.round(left(a) + ((left(b) - left(a)) * g) / 4);
    y = Math.round(top(a) + ((top(b) - top(a)) * g) / 4);
  });
  // A window growing taller never reaches below the hero, into the line's room.
  return { stop, win, h, x, y: Math.min(y, BOTTOM - h) };
}

export const Responsive = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  const { stop, win, h, x, y } = stateAt(frame);
  const corner = [x + win - 4, y + h - 4] as const;
  const holding = DRAGS.some((d) => frame >= d - TICK && frame < dragEnd(d) + 6 * TICK);
  const enter = Math.min(6, ticks(frame, ENTER) + 1) / 6;
  const from = [470, 200] as const;
  const pointer = frame < ENTER ? null : [Math.round(from[0] + (corner[0] - from[0]) * enter), Math.round(from[1] + (corner[1] - from[1]) * enter)] as const;

  return (
    <Stage scheme="night" mosaicOut={at(4) - MOSAIC_FRAMES}>
      <AbsoluteFill>
        <Sky scheme="night" avoid={SHOW_CLEAR} />
        <Life avoid={SHOW_CLEAR} seed={47} shooting={[at(3, 1)]} />
      </AbsoluteFill>

      <SplitText eyebrow="Responsive" parts={PARTS} />

      <Beat at={WINDOW}>
        <section className="blip-box blip-window blip-pop-in" style={{ position: "absolute", left: p(x), top: p(y), inlineSize: p(win), blockSize: p(h), display: "grid", gridTemplateRows: "auto 1fr" }}>
          <header className="blip-window-bar">
            <h2 className="blip-window-title blip-display blip-pop" data-pop="Questboard">Questboard</h2>
          </header>
          <div className="blip-window-body" style={{ padding: 0, position: "relative", overflow: "hidden" }}>
            {STOPS.map((s, i) => (
              <div key={s.page} style={{ position: "absolute", left: 0, top: 0, visibility: i === stop ? "visible" : "hidden" }}>
                <Site page="templates/dashboard/index.html" width={s.page} height={s.pageH} zoom={2} />
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
        // The kit's hand, a quarter turn upright as attract mode's pointer stands, its fingertip on the grip.
        <div style={{ position: "absolute", left: p(pointer[0] - 4), top: p(pointer[1] + 2 + (holding ? 1 : 0)), zIndex: 50 }}>
          <Sprite name="pointer" style={{ rotate: "-90deg" }} />
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
