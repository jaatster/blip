/**
 * Rating: RatingDisplay, the parts that go inside <Rating>, and <Rating> itself (generated from its element,
 * re-exported here). CSS from @blip/components (rating.css).
 */
import { forwardRef } from "react";
import type { CSSProperties } from "react";
import { cx, type NativeProps } from "../internal/props.js";

export { Rating, type RatingProps } from "../generated/elements.js";

/** A control with no words of its own needs a name: `aria-label`, or `aria-labelledby` naming the words' id. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

/** The user's style plus a component's public custom properties; one left undefined is not written. */
function withVars(style: CSSProperties | undefined, vars: Record<`--${string}`, number | undefined>) {
  const set = Object.entries(vars).filter(([, value]) => value !== undefined);
  return set.length ? ({ ...style, ...Object.fromEntries(set) } as CSSProperties) : style;
}

// Rating: `Rating` (<blip-rating>) sets a score; RatingDisplay shows one with CSS alone.

/** Own props of {@link RatingDisplay}. */
export interface RatingDisplayOwnProps {
  /** The score, 0 to max; fractions fill whole pixels (3.5 fills half a star). `--blip-rating-value`, in style. */
  value: number;
  /** How many stars: 5 by default. `--blip-rating-max`, in style. */
  max?: number;
  /** Red pixel hearts instead of stars: lives, how much you loved it. `data-shape="heart"`. */
  shape?: "heart";
}

export type RatingDisplayProps = RatingDisplayOwnProps &
  Named &
  Omit<NativeProps<"span", RatingDisplayOwnProps>, "children">;

/**
 * A score, shown with no script: a row of pixel stars (or hearts), yellow candy up to the score and sunken wells
 * after, fractions included. It is an image, so its name says the score in words. For lists of scores; to set one,
 * use `Rating` (<blip-rating>). Renders `<span class="blip-rating" role="img">`, the score in its style.
 *
 *   <RatingDisplay value={4.5} aria-label="Rated 4.5 out of 5" />
 *   <RatingDisplay value={2} max={3} shape="heart" aria-label="2 of 3 hearts left" />
 */
export const RatingDisplay = /*#__PURE__*/ forwardRef<HTMLSpanElement, RatingDisplayProps>(function RatingDisplay(
  { value, max, shape, className, style, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cx("blip-rating", className)}
      data-shape={shape}
      role="img"
      style={withVars(style, { "--blip-rating-value": value, "--blip-rating-max": max })}
      {...rest}
    />
  );
});
