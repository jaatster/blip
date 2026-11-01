/**
 * The row a checkbox, radio or switch sits in: shared by Checkbox, Radio and Switch (components/checkbox.tsx,
 * radio.tsx and switch.tsx), so each of them is one file plus this one.
 */
import type { CSSProperties, ReactNode } from "react";
import { cx, type Size, type Tone } from "./props.js";

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
 * class="blip-check">` row with them), or aria-label or aria-labelledby when it stands alone.
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

/** The box round a choice's input, in a `<label class="blip-check">` row with its words when it has some. */
export function choice(box: string, input: ReactNode, { size, tone, split, className, style, children }: ChoiceRow) {
  const row = children !== undefined && children !== null && typeof children !== "boolean" && children !== "";
  const control = (
    <span
      className={cx("blip-box", box, !row && className)}
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
    <label className={cx("blip-check", className)} style={style} data-size={size} data-layout={layout}>
      {split ? children : null}
      {control}
      {split ? null : children}
    </label>
  );
}
