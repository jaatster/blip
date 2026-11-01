/**
 * Input: Input, InputAffix and InputButton. CSS from @blip/components (input.css). The ref and every native prop go
 * to the control itself, so forms, labels and refs work as on the bare element; className and style go to the
 * outermost element it renders. Combobox and NumberStepper (generated) take an {@link Input} as their field.
 */
import { forwardRef } from "react";
import type { ReactNode } from "react";
import { cx, type NativeProps, type Size, type Tone } from "../internal/props.js";

/** A control with no words of its own needs a name: `aria-label`, or `aria-labelledby` naming the words' id. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

// Text controls: the native control, transparent, in the calm well (a line outline, the surface, a sunken row).

/** Own props of {@link Input}. */
export interface InputOwnProps {
  /** 16, 20 (default) or 24 pixels high, like buttons, so a field and its button line up. `data-size`. */
  size?: Size;
  /** A checked, valid value ("That name is free"): the outline and inset in success, or any tone. `data-tone`. */
  tone?: Tone;
  /** Inside the well, before the value: an icon, an {@link InputAffix} ("https://") or an {@link InputButton}. */
  start?: ReactNode;
  /** Inside the well, after the value: an {@link InputAffix} ("kg"), an icon or an {@link InputButton}. */
  end?: ReactNode;
}

export type InputProps = InputOwnProps & Omit<NativeProps<"input", InputOwnProps>, "children">;

/**
 * A text field. Every text type works: text, email, password, number, url, tel, date, time, search. Label it with
 * a {@link FieldLabel} (or aria-label) and put it in a `Field` for its help and error; it is also the field inside
 * `Combobox` and `NumberStepper`. The states come from the input: focus rings the well, aria-invalid (or
 * :user-invalid) is the danger outline, readOnly is flat, disabled is dithered.
 *
 *   <Input id="email" name="email" type="email" autoComplete="email" />
 *   <Input id="site" type="url" placeholder="pixel.example" start={<InputAffix>https://</InputAffix>} />
 *
 * Renders `<span class="blip-box blip-input"><input></span>`, with start and end around the input. The ref and every
 * native prop (id, name, value, onChange…) go to the `<input>`; className and style go to the well.
 */
export const Input = /*#__PURE__*/ forwardRef<HTMLInputElement, InputProps>(function Input(
  { size, tone, start, end, className, style, ...rest },
  ref,
) {
  return (
    <span className={cx("blip-box blip-input", className)} style={style} data-size={size} data-tone={tone}>
      {start}
      <input ref={ref} {...rest} />
      {end}
    </span>
  );
});

/** Props for {@link InputAffix}. */
export type InputAffixProps = NativeProps<"span">;

/**
 * A little muted text before or after an input's value: "https://", "kg", "$". Screen readers skip it
 * (aria-hidden), so say the unit in the label too when it matters. Renders `<span class="blip-input-affix"
 * aria-hidden="true">`.
 *
 *   <Input id="weight" type="number" end={<InputAffix>kg</InputAffix>} />
 */
export const InputAffix = /*#__PURE__*/ forwardRef<HTMLSpanElement, InputAffixProps>(function InputAffix(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("blip-input-affix", className)} aria-hidden {...rest} />;
});

/** Own props of {@link InputButton}. */
export interface InputButtonOwnProps {
  /** A toggle that is on ("show password" while it shows) or off. Leave it out on a plain button. `aria-pressed`. */
  pressed?: boolean;
}

export type InputButtonProps = InputButtonOwnProps & Named & NativeProps<"button", InputButtonOwnProps>;

/**
 * A square ghost button inside an input's well, two pixels in from its edge: "show password". It holds one icon,
 * so it needs a name (aria-label, or aria-labelledby). Pass it as the input's start or end. Renders `<button
 * class="blip-box" data-variant="ghost" type="button">`.
 *
 *   <Input id="code" type={shown ? "text" : "password"} end={
 *     <InputButton aria-label="Show code" aria-controls="code" pressed={shown} onClick={toggle}>
 *       <Icon name="eye" />
 *     </InputButton>
 *   } />
 */
export const InputButton = /*#__PURE__*/ forwardRef<HTMLButtonElement, InputButtonProps>(function InputButton(
  { pressed, type = "button", className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx("blip-box", className)}
      data-variant="ghost"
      type={type}
      aria-pressed={pressed}
      {...rest}
    />
  );
});
