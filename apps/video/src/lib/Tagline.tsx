import { drawWorld } from "@jaatster/blip-effects/world.js";
import { useCurrentFrame } from "remotion";
import { Beat } from "./Beat";
import { TICK, p } from "./grid";
import { H, W, useCanvas } from "./Pixels";
import { DropTitle, letterLands } from "./Text";

export const COMMAND = "npm install @jaatster/blip-components";
export const TAGLINE = "16-bit pixel modular design system";

/**
 * Under BLIP, with nothing behind them: the line in Blip's own display face, twice the size on two lines, with its POP tint and ink outline (as
 * every title stands on the world), its letters rising in a Blip frame apart from `line`; and under it the real
 * install field on its own, popping in at `install` with the command typed `typed` letters in. Both are laid out
 * from the first frame (unseen until their turn), so BLIP never moves. Leave `line` out to show the line whole.
 */
export const Tagline = ({ line, install = -Infinity, typed = COMMAND.length, field = true, oneLine = false }: {
  readonly line?: number;
  readonly install?: number;
  readonly typed?: number;
  /** Whether the install field shows under the line. */
  readonly field?: boolean;
  /** On one line, for the banner, where the parts need the room under it. */
  readonly oneLine?: boolean;
}) => {
  const frame = useCurrentFrame();
  const lands = line === undefined ? [...TAGLINE].map(() => -999) : letterLands(TAGLINE, line, TICK);
  return (
    <div style={{ display: "grid", gap: p(10), justifyItems: "center" }}>
      {/* Twice the size, on two lines (it wraps between words): a lockup under BLIP, read at a glance. */}
      <div style={{ maxInlineSize: oneLine ? "none" : p(280), whiteSpace: oneLine ? "nowrap" : undefined, textAlign: "center", lineHeight: 1.15 }}>
        <DropTitle text={TAGLINE} lands={lands} scale={2} outline={1} motion="rise" />
      </div>
      {field && (
        <div style={{ visibility: frame >= install ? "visible" : "hidden" }}>
          <Beat at={install} from={-Infinity}>
            <div className="blip-pop-in">
              {/* The whole command, unseen, in the input's cell: the well is as wide as the command, no wider, from the start. */}
              <span className="blip-box blip-input" data-size="lg" style={{ display: "inline-grid", gridTemplateColumns: "auto auto" }}>
                <span className="blip-input-affix" aria-hidden="true" style={{ gridArea: "1 / 1" }}>$</span>
                <span aria-hidden="true" style={{ gridArea: "1 / 2", visibility: "hidden", whiteSpace: "pre", paddingInlineEnd: p(1) }}>{COMMAND}</span>
                <input value={COMMAND.slice(0, Math.max(0, typed))} aria-label="Install" readOnly style={{ gridArea: "1 / 2" }} />
              </span>
            </div>
          </Beat>
        </div>
      )}
    </div>
  );
};

/** The title screens' night world, its moon, stars and clouds kept clear of BLIP (stage pixels, x0 y0 x1 y1). */
export const TITLE_CLEAR = [[120, 20, 360, 125]] as const;

/** The full night world, its sky keeping clear of `avoid` (BLIP by default), so the moon never sits behind a letter. */
export const TitleWorld = ({ avoid = TITLE_CLEAR }: { readonly avoid?: readonly (readonly [number, number, number, number])[] }) => {
  const ref = useCanvas((ctx, el) => drawWorld(ctx, "night", W, H, { from: el, avoid }), JSON.stringify(avoid));
  return <canvas ref={ref} className="v-pixels" width={W} height={H} />;
};
