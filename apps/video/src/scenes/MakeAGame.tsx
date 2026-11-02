import type { CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Beat } from "../lib/Beat";
import { BEAT, TICK, at, p, ticks } from "../lib/grid";
import { BRAMBLE } from "../lib/bramble";
import { Burst, Dither, Sprite, World } from "../lib/Pixels";
import { Music, Sfx } from "../lib/Sound";
import { Stage } from "../lib/Stage";

/** Bars 27-32 of the theme: the end of the hook, then the groove. */
export const MAKE_A_GAME = { bar: 27, bars: 6 };

// A level made of the game kit, on Blip's world at night: its HUD along the top, the level's name shouted in, then
// Bramble (the game template's frog) hops right a beat at a time, a coin over each hop, and the counter, the score
// and the course track go up with each one. Bramble says a line in the dialogue box, and the level is clear.
const NAME = at(0, 1);
const HOPS = Array.from({ length: 8 }, (_, i) => at(1) + i * BEAT);
const TALK = at(3);
const LINE = "Hi, I'm Bramble! Every bit of this is Blip's game kit.";
const EVERY = 2;
const CLEAR = at(5);
const OUT = at(6) - 8 * TICK;

// The level: the grass top is row 249 of the 480 x 270 world; Bramble is 24 x 20 and hops 36 pixels a beat.
const GROUND = 249;
const START_X = 70, STEP_X = 36;
const ARC = [0, 8, 13, 15, 13, 8, 0];
const COINS = HOPS.map((_, i) => START_X + i * STEP_X + STEP_X / 2 + 12);

/** Where Bramble is: x along the ground and how high in the air, a Blip frame at a time. */
function bramble(frame: number) {
  const done = HOPS.filter((h) => h + ARC.length * TICK <= frame).length;
  const hop = HOPS.find((h) => frame >= h && frame < h + ARC.length * TICK);
  if (hop === undefined) return { x: START_X + done * STEP_X, y: 0 };
  const k = ticks(frame, hop);
  return { x: Math.round(START_X + (done + (k + 1) / ARC.length) * STEP_X), y: ARC[k]! };
}

const Shout = ({ text, at: from, until, tone }: { readonly text: string; readonly at: number; readonly until: number; readonly tone?: string }) => {
  const frame = useCurrentFrame();
  return (
    <Beat at={from} until={until}>
      <div className="blip-shout" style={{ position: "absolute", inset: 0, blockSize: p(170) }}>
        <p className="blip-shout-line blip-display blip-pop" data-scale="4" data-tone={tone} data-pop={text} data-leaving={frame >= until - 2 * TICK ? "" : undefined}>
          {text}
        </p>
      </div>
    </Beat>
  );
};

export const MakeAGame = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  const b = bramble(frame);
  const got = HOPS.filter((h) => frame >= h + 3 * TICK).length;
  const typed = Math.max(0, Math.min(LINE.length, Math.floor((frame - TALK - 4 * TICK) / EVERY) + 1));

  return (
    <Stage scheme="night">
      <AbsoluteFill>
        <World scheme="night" />
      </AbsoluteFill>

      <div className="blip-hud" style={{ position: "absolute", insetInline: p(8), top: p(4) }}>
        <div className="blip-hud-group">
          <span className="blip-hearts" role="img" aria-label="Health, 3 of 3">
            {[0, 1, 2].map((i) => <Sprite key={i} name="heart" />)}
          </span>
          <div className="blip-box blip-hud-track" role="meter" aria-label="Course" style={{ "--blip-hud-value": Math.round((got / HOPS.length) * 100) } as CSSProperties}>
            <span className="blip-hud-track-fill" />
          </div>
        </div>
        <div className="blip-hud-group">
          <span className="blip-counter"><Sprite name="coin" /><span className="blip-counter-value blip-display blip-pop" data-scale="2" data-pop={String(got).padStart(3, "0")}>{String(got).padStart(3, "0")}</span></span>
          <span className="blip-counter"><span className="blip-counter-value blip-display blip-pop" data-scale="2" data-pop={String(got * 100).padStart(6, "0")}>{String(got * 100).padStart(6, "0")}</span></span>
        </div>
      </div>

      <Shout text="1-1 Puddle Path" at={NAME} until={at(1) - 4 * TICK} />

      {COINS.map((x, i) => (frame < HOPS[i]! + 3 * TICK ? <Sprite key={i} name="coin" style={{ position: "absolute", left: p(x - 4), top: p(GROUND - 36) }} /> : null))}
      {HOPS.map((h, i) => <Burst key={h} at={h + 3 * TICK} kind="sparkle" box={[COINS[i]! - 4, GROUND - 38, 10, 12]} count={4} seed={i + 2} />)}

      <Beat at={HOPS[0]! - 2 * BEAT} from={HOPS[0]! - BEAT}>
        <div className="blip-pop-in" style={{ position: "absolute", left: p(b.x), top: p(GROUND - 20 - b.y) }} dangerouslySetInnerHTML={{ __html: BRAMBLE }} />
      </Beat>

      <Beat at={TALK} from={TALK} until={CLEAR}>
        <div className="blip-box blip-dialogue blip-pop-in" style={{ position: "absolute", left: p(60), right: p(60), top: p(140) }}>
          <span className="blip-box blip-dialogue-name" data-tone="green">Bramble</span>
          <div className="blip-box blip-dialogue-portrait" data-variant="soft" data-tone="teal" aria-hidden="true" dangerouslySetInnerHTML={{ __html: BRAMBLE }} />
          <div className="blip-dialogue-body">
            <div className="blip-dialogue-text">
              <p>
                {LINE.slice(0, typed)}
                <span className="blip-dialogue-rest">{LINE.slice(typed)}</span>
              </p>
            </div>
          </div>
        </div>
      </Beat>

      <Shout text="Level clear!" at={CLEAR} until={OUT} />
      <Burst at={CLEAR + 2 * TICK} kind="star" box={[150, 60, 180, 50]} count={12} seed={4} scale={1} />

      <Sfx name="open" at={NAME} volume={0.5} />
      {HOPS.map((h) => <Sfx key={h} name="jump" at={h} volume={0.35} />)}
      {HOPS.map((h, i) => <Sfx key={`c${h}`} name={i ? `coin@${[0, 2, 4, 5, 7, 9, 11, 12][i]}` : "coin"} at={h + 3 * TICK} volume={0.45} />)}
      <Sfx name="open" at={TALK} volume={0.5} />
      {Array.from({ length: Math.ceil(LINE.length / 4) }, (_, n) => (
        // Bramble's voice: a soft blip every fourth letter.
        <Sfx key={`v${n}`} name={["blip", "blip@3", "blip@5", "blip@3"][n % 4]!} at={TALK + 4 * TICK + n * 4 * EVERY} volume={0.18} />
      ))}
      <Sfx name="success@5" at={CLEAR} volume={0.6} />

      <Dither at={0} mode="in" />
      <Dither at={OUT} mode="out" />
      {music && <Music bar={MAKE_A_GAME.bar} bars={MAKE_A_GAME.bars} />}
    </Stage>
  );
};
