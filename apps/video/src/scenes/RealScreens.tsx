import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Beat } from "../lib/Beat";
import { TICK, at, p, ticks } from "../lib/grid";
import { Dither, Life, Sky } from "../lib/Pixels";
import { Music, Sfx } from "../lib/Sound";
import { Site } from "../lib/Site";
import { Stage } from "../lib/Stage";

/** Bars 21-26 of the theme: the hook. */
export const REAL_SCREENS = { bar: 21, bars: 6 };

// Real screens: the docs site's own templates, live, in a pixel window. The dashboard for three bars, then the
// landing page for three, each scrolled a step at a time (three Blip frames to a move) so there is time to read.
const SCREENS = [
  { from: 0, page: "templates/dashboard/index.html", title: "Questboard", kind: "Dashboard template", scrolls: [[at(1, 2), 236], [at(2, 2), 472]] },
  { from: at(3), page: "templates/landing/index.html", title: "Daybreak", kind: "Landing page template", scrolls: [[at(4), 420], [at(4, 3), 840], [at(5, 2), 1260]] },
] as const;
const WINDOW = at(0, 1);
const SWAP = at(3);
const OUT = at(6) - 8 * TICK;
// The page inside, in CSS pixels, drawn twice as big: 432 x 212 Blip pixels.
const PAGE = { width: 864, height: 424 };
const CLEAR = [[20, 10, 460, 262]] as const;

/** How far down a page is at `frame`: each move in three even steps, a Blip frame apart. */
function scrolled(frame: number, scrolls: readonly (readonly [number, number])[]) {
  let y = 0;
  for (const [f, to] of scrolls) {
    if (frame < f) break;
    const k = Math.min(3, ticks(frame, f) + 1);
    y = y + ((to - y) * k) / 3;
  }
  return Math.round(y);
}

export const RealScreens = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  const screen = frame < SWAP ? SCREENS[0] : SCREENS[1];

  return (
    <Stage scheme="night">
      <AbsoluteFill>
        <Sky scheme="night" avoid={CLEAR} />
        <Life avoid={CLEAR} seed={33} />
      </AbsoluteFill>

      <Beat at={frame < SWAP ? WINDOW : SWAP} from={WINDOW}>
        <section className="blip-box blip-window blip-pop-in" style={{ position: "absolute", left: p(22), top: p(10), inlineSize: p(436) }}>
          <header className="blip-window-bar">
            <h2 className="blip-window-title blip-display blip-pop" data-pop={screen.title}>{screen.title}</h2>
            <div className="blip-window-controls">
              <span className="blip-box blip-window-control" data-control="minimize"><span /></span>
              <span className="blip-box blip-window-control" data-control="maximize"><span /></span>
              <span className="blip-box blip-window-control" data-control="close"><span /></span>
            </div>
          </header>
          <div className="blip-window-body" style={{ padding: 0, display: "grid", placeItems: "center" }}>
            <Site key={screen.page} page={screen.page} width={PAGE.width} height={PAGE.height} scroll={scrolled(frame, screen.scrolls)} />
          </div>
          <footer className="blip-window-status">
            <span>{screen.kind}</span>
            <span>Live, as it ships</span>
          </footer>
        </section>
      </Beat>

      <Sfx name="open" at={WINDOW} volume={0.6} />
      <Sfx name="open" at={SWAP} volume={0.6} />
      {SCREENS.flatMap((s) => s.scrolls.map(([f]) => <Sfx key={f} name="step@5" at={f} volume={0.4} />))}

      <Dither at={0} mode="in" />
      {frame < SWAP && <Dither at={SWAP - 8 * TICK} mode="out" />}
      {frame >= SWAP && <Dither at={SWAP} mode="in" />}
      <Dither at={OUT} mode="out" />
      {music && <Music bar={REAL_SCREENS.bar} bars={REAL_SCREENS.bars} />}
    </Stage>
  );
};
