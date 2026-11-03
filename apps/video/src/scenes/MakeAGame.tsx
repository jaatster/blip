import { spriteCanvas } from "@jaatster/blip-game/canvas.js";
import { drawWorld } from "@jaatster/blip-effects/world.js";
import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { useCurrentFrame } from "remotion";
// Starfall's own art (the docs' game, apps/docs/public/js/starfall): Pip, the candy blocks.
// @ts-expect-error: plain JavaScript, without types
import { ART as STARFALL } from "../../../docs/public/js/starfall/art.js";
import { Beat } from "../lib/Beat";
import { TICK, at, p, ticks } from "../lib/grid";
import { Burst, Sprite, World, useCanvas } from "../lib/Pixels";
import { DropTitle, letterLands } from "../lib/Text";
import { Music, Sfx } from "../lib/Sound";
import { Stage } from "../lib/Stage";
import { DISSOLVE_FRAMES, Dissolve, MOSAIC_FRAMES, Mosaic } from "../lib/Transitions";

/** Bars 42-46 of the theme. */
export const MAKE_A_GAME = { bar: 42, bars: 5 };

type Art = { readonly tone: string; readonly map: string };
const ART = STARFALL as Record<string, Art>;

// Starfall, a game made of the game kit, on Blip's world at night, one thing at a time:
//   bars 0-1  its own title screen, full screen, for a bar and a half: STARFALL drops in, "Press start" blinks from
//             beat 2, Enter is pressed on bar 1 beat 1, and the picture breaks into the mosaic
//   bar 1     from beat 3 the level comes into focus out of the mosaic: the HUD, "1-1 Puddle Path" shouted in, Pip
//   bars 2-3  Pip runs right and jumps on the beat into three candy blocks: each bumps (up 6 pixels, then 3, then
//             down), a coin springs out spinning and bursts, "+100" pops over it, the counters go up, the block is
//             spent. The touch pad is up in the bottom corners, its D-pad and A pressed as he runs and jumps.
//   bar 4     "Level clear!" on beat 1 with a hop and stars; then the TV's dissolve takes the screen.
const TITLE = 2 * TICK;
const PROMPT = at(0, 2);
const PRESS = at(1, 1);
const LEVEL = at(1, 3);
const NAME = LEVEL + 2 * TICK;
const JUMPS = [at(2, 2), at(3), at(3, 2)];
const RUNS: readonly (readonly [from: number, to: number, x0: number, x1: number])[] = [
  [at(2), JUMPS[0]!, 40, 62],
  [JUMPS[0]! + 22, JUMPS[1]!, 62, 102],
  [JUMPS[1]! + 22, JUMPS[2]!, 102, 142],
  [JUMPS[2]! + 22, at(4), 142, 176],
];
const PAD = [at(2), at(4)] as const;
const CLEAR = at(4, 1);
const OUT = at(5) - DISSOLVE_FRAMES;

// The level is a 240 x 135 world seen twice as big, whole, as Starfall's camera shows its 320 x 180: big enough to
// read Pip. In it the grass top is row 124; Pip is 14 x 13 outlined, a block 12.
const LW = 240, LH = 135, ZOOM = 2;
const GROUND = 124;
const PIP_W = 14, PIP_H = 13;
const BLOCK = 12;
const BLOCK_Y = GROUND - PIP_H - 22 - BLOCK;
// A jump, a Blip frame a step: up to 22 pixels (the head meets the block at the top), and down again.
const ARC = [0, 8, 14, 18, 21, 22, 21, 18, 14, 8, 0];
const HIT = 5;
// A block's bump after the hit: up 6, then 3, then down.
const BUMP = [6, 6, 3, 3, 0];
// A coin from a block springs out, spinning, and drops back a little before it bursts (Starfall's own).
const RISE = [7, 13, 19, 23, 25, 26, 25, 24];
const SPIN = [1, 1, 0.7, 0.3, 0.7, 1];

/** Where Pip ends, the middle of him, in stage Blip pixels. */
export const PIP_END = { x: (RUNS.at(-1)![3] + PIP_W / 2) * ZOOM, y: (GROUND - PIP_H / 2) * ZOOM };

/** One of Starfall's sprites, drawn a Blip pixel per sprite pixel, flipped to face left if asked (Game kit uses it too). */
export const ArtSprite = ({ name, scale = 1, flip = false, style }: { readonly name: string; readonly scale?: number; readonly flip?: boolean; readonly style?: CSSProperties }) => {
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
  return <canvas ref={ref} style={{ imageRendering: "pixelated", display: "block", transform: flip ? "scaleX(-1)" : undefined, ...style }} />;
};

/** Where Pip is and which frame of him shows, a Blip frame at a time. */
function pip(frame: number): { x: number; y: number; art: string } {
  const run = RUNS.find(([from, to]) => frame >= from && frame < to);
  if (run) {
    const [from, to, x0, x1] = run, k = ticks(frame, from), n = Math.max(1, ticks(to, from));
    return { x: Math.round(x0 + ((x1 - x0) * Math.min(k, n)) / n), y: 0, art: Math.floor(k / 2) % 2 ? "pip-run-2" : "pip-run-1" };
  }
  const jump = JUMPS.find((j) => frame >= j && frame < j + ARC.length * TICK);
  const x = [...RUNS].reverse().find(([from]) => frame >= from)?.[3] ?? RUNS[0]![2];
  if (jump !== undefined) {
    const k = ticks(frame, jump);
    return { x, y: ARC[k]!, art: k <= HIT ? "pip-jump" : "pip-fall" };
  }
  // The happy hop at the end, a small one.
  const hop = ticks(frame, CLEAR);
  if (hop >= 0 && hop < 7) return { x, y: [0, 5, 8, 9, 8, 5, 0][hop]!, art: hop < 3 ? "pip-jump" : "pip-fall" };
  // Standing: he blinks now and then.
  return { x, y: 0, art: Math.floor(frame / TICK) % 40 < 2 ? "pip-blink" : "pip-idle" };
}

/** The night world at the level's own size, a pixel a Blip pixel (scaled with the level); the moon and the stars keep
 * clear of the HUD and the shouts. */
const LevelWorld = () => {
  const ref = useCanvas((ctx, el) => drawWorld(ctx, "night", LW, LH, { from: el, avoid: [[0, 0, LW, 20], [40, 34, 200, 70]] }), "night");
  return <canvas ref={ref} width={LW} height={LH} style={{ position: "absolute", inset: 0, inlineSize: "100%", blockSize: "100%", imageRendering: "pixelated" }} />;
};

const Shout = ({ text, at: from, until }: { readonly text: string; readonly at: number; readonly until: number }) => {
  const frame = useCurrentFrame();
  return (
    <Beat at={from} until={until}>
      <div className="blip-shout" style={{ position: "absolute", inset: 0, blockSize: p(170) }}>
        <p className="blip-shout-line blip-display blip-pop" data-scale="4" data-pop={text} data-leaving={frame >= until - 2 * TICK ? "" : undefined}>
          {text}
        </p>
      </div>
    </Beat>
  );
};

/** A block that Pip hits from below at `hit`: it bumps, a coin springs out and bursts, "+100" pops, it is spent. */
const Block = ({ x, hit }: { readonly x: number; readonly hit: number }) => {
  const frame = useCurrentFrame();
  const k = ticks(frame, hit);
  const bump = k >= 0 && k < BUMP.length ? BUMP[k]! : 0;
  const coin = k >= 0 && k < RISE.length;
  const score = k >= 1 && k < 16;
  return (
    <>
      <ArtSprite name={k >= 0 ? "block-spent" : "block"} style={{ position: "absolute", left: p(x), top: p(BLOCK_Y - bump) }} />
      {coin && (
        <div style={{ position: "absolute", left: p(x + 1), top: p(BLOCK_Y - 12 - RISE[k]!), inlineSize: p(10), display: "grid", justifyItems: "center" }}>
          <div style={{ transform: `scaleX(${SPIN[k % SPIN.length]})` }}><Sprite name="coin" /></div>
        </div>
      )}
      {k >= RISE.length && k < RISE.length + 6 && (
        <div style={{ position: "absolute", left: p(x - 1), top: p(BLOCK_Y - 12 - RISE.at(-1)! - 2) }}>
          <Sprite name={k - RISE.length >= 2 && k - RISE.length < 4 ? "sparkle" : "sparkle-small"} />
        </div>
      )}
      {score && (
        <span className="blip-display blip-pop" data-scale="1" data-pop="+100" style={{ position: "absolute", left: p(x - 6), top: p(BLOCK_Y - 26 - Math.min(k - 1, 3) * 2), visibility: k < 14 || k % 2 ? "visible" : "hidden" }}>
          +100
        </span>
      )}
    </>
  );
};

export const MakeAGame = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  const me = pip(frame);
  const hits = JUMPS.map((j) => j + HIT * TICK);
  const got = hits.filter((h) => frame >= h).length;
  const course = Math.round(((me.x - RUNS[0]![2]) / (RUNS.at(-1)![3] - RUNS[0]![2])) * 100);
  const pressed = frame >= PRESS && frame < PRESS + 3 * TICK;

  return (
    <Stage scheme="night" mosaicIn>
      {frame < LEVEL ? (
        // Starfall's title screen, as the game template has it, breaking into the mosaic once start is pressed.
        <Mosaic at={LEVEL - MOSAIC_FRAMES} mode="out">
          <World scheme="night" />
          <div className="v-center" style={{ gap: p(16), paddingBlockEnd: p(20) }}>
            <DropTitle text="Starfall" lands={letterLands("Starfall", TITLE, TICK)} scale={6} outline={2} />
            <div style={{ display: "grid", justifyItems: "center", gap: p(10), visibility: frame >= PROMPT ? "visible" : "hidden" }}>
              <Beat at={PROMPT} from={0}>
                <p className="blip-prompt-start blip-display blip-pop" data-scale="3" data-pop="Press start" style={{ margin: 0, animation: frame >= PRESS ? "none" : undefined }}>
                  Press start
                </p>
              </Beat>
              <p className="blip-prompt blip-outline" style={{ margin: 0, fontSize: "var(--blip-size-lead)" }}>
                or press{" "}
                <kbd className="blip-box blip-prompt-key" data-blip-state={pressed ? "active" : undefined}>Enter</kbd>
              </p>
            </div>
          </div>
        </Mosaic>
      ) : (
        <Mosaic at={LEVEL} mode="in">
          <div style={{ position: "absolute", left: 0, top: 0, inlineSize: p(LW), blockSize: p(LH), zoom: ZOOM }}>
            <LevelWorld />
            {JUMPS.map((j, i) => (
              <Block key={j} x={RUNS[i]![3] + (PIP_W - BLOCK) / 2} hit={hits[i]!} />
            ))}
            <Beat at={NAME}>
              <div className="blip-pop-in" style={{ position: "absolute", left: p(me.x), top: p(GROUND - PIP_H - me.y) }}>
                <ArtSprite name={me.art} />
              </div>
            </Beat>
          </div>

          <div className="blip-hud" style={{ position: "absolute", insetInline: p(8), top: p(4) }}>
            <div className="blip-hud-group">
              <span className="blip-hearts" role="img" aria-label="Health, 3 of 3">
                {[0, 1, 2].map((i) => <Sprite key={i} name="heart" />)}
              </span>
              <div className="blip-box blip-hud-track" role="meter" aria-label="Course" style={{ "--blip-hud-value": course } as CSSProperties}>
                <span className="blip-hud-track-fill" />
              </div>
            </div>
            <div className="blip-hud-group">
              <span className="blip-counter"><Sprite name="coin" /><span className="blip-counter-value blip-display blip-pop" data-scale="2" data-pop={String(got).padStart(3, "0")}>{String(got).padStart(3, "0")}</span></span>
              <span className="blip-counter"><span className="blip-counter-value blip-display blip-pop" data-scale="2" data-pop={String(got * 100).padStart(6, "0")}>{String(got * 100).padStart(6, "0")}</span></span>
            </div>
          </div>

          <Shout text="1-1 Puddle Path" at={NAME} until={at(2, 1)} />

          {/* The game kit's touch pad, shown as on a phone while Pip runs: right held, A on each jump. */}
          <Beat at={PAD[0]} until={PAD[1]}>
            <div className="blip-touch-pad blip-pop-in" data-show="always" data-position="inline" aria-label="Game controls" style={{ position: "absolute", insetInline: p(12), bottom: p(10) }}>
              <span className="blip-touch-pad-dpad">
                {(["up", "right", "down", "left"] as const).map((dir) => (
                  <span key={dir} className="blip-box blip-touch-pad-arm" data-dir={dir} role="button" data-blip-state={dir === "right" && RUNS.some(([f, t]) => frame >= f && frame < t) ? "active" : undefined}><span /></span>
                ))}
                <span className="blip-box blip-touch-pad-hub" aria-hidden="true" />
              </span>
              <span className="blip-touch-pad-buttons">
                <span className="blip-box blip-touch-pad-button" data-button="b" role="button">B</span>
                <span className="blip-box blip-touch-pad-button" data-button="a" role="button" data-blip-state={JUMPS.some((j) => frame >= j && frame < j + 4 * TICK) ? "active" : undefined}>A</span>
              </span>
            </div>
          </Beat>

          <Shout text="Level clear!" at={CLEAR} until={at(5)} />
          <Burst at={CLEAR + 2 * TICK} kind="star" box={[150, 90, 180, 40]} count={12} seed={4} scale={1} />
        </Mosaic>
      )}

      {letterLands("Starfall", TITLE, TICK).map((f, i) => <Sfx key={`t${f}`} name={i ? `step@${[0, 2, 3, 5, 7, 8, 10, 12][i]}` : "step"} at={f} volume={0.45} />)}
      <Sfx name="select" at={PRESS} volume={0.7} />
      <Sfx name="open" at={NAME} volume={0.5} />
      {JUMPS.map((j, i) => <Sfx key={j} name={i ? `jump@${[0, 3, 5][i]}` : "jump"} at={j} volume={0.4} />)}
      {hits.map((h) => <Sfx key={`b${h}`} name="bump" at={h} volume={0.45} />)}
      {hits.map((h, i) => <Sfx key={`c${h}`} name={["coin", "coin@4", "coin@7"][i]!} at={h + TICK} volume={0.5} />)}
      <Sfx name="jump@7" at={CLEAR} volume={0.35} />
      <Sfx name="success@5" at={CLEAR} volume={0.6} />

      {music && <Music bar={MAKE_A_GAME.bar} bars={MAKE_A_GAME.bars} />}
      <Dissolve at={OUT} mode="out" />
    </Stage>
  );
};
