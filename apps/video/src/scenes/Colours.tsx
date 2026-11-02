import type { CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Beat } from "../lib/Beat";
import { BEAT, TICK, at, p, ticks } from "../lib/grid";
import { Big } from "../lib/Big";
import { Icon } from "../lib/Icon";
import { Dither, Life, Sky, bayerMask } from "../lib/Pixels";
import { type Move, Pointer, over, pressing } from "../lib/Pointer";
import { Music, Sfx } from "../lib/Sound";
import { DemoFrame, SPLIT_CLEAR, SplitText } from "../lib/Split";
import { Stage } from "../lib/Stage";
import { MOSAIC_FRAMES } from "../lib/Transitions";

/** Bars 17-20 of the theme: the groove again. */
export const COLOURS = { bar: 17, bars: 4 };

// The palette's name over the docs home's accent swatches standing big on the sky, and under them a row of real
// controls that take the accent: the candy Play button, a switch, a tag and a progress bar. The next swatch is picked
// every three beats (1.2 s); the whole screen takes the palette through the ordered dither (its night sky, page, ink
// and accent), the controls pop in afresh one after another, the button's glint sweeps and the progress steps on.
const PALETTES = [
  { id: "", name: "Candy", line: "12 palettes, or your own. Candy is Blip's." },
  { id: "mint", name: "Mint", line: "Mint on a green ash night." },
  { id: "grape", name: "Grape", line: "The TV's own night: grape on indigo." },
  { id: "bubblegum", name: "Bubblegum", line: "Bubblegum on a pink dusk." },
  { id: "ember", name: "Ember", line: "Warm ember on charcoal." },
];
const PICKS = [0, 68, 128, 188, 248];
const PARTS = PALETTES.map((pl, i) => ({ at: PICKS[i]! + 4, title: pl.name, line: pl.line }));
const MOVES: readonly Move[] = PICKS.slice(1).map((f, n) => ({ at: f - BEAT, to: `[data-v="sw-${n + 1}"]`, press: f }));
const FRAME = at(0, 1);

// The hero, standing on the night sky: the swatches three times the size, and under them the controls twice the size.
const GAP = 24;

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
      data-v={v ? `sw-${n}` : undefined}
      style={{
        "--blip-r": 3, "--blip-shape": "var(--blip-shape-3)", "--blip-shape-inner": "var(--blip-shape-3-inner)",
        // Candy is no palette attribute at all, so its swatch names its own Night accent, Sky Soda.
        ...(sw.id
          ? { "--blip-tone": "var(--blip-accent)", "--blip-tone-light": "var(--blip-accent-light)", "--blip-tone-shade": "var(--blip-accent-shade)" }
          : { "--blip-tone": "#00C2FA", "--blip-tone-light": "#91DDFF", "--blip-tone-shade": "#0096C3" }),
        "--blip-tone-on": "var(--blip-ink)",
        display: "inline-grid", placeItems: "center", inlineSize: p(14), blockSize: p(14), margin: `0 ${p(1)} ${p(1)} 0`,
      } as CSSProperties}
    >
      <span style={{ display: n === i ? "block" : "none", inlineSize: p(4), blockSize: p(4), background: "var(--blip-tone-on)" }} />
    </label>
  );
};

/** The whole screen in palette `i`: drawn twice while one palette dithers into the next. */
const Screen = ({ i, frame, v }: { readonly i: number; readonly frame: number; readonly v: boolean }) => {
  const palette = PALETTES[i]!;
  // Each pick, the controls pop in afresh one after another, a Blip frame apart.
  const from = (n: number) => (i > 0 ? PICKS[i]! + 2 * TICK + n * TICK : FRAME);
  return (
    <AbsoluteFill data-blip-scheme="night" data-blip-palette={palette.id || undefined} style={{ background: "var(--blip-bg)" }}>
      <Sky key={`s${palette.id}`} scheme="night" palette={palette.id} avoid={SPLIT_CLEAR} />
      <Life avoid={SPLIT_CLEAR} seed={21} shooting={[at(2, 1)]} />
      <SplitText eyebrow="Your colours" parts={PARTS} />

      <DemoFrame at={FRAME}>
        {/* One centred block: the docs home's swatches, big, standing on the sky, and under them Pip by Play. */}
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
          <div style={{ display: "grid", justifyItems: "center", gap: p(GAP) }}>
            <Big x={3}>
              <div style={{ display: "flex", gap: p(4) }}>
                {PALETTES.map((sw, n) => <Swatch key={sw.name} n={n} i={i} frame={frame} v={v} />)}
              </div>
            </Big>
            <Big x={2}>
              <div style={{ display: "flex", alignItems: "center", gap: p(8) }}>
                <Beat at={from(0)}>
                  <span className="blip-box blip-button blip-pop-in" style={{ position: "relative" }}>
                    <Icon name="play" />Play
                    <span className="blip-glint" aria-hidden="true" />
                  </span>
                </Beat>
                <Beat at={from(1)}>
                  <span className="blip-box blip-switch blip-pop-in"><input type="checkbox" role="switch" className="blip-box" checked readOnly /></span>
                </Beat>
                <Beat at={from(2)}>
                  <span className="blip-box blip-tag blip-pop-in" data-variant="candy">New</span>
                </Beat>
                <Beat at={from(3)}>
                  <div className="blip-box blip-progress blip-pop-in" style={{ inlineSize: p(50) }}><progress max={100} value={20 + i * 20}>{20 + i * 20}%</progress></div>
                </Beat>
              </div>
            </Big>
          </div>
        </div>
      </DemoFrame>
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

      <Sfx name="open" at={FRAME} volume={0.5} />
      {MOVES.map((m) => <Sfx key={m.at} name="look" at={m.at} volume={0.3} />)}
      {PICKS.slice(1).map((f, n) => <Sfx key={f} name={`blip@${[3, 5, 7, 7][n]}`} at={f} volume={0.6} />)}
      {PICKS.slice(1).flatMap((f) => [0, 1, 2, 3].map((n) => <Sfx key={`s${f}${n}`} name={n ? `step@${[0, 3, 5, 7][n]}` : "step"} at={f + 2 * TICK + n * TICK} volume={0.3} />))}

      <Dither at={0} mode="in" />
      {music && <Music bar={COLOURS.bar} bars={COLOURS.bars} />}
    </Stage>
  );
};
