/**
 * <Divider>. CSS from @blip/components (divider.css).
 */
import { forwardRef } from "react";
import type { ElementType } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { cx, flag } from "../internal/props.js";

/** Own props of {@link Divider}. */
export interface DividerOwnProps {
  /**
   * Solid (default) between groups, dashed (three pixels on, two off), or dither, a soft break in game screens.
   * `data-variant`.
   */
  variant?: "solid" | "dashed" | "dither";
  /** The line colour (ink by day) instead of line-soft. `data-strong`. */
  strong?: boolean;
  /** Where a labelled divider's words sit: center (default), start or end. `data-align`. */
  align?: "center" | "start" | "end";
  /**
   * Vertical: upright, as tall as its row, between groups in a toolbar or cluster. On an `<hr>`. `aria-orientation`.
   */
  orientation?: "horizontal" | "vertical";
}

export type DividerProps<T extends ElementType = "hr"> = PolymorphicProps<T, DividerOwnProps>;

/**
 * A line in whole pixels between real groups of content: an `<hr>`, a separator. A stack's gap often separates enough.
 * A labelled divider is `as="div"` with a word or two, read as text; if the words name a section, use a heading
 * instead. Renders `<hr class="blip-divider">`.
 *
 *   <Divider variant="dither" />
 *   <Divider orientation="vertical" />
 *   <Divider as="div" align="start">Saved games</Divider>
 */
export const Divider = /*#__PURE__*/ forwardRef(function Divider(
  { as: Tag = "hr", variant, strong, align, orientation, className, ...rest }: DividerProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("blip-divider", className)}
      data-variant={variant}
      data-strong={flag(strong)}
      data-align={align}
      aria-orientation={orientation}
      {...rest}
    />
  );
}) as PolymorphicComponent<"hr", DividerOwnProps>;
