import type { CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Beat } from "../lib/Beat";
import { Big } from "../lib/Big";
import { TICK, at, p, ticks } from "../lib/grid";
import { Icon } from "../lib/Icon";
import { Burst, World } from "../lib/Pixels";
import { Music, Sfx } from "../lib/Sound";
import { Stage } from "../lib/Stage";
import { Tagline } from "../lib/Tagline";
import { DropTitle } from "../lib/Text";
import { Dissolve } from "../lib/Transitions";

/** Bars 49-52 of the theme: the hook's last bars, ending on C. */
export const OUTRO = { bar: 49, bars: 4 };

// The opening again, as an ending: the night world, BLIP landing a letter an eighth, its line, the install line and
// where the docs are, one after another. Then the TV switches off: the picture folds to a line, the line to a dot.
const LANDS = [at(0, 1), at(0, 1, 2), at(0, 2), at(0, 2, 2)];
const LINE = at(0, 3, 2);
const INSTALL = at(1, 2);
const DOCS = at(2, 1);
const OFF = at(3, 2);

/** The TV switching off, a Blip frame a step: the picture shuts to a bright line, the line shrinks to a dot, gone. */
function screenOff(frame: number): { line: number; style: CSSProperties } {
  const k = ticks(frame, OFF);
  if (k < 0) return { line: 0, style: {} };
  if (k < 5) return { line: 0, style: { clipPath: `inset(${[6, 16, 28, 40, 48][k]}% 0)`, filter: `brightness(${[1.15, 1.4, 1.8, 2.2, 2.6][k]})` } };
  if (k < 9) return { line: [1, 0.6, 0.25, 0.04][k - 5]!, style: { clipPath: "inset(50% 0 50% 0)" } };
  return { line: 0, style: { clipPath: "inset(50% 0 50% 0)" } };
}

export const Outro = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  const off = screenOff(frame);

  return (
    <Stage scheme="night" style={{ background: "var(--blip-ink)" }}>
      <AbsoluteFill style={off.style}>
        <World scheme="night" />
        <div className="v-center" style={{ gap: p(10), paddingBlockStart: p(4) }}>
          <DropTitle text="Blip" lands={LANDS} scale={8} outline={2} />
          <Tagline card={LINE} line={LINE} install={INSTALL} />
          {/* Where the docs are: a big candy link, the accent, so it is the thing to remember. */}
          {/* Drawn unseen from the start, so its room is held and BLIP never moves. */}
          <div style={{ visibility: frame >= DOCS ? "visible" : "hidden" }}>
            <Beat at={DOCS} from={0}>
              <Big x={2}>
                <span className="blip-box blip-button blip-pop-in" style={{ position: "relative" }}>
                  <Icon name="globe" />jaatster.com/blip
                  <span className="blip-glint" aria-hidden="true" />
                </span>
              </Big>
            </Beat>
          </div>
        </div>
        <Burst at={LANDS[3]! + TICK} kind="sparkle" box={[180, 50, 120, 60]} count={10} seed={17} scale={2} />
        <Burst at={DOCS + TICK} kind="sparkle" box={[170, 222, 140, 24]} count={10} seed={23} scale={2} />
      </AbsoluteFill>
      {off.line > 0 && (
        <div style={{ position: "absolute", insetInline: `${(1 - off.line) * 50}%`, insetBlockStart: "50%", blockSize: p(1), background: "var(--blip-white)" }} />
      )}

      {LANDS.map((f, i) => <Sfx key={f} name={i ? `step@${[0, 3, 5, 7][i]}` : "step"} at={f} />)}
      <Sfx name="open" at={INSTALL} volume={0.6} />
      <Sfx name="coin" at={DOCS} volume={0.6} />
      <Sfx name="bump" at={OFF + 5 * TICK} volume={0.6} />

      {music && <Music bar={OUTRO.bar} bars={OUTRO.bars} />}
      <Dissolve at={0} mode="in" seed={9} />
    </Stage>
  );
};
