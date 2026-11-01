/**
 * Radio group: Radio and RadioGroup. CSS from @jaatster/blip-components (radio.css). The ref and every native prop go to the
 * control itself, so forms, labels and refs work as on the bare element; className and style go to the outermost
 * element it renders.
 */
import { forwardRef } from "react";
import type { NativeProps } from "../internal/props.js";
import { choice, type ChoiceOptions, type ChoiceName } from "../internal/choice.js";
import { FieldSet, type FieldSetProps } from "./field.js";

/** Props for {@link Radio}. */
export type RadioProps = ChoiceOptions & ChoiceName & Omit<NativeProps<"input", ChoiceOptions>, "type" | "children">;

/**
 * One option of a {@link RadioGroup}: a real radio in a round candy box, the calm well when off, candy with an ink
 * dot when on. Radios with the same name form one group, one tab stop steered by the arrow keys. Children are its
 * label text, in a clickable `<label class="chu-check">` row; without words, name it with aria-label.
 *
 *   <Radio name="level" value="normal" defaultChecked>Normal</Radio>
 *
 * Renders `<span class="chu-box chu-radio"><input type="radio"></span>`, in a `<label class="chu-check">` when it has
 * children. The ref and every native prop (name, value, checked, onChange…) go to the `<input>`; className and
 * style go to the outermost element.
 */
export const Radio = /*#__PURE__*/ forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { size, tone, split, className, style, children, ...rest },
  ref,
) {
  const input = <input ref={ref} type="radio" {...rest} />;
  return choice("chu-radio", input, { size, tone, split, className, style, children });
});

/** Props for {@link RadioGroup}: a legend, and inline to put it beside the radios. */
export type RadioGroupProps = FieldSetProps;

/**
 * One choice from a list, all shown at once: {@link Radio}s with the same name in a fieldset, named by its legend.
 * Preselect a sensible default; for a required choice put `required` on the radios and the group's
 * {@link FieldError} below them. Up to about seven options; more want a {@link Select}. Renders `<fieldset
 * class="chu-field">` with its `<legend class="chu-field-label">`, as {@link FieldSet} does.
 *
 *   <RadioGroup legend="Difficulty">
 *     <Radio name="level" value="story">Story</Radio>
 *     <Radio name="level" value="normal" defaultChecked>Normal</Radio>
 *     <Radio name="level" value="hard">Hard</Radio>
 *   </RadioGroup>
 */
export const RadioGroup = /*#__PURE__*/ forwardRef<HTMLFieldSetElement, RadioGroupProps>(function RadioGroup(props, ref) {
  return <FieldSet ref={ref} {...props} />;
});
