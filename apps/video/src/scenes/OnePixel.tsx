import type { CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Beat } from "../lib/Beat";
import { TICK, at, p } from "../lib/grid";
import { Icon } from "../lib/Icon";
import { Dither, Life, Sky } from "../lib/Pixels";
import { Music, Sfx } from "../lib/Sound";
import { Stage } from "../lib/Stage";
import { DropTitle, Typed, letterLands } from "../lib/Text";

/** Bars 5-8 of the theme: the groove. */
export const ONE_PIXEL = { bar: 5, bars: 4 };

// The docs home's first rule, "One pixel": the same button at a pixel of 2, 3 and 4 CSS pixels, larger and just as
// sharp. The title lands on bar 0, a letter a sixteenth; then the button takes each size on a bar of its own and is
// pressed on the beat after. The rule's line types in under it after the first press and stays.
const TITLE = letterLands("One pixel", at(0, 1), 5);
const SIZES = [
  [at(1), 2],
  [at(2), 3],
  [at(3), 4],
] as const;
const LINE = at(1, 2);
const OUT = at(4) - 8 * TICK;
const CLEAR = [[96, 20, 384, 250]] as const;

export const OnePixel = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  const [from, size] = SIZES.filter(([f]) => f <= frame).at(-1) ?? SIZES[0];
  const pressed = frame >= from + 20 && frame < from + 20 + 3 * TICK;

  return (
    <Stage scheme="night">
      <AbsoluteFill>
        <Sky scheme="night" avoid={CLEAR} />
        <Life avoid={CLEAR} shooting={[at(2)]} seed={13} />
      </AbsoluteFill>

      <div style={{ position: "absolute", insetInline: 0, top: p(28), display: "grid", justifyItems: "center" }}>
        <DropTitle text="One pixel" lands={TITLE} scale={5} outline={2} />
      </div>

      {/* The stage's own pixel is 4 CSS pixels; the button is drawn at Blip's 2, 3 and 4 and shown twice as big, whole,
          as a camera would. */}
      <Beat at={from} from={SIZES[0][0]}>
        <div style={{ position: "absolute", left: 0, right: 0, top: p(104), blockSize: p(70), display: "grid", placeItems: "center" }}>
          <div style={{ transform: "scale(2)" }}>
            <div className="blip-pop-in" data-blip-pixel="" style={{ "--blip-pixel": `${size}px` } as CSSProperties}>
              <span className="blip-box blip-button" data-blip-state={pressed ? "active" : undefined}>
                <Icon name="heart" />
                Like
              </span>
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", insetInline: 0, top: p(186), display: "grid", justifyItems: "center" }}>
          <span className="blip-display blip-pop" data-scale="2" data-pop={`${size} px`}>{`${size} px`}</span>
        </div>
      </Beat>

      <div style={{ position: "absolute", insetInline: 0, top: p(222), display: "grid", justifyItems: "center", blockSize: p(16) }}>
        <Typed text="Every outline, corner and step is one square pixel." at={LINE} every={1.5} className="blip-outline" style={{ fontSize: p(12), fontWeight: 700 }} />
      </div>

      {[...new Set(TITLE)].map((f, i) => <Sfx key={f} name={i ? `step@${[0, 2, 3, 5, 7, 8, 10, 12][i]}` : "step"} at={f} volume={0.5} />)}
      {SIZES.map(([f], i) => <Sfx key={f} name={i ? `jump@${[0, 3, 5][i]}` : "jump"} at={f} volume={0.5} />)}
      {SIZES.map(([f]) => <Sfx key={`p${f}`} name="select" at={f + 20} volume={0.6} />)}

      <Dither at={0} mode="in" />
      <Dither at={OUT} mode="out" />
      {music && <Music bar={ONE_PIXEL.bar} bars={ONE_PIXEL.bars} />}
    </Stage>
  );
};
