/**
 * <Grid>. CSS from @blip/components (grid.css). No colour, no box: it places its children, counted in pixels,
 * and follows its container (no viewport breakpoints). It renders a <div> by default; `as` picks another element (a
 * list: `as="ul" role="list"`).
 */
import { forwardRef } from "react";
import type { ElementType } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { cx, flag, type Space } from "../internal/props.js";

/** Own props of {@link Grid}. */
export interface GridOwnProps {
  /** A column's minimum width in pixels; 96 by default (cards 96 to 160, stats 48 to 128). `data-min`. */
  min?: 32 | 48 | 64 | 80 | 96 | 128 | 160 | 192;
  /** Pixels between cells (--blip-space-N); 8 by default. `data-gap`. */
  gap?: Space;
  /** Keeps empty columns when there are few items, so two cards don't stretch across a wide row. `data-fill`. */
  fill?: boolean;
}

export type GridProps<T extends ElementType = "div"> = PolymorphicProps<T, GridOwnProps>;

/**
 * As many equal columns as fit, each at least a minimum width; one column when the container is narrower. A grid
 * of things is usually a list (`as="ul" role="list"`); of label-value pairs, a `<dl>`. Renders `<div
 * class="blip-grid">`.
 *
 *   <Grid as="ul" role="list" min={128}>…cards…</Grid>
 */
export const Grid = /*#__PURE__*/ forwardRef(function Grid({ as: Tag = "div", min, gap, fill, className, ...rest }: GridProps<ElementType>, ref) {
  return <Tag ref={ref} className={cx("blip-grid", className)} data-min={min} data-gap={gap} data-fill={flag(fill)} {...rest} />;
}) as PolymorphicComponent<"div", GridOwnProps>;
