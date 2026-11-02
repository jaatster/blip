/**
 * Segmented control: Segment, SegmentedRadios and SegmentRadio, the parts that go inside <Segmented>, and <Segmented>
 * itself (generated from its element, re-exported here). CSS from @jaatster/blip-components (segmented.css).
 */
import { forwardRef } from "react";
import type { ReactNode } from "react";
import { cx, flag, type NativeProps, type Size, type Tone, type IconOnly } from "../internal/props.js";

export { Segmented, type SegmentedProps } from "../generated/elements.js";

// Segmented: Segment goes in `Segmented` (<blip-segmented>); SegmentedRadios is the same look from native radios.

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
 * class="blip-box" type="button">`.
 *
 *   <Segmented name="view" value={view} aria-label="View" onChange={change}>
 *     <Segment value="list" checked={view === "list"}>List</Segment>
 *     <Segment value="grid" checked={view === "grid"}>Grid</Segment>
 *   </Segmented>
 */
export const Segment = /*#__PURE__*/ forwardRef<HTMLButtonElement, SegmentProps>(function Segment(
  { value, checked, tone, iconOnly, type = "button", className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx("blip-box", className)}
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
  /** The group's name, for screen readers only: a `<legend class="blip-sr-only">`, first in the fieldset. */
  legend: ReactNode;
  /** 16, 20 (default) or 24 pixels high, like buttons. `data-size`. */
  size?: Size;
  /** Fills its container; the segments share the width. `data-width="full"`. */
  fullWidth?: boolean;
}

export type SegmentedRadiosProps = SegmentedRadiosOwnProps & NativeProps<"fieldset", SegmentedRadiosOwnProps>;

/**
 * A segmented control with no script at all: {@link SegmentRadio}s (native radios) on the sunken rail, which the
 * browser groups and steers with the arrow keys; the checked one is candy. For buttons, a value and blip-change, use
 * `Segmented`. Renders `<fieldset class="blip-box blip-segmented">` with its `<legend class="blip-sr-only">`.
 *
 *   <SegmentedRadios legend="View">
 *     <SegmentRadio name="view" value="list">List</SegmentRadio>
 *     <SegmentRadio name="view" value="grid" defaultChecked>Grid</SegmentRadio>
 *   </SegmentedRadios>
 */
export const SegmentedRadios = /*#__PURE__*/ forwardRef<HTMLFieldSetElement, SegmentedRadiosProps>(function SegmentedRadios(
  { legend, size, fullWidth, className, children, ...rest },
  ref,
) {
  return (
    <fieldset
      ref={ref}
      className={cx("blip-box blip-segmented", className)}
      data-size={size}
      data-width={fullWidth ? "full" : undefined}
      {...rest}
    >
      <legend className="blip-sr-only">{legend}</legend>
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
 * Renders `<label class="blip-box"><input type="radio">…</label>`. The ref and every native prop (name, value, checked,
 * onChange…) go to the `<input>`; className and style go to the label.
 */
export const SegmentRadio = /*#__PURE__*/ forwardRef<HTMLInputElement, SegmentRadioProps>(function SegmentRadio(
  { tone, iconOnly, className, style, children, ...rest },
  ref,
) {
  return (
    <label className={cx("blip-box", className)} style={style} data-tone={tone} data-icon-only={flag(iconOnly)}>
      <input ref={ref} type="radio" {...rest} />
      {children}
    </label>
  );
});
