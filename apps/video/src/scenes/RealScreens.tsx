import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { TICK, at, p, ticks } from "../lib/grid";
import { Burst, Life, Sky } from "../lib/Pixels";
import { Music, Sfx } from "../lib/Sound";
import { Site } from "../lib/Site";
import { HERO, SHOW_CLEAR, SplitText, type Part } from "../lib/Split";
import { Stage } from "../lib/Stage";
import { DISSOLVE_FRAMES, Dissolve, MOSAIC_FRAMES, Mosaic } from "../lib/Transitions";

/** Bars 21-24 of the theme: the hook. */
export const REAL_SCREENS = { bar: 21, bars: 4 };

// Make anything: the title says what it is (a website, an app); the hero shows the docs site's own template for it,
// live and never scrolled, in a device of its own standing on the night sky, twice the size and cropped to its key
// part so it reads: the landing page's hero in a window, the dashboard's period and stats on a tablet. Each device
// drops in and bumps; on the beat the page answers by itself (the call to action sits in and sparkles; the period
// becomes Today and the numbers change); then the tablet takes over through the mosaic. Two bars each.
const SPAN = at(2);
const start = (i: number) => (i ? i * SPAN : MOSAIC_FRAMES);
const DROP = (i: number) => start(i) + TICK;
const PRESSES = [at(1, 1), SPAN + at(1, 1)];
const PRESS = 3 * TICK;
const PARTS: readonly Part[] = [
  { at: start(0), title: "A website", line: "Daybreak, the landing page template." },
  { at: start(1), title: "An app", line: "Questboard, the dashboard template, live." },
];
// A drop, then a bump: down onto the sky, up three pixels, and settled.
const FALL = [-20, -10, -3, 0, -3, 0];

// The dashboard's numbers for Today, as its own script sets them (js/tpl-dashboard.js).
const TODAY = [["312", "+8% on yesterday", "up"], ["1,180", "+2%", "up"], ["7K", "-1%", "down"], ["1", "-2: good news", "down"]];

const box = (r: number): CSSProperties => ({ "--blip-r": r, "--blip-shape": `var(--blip-shape-${r})`, "--blip-shape-inner": `var(--blip-shape-${r}-inner)` }) as CSSProperties;

/** A screen showing a page drawn at 2x from its point (x, y) in page pixels: the key part of it, big enough to read. */
const Crop = ({ x, y, children }: { readonly x: number; readonly y: number; readonly children: ReactNode }) => (
  <div style={{ position: "relative", overflow: "hidden", inlineSize: "100%", blockSize: "100%", minBlockSize: 0 }}>
    <div style={{ position: "absolute", left: -x * 2, top: -y * 2 }}>{children}</div>
  </div>
);

/** A device, centred in the hero, dropping in a few whole pixels a Blip frame from `from`. */
const Device = ({ from, shown, w, h, children }: { readonly from: number; readonly shown: boolean; readonly w: number; readonly h: number; readonly children: ReactNode }) => {
  const frame = useCurrentFrame();
  const k = ticks(frame, from);
  return (
    <div
      style={{
        position: "absolute",
        left: p(HERO.x + Math.round((HERO.w - w) / 2)),
        top: p(HERO.y + Math.round((HERO.h - h) / 2)),
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
  const i = Math.min(1, Math.floor(frame / SPAN));
  const press = (n: number) => (frame >= PRESSES[n]! && frame < PRESSES[n]! + PRESS ? "press" : frame >= PRESSES[n]! + PRESS ? "after" : "rest");
  const site = press(0), app = press(1);

  return (
    <Stage scheme="night" mosaicIn>
      <AbsoluteFill>
        <Sky scheme="night" avoid={SHOW_CLEAR} />
        <Life avoid={SHOW_CLEAR} seed={33} shooting={[at(2, 2)]} />
      </AbsoluteFill>

      <SplitText eyebrow="Make anything" parts={PARTS} />

      <Mosaic at={i === 0 ? SPAN - MOSAIC_FRAMES : Infinity} mode="out">
        {/* A website: the landing page in a plain Blip window, twice the size, its hero filling the window. */}
        <Device from={DROP(0)} shown={i === 0} w={360} h={152}>
          <section className="blip-box blip-window" style={{ inlineSize: "100%", blockSize: "100%", display: "grid", gridTemplateRows: "auto 1fr" }}>
            <header className="blip-window-bar">
              <h2 className="blip-window-title blip-display blip-pop" data-pop="Daybreak">Daybreak</h2>
            </header>
            <Crop x={150} y={170}>
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
              />
            </Crop>
          </section>
        </Device>

        {/* An app: the dashboard on a landscape tablet, a Liquorice candy box, twice the size: the period and the first
            row of stats, whole. */}
        <Device from={DROP(1)} shown={i === 1} w={300} h={116}>
          <div className="blip-box" data-tone="slate" style={{ ...box(5), inlineSize: "100%", blockSize: "100%", padding: p(8) }}>
            <div style={{ outline: "var(--blip-pixel) solid var(--blip-ink)", inlineSize: "100%", blockSize: "100%", display: "grid" }}>
              <Crop x={72} y={188}>
                <Site
                  page="templates/dashboard/index.html"
                  width={640}
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
                />
              </Crop>
            </div>
          </div>
        </Device>
      </Mosaic>

      {/* The call to action's sparkle: where "Plan tomorrow" sits on the stage. */}
      <Burst at={PRESSES[0]! + TICK} kind="sparkle" box={[146, 200, 92, 28]} count={10} seed={12} />

      {[0, 1].map((n) => <Sfx key={`d${n}`} name="open" at={DROP(n)} volume={0.55} />)}
      {[0, 1].map((n) => <Sfx key={`l${n}`} name="bump" at={DROP(n) + 3 * TICK} volume={0.45} />)}
      {PRESSES.map((f, n) => <Sfx key={`p${f}`} name={n ? "select@5" : "select"} at={f} volume={0.6} />)}
      <Sfx name="coin" at={PRESSES[0]! + TICK} volume={0.45} />
      <Sfx name="coin@7" at={PRESSES[1]! + PRESS} volume={0.45} />
      <Sfx name="back" at={SPAN - MOSAIC_FRAMES} volume={0.4} />

      {music && <Music bar={REAL_SCREENS.bar} bars={REAL_SCREENS.bars} />}
      <Dissolve at={at(4) - DISSOLVE_FRAMES} mode="out" seed={5} />
    </Stage>
  );
};
