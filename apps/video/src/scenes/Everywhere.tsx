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

/** Bars 9-14 of the theme. */
export const EVERYWHERE = { bar: 9, bars: 6 };

// Where Blip goes, and the one real line that takes it there (from the README, the elements' and React's READMEs,
// BlipTokens.kt and .swift, and the Figma variables), over what that line makes, working, standing big on the night
// sky and changing through the mosaic, a bar each (Web Components two):
//   HTML and CSS     the candy button, and a row of CSS-only parts popping in under it; the press ticks the checkbox
//   Web Components   candy tabs switching Bag, Map, Log; then a segmented control picking Hard, a rating filling
//                    star by star, and a toast saying it is saved
//   React            a list of saves with a tag and an Autosave switch; Delete save, and the row shakes and goes
//   Android, iOS     two phones painted in the token's sky soda
//   Figma            the selection snapping round a Blip button as a design tool draws it, its colour named
const STARTS = [0, at(1), at(2), at(3), at(4), at(5)];
const PARTS = [
  { at: 4, title: "HTML and CSS", line: 'class="blip-box blip-button"' },
  { at: STARTS[1]! + 4, title: "Web Components", line: "<blip-tabs>" },
  { at: STARTS[2]!, title: "Web Components", line: "<blip-rating>" },
  { at: STARTS[3]! + 4, title: "React", line: '<Button variant="soft"' },
  { at: STARTS[4]! + 4, title: "Android, iOS", line: "Color(0xFF00C2FA)" },
  { at: STARTS[5]! + 4, title: "Figma", line: "palette/night/accent/base" },
];
const FRAME = 0;
const OUT = at(6) - MOSAIC_FRAMES;

// What happens in each, on the beat: press the button; pick Map, then Log; pick Hard; press Delete save; press each
// phone's Play; click the button in the design tool. (The pointer itself is not drawn.)
const MOVES: readonly Move[] = [
  { at: at(0, 2) - 12, to: '[data-v="html"]', press: at(0, 2) },
  { at: at(1, 2) - 12, to: '[data-v="tab-1"]', press: at(1, 2) },
  { at: at(1, 3) - 12, to: '[data-v="tab-2"]', press: at(1, 3) },
  { at: at(2, 2) - 12, to: '[data-v="seg-hard"]', press: at(2, 2) },
  { at: at(3, 2) - 12, to: '[data-v="delete"]', press: at(3, 2) },
  { at: at(4, 2) - 12, to: '[data-v="phone-0"]', press: at(4, 2) },
  { at: at(4, 3) - 12, to: '[data-v="phone-1"]', press: at(4, 3) },
  { at: at(5, 2) - 12, to: '[data-v="figma"]', press: at(5, 2) },
];
const press = (to: string) => MOVES.find((m) => m.to === `[data-v="${to}"]`)!.press!;
// A short drop, so nothing falls through the title on its way in: 12, 6, 2 pixels, landed, a pixel bounce.
const FALL = [-12, -6, -2, 0, -1, 0];
// The tabs' items drop a few of their own (three-times) pixels.
const DROP = [-3, -2, -1, 0];
const fall = (frame: number, land: number) => p(FALL[Math.max(0, Math.min(ticks(frame, land - 3 * TICK), FALL.length - 1))]!);

/** The real line that makes the result, in a small panel under it, in the code face. */
const Code = ({ children }: { readonly children: ReactNode }) => (
  <Snap>
    <code className="blip-box" data-variant="panel" style={{ display: "inline-block", padding: `${p(4)} ${p(8)}`, fontFamily: "var(--blip-font-mono)", fontSize: p(9), color: "var(--blip-text)", whiteSpace: "nowrap" }}>
      {children}
    </code>
  </Snap>
);

/** A result over its code line, as one centred column. */
const Column = ({ children }: { readonly children: ReactNode }) => (
  <div style={{ display: "grid", justifyItems: "center", gap: p(16) }}>{children}</div>
);

/** Pops in at `from`, its room held (unseen) from the first frame, so nothing round it moves when it comes. */
const Pop = ({ frame, from, children }: { readonly frame: number; readonly from: number; readonly children: ReactNode }) => (
  <div style={{ visibility: frame >= from ? "visible" : "hidden" }}>
    <Beat at={from} from={0}>
      <div className="blip-pop-in">{children}</div>
    </Beat>
  </div>
);

/** Centres its children in the hero, on whole pixels. */
const Centre = ({ children }: { readonly children: ReactNode }) => (
  <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}><Snap>{children}</Snap></div>
);

const Html = ({ frame }: { readonly frame: number }) => {
  const hit = press("html");
  const down = pressing(frame, hit);
  const row = (n: number) => STARTS[0]! + at(0, 1) + n * 2 * TICK;
  return (
    <Centre>
      <Column>
        <Pop frame={frame} from={STARTS[0]! + 8}>
          <Big x={2}>
            <span className="blip-box blip-button" data-size="lg" data-blip-state={down ? "active" : undefined} data-v="html">
              <Icon name="play" />Press start
            </span>
          </Big>
        </Pop>
        {/* CSS alone, every one: a checkbox the press ticks, a tag, a switch, a progress bar. */}
        <Big x={2}>
          <div style={{ display: "flex", alignItems: "center", gap: p(10) }}>
            <Pop frame={frame} from={row(0)}>
              <span className="blip-box blip-checkbox"><input type="checkbox" checked={frame >= hit + 3 * TICK} readOnly aria-label="Ready" /></span>
            </Pop>
            <Pop frame={frame} from={row(1)}>
              <span className="blip-box blip-tag" data-tone="success">Cleared</span>
            </Pop>
            <Pop frame={frame} from={row(2)}>
              <span className="blip-box blip-switch"><input type="checkbox" role="switch" className="blip-box" checked readOnly aria-label="Music" /></span>
            </Pop>
            <Pop frame={frame} from={row(3)}>
              <div className="blip-box blip-progress" style={{ inlineSize: p(44) }}><progress max={5} value={frame >= hit + 3 * TICK ? 4 : 3}>60%</progress></div>
            </Pop>
          </div>
        </Big>
        <Code>{'<button class="blip-box blip-button">'}</Code>
      </Column>
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
      <Column>
      <Big x={2}>
        {/* Room for all three tabs, so the row never turns into a scroller. */}
        <div className="blip-tabs" style={{ inlineSize: p(130) }}>
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
      <Code>{'<blip-tabs class="blip-tabs">'}</Code>
      </Column>
    </Centre>
  );
};

const LEVELS = ["Easy", "Normal", "Hard"] as const;

/** More of the elements: a segmented control picking Hard, a rating filling in star by star, and a toast saying so. */
const Elements = ({ frame }: { readonly frame: number }) => {
  const hit = press("seg-hard");
  const chosen = frame >= hit ? 2 : 1;
  const stars = Math.max(0, Math.min(4, Math.floor((frame - (STARTS[2]! + at(0, 1))) / (2 * TICK)) + 1));
  const toastAt = STARTS[2]! + at(0, 3);
  return (
    <Centre>
      <Column>
        <Pop frame={frame} from={toastAt}>
          <Big x={2}>
            <div className="blip-box blip-toast" data-tone="success" style={{ inlineSize: "max-content" }}>
              <span className="blip-toast-icon" aria-hidden="true" />
              <div className="blip-toast-body">
                <p className="blip-toast-title">Settings saved</p>
              </div>
            </div>
          </Big>
        </Pop>
        <Big x={2}>
          <div style={{ display: "flex", alignItems: "center", gap: p(14) }}>
            <Pop frame={frame} from={STARTS[2]! + 8}>
              <div className="blip-box blip-segmented" role="radiogroup" aria-label="Level">
                {LEVELS.map((name, n) => (
                  <button key={name} className="blip-box" type="button" role="radio" aria-checked={n === chosen} data-blip-state={n === 2 && pressing(frame, hit) ? "active" : undefined} data-v={n === 2 ? "seg-hard" : undefined}>
                    {name}
                  </button>
                ))}
              </div>
            </Pop>
            <Pop frame={frame} from={STARTS[2]! + 8 + 2 * TICK}>
              <span className="blip-rating" role="img" aria-label={`Rated ${stars} out of 5`} style={{ "--blip-rating-value": stars } as CSSProperties} />
            </Pop>
          </div>
        </Big>
        <Code>{"<blip-segmented>  <blip-rating>  <blip-toaster>"}</Code>
      </Column>
    </Centre>
  );
};

const ReactDemo = ({ frame }: { readonly frame: number }) => {
  const hit = press("delete");
  const k = ticks(frame, hit + 3 * TICK);
  const gone = k >= 8;
  return (
    <Centre>
      <Column>
      <Big x={2}>
        <div style={{ inlineSize: p(140), display: "grid", gap: p(6) }}>
          <ul className="blip-box blip-list" role="list" data-dividers style={{ margin: 0 }}>
            <li className="blip-list-item">
              <Sprite name="star" />
              <div className="blip-list-content"><span className="blip-list-title">Slot 1</span></div>
              <div className="blip-list-end"><span className="blip-box blip-tag" data-size="sm" data-tone="success">World 3</span></div>
            </li>
            {/* Deleted, the row shakes and goes, and an empty slot pops into its place. */}
            {gone ? (
              <Beat key="empty" at={hit + 11 * TICK}>
                <li className="blip-list-item blip-pop-in">
                  <span style={{ inlineSize: p(12), blockSize: p(12) }} />
                  <div className="blip-list-content"><span className="blip-list-description">Empty slot</span></div>
                </li>
              </Beat>
            ) : (
              <Beat at={hit + 3 * TICK} from={0}>
                <li className={`blip-list-item${k >= 0 && k < 5 ? " blip-shake" : ""}`}>
                  <Sprite name="heart" />
                  <div className="blip-list-content"><span className="blip-list-title">Slot 2</span></div>
                  <div className="blip-list-end"><span className="blip-box blip-tag" data-size="sm" data-tone="neutral">World 1</span></div>
                </li>
              </Beat>
            )}
          </ul>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label className="blip-check" data-size="sm">
              <span className="blip-box blip-switch" data-size="sm"><input type="checkbox" role="switch" className="blip-box" checked readOnly /></span>Autosave
            </label>
            <span className="blip-box blip-button" data-size="sm" data-variant="soft" data-tone="danger" data-blip-state={pressing(frame, hit) ? "active" : undefined} data-v="delete">
              <Icon name="trash" />Delete save
            </span>
          </div>
        </div>
      </Big>
      <Code>{'<List>  <Tag>  <Switch>  <Button tone="danger">'}</Code>
      </Column>
    </Centre>
  );
};

/** A pixel phone: a Liquorice candy box with a screen, a top bar and a Play button in the token's accent. */
const Phone = ({ n, name, code, frame }: { readonly n: number; readonly name: string; readonly code: string; readonly frame: number }) => {
  const land = STARTS[4]! + 10 + n * 4 * TICK;
  const down = pressing(frame, press(`phone-${n}`));
  const accent = { "--blip-tone": "#00C2FA", "--blip-tone-light": "#91DDFF", "--blip-tone-shade": "#0096C3", "--blip-tone-on": "var(--blip-ink)" } as CSSProperties;
  return (
    <div style={{ display: "grid", justifyItems: "center", translate: `0 ${fall(frame, land)}`, visibility: frame >= land - 3 * TICK ? "visible" : "hidden" }}>
      {/* Inside, Blip's own pixel switch at twice the stage's: every length below counts those bigger pixels. */}
      <Big x={2}>
        <div style={{ display: "grid", justifyItems: "center", gap: p(3) }}>
          <div className="blip-box" data-tone="slate" style={{ "--blip-r": 3, "--blip-shape": "var(--blip-shape-3)", "--blip-shape-inner": "var(--blip-shape-3-inner)", inlineSize: p(32), blockSize: p(48), padding: p(2), display: "grid" } as CSSProperties}>
            <div style={{ background: "var(--blip-bg)", display: "grid", gridTemplateRows: `${p(7)} 1fr`, overflow: "hidden" }}>
              <div style={{ background: "#00C2FA", color: "var(--blip-ink)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: p(4) }}>Blip</div>
              <div style={{ display: "grid", placeItems: "center" }}>
                <span className="blip-box blip-button" data-size="sm" style={accent} data-blip-state={down ? "active" : undefined} data-v={`phone-${n}`}>Play</span>
              </div>
            </div>
          </div>
        </div>
      </Big>
      <div style={{ display: "grid", justifyItems: "center", gap: p(6), marginBlockStart: p(8) }}>
        <span className="blip-outline" style={{ fontWeight: 700, fontSize: p(9) }}>{name}</span>
        <Code>{code}</Code>
      </div>
    </div>
  );
};

const Phones = ({ frame }: { readonly frame: number }) => (
  <Centre>
    <div style={{ display: "flex", alignItems: "start", gap: p(36) }}>
      <Phone n={0} name="Android" code="Color(0xFF00C2FA)" frame={frame} />
      <Phone n={1} name="iOS" code="Color(blipHex: 0x00C2FA)" frame={frame} />
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
            <code style={{ fontFamily: "var(--blip-font-mono)", fontSize: p(9) }}>palette/night/accent/base</code>
          </div>
        </Beat>
      </div>
    </Centre>
  );
};

const DEMOS = [Html, Tabs, Elements, ReactDemo, Phones, Canvas];

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
      <Burst at={press("html") + 3 * TICK} kind="sparkle" box={[HERO.x + 35, HERO.y + 21, 330, 72]} count={10} seed={5} />
      <Burst at={press("delete") + 11 * TICK} kind="sparkle" box={[HERO.x + 60, HERO.y + 7, 280, 48]} count={6} seed={6} />
      <Burst at={STARTS[2]! + at(0, 3) + TICK} kind="sparkle" box={[HERO.x + 50, HERO.y + 4, 300, 40]} count={8} seed={11} />

      {PARTS.map((pt, n) => <Sfx key={pt.at} name={n ? `blip@${[0, 3, 3, 5, 7, 5][n]}` : "blip"} at={pt.at} volume={0.5} />)}
      {MOVES.map((m) => <Sfx key={m.at} name="look" at={m.at} volume={0.25} />)}
      <Sfx name="select" at={press("html")} volume={0.6} />
      <Sfx name="step@5" at={press("tab-1")} volume={0.5} />
      <Sfx name="step@7" at={press("tab-2")} volume={0.5} />
      {[0, 1, 2, 3].map((n) => <Sfx key={`r${n}`} name={`step@${[2, 3, 5, 7][n]}`} at={STARTS[2]! + at(0, 1) + n * 2 * TICK} volume={0.35} />)}
      <Sfx name="select@7" at={press("seg-hard")} volume={0.55} />
      <Sfx name="success@5" at={STARTS[2]! + at(0, 3)} volume={0.5} />
      <Sfx name="step@3" at={press("html") + 3 * TICK} volume={0.4} />
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

