/**
 * <Textarea>. CSS from @blip/components (textarea.css). The ref and every native prop go to the control
 * itself, so forms, labels and refs work as on the bare element; className and style go to the outermost element it
 * renders.
 */
import { forwardRef } from "react";
import { cx, flag, type NativeProps, type Size, type Tone } from "../internal/props.js";

/** Own props of {@link Textarea}. */
export interface TextareaOwnProps {
  /** The text size and corner, as for the input: sm, md (default) or lg. `data-size`. */
  size?: Size;
  /** A checked, valid value: the outline and inset in success, or any tone. `data-tone`. */
  tone?: Tone;
  /**
   * Grows with the text from its rows up to 12 lines, then scrolls, with no grip (where the browser has
   * field-sizing; a fixed height elsewhere). `data-autogrow`.
   */
  autoGrow?: boolean;
}

export type TextareaProps = TextareaOwnProps & Omit<NativeProps<"textarea", TextareaOwnProps>, "children">;

/**
 * Several lines of text, in the input's calm well; the person can drag it taller by its pixel grip, or it grows by
 * itself (autoGrow). Pair maxLength with a {@link FieldCount} in a `Field`. States as for the input.
 *
 *   <Textarea id="bio" name="bio" rows={4} maxLength={200} />
 *   <Textarea id="note" rows={2} autoGrow />
 *
 * Renders `<span class="blip-box blip-textarea"><textarea></span>`. The ref and every native prop (rows, value,
 * onChange…) go to the `<textarea>`; className and style go to the well.
 */
export const Textarea = /*#__PURE__*/ forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { size, tone, autoGrow, className, style, ...rest },
  ref,
) {
  return (
    <span
      className={cx("blip-box blip-textarea", className)}
      style={style}
      data-autogrow={flag(autoGrow)}
      data-size={size}
      data-tone={tone}
    >
      <textarea ref={ref} {...rest} />
    </span>
  );
});
