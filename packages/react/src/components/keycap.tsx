/**
 * Keycap: Keycap and Keys. CSS from @jaatster/blip-components (keycap.css).
 */
import { forwardRef } from "react";
import { box, cx, flag, type NativeProps, type Size, type Tone } from "../internal/props.js";

/** Own props of {@link Keycap}. */
export interface KeycapOwnProps {
  /**
   * 10, 12 (default) or 16 pixels high: medium sits in body text, large for prompts and shortcut sheets. `data-size`.
   */
  size?: Size;
  /**
   * Cream (default), neutral, or a tone or candy: a gamepad's buttons (A green, B red, X blue, Y slate). `data-tone`.
   */
  tone?: Tone;
  /** Shows the key held down: it sits in its drop (key tests, tutorials). `data-blip-pressed`. */
  pressed?: boolean;
}

export type KeycapProps = KeycapOwnProps & NativeProps<"kbd", KeycapOwnProps>;

/**
 * A key to press, drawn as a little key standing up off the page. It is a `<kbd>`, so assistive technology knows it is
 * keyboard input: write the label as the key reads ("Ctrl", "Esc"), not as a symbol. A picture, never a control.
 * Renders `<kbd class="blip-box blip-keycap">`.
 *
 *   <p>Press <Keycap>Esc</Keycap> to pause.</p>
 *   <Keycap size="lg" tone="green">A</Keycap>
 */
export const Keycap = /*#__PURE__*/ forwardRef<HTMLElement, KeycapProps>(function Keycap(
  { size, tone, pressed, className, ...rest },
  ref,
) {
  return (
    <kbd
      ref={ref}
      className={cx("blip-box blip-keycap", className)}
      {...box({ tone })}
      data-size={size}
      data-blip-pressed={flag(pressed)}
      {...rest}
    />
  );
});

/** Props for {@link Keys}. */
export type KeysProps = NativeProps<"kbd">;

/**
 * A key combination: an outer `<kbd>` holding keycaps, with a quiet "+" between them. Renders `<kbd
 * class="blip-keys">`.
 *
 *   <Keys><Keycap>Ctrl</Keycap>+<Keycap>K</Keycap></Keys>
 */
export const Keys = /*#__PURE__*/ forwardRef<HTMLElement, KeysProps>(function Keys({ className, ...rest }, ref) {
  return <kbd ref={ref} className={cx("blip-keys", className)} {...rest} />;
});
