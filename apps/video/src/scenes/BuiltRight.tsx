import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Beat } from "../lib/Beat";
import { STEP, TICK, at, p } from "../lib/grid";
import { Dither, Life, Sky } from "../lib/Pixels";
import { Music, Sfx } from "../lib/Sound";
import { Stage } from "../lib/Stage";
import { DropTitle, Typed, letterLands } from "../lib/Text";

/** Bars 33-36 of the theme: the hook again. */
export const BUILT_RIGHT = { bar: 33, bars: 4 };

// Two numbers the build itself checks, one at a time, about two bars each: the number drops in a letter a
// sixteenth, its name under it, then a line saying what it means, with a second to read it. The budget is the docs'
// (assets.json), the contrast rule DESIGN.md's.
const STATS = [
  { at: at(0, 1), value: "32 KB", name: "All the CSS", line: "for every component, gzipped. The build fails over 34 KB." },
  { at: at(2), value: "AA", name: "Contrast", line: "for every text pair, in every scheme and palette." },
];
const OUT = at(4) - 8 * TICK;
const CLEAR = [[60, 20, 420, 250]] as const;

export const BuiltRight = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  const i = Math.max(0, STATS.filter((s) => s.at <= frame).length - 1);
  const stat = STATS[i]!;
  const lands = letterLands(stat.value, stat.at, STEP);
  const named = lands.at(-1)! + STEP;

  return (
    <Stage scheme="night">
      <AbsoluteFill>
        <Sky scheme="night" avoid={CLEAR} />
        <Life avoid={CLEAR} shooting={[at(1, 1)]} seed={41} />
      </AbsoluteFill>

      <div style={{ position: "absolute", insetInline: 0, top: p(22), display: "grid", justifyItems: "center" }}>
        <span className="blip-display blip-pop" data-scale="2" data-pop="Built right">Built right</span>
      </div>

      <Beat key={i} at={stat.at} from={STATS[0]!.at}>
        <div style={{ position: "absolute", insetInline: 0, top: p(66), display: "grid", justifyItems: "center", gap: p(10) }}>
          <DropTitle text={stat.value} lands={lands} scale={8} outline={2} />
          <span className="blip-display blip-pop" data-scale="3" data-pop={stat.name} style={{ visibility: frame >= named ? "visible" : "hidden" }}>{stat.name}</span>
          <div style={{ blockSize: p(16) }}>
            <Typed text={stat.line} at={named + STEP} every={1} className="blip-outline" style={{ fontSize: p(12), fontWeight: 700 }} />
          </div>
        </div>
      </Beat>

      {STATS.flatMap((s) => letterLands(s.value, s.at, STEP).filter((f, n, all) => all.indexOf(f) === n).map((f, n) => <Sfx key={`${s.value}${f}`} name={n ? `step@${[0, 3, 5, 7, 8][n]}` : "step"} at={f} volume={0.5} />))}
      {STATS.map((s) => <Sfx key={s.value} name="coin" at={letterLands(s.value, s.at, STEP).at(-1)! + STEP} volume={0.5} />)}

      <Dither at={0} mode="in" />
      <Dither at={OUT} mode="out" />
      {music && <Music bar={BUILT_RIGHT.bar} bars={BUILT_RIGHT.bars} />}
    </Stage>
  );
};
