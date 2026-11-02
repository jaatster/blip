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
// controls that take the accent: the candy Play button, a switch, a tag naming the palette and a progress bar. The
// title stays "Custom palettes". The next swatch is picked every three beats (1.2 s); the whole screen eases into the
// palette through a slow ordered dither (its night sky, page, ink and accent). The controls stay put; only their
// colours change, and the button's glint sweeps.
const PALETTES = [
  { id: "", name: "Candy", line: "12 palettes, or your own. Candy is Blip's." },
  { id: "mint", name: "Mint", line: "Mint on a green ash night." },
  { id: "grape", name: "Grape", line: "The TV's own night: grape on indigo." },
  { id: "bubblegum", name: "Bubblegum", line: "Bubblegum on a pink dusk." },
  { id: "ember", name: "Ember", line: "Warm ember on charcoal." },
];
const PICKS = [0, 68, 128, 188, 248];
const FRAME_AT = 0;
const PARTS = [{ at: FRAME_AT, title: "Custom palettes", line: "12 palettes, or your own." }];
const MOVES: readonly Move[] = PICKS.slice(1).map((f, n) => ({ at: f - BEAT, to: `[data-v="sw-${n + 1}"]`, press: f }));
const FRAME = at(0, 1);
/** How many Blip frames one palette takes to dither into the next. */
export const FADE = 7;

// The hero, standing on the night sky: the swatches three times the size, and under them the controls twice the size.
const GAP = 24;
// The controls' row, wide enough for the longest name (Bubblegum), in 1x pixels.
const ROW_W = 190;

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
  // The controls pop in once, a Blip frame apart, and then stay: a new palette only recolours them.
  const from = (n: number) => FRAME + 2 * TICK + n * TICK;
  return (
    <AbsoluteFill data-blip-scheme="night" data-blip-palette={palette.id || undefined} style={{ background: "var(--blip-bg)" }}>
      <Sky key={`s${palette.id}`} scheme="night" palette={palette.id} avoid={SPLIT_CLEAR} />
      <Life avoid={SPLIT_CLEAR} seed={21} shooting={[at(2, 1)]} />
      <SplitText eyebrow="Custom palettes" parts={PARTS} />

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
              <div style={{ display: "flex", alignItems: "center", gap: p(8), inlineSize: p(ROW_W) }}>
                <Beat at={from(0)}>
                  <span className="blip-box blip-button blip-pop-in" style={{ position: "relative" }}>
                    <Icon name="play" />Play
                    {/* Its glint sweeps again as each palette arrives. */}
                    <Beat at={PICKS[i]! + 2 * TICK}>
                      <span className="blip-glint" aria-hidden="true" />
                    </Beat>
                  </span>
                </Beat>
                <Beat at={from(1)}>
                  <span className="blip-box blip-switch blip-pop-in"><input type="checkbox" role="switch" className="blip-box" checked readOnly /></span>
                </Beat>
                <Beat at={from(2)}>
                  <div className="blip-box blip-progress blip-pop-in" style={{ inlineSize: p(50) }}><progress max={100} value={60}>60%</progress></div>
                </Beat>
                {/* The palette's name, last in the row: the row starts at a fixed place, so a longer name only reaches further right. */}
                <Beat at={from(3)}>
                  <span className="blip-box blip-tag blip-pop-in" data-variant="candy">{palette.name}</span>
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
  const fading = i > 0 && k < FADE;

  return (
    <Stage scheme="night" mosaicOut={at(4) - MOSAIC_FRAMES}>
      <Screen i={i} frame={frame} v />
      {fading && (
        <div style={{ position: "absolute", inset: 0, mask: bayerMask(16 - Math.round((16 * (k + 1)) / (FADE + 1))) }}>
          <Screen i={i - 1} frame={frame} v={false} />
        </div>
      )}
      <Pointer moves={MOVES} />

      <Sfx name="open" at={FRAME} volume={0.5} />
      {MOVES.map((m) => <Sfx key={m.at} name="look" at={m.at} volume={0.3} />)}
      {PICKS.slice(1).map((f, n) => <Sfx key={f} name={`blip@${[3, 5, 7, 7][n]}`} at={f} volume={0.6} />)}

      <Dither at={0} mode="in" />
      {music && <Music bar={COLOURS.bar} bars={COLOURS.bars} />}
    </Stage>
  );
};
