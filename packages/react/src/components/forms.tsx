/**
 * Forms: a field's words (FieldLabel, FieldHelp, FieldError, FieldCount, FieldSet, PlainField), the native controls
 * in their candy boxes (Input, InputAffix, InputButton, Textarea, Select, SelectOption, Search, Checkbox, Radio,
 * RadioGroup, Switch, CheckHelp, Slider and its parts), the parts of the form elements (FileDrop, Segmented) and
 * their stand-ins with no script (RatingDisplay, SegmentedRadios). CSS from @jaatster/blip-components (field.css,
 * input.css, textarea.css, select.css, search.css, checkbox.css, radio.css, switch.css, slider.css, file-drop.css,
 * rating.css, segmented.css).
 *
 * The native controls (Input, Textarea, Select, Search, Checkbox, Radio, Switch, Slider) give the ref and every
 * native prop to the control itself, so forms, labels and refs work as on the bare element; className and style go
 * to the outermost element they render. Combobox and NumberStepper (generated) take an {@link Input} as their field.
 */
import { forwardRef } from "react";
import type { CSSProperties, ElementType, ReactNode } from "react";
import type { IconOnly } from "./actions.js";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { cx, flag, type NativeProps, type Size, type Tone } from "../internal/props.js";

/** A control with no words of its own needs a name: `aria-label`, or `aria-labelledby` naming the words' id. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

/** The user's style plus a component's public custom properties; one left undefined is not written. */
function withVars(style: CSSProperties | undefined, vars: Record<`--${string}`, number | undefined>) {
  const set = Object.entries(vars).filter(([, value]) => value !== undefined);
  return set.length ? ({ ...style, ...Object.fromEntries(set) } as CSSProperties) : style;
}

// Field: the words around a control. `Field` (the generated <pp-field> wrapper) wires them to it.

/** Props for {@link FieldLabel}: its element's own (a label's htmlFor). */
export type FieldLabelProps<T extends ElementType = "label"> = PolymorphicProps<T, object>;

/**
 * A field's label: short, bold and small; a required control adds a red `*` after it, for sight only (the control
 * says "required" itself). A `<label htmlFor>` by default; `as="span"` with an id for a control named by
 * aria-labelledby (a rating, a file drop), `as="legend"` first in a fieldset of your own. Renders `<label
 * class="pp-field-label">`.
 *
 *   <FieldLabel htmlFor="name">Player name</FieldLabel>
 *   <FieldLabel as="span" id="fun-label">How fun was it?</FieldLabel>
 */
export const FieldLabel = forwardRef(function FieldLabel(
  { as: Tag = "label", className, ...rest }: FieldLabelProps<ElementType>,
  ref,
) {
  return <Tag ref={ref} className={cx("pp-field-label", className)} {...rest} />;
}) as PolymorphicComponent<"label", object>;

/** Props for {@link FieldHelp}. */
export type FieldHelpProps = NativeProps<"p">;

/**
 * Help under a control, in muted small text: what's expected ("8 letters or more"), before it's needed. In a
 * `Field` it joins the control's description by itself; elsewhere give it an id and name it in the control's
 * aria-describedby. Renders `<p class="pp-field-help">`.
 *
 *   <FieldHelp>Shown on the leaderboard.</FieldHelp>
 */
export const FieldHelp = forwardRef<HTMLParagraphElement, FieldHelpProps>(function FieldHelp(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("pp-field-help", className)} {...rest} />;
});

/** Props for {@link FieldError}. */
export type FieldErrorProps = NativeProps<"p">;

/**
 * The error: bold, in the danger tone, after a pixel "!"; hidden while empty. Say how to fix it ("Enter an email
 * like pal@example.com"), never just "Invalid". In a `Field`, write the words with `hidden`: the element shows them
 * when the browser finds the value invalid, marks the control aria-invalid and reads the error out, and clears both
 * once the value is valid (with no words it shows the browser's message). Without the element, show it yourself,
 * name it in the control's aria-describedby and set aria-invalid on the control. Renders `<p
 * class="pp-field-error">`.
 *
 *   <FieldError hidden>Enter an email like pal@example.com.</FieldError>
 */
export const FieldError = forwardRef<HTMLParagraphElement, FieldErrorProps>(function FieldError(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("pp-field-error", className)} {...rest} />;
});

/** Own props of {@link FieldCount}. */
export interface FieldCountOwnProps {
  /** At the limit: bold, in the warning tone. In a `Field` the element sets it. `data-state="full"`. */
  full?: boolean;
}
export type FieldCountProps = FieldCountOwnProps & NativeProps<"p", FieldCountOwnProps>;

/**
 * A character count, "12/200", at the end of the row. In a `Field` leave it empty: the element counts against the
 * control's maxlength and, once typing pauses, tells screen readers how many are left. Renders `<p
 * class="pp-field-count">`.
 *
 *   <FieldCount />
 *   <FieldCount full>200/200</FieldCount>
 */
export const FieldCount = forwardRef<HTMLParagraphElement, FieldCountProps>(function FieldCount(
  { full, className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("pp-field-count", className)} data-state={full ? "full" : undefined} {...rest} />;
});

/** Own props of {@link FieldSet} and {@link RadioGroup}. */
export interface FieldSetOwnProps {
  /** The group's name, above its controls: a `<legend class="pp-field-label">`, first in the fieldset. */
  legend: ReactNode;
  /** The legend in a column beside the controls (`--pp-field-label-width`, 64 pixels). `data-layout="inline"`. */
  inline?: boolean;
}
export type FieldSetProps = FieldSetOwnProps & NativeProps<"fieldset", FieldSetOwnProps>;

/**
 * A group of checkboxes, radios or switches under a legend, with its help and error below them. Describe the group
 * with aria-describedby naming the help; `disabled` switches off every control in it. Renders `<fieldset
 * class="pp-field">` with its `<legend class="pp-field-label">`.
 *
 *   <FieldSet legend="Show on the map" aria-describedby="map-help">
 *     <Checkbox name="shops" defaultChecked>Shops</Checkbox>
 *     <Checkbox name="secrets">Secret areas</Checkbox>
 *     <FieldHelp id="map-help">Hidden things stay hidden until you find them.</FieldHelp>
 *   </FieldSet>
 */
export const FieldSet = forwardRef<HTMLFieldSetElement, FieldSetProps>(function FieldSet(
  { legend, inline, className, children, ...rest },
  ref,
) {
  return (
    <fieldset ref={ref} className={cx("pp-field", className)} data-layout={inline ? "inline" : undefined} {...rest}>
      <legend className="pp-field-label">{legend}</legend>
      {children}
    </fieldset>
  );
});

/** Own props of {@link PlainField}. */
export interface PlainFieldOwnProps {
  /** The label in a column beside the control, centred on a default-height control. `data-layout="inline"`. */
  inline?: boolean;
}
export type PlainFieldProps = PlainFieldOwnProps & NativeProps<"div", PlainFieldOwnProps>;

/**
 * A field without the element: the same label, control, help and error, wired by hand. Name the help and error in
 * the control's aria-describedby, and set aria-invalid on it while the error shows. For forms that render their own
 * errors; otherwise `Field` (`<pp-field>`) does the wiring. Renders `<div class="pp-field">`.
 *
 *   <PlainField inline>
 *     <FieldLabel htmlFor="clan">Clan tag</FieldLabel>
 *     <Input id="clan" aria-invalid aria-describedby="clan-error" />
 *     <FieldError id="clan-error">Tags are 2 to 4 letters.</FieldError>
 *   </PlainField>
 */
export const PlainField = forwardRef<HTMLDivElement, PlainFieldProps>(function PlainField(
  { inline, className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("pp-field", className)} data-layout={inline ? "inline" : undefined} {...rest} />;
});

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
 * Renders `<span class="pp-box pp-input"><input></span>`, with start and end around the input. The ref and every
 * native prop (id, name, value, onChange…) go to the `<input>`; className and style go to the well.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { size, tone, start, end, className, style, ...rest },
  ref,
) {
  return (
    <span className={cx("pp-box pp-input", className)} style={style} data-size={size} data-tone={tone}>
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
 * (aria-hidden), so say the unit in the label too when it matters. Renders `<span class="pp-input-affix"
 * aria-hidden="true">`.
 *
 *   <Input id="weight" type="number" end={<InputAffix>kg</InputAffix>} />
 */
export const InputAffix = forwardRef<HTMLSpanElement, InputAffixProps>(function InputAffix(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("pp-input-affix", className)} aria-hidden {...rest} />;
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
 * class="pp-box" data-variant="ghost" type="button">`.
 *
 *   <Input id="code" type={shown ? "text" : "password"} end={
 *     <InputButton aria-label="Show code" aria-controls="code" pressed={shown} onClick={toggle}>
 *       <Icon name="eye" />
 *     </InputButton>
 *   } />
 */
export const InputButton = forwardRef<HTMLButtonElement, InputButtonProps>(function InputButton(
  { pressed, type = "button", className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx("pp-box", className)}
      data-variant="ghost"
      type={type}
      aria-pressed={pressed}
      {...rest}
    />
  );
});

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
 * Renders `<span class="pp-box pp-textarea"><textarea></span>`. The ref and every native prop (rows, value,
 * onChange…) go to the `<textarea>`; className and style go to the well.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { size, tone, autoGrow, className, style, ...rest },
  ref,
) {
  return (
    <span
      className={cx("pp-box pp-textarea", className)}
      style={style}
      data-autogrow={flag(autoGrow)}
      data-size={size}
      data-tone={tone}
    >
      <textarea ref={ref} {...rest} />
    </span>
  );
});

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
 * Renders `<span class="pp-box pp-select"><select></span>`. The ref and every native prop (name, value, onChange,
 * the options as children…) go to the `<select>`; className and style go to the well.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { size, tone, className, style, ...rest },
  ref,
) {
  return (
    <span className={cx("pp-box pp-select", className)} style={style} data-size={size} data-tone={tone}>
      <select ref={ref} {...rest} />
    </span>
  );
});

/** Props for {@link SelectOption}. */
export type SelectOptionProps = NativeProps<"option">;

/**
 * An option of a {@link Select}. In the customisable select's menu the row with the keyboard or pointer is a candy
 * box in the focus yellow (a plain `<option>` is a flat bar), and the chosen one has a pixel check. Renders
 * `<option class="pp-box">`.
 *
 *   <SelectOption value="caves">Crystal caves</SelectOption>
 */
export const SelectOption = forwardRef<HTMLOptionElement, SelectOptionProps>(function SelectOption(
  { className, ...rest },
  ref,
) {
  return <option ref={ref} className={cx("pp-box", className)} {...rest} />;
});

/** Own props of {@link Search}. */
export interface SearchOwnProps {
  /** 16, 20 (default) or 24 pixels high, as for the input. `data-size`. */
  size?: Size;
}
export type SearchProps = SearchOwnProps & Omit<NativeProps<"input", SearchOwnProps>, "type" | "children">;

/** The magnifier in front of a search field, as the docs draw it (12 x 12). */
const magnifier =
  "M2 1h4v1H2zM1 2h1v1H1zM6 2h1v1H6zM0 3h1v4H0zM7 3h1v4H7zM1 7h1v1H1zM6 7h1v1H6zM2 8h4v1H2zM7 8h1v1H7zM7 9h2v1H7z" +
  "M8 10h2v1H8zM9 11h2v1H9z";

/**
 * A search field: an input of type search with a pixel magnifier in front and a pixel cross that clears it (the
 * browser's own, redrawn; Escape clears too). Put it in a `<search>` element, or a form with role="search", so it is
 * found as a landmark, and name it: a label (it may be `pp-sr-only`) or aria-label. The placeholder says what is
 * searched. Its enterKeyHint is "search" unless you say otherwise.
 *
 *   <search>
 *     <form action="/levels">
 *       <label className="pp-sr-only" htmlFor="q">Search levels</label>
 *       <Search id="q" name="q" placeholder="Search levels" />
 *     </form>
 *   </search>
 *
 * Renders `<span class="pp-box pp-input"><svg class="pp-icon"></svg><input type="search"></span>`. The ref and
 * every native prop go to the `<input>`; className and style go to the well.
 */
export const Search = forwardRef<HTMLInputElement, SearchProps>(function Search(
  { size, enterKeyHint = "search", className, style, ...rest },
  ref,
) {
  return (
    <span className={cx("pp-box pp-input", className)} style={style} data-size={size}>
      <svg className="pp-icon" viewBox="0 0 12 12" aria-hidden>
        <path d={magnifier} />
      </svg>
      <input ref={ref} type="search" enterKeyHint={enterKeyHint} {...rest} />
    </span>
  );
});

// Choices: a real input in a candy box, the calm well when off and candy when on, in a label row with its words.

/** Options of {@link Checkbox}, {@link Radio} and {@link Switch}. */
export interface ChoiceOptions {
  /** 9, 11 (default) or 13 pixels; the words follow. `data-size`, on the row when there are words, else the box. */
  size?: Size;
  /** The candy when on: accent by default, meaning first (success for "done"). `data-tone` on the box. */
  tone?: Tone;
  /** The words first and the control at the far end, for settings lists. `data-layout="split"` on the row. */
  split?: boolean;
}

/**
 * A checkbox, radio or switch needs a name: its label text as children (then it sits in a clickable `<label
 * class="pp-check">` row with them), or aria-label or aria-labelledby when it stands alone.
 */
export type ChoiceName =
  | { children: ReactNode }
  | { children?: undefined; "aria-label": string }
  | { children?: undefined; "aria-labelledby": string };

/** What the choice row takes besides its options. */
interface ChoiceRow extends ChoiceOptions {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/** The box round a choice's input, in a `<label class="pp-check">` row with its words when it has some. */
function choice(box: string, input: ReactNode, { size, tone, split, className, style, children }: ChoiceRow) {
  const row = children !== undefined && children !== null && typeof children !== "boolean" && children !== "";
  const control = (
    <span
      className={cx("pp-box", box, !row && className)}
      style={row ? undefined : style}
      data-size={row ? undefined : size}
      data-tone={tone}
    >
      {input}
    </span>
  );
  if (!row) return control;
  const layout = split ? "split" : undefined;
  return (
    <label className={cx("pp-check", className)} style={style} data-size={size} data-layout={layout}>
      {split ? children : null}
      {control}
      {split ? null : children}
    </label>
  );
}

/** Props for {@link Checkbox}. */
export type CheckboxProps = ChoiceOptions & ChoiceName & Omit<NativeProps<"input", ChoiceOptions>, "type" | "children">;

/**
 * A yes or no, or some choices from a list, sent with a form: a real checkbox, the calm well when off, candy with an
 * ink check when on. Children are its label text: the box and the words then sit in a `<label class="pp-check">`,
 * all of it clickable. Without words, name it with aria-label. "Some of these" is the input's `indeterminate`
 * property (candy with a bar): set it through the ref. For settings that apply at once, use a {@link Switch}.
 *
 *   <Checkbox name="music" defaultChecked>Music</Checkbox>
 *   <Checkbox aria-label="Select level 3" />
 *
 * Renders `<span class="pp-box pp-checkbox"><input type="checkbox"></span>`, in a `<label class="pp-check">` when it
 * has children. The ref and every native prop (name, checked, onChange…) go to the `<input>`; className and style go
 * to the outermost element.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { size, tone, split, className, style, children, ...rest },
  ref,
) {
  const input = <input ref={ref} type="checkbox" {...rest} />;
  return choice("pp-checkbox", input, { size, tone, split, className, style, children });
});

/** Props for {@link Radio}. */
export type RadioProps = ChoiceOptions & ChoiceName & Omit<NativeProps<"input", ChoiceOptions>, "type" | "children">;

/**
 * One option of a {@link RadioGroup}: a real radio in a round candy box, the calm well when off, candy with an ink
 * dot when on. Radios with the same name form one group, one tab stop steered by the arrow keys. Children are its
 * label text, in a clickable `<label class="pp-check">` row; without words, name it with aria-label.
 *
 *   <Radio name="level" value="normal" defaultChecked>Normal</Radio>
 *
 * Renders `<span class="pp-box pp-radio"><input type="radio"></span>`, in a `<label class="pp-check">` when it has
 * children. The ref and every native prop (name, value, checked, onChange…) go to the `<input>`; className and
 * style go to the outermost element.
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { size, tone, split, className, style, children, ...rest },
  ref,
) {
  const input = <input ref={ref} type="radio" {...rest} />;
  return choice("pp-radio", input, { size, tone, split, className, style, children });
});

/** Props for {@link RadioGroup}: a legend, and inline to put it beside the radios. */
export type RadioGroupProps = FieldSetProps;

/**
 * One choice from a list, all shown at once: {@link Radio}s with the same name in a fieldset, named by its legend.
 * Preselect a sensible default; for a required choice put `required` on the radios and the group's
 * {@link FieldError} below them. Up to about seven options; more want a {@link Select}. Renders `<fieldset
 * class="pp-field">` with its `<legend class="pp-field-label">`, as {@link FieldSet} does.
 *
 *   <RadioGroup legend="Difficulty">
 *     <Radio name="level" value="story">Story</Radio>
 *     <Radio name="level" value="normal" defaultChecked>Normal</Radio>
 *     <Radio name="level" value="hard">Hard</Radio>
 *   </RadioGroup>
 */
export const RadioGroup = forwardRef<HTMLFieldSetElement, RadioGroupProps>(function RadioGroup(props, ref) {
  return <FieldSet ref={ref} {...props} />;
});

/** Props for {@link Switch}. */
export type SwitchProps = ChoiceOptions &
  ChoiceName &
  Omit<NativeProps<"input", ChoiceOptions>, "type" | "role" | "children">;

/**
 * A setting that is on or off and applies at once (music, screen shake): a real checkbox with role="switch", so it
 * is read as "on" and "off". The knob is a cream candy box on a track that fills with candy when on. Children are
 * its label text, in a clickable `<label class="pp-check">` row (split puts the words first and the switch at the
 * far end); without words, name it with aria-label. For choices sent with a form, use a {@link Checkbox}.
 *
 *   <Switch name="shake" split>Screen shake</Switch>
 *
 * Renders `<span class="pp-box pp-switch"><input type="checkbox" role="switch" class="pp-box"></span>`, in a
 * `<label class="pp-check">` when it has children. The ref and every native prop (name, checked, onChange…) go to
 * the `<input>`; className and style go to the outermost element.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { size, tone, split, className, style, children, ...rest },
  ref,
) {
  const input = <input ref={ref} type="checkbox" role="switch" className="pp-box" {...rest} />;
  return choice("pp-switch", input, { size, tone, split, className, style, children });
});

/** Props for {@link CheckHelp}. */
export type CheckHelpProps = NativeProps<"p">;

/**
 * Help for one option, on a line of its own under the option's words: put it right after the {@link Checkbox},
 * {@link Radio} or {@link Switch} and point the input's aria-describedby at its id, so it describes the option
 * instead of lengthening its name. Renders `<p class="pp-check-help">`.
 *
 *   <Radio name="level" value="story" aria-describedby="story-help">Story</Radio>
 *   <CheckHelp id="story-help">Enemies go easy. Enjoy the view.</CheckHelp>
 */
export const CheckHelp = forwardRef<HTMLParagraphElement, CheckHelpProps>(function CheckHelp(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("pp-check-help", className)} {...rest} />;
});

// Slider: the native range input as a chunky groove and a cream candy knob, with a readout and ticks.

/** Own props of {@link Slider}. */
export interface SliderOwnProps {
  /**
   * How much of the groove is filled, 0 to 1: (value - min) / (max - min). In a `Field` the element keeps it in
   * step; without one (and without this) the groove stays empty, except in Firefox. `--pp-slider-value`, in style.
   */
  fill?: number;
}
export type SliderProps = SliderOwnProps & Omit<NativeProps<"input", SliderOwnProps>, "type" | "children">;

/**
 * A value from a range by dragging, where the feel matters more than the number: volume, brightness, speed. Label
 * it with a {@link FieldLabel}; when the number means little, set aria-valuetext ("Normal") as it changes. The keys
 * and the form value are the browser's.
 *
 *   <Field>
 *     <FieldLabel htmlFor="music">Music</FieldLabel>
 *     <SliderGroup>
 *       <Slider id="music" name="music" min={0} max={10} defaultValue={7} list="music-ticks" />
 *       <SliderValue htmlFor="music">7</SliderValue>
 *       <SliderTicks id="music-ticks"><option value="0">0</option>…<option value="10">10</option></SliderTicks>
 *     </SliderGroup>
 *   </Field>
 *   <Slider aria-label="Volume" value={volume} onChange={change} fill={volume / 100} />
 *
 * Renders `<input class="pp-slider" type="range">`. The ref and every native prop (min, max, step, value,
 * onChange…) go to it.
 */
export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  { fill, className, style, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cx("pp-slider", className)}
      type="range"
      style={withVars(style, { "--pp-slider-value": fill })}
      {...rest}
    />
  );
});

/** Props for {@link SliderGroup}. */
export type SliderGroupProps = NativeProps<"div">;

/**
 * A slider with its readout beside it and its ticks below it. Renders `<div class="pp-slider-group">`.
 *
 *   <SliderGroup>
 *     <Slider id="sfx" min={0} max={100} step={5} defaultValue={40} />
 *     <SliderValue htmlFor="sfx">40</SliderValue>
 *   </SliderGroup>
 */
export const SliderGroup = forwardRef<HTMLDivElement, SliderGroupProps>(function SliderGroup(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("pp-slider-group", className)} {...rest} />;
});

/** Props for {@link SliderValue}. */
export type SliderValueProps = NativeProps<"output">;

/**
 * A slider's value in a small panel, beside it in a {@link SliderGroup}. Screen readers skip it (aria-hidden): the
 * slider already says its value. Point htmlFor at the slider; in a `Field` the element keeps the readout in step.
 * Renders `<output class="pp-box pp-slider-value" data-variant="panel" aria-hidden="true">`.
 *
 *   <SliderValue htmlFor="music">7</SliderValue>
 */
export const SliderValue = forwardRef<HTMLOutputElement, SliderValueProps>(function SliderValue(
  { className, ...rest },
  ref,
) {
  return (
    <output ref={ref} className={cx("pp-box pp-slider-value", className)} data-variant="panel" aria-hidden {...rest} />
  );
});

/** Props for {@link SliderTicks}: its element's own (a datalist's id). */
export type SliderTicksProps<T extends ElementType = "datalist"> = PolymorphicProps<T, object>;

/**
 * Tick marks under a slider, one per child, each lined up with the knob at its value; a child's text is its label
 * ("Dim", "Normal", "Bright"). A `<datalist>` of `<option>`s, linked from the slider's list, also snaps the knob to
 * them while dragging (Chromium); `as="div"` with `<span>`s draws the same marks. Renders `<datalist
 * class="pp-slider-ticks">`.
 *
 *   <SliderTicks id="bright-ticks">
 *     <option value="1">Dim</option><option value="2">Normal</option><option value="3">Bright</option>
 *   </SliderTicks>
 */
export const SliderTicks = forwardRef(function SliderTicks(
  { as: Tag = "datalist", className, ...rest }: SliderTicksProps<ElementType>,
  ref,
) {
  return <Tag ref={ref} className={cx("pp-slider-ticks", className)} {...rest} />;
}) as PolymorphicComponent<"datalist", object>;

// File drop: the parts of `FileDrop` (<pp-file-drop>), which adds dropping, the list of files and removing.

/** Props for {@link FileDropZone}. */
export type FileDropZoneProps = NativeProps<"label">;

/**
 * The tray of a `FileDrop`: the calm well, a `<label>` round the native file input, so a click anywhere opens the
 * picker while the input keeps the focus, the keys and the form value. Put the input in it, then say what to drop in
 * a `<strong>` and what's accepted in a line under it (the input's aria-describedby). Renders `<label class="pp-box
 * pp-file-drop-zone">`.
 *
 *   <FileDrop>
 *     <FileDropZone>
 *       <input type="file" name="shots" multiple accept="image/png, image/jpeg" aria-describedby="shots-help" />
 *       <Icon name="upload" size="lg" />
 *       <strong>Drop screenshots here</strong>
 *       <span id="shots-help">or click to browse. PNG or JPG.</span>
 *     </FileDropZone>
 *   </FileDrop>
 */
export const FileDropZone = forwardRef<HTMLLabelElement, FileDropZoneProps>(function FileDropZone(
  { className, ...rest },
  ref,
) {
  return <label ref={ref} className={cx("pp-box pp-file-drop-zone", className)} {...rest} />;
});

/** Props for {@link FileDropList}. */
export type FileDropListProps = NativeProps<"ul">;

/**
 * The list of picked files, under the tray. `FileDrop` adds one by itself and fills it; put this in it, empty, to
 * place or name the list yourself (it fills the first it finds). Renders `<ul class="pp-file-drop-list">`; empty, it
 * takes no room.
 *
 *   <FileDropList aria-label="Screenshots to send" />
 */
export const FileDropList = forwardRef<HTMLUListElement, FileDropListProps>(function FileDropList(
  { className, ...rest },
  ref,
) {
  return <ul ref={ref} className={cx("pp-file-drop-list", className)} {...rest} />;
});

/** Props for {@link FileDropItem}. */
export type FileDropItemProps = NativeProps<"li">;

/**
 * One file in a {@link FileDropList}: its name, its size and its remove button. `FileDrop` draws these rows itself
 * (and replaces whatever its list holds), so render them only in a list outside it. Renders `<li class="pp-box
 * pp-file-drop-item">`.
 *
 *   <FileDropList aria-label="Files">
 *     <FileDropItem>
 *       <FileDropName title="castle-sunset.png">castle-sunset.png</FileDropName>
 *       <FileDropSize>184 kB</FileDropSize>
 *       <FileDropRemove aria-label="Remove castle-sunset.png" onClick={remove} />
 *     </FileDropItem>
 *   </FileDropList>
 */
export const FileDropItem = forwardRef<HTMLLIElement, FileDropItemProps>(function FileDropItem(
  { className, ...rest },
  ref,
) {
  return <li ref={ref} className={cx("pp-box pp-file-drop-item", className)} {...rest} />;
});

/** Props for {@link FileDropName}. */
export type FileDropNameProps = NativeProps<"span">;

/**
 * A file's name in a {@link FileDropItem}, bold, cut with an ellipsis when long: give the full name as its title.
 * Renders `<span class="pp-file-drop-name">`.
 *
 *   <FileDropName title="castle-sunset.png">castle-sunset.png</FileDropName>
 */
export const FileDropName = forwardRef<HTMLSpanElement, FileDropNameProps>(function FileDropName(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("pp-file-drop-name", className)} {...rest} />;
});

/** Props for {@link FileDropSize}. */
export type FileDropSizeProps = NativeProps<"span">;

/**
 * A file's size in a {@link FileDropItem}, muted, in tabular digits. Renders `<span class="pp-file-drop-size">`.
 *
 *   <FileDropSize>1.2 MB</FileDropSize>
 */
export const FileDropSize = forwardRef<HTMLSpanElement, FileDropSizeProps>(function FileDropSize(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("pp-file-drop-size", className)} {...rest} />;
});

/** Props for {@link FileDropRemove}. */
export type FileDropRemoveProps = Named & Omit<NativeProps<"button">, "children">;

/**
 * A file's remove button in a {@link FileDropItem}: a ghost box with a pixel cross, named "Remove" and the file's
 * name. Renders `<button type="button" class="pp-box pp-file-drop-remove" data-variant="ghost"><span
 * aria-hidden="true"></span></button>`.
 *
 *   <FileDropRemove aria-label="Remove castle-sunset.png" onClick={remove} />
 */
export const FileDropRemove = forwardRef<HTMLButtonElement, FileDropRemoveProps>(function FileDropRemove(
  { type = "button", className, ...rest },
  ref,
) {
  const classes = cx("pp-box pp-file-drop-remove", className);
  return (
    <button ref={ref} type={type} className={classes} data-variant="ghost" {...rest}>
      <span aria-hidden />
    </button>
  );
});

// Rating: `Rating` (<pp-rating>) sets a score; RatingDisplay shows one with CSS alone.

/** Own props of {@link RatingDisplay}. */
export interface RatingDisplayOwnProps {
  /** The score, 0 to max; fractions fill whole pixels (3.5 fills half a star). `--pp-rating-value`, in style. */
  value: number;
  /** How many stars: 5 by default. `--pp-rating-max`, in style. */
  max?: number;
  /** Red pixel hearts instead of stars: lives, how much you loved it. `data-shape="heart"`. */
  shape?: "heart";
}
export type RatingDisplayProps = RatingDisplayOwnProps &
  Named &
  Omit<NativeProps<"span", RatingDisplayOwnProps>, "children">;

/**
 * A score, shown with no script: a row of pixel stars (or hearts), yellow candy up to the score and sunken wells
 * after, fractions included. It is an image, so its name says the score in words. For lists of scores; to set one,
 * use `Rating` (<pp-rating>). Renders `<span class="pp-rating" role="img">`, the score in its style.
 *
 *   <RatingDisplay value={4.5} aria-label="Rated 4.5 out of 5" />
 *   <RatingDisplay value={2} max={3} shape="heart" aria-label="2 of 3 hearts left" />
 */
export const RatingDisplay = forwardRef<HTMLSpanElement, RatingDisplayProps>(function RatingDisplay(
  { value, max, shape, className, style, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cx("pp-rating", className)}
      data-shape={shape}
      role="img"
      style={withVars(style, { "--pp-rating-value": value, "--pp-rating-max": max })}
      {...rest}
    />
  );
});

// Segmented: Segment goes in `Segmented` (<pp-segmented>); SegmentedRadios is the same look from native radios.

/** Own props of {@link Segment}. */
export interface SegmentOwnProps {
  /** The value it stands for: `Segmented` takes it when this segment is chosen. `value`. */
  value: string;
  /**
   * Chosen: candy that sits in. Write it on the chosen segment so it looks right before the script runs; the
   * element keeps it in step after. `aria-checked`.
   */
  checked?: boolean;
  /** The candy when chosen (team colours). `data-tone`. */
  tone?: Tone;
}
export type SegmentProps = SegmentOwnProps &
  IconOnly &
  NativeProps<"button", SegmentOwnProps & { iconOnly?: boolean }>;

/**
 * One segment of a `Segmented` control: one or two words, or one icon (iconOnly, with aria-label). The element makes
 * the segments a radio group, steered by the arrow keys; `disabled` dithers one and skips it. Renders `<button
 * class="pp-box" type="button">`.
 *
 *   <Segmented name="view" value={view} aria-label="View" onChange={change}>
 *     <Segment value="list" checked={view === "list"}>List</Segment>
 *     <Segment value="grid" checked={view === "grid"}>Grid</Segment>
 *   </Segmented>
 */
export const Segment = forwardRef<HTMLButtonElement, SegmentProps>(function Segment(
  { value, checked, tone, iconOnly, type = "button", className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx("pp-box", className)}
      type={type}
      value={value}
      aria-checked={checked}
      data-tone={tone}
      data-icon-only={flag(iconOnly)}
      {...rest}
    />
  );
});

/** Own props of {@link SegmentedRadios}. */
export interface SegmentedRadiosOwnProps {
  /** The group's name, for screen readers only: a `<legend class="pp-sr-only">`, first in the fieldset. */
  legend: ReactNode;
  /** 16, 20 (default) or 24 pixels high, like buttons. `data-size`. */
  size?: Size;
  /** Fills its container; the segments share the width. `data-width="full"`. */
  fullWidth?: boolean;
}
export type SegmentedRadiosProps = SegmentedRadiosOwnProps & NativeProps<"fieldset", SegmentedRadiosOwnProps>;

/**
 * A segmented control with no script at all: {@link SegmentRadio}s (native radios) on the sunken rail, which the
 * browser groups and steers with the arrow keys; the checked one is candy. For buttons, a value and pp-change, use
 * `Segmented`. Renders `<fieldset class="pp-box pp-segmented">` with its `<legend class="pp-sr-only">`.
 *
 *   <SegmentedRadios legend="View">
 *     <SegmentRadio name="view" value="list">List</SegmentRadio>
 *     <SegmentRadio name="view" value="grid" defaultChecked>Grid</SegmentRadio>
 *   </SegmentedRadios>
 */
export const SegmentedRadios = forwardRef<HTMLFieldSetElement, SegmentedRadiosProps>(function SegmentedRadios(
  { legend, size, fullWidth, className, children, ...rest },
  ref,
) {
  return (
    <fieldset
      ref={ref}
      className={cx("pp-box pp-segmented", className)}
      data-size={size}
      data-width={fullWidth ? "full" : undefined}
      {...rest}
    >
      <legend className="pp-sr-only">{legend}</legend>
      {children}
    </fieldset>
  );
});

/** Own props of {@link SegmentRadio}. */
export interface SegmentRadioOwnProps {
  /** The candy when checked. `data-tone` on the segment. */
  tone?: Tone;
}
export type SegmentRadioProps = SegmentRadioOwnProps &
  IconOnly &
  Omit<NativeProps<"input", SegmentRadioOwnProps & { iconOnly?: boolean }>, "type">;

/**
 * One segment of {@link SegmentedRadios}: a native radio, invisible, in the box that shows it. Children are its label
 * text (one or two words, or one icon with iconOnly and aria-label). Give every segment of a group the same name.
 *
 *   <SegmentRadio name="view" value="grid" defaultChecked>Grid</SegmentRadio>
 *
 * Renders `<label class="pp-box"><input type="radio">…</label>`. The ref and every native prop (name, value, checked,
 * onChange…) go to the `<input>`; className and style go to the label.
 */
export const SegmentRadio = forwardRef<HTMLInputElement, SegmentRadioProps>(function SegmentRadio(
  { tone, iconOnly, className, style, children, ...rest },
  ref,
) {
  return (
    <label className={cx("pp-box", className)} style={style} data-tone={tone} data-icon-only={flag(iconOnly)}>
      <input ref={ref} type="radio" {...rest} />
      {children}
    </label>
  );
});
