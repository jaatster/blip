/**
 * Stage: Stage, StageGround and StageScrim. CSS from @blip/game (stage.css).
 */
import { forwardRef } from "react";
import type { CSSProperties, ElementType } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../../internal/polymorphic.js";
import { cx, flag, type NativeProps } from "../../internal/props.js";

/** The user's style plus a component's public custom properties; one left undefined is not written. */
function withVars(
  style: CSSProperties | undefined,
  vars: Record<`--${string}`, number | undefined>,
): CSSProperties | undefined {
  const set = Object.entries(vars).filter(([, value]) => value !== undefined);
  return set.length ? ({ ...style, ...Object.fromEntries(set) } as CSSProperties) : style;
}

/** Own props of {@link Stage}. */
export interface StageOwnProps {
  /** An ink edge and a drop, for a screen set into a page. `data-frame`. */
  frame?: boolean;
  /** Its own time of day, whatever the page's: a night level on a day page. `data-blip-scheme`. */
  scheme?: "day" | "sunset" | "night";
}

export type StageProps<T extends ElementType = "section"> = PolymorphicProps<T, StageOwnProps>;

/**
 * A game screen for a HUD, a menu or a map to sit on: a positioned frame with a pastel sky, six hard bands of the
 * scheme's world palette stepping up from a {@link StageGround}, dithered where they meet. For the full world, with
 * mountains, hills and clouds, pass a `<World>` (from @blip/react/effects) as its first child; until it draws,
 * the banded sky shows. Name it if it is a region of the page.
 *
 *   <Stage frame aria-label="Puddle Path">
 *     <World />
 *     <Hud>…</Hud>
 *     <StageGround />
 *   </Stage>
 *
 * Renders `<section class="blip-stage">`; `as="div"` for a small one inside something else (a feature's picture).
 */
export const Stage = /*#__PURE__*/ forwardRef(function Stage(
  { as: Tag = "section", frame, scheme, className, ...rest }: StageProps<ElementType>,
  ref,
) {
  return (
    <Tag ref={ref} className={cx("blip-stage", className)} data-frame={flag(frame)} data-blip-scheme={scheme} {...rest} />
  );
}) as PolymorphicComponent<"section", StageOwnProps>;

/** Own props of {@link StageGround}. */
export interface StageGroundOwnProps {
  /** The ground's height in pixels; 16 by default. `--blip-stage-ground`. */
  height?: number;
  children?: never;
}

export type StageGroundProps = StageGroundOwnProps & NativeProps<"div", StageGroundOwnProps>;

/**
 * The ground along the bottom of a {@link Stage}: blades of grass, a light top row, grass, a darker lip, then dirt
 * with pebbles and a few flowers. Last in the stage.
 *
 *   <StageGround />
 *   <StageGround height={10} />
 *
 * Renders `<div class="blip-stage-ground">`.
 */
export const StageGround = /*#__PURE__*/ forwardRef<HTMLDivElement, StageGroundProps>(function StageGround(
  { height, className, style, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx("blip-stage-ground", className)}
      style={withVars(style, { "--blip-stage-ground": height })}
      {...rest}
    />
  );
});

/** Props for {@link StageScrim}. */
export type StageScrimProps = NativeProps<"div">;

/**
 * A dithered ink layer over everything on a {@link Stage}, for a pause or a menu over the game: a checkerboard,
 * never a translucent wash. (A modal {@link PauseMenu} brings its own as its backdrop.)
 *
 *   <Stage frame aria-label="Puddle Path, paused">
 *     <Hud aria-hidden="true">…</Hud>
 *     <StageGround />
 *     <StageScrim />
 *     <PauseMenu open aria-labelledby="pause-title">…</PauseMenu>
 *   </Stage>
 *
 * Renders `<div class="blip-scrim">`.
 */
export const StageScrim = /*#__PURE__*/ forwardRef<HTMLDivElement, StageScrimProps>(function StageScrim({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("blip-scrim", className)} {...rest} />;
});
