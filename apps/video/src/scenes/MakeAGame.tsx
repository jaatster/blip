import { spriteCanvas } from "@jaatster/blip-game/canvas.js";
import { drawWorld } from "@jaatster/blip-effects/world.js";
import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { useCurrentFrame } from "remotion";
// Starfall's own art (the docs' game, apps/docs/public/js/starfall): Pip, the candy blocks.
// @ts-expect-error: plain JavaScript, without types
import { ART as STARFALL } from "../../../docs/public/js/starfall/art.js";
import { Beat } from "../lib/Beat";
import { TICK, at, p, ticks } from "../lib/grid";
import { Burst, Sprite, useCanvas } from "../lib/Pixels";
import { Music, Sfx } from "../lib/Sound";
import { Stage } from "../lib/Stage";
import { IRIS_FRAMES, Iris } from "../lib/Transitions";

/** Bars 35-40 of the theme. */
export const MAKE_A_GAME = { bar: 35, bars: 6 };

type Art = { readonly tone: string; readonly map: string };
const ART = STARFALL as Record<string, Art>;

// A level of Starfall made of the game kit, on Blip's world at night, one thing at a time:
//   bar 0     the HUD is up, the level's name is shouted in, Pip pops in
//   bars 1-2  Pip runs right and jumps on the beat into three candy blocks: each bumps (up 6 pixels, then 3, then
//             down), a coin springs out spinning and bursts, "+100" pops over it, the counters go up, the block is
//             spent. The touch pad is up in the bottom corners, its D-pad and A pressed as he runs and jumps.
//   bars 2-4  Pip stops and talks in the dialogue box; his line ends in a question and the choices come up, the glove
//             poking at "Yes!", which is pressed.
//   bars 4-5  "Level clear!" with a hop and stars; the tally counts the coins and blocks up to the score and lands
//             three stars; an achievement slides in.
const NAME = at(0, 1);
const JUMPS = [at(1), at(1, 2), at(2)];
const RUNS: readonly (readonly [from: number, to: number, x0: number, x1: number])[] = [
  [at(0, 3), JUMPS[0]!, 24, 62],
  [JUMPS[0]! + 22, JUMPS[1]!, 62, 102],
  [JUMPS[1]! + 22, JUMPS[2]!, 102, 142],
  [JUMPS[2]! + 22, at(2, 2), 142, 176],
];
const PAD = [at(0, 3), at(2, 2)] as const;
const TALK = at(2, 2);
const LINE = "I'm Pip! Every block and coin here is Blip's game kit. Make your own?";
const EVERY = 1;
const CHOICES = at(3, 2);
const PICK = at(4);
const CLEAR = at(4, 1);
const TALLY = at(4, 3);
const TROPHY = at(5, 1);
const OUT = at(6) - 8 * TICK;

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

/** Where Pip ends, the middle of him, in stage Blip pixels: for an iris to close on. */
export const PIP_END = { x: (RUNS.at(-1)![3] + PIP_W / 2) * ZOOM, y: (GROUND - PIP_H / 2) * ZOOM };

/** One of Starfall's sprites, drawn a Blip pixel per sprite pixel, flipped to face left if asked. */
const ArtSprite = ({ name, scale = 1, flip = false, style }: { readonly name: string; readonly scale?: number; readonly flip?: boolean; readonly style?: CSSProperties }) => {
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

/** The tally's rows: what was counted, how, and what it was worth. */
const TALLY_ROWS = [
  ["Coins", "3 × 100", 300],
  ["Blocks", "3 × 50", 150],
] as const;
/** A tally value counting up from 0 at `from`, in eight whole steps a Blip frame apart. */
const count = (frame: number, from: number, value: number) => Math.round((value * Math.min(8, Math.max(0, ticks(frame, from) + 1))) / 8);

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
  const typed = Math.max(0, Math.min(LINE.length, Math.floor((frame - TALK - 4 * TICK) / EVERY) + 1));
  const course = Math.round(((me.x - RUNS[0]![2]) / (RUNS.at(-1)![3] - RUNS[0]![2])) * 100);

  return (
    <Stage scheme="night">
      <div style={{ position: "absolute", left: 0, top: 0, inlineSize: p(LW), blockSize: p(LH), zoom: ZOOM }}>
        <LevelWorld />
        {JUMPS.map((j, i) => (
          <Block key={j} x={RUNS[i]![3] + (PIP_W - BLOCK) / 2} hit={hits[i]!} />
        ))}
        <Beat at={at(0, 2)} from={at(0, 2)}>
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

      <Shout text="1-1 Puddle Path" at={NAME} until={at(0, 3, 2)} />

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


      <Beat at={frame >= CHOICES ? CHOICES : TALK} from={TALK} until={CLEAR}>
        <div className="blip-box blip-dialogue blip-pop-in" style={{ position: "absolute", left: p(70), right: p(70), top: p(72) }}>
          <span className="blip-box blip-dialogue-name" data-tone="green">Pip</span>
          <div className="blip-box blip-dialogue-portrait" data-variant="soft" data-tone="green" aria-hidden="true">
            <ArtSprite name={typed < LINE.length && Math.floor(frame / (2 * TICK)) % 2 ? "pip-blink" : "pip-idle"} scale={2} />
          </div>
          <div className="blip-dialogue-body">
            <div className="blip-dialogue-text">
              <p>
                {LINE.slice(0, typed)}
                <span className="blip-dialogue-rest">{LINE.slice(typed)}</span>
              </p>
            </div>
            <div className="blip-dialogue-choices" style={{ visibility: frame >= CHOICES ? "visible" : "hidden" }}>
              <ul className="blip-choices" role="list">
                {["Yes!", "Later"].map((label, n) => (
                  <li key={label}>
                    <button className="blip-box blip-choice" type="button" data-variant="ghost" data-blip-state={n === 0 && frame >= CHOICES ? (frame >= PICK && frame < PICK + 3 * TICK ? "focus active" : "focus") : undefined}>
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Beat>

      <Shout text="Level clear!" at={CLEAR} until={TALLY} />
      <Burst at={CLEAR + 2 * TICK} kind="star" box={[150, 60, 180, 50]} count={12} seed={4} scale={1} />

      {/* The game kit's tally: each row counts up a whole step a frame, then the stars land, then the total. */}
      <Beat at={TALLY} until={OUT + 8 * TICK}>
        <div className="blip-box blip-pop-in" data-variant="panel" style={{ position: "absolute", left: p(60), top: p(52), inlineSize: p(180), padding: p(10) }}>
          <div className="blip-tally">
            <div className="blip-tally-stars" role="img" aria-label="3 stars of 3" style={{ display: "flex", justifyContent: "center", gap: p(4) }}>
              {[0, 1, 2].map((n) => <Sprite key={n} name={frame >= TALLY + (10 + 2 * n) * TICK ? "star" : "star-empty"} scale={2} />)}
            </div>
            <dl className="blip-tally-rows">
              {TALLY_ROWS.map(([label, detail, value], n) => {
                const shown = count(frame, TALLY + n * 4 * TICK, value);
                return (
                  <div key={label} className="blip-tally-row">
                    <dt>{label}</dt>
                    <dd className="blip-tally-detail">{detail}</dd>
                    <dd className="blip-tally-value blip-display blip-pop" data-pop={String(shown)}>{shown}</dd>
                  </div>
                );
              })}
              <div className="blip-tally-row" data-total>
                <dt>Score</dt>
                <dd className="blip-tally-value blip-display blip-pop" data-scale="2" data-pop={String(count(frame, TALLY + 16 * TICK, 450))}>{count(frame, TALLY + 16 * TICK, 450)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </Beat>

      {/* An achievement for it, sliding in with its sparkles. */}
      <Beat at={TROPHY} until={OUT + 8 * TICK}>
        <div className="blip-achievements" role="status" style={{ position: "absolute", right: p(10), top: p(34), inlineSize: p(196) }}>
          <div className="blip-box blip-achievement">
            <span className="blip-box blip-achievement-icon"><Sprite name="trophy" /><span className="blip-achievement-sparkles" /></span>
            <p className="blip-achievement-label">Achievement unlocked</p>
            <p className="blip-achievement-title">Block buster</p>
            <p className="blip-achievement-text">Bump every block.</p>
          </div>
        </div>
      </Beat>

      <Sfx name="open" at={NAME} volume={0.5} />
      {JUMPS.map((j, i) => <Sfx key={j} name={i ? `jump@${[0, 3, 5][i]}` : "jump"} at={j} volume={0.4} />)}
      {hits.map((h) => <Sfx key={`b${h}`} name="bump" at={h} volume={0.45} />)}
      {hits.map((h, i) => <Sfx key={`c${h}`} name={["coin", "coin@4", "coin@7"][i]!} at={h + TICK} volume={0.5} />)}
      <Sfx name="open" at={TALK} volume={0.5} />
      {Array.from({ length: Math.ceil(LINE.length / 4) }, (_, n) => (
        // Pip's voice: a soft blip every fourth letter.
        <Sfx key={`v${n}`} name={["blip@5", "blip@7", "blip@5", "blip@3"][n % 4]!} at={TALK + 4 * TICK + Math.round(n * 4 * EVERY)} volume={0.16} />
      ))}
      <Sfx name="look" at={CHOICES} volume={0.45} />
      <Sfx name="select" at={PICK} volume={0.6} />
      {TALLY_ROWS.map(([label], n) => <Sfx key={label} name={["coin@5", "coin@7"][n]!} at={TALLY + n * 4 * TICK + 2 * TICK} volume={0.4} />)}
      {[0, 1, 2].map((n) => <Sfx key={`s${n}`} name={["step@7", "step@10", "step@12"][n]!} at={TALLY + (10 + 2 * n) * TICK} volume={0.45} />)}
      <Sfx name="coin@12" at={TALLY + 18 * TICK} volume={0.45} />
      <Sfx name="success@7" at={TROPHY} volume={0.5} />
      <Sfx name="jump@7" at={CLEAR} volume={0.35} />
      <Sfx name="success@5" at={CLEAR} volume={0.6} />

      {music && <Music bar={MAKE_A_GAME.bar} bars={MAKE_A_GAME.bars} />}
      <Iris at={0} mode="in" x={(24 + PIP_W / 2) * ZOOM} y={(GROUND - PIP_H / 2) * ZOOM} />
      <Iris at={at(6) - IRIS_FRAMES} mode="out" x={PIP_END.x} y={PIP_END.y} />
    </Stage>
  );
};
