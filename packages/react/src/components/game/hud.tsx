/**
 * HUD: Hud, HudGroup, HudStat, HudLabel, HudBar, HudTrack and CounterIcon. CSS from @jaatster/blip-game (hud.css). Hearts and counters
 * are elements: use the generated <Hearts> and <Counter> from this same entry point.
 */
import { forwardRef } from "react";
import type { CSSProperties } from "react";
import { cx, type NativeProps, type Tone } from "../../internal/props.js";

/** Something that shows only pictures or numbers needs a name: `aria-label`, or `aria-labelledby`. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

/** The user's style plus a component's public custom properties; one left undefined is not written. */
function withVars(
  style: CSSProperties | undefined,
  vars: Record<`--${string}`, number | undefined>,
): CSSProperties | undefined {
  const set = Object.entries(vars).filter(([, value]) => value !== undefined);
  return set.length ? ({ ...style, ...Object.fromEntries(set) } as CSSProperties) : style;
}

/** Props for {@link Hud}. */
export type HudProps = NativeProps<"div">;

/**
 * The heads-up display over a game: rows of {@link HudGroup}s that wrap, the last kept to the far side even on a
 * row of its own. Numbers are Pixel Bop's tabular digits in POP, so they read on any part of the world and never
 * shift. Keep it to the top edge, out of the play, and pad scores so it never jiggles.
 *
 *   <Hud>
 *     <HudGroup>
 *       <Hearts value={3.5} max={5} label="Health" />
 *       <HudStat>
 *         <HudLabel>MP</HudLabel>
 *         <HudBar value={5} max={8} segments={8} tone="blue" aria-label="Magic" />
 *       </HudStat>
 *     </HudGroup>
 *     <HudGroup>
 *       <Counter value={42} pad={3} label="Coins" sound="coin"><Sprite name="coin" /></Counter>
 *       <Counter value={12450} pad={7} label="Score"><HudLabel>Score</HudLabel></Counter>
 *       <Counter value={165} format="time" low={30} label="Time" quiet><Sprite name="clock" /></Counter>
 *     </HudGroup>
 *   </Hud>
 *
 * Renders `<div class="blip-hud">`.
 */
export const Hud = /*#__PURE__*/ forwardRef<HTMLDivElement, HudProps>(function Hud({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("blip-hud", className)} {...rest} />;
});

/** Props for {@link HudGroup}. */
export type HudGroupProps = NativeProps<"div">;

/**
 * Things in the HUD that stay together, in a row that wraps: hearts and a bar, or the counters.
 *
 *   <HudGroup><Hearts value={3} max={5} label="Health" /><HudStat>…</HudStat></HudGroup>
 *
 * Renders `<div class="blip-hud-group">`.
 */
export const HudGroup = /*#__PURE__*/ forwardRef<HTMLDivElement, HudGroupProps>(function HudGroup({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("blip-hud-group", className)} {...rest} />;
});

/** Props for {@link HudStat}. */
export type HudStatProps = NativeProps<"div">;

/**
 * A label beside its bar or number.
 *
 *   <HudStat><HudLabel>HP</HudLabel><HudBar value={7} aria-label="Health" /></HudStat>
 *
 * Renders `<div class="blip-hud-stat">`.
 */
export const HudStat = /*#__PURE__*/ forwardRef<HTMLDivElement, HudStatProps>(function HudStat({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("blip-hud-stat", className)} {...rest} />;
});

/** Props for {@link HudLabel}. */
export type HudLabelProps = NativeProps<"span">;

/**
 * A HUD label: one short word in capitals (HP, MP, Score), in Pixel Bop at scale 1, POP. Hidden from assistive
 * technology by default, because the bar's or counter's name says the same; pass `aria-hidden={false}` when it is
 * the only name.
 *
 *   <HudLabel>MP</HudLabel>
 *
 * Renders `<span class="blip-hud-label blip-display blip-pop" data-scale="1" aria-hidden="true">`.
 */
export const HudLabel = /*#__PURE__*/ forwardRef<HTMLSpanElement, HudLabelProps>(function HudLabel({ className, ...rest }, ref) {
  return (
    <span
      ref={ref}
      className={cx("blip-hud-label blip-display blip-pop", className)}
      data-scale={1}
      aria-hidden={true}
      {...rest}
    />
  );
});

/** Own props of {@link HudBar}. */
export interface HudBarOwnProps {
  /** The value, drawn in whole segments (rounded down) and announced. `--blip-hud-value` and `aria-valuenow`. */
  value: number;
  /** The most it can be; 10 by default. `--blip-hud-max` and `aria-valuemax`. */
  max?: number;
  /** How many segments the bar has, each five pixels wide; 10 by default. `--blip-hud-segments`. */
  segments?: number;
  /** The fill's colour: success (default), or any tone: `blue` for mana, `danger` when low. `data-tone`. */
  tone?: Tone;
  children?: never;
}

/** Props for {@link HudBar}: a meter needs a name, `aria-label` or `aria-labelledby` ("Magic"). */
export type HudBarProps = HudBarOwnProps & Named & NativeProps<"div", HudBarOwnProps>;

/**
 * A segmented health or mana bar: a slate track in a candy box, segments five pixels wide with ink between, filled
 * in whole segments. A meter from 0 to `max`: its value is the drawing's, so they never disagree. Low is red and
 * shorter, never colour alone.
 *
 *   <HudBar value={5} max={8} segments={8} tone="blue" aria-label="Magic" />
 *   <HudBar value={2} tone="danger" aria-label="Health, low" />
 *
 * Renders `<div class="blip-box blip-hud-bar" role="meter" aria-valuemin="0" aria-valuemax aria-valuenow
 * style="--blip-hud-value: …">` with its `<span class="blip-hud-bar-fill">` inside.
 */
export const HudBar = /*#__PURE__*/ forwardRef<HTMLDivElement, HudBarProps>(function HudBar(
  { value, max, segments, tone, className, style, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx("blip-box blip-hud-bar", className)}
      data-tone={tone}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={max ?? 10}
      aria-valuenow={value}
      style={withVars(style, { "--blip-hud-value": value, "--blip-hud-max": max, "--blip-hud-segments": segments })}
      {...rest}
    >
      <span className="blip-hud-bar-fill" />
    </div>
  );
});

/** Own props of {@link HudTrack}. */
export interface HudTrackOwnProps {
  /** How far, filled a whole pixel at a time and announced. `--blip-hud-value` and `aria-valuenow`. */
  value: number;
  /** How far there is to go; 100 by default. `--blip-hud-max` and `aria-valuemax`. */
  max?: number;
  /** How many pixels long the track is; 80 by default. `--blip-hud-length`. */
  length?: number;
  /** Where the marks are (a checkpoint, a boss), of `max`: a white tick each. */
  marks?: readonly number[];
  /** What the value means, for screen readers: "62%, past the checkpoint". `aria-valuetext`. */
  valueText?: string;
  /** The fill's and the arrow's colour: the accent (default), or any tone. `data-tone`. */
  tone?: Tone;
  children?: never;
}

/** Props for {@link HudTrack}: a meter needs a name, `aria-label` or `aria-labelledby` ("Course"). */
export type HudTrackProps = HudTrackOwnProps & Named & NativeProps<"div", HudTrackOwnProps>;

/**
 * How far through a level: a slate track the length of the level, filled to where you are with a pixel arrow over the
 * end, and a white tick at each mark. A meter from 0 to `max`; say what the number means with `valueText`.
 *
 *   <HudTrack value={62} marks={[45]} aria-label="Course" valueText="62%, past the checkpoint" />
 *   <HudTrack value={24} max={30} length={40} tone="danger" aria-label="Boss" />
 *
 * Renders `<div class="blip-box blip-hud-track" role="meter" …>` with its `<span class="blip-hud-track-fill">` and a
 * `<span class="blip-hud-track-mark">` for each mark inside.
 */
export const HudTrack = /*#__PURE__*/ forwardRef<HTMLDivElement, HudTrackProps>(function HudTrack(
  { value, max, length, marks, valueText, tone, className, style, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx("blip-box blip-hud-track", className)}
      data-tone={tone}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={max ?? 100}
      aria-valuenow={value}
      aria-valuetext={valueText}
      style={withVars(style, { "--blip-hud-value": value, "--blip-hud-max": max, "--blip-hud-length": length })}
      {...rest}
    >
      <span className="blip-hud-track-fill" />
      {marks?.map((at) => <span key={at} className="blip-hud-track-mark" style={{ "--blip-hud-at": at } as CSSProperties} />)}
    </div>
  );
});

/** Props for {@link CounterIcon}. */
export type CounterIconProps = NativeProps<"span">;

/**
 * A `<Counter>`'s icon when it is not a sprite or an SVG (an image, say): the counter bumps it on every gain, as it
 * does a sprite or an icon by itself. Like them, it says nothing: the counter's `label` does.
 *
 *   <Counter value={gems} label="Gems"><CounterIcon><img src={gem} alt="" /></CounterIcon></Counter>
 *
 * Renders `<span class="blip-counter-icon">`.
 */
export const CounterIcon = /*#__PURE__*/ forwardRef<HTMLSpanElement, CounterIconProps>(function CounterIcon(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("blip-counter-icon", className)} {...rest} />;
});
