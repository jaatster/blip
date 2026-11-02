import type { CSSProperties, ReactNode } from "react";
import { useCurrentFrame } from "remotion";
import { Beat } from "../lib/Beat";
import { BEAT, STEP, TICK, at, p, ticks } from "../lib/grid";
import { Icon } from "../lib/Icon";
import { Burst, Dither, Scrim, World } from "../lib/Pixels";
import { Music, Sfx } from "../lib/Sound";
import { Stage } from "../lib/Stage";
import { DropTitle, Typed } from "../lib/Text";

/** Bars 8-15 of the theme: the hook. */
export const COMPONENTS = { bar: 8, bars: 8 };

// Page one lands a tile a beat from beat 2; each acts on the eighth after it lands. Page two lands a tile an eighth
// from bar 4 (the hook's second half) and acts a sixteenth after. Then the counter rolls to 88 and stamps.
const SLIDE = at(3, 3);
const PAGE2 = at(4);
const ROLL = at(5, 2);
const STAMP = at(6);
const STRAP = at(6, 1);
const OUT = at(8) - 8 * TICK;

type Demo = (t: number) => ReactNode;
type Tile = {
  readonly name: string;
  readonly tone: string;
  readonly col: number;
  readonly row: number;
  readonly span?: number;
  readonly demo: Demo;
  /** Blip sounds, at frames after the action. */
  readonly sounds: readonly (readonly [name: string, after: number])[];
};

const on = (t: number) => t >= 0;
const pressedFor = (t: number, frames = 3 * TICK) => t >= 0 && t < frames;

const PAGE_ONE: readonly Tile[] = [
  {
    name: "Button", tone: "pink", col: 0, row: 0, sounds: [["select", 0]],
    demo: (t) => <button className="blip-box blip-button" type="button" data-blip-state={pressedFor(t) ? "active" : undefined}><Icon name="play" />Play</button>,
  },
  {
    name: "Switch", tone: "teal", col: 1, row: 0, sounds: [["blip", 0]],
    demo: (t) => (
      <label className="blip-check" data-layout="split" style={{ inlineSize: "100%" }}>
        Music
        <span className="blip-box blip-switch"><input type="checkbox" role="switch" className="blip-box" checked={on(t)} readOnly /></span>
      </label>
    ),
  },
  {
    name: "Checkbox", tone: "yellow", col: 2, row: 0, sounds: [["select@5", 0]],
    demo: (t) => (
      <label className="blip-check">
        <span className="blip-box blip-checkbox"><input type="checkbox" checked={on(t)} readOnly /></span>
        Screen shake
      </label>
    ),
  },
  {
    name: "Slider", tone: "purple", col: 3, row: 0, sounds: [["step", 0], ["step@5", 4 * TICK]],
    demo: (t) => {
      const v = Math.min(8, 3 + Math.max(0, ticks(t, 0) + 1));
      return (
        <div className="blip-slider-group" style={{ inlineSize: "100%" }}>
          <input className="blip-slider" type="range" min={0} max={10} value={v} onChange={() => {}} style={{ "--blip-slider-value": v / 10 } as CSSProperties} />
          <output className="blip-box blip-slider-value" data-variant="panel">{v}</output>
        </div>
      );
    },
  },
  {
    name: "Tabs", tone: "green", col: 0, row: 1, sounds: [["look", 0]],
    demo: (t) => (
      <div className="blip-tabs" data-size="sm">
        <div className="blip-tabs-list" role="tablist">
          {["Bag", "Map", "Log"].map((label, i) => (
            <button key={label} className="blip-box blip-tab" role="tab" type="button" aria-selected={(on(t) ? 1 : 0) === i}>{label}</button>
          ))}
        </div>
      </div>
    ),
  },
  {
    name: "Progress", tone: "orange", col: 1, row: 1, sounds: [["success@7", BEAT]],
    demo: (t) => {
      const v = Math.min(100, Math.max(0, Math.round((ticks(t, 0) + 1) * 10)));
      return (
        <div style={{ inlineSize: "100%" }}>
          <div className="blip-progress-label"><label>Saving</label><span>{v}%</span></div>
          <div className="blip-box blip-progress" data-tone="success"><progress max={100} value={v}>{v}%</progress></div>
        </div>
      );
    },
  },
  {
    name: "Toast", tone: "blue", col: 2, row: 1, span: 2, sounds: [["open", 0]],
    demo: (t) =>
      on(t) && (
        <div className="blip-box blip-toast" data-tone="success" style={{ inlineSize: "100%" }}>
          <span className="blip-toast-icon" aria-hidden="true" />
          <div className="blip-toast-body">
            <p className="blip-toast-title">Game saved</p>
            <p>Slot 2, World 1-3</p>
          </div>
          <span className="blip-toast-timer" aria-hidden="true" />
        </div>
      ),
  },
  {
    name: "Badge", tone: "red", col: 0, row: 2, sounds: [["coin", 0]],
    demo: (t) => (
      <button className="blip-box blip-button" type="button" data-variant="soft" data-icon-only aria-label="Alerts">
        <Icon name="bell" />
        <span className="blip-box blip-badge" data-tone="danger" data-position="top-end">{on(t) ? 4 : 3}</span>
      </button>
    ),
  },
  {
    name: "Avatar", tone: "teal", col: 1, row: 2, sounds: [["blip@3", 0]],
    demo: (t) => (
      <span style={{ display: "flex", alignItems: "center", gap: p(6) }}>
        <span className="blip-box blip-avatar" data-tone="green" data-size="lg">
          P
          <span className="blip-box blip-avatar-status" data-tone={on(t) ? "success" : "neutral"} data-variant={on(t) ? undefined : "outline"} />
        </span>
        <span>{on(t) ? "Online" : "Away"}</span>
      </span>
    ),
  },
  {
    name: "Rating", tone: "yellow", col: 2, row: 2, sounds: [["step", 0], ["step@3", STEP], ["step@5", 2 * STEP], ["step@7", 3 * STEP]],
    demo: (t) => <span className="blip-rating" role="img" aria-label="Rating" style={{ "--blip-rating-value": Math.max(0, Math.min(4, Math.floor(t / STEP) + 1)) } as CSSProperties} />,
  },
  {
    name: "Segmented", tone: "purple", col: 3, row: 2, sounds: [["blip", 0]],
    demo: (t) => (
      <div className="blip-box blip-segmented" data-size="sm">
        {["1P", "2P", "Co-op"].map((label, i) => (
          <button key={label} className="blip-box" type="button" aria-checked={(on(t) ? 2 : 0) === i}>{label}</button>
        ))}
      </div>
    ),
  },
];

const PAGE_TWO: readonly Tile[] = [
  {
    name: "Input", tone: "blue", col: 0, row: 0, sounds: [],
    demo: (t) => (
      <span className="blip-box blip-input" data-blip-state="focus" style={{ inlineSize: "100%" }}>
        <input value={"Pip Bloom".slice(0, Math.max(0, Math.floor(t / TICK) + 1))} placeholder="Your name" readOnly />
      </span>
    ),
  },
  {
    name: "Radio", tone: "green", col: 1, row: 0, sounds: [["select", 0]],
    demo: (t) => (
      <div style={{ display: "grid", gap: p(3) }}>
        {["Easy", "Hard"].map((label, i) => (
          <label key={label} className="blip-check">
            <span className="blip-box blip-radio"><input type="radio" checked={(on(t) ? 1 : 0) === i} readOnly /></span>
            {label}
          </label>
        ))}
      </div>
    ),
  },
  {
    name: "Tag", tone: "orange", col: 2, row: 0, sounds: [["blip@5", 0]],
    demo: (t) => (
      <span style={{ display: "flex", gap: p(4) }}>
        <button className="blip-box blip-tag" type="button" data-variant="outline" aria-pressed="true">Swords</button>
        <button className="blip-box blip-tag" type="button" data-variant="outline" aria-pressed={on(t)}>Bows</button>
      </span>
    ),
  },
  {
    name: "Toggle", tone: "pink", col: 3, row: 0, sounds: [["select@7", 0]],
    demo: (t) => <button className="blip-box blip-button" type="button" data-variant="soft" aria-pressed={on(t)}><Icon name="heart" />Favourite</button>,
  },
  {
    name: "Alert", tone: "yellow", col: 0, row: 1, span: 2, sounds: [["error", 0]],
    demo: (t) =>
      on(t) && (
        <div className="blip-box blip-alert" data-tone="warning" style={{ inlineSize: "100%" }}>
          <span className="blip-alert-icon" aria-hidden="true" />
          <div className="blip-alert-body">
            <p className="blip-alert-title">Low battery</p>
            <p>Plug in to keep playing.</p>
          </div>
        </div>
      ),
  },
  {
    name: "Stat", tone: "purple", col: 2, row: 1, sounds: [["coin@4", 0]],
    demo: (t) => {
      const v = (98_000 + Math.min(120, Math.max(0, (ticks(t, 0) + 1) * 30))).toLocaleString("en");
      return (
        <dl style={{ margin: 0 }}>
          <div className="blip-stat">
            <dt className="blip-stat-label">High score</dt>
            <dd className="blip-stat-value blip-display blip-pop" data-scale="2" data-pop={v}>{v}</dd>
          </div>
        </dl>
      );
    },
  },
  {
    name: "Keycap", tone: "teal", col: 3, row: 1, sounds: [["select", 0]],
    demo: (t) => (
      <kbd className="blip-keys">
        <kbd className="blip-box blip-keycap" data-size="lg" data-blip-pressed={pressedFor(t) ? "" : undefined}>Ctrl</kbd>+
        <kbd className="blip-box blip-keycap" data-size="lg" data-blip-pressed={pressedFor(t) ? "" : undefined}>S</kbd>
      </kbd>
    ),
  },
  {
    name: "Loader", tone: "blue", col: 0, row: 2, sounds: [],
    demo: () => <span className="blip-loader" data-size="lg" role="status">Loading</span>,
  },
  {
    name: "Hearts", tone: "red", col: 1, row: 2, sounds: [["bump", 0]],
    demo: (t) => <span className="blip-rating" data-shape="heart" role="img" aria-label="Health" style={{ "--blip-rating-value": on(t) ? 2 : 3, "--blip-rating-max": 3 } as CSSProperties} />,
  },
  {
    name: "Pagination", tone: "green", col: 2, row: 2, span: 2, sounds: [["look", 0]],
    demo: (t) => (
      <nav className="blip-pagination" aria-label="Worlds">
        <ul className="blip-pagination-list" role="list">
          {[1, 2, 3, 4].map((n) => (
            <li key={n}>
              <a className="blip-box blip-pagination-page" data-variant="candy" href={`#${n}`} aria-current={n === (on(t) ? 3 : 2) ? "page" : undefined}>{n}</a>
            </li>
          ))}
        </ul>
      </nav>
    ),
  },
];

// The grid: four columns of 106 pixels and three rows of 64, eight apart, under the header.
const COL = 106, ROW = 64, GAP = 8, LEFT = 16, TOP = 50;
const FALL = [-30, -14, -4, 0, -2, 0];

const TileView = ({ tile, land, act }: { readonly tile: Tile; readonly land: number; readonly act: number }) => {
  const frame = useCurrentFrame();
  const k = ticks(frame, land - 3 * TICK);
  const span = tile.span ?? 1;
  return (
    <Beat at={act} from={land - 3 * TICK}>
      <article
        className="blip-box blip-card"
        data-size="sm"
        data-tone={tile.tone}
        style={{
          position: "absolute",
          left: p(LEFT + tile.col * (COL + GAP)),
          top: p(TOP + tile.row * (ROW + GAP)),
          inlineSize: p(COL * span + GAP * (span - 1)),
          blockSize: p(ROW),
          translate: `0 ${p(FALL[Math.min(k, FALL.length - 1)]!)}`,
        }}
      >
        <p className="blip-label" style={{ margin: 0, color: "var(--blip-text-muted)" }}>{tile.name}</p>
        <div style={{ flex: 1, display: "grid", placeItems: "center", minBlockSize: 0 }}>{tile.demo(frame - act)}</div>
      </article>
      {tile.sounds.map(([name, after]) => (
        <Sfx key={name + after} name={name} at={act + after} volume={0.65} />
      ))}
    </Beat>
  );
};

const landsOne = PAGE_ONE.map((_, i) => at(0, 2 + i));
const landsTwo = PAGE_TWO.map((_, i) => PAGE2 + i * 2 * STEP);
const SLIDE_X = [0, -16, -64, -160, -320, -480];

export const Components = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  const landed = [...landsOne, ...landsTwo].filter((l) => frame >= l).length;
  const rolled = frame < ROLL ? landed : Math.min(88, landed + Math.round(((88 - landed) * Math.max(0, ticks(frame, ROLL) + 1)) / 20));
  const count = `${rolled}/88`;

  return (
    <Stage scheme="day">
      <World scheme="day" />

      <div style={{ position: "absolute", left: p(LEFT), top: p(10), display: "flex", alignItems: "baseline", gap: p(8) }}>
        <span className="blip-display blip-pop" data-scale="2" data-pop="Components">Components</span>
        <span className="blip-display blip-pop" data-scale="3" data-tone="yellow" data-pop={count}>{count}</span>
      </div>

      <div style={{ position: "absolute", inset: 0, translate: `${p(SLIDE_X[Math.min(Math.max(0, ticks(frame, SLIDE)), SLIDE_X.length - 1)]!)} 0` }}>
        {frame < PAGE2 && PAGE_ONE.map((tile, i) => <TileView key={tile.name} tile={tile} land={landsOne[i]!} act={landsOne[i]! + 2 * STEP} />)}
      </div>
      {PAGE_TWO.map((tile, i) => <TileView key={tile.name} tile={tile} land={landsTwo[i]!} act={landsTwo[i]! + STEP} />)}

      {Array.from({ length: 8 }, (_, i) => (
        <Sfx key={i} name={i ? `coin@${[0, 2, 4, 5, 7, 9, 11, 12][i]}` : "coin"} at={ROLL + i * STEP} volume={0.35} />
      ))}
      <Burst at={ROLL} kind="coin" box={[150, 10, 60, 24]} count={8} seed={3} />

      <Beat at={STAMP} from={STAMP}>
        <Scrim level={12} />
        <div className="v-center" style={{ gap: p(6) }}>
          <DropTitle text="88" lands={[STAMP, STAMP + STEP]} scale={10} outline={2} tone="yellow" />
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
