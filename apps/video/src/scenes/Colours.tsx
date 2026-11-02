import { spriteCanvas } from "@jaatster/blip-game/canvas.js";
import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
// Starfall's own art (the docs' game, apps/docs/public/js/starfall): Pip.
// @ts-expect-error: plain JavaScript, without types
import { ART as STARFALL } from "../../../docs/public/js/starfall/art.js";
import { Beat } from "../lib/Beat";
import { BEAT, TICK, at, p, ticks } from "../lib/grid";
import { Big } from "../lib/Big";
import { Icon } from "../lib/Icon";
import { Burst, Dither, Life, Sky, bayerMask } from "../lib/Pixels";
import { type Move, Pointer, over, pressing } from "../lib/Pointer";
import { Music, Sfx } from "../lib/Sound";
import { DemoFrame, SPLIT_CLEAR, SplitText } from "../lib/Split";
import { Snap } from "../lib/Snap";
import { Stage } from "../lib/Stage";
import { MOSAIC_FRAMES } from "../lib/Transitions";

/** Bars 17-20 of the theme: the groove again. */
export const COLOURS = { bar: 17, bars: 4 };

type Art = { readonly tone: string; readonly map: string };
const ART = STARFALL as Record<string, Art>;

// The palette's name and what it is, over the docs home's accent swatches standing big on the sky, and Pip by a
// candy Play button. Attract mode's pointer picks the next swatch every three beats
// (1.2 s); the whole screen takes the palette through the ordered dither (its night sky, page, ink and accent), and
// Pip hops for joy and the button sparkles.
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

// The hero, standing on the night sky: the swatches three times the size along the top, and under them Pip beside a
// Play button twice the size. Pip (14 x 13) is drawn three times as big and hops a few pixels on each pick.
const HOP = [0, 8, 14, 16, 14, 8, 0];
const ROW = 80;
/** Where the Play button lands on the stage, roughly, for the sparkles. */
const BUTTON = { x: 219, y: 142, w: 112, h: 48 };

/** One of Starfall's sprites, drawn a Blip pixel per sprite pixel (or `scale`). */
const ArtSprite = ({ name, scale = 1, style }: { readonly name: string; readonly scale?: number; readonly style?: CSSProperties }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const el = ref.current, art = ART[name];
    const s = el && art && spriteCanvas(art, { from: el });
    if (!el || !s) return;
    el.width = s.width;
    el.height = s.height;
    el.style.inlineSize = p(s.width * scale);
    el.style.blockSize = p(s.height * scale);
    el.getContext("2d")!.drawImage(s, 0, 0);
  }, [name, scale]);
  return <canvas ref={ref} style={{ imageRendering: "pixelated", display: "block", ...style }} />;
};

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
  const k = i > 0 ? ticks(frame, PICKS[i]! + 2 * TICK) : -1;
  const hop = k >= 0 && k < HOP.length ? HOP[k]! : 0;
  const blink = frame % 90 > 84;
  return (
    <AbsoluteFill data-blip-scheme="night" data-blip-palette={palette.id || undefined} style={{ background: "var(--blip-bg)" }}>
      <Sky key={`s${palette.id}`} scheme="night" palette={palette.id} avoid={SPLIT_CLEAR} />
      <Life avoid={SPLIT_CLEAR} seed={21} shooting={[at(2, 1)]} />
      <SplitText eyebrow="Your colours" parts={PARTS} />

      <DemoFrame at={FRAME}>
        {/* The docs home's swatches, big, standing on the sky. */}
        <div style={{ position: "absolute", insetInline: 0, top: 0, display: "grid", justifyItems: "center" }}>
          <Big x={3}>
            <div style={{ display: "flex", gap: p(4) }}>
              {PALETTES.map((sw, n) => <Swatch key={sw.name} n={n} i={i} frame={frame} v={v} />)}
            </div>
          </Big>
        </div>

        <div style={{ position: "absolute", insetInline: 0, top: p(ROW), display: "grid", justifyItems: "center" }}>
          <Snap>
            <div style={{ display: "flex", alignItems: "end", gap: p(28) }}>
              <div style={{ translate: `0 ${p(-hop)}` }}>
                <ArtSprite name={hop > 0 ? "pip-jump" : blink ? "pip-blink" : "pip-idle"} scale={3} />
              </div>
              <Beat at={i > 0 ? PICKS[i]! : FRAME}>
                <div className="v-x2" data-blip-pixel="">
                  <span className="blip-box blip-button" data-size="lg"><Icon name="play" />Play</span>
                </div>
              </Beat>
            </div>
          </Snap>
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
      {PICKS.slice(1).map((f, n) => (
        <Burst key={f} at={f + 3 * TICK} kind="sparkle" box={[BUTTON.x, BUTTON.y, BUTTON.w, BUTTON.h]} count={8} seed={n + 3} />
      ))}
      <Pointer moves={MOVES} />

      <Sfx name="open" at={FRAME} volume={0.5} />
      {MOVES.map((m) => <Sfx key={m.at} name="look" at={m.at} volume={0.3} />)}
      {PICKS.slice(1).map((f, n) => <Sfx key={f} name={`blip@${[3, 5, 7, 7][n]}`} at={f} volume={0.6} />)}
      {PICKS.slice(1).map((f) => <Sfx key={`j${f}`} name="jump" at={f + 2 * TICK} volume={0.35} />)}
      {PICKS.slice(1).map((f, n) => <Sfx key={`c${f}`} name={n ? `coin@${[0, 4, 7, 12][n]}` : "coin"} at={f + 3 * TICK} volume={0.4} />)}

      <Dither at={0} mode="in" />
      {music && <Music bar={COLOURS.bar} bars={COLOURS.bars} />}
    </Stage>
  );
};
