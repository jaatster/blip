import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Beat } from "../lib/Beat";
import { STEP, TICK, at, p, ticks } from "../lib/grid";
import { Icon } from "../lib/Icon";
import { Burst, Dither, Life, Sky, bayerMask } from "../lib/Pixels";
import { type Move, PRESS, Pointer, over, pressing } from "../lib/Pointer";
import { Music, Sfx } from "../lib/Sound";
import { Stage } from "../lib/Stage";
import { DropTitle, Typed, letterLands } from "../lib/Text";
import { Dissolve, MOSAIC_FRAMES, Mosaic } from "../lib/Transitions";

/** Bars 9-16 of the theme: the hook. */
export const COMPONENTS = { bar: 9, bars: 8 };

type Scheme = "day" | "sunset" | "night";

// Left, the docs home's Options window, worked by attract mode's pointer: it sets the time of day (Day and Sunset
// three beats each, back to Night), turns the chip sounds on (a tooltip names the switch while it is pointed at) and
// presses Press start, which goes busy and then says so in a toast. Then the window gives way to the home's launcher
// and the pointer opens Components. Right, a close-up of the control in use at twice the size, with the state it is
// in lit among its states: every state has one look, drawn by the box. Then the end card: 88, and a wall of more.
const TITLE = letterLands("Components", at(0, 0, 2), STEP);
const LINE = at(0, 3);
const WINDOW = at(0, 2);
const CLOSEUP = at(0, 3);
const MOVES: readonly Move[] = [
  { at: at(1, 0), to: '[data-v="seg-1"]', press: at(1, 1) },
  { at: at(1, 3), to: '[data-v="seg-2"]', press: at(2, 0) },
  { at: at(2, 2), to: '[data-v="seg-3"]', press: at(2, 3) },
  { at: at(3, 0), to: '[data-v="switch"]', press: at(3, 2) },
  { at: at(3, 3), to: '[data-v="start"]', press: at(4, 1) },
  { at: at(5, 1), to: '[data-v="tile-2"]', press: at(5, 3) },
];
const [, , , SWITCH, START, TILE] = MOVES as [Move, Move, Move, Move, Move, Move];
const TIMES: readonly (readonly [frame: number, value: number, scheme: Scheme])[] = [
  [0, 3, "night"],
  [MOVES[0]!.press!, 1, "day"],
  [MOVES[1]!.press!, 2, "sunset"],
  [MOVES[2]!.press!, 3, "night"],
];
const TOOLTIP = SWITCH.at + 6 * TICK + STEP;
const BUSY = START.press! + PRESS;
const TOAST = at(4, 3);
const LAUNCH = at(5);
const LANDS = [0, 1, 2, 3, 4, 5].map((i) => LAUNCH + i * TICK * 2);
const END = at(6);
const END_LINE = END + at(0, 2);

const CLEAR = [[10, 6, 470, 262]] as const;

/** The close-up's phases: what it shows from when, and that thing's states. */
const PHASES = [
  { from: CLOSEUP, name: "Segmented", states: ["Rest", "Hover", "Pressed", "Selected"] },
  { from: SWITCH.at, name: "Switch", states: ["Rest", "Hover", "Pressed", "On"] },
  { from: START.at, name: "Button", states: ["Rest", "Hover", "Pressed", "Busy"] },
  { from: LAUNCH, name: "Tile", states: ["Rest", "Selected", "Focus", "Pressed"] },
] as const;

const LAUNCHER = [
  { name: "Get started", icon: "rocket", tone: "green" },
  { name: "Foundations", icon: "palette", tone: "blue" },
  { name: "Components", icon: "puzzle", tone: "purple" },
  { name: "Templates", icon: "desktop", tone: "teal" },
  { name: "Palette maker", icon: "brush", tone: "pink" },
  { name: "Play", icon: "gamepad", tone: "orange" },
];
const FALL = [-30, -14, -4, 0, -2, 0];
const fall = (frame: number, land: number) => p(FALL[Math.max(0, Math.min(ticks(frame, land - 3 * TICK), FALL.length - 1))]!);

/** The state a pointed-at control is in: pressed while pressed, then `after` once pressed, hovered while pointed at. */
function stateOf(frame: number, move: Move, after: string) {
  if (pressing(frame, move.press)) return "Pressed";
  if (move.press !== undefined && frame >= move.press + PRESS) return after;
  return over(MOVES, move.to, frame) ? "Hover" : "Rest";
}
/** That state as the box's forced-state attribute. */
const forced = (state: string) => (state === "Hover" ? "hover" : state === "Pressed" ? "active" : undefined);

const Segmented = ({ frame, v }: { readonly frame: number; readonly v?: boolean }) => {
  const time = TIMES.filter((t) => t[0] <= frame).at(-1)!;
  return (
    <div className="blip-box blip-segmented" data-size="sm">
      {["Auto", "Day", "Sunset", "Night"].map((label, i) => {
        const move = MOVES.find((m) => m.to === `[data-v="seg-${i}"]`);
        const state = move && frame < (move.press ?? 0) + PRESS ? forced(stateOf(frame, move, "")) : undefined;
        return (
          <button key={label} className="blip-box" type="button" aria-checked={time[1] === i} data-blip-state={state} data-v={v ? `seg-${i}` : undefined}>
            {label}
          </button>
        );
      })}
    </div>
  );
};

/** The left half, in one scheme: drawn twice while the time of day dithers from one to the next. */
const Screen = ({ frame, scheme, v }: { readonly frame: number; readonly scheme: Scheme; readonly v: boolean }) => {
  const sw = stateOf(frame, SWITCH, "On");
  const start = stateOf(frame, START, "Busy");
  const busy = frame >= BUSY && frame < TOAST;
  const tile = TILE.press !== undefined && frame >= TILE.press ? 2 : -1;

  return (
    <AbsoluteFill data-blip-scheme={scheme} style={{ background: "var(--blip-bg)" }}>
      <Sky scheme={scheme} avoid={CLEAR} />
      {scheme === "night" && <Life avoid={CLEAR} shooting={[at(6, 2)]} seed={9} />}

      {frame < END && (
        <>
          <div style={{ position: "absolute", left: p(16), top: p(12) }}>
            <DropTitle text="Components" lands={TITLE} scale={3} outline={1} />
          </div>
          <div style={{ position: "absolute", left: p(16), top: p(44), blockSize: p(14) }}>
            <Typed text="Real HTML, each one the same candy box." at={LINE} every={1.5} className="blip-outline" style={{ fontSize: p(10), fontWeight: 700 }} />
          </div>

          <Mosaic at={frame < LAUNCH ? LAUNCH - MOSAIC_FRAMES : LAUNCH} mode={frame < LAUNCH ? "out" : "in"}>
            {frame < LAUNCH ? (
              <Beat at={WINDOW}>
                <section className="blip-box blip-window blip-pop-in" style={{ position: "absolute", left: p(16), top: p(66), inlineSize: p(220) }}>
                  <header className="blip-window-bar">
                    <h2 className="blip-window-title blip-display blip-pop" data-pop="Options">Options</h2>
                  </header>
                  <div className="blip-window-body" style={{ display: "grid", gap: "var(--blip-space-8)", padding: "var(--blip-space-8)" }}>
                    <div style={{ display: "grid", gap: "var(--blip-space-3)" }}>
                      <span className="blip-label">Time of day</span>
                      <div style={{ justifySelf: "start" }}><Segmented frame={frame} v={v} /></div>
                    </div>
                    <label className="blip-check" data-layout="split" style={{ position: "relative" }}>
                      Chip sounds
                      <span className="blip-box blip-switch" data-blip-state={forced(sw)} data-v={v ? "switch" : undefined}>
                        <input type="checkbox" role="switch" className="blip-box" checked={sw === "On"} readOnly />
                      </span>
                      {frame >= TOOLTIP && frame < SWITCH.press! && (
                        <Beat at={TOOLTIP}>
                          <span className="blip-box blip-tooltip" role="tooltip" data-side="top" data-blip-static="" style={{ position: "absolute", right: p(-6), bottom: p(18), whiteSpace: "nowrap", animation: "blip-popover-in calc(2 * var(--blip-duration-frame)) steps(1, jump-end) both" }}>
                            Blip&rsquo;s chip sounds
                            <span className="blip-tooltip-nub" aria-hidden="true" />
                          </span>
                        </Beat>
                      )}
                    </label>
                    <Beat at={BUSY}>
                      <button className="blip-box blip-button" type="button" data-width="full" aria-busy={busy ? "true" : undefined} data-blip-state={forced(start)} data-v={v ? "start" : undefined}>
                        Save
                      </button>
                    </Beat>
                  </div>
                </section>
              </Beat>
            ) : (
              <nav style={{ position: "absolute", left: p(16), top: p(66), inlineSize: p(220), display: "grid", justifyItems: "center", gap: "var(--blip-space-4)" }}>
                <Beat at={TILE.press ?? LAUNCH} from={LAUNCH}>
                  <ul className="blip-tile-grid" role="list" style={{ "--blip-tile-cell": p(56), gridTemplateColumns: "repeat(3, var(--blip-tile-cell))", justifyContent: "center", gap: `${p(10)} 0` } as CSSProperties}>
                    {LAUNCHER.map((t, i) => (
                      <li key={t.name} className="blip-tile-item" style={{ translate: `0 ${fall(frame, LANDS[i]!)}`, visibility: frame >= LANDS[i]! - 3 * TICK ? "visible" : "hidden" }}>
                        <span className="blip-box blip-tile" data-size="lg" data-tone={t.tone} data-selected={i === tile ? "" : undefined}
                          data-blip-state={i === 2 ? (pressing(frame, TILE.press) ? "focus active" : over(MOVES, TILE.to, frame) && tile < 0 ? "hover" : i === tile ? "focus" : undefined) : undefined}
                          data-v={v && i === 2 ? "tile-2" : undefined}>
                          <Icon name={t.icon} />
                          <span className="blip-tile-glint" />
                        </span>
                        <span className="blip-tile-label blip-outline">{t.name}</span>
                      </li>
                    ))}
                  </ul>
                </Beat>
              </nav>
            )}
          </Mosaic>

          {frame >= TOAST && frame < TOAST + at(1, 2) && (
            <Beat at={TOAST}>
              <div className="blip-box blip-toast" data-tone="success" style={{ position: "absolute", left: p(16), bottom: p(12), inlineSize: p(220) }}>
                <span className="blip-toast-icon" aria-hidden="true" />
                <div className="blip-toast-body">
                  <p className="blip-toast-title">Saved</p>
                  <p>Your options are kept for next time.</p>
                </div>
                <span className="blip-toast-timer" aria-hidden="true" />
              </div>
            </Beat>
          )}
        </>
      )}
    </AbsoluteFill>
  );
};

/** The right half: the control in use, twice the size, and which of its states it is in. */
const CloseUp = ({ frame }: { readonly frame: number }) => {
  const i = PHASES.filter((ph) => ph.from <= frame).length - 1;
  if (i < 0) return null;
  const phase = PHASES[i]!;
  const next = PHASES[i + 1]?.from ?? END;
  let state = "Rest";
  let body: ReactNode = null;
  if (phase.name === "Segmented") {
    const m = MOVES.filter((mv) => mv.to.includes("seg") && mv.at <= frame).at(-1);
    state = m ? stateOf(frame, m, "Selected") : "Rest";
    body = <Segmented frame={frame} />;
  } else if (phase.name === "Switch") {
    state = stateOf(frame, SWITCH, "On");
    body = (
      <span className="blip-box blip-switch" data-blip-state={forced(state)}>
        <input type="checkbox" role="switch" className="blip-box" checked={state === "On"} readOnly />
      </span>
    );
  } else if (phase.name === "Button") {
    state = stateOf(frame, START, "Busy");
    if (frame >= TOAST) state = "Rest";
    body = (
      <Beat at={BUSY}>
        <span className="blip-box blip-button" aria-busy={state === "Busy" ? "true" : undefined} data-blip-state={forced(state)}>Save</span>
      </Beat>
    );
  } else {
    const chosen = TILE.press !== undefined && frame >= TILE.press;
    state = pressing(frame, TILE.press) ? "Pressed" : chosen ? "Focus" : over(MOVES, TILE.to, frame) ? "Selected" : "Rest";
    body = (
      <Beat at={TILE.press ?? LAUNCH}>
        <ul className="blip-tile-grid" role="list" style={{ "--blip-tile-cell": p(40) } as CSSProperties}>
          <li className="blip-tile-item">
            <span className="blip-box blip-tile" data-tone="purple" data-selected={state !== "Rest" ? "" : undefined} data-blip-state={state === "Focus" ? "focus" : state === "Pressed" ? "focus active" : undefined}>
              <Icon name="puzzle" />
              <span className="blip-tile-glint" />
            </span>
          </li>
        </ul>
      </Beat>
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Mosaic at={i ? phase.from : -MOSAIC_FRAMES} mode="in">
        <Mosaic at={next - MOSAIC_FRAMES} mode="out">
          <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateRows: "auto 1fr auto", padding: p(10), gap: p(6) }}>
            <div style={{ display: "grid", gap: p(3) }}>
              <span className="blip-label" style={{ color: "var(--blip-text-muted)" }}>Close-up</span>
              <span className="blip-display blip-pop" data-scale="2" data-pop={phase.name}>{phase.name}</span>
            </div>
            <div style={{ display: "grid", placeItems: "center" }}>
              <div style={{ transform: "scale(2)" }}>{body}</div>
            </div>
            <div className="blip-cluster" data-gap="3">
              {phase.states.map((s) => (
                <span key={s} className="blip-box blip-tag" data-variant={s === state ? "candy" : "outline"} data-tone={s === state ? "accent" : "neutral"}>{s}</span>
              ))}
            </div>
          </div>
        </Mosaic>
      </Mosaic>
    </div>
  );
};

/** The end card's wall: more of the 88, each the real thing, dropping in. */
const WALL: readonly ReactNode[] = [
  <span className="blip-box blip-button" data-size="sm"><Icon name="play" />Play</span>,
  <span className="blip-box blip-tag" data-tone="success">New</span>,
  <label className="blip-check"><span className="blip-box blip-checkbox"><input type="checkbox" checked readOnly /></span>Done</label>,
  <span className="blip-box blip-switch"><input type="checkbox" role="switch" className="blip-box" checked readOnly /></span>,
  <span className="blip-box blip-avatar" data-tone="green">P<span className="blip-box blip-avatar-status" data-tone="success" /></span>,
  <kbd className="blip-box blip-keycap">Esc</kbd>,
  <span className="blip-rating" role="img" aria-label="3 stars" style={{ "--blip-rating-value": 3 } as CSSProperties} />,
  <span className="blip-loader" role="status">Loading</span>,
  <div className="blip-box blip-progress" style={{ inlineSize: p(70) }}><progress max={100} value={70}>70%</progress></div>,
  <span className="blip-box blip-button" data-size="sm" data-variant="soft" data-icon-only aria-label="Alerts"><Icon name="bell" /><span className="blip-box blip-badge" data-tone="danger" data-position="top-end">3</span></span>,
  <label className="blip-check"><span className="blip-box blip-radio"><input type="radio" checked readOnly /></span>Hard</label>,
  <span className="blip-box blip-tag" data-variant="outline" aria-pressed="true">Swords</span>,
];

const EndCard = ({ frame }: { readonly frame: number }) => (
  <>
    <div style={{ position: "absolute", left: p(20), top: p(58), inlineSize: p(200), display: "grid", justifyItems: "center", gap: p(8) }}>
      <DropTitle text="88" lands={[END + MOSAIC_FRAMES, END + MOSAIC_FRAMES + STEP]} scale={8} outline={2} />
      <span className="blip-display blip-pop" data-scale="3" data-pop="Components">Components</span>
      <div style={{ blockSize: p(14) }}>
        <Typed text="Native HTML first. Most are CSS alone." at={END_LINE} every={1} className="blip-outline" style={{ fontSize: p(10), fontWeight: 700 }} />
      </div>
    </div>
    <article className="blip-box blip-card" data-size="sm" style={{ position: "absolute", left: p(244), top: p(34), inlineSize: p(222), blockSize: p(200) }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridAutoRows: p(42), placeItems: "center", blockSize: "100%" }}>
        {WALL.map((w, i) => {
          const land = END + at(0, 1) + i * STEP;
          return (
            <Beat key={i} at={land}>
              <div style={{ translate: `0 ${fall(frame, land)}`, visibility: frame >= land - 3 * TICK ? "visible" : "hidden" }}>{w}</div>
            </Beat>
          );
        })}
      </div>
    </article>
    <Burst at={END + MOSAIC_FRAMES + STEP + TICK} kind="confetti" box={[40, 40, 160, 20]} count={28} seed={8} />
  </>
);

export const Components = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  // A change of time of day: the new palette comes in through the ordered dither, a quarter, a half, three quarters.
  const i = TIMES.filter((e) => e[0] <= frame).length - 1;
  const now = TIMES[Math.max(0, i)]!;
  const before = TIMES[Math.max(0, i - 1)]!;
  const k = ticks(frame, now[0]);
  const fading = before[2] !== now[2] && k < 3;

  return (
    <Stage scheme="night">
      <Mosaic at={frame < END ? END - MOSAIC_FRAMES : END} mode={frame < END ? "out" : "in"}>
        <Screen frame={frame} scheme={now[2]} v />
        {fading && (
          <div style={{ position: "absolute", inset: 0, mask: bayerMask(16 - 4 * (k + 1)) }}>
            <Screen frame={frame} scheme={before[2]} v={false} />
          </div>
        )}
        {frame < END ? (
          <Beat at={CLOSEUP}>
            <article className="blip-box blip-card blip-pop-in" data-size="sm" data-blip-scheme={now[2]} style={{ position: "absolute", left: p(252), top: p(40), inlineSize: p(212), blockSize: p(196), padding: 0 }}>
              <div style={{ position: "relative", inlineSize: "100%", blockSize: "100%" }}>
                <CloseUp frame={frame} />
              </div>
            </article>
          </Beat>
        ) : (
          <EndCard frame={frame} />
        )}
        {frame < END && <Pointer moves={MOVES} />}
      </Mosaic>

      {[...new Set(TITLE)].map((f, n) => <Sfx key={f} name={n ? `step@${[0, 2, 3, 5, 7, 8, 10, 12, 12, 12][n]}` : "step"} at={f} volume={0.4} />)}
      <Sfx name="open" at={WINDOW} volume={0.55} />
      {MOVES.map((m) => <Sfx key={m.at} name="look" at={m.at} volume={0.35} />)}
      {TIMES.slice(1).map(([f], n) => <Sfx key={f} name={n ? `blip@${[0, 3, 5][n]}` : "blip"} at={f} volume={0.6} />)}
      <Sfx name="blip@7" at={SWITCH.press!} volume={0.6} />
      <Sfx name="select" at={START.press!} volume={0.65} />
      <Sfx name="success" at={TOAST} volume={0.55} />
      {LANDS.map((f, n) => <Sfx key={f} name={n ? `step@${[0, 2, 3, 5, 7, 8][n]}` : "step"} at={f} volume={0.45} />)}
      <Sfx name="select@7" at={TILE.press!} volume={0.65} />
      <Sfx name="success@5" at={END + MOSAIC_FRAMES} volume={0.6} />
      <Sfx name="jump" at={END + MOSAIC_FRAMES + STEP} volume={0.45} />
      {WALL.map((_, n) => <Sfx key={`w${n}`} name={`step@${[2, 3, 5, 7, 8, 10, 12, 10, 8, 7, 5, 3][n]}`} at={END + at(0, 1) + n * STEP} volume={0.25} />)}

      {music && <Music bar={COMPONENTS.bar} bars={COMPONENTS.bars} />}
      <Dissolve at={0} mode="in" seed={4} />
      <Dither at={at(8) - 8 * TICK} mode="out" />
    </Stage>
  );
};

