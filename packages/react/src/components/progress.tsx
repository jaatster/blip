/**
 * Progress: Progress, ProgressLabel and Meter. CSS from @blip/components (progress.css).
 */
import { forwardRef } from "react";
import { box, cx, type NativeProps, type Size, type Tone } from "../internal/props.js";

/** A name for something whose words don't name it: `aria-label` or `aria-labelledby`. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

/** Every bar needs a name: the `id` a `<label htmlFor>` points at, `aria-label` or `aria-labelledby`. */
type BarName = Named | { id: string };

/** Own props of {@link Progress}. */
export interface ProgressOwnProps {
  /**
   * The fill: accent (default), an intent or a candy name; success when done, danger for a draining thing (a
   * boss's health). Don't make it yellow: yellow means focus. `data-tone` on the well.
   */
  tone?: Exclude<Tone, "neutral">;
  /** 7, 8 (default) or 12 pixels high, in blocks 3, 4 or 6 pixels wide. `data-size` on the well. */
  size?: Size;
}

export type ProgressProps = ProgressOwnProps & BarName & NativeProps<"progress", ProgressOwnProps>;

/**
 * How far a task has got: a native `<progress>` drawn as a row of candy blocks in an ink-outlined well. Without a
 * `value` it is indeterminate (two lit blocks march along); use that only until you can show one. The ref and every
 * prop except `className` and `style` (which go to the well) are the `<progress>`'s own; its children are the
 * fallback text, equal to the value. Name it: a `<label htmlFor>` in a {@link ProgressLabel} row, `aria-label` or
 * `aria-labelledby`, and `aria-valuetext` when a number says too little ("3 of 8 files"). It is not a live region:
 * announce the start and the end, not every step. Renders `<div class="blip-box blip-progress"><progress>`.
 *
 *   <ProgressLabel><label htmlFor="load">Loading World 2</label><span>60%</span></ProgressLabel>
 *   <Progress id="load" tone="success" max={100} value={60}>60%</Progress>
 *   <Progress aria-label="Finding a match">Searching</Progress>
 */
export const Progress = /*#__PURE__*/ forwardRef<HTMLProgressElement, ProgressProps>(function Progress(
  { tone, size, className, style, ...rest },
  ref,
) {
  return (
    <div className={cx("blip-box blip-progress", className)} style={style} {...box({ tone })} data-size={size}>
      <progress ref={ref} {...rest} />
    </div>
  );
});

/** Props for {@link ProgressLabel}. */
export type ProgressLabelProps = NativeProps<"div">;

/**
 * The row above a bar: its name first, the value in words last. The name is a `<label htmlFor>` the bar's id; the value
 * is said the way people think of it ("3 of 8 files", "Done"). Renders `<div class="blip-progress-label">`.
 *
 *   <ProgressLabel><label htmlFor="up">Uploading replay</label><span>3 of 8 files</span></ProgressLabel>
 */
export const ProgressLabel = /*#__PURE__*/ forwardRef<HTMLDivElement, ProgressLabelProps>(function ProgressLabel(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("blip-progress-label", className)} {...rest} />;
});

/** Own props of {@link Meter}. */
export interface MeterOwnProps {
  /**
   * One colour whatever the value (a magic bar is always blue). Left out, the colour follows the meter's `low`,
   * `high` and `optimum`: green when good, orange when not, red when worse. `data-tone` on the well.
   */
  tone?: Exclude<Tone, "neutral">;
  /** 7, 8 (default) or 12 pixels high, in blocks 3, 4 or 6 pixels wide. `data-size` on the well. */
  size?: Size;
}

export type MeterProps = MeterOwnProps & BarName & NativeProps<"meter", MeterOwnProps>;

/**
 * An amount within a range that is not a task (health, storage, signal), as a native `<meter>`. It is drawn as candy
 * blocks in a well. The ref and every prop except `className` and `style` (which go to the well) are the `<meter>`'s
 * own; its children are the fallback text. Name it, and say the value in words nearby ("Health 2/10"): colour is never
 * the only cue. Renders `<div class="blip-box blip-meter"><meter>`.
 *
 *   <Meter min={0} max={10} low={4} high={7} optimum={10} value={6} aria-label="Health">6 of 10</Meter>
 */
export const Meter = /*#__PURE__*/ forwardRef<HTMLMeterElement, MeterProps>(function Meter(
  { tone, size, className, style, ...rest },
  ref,
) {
  return (
    <div className={cx("blip-box blip-meter", className)} style={style} {...box({ tone })} data-size={size}>
      <meter ref={ref} {...rest} />
    </div>
  );
});
