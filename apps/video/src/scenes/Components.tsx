import { spriteCanvas } from "@jaatster/blip-game/canvas.js";
import { drawWorld } from "@jaatster/blip-effects/world.js";
import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
// Starfall's own art (the docs' game, apps/docs/public/js/starfall): Pip, the candy blocks.
// @ts-expect-error: plain JavaScript, without types
import { ART as STARFALL } from "../../../docs/public/js/starfall/art.js";
import { Beat } from "../lib/Beat";
import { STEP, TICK, at, p, ticks } from "../lib/grid";
import { Icon } from "../lib/Icon";
import { Burst, Dither, Life, Sky, Sprite, bayerMask, useCanvas } from "../lib/Pixels";
import { type Move, PRESS, Pointer, over, pressing } from "../lib/Pointer";
import { Music, Sfx } from "../lib/Sound";
import { DemoFrame, type Part, RIGHT, SPLIT_CLEAR, SplitText } from "../lib/Split";
import { Stage } from "../lib/Stage";
import { Dissolve, MOSAIC_FRAMES, Mosaic } from "../lib/Transitions";

/** Bars 9-16 of the theme: the hook. */
export const COMPONENTS = { bar: 9, bars: 8 };

type Scheme = "day" | "sunset" | "night";
type Art = { readonly tone: string; readonly map: string };
const ART = STARFALL as Record<string, Art>;

// Left, which part; right, that part working, one at a time in a framed stage (the shared split, src/lib/Split.tsx):
//   Segmented  the pointer picks Day, then Sunset, then Night, and the little world in the frame really changes,
//              through the ordered dither, each held 1.2 s
//   Switch     "Stars" is pointed at (its tooltip pops in) and turned on: the stars come out one by one, one shoots
//   Button     "Jump" is pressed: Pip jumps, bumps the candy block (up 6, then 3, then down), a coin springs, +100
//   88         real components rain into the frame and land in rows, with confetti
const W = RIGHT.w, H = RIGHT.h;
const FRAME = at(0, 1);
const SWITCH_AT = at(2, 3);
const BUTTON_AT = at(4, 1);
const END = at(5, 3);
const PARTS: readonly Part[] = [
  { at: FRAME, title: "Segmented", line: "Pick one of a few. Here, the time of day." },
  { at: SWITCH_AT, title: "Switch", line: "On or off: a cream knob hops along its track." },
  { at: BUTTON_AT, title: "Button", line: "Press it, and something happens." },
  { at: END, title: "88 in all", line: "Native HTML first. Most are CSS alone." },
];
const MOVES: readonly Move[] = [
  { at: at(0, 2), to: '[data-v="seg-1"]', press: at(0, 3) },
  { at: at(1, 1), to: '[data-v="seg-2"]', press: at(1, 2) },
  { at: at(2, 0), to: '[data-v="seg-3"]', press: at(2, 1) },
  { at: SWITCH_AT + MOSAIC_FRAMES + STEP, to: '[data-v="switch"]', press: at(3, 2) },
  { at: BUTTON_AT + MOSAIC_FRAMES + STEP, to: '[data-v="jump"]', press: at(4, 3) },
];
const [, , , SWITCH, JUMP] = MOVES as [Move, Move, Move, Move, Move];
const TIMES: readonly (readonly [frame: number, value: number, scheme: Scheme])[] = [
  [0, 2, "night"],
  [MOVES[0]!.press!, 0, "day"],
  [MOVES[1]!.press!, 1, "sunset"],
  [MOVES[2]!.press!, 2, "night"],
];
const TOOLTIP = SWITCH.at + 6 * TICK + STEP;
const STARS_ON = SWITCH.press! + PRESS;
const JUMP_AT = JUMP.press! + PRESS;
const WALL_AT = END + MOSAIC_FRAMES + STEP;

// The jumping level, in frame pixels: Pip and the block drawn three times as big, whole, side by side with the Jump
// button, so the press and what it does read as one picture.
const GROUND = 201;
const PIP = { x: 64, w: 42, h: 39 };
const ARC = [0, 18, 32, 42, 50, 54, 50, 42, 32, 18, 0];
const HIT = 5;
const BLOCK = { x: 67, y: GROUND - PIP.h - 54 - 36 };
const BUMP = [6, 6, 3, 3, 0];
const RISE = [7, 13, 19, 23, 25, 26, 25, 24];

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

/** The frame's world: `scheme`'s colours with `features`' sky things (a night without stars is the night's colours,
 * drawn with the day's: no moon, no stars). */
const FrameWorld = ({ scheme, features = scheme }: { readonly scheme: Scheme; readonly features?: Scheme }) => {
  const ref = useCanvas((ctx, el) => drawWorld(ctx, scheme, W, H, { from: el, features }), `${scheme} ${features}`);
  return <canvas ref={ref} className="v-pixels" width={W} height={H} />;
};

/** The state a pointed-at control shows: pressed while pressed, hovered while pointed at, the box's forced states. */
const forced = (frame: number, move: Move) => (pressing(frame, move.press) ? "active" : over(MOVES, move.to, frame) && frame < (move.press ?? 0) ? "hover" : undefined);

// ------------------------------------------------------------------ 1. Segmented: the time of day, for real

const TimeOfDay = ({ frame, scheme, v }: { readonly frame: number; readonly scheme: Scheme; readonly v: boolean }) => {
  const time = TIMES.filter((t) => t[0] <= frame).at(-1)!;
  return (
    <AbsoluteFill data-blip-scheme={scheme}>
      <FrameWorld scheme={scheme} />
      <div className="blip-box blip-card" data-size="sm" style={{ position: "absolute", left: "50%", translate: "-50% 0", top: p(20), display: "grid", gap: p(4), justifyItems: "start" }}>
        <span className="blip-label">Time of day</span>
        <div className="blip-box blip-segmented" data-size="sm">
          {["Day", "Sunset", "Night"].map((label, i) => {
            const move = MOVES.find((m) => m.to === `[data-v="seg-${i + 1}"]`)!;
            return (
              <button key={label} className="blip-box" type="button" aria-checked={time[1] === i} data-blip-state={forced(frame, move)} data-v={v ? `seg-${i + 1}` : undefined}>
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SegmentedDemo = ({ frame }: { readonly frame: number }) => {
  const i = TIMES.filter((e) => e[0] <= frame).length - 1;
  const now = TIMES[i]!, before = TIMES[Math.max(0, i - 1)]!;
  const k = ticks(frame, now[0]);
  return (
    <>
      <TimeOfDay frame={frame} scheme={now[2]} v />
      {i > 0 && k < 3 && (
        <div style={{ position: "absolute", inset: 0, mask: bayerMask(16 - 4 * (k + 1)) }}>
          <TimeOfDay frame={frame} scheme={before[2]} v={false} />
        </div>
      )}
    </>
  );
};

// ------------------------------------------------------------------ 2. Switch: the stars come out

// Where the stars come out, in frame pixels, one a Blip frame and a half after another.
const STARS: readonly (readonly [number, number])[] = [[34, 30], [210, 22], [120, 48], [70, 74], [176, 64], [228, 92], [24, 104], [146, 18], [96, 26], [196, 118]];

const SwitchDemo = ({ frame }: { readonly frame: number }) => {
  const on = frame >= STARS_ON;
  const k = ticks(frame, STARS_ON);
  return (
    <AbsoluteFill data-blip-scheme="night">
      <FrameWorld scheme="night" features={on && k >= STARS.length * 3 + 4 ? "night" : "day"} />
      {on && STARS.map(([x, y], n) => {
        const s = k - n * 3;
        if (s < 0 || k >= STARS.length * 3 + 4) return null;
        return <Sprite key={n} name={s >= 2 && s < 5 ? "sparkle" : "sparkle-small"} style={{ position: "absolute", left: p(x - 4), top: p(y - 4) }} />;
      })}
      {/* A shooting star, three pixels right and one down a Blip frame, its trail thinning out. */}
      {on && k >= 14 && k < 30 && Array.from({ length: 6 }, (_, j) => {
        const h = Math.min(k - 14, 12) - j * 0.5;
        return h < 0 || (k >= 26 && j < (k - 26) * 2) ? null : <div key={j} style={{ position: "absolute", left: p(Math.round(40 + 3 * h * 2)), top: p(Math.round(14 + h * 2)), inlineSize: p(1), blockSize: p(1), background: "var(--blip-white)" }} />;
      })}
      {/* The card at a whole two times, centred: the switch is the thing to see. */}
      <div style={{ position: "absolute", insetInline: 0, top: p(138), display: "grid", justifyItems: "center" }}>
      <div className="blip-box blip-card" data-size="sm" style={{ inlineSize: p(92), zoom: 2 }}>
        <label className="blip-check" data-layout="split" style={{ position: "relative" }}>
          Stars
          <span className="blip-box blip-switch" data-blip-state={forced(frame, SWITCH)} data-v="switch">
            <input type="checkbox" role="switch" className="blip-box" checked={on} readOnly />
          </span>
          {frame >= TOOLTIP && frame < SWITCH.press! && (
            <Beat at={TOOLTIP}>
              <span className="blip-box blip-tooltip" role="tooltip" data-side="top" data-blip-static="" style={{ position: "absolute", right: p(-6), bottom: p(18), whiteSpace: "nowrap", animation: "blip-popover-in calc(2 * var(--blip-duration-frame)) steps(1, jump-end) both" }}>
                Light the night sky
                <span className="blip-tooltip-nub" aria-hidden="true" />
              </span>
            </Beat>
          )}
        </label>
      </div>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 3. Button: Pip jumps

const ButtonDemo = ({ frame }: { readonly frame: number }) => {
  const j = ticks(frame, JUMP_AT);
  const jumping = j >= 0 && j < ARC.length;
  const y = jumping ? ARC[j]! : 0;
  const pipArt = jumping ? (j <= HIT ? "pip-jump" : "pip-fall") : Math.floor(frame / TICK) % 40 < 2 ? "pip-blink" : "pip-idle";
  const b = ticks(frame, JUMP_AT + HIT * TICK);
  const bump = b >= 0 && b < BUMP.length ? BUMP[b]! : 0;
  return (
    <AbsoluteFill data-blip-scheme="night">
      <FrameWorld scheme="night" />
      <ArtSprite name={b >= 0 ? "block-spent" : "block"} scale={3} style={{ position: "absolute", left: p(BLOCK.x), top: p(BLOCK.y - bump) }} />
      {b >= 0 && b < RISE.length && (
        <Sprite name="coin" scale={2} style={{ position: "absolute", left: p(BLOCK.x + 8), top: p(BLOCK.y - 22 - Math.round(RISE[b]! * 1.5)) }} />
      )}
      {b >= RISE.length && b < RISE.length + 6 && (
        <Sprite name={b - RISE.length >= 2 && b - RISE.length < 4 ? "sparkle" : "sparkle-small"} scale={2} style={{ position: "absolute", left: p(BLOCK.x + 6), top: p(BLOCK.y - 62) }} />
      )}
      {b >= 1 && b < 18 && (
        <span className="blip-display blip-pop" data-scale="2" data-pop="+100" style={{ position: "absolute", left: p(BLOCK.x + 46), top: p(BLOCK.y - 4 - Math.min(b - 1, 3) * 2), visibility: b < 15 || b % 2 ? "visible" : "hidden" }}>
          +100
        </span>
      )}
      <ArtSprite name={pipArt} scale={3} style={{ position: "absolute", left: p(PIP.x), top: p(GROUND - PIP.h - y) }} />
      {/* The button beside Pip, at a whole two times, on a card standing on the grass. */}
      <div style={{ position: "absolute", left: p(118), top: p(GROUND - 60) }}>
        <div className="blip-box blip-card" data-size="sm" style={{ zoom: 2 }}>
          <span className="blip-box blip-button" data-blip-state={forced(frame, JUMP)} data-v="jump"><Icon name="arrow-up" />Jump</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 4. 88: a shower of real components

// Six, each at a whole two times so it reads: a few, big, rather than many, small.
const WALL: readonly ReactNode[] = [
  <span className="blip-box blip-button" data-size="sm"><Icon name="play" />Play</span>,
  <span className="blip-box blip-tag" data-tone="success">New</span>,
  <label className="blip-check"><span className="blip-box blip-checkbox"><input type="checkbox" checked readOnly /></span>Done</label>,
  <span className="blip-box blip-switch"><input type="checkbox" role="switch" className="blip-box" checked readOnly /></span>,
  <span className="blip-box blip-avatar" data-tone="green">P<span className="blip-box blip-avatar-status" data-tone="success" /></span>,
  <span className="blip-box blip-button" data-size="sm" data-variant="soft" data-icon-only aria-label="Alerts"><Icon name="bell" /><span className="blip-box blip-badge" data-tone="danger" data-position="top-end">3</span></span>,
];
/** When wall piece `i` lands: the bottom row first, so they pile up, an eighth apart. */
const wallLand = (i: number) => WALL_AT + ((2 - Math.floor(i / 2)) * 2 + (i % 2)) * 2 * STEP;
// Each falls from above the frame in whole-pixel steps, landing with a little bounce.
const RAIN = [-120, -86, -56, -32, -14, -4, 0, -3, 0];

const WallDemo = ({ frame }: { readonly frame: number }) => (
  <AbsoluteFill style={{ background: "var(--blip-surface-panel)" }}>
    <div style={{ position: "absolute", inset: p(12), display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gridAutoRows: "1fr", placeItems: "center" }}>
      {WALL.map((w, i) => {
        const land = wallLand(i);
        const k = ticks(frame, land - (RAIN.length - 3) * TICK);
        return (
          <Beat key={i} at={land} from={land - (RAIN.length - 3) * TICK}>
            <div style={{ translate: `0 ${p(RAIN[Math.min(Math.max(k, 0), RAIN.length - 1)]!)}` }}>
              <div style={{ zoom: 2 }}>{w}</div>
            </div>
          </Beat>
        );
      })}
    </div>
    <Burst at={wallLand(1) + TICK} kind="confetti" box={[20, 0, W - 40, 10]} count={30} seed={8} />
  </AbsoluteFill>
);

// ------------------------------------------------------------------ the scene

/** The demo in the frame for `frame`: each comes in out of the mosaic and leaves through it. */
const Demo = ({ frame }: { readonly frame: number }) => {
  const parts = [FRAME, SWITCH_AT, BUTTON_AT, END];
  const i = parts.filter((f) => f <= frame).length - 1;
  const next = parts[i + 1] ?? Infinity;
  const body = [<SegmentedDemo frame={frame} />, <SwitchDemo frame={frame} />, <ButtonDemo frame={frame} />, <WallDemo frame={frame} />][i];
  return (
    <Mosaic at={i ? parts[i]! : -MOSAIC_FRAMES} mode="in">
      <Mosaic at={next - MOSAIC_FRAMES} mode="out">
        {body}
      </Mosaic>
    </Mosaic>
  );
};

export const Components = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  return (
    <Stage scheme="night">
      <AbsoluteFill>
        <Sky scheme="night" avoid={SPLIT_CLEAR} />
        <Life avoid={SPLIT_CLEAR} shooting={[at(6, 2)]} seed={9} />
      </AbsoluteFill>

      <SplitText eyebrow="88 components" parts={PARTS} />
      <DemoFrame at={FRAME}>
        <Demo frame={frame} />
      </DemoFrame>
      {frame < END && <Pointer moves={MOVES} />}

      <Sfx name="open" at={FRAME} volume={0.55} />
      {MOVES.map((m) => <Sfx key={m.at} name="look" at={m.at} volume={0.3} />)}
      {TIMES.slice(1).map(([f], n) => <Sfx key={f} name={n ? `blip@${[0, 3, 5][n]}` : "blip"} at={f} volume={0.6} />)}
      {[SWITCH_AT, BUTTON_AT, END].map((f) => <Sfx key={f} name="back" at={f - MOSAIC_FRAMES} volume={0.3} />)}
      <Sfx name="blip@7" at={SWITCH.press!} volume={0.6} />
      {STARS.map((_, n) => <Sfx key={`s${n}`} name={`step@${[2, 3, 5, 7, 8, 10, 12, 10, 12, 12][n]}`} at={STARS_ON + n * 3 * TICK} volume={0.25} />)}
      <Sfx name="select" at={JUMP.press!} volume={0.6} />
      <Sfx name="jump" at={JUMP_AT} volume={0.5} />
      <Sfx name="bump" at={JUMP_AT + HIT * TICK} volume={0.6} />
      <Sfx name="coin" at={JUMP_AT + HIT * TICK + TICK} volume={0.55} />
      {WALL.map((_, n) => <Sfx key={`w${n}`} name={`step@${[3, 5, 7, 8, 10, 12][n]}`} at={WALL_AT + n * 2 * STEP} volume={0.3} />)}
      <Sfx name="success@5" at={wallLand(1)} volume={0.55} />

      <Dissolve at={0} mode="in" seed={4} />
      <Dither at={at(8) - 8 * TICK} mode="out" />
      {music && <Music bar={COMPONENTS.bar} bars={COMPONENTS.bars} />}
    </Stage>
  );
};
