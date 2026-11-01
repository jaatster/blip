/**
 * Layout primitives: Stack, Cluster, Grid. No colour, no box: they place their children, counted in pixels, and
 * follow their container (no viewport breakpoints). CSS from @jaatster/blip-components (stack.css, cluster.css,
 * grid.css). Each renders a <div> by default; `as` picks another element (a list: `<Grid as="ul" role="list">`).
 */
import { forwardRef } from "react";
import type { ElementType } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { cx, flag, type Space } from "../internal/props.js";

/** Own props of {@link Stack}. */
export interface StackOwnProps {
  /** Pixels between children (--pp-space-N); 8 by default. `data-gap`. */
  gap?: Space;
  /** Where children sit across the stack: stretch (default), start, center or end. `data-align`. */
  align?: "stretch" | "start" | "center" | "end";
}
export type StackProps<T extends ElementType = "div"> = PolymorphicProps<T, StackOwnProps>;

/**
 * Vertical rhythm: children one under another, a token gap apart. Put `data-push` on a child to push it (and
 * everything after it) to the far end, a footer at the bottom. Renders `<div class="pp-stack">`.
 *
 *   <Stack gap={4} align="start">…</Stack>
 */
export const Stack = /*#__PURE__*/ forwardRef(function Stack({ as: Tag = "div", gap, align, className, ...rest }: StackProps<ElementType>, ref) {
  return <Tag ref={ref} className={cx("pp-stack", className)} data-gap={gap} data-align={align} {...rest} />;
}) as PolymorphicComponent<"div", StackOwnProps>;

/** Own props of {@link Cluster}. */
export interface ClusterOwnProps {
  /** Pixels between items (--pp-space-N); 4 by default. `data-gap`. */
  gap?: Space;
  /** Where items sit along the row: start (default), center, end, or between (both ends). `data-justify`. */
  justify?: "start" | "center" | "end" | "between";
  /** Where items sit across the row: center (default), start, end, baseline or stretch. `data-align`. */
  align?: "center" | "start" | "end" | "baseline" | "stretch";
  /**
   * Items share one row, growing to fill it, while the cluster is at least --pp-cluster-switch wide (160
   * pixels), and take a whole line each below that. `data-switch`.
   */
  switch?: boolean;
}
export type ClusterProps<T extends ElementType = "div"> = PolymorphicProps<T, ClusterOwnProps>;

/**
 * A wrapping inline group: buttons, tags, keycaps, avatars. Items keep their size and wrap when the row is full.
 * Renders `<div class="pp-cluster">`.
 *
 *   <Cluster justify="between">…</Cluster>
 *   <Cluster switch><Button variant="soft">Cancel</Button><Button>Save game</Button></Cluster>
 */
export const Cluster = /*#__PURE__*/ forwardRef(function Cluster({ as: Tag = "div", gap, justify, align, switch: wrapSwitch, className, ...rest }: ClusterProps<ElementType>, ref) {
  return <Tag ref={ref} className={cx("pp-cluster", className)} data-gap={gap} data-justify={justify} data-align={align} data-switch={flag(wrapSwitch)} {...rest} />;
}) as PolymorphicComponent<"div", ClusterOwnProps>;

/** Own props of {@link Grid}. */
export interface GridOwnProps {
  /** A column's minimum width in pixels; 96 by default (cards 96 to 160, stats 48 to 128). `data-min`. */
  min?: 32 | 48 | 64 | 80 | 96 | 128 | 160 | 192;
  /** Pixels between cells (--pp-space-N); 8 by default. `data-gap`. */
  gap?: Space;
  /** Keeps empty columns when there are few items, so two cards don't stretch across a wide row. `data-fill`. */
  fill?: boolean;
}
export type GridProps<T extends ElementType = "div"> = PolymorphicProps<T, GridOwnProps>;

/**
 * As many equal columns as fit, each at least a minimum width; one column when the container is narrower. A grid
 * of things is usually a list (`as="ul" role="list"`); of label-value pairs, a `<dl>`. Renders `<div
 * class="pp-grid">`.
 *
 *   <Grid as="ul" role="list" min={128}>…cards…</Grid>
 */
export const Grid = /*#__PURE__*/ forwardRef(function Grid({ as: Tag = "div", min, gap, fill, className, ...rest }: GridProps<ElementType>, ref) {
  return <Tag ref={ref} className={cx("pp-grid", className)} data-min={min} data-gap={gap} data-fill={flag(fill)} {...rest} />;
}) as PolymorphicComponent<"div", GridOwnProps>;
