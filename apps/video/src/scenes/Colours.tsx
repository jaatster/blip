import { spriteCanvas } from "@jaatster/blip-game/canvas.js";
import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
// Starfall's own art (the docs' game, apps/docs/public/js/starfall): Pip.
// @ts-expect-error: plain JavaScript, without types
import { ART as STARFALL } from "../../../docs/public/js/starfall/art.js";
import { Beat } from "../lib/Beat";
import { BEAT, TICK, at, p, ticks } from "../lib/grid";
import { Burst, Dither, Life, Sky, World, bayerMask } from "../lib/Pixels";
import { type Move, Pointer, over, pressing } from "../lib/Pointer";
import { Music, Sfx } from "../lib/Sound";
import { DemoFrame, RIGHT, SPLIT_CLEAR, SplitText } from "../lib/Split";
import { Snap } from "../lib/Snap";
import { Stage } from "../lib/Stage";
import { MOSAIC_FRAMES } from "../lib/Transitions";

/** Bars 17-20 of the theme: the groove again. */
export const COLOURS = { bar: 17, bars: 4 };

type Art = { readonly tone: string; readonly map: string };
const ART = STARFALL as Record<string, Art>;

// Left: the palette's name and what it is. Right: a little night on a hill, Pip by a candy Play button, and the docs
// home's accent swatches on a panel. Attract mode's pointer picks the next swatch every three beats
// (1.2 s); the whole screen takes the palette through the ordered dither (its night sky, page, ink and accent), and
// Pip hops for joy and the button sparkles.
const PALETTES = [
  { id: "", name: "Candy", line: "12 palettes, or make your own. Candy is Blip's own." },
  { id: "mint", name: "Mint", line: "Mint on a green ash night." },
  { id: "grape", name: "Grape", line: "The TV's own night: grape on indigo." },
  { id: "bubblegum", name: "Bubblegum", line: "Bubblegum on a pink dusk." },
  { id: "ember", name: "Ember", line: "Warm ember on charcoal." },
];
const PICKS = [0, 68, 128, 188, 248];
const PARTS = PALETTES.map((pl, i) => ({ at: PICKS[i]! + 4, title: pl.name, line: pl.line }));
const MOVES: readonly Move[] = PICKS.slice(1).map((f, n) => ({ at: f - BEAT, to: `[data-v="sw-${n + 1}"]`, press: f }));
const FRAME = at(0, 1);

// The demo, in its own 300 x 176 world: the grass top is row 159; Pip (14 x 13) is shown twice as big.
const FW = RIGHT.w, FH = RIGHT.h;
const GROUND = 159;
const PIP = { x: 84, w: 28, h: 26 };
const HOP = [0, 6, 10, 12, 10, 6, 0];
const BUTTON = { x: 168, y: 112 };

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
        display: "inline-grid", placeItems: "center", inlineSize: p(20), blockSize: p(20), margin: `0 ${p(1)} ${p(1)} 0`,
      } as CSSProperties}
    >
      <span style={{ display: n === i ? "block" : "none", inlineSize: p(6), blockSize: p(6), background: "var(--blip-tone-on)" }} />
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
        <World key={`w${palette.id}`} scheme="night" w={FW} h={FH} />

        {/* The docs home's swatches on a panel, over the hill. */}
        <div style={{ position: "absolute", insetInline: 0, top: p(14), display: "grid", justifyItems: "center" }}>
          <Snap>
            <div className="blip-box blip-card" style={{ display: "grid", gap: p(6) }}>
              <span className="blip-label">Accent</span>
              <div style={{ display: "flex", gap: p(5) }}>
                {PALETTES.map((sw, n) => <Swatch key={sw.name} n={n} i={i} frame={frame} v={v} />)}
              </div>
            </div>
          </Snap>
        </div>

        <Beat at={i > 0 ? PICKS[i]! : FRAME}>
          <span className="blip-box blip-button" data-size="lg" style={{ position: "absolute", left: p(BUTTON.x), top: p(BUTTON.y) }}>
            Play
          </span>
        </Beat>
        <div style={{ position: "absolute", left: p(PIP.x), top: p(GROUND - PIP.h - hop) }}>
          <ArtSprite name={hop > 0 ? "pip-jump" : blink ? "pip-blink" : "pip-idle"} scale={2} />
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
        <Burst key={f} at={f + 3 * TICK} kind="sparkle" box={[RIGHT.x + BUTTON.x, RIGHT.y + BUTTON.y, 44, 24]} count={8} seed={n + 3} />
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
