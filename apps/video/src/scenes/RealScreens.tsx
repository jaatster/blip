import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Beat } from "../lib/Beat";
import { STEP, at, p, ticks } from "../lib/grid";
import { Life, Sky } from "../lib/Pixels";
import { Music, Sfx } from "../lib/Sound";
import { Site, type Rect } from "../lib/Site";
import { Stage } from "../lib/Stage";
import { DropTitle, letterLands } from "../lib/Text";
import { DISSOLVE_FRAMES, Dissolve, MOSAIC_FRAMES, Mosaic } from "../lib/Transitions";

/** Bars 21-26 of the theme: the hook. */
export const REAL_SCREENS = { bar: 21, bars: 6 };

// Make anything: the docs site's own templates (an app, a website, a game), live and still, two bars each. On the left, a card names the template
// and lists the Blip parts it is made of; each part lights on its own beat and the focus ring goes round that part on
// the page itself. The window and the card change together through the effects kit's mosaic.
const TEMPLATES = [
  {
    page: "templates/dashboard/index.html", name: "Questboard", kind: "Dashboard template",
    line: "An app: a live-ops dashboard with an app shell, stats, charts and tables.",
    parts: [["Sidebar", ".blip-sidebar"], ["Stat", ".blip-stat"], ["Segmented", ".tpl-range"]],
  },
  {
    page: "templates/landing/index.html", name: "Daybreak", kind: "Landing page template",
    line: "A website: a landing page with a hero on the world, features and pricing.",
    parts: [["App bar", ".blip-app-bar"], ["Hero title", ".blip-hero-title"], ["Buttons", ".blip-hero-actions"]],
  },
  {
    page: "templates/game/index.html", name: "Starfall", kind: "Game template",
    line: "A game: its title, menus, level map and HUD.",
    parts: [["Title", "#game-title"], ["Prompt", ".tpl-title .blip-prompt-start"], ["Keycap", ".tpl-title .blip-prompt-key"]],
  },
] as const;
const SPAN = at(2);
const WINDOW = at(0, 1);
/** Where template `i` starts, its name lands and its parts light (a beat in, then every two beats). */
const start = (i: number) => i * SPAN;
const nameAt = (i: number) => (i ? start(i) + MOSAIC_FRAMES : WINDOW);
const lights = (i: number) => [at(0, 2), at(1, 0), at(1, 2)].map((f) => start(i) + f);
const CLEAR = [[12, 8, 470, 262]] as const;

// The page as drawn in the window: 278 x 212 Blip pixels of the stage, a page pixel to a CSS pixel.
const PAGE = { width: 1112, height: 848 };

/** The focus ring round a part of the page, on whole Blip pixels, a pixel low on its first frame. */
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

export const RealScreens = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  const i = Math.min(TEMPLATES.length - 1, Math.max(0, Math.floor(frame / SPAN)));
  const t = TEMPLATES[i]!;
  const lit = lights(i).filter((f) => f <= frame).length - 1;
  // The mosaic: the first template comes in sharp, the last leaves through the scene's own change.
  const mosaic = frame < start(i) + SPAN / 2
    ? { at: i ? start(i) : -SPAN, mode: "in" as const }
    : { at: i < TEMPLATES.length - 1 ? start(i + 1) - MOSAIC_FRAMES : Infinity, mode: "out" as const };

  return (
    <Stage scheme="night" mosaicIn>
      <AbsoluteFill>
        <Sky scheme="night" avoid={CLEAR} />
        <Life avoid={CLEAR} seed={33} shooting={[at(3, 2)]} />
      </AbsoluteFill>

      <div style={{ position: "absolute", left: p(16), top: p(12) }}>
        <span className="blip-display blip-pop" data-scale="2" data-pop="Make anything">Make anything</span>
      </div>

      <Beat at={WINDOW}>
        <article className="blip-box blip-card blip-pop-in" data-size="sm" style={{ position: "absolute", left: p(14), top: p(42), inlineSize: p(164), blockSize: p(212), padding: 0 }}>
          {/* Clipped, so a name's falling letters never cross the heading above. */}
          <div style={{ position: "relative", inlineSize: "100%", blockSize: "100%", overflow: "hidden" }}>
            <Mosaic at={mosaic.at} mode={mosaic.mode}>
              <div style={{ display: "grid", alignContent: "start", gap: p(10), padding: p(10) }}>
                <div style={{ blockSize: p(20), whiteSpace: "nowrap" }}>
                  <DropTitle key={t.name} text={t.name} lands={letterLands(t.name, nameAt(i), STEP)} scale={2} />
                </div>
                <p style={{ margin: 0, fontSize: "var(--blip-size-lead)", lineHeight: 1.4, color: "var(--blip-text-muted)", visibility: frame >= nameAt(i) + 2 * STEP ? "visible" : "hidden" }}>{t.line}</p>
                <div style={{ display: "grid", justifyItems: "start", gap: p(7), marginBlockStart: p(6) }}>
                  {t.parts.map(([label], n) => {
                    const on = n === lit;
                    const shown = frame >= nameAt(i) + 2 * STEP + n * STEP;
                    return (
                      <Beat key={`${i}${label}`} at={on ? lights(i)[n]! : nameAt(i) + 2 * STEP + n * STEP}>
                        <span
                          className={`blip-box blip-tag${on || shown ? " blip-pop-in" : ""}`}
                          data-size="lg"
                          data-variant={on ? "candy" : "outline"}
                          data-tone={on ? "accent" : "neutral"}
                          style={{ visibility: shown ? "visible" : "hidden" }}
                        >
                          {label}
                        </span>
                      </Beat>
                    );
                  })}
                </div>
              </div>
            </Mosaic>
          </div>
        </article>

        <section className="blip-box blip-window blip-pop-in" style={{ position: "absolute", left: p(186), top: p(14), inlineSize: p(280) }}>
          <header className="blip-window-bar">
            <h2 className="blip-window-title blip-display blip-pop" data-pop={t.name}>{t.name}</h2>
            <div className="blip-window-controls">
              <span className="blip-box blip-window-control" data-control="minimize"><span /></span>
              <span className="blip-box blip-window-control" data-control="maximize"><span /></span>
              <span className="blip-box blip-window-control" data-control="close"><span /></span>
            </div>
          </header>
          <div className="blip-window-body" style={{ padding: 0 }}>
            <div style={{ position: "relative", inlineSize: PAGE.width, blockSize: PAGE.height }}>
              <Mosaic at={mosaic.at} mode={mosaic.mode}>
                {TEMPLATES.map((tp, n) => (
                  <div key={tp.page} style={{ position: "absolute", inset: 0, visibility: n === i ? "visible" : "hidden" }}>
                    <Site
                      page={tp.page}
                      width={PAGE.width}
                      height={PAGE.height}
                      zoom={1}
                      measure={tp.parts.map(([, sel]) => sel)}
                      overlay={(rects) =>
                        n === i && lit >= 0 ? <Ring key={lit} rect={rects[tp.parts[lit]![1]]} from={lights(i)[lit]!} /> : null
                      }
                    />
                  </div>
                ))}
              </Mosaic>
            </div>
          </div>
          <footer className="blip-window-status">
            <span>{t.kind}</span>
            <span>Live, as it ships</span>
          </footer>
        </section>
      </Beat>

      <Sfx name="open" at={WINDOW} volume={0.6} />
      {TEMPLATES.slice(1).map((_, n) => <Sfx key={`m${n}`} name="back" at={start(n + 1) - MOSAIC_FRAMES} volume={0.45} />)}
      {TEMPLATES.flatMap((tp, n) =>
        [...new Set(letterLands(tp.name, nameAt(n), STEP))].map((f, k) => <Sfx key={`${n}l${f}`} name={k ? `step@${[0, 2, 3, 5, 7, 8, 10, 12, 12, 12][k]}` : "step"} at={f} volume={0.35} />),
      )}
      {TEMPLATES.flatMap((_, n) => lights(n).map((f, k) => <Sfx key={`${n}p${f}`} name={k ? `select@${[0, 5, 7][k]}` : "select"} at={f} volume={0.55} />))}

      {music && <Music bar={REAL_SCREENS.bar} bars={REAL_SCREENS.bars} />}
      <Dissolve at={at(6) - DISSOLVE_FRAMES} mode="out" seed={5} />
    </Stage>
  );
};
