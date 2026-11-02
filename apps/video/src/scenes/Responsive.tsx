import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Beat } from "../lib/Beat";
import { TICK, at, p, ticks } from "../lib/grid";
import { Life, Sky } from "../lib/Pixels";
import { Music, Sfx } from "../lib/Sound";
import { Site, type Rect } from "../lib/Site";
import { Stage } from "../lib/Stage";
import { Dissolve, MOSAIC_FRAMES, Mosaic } from "../lib/Transitions";

/** Bars 27-30 of the theme. */
export const RESPONSIVE = { bar: 27, bars: 4 };

// Responsive: Questboard, the dashboard template, live and never scrolled, at five widths from desktop to
// phone. Its shell answers to its own container, so each width is a real layout: the full sidebar from 1024 px, a
// rail of icons from 600 px, the bottom bar under it; the app bar folds its links into a menu button under 1024 px.
// Each change: the page breaks into the mosaic, the window narrows in three whole-pixel steps as the new width comes
// back into focus, then the part that changed gets the focus ring and its tag lights on the left.
const STEPS = [
  { at: at(0, 1), width: 1112, tag: "Sidebar", part: ".blip-sidebar" },
  { at: at(1), width: 900, tag: "Rail", part: ".blip-sidebar" },
  { at: at(1, 2), width: 760, tag: "Menu button", part: ".blip-app-bar-toggle" },
  { at: at(2), width: 560, tag: "Bottom bar", part: ".blip-bottom-bar" },
  { at: at(2, 2), width: 392, tag: "Stats stack", part: ".blip-stat" },
] as const;
const HEIGHT = 848;
const CLEAR = [[12, 8, 470, 262]] as const;
// The window is centred over the right of the stage; its body is the page, a page pixel to a CSS pixel.
const CENTRE = 326;

const Ring = ({ rect, from }: { readonly rect: Rect | undefined; readonly from: number }) => {
  const frame = useCurrentFrame();
  if (!rect) return null;
  const snap = (v: number) => Math.round(v / 4) * 4;
  const low = ticks(frame, from) < 1 ? 4 : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: snap(rect.x) - 4,
        top: snap(rect.y) - 4 + low,
        width: snap(rect.width) + 8,
        height: snap(rect.height) + 8,
        outline: "var(--blip-pixel) solid var(--blip-focus)",
        boxShadow: "0 0 0 calc(2 * var(--blip-pixel)) var(--blip-focus-edge)",
        pointerEvents: "none",
      }}
    />
  );
};

export const Responsive = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  const i = Math.max(0, STEPS.filter((s) => s.at <= frame).length - 1);
  const step = STEPS[i]!;
  const prev = STEPS[Math.max(0, i - 1)]!;
  // The window's width in Blip pixels: the page's quarter plus its outline, three even steps from the last.
  const k = Math.min(3, ticks(frame, step.at) + 1);
  const page = i ? Math.round((prev.width + ((step.width - prev.width) * k) / 3) / 4) * 4 : step.width;
  const win = page / 4 + 2;
  const ringFrom = step.at + 3 * TICK;
  const next = STEPS[i + 1];
  const mosaic = next && frame >= next.at - MOSAIC_FRAMES ? { at: next.at - MOSAIC_FRAMES, mode: "out" as const } : { at: i ? step.at : -at(1), mode: "in" as const };

  return (
    <Stage scheme="night" mosaicOut={at(4) - MOSAIC_FRAMES}>
      <AbsoluteFill>
        <Sky scheme="night" avoid={CLEAR} />
        <Life avoid={CLEAR} seed={47} shooting={[at(3, 1)]} />
      </AbsoluteFill>

      <div style={{ position: "absolute", left: p(16), top: p(12) }}>
        <span className="blip-display blip-pop" data-scale="2" data-pop="Responsive">Responsive</span>
      </div>

      <Beat at={STEPS[0].at}>
        <article className="blip-box blip-card blip-pop-in" data-size="sm" style={{ position: "absolute", left: p(14), top: p(42), inlineSize: p(164), blockSize: p(212), padding: 0 }}>
          <div style={{ display: "grid", alignContent: "start", gap: p(8), padding: p(10) }}>
            <Beat key={step.width} at={step.at}>
              <span className="blip-display blip-pop blip-pop-in" data-scale="3" data-pop={`${step.width} px`} style={{ display: "inline-block", fontVariantNumeric: "tabular-nums" }}>
                {`${step.width} px`}
              </span>
            </Beat>
            <p style={{ margin: 0, fontSize: "var(--blip-size-lead)", lineHeight: 1.4, color: "var(--blip-text-muted)" }}>
              Components answer to their container: sidebar to rail to bottom bar.
            </p>
            <div style={{ display: "grid", justifyItems: "start", gap: p(5) }}>
              {STEPS.map((s, n) => {
                const on = n === i && frame >= ringFrom;
                return (
                  <Beat key={s.tag} at={on ? ringFrom : 0}>
                    <span className={`blip-box blip-tag${on ? " blip-pop-in" : ""}`} data-size="lg" data-variant={on ? "candy" : "outline"} data-tone={on ? "accent" : "neutral"}>
                      {s.tag}
                    </span>
                  </Beat>
                );
              })}
            </div>
          </div>
        </article>

        <section className="blip-box blip-window blip-pop-in" style={{ position: "absolute", left: p(Math.round(CENTRE - win / 2)), top: p(14), inlineSize: p(win) }}>
          <header className="blip-window-bar">
            <h2 className="blip-window-title blip-display blip-pop" data-pop="Questboard">Questboard</h2>
            {win >= 160 && (
              <div className="blip-window-controls">
                <span className="blip-box blip-window-control" data-control="minimize"><span /></span>
                <span className="blip-box blip-window-control" data-control="maximize"><span /></span>
                <span className="blip-box blip-window-control" data-control="close"><span /></span>
              </div>
            )}
          </header>
          <div className="blip-window-body" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ position: "relative", inlineSize: page, blockSize: HEIGHT, overflow: "hidden" }}>
              <Mosaic at={mosaic.at} mode={mosaic.mode}>
                {STEPS.map((s, n) => (
                  <div key={s.width} style={{ position: "absolute", left: 0, top: 0, visibility: n === i ? "visible" : "hidden" }}>
                    <Site
                      page="templates/dashboard/index.html"
                      width={s.width}
                      height={HEIGHT}
                      zoom={1}
                      measure={[s.part]}
                      overlay={(rects) => (n === i && frame >= ringFrom ? <Ring rect={rects[s.part]} from={ringFrom} /> : null)}
                    />
                  </div>
                ))}
              </Mosaic>
            </div>
          </div>
          <footer className="blip-window-status">
            <span>{win >= 160 ? "Dashboard template" : "Phone"}</span>
          </footer>
        </section>
      </Beat>

      <Sfx name="open" at={STEPS[0].at} volume={0.6} />
      {STEPS.slice(1).map((s) => <Sfx key={`m${s.at}`} name="back" at={s.at - MOSAIC_FRAMES} volume={0.4} />)}
      {STEPS.slice(1).map((s, n) => <Sfx key={`w${s.at}`} name={`step@${[12, 10, 8, 7][n]}`} at={s.at} volume={0.5} />)}
      {STEPS.map((s, n) => <Sfx key={`t${s.at}`} name={n ? `select@${[0, 5, 7, 12, 12][n]}` : "select"} at={s.at + 3 * TICK} volume={0.5} />)}

      {music && <Music bar={RESPONSIVE.bar} bars={RESPONSIVE.bars} />}
      <Dissolve at={0} mode="in" seed={6} />
    </Stage>
  );
};
