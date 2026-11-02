import type { CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Beat } from "../lib/Beat";
import { STEP, TICK, at, p, ticks } from "../lib/grid";
import { Icon } from "../lib/Icon";
import { Burst, World } from "../lib/Pixels";
import { Music, Sfx } from "../lib/Sound";
import { Stage } from "../lib/Stage";
import { DropTitle, Typed } from "../lib/Text";
import { MOSAIC_FRAMES } from "../lib/Transitions";

/** Bars 0-4 of the theme. */
export const PRESS_START = { bar: 0, bars: 5 };

// The beats: PRESS START stays up from the moment the screen is on, blinks off once before the press on bar 2, and
// stays while the key goes down; the letters land on the eighths from the beat after, the drop is bar 3.
const BLINK = at(1, 1);
const PRESS = at(2);
const LANDS = [at(2, 1), at(2, 1, 2), at(2, 2), at(2, 2, 2)];
const DROP = at(3);
// The install line: a card pops in on bar 4, the command types itself in two letters a frame, and Copy is pressed on the third beat.
const TAG = at(4);
const INSTALL = "npm install @jaatster/blip-components";
const COPY = at(4, 2);

/** The TV comes on: a line across the middle, then the picture opens from it, overbright for a moment. */
function screenOn(frame: number): { line: number; style: CSSProperties } {
  const k = ticks(frame, 0);
  if (k < 2) return { line: 0, style: { clipPath: "inset(50% 0 50% 0)" } };
  if (k < 5) return { line: [0.3, 0.7, 1][k - 2]!, style: { clipPath: "inset(50% 0 50% 0)" } };
  if (k < 10) {
    const i = k - 5;
    return { line: 0, style: { clipPath: `inset(${[40, 28, 16, 6, 0][i]}% 0)`, filter: `brightness(${[2.2, 1.8, 1.4, 1.15, 1][i]})` } };
  }
  return { line: 0, style: {} };
}

export const PressStart = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  const on = screenOn(frame);
  const pressed = frame >= PRESS && frame < PRESS + 3 * TICK;

  return (
    <Stage scheme="night" style={{ background: "var(--blip-ink)" }} mosaicOut={at(5) - MOSAIC_FRAMES}>
      <AbsoluteFill style={on.style}>
        <div className={frame < DROP ? "blip-crt" : undefined} data-flicker="" style={{ position: "absolute", inset: 0 }}>
          <World scheme="night" />

          <Beat at={BLINK} from={0} until={at(2, 0, 2)}>
            <div className="v-center" style={{ gap: p(12), paddingBlockStart: p(24) }}>
              <p className="blip-prompt-start blip-display blip-pop" data-scale="3" data-pop="Press start" style={frame < BLINK || frame >= PRESS ? { animation: "none" } : undefined}>
                Press start
              </p>
              <p className="blip-prompt blip-outline" style={{ fontSize: "var(--blip-size-lead)" }}>
                or press{" "}
                <kbd className="blip-box blip-prompt-key" data-blip-state={pressed ? "active" : undefined}>
                  Enter
                </kbd>
              </p>
            </div>
          </Beat>

          <Beat at={DROP} from={PRESS}>
            <div className={frame >= DROP ? "v-center blip-shake" : "v-center"} style={{ gap: p(10), paddingBlockStart: p(6) }}>
              <DropTitle text="Blip" lands={LANDS} scale={8} outline={2} />
              {/* The line's room is kept from the start, so BLIP never moves when it types in. */}
              <div style={{ blockSize: p(20) }}>
                <Typed text="16-bit pixel modular design system" at={DROP + 2 * TICK} className="blip-outline" style={{ fontSize: p(13), fontWeight: 700 }} />
              </div>
              <div style={{ blockSize: p(32), marginBlockStart: p(2) }}>
                <Beat at={TAG}>
                  <div className="blip-box blip-card blip-pop-in" data-size="sm">
                    <div className="blip-cluster" data-gap="4" style={{ flexWrap: "nowrap" }}>
                      <span className="blip-box blip-input" data-size="lg" style={{ inlineSize: p(214) }}>
                        <span className="blip-input-affix" aria-hidden="true">$</span>
                        <input value={INSTALL.slice(0, Math.max(0, 2 * (frame - TAG - 2 * TICK)))} aria-label="Install" readOnly />
                      </span>
                      <button className="blip-box blip-button" type="button" data-size="lg" data-blip-state={frame >= COPY && frame < COPY + 3 * TICK ? "active" : undefined}>
                        <Icon name={frame >= COPY ? "check" : "copy"} />
                        {frame >= COPY ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                </Beat>
              </div>
            </div>
          </Beat>

          <Burst at={LANDS[3]! + TICK} kind="sparkle" box={[134, 74, 206, 64]} count={12} seed={7} scale={2} />
        </div>
        {on.line > 0 && (
          <div style={{ position: "absolute", insetInline: `${(1 - on.line) * 50}%`, insetBlockStart: "50%", blockSize: p(1), background: "var(--blip-white)" }} />
        )}
      </AbsoluteFill>

      <Sfx name="bump" at={3} volume={0.7} />
      <Sfx name="select" at={PRESS} />
      <Sfx name="step" at={LANDS[0]!} />
      <Sfx name="step@3" at={LANDS[1]!} />
      <Sfx name="step@5" at={LANDS[2]!} />
      <Sfx name="step@7" at={LANDS[3]!} />
      <Sfx name="open" at={TAG} volume={0.7} />
      <Sfx name="select" at={COPY} />
      <Sfx name="coin" at={COPY + STEP} volume={0.8} />
      {music && <Music bar={PRESS_START.bar} bars={PRESS_START.bars} />}
    </Stage>
  );
};
