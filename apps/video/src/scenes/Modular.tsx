import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Beat } from "../lib/Beat";
import { STEP, TICK, at, p, ticks } from "../lib/grid";
import { Life, Sky } from "../lib/Pixels";
import { Music, Sfx } from "../lib/Sound";
import { Stage } from "../lib/Stage";
import { DropTitle, Typed, letterLands } from "../lib/Text";
import { DISSOLVE_FRAMES, Dissolve } from "../lib/Transitions";

/** Bars 5-8 of the theme: the groove. */
export const MODULAR = { bar: 5, bars: 4 };

// What "modular" means in Blip: separate packages, each on the layer below. On the left the heading and its line;
// on the right the packages drop in a layer at a time, each a beat or an eighth apart: the three with no
// dependencies at the bottom (tokens, icons, the font), core on tokens, then what is built on core (components,
// elements), then the kits on those, and React on top. Then the install line for one package types in, and the focus
// ring picks the package it installs. Sizes are the build's gzipped measurements (apps/docs assets.json).
const TITLE = letterLands("Modular", at(0, 1), STEP);
const LINE = at(0, 3);
const INSTALL = at(2, 3);
const COMMAND = "npm install @jaatster/blip-tokens";
const PICK = at(3, 2);

type Block = { readonly name: string; readonly size?: string; readonly row: number; readonly col: number; readonly span: number; readonly land: number };
// Six columns of 35 pixels with 2 between, rows of 26 with 3 between, from the ground up. Each block stands on what
// it is built from: core on tokens; components and elements on core; the kits on those; React on the lot. Icons and
// the font need nothing, so they stand on their own.
const BLOCKS: readonly Block[] = [
  { name: "Tokens", size: "3.8 KB", row: 0, col: 0, span: 4, land: at(1, 0) },
  { name: "Icons", size: "5.1 KB", row: 0, col: 4, span: 1, land: at(1, 0, 2) },
  { name: "Font", size: "8.2 KB", row: 0, col: 5, span: 1, land: at(1, 1) },
  { name: "Core", size: "6.0 KB", row: 1, col: 0, span: 4, land: at(1, 2) },
  { name: "Components", size: "32 KB", row: 2, col: 0, span: 3, land: at(1, 3) },
  { name: "Elements", size: "≤3 KB each", row: 2, col: 3, span: 1, land: at(1, 3, 2) },
  { name: "Effects", size: "17 KB", row: 3, col: 0, span: 1, land: at(2, 0) },
  { name: "Sound", size: "1.6 KB", row: 3, col: 1, span: 1, land: at(2, 0, 2) },
  { name: "Game", row: 3, col: 2, span: 1, land: at(2, 1) },
  { name: "Blocks", row: 3, col: 3, span: 1, land: at(2, 1, 2) },
  { name: "React", row: 4, col: 0, span: 4, land: at(2, 2) },
];
const COL = 35, GAP = 2, ROW = 26, ROW_GAP = 3, LEFT = 246, GROUND = 234;
const FALL = [-40, -22, -8, 0, -2, 0];
const CLEAR = [[16, 70, 236, 236], [240, 80, 470, 240]] as const;

export const Modular = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  const typed = Math.max(0, Math.min(COMMAND.length, frame - INSTALL - 2 * TICK));

  return (
    <Stage scheme="night" mosaicIn>
      <AbsoluteFill>
        <Sky scheme="night" avoid={CLEAR} />
        <Life avoid={CLEAR} shooting={[at(1, 2)]} seed={51} />
      </AbsoluteFill>

      <div style={{ position: "absolute", left: p(24), top: p(84), inlineSize: p(206), display: "grid", gap: p(10), justifyItems: "start" }}>
        <div style={{ whiteSpace: "nowrap" }}>
          <DropTitle text="Modular" lands={TITLE} scale={4} outline={2} />
        </div>
        <div style={{ blockSize: p(36) }}>
          <Typed text="Take only what you need: the tokens alone, one component, or the lot." at={LINE} every={1.5} className="blip-outline" style={{ fontSize: p(11), fontWeight: 700, lineHeight: 1.5 }} />
        </div>
        <div style={{ blockSize: p(30) }}>
          <Beat at={INSTALL}>
            <div className="blip-box blip-card blip-pop-in" data-size="sm">
              <span className="blip-box blip-input" style={{ inlineSize: p(186) }}>
                <span className="blip-input-affix" aria-hidden="true">$</span>
                <input value={COMMAND.slice(0, typed)} aria-label="Install the tokens" readOnly />
              </span>
            </div>
          </Beat>
        </div>
      </div>

      {BLOCKS.map((b) => {
        const k = ticks(frame, b.land - 3 * TICK);
        if (k < 0) return null;
        const picked = b.name === "Tokens" && frame >= PICK;
        return (
          <Beat key={b.name} at={picked ? PICK : b.land}>
            <div
              className="blip-box"
              data-tone={picked ? "accent" : "neutral"}
              data-blip-state={picked ? "focus" : undefined}
              style={{
                position: "absolute",
                left: p(LEFT + b.col * (COL + GAP)),
                top: p(GROUND - (b.row + 1) * ROW - b.row * ROW_GAP),
                inlineSize: p(b.span * COL + (b.span - 1) * GAP),
                blockSize: p(ROW),
                translate: `0 ${p(FALL[Math.min(k, FALL.length - 1)]!)}`,
                display: "grid",
                placeContent: "center",
                justifyItems: "center",
                color: "var(--blip-ink)",
                lineHeight: 1.1,
              }}
            >
              <span style={{ fontWeight: 700, fontSize: b.span > 1 ? "var(--blip-size-small)" : "var(--blip-size-caption)", textTransform: "uppercase", letterSpacing: b.span > 1 ? "0.5px" : 0 }}>{b.name}</span>
              {b.size && <span style={{ fontSize: "var(--blip-size-caption)" }}>{b.size}</span>}
            </div>
          </Beat>
        );
      })}

      {[...new Set(TITLE)].map((f, i) => <Sfx key={`t${f}`} name={i ? `step@${[0, 2, 3, 5, 7, 8, 10][i]}` : "step"} at={f} volume={0.45} />)}
      {BLOCKS.map((b, i) => <Sfx key={b.name} name={i % 8 ? `step@${[0, 2, 3, 5, 7, 8, 10, 12][i % 8]}` : "step"} at={b.land} volume={0.55} />)}
      <Sfx name="bump" at={BLOCKS.at(-1)!.land} volume={0.4} />
      <Sfx name="open" at={INSTALL} volume={0.55} />
      <Sfx name="select@7" at={PICK} volume={0.6} />

      {music && <Music bar={MODULAR.bar} bars={MODULAR.bars} />}
      <Dissolve at={at(4) - DISSOLVE_FRAMES} mode="out" seed={3} />
    </Stage>
  );
};
