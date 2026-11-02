import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Beat } from "../lib/Beat";
import { Big } from "../lib/Big";
import { TICK, at, p, ticks } from "../lib/grid";
import { Icon } from "../lib/Icon";
import { Burst, Life, Sky, Sprite } from "../lib/Pixels";
import { type Move, Pointer, pressing } from "../lib/Pointer";
import { Music, Sfx } from "../lib/Sound";
import { DemoFrame, HERO, SPLIT_CLEAR, SplitText } from "../lib/Split";
import { Stage } from "../lib/Stage";
import { Snap } from "../lib/Snap";
import { Dissolve, MOSAIC_FRAMES, Mosaic } from "../lib/Transitions";

/** Bars 41-44 of the theme. */
export const EVERYWHERE = { bar: 41, bars: 4 };

// Where Blip goes, and the one real line that takes it there (from the README, the elements' and React's READMEs,
// BlipTokens.kt and .swift, and the Figma variables), over what that line makes, working, standing big on the night
// sky and changing through the mosaic: the candy button pressed; candy tabs switching Bag, Map, Log; a React button
// that deletes a save (the row shakes and goes); two phones painted in the token's sky soda; and the selection snapping
// round a Blip button as a design tool draws it, its colour named by the variable.
const PARTS = [
  { at: 4, title: "HTML and CSS", line: 'class="blip-box blip-button"' },
  { at: 64, title: "Web Components", line: "<blip-tabs>" },
  { at: 124, title: "React", line: '<Button variant="soft"' },
  { at: 184, title: "Android, iOS", line: "Color(0xFF00C2FA)" },
  { at: 244, title: "Figma", line: "palette/night/accent/base" },
];
const STARTS = PARTS.map((pt) => pt.at - 4);
const FRAME = 0;
const OUT = at(4) - MOSAIC_FRAMES;

// What the pointer does in each: press the button; pick Map, then Log; press Delete save; press each phone's Play;
// click the button in the design tool.
const MOVES: readonly Move[] = [
  { at: 14, to: '[data-v="html"]', press: 30 },
  { at: 68, to: '[data-v="tab-1"]', press: 80 },
  { at: 84, to: '[data-v="tab-2"]', press: 96 },
  { at: 132, to: '[data-v="delete"]', press: 144 },
  { at: 194, to: '[data-v="phone-0"]', press: 206 },
  { at: 208, to: '[data-v="phone-1"]', press: 220 },
  { at: 250, to: '[data-v="figma"]', press: 262 },
];
const press = (to: string) => MOVES.find((m) => m.to === `[data-v="${to}"]`)!.press!;
// A short drop, so nothing falls through the title on its way in: 12, 6, 2 pixels, landed, a pixel bounce.
const FALL = [-12, -6, -2, 0, -1, 0];
// The tabs' items drop a few of their own (three-times) pixels.
const DROP = [-3, -2, -1, 0];
const fall = (frame: number, land: number) => p(FALL[Math.max(0, Math.min(ticks(frame, land - 3 * TICK), FALL.length - 1))]!);

/** Centres its children in the hero, on whole pixels. */
const Centre = ({ children }: { readonly children: ReactNode }) => (
  <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}><Snap>{children}</Snap></div>
);

const Html = ({ frame }: { readonly frame: number }) => {
  const down = pressing(frame, press("html"));
  return (
    <Centre>
      <Beat at={STARTS[0]! + 8}>
        <div className="blip-pop-in">
          <Big x={3}>
            <span className="blip-box blip-button" data-size="lg" data-blip-state={down ? "active" : undefined} data-v="html">
              <Icon name="play" />Press start
            </span>
          </Big>
        </div>
      </Beat>
    </Centre>
  );
};

const BAG = [
  ["Bag", ["sword", "shield", "potion"]],
  ["Map", ["key", "chest", "star"]],
  ["Log", ["coin", "gem", "heart"]],
] as const;

const Tabs = ({ frame }: { readonly frame: number }) => {
  const sel = frame >= press("tab-2") ? 2 : frame >= press("tab-1") ? 1 : 0;
  const changed = sel === 2 ? press("tab-2") : sel === 1 ? press("tab-1") : STARTS[1]!;
  return (
    <Centre>
      <Big x={3}>
        {/* Room for all three tabs, so the row never turns into a scroller. */}
        <div className="blip-tabs" style={{ inlineSize: p(120) }}>
          <div className="blip-tabs-list" role="tablist" style={{ justifyContent: "center" }}>
            {BAG.map(([name], n) => (
              <button key={name} className="blip-box blip-tab" role="tab" type="button" aria-selected={n === sel} data-blip-state={MOVES.some((m) => m.to === `[data-v="tab-${n}"]` && pressing(frame, m.press)) ? "active" : undefined} data-v={`tab-${n}`}>
                {name}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: p(14), paddingBlockStart: p(8), inlineSize: "100%", gridColumn: "1 / -1" }}>
            {BAG[sel]![1].map((sp, n) => (
              <div key={`${sel}${sp}`} style={{ translate: `0 ${p(DROP[Math.max(0, Math.min(ticks(frame, changed + n * 2 * TICK), DROP.length - 1))]!)}`, visibility: frame >= changed + n * 2 * TICK ? "visible" : "hidden" }}>
                <Sprite name={sp} />
              </div>
            ))}
          </div>
        </div>
      </Big>
    </Centre>
  );
};

const ReactDemo = ({ frame }: { readonly frame: number }) => {
  const hit = press("delete");
  const k = ticks(frame, hit + 3 * TICK);
  const gone = k >= 8;
  return (
    <Centre>
      <Big x={2}>
        <div style={{ inlineSize: p(110), display: "grid", gap: p(6) }}>
          <ul className="blip-box blip-list" role="list" style={{ margin: 0 }}>
            <Beat at={hit + 3 * TICK} from={STARTS[2]!}>
              <li className={`blip-list-item${k >= 0 && k < 5 ? " blip-shake" : ""}`} style={{ visibility: gone ? "hidden" : "visible" }}>
                <Sprite name="heart" />
                <div className="blip-list-content"><span className="blip-list-title">Slot 2</span></div>
              </li>
            </Beat>
          </ul>
          <div style={{ display: "flex", justifyContent: "end" }}>
            <span className="blip-box blip-button" data-variant="soft" data-tone="danger" data-blip-state={pressing(frame, hit) ? "active" : undefined} data-v="delete">
              <Icon name="trash" />Delete save
            </span>
          </div>
        </div>
      </Big>
    </Centre>
  );
};

/** A pixel phone: a Liquorice candy box with a screen, a top bar and a Play button in the token's accent. */
const Phone = ({ n, name, frame }: { readonly n: number; readonly name: string; readonly frame: number }) => {
  const land = STARTS[3]! + 10 + n * 4 * TICK;
  const down = pressing(frame, press(`phone-${n}`));
  const accent = { "--blip-tone": "#00C2FA", "--blip-tone-light": "#91DDFF", "--blip-tone-shade": "#0096C3", "--blip-tone-on": "var(--blip-ink)" } as CSSProperties;
  return (
    <div style={{ translate: `0 ${fall(frame, land)}`, visibility: frame >= land - 3 * TICK ? "visible" : "hidden" }}>
      {/* Inside, Blip's own pixel switch at twice the stage's: every length below counts those bigger pixels. */}
      <Big x={2}>
        <div style={{ display: "grid", justifyItems: "center", gap: p(3) }}>
          <div className="blip-box" data-tone="slate" style={{ "--blip-r": 3, "--blip-shape": "var(--blip-shape-3)", "--blip-shape-inner": "var(--blip-shape-3-inner)", inlineSize: p(36), blockSize: p(60), padding: p(2), display: "grid" } as CSSProperties}>
            <div style={{ background: "var(--blip-bg)", display: "grid", gridTemplateRows: `${p(7)} 1fr`, overflow: "hidden" }}>
              <div style={{ background: "#00C2FA", color: "var(--blip-ink)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: p(4) }}>Blip</div>
              <div style={{ display: "grid", placeItems: "center" }}>
                <span className="blip-box blip-button" data-size="sm" style={accent} data-blip-state={down ? "active" : undefined} data-v={`phone-${n}`}>Play</span>
              </div>
            </div>
          </div>
          <span className="blip-outline" style={{ fontWeight: 700, fontSize: p(5) }}>{name}</span>
        </div>
      </Big>
    </div>
  );
};

const Phones = ({ frame }: { readonly frame: number }) => (
  <Centre>
    <div style={{ display: "flex", gap: p(48) }}>
      <Phone n={0} name="Android" frame={frame} />
      <Phone n={1} name="iOS" frame={frame} />
    </div>
  </Centre>
);

/** The design tool: a Blip button, the selection snapping round it with its handles, its colour named under it. */
const Canvas = ({ frame }: { readonly frame: number }) => {
  const hit = press("figma");
  const k = ticks(frame, hit);
  // The selection snaps in from 6 stage pixels out to 2, in whole steps (counted in the button's doubled pixels).
  const out = k < 0 ? -1 : [3, 2, 1, 1][Math.min(k, 3)]!;
  const handle = { position: "absolute", inlineSize: p(2), blockSize: p(2), background: "var(--blip-focus)", outline: "var(--blip-pixel) solid var(--blip-focus-edge)" } as CSSProperties;
  return (
    <Centre>
      <div style={{ display: "grid", justifyItems: "center", gap: p(18) }}>
        <Big x={2}>
          <div style={{ position: "relative" }}>
            <span className="blip-box blip-button" data-blip-state={pressing(frame, hit) ? "active" : undefined} data-v="figma">Press start</span>
            {out >= 0 && (
              <div style={{ position: "absolute", inset: p(-out), outline: "var(--blip-pixel) solid var(--blip-focus)", pointerEvents: "none" }}>
                <span style={{ ...handle, left: p(-1), top: p(-1) }} />
                <span style={{ ...handle, right: p(-1), top: p(-1) }} />
                <span style={{ ...handle, left: p(-1), bottom: p(-1) }} />
                <span style={{ ...handle, right: p(-1), bottom: p(-1) }} />
              </div>
            )}
          </div>
        </Big>
        <Beat at={hit + 4 * TICK}>
          <div className="blip-box blip-pop-in" data-variant="panel" style={{ display: "flex", alignItems: "center", gap: p(6), padding: `${p(5)} ${p(8)}`, visibility: frame >= hit + 4 * TICK ? "visible" : "hidden" }}>
            <span style={{ inlineSize: p(12), blockSize: p(12), background: "#00C2FA", outline: "var(--blip-pixel) solid var(--blip-ink)" }} />
            <span style={{ fontSize: p(10), fontWeight: 700 }}>palette/night/accent/base</span>
          </div>
        </Beat>
      </div>
    </Centre>
  );
};

const DEMOS = [Html, Tabs, ReactDemo, Phones, Canvas];

export const Everywhere = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  const i = Math.max(0, STARTS.filter((f) => f <= frame).length - 1);
  const Demo = DEMOS[i]!;
  const next = STARTS[i + 1] ?? Infinity;

  return (
    <Stage scheme="night" mosaicOut={OUT}>
      <AbsoluteFill>
        <Sky scheme="night" avoid={SPLIT_CLEAR} />
        <Life avoid={SPLIT_CLEAR} seed={51} shooting={[at(2, 2)]} />
      </AbsoluteFill>
      <SplitText eyebrow="Use it everywhere" parts={PARTS} />

      <DemoFrame at={FRAME}>
        <Mosaic at={i ? STARTS[i]! : -MOSAIC_FRAMES} mode="in">
          <Mosaic at={next - MOSAIC_FRAMES} mode="out">
            <Demo frame={frame} />
          </Mosaic>
        </Mosaic>
      </DemoFrame>
      <Pointer moves={MOVES} />
      <Burst at={press("html") + 3 * TICK} kind="sparkle" box={[HERO.x + 35, HERO.y + 40, 330, 72]} count={10} seed={5} />
      <Burst at={press("delete") + 11 * TICK} kind="sparkle" box={[HERO.x + 90, HERO.y + 27, 220, 48]} count={6} seed={6} />

      {PARTS.map((pt, n) => <Sfx key={pt.at} name={n ? `blip@${[0, 3, 5, 7, 5][n]}` : "blip"} at={pt.at} volume={0.5} />)}
      {MOVES.map((m) => <Sfx key={m.at} name="look" at={m.at} volume={0.25} />)}
      <Sfx name="select" at={press("html")} volume={0.6} />
      <Sfx name="step@5" at={press("tab-1")} volume={0.5} />
      <Sfx name="step@7" at={press("tab-2")} volume={0.5} />
      <Sfx name="select@5" at={press("delete")} volume={0.55} />
      <Sfx name="error" at={press("delete") + 3 * TICK} volume={0.45} />
      <Sfx name="back" at={press("delete") + 11 * TICK} volume={0.45} />
      <Sfx name="coin" at={press("phone-0") + 3 * TICK} volume={0.5} />
      <Sfx name="coin@7" at={press("phone-1") + 3 * TICK} volume={0.5} />
      <Sfx name="success" at={press("figma") + 4 * TICK} volume={0.5} />

      {music && <Music bar={EVERYWHERE.bar} bars={EVERYWHERE.bars} />}
      <Dissolve at={0} mode="in" seed={7} />
    </Stage>
  );
};

