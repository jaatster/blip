/**
 * <Stack>. CSS from @jaatster/blip-components (stack.css). No colour, no box: it places its children, counted in pixels,
 * and follows its container (no viewport breakpoints). It renders a <div> by default; `as` picks another element (a
 * list: `as="ul" role="list"`).
 */
import { forwardRef } from "react";
import type { ElementType } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { cx, type Space } from "../internal/props.js";

/** Own props of {@link Stack}. */
export interface StackOwnProps {
  /** Pixels between children (--blip-space-N); 8 by default. `data-gap`. */
  gap?: Space;
  /** Where children sit across the stack: stretch (default), start, center or end. `data-align`. */
  align?: "stretch" | "start" | "center" | "end";
}

export type StackProps<T extends ElementType = "div"> = PolymorphicProps<T, StackOwnProps>;

/**
 * Vertical rhythm: children one under another, a token gap apart. Put `data-push` on a child to push it (and
 * everything after it) to the far end, a footer at the bottom. Renders `<div class="blip-stack">`.
 *
 *   <Stack gap={4} align="start">…</Stack>
 */
export const Stack = /*#__PURE__*/ forwardRef(function Stack({ as: Tag = "div", gap, align, className, ...rest }: StackProps<ElementType>, ref) {
  return <Tag ref={ref} className={cx("blip-stack", className)} data-gap={gap} data-align={align} {...rest} />;
}) as PolymorphicComponent<"div", StackOwnProps>;
