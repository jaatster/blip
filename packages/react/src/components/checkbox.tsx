/**
 * Checkbox: Checkbox and CheckHelp. CSS from @jaatster/blip-components (checkbox.css). The ref and every native prop go to
 * the control itself, so forms, labels and refs work as on the bare element; className and style go to the outermost
 * element it renders.
 */
import { forwardRef } from "react";
import { cx, type NativeProps } from "../internal/props.js";
import { choice, type ChoiceOptions, type ChoiceName } from "../internal/choice.js";

/** Props for {@link Checkbox}. */
export type CheckboxProps = ChoiceOptions & ChoiceName & Omit<NativeProps<"input", ChoiceOptions>, "type" | "children">;

/**
 * A yes or no, or some choices from a list, sent with a form: a real checkbox, the calm well when off, candy with an
 * ink check when on. Children are its label text: the box and the words then sit in a `<label class="chu-check">`,
 * all of it clickable. Without words, name it with aria-label. "Some of these" is the input's `indeterminate`
 * property (candy with a bar): set it through the ref. For settings that apply at once, use a {@link Switch}.
 *
 *   <Checkbox name="music" defaultChecked>Music</Checkbox>
 *   <Checkbox aria-label="Select level 3" />
 *
 * Renders `<span class="chu-box chu-checkbox"><input type="checkbox"></span>`, in a `<label class="chu-check">` when it
 * has children. The ref and every native prop (name, checked, onChange…) go to the `<input>`; className and style go
 * to the outermost element.
 */
export const Checkbox = /*#__PURE__*/ forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { size, tone, split, className, style, children, ...rest },
  ref,
) {
  const input = <input ref={ref} type="checkbox" {...rest} />;
  return choice("chu-checkbox", input, { size, tone, split, className, style, children });
});

/** Props for {@link CheckHelp}. */
export type CheckHelpProps = NativeProps<"p">;

/**
 * Help for one option, on a line of its own under the option's words: put it right after the {@link Checkbox},
 * {@link Radio} or {@link Switch} and point the input's aria-describedby at its id, so it describes the option
 * instead of lengthening its name. Renders `<p class="chu-check-help">`.
 *
 *   <Radio name="level" value="story" aria-describedby="story-help">Story</Radio>
 *   <CheckHelp id="story-help">Enemies go easy. Enjoy the view.</CheckHelp>
 */
export const CheckHelp = /*#__PURE__*/ forwardRef<HTMLParagraphElement, CheckHelpProps>(function CheckHelp(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("chu-check-help", className)} {...rest} />;
});
