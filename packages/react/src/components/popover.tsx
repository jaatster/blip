/**
 * Popover: Popover, PopoverNub, PopoverTitle and PopoverClose. CSS from @blip/components (popover.css).
 */
import { forwardRef } from "react";
import { cx, flag } from "../internal/props.js";
import type { NativeProps, Radius } from "../internal/props.js";

/** A dialog needs a name: `aria-labelledby` pointing at its title, or `aria-label`. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

/** The pixel cross a close button shows when it has no children (made when needed, so nothing runs on import). */
const cross = () => <span className="blip-icon" data-glyph="close" aria-hidden="true" />;

/** Own props of {@link Popover}. */
export interface PopoverOwnProps {
  /** Where it opens by its button: bottom (default), top, left or right; it flips when short of room. `data-side`. */
  side?: "bottom" | "top" | "left" | "right";
  /** For top and bottom: centred on the button (default), or lined up with its start or end edge. `data-align`. */
  align?: "center" | "start" | "end";
  /** Corner radius in pixels, 3 by default. `data-blip-r`. */
  radius?: Radius;
  /** Drawn in the page flow, without `popover`: docs, tests and screenshots only. `data-blip-static`. */
  static?: boolean;
  /** `dialog` for a popover with controls (a non-modal dialog): it then needs a name. Text needs neither. `role`. */
  role?: "dialog";
}

/** A popover with controls is a dialog with a name. */
type PopoverRole = { role?: undefined } | ({ role: "dialog" } & Named);

/** Props for {@link Popover}. */
export type PopoverProps = PopoverOwnProps & PopoverRole & NativeProps<"div", PopoverOwnProps>;

/**
 * A panel anchored to the button that opens it, with a pixel nub pointing back at it: a profile, filters, a short
 * explanation. Built on the native `popover` attribute, so the browser opens and closes it (Escape, a press outside)
 * and CSS anchor positioning places it; it does not block the page. Start it with a {@link PopoverNub}.
 *
 *   <Button popoverTarget="profile">Pixel Pat</Button>
 *   <Popover id="profile" role="dialog" aria-labelledby="profile-name">
 *     <PopoverNub />
 *     <PopoverTitle id="profile-name">Pixel Pat</PopoverTitle>
 *     <p>Level 12, 3,450 XP</p>
 *   </Popover>
 *
 * Renders `<div class="blip-box blip-popover" popover>`. Where the browser does not make the opener its anchor, name it
 * yourself: `anchor-name` on the button, `position-anchor` on the popover.
 */
export const Popover = /*#__PURE__*/ forwardRef<HTMLDivElement, PopoverProps>(function Popover(
  { side, align, radius, static: isStatic, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx("blip-box blip-popover", className)}
      popover={isStatic ? undefined : ""}
      data-side={side}
      data-align={align}
      data-blip-r={radius}
      data-blip-static={flag(isStatic)}
      {...rest}
    />
  );
});

/** Props for {@link PopoverNub}. */
export type PopoverNubProps = Omit<NativeProps<"span">, "children">;

/**
 * The nub that points back at the button: seven pixels wide and four deep, its base on the panel's outline. First in
 * the popover; it turns with the side the popover took.
 *
 *   <PopoverNub />
 *
 * Renders `<span class="blip-popover-nub" aria-hidden="true">`.
 */
export const PopoverNub = /*#__PURE__*/ forwardRef<HTMLSpanElement, PopoverNubProps>(function PopoverNub(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("blip-popover-nub", className)} aria-hidden="true" {...rest} />;
});

/** Props for {@link PopoverTitle}. */
export type PopoverTitleProps = NativeProps<"p">;

/**
 * An optional bold first line, with the opener's label in it. Give it an id to name a dialog popover by it.
 *
 *   <PopoverTitle id="profile-name">Pixel Pat</PopoverTitle>
 *
 * Renders `<p class="blip-popover-title">`.
 */
export const PopoverTitle = /*#__PURE__*/ forwardRef<HTMLParagraphElement, PopoverTitleProps>(function PopoverTitle(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("blip-popover-title", className)} {...rest} />;
});

/** Own props of {@link PopoverClose}. */
export interface PopoverCloseOwnProps {
  /** The popover's id: the button hides it (`popovertargetaction="hide"`). `popovertarget`. */
  popoverTarget?: string;
}

/** Props for {@link PopoverClose}. */
export type PopoverCloseProps = PopoverCloseOwnProps & NativeProps<"button", PopoverCloseOwnProps>;

/**
 * An optional close cross for a popover with controls: a small ghost icon button, named "Close" unless you name it,
 * with the pixel cross unless it has children.
 *
 *   <PopoverClose popoverTarget="filters" />
 *
 * Renders `<button class="blip-box blip-button blip-popover-close" type="button" popovertarget popovertargetaction="hide"
 * data-variant="ghost" data-size="sm" data-icon-only aria-label="Close">` around `<span class="blip-icon"
 * data-glyph="close" aria-hidden="true">`.
 */
export const PopoverClose = /*#__PURE__*/ forwardRef<HTMLButtonElement, PopoverCloseProps>(function PopoverClose(
  {
    popoverTarget,
    popoverTargetAction = popoverTarget === undefined ? undefined : "hide",
    type = "button",
    "aria-labelledby": labelledBy,
    "aria-label": label = labelledBy === undefined ? "Close" : undefined,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx("blip-box blip-button blip-popover-close", className)}
      type={type}
      popoverTarget={popoverTarget}
      popoverTargetAction={popoverTargetAction}
      data-variant="ghost"
      data-size="sm"
      data-icon-only=""
      aria-label={label}
      aria-labelledby={labelledBy}
      {...rest}
    >
      {children ?? cross()}
    </button>
  );
});
