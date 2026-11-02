import type { CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Beat } from "../lib/Beat";
import { STEP, TICK, at, p, ticks } from "../lib/grid";
import { Icon } from "../lib/Icon";
import { Dither, Life, Sky } from "../lib/Pixels";
import { Music, Sfx } from "../lib/Sound";
import { Stage } from "../lib/Stage";
import { DropTitle, Typed } from "../lib/Text";

/** Bars 9-16 of the theme: the hook. */
export const COMPONENTS = { bar: 9, bars: 8 };

type Scheme = "day" | "sunset" | "night";

// One thing at a time, at Night, on the world's sky alone: its stars flare and now and then one shoots, clear of
// what is on screen. The docs home's Options window, alone in the middle, worked from the keyboard: the focus ring
// steps down a row and that row does its one thing, with a beat to settle. Time of day shows Day and Sunset three
// beats each (1.2 s) and comes back to Night. Press start swaps the window for the home's launcher; the focus walks to
// Components a beat a tile and Enter opens it. The screen dissolves to the end card: 88 and its line.
const WINDOW = at(0, 1);
const ROWS = [at(0, 3), at(3, 0), at(3, 2)];
const TIMES: readonly (readonly [frame: number, value: number, scheme: Scheme])[] = [
  [0, 3, "night"],
  [at(1, 0), 1, "day"],
  [at(1, 3), 2, "sunset"],
  [at(2, 2), 3, "night"],
];
const SOUNDS_ON = at(3, 1);
const START = at(3, 3);
const SWAP = at(4, 0);
const LANDS = [0, 1, 2, 3, 4, 5].map((i) => at(4, 0, 2 * i));
const PICKS: readonly (readonly [frame: number, tile: number])[] = [
  [at(4, 3), 0],
  [at(5, 0), 1],
  [at(5, 1), 2],
];
const OPEN = at(5, 2);
const END = at(6);
const STRAP = END + 2 * STEP + 2 * STEP;
const OUT = at(8) - 8 * TICK;
// What the sky keeps clear of, in Blip pixels: the window, the launcher and the end card all sit in the middle.
const CLEAR = [[118, 40, 362, 236]] as const;
const SHOOTING = [at(2, 0), at(6, 2)];

const LAUNCHER = [
  { name: "Get started", icon: "rocket", tone: "green" },
  { name: "Foundations", icon: "palette", tone: "blue" },
  { name: "Components", icon: "puzzle", tone: "purple" },
  { name: "Templates", icon: "desktop", tone: "teal" },
  { name: "Palette maker", icon: "brush", tone: "pink" },
  { name: "Play", icon: "gamepad", tone: "orange" },
];
const FALL = [-30, -14, -4, 0, -2, 0];

/** The last of `events` at or before `frame`, by its first field. */
const last = <T extends readonly [number, ...unknown[]]>(events: readonly T[], frame: number) =>
  events.filter((e) => e[0] <= frame).at(-1) ?? events[0]!;
const held = (frame: number, from: number, frames = 3 * TICK) => frame >= from && frame < from + frames;

/** The window, then the launcher, in one scheme: drawn twice while the time of day dithers from one to the next. */
const Screen = ({ frame, scheme }: { readonly frame: number; readonly scheme: Scheme }) => {
  const row = ROWS.filter((r) => r <= frame).length - 1;
  const focus = (i: number) => (row === i ? "focus" : undefined);
  const time = last(TIMES, frame);
  const pick = last(PICKS, frame);
  const picked = frame >= PICKS[0]![0];

  return (
    <AbsoluteFill data-blip-scheme={scheme} style={{ background: "var(--blip-bg)" }}>
      <Sky scheme={scheme} avoid={CLEAR} />
      {scheme === "night" && <Life avoid={CLEAR} shooting={SHOOTING} />}

      <Beat at={WINDOW} until={SWAP}>
        <section className="blip-box blip-window blip-pop-in" style={{ position: "absolute", left: p(133), top: p(74), inlineSize: p(214) }}>
          <header className="blip-window-bar">
            <h2 className="blip-window-title blip-display blip-pop" data-pop="Options">Options</h2>
          </header>
          <div className="blip-window-body" style={{ display: "grid", gap: "var(--blip-space-8)", padding: "var(--blip-space-8)" }}>
            <div style={{ display: "grid", gap: "var(--blip-space-3)" }}>
              <span className="blip-label">Time of day</span>
              <div className="blip-box blip-segmented" data-size="sm" style={{ justifySelf: "start" }}>
                {["Auto", "Day", "Sunset", "Night"].map((label, i) => (
                  <button key={label} className="blip-box" type="button" aria-checked={time[1] === i} data-blip-state={time[1] === i ? focus(0) : undefined}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <label className="blip-check" data-layout="split">
              Chip sounds
              <span className="blip-box blip-switch">
                <input type="checkbox" role="switch" className="blip-box" checked={frame >= SOUNDS_ON} data-blip-state={focus(1)} readOnly />
              </span>
            </label>
            <button className="blip-box blip-button" type="button" data-variant="soft" data-width="full" data-blip-state={[focus(2), held(frame, START) && "active"].filter(Boolean).join(" ") || undefined}>
              Press start
            </button>
          </div>
        </section>
      </Beat>

      <Beat at={pick[0]} from={SWAP} until={END}>
        <nav style={{ position: "absolute", left: p(133), top: p(72), inlineSize: p(214), display: "grid", justifyItems: "center", gap: "var(--blip-space-4)" }}>
          <p className="blip-display blip-pop" data-scale="3" data-tone={LAUNCHER[pick[1]]!.tone} data-pop={LAUNCHER[pick[1]]!.name} style={{ margin: 0, whiteSpace: "nowrap", visibility: picked ? "visible" : "hidden" }}>
            {LAUNCHER[pick[1]]!.name}
          </p>
          <ul className="blip-tile-grid" role="list" style={{ "--blip-tile-cell": p(48), gridTemplateColumns: "repeat(3, var(--blip-tile-cell))", justifyContent: "center", gap: `${p(6)} 0` } as CSSProperties}>
            {LAUNCHER.map((t, i) => {
              const k = ticks(frame, LANDS[i]! - 3 * TICK);
              const chosen = picked && pick[1] === i;
              return (
                <li key={t.name} className="blip-tile-item" data-label="tooltip" style={{ visibility: k < 0 ? "hidden" : "visible", translate: `0 ${p(FALL[Math.max(0, Math.min(k, FALL.length - 1))]!)}` }}>
                  <span className="blip-box blip-tile" data-size="lg" data-tone={t.tone} data-selected={chosen ? "" : undefined} data-blip-state={chosen ? (held(frame, OPEN) ? "focus active" : "focus") : undefined}>
                    <Icon name={t.icon} />
                    <span className="blip-tile-glint" />
                  </span>
                  <span className="blip-tile-label" style={{ visibility: "hidden" }}>{t.name}</span>
                </li>
              );
            })}
          </ul>
        </nav>
      </Beat>
    </AbsoluteFill>
  );
};

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** The pixels of a 4 x 4 Bayer cell under `level` (of 16), as a mask a Blip pixel per cell pixel. */
const bayerMask = (level: number) => {
  const rects = BAYER.flatMap((b, i) => (b < level ? [`<rect x='${i % 4}' y='${i >> 2}' width='1' height='1'/>`] : [])).join("");
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 4' shape-rendering='crispEdges'>${rects}</svg>`)}") 0 0 / ${p(4)} ${p(4)} repeat`;
};

export const Components = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  // A change of time of day: the new palette comes in through the ordered dither, a quarter, a half, three quarters,
  // a Blip frame each, so no pixel ever shows colours half way between two.
  const i = TIMES.filter((e) => e[0] <= frame).length - 1;
  const now = TIMES[Math.max(0, i)]!;
  const before = TIMES[Math.max(0, i - 1)]!;
  const k = ticks(frame, now[0]);
  const fading = before[2] !== now[2] && k < 3;

  return (
    <Stage scheme="night">
      {frame < END ? (
        <>
          <Screen frame={frame} scheme={now[2]} />
          {fading && (
            <div style={{ position: "absolute", inset: 0, mask: bayerMask(16 - 4 * (k + 1)) }}>
              <Screen frame={frame} scheme={before[2]} />
            </div>
          )}
        </>
      ) : (
        <>
          <AbsoluteFill data-blip-scheme="night">
            <Sky scheme="night" avoid={CLEAR} />
            <Life avoid={CLEAR} shooting={SHOOTING} seed={9} />
          </AbsoluteFill>
          <div className="v-center" style={{ gap: p(8) }}>
            <DropTitle text="88" lands={[END + 2 * TICK, END + STEP + 2 * TICK]} scale={8} outline={2} />
            <span className="blip-display blip-pop" data-scale="3" data-pop="Components">Components</span>
            <Typed text="Native HTML first. Most are CSS alone." at={STRAP} every={1} style={{ fontSize: p(16), fontWeight: 700, marginBlockStart: p(4) }} />
          </div>
        </>
      )}

      <Sfx name="open" at={WINDOW} volume={0.6} />
      {ROWS.slice(1).map((r) => <Sfx key={r} name="step" at={r} volume={0.5} />)}
      {TIMES.slice(1).map(([f], n) => <Sfx key={f} name={n ? `blip@${[0, 3, 5, 7][n]}` : "blip"} at={f} volume={0.65} />)}
      <Sfx name="blip@7" at={SOUNDS_ON} volume={0.65} />
      <Sfx name="select" at={START} volume={0.7} />
      {LANDS.map((f, n) => <Sfx key={f} name={n ? `step@${[0, 2, 3, 5, 7, 8][n]}` : "step"} at={f} volume={0.55} />)}
      {PICKS.map(([f]) => <Sfx key={f} name="look" at={f} volume={0.55} />)}
      <Sfx name="select@7" at={OPEN} volume={0.7} />
      <Sfx name="success@5" at={END + 2 * TICK} volume={0.6} />
      <Sfx name="jump" at={END + STEP + 2 * TICK} volume={0.45} />

      <Dither at={0} mode="in" />
      {frame < END && <Dither at={END - 8 * TICK} mode="out" />}
      {frame >= END && <Dither at={END} mode="in" />}
      <Dither at={OUT} mode="out" />
      {music && <Music bar={COMPONENTS.bar} bars={COMPONENTS.bars} />}
    </Stage>
  );
};
