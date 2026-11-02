import type { CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Beat } from "../lib/Beat";
import { BEAT, STEP, TICK, at, p, ticks } from "../lib/grid";
import { Icon } from "../lib/Icon";
import { Dither, Life, Sky, bayerMask } from "../lib/Pixels";
import { type Move, Pointer, over, pressing } from "../lib/Pointer";
import { Music, Sfx } from "../lib/Sound";
import { Stage } from "../lib/Stage";
import { DropTitle, Typed, letterLands } from "../lib/Text";
import { MOSAIC_FRAMES } from "../lib/Transitions";

/** Bars 17-20 of the theme: the groove again. */
export const COLOURS = { bar: 17, bars: 4 };

// Left, the docs home's accent swatches, each a palette, picked by attract mode's pointer every three beats (1.2 s),
// the palette's name dropping in under them. The whole screen takes each one through the ordered dither: its night
// sky, page, ink and accent. Right, a specimen of what the accent paints, the real components: tabs, the one candy
// button and its calmer tiers, the checks, a slider, progress, tags and a badge.
const PALETTES = [
  { id: "", name: "Candy" },
  { id: "mint", name: "Mint" },
  { id: "grape", name: "Grape" },
  { id: "bubblegum", name: "Bubblegum" },
  { id: "ember", name: "Ember" },
];
const PICKS = [0, at(0, 3), at(1, 2), at(2, 1), at(3, 0)];
const MOVES: readonly Move[] = PICKS.slice(1).map((f, n) => ({ at: f - BEAT, to: `[data-v="swatch-${n + 1}"]`, press: f }));
const TITLE = letterLands("Your colours", at(0, 0, 2), STEP);
const LINE = at(0, 2);
const WINDOW = at(0, 1);
const SPECIMEN = at(0, 2);
const CLEAR = [[10, 6, 470, 262]] as const;

const Swatch = ({ n, i, frame, v }: { readonly n: number; readonly i: number; readonly frame: number; readonly v: boolean }) => {
  const sw = PALETTES[n]!;
  const move = MOVES[n - 1];
  const state = move && pressing(frame, move.press) ? "active" : move && over(MOVES, move.to, frame) && i < n ? "hover" : n === i ? "focus" : undefined;
  return (
    <label
      className="blip-box"
      data-blip-scheme="night"
      data-blip-palette={sw.id || undefined}
      data-blip-state={state}
      data-v={v ? `swatch-${n}` : undefined}
      style={{
        "--blip-r": 3, "--blip-shape": "var(--blip-shape-3)", "--blip-shape-inner": "var(--blip-shape-3-inner)",
        // Candy is no palette attribute at all, so its swatch names its own Night accent, Sky Soda.
        ...(sw.id
          ? { "--blip-tone": "var(--blip-accent)", "--blip-tone-light": "var(--blip-accent-light)", "--blip-tone-shade": "var(--blip-accent-shade)" }
          : { "--blip-tone": "#00C2FA", "--blip-tone-light": "#91DDFF", "--blip-tone-shade": "#0096C3" }),
        "--blip-tone-on": "var(--blip-ink)",
        display: "inline-grid", placeItems: "center", inlineSize: p(18), blockSize: p(18), margin: `0 ${p(1)} ${p(1)} 0`,
      } as CSSProperties}
    >
      <span style={{ display: n === i ? "block" : "none", inlineSize: p(4), blockSize: p(4), background: "var(--blip-tone-on)" }} />
    </label>
  );
};

/** The screen in palette `i`. */
const Screen = ({ i, frame, v }: { readonly i: number; readonly frame: number; readonly v: boolean }) => {
  const palette = PALETTES[i]!;
  return (
    <AbsoluteFill data-blip-scheme="night" data-blip-palette={palette.id || undefined} style={{ background: "var(--blip-bg)" }}>
      <Sky scheme="night" palette={palette.id} avoid={CLEAR} />
      <Life avoid={CLEAR} seed={21} />

      <div style={{ position: "absolute", left: p(16), top: p(12) }}>
        <DropTitle text="Your colours" lands={TITLE} scale={3} outline={1} />
      </div>
      <div style={{ position: "absolute", left: p(16), top: p(44), blockSize: p(14) }}>
        <Typed text="12 palettes, or make your own." at={LINE} every={1.5} className="blip-outline" style={{ fontSize: p(10), fontWeight: 700 }} />
      </div>

      <Beat at={WINDOW}>
        <section className="blip-box blip-window blip-pop-in" style={{ position: "absolute", left: p(16), top: p(66), inlineSize: p(220) }}>
          <header className="blip-window-bar">
            <h2 className="blip-window-title blip-display blip-pop" data-pop="Colours">Colours</h2>
          </header>
          <div className="blip-window-body" style={{ display: "grid", gap: "var(--blip-space-4)", padding: "var(--blip-space-8)" }}>
            <span className="blip-label">Accent</span>
            <div style={{ display: "flex", gap: "var(--blip-space-4)" }}>
              {PALETTES.map((sw, n) => <Swatch key={sw.name} n={n} i={i} frame={frame} v={v} />)}
            </div>
          </div>
          <footer className="blip-window-status"><span>Palette</span><span>Night</span></footer>
        </section>
      </Beat>

      {/* The palette's name, dropping in afresh each time one is picked. */}
      <div style={{ position: "absolute", left: p(16), top: p(160), inlineSize: p(220), display: "grid", justifyItems: "center" }}>
        <DropTitle key={i} text={palette.name} lands={letterLands(palette.name, (PICKS[i] || WINDOW) + TICK, TICK)} scale={3} outline={2} />
      </div>

      <Beat at={SPECIMEN}>
        <article className="blip-box blip-card blip-pop-in" data-size="sm" style={{ position: "absolute", left: p(252), top: p(40), inlineSize: p(212), blockSize: p(196) }}>
          <div style={{ display: "grid", gap: p(9), padding: p(2) }}>
            <span className="blip-label" style={{ color: "var(--blip-text-muted)" }}>What the accent paints</span>
            <div className="blip-tabs" data-size="sm">
              <div className="blip-tabs-list" role="tablist">
                {["Bag", "Map", "Log"].map((t, n) => <button key={t} className="blip-box blip-tab" role="tab" type="button" aria-selected={n === 1}>{t}</button>)}
              </div>
            </div>
            <div style={{ display: "flex", gap: p(4) }}>
              <span className="blip-box blip-button" data-size="sm"><Icon name="play" />Play</span>
              <span className="blip-box blip-button" data-size="sm" data-variant="soft">Options</span>
              <span className="blip-box blip-button" data-size="sm" data-variant="outline">Help</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: p(8) }}>
              <label className="blip-check"><span className="blip-box blip-checkbox"><input type="checkbox" checked readOnly /></span>Music</label>
              <label className="blip-check"><span className="blip-box blip-radio"><input type="radio" checked readOnly /></span>Hard</label>
              <span className="blip-box blip-switch"><input type="checkbox" role="switch" className="blip-box" checked readOnly /></span>
            </div>
            <div className="blip-slider-group">
              <input className="blip-slider" type="range" min={0} max={10} value={6} onChange={() => {}} style={{ "--blip-slider-value": 0.6 } as CSSProperties} />
              <output className="blip-box blip-slider-value" data-variant="panel">6</output>
            </div>
            <div className="blip-box blip-progress"><progress max={100} value={60}>60%</progress></div>
            <div style={{ display: "flex", alignItems: "center", gap: p(6) }}>
              <span className="blip-box blip-tag" data-variant="candy">New</span>
              <span className="blip-box blip-tag">Rare</span>
              <span className="blip-box blip-button" data-size="sm" data-variant="soft" data-icon-only aria-label="Alerts"><Icon name="bell" /><span className="blip-box blip-badge" data-position="top-end">2</span></span>
            </div>
          </div>
        </article>
      </Beat>
    </AbsoluteFill>
  );
};

export const Colours = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  const i = PICKS.filter((f) => f <= frame).length - 1;
  const k = ticks(frame, PICKS[i]!);
  const fading = i > 0 && k < 3;

  return (
    <Stage scheme="night" mosaicOut={at(4) - MOSAIC_FRAMES}>
      <Screen i={i} frame={frame} v />
      {fading && (
        <div style={{ position: "absolute", inset: 0, mask: bayerMask(16 - 4 * (k + 1)) }}>
          <Screen i={i - 1} frame={frame} v={false} />
        </div>
      )}
      <Pointer moves={MOVES} />

      {[...new Set(TITLE)].map((f, n) => <Sfx key={f} name={n ? `step@${[0, 2, 3, 5, 7, 8, 10, 12, 12, 12, 12][n]}` : "step"} at={f} volume={0.35} />)}
      <Sfx name="open" at={WINDOW} volume={0.55} />
      {MOVES.map((m) => <Sfx key={m.at} name="look" at={m.at} volume={0.3} />)}
      {PICKS.slice(1).map((f, n) => <Sfx key={f} name={`blip@${[3, 5, 7, 7][n]}`} at={f} volume={0.6} />)}

      <Dither at={0} mode="in" />
      {music && <Music bar={COLOURS.bar} bars={COLOURS.bars} />}
    </Stage>
  );
};
