import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { spriteCanvas } from "@jaatster/blip-game/canvas.js";
// Starfall's own art (the docs' game, apps/docs/public/js/starfall): Pip.
// @ts-expect-error: plain JavaScript, without types
import { ART as STARFALL } from "../../../docs/public/js/starfall/art.js";
import { Beat } from "../lib/Beat";
import { TICK, at, p, ticks } from "../lib/grid";
import { Icon } from "../lib/Icon";
import { Burst, Life, Sky, Sprite, World, bayerMask } from "../lib/Pixels";
import { Music, Sfx } from "../lib/Sound";
import { DemoFrame, SPLIT_CLEAR, SplitText, type Part } from "../lib/Split";
import { Stage } from "../lib/Stage";
import { DISSOLVE_FRAMES, Dissolve } from "../lib/Transitions";

/** Bars 5-8 of the theme: the groove. */
export const MODULAR = { bar: 5, bars: 4 };

// Modular: each package plugs in and the little scene on the right gains what it brings. Left, the package's name and
// what it is (sizes are the build's gzipped measurements, apps/docs assets.json); right, a frame that starts as ink:
//   Tokens      the world's colours arrive, dithering in out of the ink
//   Core        a bare candy box drops onto the hill and bumps
//   Components  the box becomes a real Play button, and a HUD (hearts, a coin counter) pops in
//   Game kit    Pip pops in, hops over and jumps onto Play: it is pressed, a coin springs up, confetti
type Art = { readonly tone: string; readonly map: string };
const ART = STARFALL as Record<string, Art>;

const PARTS: readonly Part[] = [
  { at: at(0, 1), title: "Tokens", line: "Colours, sizes and the world's palettes. 3.8 KB." },
  { at: at(1), title: "Core", line: "The candy box every part is drawn with. 6 KB." },
  { at: at(2), title: "Components", line: "88 of them, on native HTML. 32 KB." },
  { at: at(2, 3), title: "Game kit", line: "Sprites, a HUD, dialogue and shouts." },
];
const FRAME = at(0, 1);
const COLOURS = at(0, 2, 2);
const DROP = at(1, 1);
const BUTTON = at(2, 1);
const HUD = at(2, 2);
const PIP = at(2, 3);
const HOP = at(3);
const JUMP = at(3, 1);

// The demo is a 128 x 111 world seen twice as big, whole, like Starfall's camera; its grass top is row 101.
const LW = 128, LH = 111, GROUND = 101;
const BOX = { x: 62, w: 46, h: 24 };
const FALL = [-60, -34, -14, -4, 0];
const HOP_ARC = [0, 4, 6, 4, 0];
const JUMP_ARC = [0, 8, 15, 20, 23, 25, 25, 24];
const PIP_X = [12, 34];
const PIP_H = 13;

/** One of Starfall's sprites, a world pixel per sprite pixel. */
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

/** Where Pip is and which frame of him shows. */
function pip(frame: number) {
  if (frame < JUMP) {
    const k = ticks(frame, HOP);
    if (k < 0) return { x: PIP_X[0]!, y: GROUND, art: ticks(frame, PIP) % 12 === 10 ? "pip-blink" : "pip-idle" };
    if (k < HOP_ARC.length) return { x: Math.round(PIP_X[0]! + ((PIP_X[1]! - PIP_X[0]!) * (k + 1)) / HOP_ARC.length), y: GROUND - HOP_ARC[k]!, art: "pip-run-1" };
    return { x: PIP_X[1]!, y: GROUND, art: "pip-idle" };
  }
  // The jump: up off the grass and over onto the top of the button, moving right as he rises.
  const k = ticks(frame, JUMP), top = GROUND - BOX.h;
  if (k < JUMP_ARC.length) {
    const x = Math.round(PIP_X[1]! + ((BOX.x + 12 - PIP_X[1]!) * (k + 1)) / JUMP_ARC.length);
    return { x, y: GROUND - JUMP_ARC[k]!, art: k < 5 ? "pip-jump" : "pip-fall" };
  }
  const land = k - JUMP_ARC.length, drop = [-1, 0][Math.min(land, 1)]!;
  return { x: BOX.x + 12, y: top + drop, art: land < 2 ? "pip-fall" : "pip-idle" };
}
const LANDED = JUMP + 9 * TICK;

const Demo = ({ frame }: { readonly frame: number }) => {
  const level = Math.min(16, Math.max(0, 2 * (ticks(frame, COLOURS) + 1)));
  const k = ticks(frame, DROP - 4 * TICK);
  const pressed = frame >= LANDED && frame < LANDED + 3 * TICK;
  const coins = frame >= LANDED + TICK ? 1 : 0;
  const me = pip(frame);
  return (
    <div style={{ position: "absolute", inset: 0, background: "var(--blip-ink)" }}>
      {/* The 128 x 111 layer, seen twice as big. */}
      <div style={{ position: "absolute", left: 0, top: 0, inlineSize: p(LW), blockSize: p(LH), zoom: 2 }}>
        {level > 0 && (
          <div style={{ position: "absolute", inset: 0, mask: level < 16 ? bayerMask(level) : undefined }}>
            <World scheme="night" w={LW} h={LH} />
          </div>
        )}

        {frame >= HUD && (
          <Beat at={HUD}>
            <div className="blip-pop-in" style={{ position: "absolute", left: p(5), top: p(5), display: "flex", alignItems: "center", gap: p(6) }}>
              <span className="blip-hearts" style={{ display: "flex", gap: p(1) }}>
                {[0, 1, 2].map((i) => <Sprite key={i} name="heart" />)}
              </span>
              <span className="blip-counter" style={{ display: "inline-flex", alignItems: "center", gap: p(2) }}>
                <Sprite name="coin" />
                <Beat at={LANDED + TICK} from={HUD}>
                  <span className={`blip-counter-value blip-display blip-pop${coins ? " blip-bump" : ""}`} data-scale="1" data-pop={`00${coins}`}>{`00${coins}`}</span>
                </Beat>
              </span>
            </div>
          </Beat>
        )}

        {k >= 0 && (
          <Beat at={frame >= BUTTON ? BUTTON : DROP}>
            <div
              className={frame >= BUTTON ? "blip-pop-in" : k >= FALL.length - 1 ? "blip-bump" : undefined}
              style={{ position: "absolute", left: p(BOX.x), top: p(GROUND - BOX.h), translate: `0 ${p(FALL[Math.min(k, FALL.length - 1)]!)}` }}
            >
              {frame < BUTTON ? (
                <span className="blip-box" data-variant="candy" data-tone="accent" style={{ display: "block", inlineSize: p(BOX.w), blockSize: p(BOX.h), "--blip-r": 4, "--blip-shape": "var(--blip-shape-4)", "--blip-shape-inner": "var(--blip-shape-4-inner)" } as CSSProperties} />
              ) : (
                <span className="blip-box blip-button" data-size="lg" data-blip-state={pressed ? "active" : undefined} style={{ position: "relative", inlineSize: p(BOX.w), paddingInline: 0 }}>
                  <Icon name="play" />Play
                  <span className="blip-glint" aria-hidden="true" />
                </span>
              )}
            </div>
          </Beat>
        )}

        {frame >= PIP && (
          <Beat at={PIP}>
            <div className={frame < HOP ? "blip-pop-in" : undefined} style={{ position: "absolute", left: p(me.x), top: p(me.y - PIP_H + (pressed ? 1 : 0)) }}>
              <ArtSprite name={me.art} />
            </div>
          </Beat>
        )}

        {/* The coin Play gives: it springs up off the button and bursts. */}
        {(() => {
          const c = ticks(frame, LANDED + TICK), RISE = [6, 11, 15, 18, 20, 21];
          return c >= 0 && c < RISE.length ? <Sprite name="coin" style={{ position: "absolute", left: p(BOX.x + BOX.w - 12), top: p(GROUND - BOX.h - 10 - RISE[c]!) }} /> : null;
        })()}
      </div>

    </div>
  );
};

export const Modular = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  return (
    <Stage scheme="night" mosaicIn>
      <AbsoluteFill>
        <Sky scheme="night" avoid={SPLIT_CLEAR} />
        <Life avoid={SPLIT_CLEAR} shooting={[at(1, 2)]} seed={51} />
      </AbsoluteFill>

      <SplitText eyebrow="Modular" parts={PARTS} />
      <DemoFrame at={FRAME}>
        <Demo frame={frame} />
      </DemoFrame>
      {/* Bursts over the demo, in stage pixels: the frame's top left is (200, 24) and its world is twice as big. */}
      <Burst at={COLOURS + 8 * TICK} kind="sparkle" box={[236, 50, 184, 110]} count={10} seed={5} scale={2} />
      <Burst at={LANDED + 7 * TICK} kind="sparkle" box={[200 + 2 * (BOX.x + BOX.w - 14), 24 + 2 * (GROUND - BOX.h - 33), 24, 20]} count={6} seed={9} scale={2} />
      <Burst at={LANDED} kind="confetti" box={[214, 28, 228, 8]} count={30} seed={12} scale={2} />

      {PARTS.map((pt, i) => <Sfx key={pt.title} name={i ? `step@${[0, 3, 5, 7][i]}` : "step"} at={pt.at} volume={0.4} />)}
      <Sfx name="open" at={FRAME} volume={0.5} />
      {[0, 1, 2, 3].map((n) => <Sfx key={`c${n}`} name={`blip@${[0, 3, 5, 7][n]}`.replace("@0", "")} at={COLOURS + n * 2 * TICK} volume={0.35} />)}
      <Sfx name="bump" at={DROP} volume={0.6} />
      <Sfx name="select@5" at={BUTTON} volume={0.55} />
      <Sfx name="open" at={HUD} volume={0.45} />
      <Sfx name="blip" at={PIP} volume={0.5} />
      <Sfx name="jump" at={HOP} volume={0.4} />
      <Sfx name="jump@5" at={JUMP} volume={0.5} />
      <Sfx name="select" at={LANDED} volume={0.65} />
      <Sfx name="coin" at={LANDED + TICK} volume={0.6} />
      <Sfx name="success@5" at={LANDED + 3 * TICK} volume={0.45} />

      {music && <Music bar={MODULAR.bar} bars={MODULAR.bars} />}
      <Dissolve at={at(4) - DISSOLVE_FRAMES} mode="out" seed={3} />
    </Stage>
  );
};
