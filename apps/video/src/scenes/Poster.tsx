import { spriteCanvas } from "@jaatster/blip-game/canvas.js";
import { sprite } from "@jaatster/blip-game/sprites.js";
import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
// Starfall's own art (the docs' game, apps/docs/public/js/starfall): Pip.
// @ts-expect-error: plain JavaScript, without types
import { ART as STARFALL } from "../../../docs/public/js/starfall/art.js";
import { Big } from "../lib/Big";
import { BANNER_PARTS } from "../lib/banner-parts";
import "../lib/parade.css";
import { TICK, p, ticks } from "../lib/grid";
import { Sprite } from "../lib/Pixels";
import { Tagline, TitleWorld } from "../lib/Tagline";
import { Sfx } from "../lib/Sound";
import { Stage } from "../lib/Stage";
import { DropTitle } from "../lib/Text";

const ART = STARFALL as Record<string, { readonly tone: string; readonly map: string }>;

// The banner: what the video is, at a glance, for the frame people see before they press play. The night world, BLIP
// and its line in POP standing on it, then two rows of the parts picked for it (lib/banner-parts.ts, from their
// docs' live examples): the game kit's heart and coin, a toast, its sword and star (twice the size); a tile, the bag,
// a keycap and a button. Pip stands on the grass at their left. As a still it is the thumbnail; as the opening of the
// video it holds, then the TV switches off and the video starts as usual.

/** A part as its docs draw it, its sprites drawn by the game kit. */
const Part = ({ slug }: { readonly slug: keyof typeof BANNER_PARTS }) => (
  <div
    className="v-parade-item"
    style={{ contain: "layout", position: "relative" }}
    dangerouslySetInnerHTML={{ __html: BANNER_PARTS[slug].replace(/<blip-sprite name="([a-z-]+)"([^>]*)><\/blip-sprite>/g, (_, n: string, rest: string) => `<blip-sprite name="${n}"${rest}>${sprite(n)}</blip-sprite>`) }}
  />
);

/** The TV switching off over the last nine Blip frames from `off`: the picture folds to a line, the line to a dot. */
function screenOff(frame: number, off: number): { line: number; style: CSSProperties } {
  const k = ticks(frame, off);
  if (k < 0) return { line: 0, style: {} };
  if (k < 5) return { line: 0, style: { clipPath: `inset(${[6, 16, 28, 40, 48][k]}% 0)`, filter: `brightness(${[1.15, 1.4, 1.8, 2.2, 2.6][k]})` } };
  if (k < 9) return { line: [1, 0.6, 0.25, 0.04][k - 5]!, style: { clipPath: "inset(50% 0 50% 0)" } };
  return { line: 0, style: { clipPath: "inset(50% 0 50% 0)" } };
}
export const POSTER_OFF = 9 * TICK;

// The night world, its moon, stars and clouds kept clear of BLIP and its line (stage pixels, x0 y0 x1 y1).
const CLEAR = [[90, 10, 390, 150]] as const;

/** Pip, a pixel per sprite pixel (inside Big, a 2x pixel). */
const Pip = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const el = ref.current, art = ART["pip-idle"];
    const s = el && art && spriteCanvas(art, { from: el });
    if (!el || !s) return;
    el.width = s.width;
    el.height = s.height;
    el.style.inlineSize = p(s.width);
    el.style.blockSize = p(s.height);
    el.getContext("2d")!.drawImage(s, 0, 0);
  }, []);
  return <canvas ref={ref} style={{ imageRendering: "pixelated", display: "block" }} />;
};

/** The banner. As a still it never switches off; as the social cut's opening it holds `hold` frames, switching off at the end. */
export const Poster = ({ hold }: { readonly hold?: number }) => {
  const frame = useCurrentFrame();
  const off = hold ? screenOff(frame, hold - POSTER_OFF) : { line: 0, style: {} };
  return (
    <Stage scheme="night" style={{ background: "var(--blip-ink)" }}>
      <AbsoluteFill style={off.style}>
        <TitleWorld avoid={CLEAR} />
        <div className="v-center" style={{ gap: p(10), paddingBlockEnd: p(20) }}>
          <DropTitle text="Blip" lands={[-99, -99, -99, -99]} scale={8} outline={2} />
          {/* BLIP's face carries room under its letters; the line tucks up into it. */}
          <div style={{ marginBlockStart: p(-20) }}><Tagline field={false} /></div>
          <div style={{ display: "grid", justifyItems: "center", gap: p(8), marginBlockStart: p(4) }}>
            <div style={{ display: "flex", alignItems: "center", gap: p(10) }}>
              <Sprite name="heart" scale={2} />
              <Sprite name="coin" scale={2} />
              <Part slug="toast" />
              <Sprite name="sword" scale={2} />
              <Sprite name="star" scale={2} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: p(10) }}>
              <Part slug="tile" />
              <Part slug="inventory" />
              <Part slug="keycap" />
              <Part slug="button" />
            </div>
          </div>
        </div>
        {/* Pip on the grass. */}
        <div style={{ position: "absolute", left: p(14), top: p(225) }}>
          <Big x={2}>
            <div style={{ position: "relative" }}>
              <Pip />
            </div>
          </Big>
        </div>
      </AbsoluteFill>
      {off.line > 0 && (
        <div style={{ position: "absolute", insetInline: `${(1 - off.line) * 50}%`, insetBlockStart: "50%", blockSize: p(1), background: "var(--blip-white)" }} />
      )}
      {hold && <Sfx name="bump" at={hold - POSTER_OFF + 5 * TICK} volume={0.5} />}
    </Stage>
  );
};
