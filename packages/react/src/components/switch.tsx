/**
 * <Switch>. CSS from @jaatster/blip-components (switch.css). The ref and every native prop go to the control itself, so
 * forms, labels and refs work as on the bare element; className and style go to the outermost element it renders.
 */
import { forwardRef } from "react";
import type { NativeProps } from "../internal/props.js";
import { choice, type ChoiceOptions, type ChoiceName } from "../internal/choice.js";

/** Props for {@link Switch}. */
export type SwitchProps = ChoiceOptions &
  ChoiceName &
  Omit<NativeProps<"input", ChoiceOptions>, "type" | "role" | "children">;

/**
 * A setting that is on or off and applies at once (music, screen shake): a real checkbox with role="switch", so it
 * is read as "on" and "off". The knob is a cream candy box on a track that fills with candy when on. Children are
 * its label text, in a clickable `<label class="chu-check">` row (split puts the words first and the switch at the
 * far end); without words, name it with aria-label. For choices sent with a form, use a {@link Checkbox}.
 *
 *   <Switch name="shake" split>Screen shake</Switch>
 *
 * Renders `<span class="chu-box chu-switch"><input type="checkbox" role="switch" class="chu-box"></span>`, in a
 * `<label class="chu-check">` when it has children. The ref and every native prop (name, checked, onChange…) go to
 * the `<input>`; className and style go to the outermost element.
 */
export const Switch = /*#__PURE__*/ forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { size, tone, split, className, style, children, ...rest },
  ref,
) {
  const input = <input ref={ref} type="checkbox" role="switch" className="chu-box" {...rest} />;
  return choice("chu-switch", input, { size, tone, split, className, style, children });
});
