import type { CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Beat } from "../lib/Beat";
import { TICK, at, p, ticks } from "../lib/grid";
import { Icon } from "../lib/Icon";
import { Burst, Dither, World } from "../lib/Pixels";
import { Music, Sfx } from "../lib/Sound";
import { Stage } from "../lib/Stage";
import { DropTitle, Typed } from "../lib/Text";

/** Bars 37-40 of the theme: the hook's last bars, ending on C. */
export const OUTRO = { bar: 37, bars: 4 };

// The opening again, as an ending: the night world, BLIP landing a letter an eighth, its line, the install line and
// where the docs are, one after another. Then the TV switches off: the picture folds to a line, the line to a dot.
const LANDS = [at(0, 1), at(0, 1, 2), at(0, 2), at(0, 2, 2)];
const LINE = at(0, 3, 2);
const INSTALL = at(1, 2);
const DOCS = at(2, 1);
const OFF = at(3, 2);
const COMMAND = "npm install @jaatster/blip-components";

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
          <div style={{ blockSize: p(20) }}>
            <Typed text="16-bit pixel modular design system" at={LINE} className="blip-outline" style={{ fontSize: p(13), fontWeight: 700 }} />
          </div>
          <div style={{ blockSize: p(32) }}>
            <Beat at={INSTALL}>
              <div className="blip-box blip-card blip-pop-in" data-size="sm">
                <div className="blip-cluster" data-gap="4" style={{ flexWrap: "nowrap" }}>
                  <span className="blip-box blip-input" data-size="lg" style={{ inlineSize: p(214) }}>
                    <span className="blip-input-affix" aria-hidden="true">$</span>
                    <input value={COMMAND} aria-label="Install" readOnly />
                  </span>
                  <span className="blip-box blip-button" data-size="lg"><Icon name="copy" />Copy</span>
                </div>
              </div>
            </Beat>
          </div>
          <div style={{ blockSize: p(20) }}>
            <Beat at={DOCS}>
              <span className="blip-display blip-pop blip-pop-in" data-scale="2" data-pop="jaatster.com/blip" style={{ display: "inline-block" }}>jaatster.com/blip</span>
            </Beat>
          </div>
        </div>
        <Burst at={LANDS[3]! + TICK} kind="sparkle" box={[180, 50, 120, 60]} count={10} seed={17} scale={2} />
      </AbsoluteFill>
      {off.line > 0 && (
        <div style={{ position: "absolute", insetInline: `${(1 - off.line) * 50}%`, insetBlockStart: "50%", blockSize: p(1), background: "var(--blip-white)" }} />
      )}

      {LANDS.map((f, i) => <Sfx key={f} name={i ? `step@${[0, 3, 5, 7][i]}` : "step"} at={f} />)}
      <Sfx name="open" at={INSTALL} volume={0.6} />
      <Sfx name="coin" at={DOCS} volume={0.6} />
      <Sfx name="bump" at={OFF + 5 * TICK} volume={0.6} />

      <Dither at={0} mode="in" />
      {music && <Music bar={OUTRO.bar} bars={OUTRO.bars} />}
    </Stage>
  );
};
