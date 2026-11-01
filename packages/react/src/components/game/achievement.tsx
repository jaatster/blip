/**
 * Achievement: Achievements, Achievement, AchievementIcon, AchievementLabel, AchievementTitle, AchievementText and
 * AchievementReward. CSS from @blip/game (achievement.css).
 */
import { forwardRef } from "react";
import { cx, type NativeProps, type Tone } from "../../internal/props.js";

/** Props for {@link Achievements}. */
export type AchievementsProps = NativeProps<"div">;

/**
 * Where achievement toasts stack, newest first, and the polite live region they are announced from. Add an
 * {@link Achievement} to show one (it animates in by itself); take it away after five seconds or more, and never
 * put the only copy of something important in one.
 *
 *   <Achievements>{earned.map((a) => <Achievement key={a.id}>…</Achievement>)}</Achievements>
 *
 * Renders `<div class="blip-achievements" role="status">`.
 */
export const Achievements = /*#__PURE__*/ forwardRef<HTMLDivElement, AchievementsProps>(function Achievements(
  { role = "status", className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("blip-achievements", className)} role={role} {...rest} />;
});

/** Own props of {@link Achievement}. */
export interface AchievementOwnProps {
  /** The toast's colour: slate (default), `neutral` for secrets, any candy for a set. `data-tone`. */
  tone?: Tone;
}

export type AchievementProps = AchievementOwnProps & NativeProps<"div", AchievementOwnProps>;

/**
 * A toast for something earned: a trophy in a dark well, what it is called and what it was for, and an optional
 * reward. It slides in four pixel steps, bumps, and a sparkle flares on the trophy three times; with reduced motion
 * it appears in place. Show it in {@link Achievements}.
 *
 *   <Achievement>
 *     <AchievementIcon><Sprite name="trophy" /></AchievementIcon>
 *     <AchievementLabel>Achievement unlocked</AchievementLabel>
 *     <AchievementTitle>Early bird</AchievementTitle>
 *     <AchievementText>Catch a falling star before sunrise.</AchievementText>
 *     <AchievementReward><Sprite name="coin" />+50</AchievementReward>
 *   </Achievement>
 *
 * Renders `<div class="blip-box blip-achievement">`.
 */
export const Achievement = /*#__PURE__*/ forwardRef<HTMLDivElement, AchievementProps>(function Achievement(
  { tone, className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("blip-box blip-achievement", className)} data-tone={tone} {...rest} />;
});

/** Props for {@link AchievementIcon}. */
export type AchievementIconProps = NativeProps<"span">;

/**
 * The dark well the trophy (or any sprite) sits in. The two sparkles that flare on it come with it, after your
 * sprite: small, big, small, gone, three times; still with reduced motion.
 *
 *   <AchievementIcon><Sprite name="trophy" /></AchievementIcon>
 *
 * Renders `<span class="blip-box blip-achievement-icon">`, its children, then `<span class="blip-achievement-sparkles">`.
 */
export const AchievementIcon = /*#__PURE__*/ forwardRef<HTMLSpanElement, AchievementIconProps>(function AchievementIcon(
  { className, children, ...rest },
  ref,
) {
  return (
    <span ref={ref} className={cx("blip-box blip-achievement-icon", className)} {...rest}>
      {children}
      <span className="blip-achievement-sparkles" />
    </span>
  );
});

/** Props for {@link AchievementLabel}. */
export type AchievementLabelProps = NativeProps<"p">;

/**
 * The line above the title, in Pixel Bop capitals: "Achievement unlocked", "Secret found".
 *
 *   <AchievementLabel>Achievement unlocked</AchievementLabel>
 *
 * Renders `<p class="blip-achievement-label">`.
 */
export const AchievementLabel = /*#__PURE__*/ forwardRef<HTMLParagraphElement, AchievementLabelProps>(function AchievementLabel(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("blip-achievement-label", className)} {...rest} />;
});

/** Props for {@link AchievementTitle}. */
export type AchievementTitleProps = NativeProps<"p">;

/**
 * The achievement's name, in bold.
 *
 *   <AchievementTitle>Early bird</AchievementTitle>
 *
 * Renders `<p class="blip-achievement-title">`.
 */
export const AchievementTitle = /*#__PURE__*/ forwardRef<HTMLParagraphElement, AchievementTitleProps>(function AchievementTitle(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("blip-achievement-title", className)} {...rest} />;
});

/** Props for {@link AchievementText}. */
export type AchievementTextProps = NativeProps<"p">;

/**
 * What was done, in one sentence: in the past, or as the goal.
 *
 *   <AchievementText>Catch a falling star before sunrise.</AchievementText>
 *
 * Renders `<p class="blip-achievement-text">`.
 */
export const AchievementText = /*#__PURE__*/ forwardRef<HTMLParagraphElement, AchievementTextProps>(function AchievementText(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("blip-achievement-text", className)} {...rest} />;
});

/** Props for {@link AchievementReward}. */
export type AchievementRewardProps = NativeProps<"p">;

/**
 * An extra line for the reward: a sprite and an amount, in Pixel Bop.
 *
 *   <AchievementReward><Sprite name="coin" />+50</AchievementReward>
 *
 * Renders `<p class="blip-achievement-reward">`.
 */
export const AchievementReward = /*#__PURE__*/ forwardRef<HTMLParagraphElement, AchievementRewardProps>(function AchievementReward(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("blip-achievement-reward", className)} {...rest} />;
});
