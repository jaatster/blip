/**
 * <Cluster>. CSS from @jaatster/blip-components (cluster.css). No colour, no box: it places its children, counted in
 * pixels, and follows its container (no viewport breakpoints). It renders a <div> by default; `as` picks another
 * element (a list: `as="ul" role="list"`).
 */
import { forwardRef } from "react";
import type { ElementType } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { cx, flag, type Space } from "../internal/props.js";

/** Own props of {@link Cluster}. */
export interface ClusterOwnProps {
  /** Pixels between items (--chu-space-N); 4 by default. `data-gap`. */
  gap?: Space;
  /** Where items sit along the row: start (default), center, end, or between (both ends). `data-justify`. */
  justify?: "start" | "center" | "end" | "between";
  /** Where items sit across the row: center (default), start, end, baseline or stretch. `data-align`. */
  align?: "center" | "start" | "end" | "baseline" | "stretch";
  /**
   * Items share one row, growing to fill it, while the cluster is at least --chu-cluster-switch wide (160
   * pixels), and take a whole line each below that. `data-switch`.
   */
  switch?: boolean;
}

export type ClusterProps<T extends ElementType = "div"> = PolymorphicProps<T, ClusterOwnProps>;

/**
 * A wrapping inline group: buttons, tags, keycaps, avatars. Items keep their size and wrap when the row is full.
 * Renders `<div class="chu-cluster">`.
 *
 *   <Cluster justify="between">…</Cluster>
 *   <Cluster switch><Button variant="soft">Cancel</Button><Button>Save game</Button></Cluster>
 */
export const Cluster = /*#__PURE__*/ forwardRef(function Cluster({ as: Tag = "div", gap, justify, align, switch: wrapSwitch, className, ...rest }: ClusterProps<ElementType>, ref) {
  return <Tag ref={ref} className={cx("chu-cluster", className)} data-gap={gap} data-justify={justify} data-align={align} data-switch={flag(wrapSwitch)} {...rest} />;
}) as PolymorphicComponent<"div", ClusterOwnProps>;
