import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { spriteCanvas } from "@jaatster/blip-game/canvas.js";
// Starfall's own art (the docs' game, apps/docs/public/js/starfall): Pip.
// @ts-expect-error: plain JavaScript, without types
import { ART as STARFALL } from "../../../docs/public/js/starfall/art.js";
import { Beat } from "../lib/Beat";
import { Big } from "../lib/Big";
import { TICK, at, p, ticks } from "../lib/grid";
import { Burst, Life, Sky, Sprite } from "../lib/Pixels";
import { Music, Sfx } from "../lib/Sound";
import { DemoFrame, HERO, SHOW_CLEAR, SplitText, type Part } from "../lib/Split";
import { Stage } from "../lib/Stage";
import { DISSOLVE_FRAMES, Dissolve } from "../lib/Transitions";

/** Bars 5-8 of the theme: the groove. */
export const MODULAR = { bar: 5, bars: 4 };

// Modular: a tower of real candy blocks on the night sky, one package each, dropping onto the one it is built on:
// tokens at the bottom, then core, components, and the kits on top. Each lands on its beat with a bump and a pitched
// step while its name and its line take the column. Then Pip drops onto the top, a coin pops up and confetti falls.
// Sizes are the build's gzipped measurements (apps/docs assets.json).
type Art = { readonly tone: string; readonly map: string };
const ART = STARFALL as Record<string, Art>;

const PARTS: readonly Part[] = [
  { at: at(0, 1), title: "Tokens", line: "Colours, sizes and the world's palettes. 3.8 KB." },
  { at: at(1), title: "Core", line: "The candy box every part is drawn with. 6 KB." },
  { at: at(2), title: "Components", line: "88 of them, on native HTML. 32 KB." },
  { at: at(2, 3), title: "Kits", line: "Game, effects, sound and blocks: add them when you want them." },
];
// The tower, in the 2x pixels it is drawn in: blocks 16 high, narrower as they go up, each landing on its beat, with
// room above it for Pip (the tower's top is 16 pixels down its box).
const BLOCKS = [
  { name: "Tokens", size: "3.8 KB", w: 148, land: at(0, 2) },
  { name: "Core", size: "6 KB", w: 134, land: at(1, 1) },
  { name: "Components", size: "32 KB", w: 122, land: at(2, 1) },
  { name: "Kits", size: "", w: 78, land: at(3) },
];
const H = 16;
const TW = 148, TH = 80;
const FALL = [-30, -16, -6, -1, 0];
const PIP_LAND = at(3, 1);
const COIN = at(3, 2);
const PIP_FALL = [-34, -22, -12, -4, 0];
const HOP = [0, 3, 5, 3, 0];

/** One of Starfall's sprites, a pixel per sprite pixel (inside Big, a 2x pixel). */
const ArtSprite = ({ name, style }: { readonly name: string; readonly style?: CSSProperties }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const el = ref.current, art = ART[name];
    const s = el && art && spriteCanvas(art, { from: el });
    if (!el || !s) return;
    el.width = s.width;
    el.height = s.height;
    el.style.inlineSize = p(s.width);
    el.style.blockSize = p(s.height);
    el.getContext("2d")!.drawImage(s, 0, 0);
  }, [name]);
  return <canvas ref={ref} style={{ imageRendering: "pixelated", display: "block", ...style }} />;
};

const Tower = ({ frame }: { readonly frame: number }) => {
  const top = TH - BLOCKS.length * H;
  // Pip: falls onto the top of the tower, lands, hops when the coin pops, then stands blinking.
  const pk = ticks(frame, PIP_LAND - (PIP_FALL.length - 1) * TICK);
  const hk = ticks(frame, COIN);
  const pipY = pk < PIP_FALL.length ? PIP_FALL[Math.max(0, pk)]! : hk >= 0 && hk < HOP.length ? -HOP[hk]! : 0;
  const pipArt = pk < PIP_FALL.length - 1 ? "pip-fall" : hk >= 0 && hk < 2 ? "pip-jump" : hk >= 2 && hk < HOP.length ? "pip-fall" : ticks(frame, PIP_LAND) % 14 === 12 ? "pip-blink" : "pip-idle";
  const coin = ticks(frame, COIN), RISE = [6, 11, 15, 18, 20, 21];
  return (
    <div style={{ position: "relative", inlineSize: p(TW), blockSize: p(TH) }}>
      {BLOCKS.map((b, i) => {
        const k = ticks(frame, b.land - (FALL.length - 1) * TICK);
        if (k < 0) return null;
        return (
          <Beat key={b.name} at={b.land}>
            <div
              className={k >= FALL.length - 1 ? "blip-bump" : undefined}
              style={{ position: "absolute", left: p((TW - b.w) / 2), top: p(TH - (i + 1) * H), translate: `0 ${p(FALL[Math.min(k, FALL.length - 1)]!)}` }}
            >
              <div
                className="blip-box blip-display"
                data-scale="1"
                data-variant="candy"
                data-tone="accent"
                style={{ inlineSize: p(b.w), blockSize: p(H - 2), display: "flex", alignItems: "center", justifyContent: "center", gap: p(6), color: "var(--blip-ink)", "--blip-r": 3, "--blip-shape": "var(--blip-shape-3)", "--blip-shape-inner": "var(--blip-shape-3-inner)", "--blip-band-top": 2, "--blip-band-bottom": 3 } as CSSProperties}
              >
                <span>{b.name}</span>
                {b.size && <span style={{ fontFamily: "var(--blip-font-body)", fontSize: "var(--blip-size-caption)", fontWeight: 700, letterSpacing: 0 }}>{b.size}</span>}
              </div>
            </div>
          </Beat>
        );
      })}

      {pk >= 0 && (
        <div style={{ position: "absolute", left: p(TW / 2 - 7), top: p(top - 13 + pipY) }}>
          <ArtSprite name={pipArt} />
        </div>
      )}
      {/* The coin springs up off to Pip's right, clear of the title above. */}
      {coin >= 0 && coin < RISE.length && <Sprite name="coin" style={{ position: "absolute", left: p(TW / 2 + 22), top: p(top - 4 - Math.round(RISE[coin]! / 2)) }} />}
    </div>
  );
};

export const Modular = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  return (
    <Stage scheme="night" mosaicIn>
      <AbsoluteFill>
        <Sky scheme="night" avoid={SHOW_CLEAR} />
        <Life avoid={SHOW_CLEAR} shooting={[at(1, 2)]} seed={51} />
      </AbsoluteFill>

      <SplitText eyebrow="Modular" parts={PARTS} />
      <DemoFrame at={BLOCKS[0]!.land - (FALL.length - 1) * TICK}>
        {/* The tower stands on the bottom of the hero, centred. */}
        <div style={{ position: "absolute", inset: 0, display: "grid", justifyItems: "center", alignItems: "end" }}>
          <Big x={2}>
            <Tower frame={frame} />
          </Big>
        </div>
      </DemoFrame>

      {/* The coin's sparkle and the confetti, in stage pixels: the tower's box is 2 x 80 high on the hero's bottom. */}
      <Burst at={COIN + 6 * TICK} kind="sparkle" box={[HERO.x + HERO.w / 2 + 44, HERO.y + HERO.h - 160 + 2 * (16 - 4 - 11) - 4, 24, 22]} count={6} seed={9} scale={2} />
      <Burst at={COIN} kind="confetti" box={[HERO.x + 30, HERO.y, HERO.w - 60, 6]} count={34} seed={12} scale={2} />

      {BLOCKS.map((b, i) => <Sfx key={b.name} name={i ? `step@${[0, 3, 5, 7][i]}` : "step"} at={b.land} volume={0.55} />)}
      {BLOCKS.map((b) => <Sfx key={`b${b.name}`} name="bump" at={b.land} volume={0.35} />)}
      <Sfx name="jump" at={PIP_LAND - 4 * TICK} volume={0.4} />
      <Sfx name="bump" at={PIP_LAND} volume={0.4} />
      <Sfx name="jump@5" at={COIN} volume={0.45} />
      <Sfx name="coin" at={COIN} volume={0.6} />
      <Sfx name="success@5" at={COIN + 2 * TICK} volume={0.45} />

      {music && <Music bar={MODULAR.bar} bars={MODULAR.bars} />}
      <Dissolve at={at(4) - DISSOLVE_FRAMES} mode="out" seed={3} />
    </Stage>
  );
};
