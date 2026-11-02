import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Beat } from "../lib/Beat";
import { TICK, at, p, ticks } from "../lib/grid";
import { Dither, Life, Sky, Sprite } from "../lib/Pixels";
import { Music, Sfx } from "../lib/Sound";
import { SplitText, type Part } from "../lib/Split";
import { Stage } from "../lib/Stage";
import { MOSAIC_FRAMES } from "../lib/Transitions";
import { ArtSprite } from "./MakeAGame";

/** Bars 33-35 of the theme. */
export const GAME_KIT = { bar: 33, bars: 3 };

// The game kit's parts at their own size, together on one screen, as a game's UI would be: the tally on the left,
// the achievement on the right, Pip's dialogue box across the foot, each standing on the night sky. They come in and
// do their thing in turn, a bar each:
//   bar 0  the dialogue types "Make your own?", the choices come up, the glove pokes at "Yes!" and it is picked
//   bar 1  the tally: three stars land, the coins count up, then the score
//   bar 2  the achievement slides in and its sparkles flare
const PARTS: readonly Part[] = [{ at: 0, title: "Game kit", line: "" }];
const DIALOGUE = at(0, 1);
const LINE = "Make your own?";
const TYPE = DIALOGUE + 3 * TICK;
const CHOICES = at(0, 2, 2);
const PICK = at(0, 3, 2);
const TALLY = at(1);
const STARS = [0, 1, 2].map((n) => TALLY + (4 + 3 * n) * TICK);
const COINS = TALLY + 14 * TICK;
const SCORE = TALLY + 22 * TICK;
const TROPHY = at(2);
const OUT = at(3) - MOSAIC_FRAMES;

// The layout, in Blip pixels: the title on the showcase's top line, then two columns over a full-width foot, with 24
// pixels of margin and at least 16 between the parts.
const LEFT = 56, RIGHT = 424, TOP = 84, FOOT = 190;
const CLEAR = [[LEFT - 16, 20, RIGHT + 16, 262]] as const;

/** A tally value counting up from 0 at `from`, in eight whole steps a Blip frame apart. */
const count = (frame: number, from: number, value: number) => Math.round((value * Math.min(8, Math.max(0, ticks(frame, from) + 1))) / 8);

export const GameKit = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  const typed = Math.max(0, Math.min(LINE.length, Math.floor((frame - TYPE) / 1.5) + 1));

  return (
    <Stage scheme="night" mosaicOut={OUT}>
      <AbsoluteFill>
        <Sky scheme="night" avoid={CLEAR} />
        <Life avoid={CLEAR} seed={51} />
      </AbsoluteFill>

      <SplitText eyebrow="Game kit" parts={PARTS} />

      {/* The tally, on the left. */}
      <Beat at={TALLY}>
        <div className="blip-box blip-pop-in" data-variant="panel" style={{ position: "absolute", left: p(LEFT), top: p(TOP), inlineSize: p(150), padding: p(8) }}>
          <div className="blip-tally">
            <div className="blip-tally-stars" role="img" aria-label="3 stars of 3" style={{ display: "flex", justifyContent: "center", gap: p(4) }}>
              {STARS.map((s, n) => <Sprite key={n} name={frame >= s ? "star" : "star-empty"} />)}
            </div>
            <dl className="blip-tally-rows">
              <div className="blip-tally-row">
                <dt>Coins</dt>
                <dd className="blip-tally-detail">3 × 100</dd>
                <dd className="blip-tally-value blip-display blip-pop" data-pop={String(count(frame, COINS, 300))}>{count(frame, COINS, 300)}</dd>
              </div>
              <div className="blip-tally-row" data-total>
                <dt>Score</dt>
                <dd className="blip-tally-value blip-display blip-pop" data-scale="2" data-pop={String(count(frame, SCORE, 300))}>{count(frame, SCORE, 300)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </Beat>

      {/* The achievement, on the right, sliding in with its sparkles. */}
      <Beat at={TROPHY}>
        <div className="blip-achievements" role="status" style={{ position: "absolute", right: p(480 - RIGHT), top: p(TOP + 20), inlineSize: p(196) }}>
          <div className="blip-box blip-achievement">
            <span className="blip-box blip-achievement-icon"><Sprite name="trophy" /><span className="blip-achievement-sparkles" /></span>
            <p className="blip-achievement-label">Achievement unlocked</p>
            <p className="blip-achievement-title">Block buster</p>
            <p className="blip-achievement-text">Hit every block.</p>
          </div>
        </div>
      </Beat>

      {/* Pip's dialogue box, across the foot. data-choosing (the kit's own state while answers are up) from the start,
          so the box keeps one size; the choices come up on their own beat. */}
      <Beat at={DIALOGUE}>
        <div className="blip-box blip-dialogue blip-pop-in" data-choosing="" style={{ position: "absolute", left: p(LEFT), right: p(480 - RIGHT), top: p(FOOT) }}>
          <span className="blip-box blip-dialogue-name" data-tone="green">Pip</span>
          <div className="blip-box blip-dialogue-portrait" data-variant="soft" data-tone="green" aria-hidden="true">
            <ArtSprite name={typed < LINE.length && Math.floor(frame / (2 * TICK)) % 2 ? "pip-blink" : "pip-idle"} scale={2} />
          </div>
          <div className="blip-dialogue-body" style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: p(16) }}>
            <div className="blip-dialogue-text">
              <p>
                {LINE.slice(0, typed)}
                <span className="blip-dialogue-rest">{LINE.slice(typed)}</span>
              </p>
            </div>
            <Beat at={CHOICES} from={DIALOGUE}>
              <div className="blip-dialogue-choices" style={{ marginBlockStart: 0, visibility: frame >= CHOICES ? "visible" : "hidden" }}>
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
            </Beat>
          </div>
        </div>
      </Beat>

      <Sfx name="open" at={DIALOGUE} volume={0.5} />
      {Array.from({ length: Math.ceil(LINE.length / 4) }, (_, n) => (
        // Pip's voice: a soft blip every fourth letter.
        <Sfx key={`v${n}`} name={["blip@5", "blip@7", "blip@5", "blip@3"][n % 4]!} at={TYPE + Math.round(n * 4 * 1.5)} volume={0.16} />
      ))}
      <Sfx name="look" at={CHOICES} volume={0.45} />
      <Sfx name="select" at={PICK} volume={0.6} />
      <Sfx name="open" at={TALLY} volume={0.4} />
      {STARS.map((s, n) => <Sfx key={s} name={["step@7", "step@10", "step@12"][n]!} at={s} volume={0.45} />)}
      <Sfx name="coin@5" at={COINS + TICK} volume={0.4} />
      <Sfx name="coin@12" at={SCORE + TICK} volume={0.45} />
      <Sfx name="success@7" at={TROPHY} volume={0.5} />

      <Dither at={0} mode="in" />
      {music && <Music bar={GAME_KIT.bar} bars={GAME_KIT.bars} />}
    </Stage>
  );
};
