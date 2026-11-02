import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Beat } from "../lib/Beat";
import { Big } from "../lib/Big";
import { TICK, at, p, ticks } from "../lib/grid";
import { Burst, Life, Sky, bayerMask } from "../lib/Pixels";
import { Music, Sfx } from "../lib/Sound";
import { DemoFrame, HERO, SHOW_CLEAR, SplitText, type Part } from "../lib/Split";
import { Stage } from "../lib/Stage";
import { DISSOLVE_FRAMES, Dissolve } from "../lib/Transitions";

/** Bars 45-48 of the theme: the hook again. */
export const BUILT_RIGHT = { bar: 45, bars: 4 };

// Two things the build checks, each standing on the sky:
//   32 KB  a real progress meter, twice the size, filling a kilobyte a Blip frame up to 32 against its 34 KB budget
//          (apps/docs assets.json: all component CSS, gzipped), a live count over it. Then "+4 KB" drops onto its
//          end, bounces off, shakes and dithers away: over budget, the build fails.
//   AA     one card with one line, its contrast badge under it, while the whole screen steps Day, Sunset, Night
//          through the ordered dither, a second each (ratios worked out from DESIGN.md's colours).
type Scheme = "day" | "sunset" | "night";
const PARTS: readonly Part[] = [
  { at: at(0, 1), title: "All the CSS", line: "Every component, gzipped. The build fails over its budget." },
  { at: at(1, 3, 1), title: "AA contrast", line: "For every text pair, in every scheme and palette." },
];
const METER = at(0, 2);
const FILL = METER + 2 * TICK;
const FULL = FILL + 32 * TICK;
const EXTRA = FULL + 4 * TICK;
const HIT = EXTRA + 4 * TICK;
const GONE = HIT + 7 * TICK;
const AA = at(1, 3, 1);
const SCHEMES: readonly (readonly [frame: number, scheme: Scheme, ratio: string])[] = [
  [0, "night", ""],
  [AA, "day", "16.7:1"],
  [AA + 52, "sunset", "16.7:1"],
  [AA + 104, "night", "14.7:1"],
];
// The meter in its 2x pixels: 170 wide, a kilobyte a block (34 of them); the "+4 KB" lands on its right end.
const MW = 170;
const DROP = [-28, -16, -6, 0];
const BOUNCE = [-6, -3, 0];

const Budget = ({ frame }: { readonly frame: number }) => {
  const kb = Math.max(0, Math.min(32, ticks(frame, FILL) + 1));
  const d = ticks(frame, EXTRA);
  const y = d < DROP.length ? DROP[Math.max(0, d)]! : frame < HIT + 3 * TICK ? BOUNCE[Math.min(BOUNCE.length - 1, ticks(frame, HIT))]! : 0;
  const away = Math.min(4, Math.max(0, ticks(frame, GONE) + 1));
  return (
    <div style={{ position: "relative", inlineSize: p(MW), display: "grid", gap: p(5), justifyItems: "center" }}>
      <span className="blip-display blip-pop" data-scale="2" data-pop={`${kb} KB`}>{`${kb} KB`}</span>
      <div className="blip-box blip-progress" data-tone={kb >= 32 && frame < HIT ? "success" : undefined} style={{ inlineSize: p(MW) }}>
        <progress max={34} value={kb} aria-label="Component CSS, of its budget">{kb} KB</progress>
      </div>
      <span className="blip-display blip-pop" data-scale="1" data-pop="Budget 34 KB" style={{ justifySelf: "end" }}>Budget 34 KB</span>

      {/* Over budget: it falls onto the end of the meter, bounces, shakes and dithers away. */}
      {d >= 0 && away < 4 && (
        <Beat at={HIT + 3 * TICK} from={EXTRA}>
          <div className={frame >= HIT + 3 * TICK ? "blip-shake" : undefined} style={{ position: "absolute", right: p(-4), top: p(16 + y), mask: away ? bayerMask(16 - 4 * away) : undefined }}>
            <span className="blip-box blip-tag" data-variant="candy" data-tone="danger"><span className="blip-display" data-scale="1">+4 KB</span></span>
          </div>
        </Beat>
      )}
    </div>
  );
};

const Contrast = ({ frame, ratio }: { readonly frame: number; readonly ratio: string }) => (
  <div style={{ display: "grid", gap: p(8), justifyItems: "center" }}>
    <article className="blip-box blip-card" data-size="sm">
      <p style={{ margin: 0, fontSize: "var(--blip-size-title)", fontWeight: 700, whiteSpace: "nowrap" }}>Catch the stars</p>
    </article>
    {/* The badge pops in afresh each time the scheme changes, a little after it lands. */}
    <div style={{ blockSize: p(16) }}>
      {(() => {
        const from = SCHEMES.filter((s) => s[0] <= frame).at(-1)![0] + 8;
        return frame >= from ? (
          <Beat key={from} at={from}>
            <span className="blip-box blip-tag blip-pop-in" data-tone="success" data-size="lg">{ratio} AA</span>
          </Beat>
        ) : null;
      })()}
    </div>
  </div>
);

/** The whole screen in one scheme: drawn twice while the time of day dithers to the next. */
const Screen = ({ frame, i }: { readonly frame: number; readonly i: number }) => {
  const [, scheme, ratio] = SCHEMES[i]!;
  return (
    <AbsoluteFill data-blip-scheme={scheme} style={{ background: "var(--blip-bg)" }}>
      <Sky scheme={scheme} avoid={SHOW_CLEAR} />
      {scheme === "night" && <Life avoid={SHOW_CLEAR} shooting={[at(1, 1)]} seed={41} />}
      <SplitText eyebrow="Built right" parts={PARTS} />
      <DemoFrame at={frame < AA ? METER : AA}>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
          <Big x={2}>{frame < AA ? <Budget frame={frame} /> : <Contrast frame={frame} ratio={ratio} />}</Big>
        </div>
      </DemoFrame>
    </AbsoluteFill>
  );
};

export const BuiltRight = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  const i = SCHEMES.filter((s) => s[0] <= frame).length - 1;
  const k = ticks(frame, SCHEMES[i]![0]);
  return (
    <Stage scheme="night" mosaicIn>
      <Screen frame={frame} i={i} />
      {i > 0 && k < 3 && (
        <div style={{ position: "absolute", inset: 0, mask: bayerMask(16 - 4 * (k + 1)) }}>
          <Screen frame={frame} i={i - 1} />
        </div>
      )}
      {/* The meter full: sparkles round the count over it, in stage pixels (all of it centred in the hero). */}
      <Burst at={FULL + TICK} kind="sparkle" box={[HERO.x + HERO.w / 2 - 66, HERO.y + HERO.h / 2 - 60, 132, 34]} count={8} seed={6} scale={2} />

      {PARTS.map((pt, n) => <Sfx key={pt.title} name={n ? "step@5" : "step"} at={pt.at} volume={0.4} />)}
      <Sfx name="open" at={METER} volume={0.5} />
      {Array.from({ length: 8 }, (_, n) => <Sfx key={`f${n}`} name={n ? `step@${[0, 2, 3, 5, 7, 8, 10, 12][n]}` : "step"} at={FILL + n * 4 * TICK} volume={0.3} />)}
      <Sfx name="success" at={FULL + TICK} volume={0.5} />
      <Sfx name="bump" at={HIT} volume={0.5} />
      <Sfx name="error" at={HIT + 3 * TICK} volume={0.55} />
      {SCHEMES.slice(1).map(([f], n) => <Sfx key={f} name={n ? `blip@${[0, 3, 5][n]}` : "blip"} at={f} volume={0.45} />)}
      {SCHEMES.slice(1).map(([f], n) => <Sfx key={`b${f}`} name={`coin@${[4, 7, 12][n]}`} at={f + 8} volume={0.45} />)}

      {music && <Music bar={BUILT_RIGHT.bar} bars={BUILT_RIGHT.bars} />}
      <Dissolve at={at(4) - DISSOLVE_FRAMES} mode="out" seed={8} />
    </Stage>
  );
};
