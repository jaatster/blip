import { createElement, type CSSProperties, type ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Beat } from "../lib/Beat";
import { STEP, TICK, at, p, ticks } from "../lib/grid";
import { Icon } from "../lib/Icon";
import { Dither, Life, Sky } from "../lib/Pixels";
import { Pointer, pressing, type Move } from "../lib/Pointer";
import { Music, Sfx } from "../lib/Sound";
import { Stage } from "../lib/Stage";
import { DropTitle, Typed, letterLands } from "../lib/Text";

/** Bars 31-34 of the theme. */
export const MOBILE = { bar: 31, bars: 4 };

// Ready for mobile: a phone screen made of Blip's own phone pieces, worked by attract mode's pointer, one piece a beat
// or two. The list loads from skeletons, is pulled to refresh, a row swipes aside to its Delete, then the action
// button opens a bottom sheet whose field, sent empty, shakes and says why, held to the end to be read. On the left,
// the pieces' names light as each is used.
const TITLE = letterLands("Ready for", at(0, 0, 2), STEP);
const TITLE2 = letterLands("mobile", TITLE.at(-1)! + STEP, STEP);
const PHONE = at(0, 1);
const LINE = at(0, 2);
const TAGS = at(0, 3);
const LOADED = at(1);
const PULL = [at(1, 0, 2), at(1, 1), at(1, 1, 2), at(1, 2)] as const; // pulling, ready, refreshing, done
const SETTLED = at(1, 3) - 2 * TICK;
const SWIPE = at(2);
const UNSWIPE = at(2, 1, 2);
const FAB = at(2, 3);
const SHEET = at(2, 3, 2);
const SEND = at(3, 1);
const OUT = at(4) - 8 * TICK;

const PIECES = [
  { name: "Skeleton", at: TAGS },
  { name: "Pull to refresh", at: PULL[0] },
  { name: "Swipe rows", at: SWIPE },
  { name: "Action button", at: FAB },
  { name: "Bottom sheet", at: SHEET },
  { name: "Field", at: SEND },
];

const MOVES: readonly Move[] = [
  { at: at(1, 0), to: ".m-row-0 .blip-list-title" },
  { at: PULL[0], to: ".m-row-3 .blip-list-title" },
  { at: at(1, 3), to: ".m-row-1 .blip-list-end" },
  { at: SWIPE, to: ".m-row-1 .blip-list-title" },
  { at: at(2, 2), to: ".m-fab", press: FAB },
  { at: at(3), to: ".m-create", press: SEND },
];

const BEFORE = [["Pip Bloom", "98,120"], ["Juno Reed", "87,400"], ["Moss Tanaka", "80,015"], ["Kit Lark", "72,960"], ["Ivy Ono", "66,300"], ["Bo Finch", "51,280"], ["Wren Hale", "47,005"], ["Sol Park", "39,410"]];
const AFTER = [["Juno Reed", "99,050"], ...BEFORE.filter(([n]) => n !== "Juno Reed")];

/** Six even steps, a Blip frame each, from 0 to 1 starting at `from`. */
const six = (frame: number, from: number) => Math.min(6, Math.max(0, ticks(frame, from) + 1)) / 6;

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
  const pull = frame < PULL[0] || frame >= SETTLED ? undefined : (["pulling", "ready", "refreshing", "done"] as const)[PULL.filter((f) => f <= frame).length - 1];
  const rows = frame >= PULL[3] ? AFTER : BEFORE;
  // The row's face slides 40 pixels aside in six steps, holds, and comes back the same way.
  const swipe = Math.round(40 * (frame < UNSWIPE ? six(frame, SWIPE) : 1 - six(frame, UNSWIPE)));
  // The sheet: up a sixth of its height a Blip frame, held, down the same way; the scrim a quarter dither, then half.
  const SHEET_H = 132;
  const up = six(frame, SHEET);
  const sheetOn = frame >= SHEET;
  const scrim = ticks(frame, SHEET) < 1 ? "quarter" : "half";
  const sent = frame >= SEND;
  const lit = PIECES.filter((piece) => piece.at <= frame).length - 1;

  return (
    <Stage scheme="night" mosaicIn>
      <AbsoluteFill>
        <Sky scheme="night" avoid={[[12, 8, 312, 262], [318, 4, 466, 266]]} />
        <Life avoid={[[12, 8, 312, 262], [318, 4, 466, 266]]} seed={57} shooting={[at(2, 1)]} />
      </AbsoluteFill>

      {/* Left: the heading, its line, and the pieces as they are used. */}
      <div style={{ position: "absolute", left: p(20), top: p(16), display: "grid", gap: p(10) }}>
        <DropTitle text="Ready for" lands={TITLE} scale={3} outline={1} />
        <DropTitle text="mobile" lands={TITLE2} scale={3} outline={1} />
      </div>
      <div style={{ position: "absolute", left: p(20), top: p(104), inlineSize: p(290), blockSize: p(16) }}>
        <Typed text="Bottom bars, sheets, swipes and pulls, built in." at={LINE} every={1.5} className="blip-outline" style={{ fontSize: p(11), fontWeight: 700 }} />
      </div>
      <Beat at={TAGS}>
        <div className="blip-box blip-card blip-pop-in" data-size="sm" style={{ position: "absolute", left: p(20), top: p(130), inlineSize: p(262) }}>
          <p className="blip-label" style={{ margin: 0, color: "var(--blip-text-muted)" }}>The phone pieces</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: p(4) }}>
            {PIECES.map((piece, n) => (
              <Beat key={piece.name} at={n === lit ? piece.at : TAGS}>
                <span
                  className={`blip-box blip-tag${n === lit ? " blip-pop-in" : ""}`}
                  data-size="lg"
                  data-variant={n === lit ? "candy" : n < lit ? "soft" : "outline"}
                  data-tone={n <= lit ? "accent" : "neutral"}
                >
                  {piece.name}
                </span>
              </Beat>
            ))}
          </div>
        </div>
      </Beat>

      {/* Right: the phone, a Liquorice candy box (a thing whose own colour is black) round a screen. */}
      <Beat at={PHONE}>
        <div
          className="blip-box blip-pop-in"
          data-tone="slate"
          style={{ "--blip-r": 6, "--blip-shape": "var(--blip-shape-6)", "--blip-shape-inner": "var(--blip-shape-6-inner)", position: "absolute", left: p(326), top: p(8), inlineSize: p(132), blockSize: p(254), padding: p(5) } as CSSProperties}
        >
          <div
            style={{ position: "relative", inlineSize: "100%", blockSize: "100%", overflow: "hidden", display: "flex", flexDirection: "column", background: "var(--blip-bg)", "--blip-pixel": "4px" } as CSSProperties}
          >
            <header className="blip-box blip-top-bar" style={{ position: "relative" }}>
              <span className="blip-box blip-button blip-top-bar-back" data-variant="ghost" data-icon-only>
                <span className="blip-icon blip-top-bar-chevron" aria-hidden="true" />
              </span>
              <h1 className="blip-top-bar-title">Scores</h1>
              <div className="blip-top-bar-actions">
                <span className="blip-box blip-button" data-variant="ghost" data-icon-only><Icon name="search" /></span>
              </div>
            </header>

            <div className="blip-refresh" data-blip-state={pull} style={{ flex: 1, minBlockSize: 0 }}>
              <div className="blip-refresh-indicator" aria-hidden="true">
                <span className="blip-refresh-arrow" />
                <Beat at={PULL[2]}>
                  <span className="blip-loader" data-size="sm"><span className="blip-sr-only">Refreshing</span></span>
                </Beat>
                <span className="blip-refresh-label">{pull === "ready" ? "Let go" : pull === "refreshing" ? "Updating" : pull === "done" ? "Updated" : "Pull"}</span>
              </div>
              <div className="blip-refresh-scroller">
                <Beat at={PHONE}>
                  <ul className="blip-list" role="list" data-density="compact" data-dividers style={{ margin: 0 }}>
                    {rows.map(([name, score], i) => (
                      <li key={name} className={`m-row-${i}`}>
                        {!loaded ? (
                          <div className="blip-list-item" aria-hidden="true">
                            <div className="blip-list-content" style={{ display: "grid", gap: p(2) }}>
                              <span className="blip-skeleton" data-shape="text" style={{ inlineSize: `${[70, 55, 80, 60, 50, 65, 58, 72][i]}%` }} />
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
                {[["Home", "home"], ["Scores", "trophy"], ["Friends", "users"], ["Me", "user"]].map(([label, icon]) => (
                  <li key={label}>
                    <span className="blip-box blip-bottom-bar-item" data-variant="ghost" aria-current={label === "Scores" ? "page" : undefined}>
                      <Icon name={icon!} />
                      <span className="blip-bottom-bar-label">{label}</span>
                      {label === "Friends" && <span className="blip-box blip-bottom-bar-badge" data-tone="danger">2</span>}
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
              style={{ insetBlockEnd: p(40), insetInlineEnd: p(6) }}
            >
              <Icon name="plus" />
            </span>

            {/* The sheet over its dithered ink scrim, risen a sixth of its height a Blip frame. */}
            {sheetOn && (
              <>
                {(
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      zIndex: 1000,
                      background:
                        scrim === "quarter"
                          ? "repeating-conic-gradient(var(--blip-scrim) 0 25%, transparent 0) 0 0 / calc(4 * var(--blip-pixel)) calc(4 * var(--blip-pixel))"
                          : "repeating-conic-gradient(var(--blip-scrim) 0 25%, transparent 0 50%) 0 0 / calc(2 * var(--blip-pixel)) calc(2 * var(--blip-pixel))",
                    }}
                  />
                )}
                <div style={{ position: "absolute", zIndex: 1001, insetInline: 0, insetBlockEnd: 0, translate: `0 ${p(Math.round(SHEET_H * (1 - up)))}` }}>
                  <dialog open className="blip-box blip-drawer blip-sheet" data-side="bottom" data-blip-static style={{ inlineSize: "100%", maxInlineSize: "none", blockSize: p(SHEET_H) }}>
                    <header className="blip-dialog-header">
                      <span className="blip-box blip-sheet-handle" data-variant="ghost"><span /></span>
                      <h2 className="blip-dialog-title">New level</h2>
                      <span className="blip-box blip-button blip-dialog-close" data-variant="ghost" data-size="sm" data-icon-only>
                        <span className="blip-icon" data-glyph="close" aria-hidden="true" />
                      </span>
                    </header>
                    <div className="blip-dialog-body" style={{ display: "grid", gap: p(6) }}>
                      <Beat at={SEND} from={SHEET}>
                        <div className={`blip-field${sent ? " blip-shake" : ""}`}>
                          <label className="blip-field-label">Level name</label>
                          <span className="blip-box blip-input" data-size="sm">
                            <input placeholder="World 1-4" aria-invalid={sent ? "true" : undefined} readOnly />
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

      <Pointer moves={MOVES} />

      {[...new Set([...TITLE, ...TITLE2])].map((f, i) => <Sfx key={f} name={i % 8 ? `step@${[0, 2, 3, 5, 7, 8, 10, 12][i % 8]}` : "step"} at={f} volume={0.35} />)}
      <Sfx name="open" at={PHONE} volume={0.6} />
      <Sfx name="look" at={LOADED} volume={0.55} />
      <Sfx name="step" at={PULL[0]} volume={0.5} />
      <Sfx name="step@5" at={PULL[1]} volume={0.5} />
      <Sfx name="blip" at={PULL[2]} volume={0.5} />
      <Sfx name="coin" at={PULL[3]} volume={0.5} />
      <Sfx name="step@3" at={SWIPE} volume={0.5} />
      <Sfx name="step" at={UNSWIPE} volume={0.4} />
      <Sfx name="select" at={FAB} volume={0.6} />
      <Sfx name="open" at={SHEET} volume={0.55} />
      <Sfx name="select@5" at={SEND} volume={0.5} />
      <Sfx name="error" at={SEND + TICK} volume={0.55} />

      <Dither at={OUT} mode="out" />
      {music && <Music bar={MOBILE.bar} bars={MOBILE.bars} />}
    </Stage>
  );
};
