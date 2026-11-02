/**
 * Tooltip: TooltipChip and TooltipNub, the parts that go inside <Tooltip>, and <Tooltip> itself (generated from its
 * element, re-exported here). CSS from @jaatster/blip-components (tooltip.css).
 */
import { forwardRef } from "react";
import { cx, flag } from "../internal/props.js";
import type { NativeProps } from "../internal/props.js";

export { Tooltip, type TooltipProps } from "../generated/elements.js";

/** Own props of {@link TooltipChip}. */
export interface TooltipChipOwnProps {
  /** Where it sits by its trigger: top (default), bottom, left or right; the nub points the other way. `data-side`. */
  side?: "top" | "bottom" | "left" | "right";
  /** Drawn in the page flow, beside its trigger: docs, tests and screenshots. `data-blip-static`. */
  static?: boolean;
}

/** Props for {@link TooltipChip}. */
export type TooltipChipProps = TooltipChipOwnProps & NativeProps<"span", TooltipChipOwnProps>;

/**
 * The tooltip's chip without its element: the markup `<Tooltip>` makes, for a picture of one. Text only, ending
 * with a {@link TooltipNub}. To describe a trigger with it, give it an id and point the trigger's `aria-describedby`
 * at it. A live tooltip that shows on hover and focus is `<Tooltip>`.
 *
 *   <TooltipChip side="bottom" static>Settings (S)<TooltipNub /></TooltipChip>
 *
 * Renders `<span class="blip-box blip-tooltip" role="tooltip">`.
 */
export const TooltipChip = /*#__PURE__*/ forwardRef<HTMLSpanElement, TooltipChipProps>(function TooltipChip(
  { side, static: isStatic, className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cx("blip-box blip-tooltip", className)}
      role="tooltip"
      data-side={side}
      data-blip-static={flag(isStatic)}
      {...rest}
    />
  );
});

/** Props for {@link TooltipNub}. */
export type TooltipNubProps = Omit<NativeProps<"span">, "children">;

/**
 * The chip's nub, last in a {@link TooltipChip}: seven pixels wide and four deep, pointing at the trigger's middle.
 * (`<Tooltip>` adds its own.)
 *
 *   <TooltipNub />
 *
 * Renders `<span class="blip-tooltip-nub" aria-hidden="true">`.
 */
export const TooltipNub = /*#__PURE__*/ forwardRef<HTMLSpanElement, TooltipNubProps>(function TooltipNub(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("blip-tooltip-nub", className)} aria-hidden="true" {...rest} />;
});
