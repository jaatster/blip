import { createElement, type CSSProperties, type ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Beat } from "../lib/Beat";
import { TICK, at, p, ticks } from "../lib/grid";
import { Icon } from "../lib/Icon";
import { Burst, Dither, Life, Sky } from "../lib/Pixels";
import { pressing } from "../lib/Pointer";
import { Music, Sfx } from "../lib/Sound";
import { SHOW_CLEAR, SplitText, type Part } from "../lib/Split";
import { Stage } from "../lib/Stage";

/** Bars 31-34 of the theme. */
export const MOBILE = { bar: 29, bars: 4 };

// Ready for mobile. Above, the piece in use, by name; under it, a phone made of Blip's phone pieces, working on the beat by
// itself. The phone drops in on its skeletons and loads; the list is pulled down past the line, the
// arrow flips, the loader runs and the new leader is in, with a sparkle. A row is dragged aside to its Delete and
// springs back. The action button raises a bottom sheet over the dithered scrim; Create, pressed with the field empty,
// shakes the field and says why; then the sheet goes back down.
const PARTS: readonly Part[] = [
  { at: at(0, 1), title: "Pull to refresh", line: "Pull past the line, let go, and the list refreshes." },
  { at: at(1, 1), title: "Swipe rows", line: "Drag a row aside to reveal its actions." },
  { at: at(2, 0), title: "Bottom sheet", line: "The action button raises a sheet." },
  { at: at(2, 3), title: "Fields", line: "A wrong answer shakes, and says why." },
];
const PHONE = at(0, 0, 2);
const LOADED = at(0, 2);
// The pull: down 32 pixels in eight steps, past the line at 24; let go, the loader at 24, then
// "Updated" and everything steps back up.
const DRAG = at(0, 3);
const LET_GO = at(1);
const DONE = at(1, 0, 2);
const SETTLED = at(1, 1);
const SWIPE = at(1, 2);
const UNSWIPE = at(1, 3, 2);
const FAB = at(2, 1);
const SHEET = at(2, 1, 2);
const SEND = at(3);
const CLOSE = at(3, 2, 2);
const OUT = at(4) - 8 * TICK;


// Two rows, so the action button has the space under them to itself.
const BEFORE = [["Pip", "98,120"], ["Juno", "87,400"]];
const AFTER = [["Juno", "99,050"], ...BEFORE.filter(([n]) => n !== "Juno")];

/** Six even steps, a Blip frame each, from 0 to 1 starting at `from`. */
const six = (frame: number, from: number) => Math.min(6, Math.max(0, ticks(frame, from) + 1)) / 6;

// The phone is the part, standing on the sky: upright, centred in the hero (its middle at row 156), rows 77-235.
const PHONE_W = 96, PHONE_H = 158;
const PHONE_X = 240 - PHONE_W / 2, PHONE_Y = 77;
const DROP = [-40, -22, -8, 0, -3, 0];

/** How far the list is pulled down at `frame`, in pixels. */
function pulled(frame: number) {
  if (frame < DRAG) return 0;
  if (frame < LET_GO) return Math.min(32, 4 * (ticks(frame, DRAG) + 1));
  if (frame < DONE) return 24;
  if (frame < SETTLED - 6 * TICK) return 24;
  return Math.max(0, 24 - 4 * (ticks(frame, SETTLED - 6 * TICK) + 1));
}
/** The swiped row's face: 40 pixels aside in six steps, held, back in six, and a little spring past home. */
function swiped(frame: number) {
  if (frame < UNSWIPE) return Math.round(40 * six(frame, SWIPE));
  const k = ticks(frame, UNSWIPE);
  if (k < 6) return Math.round(40 * (1 - (k + 1) / 6));
  return [-3, -1, 0][Math.min(k - 6, 2)]!;
}

// <blip-swipe-row> and its CSS look for :defined; the video draws its slide itself, so a bare element is enough.
if (typeof customElements !== "undefined" && !customElements.get("blip-swipe-row")) customElements.define("blip-swipe-row", class extends HTMLElement {});

const SwipeRow = ({ x, children, className }: { readonly x: number; readonly children: ReactNode; readonly className: string }) =>
  createElement(
    "blip-swipe-row",
    {
      className: `blip-swipe-row ${className}`,
      "data-blip-moved": x > 0 ? "end" : undefined,
      style: { "--_blip-swipe-x": `calc(${-x} * var(--blip-pixel))`, "--blip-swipe-row-face": "var(--blip-surface)" } as CSSProperties,
    },
    children,
  );

const Row = ({ name, score }: { readonly name: string; readonly score: string }) => (
  <div className="blip-list-item">
    <div className="blip-list-content"><span className="blip-list-title">{name}</span></div>
    <div className="blip-list-end">{score}</div>
  </div>
);

export const Mobile = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  const loaded = frame >= LOADED;
  const pull = pulled(frame);
  const state = frame < DRAG || frame >= SETTLED ? undefined : frame < LET_GO ? (pull >= 24 ? "ready" : "pulling") : frame < DONE ? "refreshing" : "done";
  const rows = frame >= DONE ? AFTER : BEFORE;
  const swipe = swiped(frame);
  // The sheet: up a sixth of its height a Blip frame, held, down the same way; the scrim a quarter dither, then half.
  const SHEET_H = 116;
  const up = frame < CLOSE ? six(frame, SHEET) : 1 - six(frame, CLOSE);
  const sheetOn = frame >= SHEET && up > 0;
  const kin = ticks(frame, SHEET), kout = ticks(frame, CLOSE);
  const scrim = kout >= 0 ? (kout < 3 ? "half" : "quarter") : kin < 1 ? "quarter" : "half";
  const sent = frame >= SEND;
  const drop = DROP[Math.max(0, Math.min(ticks(frame, PHONE - 3 * TICK), DROP.length - 1))]!;

  return (
    <Stage scheme="night" mosaicIn>
      <AbsoluteFill>
        <Sky scheme="night" avoid={SHOW_CLEAR} />
        <Life avoid={SHOW_CLEAR} seed={57} shooting={[at(2, 1)]} />
      </AbsoluteFill>

      <SplitText eyebrow="Ready for mobile" parts={PARTS} />

      {/* Right: the phone, a Liquorice candy box (a thing whose own colour is black) round a screen. It drops in. */}
      <Beat at={PHONE} from={PHONE - 3 * TICK}>
        <div
          className="blip-box"
          data-tone="slate"
          style={{ "--blip-r": 6, "--blip-shape": "var(--blip-shape-6)", "--blip-shape-inner": "var(--blip-shape-6-inner)", position: "absolute", left: p(PHONE_X), top: p(PHONE_Y + drop), inlineSize: p(PHONE_W), blockSize: p(PHONE_H), padding: p(5) } as CSSProperties}
        >
          <div
            style={{
              position: "relative", inlineSize: "100%", blockSize: "100%", overflow: "hidden", display: "flex", flexDirection: "column", background: "var(--blip-bg)",
            } as CSSProperties}
          >
            <header className="blip-box blip-top-bar" style={{ position: "relative" }}>
              <span className="blip-box blip-button blip-top-bar-back" data-variant="ghost" data-icon-only>
                <span className="blip-icon blip-top-bar-chevron" aria-hidden="true" />
              </span>
              <h1 className="blip-top-bar-title">Scores</h1>
            </header>

            <div className="blip-refresh" data-blip-state={state} style={{ flex: 1, minBlockSize: 0, "--_blip-pull": p(pull) } as CSSProperties}>
              <div className="blip-refresh-indicator" aria-hidden="true">
                <span className="blip-refresh-arrow" />
                <Beat at={LET_GO}>
                  <span className="blip-loader" data-size="sm"><span className="blip-sr-only">Refreshing</span></span>
                </Beat>
                <span className="blip-refresh-label">{state === "ready" ? "Let go" : state === "refreshing" ? "Updating" : state === "done" ? "Updated" : "Pull"}</span>
              </div>
              <div className="blip-refresh-scroller">
                <Beat at={PHONE}>
                  <ul className="blip-list" role="list" data-dividers style={{ margin: 0, "--blip-size-small": "var(--blip-size-lead)", fontSize: "var(--blip-size-lead)" } as CSSProperties}>
                    {rows.map(([name, score], i) => (
                      <li key={name} className={`m-row-${i}`}>
                        {!loaded ? (
                          <div className="blip-list-item" aria-hidden="true">
                            <div className="blip-list-content" style={{ display: "grid", gap: p(2) }}>
                              <span className="blip-skeleton" data-shape="text" style={{ inlineSize: `${[50, 60, 45, 40, 55][i]}%` }} />
                            </div>
                            <span className="blip-skeleton" data-shape="text" style={{ inlineSize: p(22) }} />
                          </div>
                        ) : i === 1 ? (
                          <SwipeRow x={swipe} className="m-swipe">
                            <div className="blip-swipe-row-face"><Row name={name!} score={score!} /></div>
                            <div className="blip-swipe-row-actions" data-side="end">
                              <span className="blip-box blip-button" data-tone="danger" data-size="sm"><Icon name="trash" /></span>
                            </div>
                          </SwipeRow>
                        ) : (
                          <Row name={name!} score={score!} />
                        )}
                      </li>
                    ))}
                  </ul>
                </Beat>
              </div>
            </div>

            <nav className="blip-box blip-bottom-bar" aria-label="Main" style={{ position: "relative" }}>
              <ul className="blip-bottom-bar-list" role="list">
                {[["Home", "home"], ["Top", "trophy"], ["Pals", "users"]].map(([label, icon]) => (
                  <li key={label}>
                    <span className="blip-box blip-bottom-bar-item" data-variant="ghost" aria-current={label === "Top" ? "page" : undefined}>
                      <Icon name={icon!} />
                      <span className="blip-bottom-bar-label">{label}</span>
                      {label === "Pals" && <span className="blip-box blip-bottom-bar-badge" data-tone="danger">2</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </nav>
            <span
              className="blip-box blip-fab m-fab"
              data-position="absolute"
              data-icon-only
              aria-expanded={sheetOn ? "true" : undefined}
              data-blip-state={pressing(frame, FAB) ? "active" : undefined}
              style={{ insetBlockEnd: p(32), insetInlineEnd: p(5) }}
            >
              <Icon name="plus" />
            </span>

            {/* The sheet over its dithered ink scrim, risen a sixth of its height a Blip frame. */}
            {sheetOn && (
              <>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 1000,
                    background:
                      scrim === "quarter"
                        ? "conic-gradient(var(--blip-scrim) 0 25%, transparent 25% 100%) 0 0 / calc(2 * var(--blip-pixel)) calc(2 * var(--blip-pixel))"
                        : "repeating-conic-gradient(var(--blip-scrim) 0 25%, transparent 0 50%) 0 0 / calc(2 * var(--blip-pixel)) calc(2 * var(--blip-pixel))",
                  }}
                />
                <div style={{ position: "absolute", zIndex: 1001, insetInline: 0, insetBlockEnd: 0, translate: `0 ${p(Math.round(SHEET_H * (1 - up)))}` }}>
                  <dialog open className="blip-box blip-drawer blip-sheet" data-side="bottom" data-blip-static style={{ inlineSize: "100%", maxInlineSize: "none", blockSize: p(SHEET_H) }}>
                    <header className="blip-dialog-header">
                      <span className="blip-box blip-sheet-handle" data-variant="ghost"><span /></span>
                      <h2 className="blip-dialog-title">New map</h2>
                      <span className="blip-box blip-button blip-dialog-close" data-variant="ghost" data-size="sm" data-icon-only>
                        <span className="blip-icon" data-glyph="close" aria-hidden="true" />
                      </span>
                    </header>
                    <div className="blip-dialog-body" style={{ display: "grid", gap: p(4) }}>
                      <Beat at={SEND} from={SHEET}>
                        <div className={`blip-field${sent ? " blip-shake" : ""}`}>
                          <label className="blip-field-label">Map name</label>
                          <span className="blip-box blip-input" data-size="sm">
                            <input placeholder="Puddle" aria-invalid={sent ? "true" : undefined} readOnly />
                          </span>
                          <p className="blip-field-error">{sent ? "Give it a name." : ""}</p>
                        </div>
                      </Beat>
                      <span className="blip-box blip-button m-create" data-size="sm" data-blip-state={pressing(frame, SEND) ? "active" : undefined}>Create</span>
                    </div>
                  </dialog>
                </div>
              </>
            )}
          </div>
        </div>
      </Beat>

      <Burst at={DONE} kind="sparkle" box={[PHONE_X + 10, PHONE_Y + 20, PHONE_W - 20, 24]} count={8} seed={12} />

      <Sfx name="bump" at={PHONE} volume={0.5} />
      <Sfx name="look" at={LOADED} volume={0.55} />
      <Sfx name="step" at={DRAG} volume={0.5} />
      <Sfx name="step@5" at={DRAG + 6 * TICK} volume={0.5} />
      <Sfx name="blip" at={LET_GO} volume={0.5} />
      <Sfx name="coin" at={DONE} volume={0.5} />
      <Sfx name="step@3" at={SWIPE} volume={0.5} />
      <Sfx name="jump@3" at={UNSWIPE} volume={0.35} />
      <Sfx name="select" at={FAB} volume={0.6} />
      <Sfx name="open" at={SHEET} volume={0.55} />
      <Sfx name="select@5" at={SEND} volume={0.5} />
      <Sfx name="error" at={SEND + TICK} volume={0.55} />
      <Sfx name="back" at={CLOSE} volume={0.5} />

      <Dither at={OUT} mode="out" />
      {music && <Music bar={MOBILE.bar} bars={MOBILE.bars} />}
    </Stage>
  );
};
