/**
 * Prompts: Prompt, PromptKey, PromptButton, PromptShoulder, PromptDpad and PromptStart. CSS from @blip/game
 * (prompt.css).
 */
import { forwardRef } from "react";
import type { ReactNode } from "react";
import { cx, type NativeProps, type Tone } from "../../internal/props.js";

/** Something that shows only pictures or numbers needs a name: `aria-label`, or `aria-labelledby`. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

/** What a POP part repeats in `data-pop` (the tint on its letters' lower rows): its children, when they are text. */
const popText = (children: ReactNode): string | undefined =>
  typeof children === "string" || typeof children === "number" ? String(children) : undefined;

/** Props for {@link Prompt}. */
export type PromptProps = NativeProps<"p">;

/**
 * A line saying which button does what, in small bold capitals with the keys and buttons in the flow. Write it to
 * read as a sentence ("Press A to jump"), one action per line, the verb after the glyph. It is a label: if it
 * should do something, use a button.
 *
 *   <Prompt>Press <PromptButton button="a" /> to jump</Prompt>
 *   <Prompt><PromptKey>Esc</PromptKey> Pause</Prompt>
 *
 * Renders `<p class="blip-prompt">`.
 */
export const Prompt = /*#__PURE__*/ forwardRef<HTMLParagraphElement, PromptProps>(function Prompt({ className, ...rest }, ref) {
  return <p ref={ref} className={cx("blip-prompt", className)} {...rest} />;
});

/** Own props of {@link PromptKey}. */
export interface PromptKeyOwnProps {
  /**
   * What an icon key is called ("Up arrow"), for screen readers: visually hidden text after the icon. Not needed
   * for keys with words or letters, which are read as they are.
   */
  label?: string;
}

export type PromptKeyProps = PromptKeyOwnProps & NativeProps<"kbd", PromptKeyOwnProps>;

/**
 * A keyboard key: a cream keycap with a front face three pixels deep, and a word (`Esc`, `Enter`), a letter or an
 * icon in Pixel Bop capitals. Wide keys take a `min-inline-size`.
 *
 *   <PromptKey>Esc</PromptKey>
 *   <PromptKey label="Up arrow"><Icon name="arrow-up" /></PromptKey>
 *
 * Renders `<kbd class="blip-box blip-prompt-key">`, with `<span class="blip-sr-only">` after its children for a `label`.
 */
export const PromptKey = /*#__PURE__*/ forwardRef<HTMLElement, PromptKeyProps>(function PromptKey(
  { label, className, children, ...rest },
  ref,
) {
  return (
    <kbd ref={ref} className={cx("blip-box blip-prompt-key", className)} {...rest}>
      {children}
      {label ? <span className="blip-sr-only">{label}</span> : null}
    </kbd>
  );
});

/** Own props of {@link PromptButton}. */
export interface PromptButtonOwnProps {
  /**
   * The face button, in the colour players know: `a` green, `b` red, `x` blue, `y` orange (yellow is kept for
   * focus). Its letter is the label unless you pass children. `data-button`.
   */
  button?: "a" | "b" | "x" | "y";
  /** Any other colour, for another pad's buttons. `data-tone`. */
  tone?: Tone;
}

export type PromptButtonProps = PromptButtonOwnProps & NativeProps<"kbd", PromptButtonOwnProps>;

/**
 * A gamepad face button: a sixteen-pixel circle with its letter centred exactly. The letter always shows, so the
 * colour is never the only clue.
 *
 *   <Prompt>Press <PromptButton button="a" /> to jump</Prompt>
 *   <PromptButton tone="pink">L</PromptButton>
 *
 * Renders `<kbd class="blip-box blip-prompt-button" data-button="a">A</kbd>`.
 */
export const PromptButton = /*#__PURE__*/ forwardRef<HTMLElement, PromptButtonProps>(function PromptButton(
  { button, tone, className, children, ...rest },
  ref,
) {
  return (
    <kbd ref={ref} className={cx("blip-box blip-prompt-button", className)} data-button={button} data-tone={tone} {...rest}>
      {children ?? button?.toUpperCase()}
    </kbd>
  );
});

/** Own props of {@link PromptShoulder}. */
export interface PromptShoulderOwnProps {
  /**
   * Which one: bumpers `lb`, `rb`, `l`, `r`; triggers `lt`, `rt`, `zl`, `zr` (taller, with rounder corners). Its name
   * in capitals is the label unless you pass children. `data-button`.
   */
  button?: "lb" | "rb" | "l" | "r" | "lt" | "rt" | "zl" | "zr";
}

export type PromptShoulderProps = PromptShoulderOwnProps & NativeProps<"kbd", PromptShoulderOwnProps>;

/**
 * A shoulder button: a slate bumper with white letters; triggers stand taller.
 *
 *   <Prompt>Hold <PromptShoulder button="rb" /> to dash</Prompt>
 *
 * Renders `<kbd class="blip-box blip-prompt-shoulder" data-button="rb">RB</kbd>`.
 */
export const PromptShoulder = /*#__PURE__*/ forwardRef<HTMLElement, PromptShoulderProps>(function PromptShoulder(
  { button, className, children, ...rest },
  ref,
) {
  return (
    <kbd ref={ref} className={cx("blip-box blip-prompt-shoulder", className)} data-button={button} {...rest}>
      {children ?? button?.toUpperCase()}
    </kbd>
  );
});

/** Own props of {@link PromptDpad}. */
export interface PromptDpadOwnProps {
  /** The arm lit in the accent; left out, the pad at rest. `data-dir`. */
  direction?: "up" | "down" | "left" | "right";
  children?: never;
}

/** Props for {@link PromptDpad}: it is a picture, so it needs a name ("D-pad left"). */
export type PromptDpadProps = PromptDpadOwnProps & Named & NativeProps<"span", PromptDpadOwnProps>;

/**
 * The D-pad: an ink plus with a drop, a slate fill with a dimple, and one arm lit. A picture (`role="img"`), named
 * for what it shows.
 *
 *   <Prompt>
 *     <PromptDpad direction="left" aria-label="D-pad left" />
 *     <PromptDpad direction="right" aria-label="D-pad right" /> Move
 *   </Prompt>
 *   <PromptDpad aria-label="D-pad" />
 *
 * Renders `<span class="blip-prompt-dpad" role="img">`.
 */
export const PromptDpad = /*#__PURE__*/ forwardRef<HTMLSpanElement, PromptDpadProps>(function PromptDpad(
  { direction, className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("blip-prompt-dpad", className)} data-dir={direction} role="img" {...rest} />;
});

/** Props for {@link PromptStart}. */
export type PromptStartProps = NativeProps<"p">;

/**
 * The title screen's PRESS START, in POP: it blinks on the beat for five seconds, then stays lit (blinking never runs
 * on); with reduced motion it does not blink.
 *
 *   <PromptStart>Press start</PromptStart>
 *
 * Renders `<p class="blip-prompt-start blip-display blip-pop" data-scale="2" data-pop="Press start">`; `data-pop` repeats
 * the text (when the children are text).
 */
export const PromptStart = /*#__PURE__*/ forwardRef<HTMLParagraphElement, PromptStartProps>(function PromptStart(
  { className, children, ...rest },
  ref,
) {
  return (
    <p
      ref={ref}
      className={cx("blip-prompt-start blip-display blip-pop", className)}
      data-scale={2}
      data-pop={popText(children)}
      {...rest}
    >
      {children}
    </p>
  );
});
