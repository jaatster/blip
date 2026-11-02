import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Beat } from "../lib/Beat";
import { BEAT, STEP, at, p, ticks } from "../lib/grid";
import { Life, Sky } from "../lib/Pixels";
import { Music, Sfx } from "../lib/Sound";
import { Stage } from "../lib/Stage";
import { DropTitle, Typed, letterLands } from "../lib/Text";
import { DISSOLVE_FRAMES, Dissolve } from "../lib/Transitions";

/** Bars 45-48 of the theme: the hook again. */
export const BUILT_RIGHT = { bar: 45, bars: 4 };

// Two things the build itself checks, one at a time, two bars each. On the left the number, its name and what it
// means; on the right the proof: first every package's budget meter filling a block at a time against its limit
// (apps/docs assets.json, gzipped), then text on each scheme's surface with its contrast ratio, Day, Sunset, Night.
const SIZE = at(0, 1);
const METERS = at(0, 3);
const AA = at(2);
const PAIRS = at(2, 2);
const CLEAR = [[16, 30, 470, 246]] as const;

const KB = (b: number) => b / 1024;
const BUDGETS = [
  { name: "Tokens", bytes: 3922, limit: 4096 },
  { name: "Core CSS", bytes: 6195, limit: 6656 },
  { name: "Components", bytes: 32502, limit: 34816 },
  { name: "Effects", bytes: 17306, limit: 18432 },
  { name: "Icons", bytes: 5222, limit: 6144 },
  { name: "Sound", bytes: 1628, limit: 3072 },
];

// Text on the surface, and muted text on it, in each scheme (DESIGN.md's roles): the ratios are WCAG 2.2's.
const SCHEMES = [
  { scheme: "day", name: "Day", text: "#1A1530", muted: "#4A4470", surface: "#FFFFFF" },
  { scheme: "sunset", name: "Sunset", text: "#1A1530", muted: "#4A4470", surface: "#FFF6F8" },
  { scheme: "night", name: "Night", text: "#F3F3F3", muted: "#BEBEBE", surface: "#202020" },
] as const;
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const ratio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return `${((hi! + 0.05) / (lo! + 0.05)).toFixed(1)}:1`;
};

const STATS = [
  { at: SIZE, value: "32 KB", name: "All the CSS", line: "for every component, gzipped. Every package has a budget, and the build fails over it." },
  { at: AA, value: "AA", name: "Contrast", line: "for every text pair, in every scheme and every palette, checked when the tokens build." },
];

export const BuiltRight = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  const i = frame >= AA ? 1 : 0;
  const stat = STATS[i]!;
  const lands = letterLands(stat.value, stat.at, STEP);
  const named = lands.at(-1)! + STEP;

  return (
    <Stage scheme="night" mosaicIn>
      <AbsoluteFill>
        <Sky scheme="night" avoid={CLEAR} />
        <Life avoid={CLEAR} shooting={[at(1, 1)]} seed={41} />
      </AbsoluteFill>

      <div style={{ position: "absolute", left: p(24), top: p(16) }}>
        <span className="blip-display blip-pop" data-scale="2" data-pop="Built right">Built right</span>
      </div>

      <Beat key={`l${i}`} at={stat.at} from={STATS[0]!.at}>
        <div style={{ position: "absolute", left: p(24), top: p(72), inlineSize: p(200), display: "grid", gap: p(8), justifyItems: "start" }}>
          <DropTitle text={stat.value} lands={lands} scale={6} outline={2} />
          <span className="blip-display blip-pop" data-scale="2" data-pop={stat.name} style={{ visibility: frame >= named ? "visible" : "hidden" }}>{stat.name}</span>
          <div style={{ blockSize: p(56) }}>
            <Typed text={stat.line} at={named + STEP} every={1} className="blip-outline" style={{ fontSize: p(11), fontWeight: 700, lineHeight: 1.5 }} />
          </div>
        </div>
      </Beat>

      <Beat at={METERS} until={AA}>
        <section className="blip-box blip-window blip-pop-in" style={{ position: "absolute", left: p(246), top: p(24), inlineSize: p(214) }}>
          <header className="blip-window-bar">
            <h2 className="blip-window-title blip-display blip-pop" data-pop="Budgets">Budgets</h2>
          </header>
          <div className="blip-window-body" style={{ display: "grid", gap: "var(--blip-space-3)", padding: "var(--blip-space-4) var(--blip-space-6)" }}>
            {BUDGETS.map((b, n) => {
              const shown = METERS + BEAT / 2 + n * STEP * 2;
              const k = ticks(frame, shown);
              const full = Math.round((b.bytes / b.limit) * 100);
              const value = k < 0 ? 0 : Math.min(full, Math.round((full * (k + 1)) / 6));
              return (
                <div key={b.name} style={{ visibility: k < 0 ? "hidden" : "visible" }}>
                  <div className="blip-progress-label">
                    <label>{b.name}</label>
                    <span>{`${KB(b.bytes).toFixed(1)} of ${+KB(b.limit).toFixed(1)} KB`}</span>
                  </div>
                  <div className="blip-box blip-progress" data-size="sm">
                    <progress max={100} value={value}>{value}%</progress>
                  </div>
                </div>
              );
            })}
          </div>
          <footer className="blip-window-status">
            <span>Gzipped</span>
            <span>The build fails over a limit</span>
          </footer>
        </section>
      </Beat>

      <div style={{ position: "absolute", left: p(246), top: p(40), inlineSize: p(214), display: "grid", gap: p(8) }}>
        {SCHEMES.map((s, n) => {
          const shown = PAIRS + n * BEAT;
          if (frame < shown) return null;
          return (
            <Beat key={s.scheme} at={shown}>
              <div className="blip-box blip-card blip-pop-in" data-size="sm" data-blip-scheme={s.scheme} style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: `${p(3)} ${p(6)}` }}>
                <span className="blip-label" style={{ gridColumn: "1 / -1" }}>{s.name}</span>
                <span style={{ fontWeight: 700 }}>Text on the surface</span>
                <span className="blip-box blip-tag" data-tone="success" data-size="sm">{`${ratio(s.text, s.surface)} AA`}</span>
                <span style={{ color: "var(--blip-text-muted)" }}>Muted text</span>
                <span className="blip-box blip-tag" data-tone="success" data-size="sm">{`${ratio(s.muted, s.surface)} AA`}</span>
              </div>
            </Beat>
          );
        })}
      </div>

      {STATS.flatMap((s) => letterLands(s.value, s.at, STEP).filter((f, n, all) => all.indexOf(f) === n).map((f, n) => <Sfx key={`${s.value}${f}`} name={n ? `step@${[0, 3, 5, 7, 8][n]}` : "step"} at={f} volume={0.5} />))}
      <Sfx name="open" at={METERS} volume={0.55} />
      {BUDGETS.map((b, n) => <Sfx key={b.name} name={n ? `step@${[0, 2, 3, 5, 7, 8, 10][n]}` : "step"} at={METERS + BEAT / 2 + n * STEP * 2} volume={0.35} />)}
      {SCHEMES.map((s, n) => <Sfx key={s.scheme} name={`blip@${[3, 5, 7][n]}`} at={PAIRS + n * BEAT} volume={0.55} />)}
      <Sfx name="success" at={PAIRS + 2 * BEAT + STEP} volume={0.5} />

      {music && <Music bar={BUILT_RIGHT.bar} bars={BUILT_RIGHT.bars} />}
      <Dissolve at={at(4) - DISSOLVE_FRAMES} mode="out" seed={8} />
    </Stage>
  );
};
