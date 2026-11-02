import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { TICK, at, p, ticks } from "../lib/grid";
import { Life, Sky } from "../lib/Pixels";
import { Music, Sfx } from "../lib/Sound";
import { Site } from "../lib/Site";
import { HERO, SHOW_CLEAR, SplitText, type Part } from "../lib/Split";
import { Stage } from "../lib/Stage";
import { Dissolve, MOSAIC_FRAMES } from "../lib/Transitions";

/** Bars 25-28 of the theme. */
export const RESPONSIVE = { bar: 25, bars: 4 };

// Responsive: Questboard, the dashboard template, whole and live at three widths, each in a device of its own: a
// desktop monitor (1280 x 800), a tablet (768 x 1024) and a phone (400 x 840). Each page is drawn at half size, so its
// own 2-pixel pixel is one screen pixel at 1080p: the whole layout shows, and its shell answers to its container for
// real, the full sidebar and the app bar's links, then a rail and a menu button, then the bottom bar. They arrive a
// bar apart, each dropping onto the sky as the ones before step aside, and end standing side by side, centred.
type Device = { readonly name: string; readonly page: readonly [number, number]; readonly frame: readonly [number, number]; readonly arrive: number };
const DEVICES: readonly Device[] = [
  // The page's size in CSS pixels; the device's outer size in Blip pixels (the screen is the page at a quarter).
  { name: "Desktop", page: [1280, 800], frame: [168, 122], arrive: at(0, 1) },
  { name: "Tablet", page: [768, 1024], frame: [108, 140], arrive: at(1) },
  { name: "Phone", page: [400, 840], frame: [58, 121], arrive: at(2) },
];
const GAP = 16;
// The desktop monitor: a 4-pixel bezel round its 160 x 100 screen, then its neck and base under it.
const MONITOR = 108, NECK = 6, BASE = 8;
const BASELINE = HERO.y + HERO.h - 6;
const PARTS: readonly Part[] = [
  ...DEVICES.map((d) => ({ at: d.arrive === at(0, 1) ? 0 : d.arrive, title: d.name, line: "" })),
  { at: at(3), title: "Responsive", line: "" },
];
const FALL = [-20, -10, -3, 0, -3, 0];
const STEPS = 4;

const box = (r: number): CSSProperties => ({ "--blip-r": r, "--blip-shape": `var(--blip-shape-${r})`, "--blip-shape-inner": `var(--blip-shape-${r}-inner)` }) as CSSProperties;

/** Where each of the first `n` devices stands when they are centred as a row. */
function row(n: number) {
  const width = DEVICES.slice(0, n).reduce((w, d, i) => w + d.frame[0] + (i ? GAP : 0), 0);
  let x = Math.round(HERO.x + (HERO.w - width) / 2);
  return DEVICES.slice(0, n).map((d) => {
    const at = x;
    x += d.frame[0] + GAP;
    return at;
  });
}

/** The page whole, at half size, in a screen with an ink edge. */
const Screen = ({ d }: { readonly d: Device }) => (
  <div style={{ outline: "var(--blip-pixel) solid var(--blip-ink)", overflow: "hidden", inlineSize: p(d.page[0] / 8), blockSize: p(d.page[1] / 8) }}>
    <Site page="templates/dashboard/index.html" width={d.page[0]} height={d.page[1]} zoom={0.5} />
  </div>
);

const Frame = ({ d, children }: { readonly d: Device; readonly children: ReactNode }) =>
  d.name === "Desktop" ? (
    // A monitor in the same family: a Liquorice candy box round the screen, on a short neck and a flat base.
    <div style={{ inlineSize: "100%", blockSize: "100%", display: "grid", gridTemplateRows: `${p(MONITOR)} ${p(NECK)} ${p(BASE)}`, justifyItems: "center" }}>
      <div className="blip-box" data-tone="slate" style={{ ...box(4), inlineSize: "100%", blockSize: "100%", display: "grid", placeItems: "center" }}>
        {children}
      </div>
      <span style={{ inlineSize: p(14), blockSize: "100%", background: "var(--blip-candy-slate-shade)", boxShadow: `inset ${p(1)} 0 var(--blip-ink), inset ${p(-1)} 0 var(--blip-ink)` }} />
      <span className="blip-box" data-tone="slate" style={{ ...box(2), inlineSize: p(56), blockSize: "100%" }} />
    </div>
  ) : (
    // A tablet or a phone: a Liquorice candy box round the screen, deeper at the top and bottom on the phone.
    <div className="blip-box" data-tone="slate" style={{ ...box(d.name === "Phone" ? 4 : 5), inlineSize: "100%", blockSize: "100%", display: "grid", placeItems: "center" }}>
      {children}
    </div>
  );

export const Responsive = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  const n = DEVICES.filter((d) => frame >= d.arrive).length;
  // As a device arrives the row it joins steps aside to make room, in four even steps.
  const now = row(Math.max(1, n)), before = row(Math.max(1, n - 1));
  const k = n > 1 ? Math.min(STEPS, ticks(frame, DEVICES[n - 1]!.arrive) + 1) : STEPS;

  return (
    <Stage scheme="night" mosaicOut={at(4) - MOSAIC_FRAMES}>
      <AbsoluteFill>
        <Sky scheme="night" avoid={SHOW_CLEAR} />
        <Life avoid={SHOW_CLEAR} seed={47} shooting={[at(3, 1)]} />
      </AbsoluteFill>

      <SplitText eyebrow="Responsive" parts={PARTS} />

      {DEVICES.map((d, i) => {
        const shown = i < n;
        const x = i === n - 1 || before[i] === undefined ? now[i] : Math.round(before[i]! + ((now[i]! - before[i]!) * k) / STEPS);
        const fall = ticks(frame, d.arrive);
        return (
          <div
            key={d.name}
            style={{
              position: "absolute",
              left: p(x ?? 0),
              top: p(BASELINE - d.frame[1]),
              inlineSize: p(d.frame[0]),
              blockSize: p(d.frame[1]),
              visibility: shown ? "visible" : "hidden",
              translate: `0 ${p(FALL[Math.max(0, Math.min(fall, FALL.length - 1))]!)}`,
            }}
          >
            <Frame d={d}>
              <Screen d={d} />
            </Frame>
          </div>
        );
      })}

      {DEVICES.map((d) => <Sfx key={`o${d.name}`} name="open" at={d.arrive} volume={0.5} />)}
      {DEVICES.map((d, i) => <Sfx key={`b${d.name}`} name={["step", "step@3", "step@7"][i]!} at={d.arrive + 3 * TICK} volume={0.45} />)}
      {DEVICES.slice(1).map((d) => <Sfx key={`s${d.name}`} name="look" at={d.arrive} volume={0.3} />)}
      <Sfx name="success@5" at={at(3)} volume={0.45} />

      {music && <Music bar={RESPONSIVE.bar} bars={RESPONSIVE.bars} />}
      <Dissolve at={0} mode="in" seed={6} />
    </Stage>
  );
};
