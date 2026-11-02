import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { spriteCanvas } from "@jaatster/blip-game/canvas.js";
// Starfall's own art (the docs' game, apps/docs/public/js/starfall): Pip.
// @ts-expect-error: plain JavaScript, without types
import { ART as STARFALL } from "../../../docs/public/js/starfall/art.js";
import { Beat } from "../lib/Beat";
import { Big } from "../lib/Big";
import { TICK, at, p, ticks } from "../lib/grid";
import { Icon } from "../lib/Icon";
import { Burst, Life, Sky, Sprite } from "../lib/Pixels";
import { Music, Sfx } from "../lib/Sound";
import { DemoFrame, HERO, SHOW_CLEAR, SplitText, type Part } from "../lib/Split";
import { Stage } from "../lib/Stage";
import { DISSOLVE_FRAMES, Dissolve } from "../lib/Transitions";

/** Bars 5-8 of the theme: the groove. */
export const MODULAR = { bar: 5, bars: 4 };

// Modular: Blip building itself from its layers, a layer a bar, no words but the title.
//   bar 0  the tokens: its colours drop in as pixel chips, an eighth apart (the accent's light, base and shade, ink,
//          white, cream)
//   bar 1  core: the chips gather into one and the candy box builds itself tier by tier on the eighths, with the
//          box's own tiers: an outline, then the soft fill and its band, then the candy with its bands and glints
//   bar 2  components: the box takes its icon and label and is a real Play button; it is pressed on the beat
//   bar 3  kits: Pip drops onto it, it presses under him, a coin springs out, sparkles and confetti
type Art = { readonly tone: string; readonly map: string };
const ART = STARFALL as Record<string, Art>;

// Each layer names itself as it arrives, so the build explains itself without a line of text: the tokens, the core's
// candy box, the component it becomes, and the kits on top.
const PARTS: readonly Part[] = [
  { at: at(0, 0, 2), title: "Tokens", line: "" },
  { at: at(1), title: "Core", line: "" },
  { at: at(2), title: "Components", line: "" },
  { at: at(3), title: "Kits", line: "" },
];
const CHIPS = ["var(--blip-accent-light)", "var(--blip-accent)", "var(--blip-accent-shade)", "var(--blip-ink)", "var(--blip-white)", "var(--blip-candy-cream)"];
const CHIP_LANDS = CHIPS.map((_, i) => at(0, 1) + i * 10);
const GATHER = at(1);
const TIERS: readonly (readonly [frame: number, variant: string])[] = [
  [at(1, 1), "outline"],
  [at(1, 2), "soft"],
  [at(1, 3), "candy"],
];
const LABEL = at(2);
const PRESS = at(2, 2);
const PIP = at(3);
const PIP_LAND = PIP + 5 * TICK;
const COIN = at(3, 1);

// The chips, in stage pixels: 24 square with 16 between, in a row across the middle of the hero.
const CHIP = 24, GAP = 16;
const ROW_W = CHIPS.length * CHIP + (CHIPS.length - 1) * GAP;
const LOWER = 16;
const CX = HERO.x + HERO.w / 2, CY = HERO.y + HERO.h / 2 + LOWER;
// A drop with a little overshoot: falls, lands a pixel low, settles.
const DROP = [-36, -22, -10, -3, 1, 0];
// Gathering: each chip slides to the middle in four even steps.
const GATHER_STEPS = 4;
// Pip's fall onto the button, in its 3x pixels, and his hop when the coin pops.
// A short drop from just over the button, clear of the title above.
const PIP_FALL = [-14, -9, -5, -2, 0];
const HOP = [0, 3, 5, 3, 0];
const RISE = [4, 7, 9, 10, 11, 11];

/** One of Starfall's sprites, a pixel per sprite pixel (inside Big, a 3x pixel). */
const ArtSprite = ({ name, style }: { readonly name: string; readonly style?: CSSProperties }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const el = ref.current, art = ART[name];
    const s = el && art && spriteCanvas(art, { from: el });
    if (!el || !s) return;
    el.width = s.width;
    el.height = s.height;
    el.style.inlineSize = p(s.width);
    el.style.blockSize = p(s.height);
    el.getContext("2d")!.drawImage(s, 0, 0);
  }, [name]);
  return <canvas ref={ref} style={{ imageRendering: "pixelated", display: "block", ...style }} />;
};

/** The colour chips: dropping in, then gathering into the middle, where the box appears. */
const Chips = ({ frame }: { readonly frame: number }) => {
  if (frame >= TIERS[0]![0]) return null;
  const g = Math.min(GATHER_STEPS, Math.max(0, ticks(frame, GATHER) + 1));
  return (
    <>
      {CHIPS.map((colour, i) => {
        const k = ticks(frame, CHIP_LANDS[i]! - (DROP.length - 2) * TICK);
        if (k < 0) return null;
        const x0 = CX - ROW_W / 2 + i * (CHIP + GAP), x = Math.round(x0 + ((CX - CHIP / 2 - x0) * g) / GATHER_STEPS);
        return (
          <div
            key={colour}
            style={{
              position: "absolute", left: p(x), top: p(CY - CHIP / 2 + DROP[Math.min(k, DROP.length - 1)]!),
              inlineSize: p(CHIP), blockSize: p(CHIP), background: colour,
              boxShadow: `0 0 0 ${p(1)} var(--blip-ink), ${p(1)} ${p(2)} 0 0 var(--blip-ink)`,
            }}
          />
        );
      })}
    </>
  );
};

/** The candy box at three times the pixel: its tiers, then the Play button it becomes, and Pip on top. */
const Box = ({ frame }: { readonly frame: number }) => {
  const tier = TIERS.filter((t) => t[0] <= frame).at(-1);
  if (!tier) return null;
  const labelled = frame >= LABEL;
  const pk = ticks(frame, PIP);
  const hk = ticks(frame, COIN);
  const pressed = (frame >= PRESS && frame < PRESS + 3 * TICK) || (frame >= PIP_LAND && frame < PIP_LAND + 3 * TICK);
  const pipY = pk < PIP_FALL.length ? PIP_FALL[Math.max(0, pk)]! : hk >= 0 && hk < HOP.length ? -HOP[hk]! : 0;
  const pipArt = pk < PIP_FALL.length - 1 ? "pip-fall" : hk >= 0 && hk < 2 ? "pip-jump" : hk >= 2 && hk < HOP.length ? "pip-fall" : ticks(frame, PIP_LAND) % 14 === 12 ? "pip-blink" : "pip-idle";
  const c = ticks(frame, COIN);
  return (
    <div style={{ position: "relative" }}>
      <Beat at={labelled ? (frame >= PRESS ? PRESS : LABEL) : tier[0]}>
        <span
          className="blip-box blip-button blip-pop-in"
          data-size="lg"
          data-variant={labelled ? undefined : tier[1]}
          data-blip-state={pressed ? "active" : undefined}
          style={{ position: "relative", inlineSize: p(64), paddingInline: 0, marginInlineStart: p(1) }}
        >
          {/* (The left margin matches the box's own on its right, kept for its drop, so the box itself is centred.) */}
          {/* The icon and label are there from the start, unseen, so the box keeps one size as it builds. */}
          <span style={{ display: "contents", visibility: labelled ? "visible" : "hidden" }}>
            <span className={labelled && frame < PRESS ? "blip-drop-in" : undefined} style={{ display: "inline-flex", alignItems: "center", gap: p(4), visibility: labelled ? "visible" : "hidden" }}>
              <Icon name="play" />
              Play
            </span>
          </span>
          {labelled && <span className="blip-glint" aria-hidden="true" />}
        </span>
      </Beat>

      {pk >= 0 && (
        <div style={{ position: "absolute", left: "50%", marginInlineStart: p(-7), top: p(-13 + pipY + (pressed && pk >= PIP_FALL.length ? 1 : 0)) }}>
          <ArtSprite name={pipArt} />
        </div>
      )}
      {/* The coin springs up beside Pip, clear of the title. */}
      {c >= 0 && c < RISE.length && <Sprite name="coin" style={{ position: "absolute", left: "50%", marginInlineStart: p(14), top: p(-8 - RISE[c]!) }} />}
    </div>
  );
};

export const Modular = ({ music = true }: { readonly music?: boolean }) => {
  const frame = useCurrentFrame();
  return (
    <Stage scheme="night" mosaicIn>
      <AbsoluteFill>
        <Sky scheme="night" avoid={SHOW_CLEAR} />
        <Life avoid={SHOW_CLEAR} shooting={[at(1, 2)]} seed={51} />
      </AbsoluteFill>

      <SplitText eyebrow="Modular" parts={PARTS} />
      <Chips frame={frame} />
      <DemoFrame at={TIERS[0]![0]}>
        {/* The box sits a little under the hero's middle, so Pip, his coin and the confetti have room under the title. */}
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", paddingBlockStart: p(2 * LOWER) }}>
          <Big x={3}>
            <Box frame={frame} />
          </Big>
        </div>
      </DemoFrame>

      {/* In stage pixels: the gathering's flash in the middle, and the coin's sparkle and the confetti over the button. */}
      <Burst at={TIERS[0]![0]} kind="sparkle" box={[CX - 40, CY - 30, 80, 60]} count={8} seed={4} scale={2} />
      <Burst at={COIN + 6 * TICK} kind="sparkle" box={[CX + 36, CY - 36 - 3 * 19, 30, 24]} count={6} seed={9} scale={2} />
      <Burst at={COIN} kind="confetti" box={[HERO.x + 30, HERO.y - 6 + LOWER, HERO.w - 60, 6]} count={36} seed={12} scale={2} />

      {CHIP_LANDS.map((f, i) => <Sfx key={f} name={i ? `step@${[0, 2, 3, 5, 7, 8][i]}` : "step"} at={f} volume={0.5} />)}
      <Sfx name="look" at={GATHER} volume={0.45} />
      {TIERS.map(([f], i) => <Sfx key={f} name={`blip@${[3, 5, 7][i]}`} at={f} volume={0.5} />)}
      <Sfx name="open" at={LABEL} volume={0.55} />
      <Sfx name="select" at={PRESS} volume={0.65} />
      <Sfx name="jump" at={PIP} volume={0.45} />
      <Sfx name="bump" at={PIP_LAND} volume={0.5} />
      <Sfx name="select@5" at={PIP_LAND} volume={0.5} />
      <Sfx name="coin" at={COIN} volume={0.6} />
      <Sfx name="success@5" at={COIN + 2 * TICK} volume={0.45} />

      {music && <Music bar={MODULAR.bar} bars={MODULAR.bars} />}
      <Dissolve at={at(4) - DISSOLVE_FRAMES} mode="out" seed={3} />
    </Stage>
  );
};
