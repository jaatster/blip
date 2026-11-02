import type { ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Beat } from "../lib/Beat";
import { Big } from "../lib/Big";
import { TICK, at, p, ticks } from "../lib/grid";
import { Life, Sky, Sprite } from "../lib/Pixels";
import { Music, Sfx } from "../lib/Sound";
import { DemoFrame, SHOW_CLEAR, SplitText, type Part } from "../lib/Split";
import { Stage } from "../lib/Stage";
import { Dissolve, MOSAIC_FRAMES } from "../lib/Transitions";
import { ArtSprite } from "./MakeAGame";

/** Bars 33-35 of the theme. */
export const GAME_KIT = { bar: 33, bars: 3 };

// The game kit's parts, each on its own on the night sky, a bar each, showing themselves:
//   Dialogue     Pip's box types his question, the choices come up, the glove pokes at "Yes!" and it is picked
//   Tally        a level's results: three stars land, the coins count up, then the score
//   Achievement  the toast slides in and its sparkles flare
const PARTS: readonly Part[] = [
  { at: 0, title: "Dialogue", line: "" },
  { at: at(1), title: "Tally", line: "" },
  { at: at(2), title: "Achievement", line: "" },
];
const HEROES = [at(0, 1), at(1, 1), at(2, 1)];
const LINE = "Make your own?";
const TYPE = HEROES[0]! + 3 * TICK;
const CHOICES = at(0, 2);
const PICK = at(0, 3);
const STARS = [0, 1, 2].map((n) => HEROES[1]! + (4 + 3 * n) * TICK);
const COINS = HEROES[1]! + 14 * TICK;
const SCORE = HEROES[1]! + 22 * TICK;
const TROPHY = HEROES[2]!;
const OUT = at(3) - MOSAIC_FRAMES;

/** A tally value counting up from 0 at `from`, in eight whole steps a Blip frame apart. */
const count = (frame: number, from: number, value: number) => Math.round((value * Math.min(8, Math.max(0, ticks(frame, from) + 1))) / 8);

/** The hero, centred in the showcase's box. */
const Centre = ({ children }: { readonly children: ReactNode }) => (
  <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>{children}</div>
);

export const GameKit = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  const part = PARTS.filter((pt) => pt.at <= frame).length - 1;
  const typed = Math.max(0, Math.min(LINE.length, Math.floor((frame - TYPE) / 1.5) + 1));

  return (
    <Stage scheme="night" mosaicOut={OUT}>
      <AbsoluteFill>
        <Sky scheme="night" avoid={SHOW_CLEAR} />
        <Life avoid={SHOW_CLEAR} seed={51} />
      </AbsoluteFill>

      <SplitText eyebrow="Game kit" parts={PARTS} />

      {part === 0 && (
        <DemoFrame at={HEROES[0]!}>
          <Centre>
            <Big x={2}>
              <div className="blip-box blip-dialogue" data-choosing="" style={{ inlineSize: p(196) }}>
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
                  {/* data-choosing (the kit's own state while answers are up) from the start: the box keeps one size. */}
                  <Beat at={CHOICES} from={HEROES[0]!}>
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
                  </Beat>
                </div>
              </div>
            </Big>
          </Centre>
        </DemoFrame>
      )}

      {part === 1 && (
        <DemoFrame at={HEROES[1]!}>
          <Centre>
            <Big x={2}>
              <div className="blip-box" data-variant="panel" style={{ inlineSize: p(150), padding: p(6) }}>
                <div className="blip-tally">
                  <div className="blip-tally-stars" role="img" aria-label="3 stars of 3" style={{ display: "flex", justifyContent: "center", gap: p(3) }}>
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
            </Big>
          </Centre>
        </DemoFrame>
      )}

      {part === 2 && (
        <DemoFrame at={HEROES[2]!}>
          <Centre>
            <Big x={2}>
              <Beat at={TROPHY}>
                <div className="blip-achievements" role="status" style={{ inlineSize: p(196) }}>
                  <div className="blip-box blip-achievement">
                    <span className="blip-box blip-achievement-icon"><Sprite name="trophy" /><span className="blip-achievement-sparkles" /></span>
                    <p className="blip-achievement-label">Achievement unlocked</p>
                    <p className="blip-achievement-title">Block buster</p>
                    <p className="blip-achievement-text">Hit every block.</p>
                  </div>
                </div>
              </Beat>
            </Big>
          </Centre>
        </DemoFrame>
      )}

      <Sfx name="open" at={HEROES[0]!} volume={0.5} />
      {Array.from({ length: Math.ceil(LINE.length / 4) }, (_, n) => (
        // Pip's voice: a soft blip every fourth letter.
        <Sfx key={`v${n}`} name={["blip@5", "blip@7", "blip@5", "blip@3"][n % 4]!} at={TYPE + Math.round(n * 4 * 1.5)} volume={0.16} />
      ))}
      <Sfx name="look" at={CHOICES} volume={0.45} />
      <Sfx name="select" at={PICK} volume={0.6} />
      {STARS.map((s, n) => <Sfx key={s} name={["step@7", "step@10", "step@12"][n]!} at={s} volume={0.45} />)}
      <Sfx name="coin@5" at={COINS + TICK} volume={0.4} />
      <Sfx name="coin@12" at={SCORE + TICK} volume={0.45} />
      <Sfx name="success@7" at={TROPHY} volume={0.5} />

      <Dissolve at={0} mode="in" />
      {music && <Music bar={GAME_KIT.bar} bars={GAME_KIT.bars} />}
    </Stage>
  );
};
