/**
 * Stat: Stat, StatLabel, StatValue and StatDelta. CSS from @blip/components (stat.css).
 */
import { forwardRef } from "react";
import { box, cx, type NativeProps, type Scale, type Tone } from "../internal/props.js";

/** Own props of {@link Stat}. */
export interface StatOwnProps {
  /** The stat in its own panel, for a stat on its own: white (`panel`) or soft. Adds `.blip-box`. `data-variant`. */
  variant?: "panel" | "soft";
  /** A soft panel's colour. `data-tone`. */
  tone?: Tone;
}

export type StatProps = StatOwnProps & NativeProps<"div", StatOwnProps>;

/**
 * One number that matters: its label, its value said big, and how it moved. Use a {@link StatLabel}, a {@link
 * StatValue} and a {@link StatDelta}. Group stats in a `<dl>` (a grid or cluster), three to six in a row: each stat is
 * a `<div>` of a `<dt>` and `<dd>`s, so the label is read with its value. Renders `<div class="blip-stat">`.
 *
 *   <Grid as="dl" min={128}>
 *     <Stat>
 *       <StatLabel>High score</StatLabel>
 *       <StatValue scale={3} pop>98,120</StatValue>
 *       <StatDelta trend="up">+12% vs last week</StatDelta>
 *     </Stat>
 *   </Grid>
 */
export const Stat = /*#__PURE__*/ forwardRef<HTMLDivElement, StatProps>(function Stat({ variant, tone, className, ...rest }, ref) {
  return (
    <div
      ref={ref}
      className={cx(variant && "blip-box", "blip-stat", className)}
      {...box({ tone })}
      data-variant={variant}
      {...rest}
    />
  );
});

/** Props for {@link StatLabel}. */
export type StatLabelProps = NativeProps<"dt">;

/**
 * The stat's label: one to three words, upper case and muted. Renders `<dt class="blip-stat-label">`.
 *
 *   <StatLabel>Levels cleared</StatLabel>
 */
export const StatLabel = /*#__PURE__*/ forwardRef<HTMLElement, StatLabelProps>(function StatLabel({ className, ...rest }, ref) {
  return <dt ref={ref} className={cx("blip-stat-label", className)} {...rest} />;
});

/** Own props of {@link StatValue}. */
export interface StatValueOwnProps {
  /** Pixel Bop's whole scale: 1, 2 (default), 3 or 4; pick one the column can hold. `data-scale`. */
  scale?: Scale;
  /**
   * The POP tint and drop: any tone or candy (not red or green for good or bad: that is the delta's job). `data-tone`.
   */
  tone?: Tone;
  /**
   * The TV's look: white letters, an ink outline, a drop in the tone's shade and a tinted lower band. Adds `.blip-pop`
   * and `data-pop`, which holds the same text: string or number children are copied; otherwise give the text here.
   */
  pop?: boolean | string;
}

export type StatValueProps = StatValueOwnProps & NativeProps<"dd", StatValueOwnProps>;

/**
 * The value, big, in Pixel Bop with tabular digits, formatted for reading ("98,120", "412 KB"). Renders `<dd
 * class="blip-stat-value blip-display">`, with `blip-pop` and `data-pop` when it pops.
 *
 *   <StatValue scale={3} tone="green" pop>42</StatValue>
 *   <StatValue>12:30</StatValue>
 */
export const StatValue = /*#__PURE__*/ forwardRef<HTMLElement, StatValueProps>(function StatValue(
  { scale, tone, pop, className, children, ...rest },
  ref,
) {
  const popping = pop === true || typeof pop === "string";
  const text = typeof children === "string" || typeof children === "number" ? String(children) : undefined;
  return (
    <dd
      ref={ref}
      className={cx("blip-stat-value blip-display", popping && "blip-pop", className)}
      data-scale={scale}
      data-tone={tone}
      data-pop={typeof pop === "string" ? pop : popping ? text : undefined}
      {...rest}
    >
      {children}
    </dd>
  );
});

/** Own props of {@link StatDelta}. */
export interface StatDeltaOwnProps {
  /**
   * The pixel arrow before the words, and the mark after it: up is good news (success green, a check), down bad
   * (danger red, an exclamation mark), flat neither (muted, no mark). `data-trend`.
   */
  trend?: "up" | "down" | "flat";
  /**
   * What the move means when the arrow's usual meaning is wrong: `success` when down is good news (lag, lives lost),
   * `danger` when up is bad, `neutral` when it is neither (coins spent). The colour and the mark follow it.
   * `data-tone`.
   */
  tone?: "success" | "danger" | "neutral";
}

export type StatDeltaProps = StatDeltaOwnProps & NativeProps<"dd", StatDeltaOwnProps>;

/**
 * How the value moved, in words that carry the change. The words must say its sign, what it compares to, and whether
 * it is good or bad news wherever the number alone does not ("+12% vs last week", "-6, fewer is better", "+12 ms,
 * slower"). The arrow, the mark (a check for good news, an exclamation mark for bad) and the colour repeat the words
 * and are not read out. Renders `<dd class="blip-stat-delta">`.
 *
 *   <StatDelta trend="down" tone="success">-6, fewer is better</StatDelta>
 */
export const StatDelta = /*#__PURE__*/ forwardRef<HTMLElement, StatDeltaProps>(function StatDelta(
  { trend, tone, className, ...rest },
  ref,
) {
  return <dd ref={ref} className={cx("blip-stat-delta", className)} data-trend={trend} data-tone={tone} {...rest} />;
});
