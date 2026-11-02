/**
 * Field: FieldLabel, FieldHelp, FieldError, FieldCount, FieldSet and PlainField, the parts that go inside <Field>, and
 * <Field> itself (generated from its element, re-exported here). CSS from @jaatster/blip-components (field.css).
 */
import { forwardRef } from "react";
import type { ElementType, ReactNode } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { cx, type NativeProps } from "../internal/props.js";

export { Field, type FieldProps } from "../generated/elements.js";

// Field: the words around a control. `Field` (the generated <blip-field> wrapper) wires them to it.

/** Props for {@link FieldLabel}: its element's own (a label's htmlFor). */
export type FieldLabelProps<T extends ElementType = "label"> = PolymorphicProps<T, object>;

/**
 * A field's label: short, bold and small; a required control adds a red `*` after it, for sight only (the control
 * says "required" itself). A `<label htmlFor>` by default; `as="span"` with an id for a control named by
 * aria-labelledby (a rating, a file drop), `as="legend"` first in a fieldset of your own. Renders `<label
 * class="blip-field-label">`.
 *
 *   <FieldLabel htmlFor="name">Player name</FieldLabel>
 *   <FieldLabel as="span" id="fun-label">How fun was it?</FieldLabel>
 */
export const FieldLabel = /*#__PURE__*/ forwardRef(function FieldLabel(
  { as: Tag = "label", className, ...rest }: FieldLabelProps<ElementType>,
  ref,
) {
  return <Tag ref={ref} className={cx("blip-field-label", className)} {...rest} />;
}) as PolymorphicComponent<"label", object>;

/** Props for {@link FieldHelp}. */
export type FieldHelpProps = NativeProps<"p">;

/**
 * Help under a control, in muted small text: what's expected ("8 letters or more"), before it's needed. In a
 * `Field` it joins the control's description by itself; elsewhere give it an id and name it in the control's
 * aria-describedby. Renders `<p class="blip-field-help">`.
 *
 *   <FieldHelp>Shown on the leaderboard.</FieldHelp>
 */
export const FieldHelp = /*#__PURE__*/ forwardRef<HTMLParagraphElement, FieldHelpProps>(function FieldHelp(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("blip-field-help", className)} {...rest} />;
});

/** Props for {@link FieldError}. */
export type FieldErrorProps = NativeProps<"p">;

/**
 * The error: bold, in the danger tone, after a pixel "!"; hidden while empty. Say how to fix it ("Enter an email
 * like pal@example.com"), never just "Invalid". In a `Field`, write the words with `hidden`: the element shows them
 * when the browser finds the value invalid, marks the control aria-invalid and reads the error out, and clears both
 * once the value is valid (with no words it shows the browser's message). Your own error (a server's answer in your
 * state) can be rendered when you have one: the `Field` links it, marks the control while it shows and reads it out,
 * and leaves it, and any aria-invalid you set, to you. Without the element, show it yourself, name it in the
 * control's aria-describedby and set aria-invalid on the control. Renders `<p class="blip-field-error">`.
 *
 *   <FieldError hidden>Enter an email like pal@example.com.</FieldError>
 *   {serverError && <FieldError>{serverError}</FieldError>}
 */
export const FieldError = /*#__PURE__*/ forwardRef<HTMLParagraphElement, FieldErrorProps>(function FieldError(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("blip-field-error", className)} {...rest} />;
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
 * class="blip-field-count">`.
 *
 *   <FieldCount />
 *   <FieldCount full>200/200</FieldCount>
 */
export const FieldCount = /*#__PURE__*/ forwardRef<HTMLParagraphElement, FieldCountProps>(function FieldCount(
  { full, className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("blip-field-count", className)} data-state={full ? "full" : undefined} {...rest} />;
});

/** Own props of {@link FieldSet} and {@link RadioGroup}. */
export interface FieldSetOwnProps {
  /** The group's name, above its controls: a `<legend class="blip-field-label">`, first in the fieldset. */
  legend: ReactNode;
  /** The legend in a column beside the controls (`--blip-field-label-width`, 64 pixels). `data-layout="inline"`. */
  inline?: boolean;
}

export type FieldSetProps = FieldSetOwnProps & NativeProps<"fieldset", FieldSetOwnProps>;

/**
 * A group of checkboxes, radios or switches under a legend, with its help and error below them. Describe the group
 * with aria-describedby naming the help; `disabled` switches off every control in it. Renders `<fieldset
 * class="blip-field">` with its `<legend class="blip-field-label">`.
 *
 *   <FieldSet legend="Show on the map" aria-describedby="map-help">
 *     <Checkbox name="shops" defaultChecked>Shops</Checkbox>
 *     <Checkbox name="secrets">Secret areas</Checkbox>
 *     <FieldHelp id="map-help">Hidden things stay hidden until you find them.</FieldHelp>
 *   </FieldSet>
 */
export const FieldSet = /*#__PURE__*/ forwardRef<HTMLFieldSetElement, FieldSetProps>(function FieldSet(
  { legend, inline, className, children, ...rest },
  ref,
) {
  return (
    <fieldset ref={ref} className={cx("blip-field", className)} data-layout={inline ? "inline" : undefined} {...rest}>
      <legend className="blip-field-label">{legend}</legend>
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
 * errors; otherwise `Field` (`<blip-field>`) does the wiring. Renders `<div class="blip-field">`.
 *
 *   <PlainField inline>
 *     <FieldLabel htmlFor="clan">Clan tag</FieldLabel>
 *     <Input id="clan" aria-invalid aria-describedby="clan-error" />
 *     <FieldError id="clan-error">Tags are 2 to 4 letters.</FieldError>
 *   </PlainField>
 */
export const PlainField = /*#__PURE__*/ forwardRef<HTMLDivElement, PlainFieldProps>(function PlainField(
  { inline, className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("blip-field", className)} data-layout={inline ? "inline" : undefined} {...rest} />;
});
