/**
 * Toggle button: ToggleButton. CSS from @jaatster/blip-components (button.css).
 */
import { forwardRef } from "react";
import { Button, type ButtonProps } from "./button.js";

/** Props for {@link ToggleButton}. */
export type ToggleButtonProps = Omit<ButtonProps, "pressed"> & {
  /** On or off. Always written (`aria-pressed="false"` when off), so it is announced as a toggle. */
  pressed: boolean;
};

/**
 * A button that stays on or off: "show grid", "favourite". On, it sits in with its bands swapped. Keep its label
 * the same in both states; the pressed state says which. Renders `<button class="blip-box blip-button"
 * type="button" aria-pressed>`.
 *
 *   <ToggleButton pressed={grid} onClick={() => setGrid(!grid)}>Show grid</ToggleButton>
 */
export const ToggleButton = /*#__PURE__*/ forwardRef<HTMLButtonElement, ToggleButtonProps>(function ToggleButton({ type = "button", ...props }, ref) {
  return <Button ref={ref} type={type} {...(props as ButtonProps)} />;
});
