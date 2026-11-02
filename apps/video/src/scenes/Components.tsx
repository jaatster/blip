import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Beat } from "../lib/Beat";
import { STEP, TICK, at, p, ticks } from "../lib/grid";
import { Icon } from "../lib/Icon";
import { Burst, Dither, Scrim, World } from "../lib/Pixels";
import { Music, Sfx } from "../lib/Sound";
import { Stage } from "../lib/Stage";
import { DropTitle, Typed } from "../lib/Text";

/** Bars 9-16 of the theme: the hook. */
export const COMPONENTS = { bar: 9, bars: 8 };

type Scheme = "day" | "sunset" | "night";

// The docs home's Options window, worked from the keyboard: the focus ring steps down a row a beat and each control
// does its one thing on the eighth after. Time of day really changes it, Day, Sunset, Night and back to Auto, a beat
// each through bar 1. Press start drops in the home's launcher; the focus walks it on the eighths of bar 4, Enter opens
// Components on bar 5, the counter rolls to 88 and the achievement slides in. The stamp is bar 6.
const WINDOW = at(0, 1);
const ROWS = [at(0, 3), at(2, 0), at(2, 2), at(2, 3), at(3, 0)];
const TIMES: readonly (readonly [frame: number, value: number, scheme: Scheme])[] = [
  [0, 0, "day"],
  [at(1, 0), 1, "day"],
  [at(1, 1), 2, "sunset"],
  [at(1, 2), 3, "night"],
  [at(1, 3), 0, "day"],
];
const VOLUME = [at(2, 0, 2), at(2, 1), at(2, 1, 2)];
const SOUNDS_ON = at(2, 2, 2);
const PAUSED = at(2, 3, 2);
const START = at(3, 0, 2);
const LANDS = [0, 1, 2, 3, 4, 5].map((i) => at(3, 1, 2 * i));
const PICKS: readonly (readonly [frame: number, tile: number])[] = [
  [at(4, 0), 0],
  ...[1, 2, 3, 4, 5].map((t, i) => [at(4, 0, 2 * i + 2), t] as const),
  [at(4, 3), 2],
];
const OPEN = at(5);
const ROLL = at(5);
const TROPHY = at(5, 2);
const STAMP = at(6);
const STRAP = at(6, 1);
const OUT = at(8) - 8 * TICK;

// Each component counts the first time it is on screen.
const FIRSTS = [WINDOW, ROWS[0]!, ROWS[0]!, ROWS[1]!, ROWS[2]!, ROWS[3]!, ROWS[4]!, LANDS[0]!, LANDS[5]!];

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

const Key = ({ pressed, children }: { readonly pressed: boolean; readonly children: ReactNode }) => (
  <kbd className="blip-box blip-keycap" data-size="sm" data-blip-pressed={pressed ? "" : undefined}>
    {children}
  </kbd>
);

/** Everything on screen, in one scheme: drawn twice while the time of day dithers from one to the next. */
const Screen = ({ frame, scheme }: { readonly frame: number; readonly scheme: Scheme }) => {
  const row = ROWS.filter((r) => r <= frame).length - 1;
  const inLauncher = frame >= START + 2 * STEP;
  const focus = (i: number) => (!inLauncher && row === i ? "focus" : undefined);
  const time = last(TIMES, frame);
  const volume = 4 + 2 * VOLUME.filter((v) => v <= frame).length;
  const pick = last(PICKS, frame);
  const picked = frame >= PICKS[0]![0];
  const count = Math.min(9, FIRSTS.filter((f) => f <= frame).length);
  const rolled = frame < ROLL ? count : Math.min(88, count + Math.round(((88 - count) * Math.max(0, ticks(frame, ROLL) + 1)) / 20));
  const moved = [...ROWS.slice(1), ...PICKS.slice(1).map((e) => e[0])];
  const changed = [...TIMES.slice(1).map((e) => e[0]), ...VOLUME];

  return (
    <AbsoluteFill data-blip-scheme={scheme} style={{ background: "var(--blip-bg)" }}>
      <World scheme={scheme} />

      <div style={{ position: "absolute", left: p(16), top: p(10), display: "flex", alignItems: "baseline", gap: p(8) }}>
        <span className="blip-display blip-pop" data-scale="2" data-pop="Components">Components</span>
        <span className="blip-display blip-pop" data-scale="3" data-pop={`${rolled}/88`}>{`${rolled}/88`}</span>
      </div>

      <Beat at={WINDOW}>
        <section className="blip-box blip-window blip-pop-in" style={{ position: "absolute", left: p(24), top: p(48), inlineSize: p(214) }}>
          <header className="blip-window-bar">
            <h2 className="blip-window-title blip-display blip-pop" data-pop="Options">Options</h2>
          </header>
          <div className="blip-window-body" style={{ display: "grid", gap: "var(--blip-space-6)", padding: "var(--blip-space-6) var(--blip-space-8)" }}>
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
            <div style={{ display: "grid", gap: "var(--blip-space-3)" }}>
              <span className="blip-label">Music</span>
              <div className="blip-slider-group">
                <input className="blip-slider" type="range" min={0} max={10} value={volume} onChange={() => {}} data-blip-state={focus(1)} style={{ "--blip-slider-value": volume / 10 } as CSSProperties} />
                <output className="blip-box blip-slider-value" data-variant="panel">{volume}</output>
              </div>
            </div>
            <label className="blip-check" data-layout="split">
              Chip sounds
              <span className="blip-box blip-switch">
                <input type="checkbox" role="switch" className="blip-box" checked={frame >= SOUNDS_ON} data-blip-state={focus(2)} readOnly />
              </span>
            </label>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--blip-space-4)" }}>
              <span>Clouds and stars</span>
              <button className="blip-box blip-button" type="button" data-variant="soft" data-size="sm" aria-pressed={frame >= PAUSED} data-blip-state={[focus(3), held(frame, PAUSED) && "active"].filter(Boolean).join(" ") || undefined}>
                <Icon name={frame >= PAUSED ? "play" : "pause"} />
                {frame >= PAUSED ? "Play motion" : "Pause motion"}
              </button>
            </div>
            <button className="blip-box blip-button" type="button" data-variant="soft" data-width="full" data-blip-state={[focus(4), held(frame, START) && "active"].filter(Boolean).join(" ") || undefined}>
              Press start
            </button>
          </div>
          <footer className="blip-window-status">
            <span style={{ display: "flex", alignItems: "center", gap: p(2) }}>
              <kbd className="blip-keys">
                <Key pressed={moved.some((m) => held(frame, m))}><Icon name="arrow-down" /></Key>
                <Key pressed={changed.some((c) => held(frame, c))}><Icon name="arrow-right" /></Key>
              </kbd>
              Move
              <Key pressed={[SOUNDS_ON, PAUSED, START, OPEN].some((e) => held(frame, e))}>Enter</Key>
              Select
            </span>
            <span>{["Auto", "Day", "Sunset", "Night"][time[1]]}</span>
          </footer>
        </section>
      </Beat>

      <nav style={{ position: "absolute", left: p(250), top: p(66), inlineSize: p(214), display: "grid", justifyItems: "center", gap: "var(--blip-space-2)" }}>
        <p className="blip-display blip-pop" data-scale="2" data-tone={LAUNCHER[pick[1]]!.tone} data-pop={LAUNCHER[pick[1]]!.name} style={{ margin: 0, whiteSpace: "nowrap", visibility: picked ? "visible" : "hidden" }}>
          {LAUNCHER[pick[1]]!.name}
        </p>
        <Beat at={pick[0]} from={LANDS[0]! - 3 * TICK}>
          <ul className="blip-tile-grid" role="list" style={{ "--blip-tile-cell": p(40), gridTemplateColumns: "repeat(3, var(--blip-tile-cell))", justifyContent: "center", gap: `${p(4)} 0` } as CSSProperties}>
            {LAUNCHER.map((t, i) => {
              const k = ticks(frame, LANDS[i]! - 3 * TICK);
              const chosen = picked && pick[1] === i;
              return (
                <li key={t.name} className="blip-tile-item" data-label="tooltip" style={{ visibility: k < 0 ? "hidden" : "visible", translate: `0 ${p(FALL[Math.max(0, Math.min(k, FALL.length - 1))]!)}` }}>
                  <span className="blip-box blip-tile" data-tone={t.tone} data-selected={chosen ? "" : undefined} data-blip-state={chosen ? (held(frame, OPEN) ? "focus active" : "focus") : undefined}>
                    <Icon name={t.icon} />
                    <span className="blip-tile-glint" />
                  </span>
                  <span className="blip-tile-label blip-outline" style={{ color: "var(--blip-white)" }}>{t.name}</span>
                </li>
              );
            })}
          </ul>
        </Beat>
      </nav>

      <Beat at={TROPHY} until={STAMP}>
        <div className="blip-achievements" role="status" style={{ position: "absolute", left: p(268), top: p(212), inlineSize: p(196) }}>
          <div className="blip-box blip-achievement">
            <span className="blip-box blip-achievement-icon"><Icon name="trophy" /><span className="blip-achievement-sparkles" /></span>
            <p className="blip-achievement-label">Achievement unlocked</p>
            <p className="blip-achievement-title">88 components</p>
            <p className="blip-achievement-text">Every one the same candy box.</p>
          </div>
        </div>
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
    <Stage scheme="day">
      <Screen frame={frame} scheme={now[2]} />
      {fading && (
        <div style={{ position: "absolute", inset: 0, mask: bayerMask(16 - 4 * (k + 1)) }}>
          <Screen frame={frame} scheme={before[2]} />
        </div>
      )}

      <Sfx name="open" at={WINDOW} volume={0.6} />
      {ROWS.slice(1).map((r) => <Sfx key={r} name="step" at={r} volume={0.5} />)}
      {TIMES.slice(1).map(([f], n) => <Sfx key={f} name={n ? `blip@${[0, 3, 5, 7][n]}` : "blip"} at={f} volume={0.65} />)}
      {VOLUME.map((f, n) => <Sfx key={f} name={`step@${[3, 5, 7][n]}`} at={f} volume={0.6} />)}
      <Sfx name="blip@7" at={SOUNDS_ON} volume={0.65} />
      <Sfx name="select@5" at={PAUSED} volume={0.65} />
      <Sfx name="select" at={START} volume={0.7} />
      {LANDS.map((f, n) => <Sfx key={f} name={n ? `step@${[0, 2, 3, 5, 7, 8][n]}` : "step"} at={f} volume={0.55} />)}
      {PICKS.map(([f]) => <Sfx key={f} name="look" at={f} volume={0.55} />)}
      <Sfx name="select@7" at={OPEN} volume={0.7} />

      {Array.from({ length: 8 }, (_, n) => (
        <Sfx key={n} name={n ? `coin@${[0, 2, 4, 5, 7, 9, 11, 12][n]}` : "coin"} at={ROLL + n * STEP} volume={0.35} />
      ))}
      <Burst at={ROLL} kind="coin" box={[150, 10, 60, 24]} count={8} seed={3} />
      <Sfx name="success" at={TROPHY} volume={0.55} />

      <Beat at={STAMP} from={STAMP}>
        <Scrim level={12} />
        <div className="v-center" style={{ gap: p(6) }}>
          <DropTitle text="88" lands={[STAMP, STAMP + STEP]} scale={10} outline={2} />
          <span className="blip-display blip-pop" data-scale="3" data-pop="Components">Components</span>
          <Typed text="Native HTML first. Most are CSS alone." at={STRAP} every={2} className="blip-outline" style={{ fontSize: p(11), fontWeight: 700, marginBlockStart: p(6) }} />
        </div>
        <Burst at={STAMP + TICK} kind="star" box={[170, 54, 130, 75]} count={12} seed={11} scale={2} />
        <Sfx name="success@5" at={STAMP} volume={0.6} />
        <Sfx name="jump" at={STAMP + STEP} volume={0.45} />
      </Beat>

      <Dither at={0} mode="in" />
      <Dither at={OUT} mode="out" />
      {music && <Music bar={COMPONENTS.bar} bars={COMPONENTS.bars} />}
    </Stage>
  );
};

