/**
 * Slider: Slider, SliderGroup, SliderValue and SliderTicks. CSS from @jaatster/blip-components (slider.css). The ref and
 * every native prop go to the control itself, so forms, labels and refs work as on the bare element; className and
 * style go to the outermost element it renders.
 */
import { forwardRef } from "react";
import type { CSSProperties, ElementType } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { cx, type NativeProps } from "../internal/props.js";

/** The user's style plus a component's public custom properties; one left undefined is not written. */
function withVars(style: CSSProperties | undefined, vars: Record<`--${string}`, number | undefined>) {
  const set = Object.entries(vars).filter(([, value]) => value !== undefined);
  return set.length ? ({ ...style, ...Object.fromEntries(set) } as CSSProperties) : style;
}

// Slider: the native range input as a chunky groove and a cream candy knob, with a readout and ticks.

/** Own props of {@link Slider}. */
export interface SliderOwnProps {
  /**
   * How much of the groove is filled, 0 to 1: (value - min) / (max - min). In a `Field` the element keeps it in
   * step; without one (and without this) the groove stays empty, except in Firefox. `--blip-slider-value`, in style.
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
 * Renders `<input class="blip-slider" type="range">`. The ref and every native prop (min, max, step, value,
 * onChange…) go to it.
 */
export const Slider = /*#__PURE__*/ forwardRef<HTMLInputElement, SliderProps>(function Slider(
  { fill, className, style, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cx("blip-slider", className)}
      type="range"
      style={withVars(style, { "--blip-slider-value": fill })}
      {...rest}
    />
  );
});

/** Props for {@link SliderGroup}. */
export type SliderGroupProps = NativeProps<"div">;

/**
 * A slider with its readout beside it and its ticks below it. Renders `<div class="blip-slider-group">`.
 *
 *   <SliderGroup>
 *     <Slider id="sfx" min={0} max={100} step={5} defaultValue={40} />
 *     <SliderValue htmlFor="sfx">40</SliderValue>
 *   </SliderGroup>
 */
export const SliderGroup = /*#__PURE__*/ forwardRef<HTMLDivElement, SliderGroupProps>(function SliderGroup(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("blip-slider-group", className)} {...rest} />;
});

/** Props for {@link SliderValue}. */
export type SliderValueProps = NativeProps<"output">;

/**
 * A slider's value in a small panel, beside it in a {@link SliderGroup}. Screen readers skip it (aria-hidden): the
 * slider already says its value. Point htmlFor at the slider; in a `Field` the element keeps the readout in step.
 * Renders `<output class="blip-box blip-slider-value" data-variant="panel" aria-hidden="true">`.
 *
 *   <SliderValue htmlFor="music">7</SliderValue>
 */
export const SliderValue = /*#__PURE__*/ forwardRef<HTMLOutputElement, SliderValueProps>(function SliderValue(
  { className, ...rest },
  ref,
) {
  return (
    <output ref={ref} className={cx("blip-box blip-slider-value", className)} data-variant="panel" aria-hidden {...rest} />
  );
});

/** Props for {@link SliderTicks}: its element's own (a datalist's id). */
export type SliderTicksProps<T extends ElementType = "datalist"> = PolymorphicProps<T, object>;

/**
 * Tick marks under a slider, one per child, each lined up with the knob at its value; a child's text is its label
 * ("Dim", "Normal", "Bright"). A `<datalist>` of `<option>`s, linked from the slider's list, also snaps the knob to
 * them while dragging (Chromium); `as="div"` with `<span>`s draws the same marks. Renders `<datalist
 * class="blip-slider-ticks">`.
 *
 *   <SliderTicks id="bright-ticks">
 *     <option value="1">Dim</option><option value="2">Normal</option><option value="3">Bright</option>
 *   </SliderTicks>
 */
export const SliderTicks = /*#__PURE__*/ forwardRef(function SliderTicks(
  { as: Tag = "datalist", className, ...rest }: SliderTicksProps<ElementType>,
  ref,
) {
  return <Tag ref={ref} className={cx("blip-slider-ticks", className)} {...rest} />;
}) as PolymorphicComponent<"datalist", object>;
