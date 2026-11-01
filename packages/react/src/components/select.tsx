/**
 * Select: Select and SelectOption. CSS from @jaatster/blip-components (select.css). The ref and every native prop go to the
 * control itself, so forms, labels and refs work as on the bare element; className and style go to the outermost
 * element it renders.
 */
import { forwardRef } from "react";
import { cx, type NativeProps, type Size, type Tone } from "../internal/props.js";

/** Own props of {@link Select}. */
export interface SelectOwnProps {
  /** 16, 20 (default) or 24 pixels high, as for the input. `data-size`. */
  size?: Size;
  /** A checked, valid choice: the outline and inset in success, or any tone. `data-tone`. */
  tone?: Tone;
}

export type SelectProps = SelectOwnProps & NativeProps<"select", SelectOwnProps>;

/**
 * One value from a list: the native select in the input's calm well, with a pixel chevron. Where the browser has
 * the customisable select, its picker is a Blip menu ({@link SelectOption}s are its candy rows); elsewhere the
 * browser's own list opens. Keyboard, typeahead and mobile pickers are native. One value only: `multiple` and the
 * native `size` aren't styled.
 *
 *   <Select id="world" name="world" defaultValue="caves">
 *     <SelectOption value="meadow">Meadow</SelectOption>
 *     <SelectOption value="caves">Crystal caves</SelectOption>
 *   </Select>
 *
 * Renders `<span class="chu-box chu-select"><select></span>`. The ref and every native prop (name, value, onChange,
 * the options as children…) go to the `<select>`; className and style go to the well.
 */
export const Select = /*#__PURE__*/ forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { size, tone, className, style, ...rest },
  ref,
) {
  return (
    <span className={cx("chu-box chu-select", className)} style={style} data-size={size} data-tone={tone}>
      <select ref={ref} {...rest} />
    </span>
  );
});

/** Props for {@link SelectOption}. */
export type SelectOptionProps = NativeProps<"option">;

/**
 * An option of a {@link Select}. In the customisable select's menu the row with the keyboard or pointer is a candy
 * box in the focus yellow (a plain `<option>` is a flat bar), and the chosen one has a pixel check. Renders
 * `<option class="chu-box">`.
 *
 *   <SelectOption value="caves">Crystal caves</SelectOption>
 */
export const SelectOption = /*#__PURE__*/ forwardRef<HTMLOptionElement, SelectOptionProps>(function SelectOption(
  { className, ...rest },
  ref,
) {
  return <option ref={ref} className={cx("chu-box", className)} {...rest} />;
});
