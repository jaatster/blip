import { spriteCanvas } from "@jaatster/blip-game/canvas.js";
import { drawWorld } from "@jaatster/blip-effects/world.js";
import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
// Starfall's own art (the docs' game, apps/docs/public/js/starfall): Pip, the candy blocks.
// @ts-expect-error: plain JavaScript, without types
import { ART as STARFALL } from "../../../docs/public/js/starfall/art.js";
import { Beat } from "../lib/Beat";
import { Big } from "../lib/Big";
import { STEP, TICK, at, p, ticks } from "../lib/grid";
import { Icon } from "../lib/Icon";
import { Burst, Dither, H as SH, Life, Sprite, W as SW, bayerMask, useCanvas } from "../lib/Pixels";
import { type Move, PRESS, over, pressing } from "../lib/Pointer";
import { Music, Sfx } from "../lib/Sound";
import { DemoFrame, HERO, type Part, SHOW_CLEAR, SplitText } from "../lib/Split";
import { Stage } from "../lib/Stage";
import { Dissolve, MOSAIC_FRAMES, Mosaic } from "../lib/Transitions";

/** Bars 9-16 of the theme: the hook. */
export const COMPONENTS = { bar: 9, bars: 8 };

type Scheme = "day" | "sunset" | "night";
type Art = { readonly tone: string; readonly map: string };
const ART = STARFALL as Record<string, Art>;

// The part's name at the top, the part itself big in the middle standing on the sky, its line under it (the shared
// showcase, src/lib/Split.tsx). What each part does happens to the whole screen:
//   Segmented  the pointer picks Day, Sunset, Night, and the whole stage changes its time of day through the ordered
//              dither, each held 1.2 s
//   Switch     the sky goes dark; "Stars" is pointed at (its tooltip pops in) and turned on, and the whole sky fills:
//              stars flare in one after another, two shoot, and the night's own stars and moon come out
//   Button     Pip stands on a big candy "Jump" button; pressed, it sits in, Pip jumps and bumps the candy block over
//              him (up 6, then 3, then down), a coin springs out, +100
//   And more   the count rolls from the 3 shown to 88 while six more pop out round it, and confetti falls
const FRAME = at(0, 1);
const SWITCH_AT = at(2, 2);
const BUTTON_AT = at(4, 1);
const END = at(5, 3);
const PARTS: readonly Part[] = [
  { at: FRAME, title: "Segmented", line: "Pick one of a few. Here, the time of day." },
  { at: SWITCH_AT, title: "Switch", line: "On or off: a cream knob hops along its candy track." },
  { at: BUTTON_AT, title: "Button", line: "Press it, and something happens." },
  { at: END, title: "And 85 more", line: "Native HTML first. Most are CSS alone." },
];
const MOVES: readonly Move[] = [
  { at: at(0, 2), to: '[data-v="seg-1"]', press: at(0, 3) },
  { at: at(1, 1), to: '[data-v="seg-2"]', press: at(1, 2) },
  { at: at(2, 0), to: '[data-v="seg-3"]', press: at(2, 1) },
  { at: SWITCH_AT + MOSAIC_FRAMES + STEP, to: '[data-v="switch"]', press: at(3, 0) },
  { at: BUTTON_AT + MOSAIC_FRAMES + STEP, to: '[data-v="jump"]', press: at(4, 3) },
];
const [SEG_1, SEG_2, SEG_3, SWITCH, JUMP] = MOVES as [Move, Move, Move, Move, Move];
const TOOLTIP = SWITCH.at + 6 * TICK + STEP;
const STARS_ON = SWITCH.press! + PRESS;
const JUMP_AT = JUMP.press! + PRESS;
const RING_AT = END + MOSAIC_FRAMES + STEP;

// The stars the switch brings out, on the stage, clear of the words and of the switch: one a Blip frame, at twice.
const STARS: readonly (readonly [number, number])[] = [
  [36, 30], [430, 24], [84, 70], [396, 84], [24, 118], [452, 140], [70, 176], [410, 190], [120, 204], [360, 206],
  [124, 104], [356, 104], [48, 214], [440, 226], [96, 128], [380, 140], [60, 156], [420, 162], [26, 66], [458, 60],
];
const FLARES = STARS.length + 7;
const STARS_FULL = STARS_ON + FLARES * TICK;
const SHOOTING = [STARS_ON + 4 * TICK, STARS_ON + 14 * TICK];

/** The whole stage's sky, a step at a time: its time of day, and its stars (as usual, none, or a sky full). */
type Sky = { readonly scheme: Scheme; readonly stars: "usual" | "none" | "full" };
const SKIES: readonly (readonly [frame: number, sky: Sky, value: number])[] = [
  [0, { scheme: "night", stars: "usual" }, 2],
  [SEG_1.press!, { scheme: "day", stars: "usual" }, 0],
  [SEG_2.press!, { scheme: "sunset", stars: "usual" }, 1],
  [SEG_3.press!, { scheme: "night", stars: "usual" }, 2],
  [SWITCH_AT, { scheme: "night", stars: "none" }, 2],
  [STARS_FULL, { scheme: "night", stars: "full" }, 2],
  [BUTTON_AT, { scheme: "night", stars: "usual" }, 2],
];
// A full sky keeps clear of the words and the parts only; the usual one of the whole showcase.
const FULL_CLEAR = [[100, 20, 380, 112], [130, 112, 350, 236]] as const;

const SceneSky = ({ sky }: { readonly sky: Sky }) => {
  const ref = useCanvas(
    (ctx, el) => drawWorld(ctx, sky.scheme, SW, SH, { from: el, layer: "sky", avoid: sky.stars === "full" ? FULL_CLEAR : SHOW_CLEAR, features: sky.stars === "none" ? "day" : sky.scheme }),
    `${sky.scheme} ${sky.stars}`,
  );
  return <canvas ref={ref} className="v-pixels" width={SW} height={SH} />;
};

/** One of Starfall's sprites, drawn `scale` Blip pixels to a sprite pixel. */
const ArtSprite = ({ name, scale = 1, style }: { readonly name: string; readonly scale?: number; readonly style?: CSSProperties }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const el = ref.current, art = ART[name];
    const s = el && art && spriteCanvas(art, { from: el });
    if (!el || !s) return;
    el.width = s.width;
    el.height = s.height;
    el.style.inlineSize = p(s.width * scale);
    el.style.blockSize = p(s.height * scale);
    el.getContext("2d")!.drawImage(s, 0, 0);
  }, [name, scale]);
  return <canvas ref={ref} style={{ imageRendering: "pixelated", display: "block", ...style }} />;
};

/** The state a pointed-at control shows: pressed while pressed, hovered while pointed at, the box's forced states. */
const forced = (frame: number, move: Move) => (pressing(frame, move.press) ? "active" : over(MOVES, move.to, frame) && frame < (move.press ?? 0) ? "hover" : undefined);

/** Centred in the hero, on whole pixels. */
const Centre = ({ children, top = 0, bottom = 0 }: { readonly children: ReactNode; readonly top?: number; readonly bottom?: number }) => (
  <div style={{ position: "absolute", insetInline: 0, top: p(top), bottom: p(bottom), display: "grid", placeItems: "center" }}>{children}</div>
);

// ------------------------------------------------------------------ 1. Segmented: the time of day, for real

const SegmentedDemo = ({ frame, v }: { readonly frame: number; readonly v: boolean }) => {
  const value = SKIES.filter((s) => s[0] <= frame).at(-1)![2];
  return (
    <Centre>
      {/* Its rail is the calm, sunken kind, so it sits on a panel (DESIGN.md: anything but candy needs one). */}
      <Big x={2}>
        <div className="blip-box blip-card" data-size="sm" style={{ display: "grid", gap: p(4), justifyItems: "start" }}>
          <span className="blip-label">Time of day</span>
          <div className="blip-box blip-segmented" data-size="sm">
            {["Day", "Sunset", "Night"].map((label, i) => {
              const move = [SEG_1, SEG_2, SEG_3][i]!;
              return (
                <button key={label} className="blip-box" type="button" aria-checked={value === i} data-blip-state={forced(frame, move)} data-v={v ? `seg-${i + 1}` : undefined}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </Big>
    </Centre>
  );
};

// ------------------------------------------------------------------ 2. Switch: the stars come out

const SwitchDemo = ({ frame, v }: { readonly frame: number; readonly v: boolean }) => {
  const on = frame >= STARS_ON;
  return (
    <Centre>
      <div style={{ display: "flex", alignItems: "center", gap: p(18) }}>
        <Big x={2}><span className="blip-display blip-pop" data-scale="1" data-pop="Stars">Stars</span></Big>
        <div style={{ position: "relative" }}>
          <Big x={3}>
            <span className="blip-box blip-switch" data-blip-state={forced(frame, SWITCH)} data-v={v ? "switch" : undefined}>
              <input type="checkbox" role="switch" className="blip-box" checked={on} readOnly />
            </span>
          </Big>
          {frame >= TOOLTIP && frame < SWITCH.press! && (
            <div style={{ position: "absolute", left: p(-60), right: p(-60), bottom: `calc(100% + ${p(8)})`, display: "grid", justifyItems: "center" }}>
              <Beat at={TOOLTIP}>
                <Big x={2}>
                  <span className="blip-box blip-tooltip" role="tooltip" data-side="top" data-blip-static="" style={{ whiteSpace: "nowrap", animation: "blip-popover-in calc(2 * var(--blip-duration-frame)) steps(1, jump-end) both" }}>
                    Light the night sky
                    <span className="blip-tooltip-nub" aria-hidden="true" />
                  </span>
                </Big>
              </Beat>
            </div>
          )}
        </div>
      </div>
    </Centre>
  );
};

/** The stars flaring in across the whole stage once the switch is on, a pixel each once flared, and two shooting. */
const StarField = ({ frame }: { readonly frame: number }) => {
  const k = ticks(frame, STARS_ON);
  if (frame < STARS_ON || frame >= BUTTON_AT) return null;
  return (
    <>
      {STARS.map(([x, y], n) => {
        const s = k - n;
        if (s < 0) return null;
        if (s < 7) return <Sprite key={n} name={s >= 2 && s < 5 ? "sparkle" : "sparkle-small"} scale={2} style={{ position: "absolute", left: p(x - 8), top: p(y - 8) }} />;
        return frame < STARS_FULL + 3 * TICK ? <div key={n} style={{ position: "absolute", left: p(x), top: p(y), inlineSize: p(2), blockSize: p(2), background: "#F3EFFF" }} /> : null;
      })}
      {SHOOTING.map((from, n) => {
        const t = ticks(frame, from);
        if (t < 0 || t > 16) return null;
        const [x0, y0] = n ? [250, 20] : [40, 16];
        const head = Math.min(t, 12), length = t < 12 ? 8 : 8 - (t - 12) * 2;
        return Array.from({ length: Math.max(0, length) }, (_, j) => {
          const h = head - j * 0.5;
          return j < 2 || j % 2 === 0 ? <div key={`${n}${j}`} style={{ position: "absolute", left: p(Math.round(x0 + 3 * h)), top: p(Math.round(y0 + h)), inlineSize: p(1), blockSize: p(1), background: "#F3EFFF" }} /> : null;
        });
      })}
    </>
  );
};

// ------------------------------------------------------------------ 3. Button: Pip jumps off it

// In the hero's own pixels (400 x 152): the button stands at the bottom, Pip (three times, 42 x 39) on top of it, the
// block (twice, 24) floating over him, where his head meets it at the top of the jump. The coin's highest point keeps
// a few pixels clear of the title above the hero.
const BUTTON_TOP = 118;
const PIP = { x: 179, w: 42, h: 39 };
const ARC = [0, 8, 14, 19, 22, 24, 22, 19, 14, 8, 0];
const HIT = 5;
const BLOCK = { x: 188, y: BUTTON_TOP - PIP.h - 24 - 24 };
const BUMP = [6, 6, 3, 3, 0];
const RISE = [7, 13, 19, 23, 25, 26, 25, 24];

const ButtonDemo = ({ frame, v }: { readonly frame: number; readonly v: boolean }) => {
  const j = ticks(frame, JUMP_AT);
  const jumping = j >= 0 && j < ARC.length;
  const art = jumping ? (j <= HIT ? "pip-jump" : "pip-fall") : Math.floor(frame / TICK) % 40 < 2 ? "pip-blink" : "pip-idle";
  const state = forced(frame, JUMP);
  // The button lifts a pixel when pointed at and sits in a pixel when pressed (two of the hero's, at twice): Pip rides it.
  const ride = state === "hover" ? -2 : state === "active" ? 2 : 0;
  const b = ticks(frame, JUMP_AT + HIT * TICK);
  const bump = b >= 0 && b < BUMP.length ? BUMP[b]! : 0;
  return (
    <>
      <ArtSprite name={b >= 0 ? "block-spent" : "block"} scale={2} style={{ position: "absolute", left: p(BLOCK.x), top: p(BLOCK.y - bump) }} />
      {b >= 0 && b < RISE.length && <Sprite name="coin" scale={2} style={{ position: "absolute", left: p(BLOCK.x + 2), top: p(BLOCK.y - 18 - Math.round(RISE[b]! * 0.3)) }} />}
      {b >= RISE.length && b < RISE.length + 6 && (
        <Sprite name={b - RISE.length >= 2 && b - RISE.length < 4 ? "sparkle" : "sparkle-small"} scale={2} style={{ position: "absolute", left: p(BLOCK.x), top: p(BLOCK.y - 38) }} />
      )}
      {b >= 1 && b < 18 && (
        <span className="blip-display blip-pop" data-scale="2" data-pop="+100" style={{ position: "absolute", left: p(BLOCK.x + 34), top: p(BLOCK.y - 2 - Math.min(b - 1, 3) * 2), visibility: b < 15 || b % 2 ? "visible" : "hidden" }}>
          +100
        </span>
      )}
      <Centre top={BUTTON_TOP} bottom={-20}>
        <div style={{ alignSelf: "start" }}>
          <Big x={2}>
            <span className="blip-box blip-button" data-blip-state={state} data-v={v ? "jump" : undefined}><Icon name="arrow-up" />Jump</span>
          </Big>
        </div>
      </Centre>
      <ArtSprite name={art} scale={3} style={{ position: "absolute", left: p(PIP.x), top: p(BUTTON_TOP - PIP.h + ride - (jumping ? ARC[j]! : 0)) }} />
    </>
  );
};

// ------------------------------------------------------------------ 4. And more: the count, and six round it

const RING: readonly (readonly [dx: number, dy: number, part: ReactNode])[] = [
  [-130, -42, <span className="blip-box blip-button" data-size="sm"><Icon name="play" />Play</span>],
  [130, -42, <span className="blip-box blip-tag" data-tone="success">New</span>],
  [-158, 8, <span className="blip-box blip-checkbox"><input type="checkbox" checked readOnly aria-label="Done" /></span>],
  [158, 8, <span className="blip-box blip-switch"><input type="checkbox" role="switch" className="blip-box" checked readOnly aria-label="On" /></span>],
  [-104, 50, <span className="blip-box blip-avatar" data-tone="green">P<span className="blip-box blip-avatar-status" data-tone="success" /></span>],
  [104, 50, <span className="blip-box blip-button" data-size="sm" data-variant="soft" data-icon-only aria-label="Alerts"><Icon name="bell" /><span className="blip-box blip-badge" data-tone="danger" data-position="top-end">3</span></span>],
];
/** When ring part `i` pops out: an eighth apart, round the ring. */
const ringAt = (i: number) => RING_AT + i * 2 * STEP;
// Out from the middle in six even steps, a pixel past its place, then home.
const OUT = [0.17, 0.33, 0.5, 0.67, 0.83, 1.04, 1];
const COUNT_AT = RING_AT;

const MoreDemo = ({ frame }: { readonly frame: number }) => {
  const n = Math.round(3 + (85 * Math.min(1, Math.max(0, ticks(frame, COUNT_AT) + 1) / 24)));
  const cx = HERO.w / 2, cy = HERO.h / 2;
  return (
    <>
      <Centre>
        {/* Pixel Bop's digits carry their spacing on the right, so the ink sits five pixels left of the box's middle. */}
        <div style={{ translate: `${p(5)} 0` }}>
          <Big x={2}><span className="blip-display blip-pop" data-scale="3" data-pop={String(n)} style={{ fontVariantNumeric: "tabular-nums" }}>{n}</span></Big>
        </div>
      </Centre>
      {RING.map(([dx, dy, part], i) => {
        const k = ticks(frame, ringAt(i));
        if (k < 0) return null;
        const t = OUT[Math.min(k, OUT.length - 1)]!;
        return (
          <Beat key={i} at={ringAt(i)}>
            <div style={{ position: "absolute", left: p(Math.round(cx + dx * t)), top: p(Math.round(cy + dy * t)), translate: "-50% -50%" }}>
              <Big x={2}>{part}</Big>
            </div>
          </Beat>
        );
      })}
    </>
  );
};

// ------------------------------------------------------------------ the scene

/** The hero for `frame`: each part comes in out of the mosaic and leaves through it. */
const Demo = ({ frame, v }: { readonly frame: number; readonly v: boolean }) => {
  const parts = [FRAME, SWITCH_AT, BUTTON_AT, END];
  const i = parts.filter((f) => f <= frame).length - 1;
  const next = parts[i + 1] ?? Infinity;
  const body = [<SegmentedDemo frame={frame} v={v} />, <SwitchDemo frame={frame} v={v} />, <ButtonDemo frame={frame} v={v} />, <MoreDemo frame={frame} />][i];
  return (
    <Mosaic at={i ? parts[i]! : -MOSAIC_FRAMES} mode="in">
      <Mosaic at={next - MOSAIC_FRAMES} mode="out">
        {body}
      </Mosaic>
    </Mosaic>
  );
};

/** The whole screen under one sky: drawn twice while the sky dithers from one to the next. */
const Screen = ({ frame, sky, v }: { readonly frame: number; readonly sky: Sky; readonly v: boolean }) => (
  <AbsoluteFill data-blip-scheme={sky.scheme} style={{ background: "var(--blip-bg)" }}>
    <SceneSky sky={sky} />
    {sky.scheme === "night" && sky.stars === "usual" && <Life avoid={SHOW_CLEAR} shooting={[at(6, 2)]} seed={9} />}
    <StarField frame={frame} />
    <SplitText eyebrow="88 components" parts={PARTS} />
    <DemoFrame at={FRAME}>
      <Demo frame={frame} v={v} />
    </DemoFrame>
    <Burst at={ringAt(RING.length - 1) + TICK} kind="confetti" box={[60, -10, 360, 10]} count={36} seed={8} />
  </AbsoluteFill>
);

export const Components = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  const i = SKIES.filter((s) => s[0] <= frame).length - 1;
  const now = SKIES[i]!, before = SKIES[Math.max(0, i - 1)]!;
  const k = ticks(frame, now[0]);
  const changing = i > 0 && k < 3;

  return (
    <Stage scheme="night">
      <Screen frame={frame} sky={now[1]} v />
      {changing && (
        <div style={{ position: "absolute", inset: 0, mask: bayerMask(16 - 4 * (k + 1)) }}>
          <Screen frame={frame} sky={before[1]} v={false} />
        </div>
      )}

      <Sfx name="open" at={FRAME} volume={0.55} />
      {MOVES.map((m) => <Sfx key={m.at} name="look" at={m.at} volume={0.3} />)}
      {[SEG_1, SEG_2, SEG_3].map((m, n) => <Sfx key={`t${n}`} name={n ? `blip@${[0, 3, 5][n]}` : "blip"} at={m.press!} volume={0.6} />)}
      {[SWITCH_AT, BUTTON_AT, END].map((f) => <Sfx key={f} name="back" at={f - MOSAIC_FRAMES} volume={0.3} />)}
      <Sfx name="blip@7" at={SWITCH.press!} volume={0.6} />
      {STARS.filter((_, n) => n % 2 === 0).map((_, n) => <Sfx key={`s${n}`} name={`step@${[2, 3, 5, 7, 8, 10, 12, 10, 12, 12][n]}`} at={STARS_ON + n * 2 * TICK} volume={0.18} />)}
      <Sfx name="success@7" at={STARS_FULL} volume={0.45} />
      <Sfx name="select" at={JUMP.press!} volume={0.6} />
      <Sfx name="jump" at={JUMP_AT} volume={0.5} />
      <Sfx name="bump" at={JUMP_AT + HIT * TICK} volume={0.6} />
      <Sfx name="coin" at={JUMP_AT + HIT * TICK + TICK} volume={0.55} />
      {Array.from({ length: 8 }, (_, n) => <Sfx key={`c${n}`} name={n ? `coin@${[0, 2, 4, 5, 7, 9, 11, 12][n]}` : "coin"} at={COUNT_AT + n * 3 * TICK} volume={0.3} />)}
      {RING.map((_, n) => <Sfx key={`r${n}`} name={`jump@${[0, 3, 5, 7, 5, 3][n]}`.replace("@0", "")} at={ringAt(n)} volume={0.3} />)}
      <Sfx name="success@5" at={ringAt(RING.length - 1)} volume={0.55} />

      <Dissolve at={0} mode="in" seed={4} />
      <Dither at={at(8) - 8 * TICK} mode="out" />
      {music && <Music bar={COMPONENTS.bar} bars={COMPONENTS.bars} />}
    </Stage>
  );
};
