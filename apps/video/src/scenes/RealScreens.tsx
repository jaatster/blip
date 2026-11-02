import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { TICK, at, p, ticks } from "../lib/grid";
import { Burst, Life, Sky } from "../lib/Pixels";
import { type Move, PRESS, Pointer, pressing } from "../lib/Pointer";
import { Music, Sfx } from "../lib/Sound";
import { Site, type Rect } from "../lib/Site";
import { RIGHT, SPLIT_CLEAR, SplitText, type Part } from "../lib/Split";
import { Stage } from "../lib/Stage";
import { DISSOLVE_FRAMES, Dissolve, MOSAIC_FRAMES, Mosaic } from "../lib/Transitions";

/** Bars 21-26 of the theme: the hook. */
export const REAL_SCREENS = { bar: 21, bars: 6 };

// Make anything: the left names what it is (a website, an app, a game), the right shows the docs site's own template
// for it, live and never scrolled, in a device of its own, twice the size and cropped to its key part so it reads:
// the landing page's hero in a window, the dashboard's period and stats on a tablet, the game's title on the TV
// Blip began on. Each device drops in, attract mode's pointer presses one real control on
// the page and the page answers (the call to action sits in and sparkles, the period becomes Today and the numbers
// change, Press start opens the menu), then the next device takes over through the mosaic. Two bars each.
const SPAN = at(2);
const start = (i: number) => (i ? i * SPAN : MOSAIC_FRAMES);
const DROP = (i: number) => start(i) + TICK;
const MOVES: readonly Move[] = [0, 1, 2].map((i) => ({ at: i * SPAN + at(0, 3), to: `[data-v="target-${i}"]`, press: i * SPAN + at(1, 1) }));
const PARTS: readonly Part[] = [
  { at: start(0), title: "A website", line: "Daybreak, the landing page template." },
  { at: start(1), title: "An app", line: "Questboard, the dashboard template, live." },
  { at: start(2), title: "A game", line: "Starfall, the game template's screens." },
];
const FALL = [-40, -20, -8, 0, -3, 0];
// Press start: the TV's picture breaks into the mosaic and comes back as the menu.
const MENU = MOVES[2]!.press! + PRESS + MOSAIC_FRAMES;

// The dashboard's numbers for Today, as its own script sets them (js/tpl-dashboard.js).
const TODAY = [["312", "+8% on yesterday", "up"], ["1,180", "+2%", "up"], ["7K", "-1%", "down"], ["1", "-2: good news", "down"]];

/** A pointer target over a part of the page: an empty box where the part is, for the pointer to find. */
const Target = ({ i, rect }: { readonly i: number; readonly rect: Rect | undefined }) =>
  rect ? <div data-v={`target-${i}`} style={{ position: "absolute", left: rect.x, top: rect.y, width: rect.width, height: rect.height, pointerEvents: "none" }} /> : null;

const box = (r: number): CSSProperties => ({ "--blip-r": r, "--blip-shape": `var(--blip-shape-${r})`, "--blip-shape-inner": `var(--blip-shape-${r}-inner)` }) as CSSProperties;

/** A screen showing a page drawn at 2x from its point (x, y) in page pixels: the key part of it, big enough to read. */
const Crop = ({ x, y, children }: { readonly x: number; readonly y: number; readonly children: ReactNode }) => (
  <div style={{ position: "relative", overflow: "hidden", inlineSize: "100%", blockSize: "100%", minBlockSize: 0 }}>
    <div style={{ position: "absolute", left: -x * 2, top: -y * 2 }}>{children}</div>
  </div>
);

/** A device, centred in the right's box, dropping in a few whole pixels a Blip frame from `from`. */
const Device = ({ from, shown, w, h, children }: { readonly from: number; readonly shown: boolean; readonly w: number; readonly h: number; readonly children: ReactNode }) => {
  const frame = useCurrentFrame();
  const k = ticks(frame, from);
  return (
    <div
      style={{
        position: "absolute",
        left: p(RIGHT.x + Math.round((RIGHT.w - w) / 2)),
        top: p(RIGHT.y + Math.round((RIGHT.h - h) / 2)),
        inlineSize: p(w),
        blockSize: p(h),
        visibility: shown && k >= 0 ? "visible" : "hidden",
        translate: `0 ${p(FALL[Math.max(0, Math.min(k, FALL.length - 1))]!)}`,
      }}
    >
      {children}
    </div>
  );
};

export const RealScreens = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  const i = Math.min(2, Math.floor(frame / SPAN));
  const press = (n: number) => (pressing(frame, MOVES[n]!.press) ? "press" : frame >= MOVES[n]!.press! + PRESS ? "after" : "rest");
  const site = press(0), app = press(1), game = frame >= MENU - MOSAIC_FRAMES / 2 ? "menu" : press(2);
  // The right breaks into the mosaic as each device leaves, and the next drops in sharp.
  const leaving = i < 2 ? (i + 1) * SPAN - MOSAIC_FRAMES : Infinity;

  return (
    <Stage scheme="night" mosaicIn>
      <AbsoluteFill>
        <Sky scheme="night" avoid={SPLIT_CLEAR} />
        <Life avoid={SPLIT_CLEAR} seed={33} shooting={[at(3, 2)]} />
      </AbsoluteFill>

      <SplitText eyebrow="Make anything" parts={PARTS} />

      <Mosaic at={leaving} mode="out">
        {/* A website: the landing page in a plain Blip window, twice the size, its hero filling the window. */}
        <div>
          <Device from={DROP(0)} shown={i === 0} w={300} h={176}>
            <section className="blip-box blip-window" style={{ inlineSize: "100%", blockSize: "100%", display: "grid", gridTemplateRows: "auto 1fr" }}>
              <header className="blip-window-bar">
                <h2 className="blip-window-title blip-display blip-pop" data-pop="Daybreak">Daybreak</h2>
              </header>
              <Crop x={210} y={150}>
                <Site
                  page="templates/landing/index.html"
                  width={1016}
                  height={700}
                  zoom={2}
                  state={site}
                  apply={(doc) => {
                    const cta = doc.querySelector<HTMLElement>(".blip-hero-actions .blip-button");
                    if (site === "press") cta?.setAttribute("data-blip-state", "active");
                    else cta?.removeAttribute("data-blip-state");
                  }}
                  measure={[".blip-hero-actions .blip-button"]}
                  overlay={(rects) => <Target i={0} rect={rects[".blip-hero-actions .blip-button"]} />}
                />
              </Crop>
            </section>
          </Device>
        </div>

        {/* An app: the dashboard on a tablet, a Liquorice candy box, twice the size: the period and the stats. */}
        <div>
          <Device from={DROP(1)} shown={i === 1} w={280} h={176}>
            <div className="blip-box" data-tone="slate" style={{ ...box(5), inlineSize: "100%", blockSize: "100%", padding: p(8) }}>
              <div style={{ outline: "var(--blip-pixel) solid var(--blip-ink)", inlineSize: "100%", blockSize: "100%", display: "grid" }}>
                <Crop x={76} y={180}>
                  <Site
                    page="templates/dashboard/index.html"
                    width={600}
                    height={700}
                    zoom={2}
                    state={app}
                    apply={(doc) => {
                      const today = app !== "rest";
                      for (const b of doc.querySelectorAll<HTMLButtonElement>(".tpl-range > button")) {
                        if (today ? b.value === "day" : b.value === "week") b.setAttribute("aria-checked", "true");
                        else b.removeAttribute("aria-checked");
                        if (b.value === "day" && app === "press") b.setAttribute("data-blip-state", "active");
                        else b.removeAttribute("data-blip-state");
                      }
                      if (!today) return;
                      doc.querySelectorAll(".tpl-stats > .blip-stat").forEach((stat, n) => {
                        const [value, delta, trend] = TODAY[n]!;
                        const v = stat.querySelector(".blip-stat-value"), d = stat.querySelector<HTMLElement>(".blip-stat-delta");
                        if (v) v.textContent = value!;
                        if (d) {
                          d.textContent = delta!;
                          d.dataset.trend = trend!;
                          if (n === 3) d.dataset.tone = "success";
                        }
                      });
                    }}
                    measure={['.tpl-range > button[value="day"]']}
                    overlay={(rects) => <Target i={1} rect={rects['.tpl-range > button[value="day"]']} />}
                  />
                </Crop>
              </div>
            </div>
          </Device>
        </div>

        {/* A game: the game template on a pixel TV, twice the size, under the CRT's scanlines; Press start opens the menu. */}
        <div>
          <Device from={DROP(2)} shown={i === 2} w={236} h={176}>
            {/* The antenna: two rods stepping out a whole pixel at a time. */}
            {[-1, 1].map((d) => (
              <div key={d} style={{ position: "absolute", left: p(118), top: 0 }}>
                {Array.from({ length: 7 }, (_, k) => (
                  <span key={k} style={{ position: "absolute", left: p(d * (4 + k * 3) - (d < 0 ? 2 : 0)), top: p(12 - k * 2), inlineSize: p(3), blockSize: p(2), background: "var(--blip-line)" }} />
                ))}
              </div>
            ))}
            <div className="blip-box" data-tone="orange" style={{ ...box(5), position: "absolute", left: 0, top: p(14), inlineSize: p(236), blockSize: p(154), padding: p(8) }}>
              <div className="blip-crt" data-flicker="" style={{ position: "relative", outline: "var(--blip-pixel) solid var(--blip-ink)", overflow: "hidden", inlineSize: "100%", blockSize: "100%", display: "grid", background: "var(--blip-ink)" }}>
                <Mosaic at={game === "menu" ? MENU - MOSAIC_FRAMES / 2 : MOVES[2]!.press! + PRESS} mode={game === "menu" ? "in" : "out"}>
                  <Crop x={260} y={134}>
                    <Site
                      page="templates/game/index.html"
                      width={960}
                      height={700}
                      zoom={2}
                      state={game}
                      apply={(doc) => {
                        const g = doc.querySelector<HTMLElement>(".tpl-game");
                        if (g) g.dataset.screen = game === "menu" ? "menu" : "title";
                        const b = doc.querySelector<HTMLElement>(".tpl-press-start");
                        if (game === "press") b?.setAttribute("data-blip-state", "active");
                        else b?.removeAttribute("data-blip-state");
                      }}
                      measure={[".tpl-press-start"]}
                      overlay={(rects) => <Target i={2} rect={rects[".tpl-press-start"]} />}
                    />
                  </Crop>
                </Mosaic>
              </div>
            </div>
            {/* Its feet. */}
            {[36, 192].map((x) => <span key={x} style={{ position: "absolute", left: p(x), top: p(168), inlineSize: p(8), blockSize: p(6), background: "var(--blip-line)" }} />)}
          </Device>
        </div>
      </Mosaic>

      <Pointer moves={MOVES} />
      <Burst at={MOVES[0]!.press! + TICK} kind="sparkle" box={[146, 172, 92, 28]} count={10} seed={12} />

      {[0, 1, 2].map((n) => <Sfx key={`d${n}`} name="open" at={DROP(n)} volume={0.55} />)}
      {[0, 1, 2].map((n) => <Sfx key={`l${n}`} name="step" at={DROP(n) + 3 * TICK} volume={0.45} />)}
      {MOVES.map((m) => <Sfx key={`m${m.at}`} name="look" at={m.at} volume={0.35} />)}
      {MOVES.map((m, n) => <Sfx key={`p${m.at}`} name={n ? `select@${[0, 5, 7][n]}` : "select"} at={m.press!} volume={0.6} />)}
      <Sfx name="coin" at={MOVES[0]!.press! + TICK} volume={0.45} />
      <Sfx name="coin@7" at={MOVES[1]!.press! + PRESS} volume={0.45} />
      <Sfx name="success@5" at={MENU} volume={0.5} />
      {[1, 2].map((n) => <Sfx key={`b${n}`} name="back" at={n * SPAN - MOSAIC_FRAMES} volume={0.4} />)}

      {music && <Music bar={REAL_SCREENS.bar} bars={REAL_SCREENS.bars} />}
      <Dissolve at={at(6) - DISSOLVE_FRAMES} mode="out" seed={5} />
    </Stage>
  );
};
