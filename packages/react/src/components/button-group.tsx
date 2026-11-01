/**
 * Button group: ButtonGroup. CSS from @blip/components (button-group.css).
 */
import { forwardRef } from "react";
import { cx, flag, type NativeProps } from "../internal/props.js";

/** Props for {@link ButtonGroup}. */
export interface ButtonGroupOwnProps {
  /** One bar: shared outlines, a radius of 3 at the two ends only. Give every button the same size. `data-attached`. */
  attached?: boolean;
  /** Fills its container; the buttons share the width. `data-width="full"`. */
  fullWidth?: boolean;
}

export type ButtonGroupProps = ButtonGroupOwnProps & NativeProps<"div", ButtonGroupOwnProps>;

/**
 * Buttons that belong together: spaced (a row of actions) or attached (one bar). Name the group with aria-label.
 * Renders `<div class="blip-button-group" role="group">`; pass `role="toolbar"` for a toolbar (then make one button
 * tabbable and move with the arrow keys). A `<span role="separator" />` inside draws a divider.
 *
 *   <ButtonGroup attached aria-label="Text style">
 *     <ToggleButton variant="outline" pressed={bold}>Bold</ToggleButton>
 *     <ToggleButton variant="outline" pressed={italic}>Italic</ToggleButton>
 *   </ButtonGroup>
 */
export const ButtonGroup = /*#__PURE__*/ forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup({ attached, fullWidth, className, role = "group", ...rest }, ref) {
  return <div ref={ref} className={cx("blip-button-group", className)} role={role} data-attached={flag(attached)} data-width={fullWidth ? "full" : undefined} {...rest} />;
});
