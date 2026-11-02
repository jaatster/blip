/**
 * Alert: Alert, AlertIcon, AlertBody, AlertTitle, AlertActions and AlertClose. CSS from @jaatster/blip-components
 * (alert.css).
 */
import { forwardRef } from "react";
import { box, cx, type Intent, type NativeProps, type Radius } from "../internal/props.js";

/** Own props of {@link Alert}. */
export interface AlertOwnProps {
  /** What kind of news: info (default), success, warning, danger or neutral. The sign follows. `data-tone`. */
  tone?: Intent | "neutral";
  /**
   * Soft (default) for most; candy for the one thing on the page that must not be missed (a form that failed);
   * outline in dense screens, where the colour stays in the sign. `data-variant`.
   */
  variant?: "soft" | "candy" | "outline";
  /** Corner radius in pixels, 0 to 8 (3 by default). `data-blip-r`. */
  radius?: Radius;
}

export type AlertProps = AlertOwnProps & NativeProps<"div", AlertOwnProps>;

/**
 * An inline banner about the page or the task in front of it. A pixel sign, a title, a few words, the action that
 * helps, and a dismiss button when it can go away; put it next to what it is about. A static alert needs no role; one
 * you insert in answer to something needs `role="alert"` (urgent: it interrupts) or `role="status"` (good or neutral
 * news). Renders `<div class="blip-box blip-alert">`.
 *
 *   <Alert tone="danger">
 *     <AlertIcon />
 *     <AlertBody>
 *       <AlertTitle><span className="blip-sr-only">Error: </span>Can't reach the save server</AlertTitle>
 *       <p>Your progress is safe on this device. We'll try again in 30 seconds.</p>
 *       <AlertActions><Button type="button" size="sm" variant="outline">Retry now</Button></AlertActions>
 *     </AlertBody>
 *     <AlertClose onClick={dismiss} />
 *   </Alert>
 */
export const Alert = /*#__PURE__*/ forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { tone, variant, radius, className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("blip-box blip-alert", className)} {...box({ variant, tone, radius })} {...rest} />;
});

/** Props for {@link AlertIcon}. */
export type AlertIconProps = NativeProps<"span">;

/**
 * The alert's sign, 12 x 12 pixels. Empty, it draws the tone's glyph (a disc with an i or a check, a triangle or an
 * octagon with "!"), so the kind of news is in the shape as well as the colour; or put an `<svg class="blip-icon">`
 * inside. Decorative. Renders `<span class="blip-alert-icon" aria-hidden="true">`.
 *
 *   <AlertIcon />
 */
export const AlertIcon = /*#__PURE__*/ forwardRef<HTMLSpanElement, AlertIconProps>(function AlertIcon({ className, ...rest }, ref) {
  return <span ref={ref} className={cx("blip-alert-icon", className)} aria-hidden {...rest} />;
});

/** Props for {@link AlertBody}. */
export type AlertBodyProps = NativeProps<"div">;

/**
 * The alert's content column: title, text in `<p>`s, actions. Renders `<div class="blip-alert-body">`.
 *
 *   <AlertBody><AlertTitle>Backup complete</AlertTitle><p>All three save slots are backed up.</p></AlertBody>
 */
export const AlertBody = /*#__PURE__*/ forwardRef<HTMLDivElement, AlertBodyProps>(function AlertBody({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("blip-alert-body", className)} {...rest} />;
});

/** Props for {@link AlertTitle}. */
export type AlertTitleProps = NativeProps<"p">;

/**
 * The alert's title: what happened, in plain words, on one bold line as tall as the sign. Start it with a visually
 * hidden word for what the colour and shape say ("Error: ", "Warning: "). Renders `<p class="blip-alert-title">`.
 *
 *   <AlertTitle><span className="blip-sr-only">Warning: </span>Storage almost full</AlertTitle>
 */
export const AlertTitle = /*#__PURE__*/ forwardRef<HTMLParagraphElement, AlertTitleProps>(function AlertTitle(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("blip-alert-title", className)} {...rest} />;
});

/** Props for {@link AlertActions}. */
export type AlertActionsProps = NativeProps<"div">;

/**
 * The alert's row of actions: small outline or ghost buttons that name the fix ("Retry now", not "OK"). Renders
 * `<div class="blip-alert-actions">`.
 *
 *   <AlertActions><Button type="button" size="sm" variant="outline">Free up space</Button></AlertActions>
 */
export const AlertActions = /*#__PURE__*/ forwardRef<HTMLDivElement, AlertActionsProps>(function AlertActions(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("blip-alert-actions", className)} {...rest} />;
});

/** Props for {@link AlertClose}: a button's, without children (it draws the cross). */
export type AlertCloseProps = NativeProps<"button", { children?: never }>;

/**
 * The alert's dismiss button: a small ghost icon button with the pixel cross. It is named "Dismiss" unless you name it
 * for what it dismisses ("Dismiss storage warning") when there are several. Your onClick removes or hides the alert and
 * moves focus somewhere sensible; never make the only copy of something important dismissible. Renders `<button
 * class="blip-box blip-button blip-alert-close" type="button" data-variant="ghost" data-size="sm" data-icon-only
 * aria-label="Dismiss">` holding the cross.
 *
 *   <AlertClose onClick={() => setShown(false)} />
 */
export const AlertClose = /*#__PURE__*/ forwardRef<HTMLButtonElement, AlertCloseProps>(function AlertClose(
  { type = "button", "aria-label": label = "Dismiss", className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx("blip-box blip-button blip-alert-close", className)}
      type={type}
      {...box({ variant: "ghost" })}
      data-size="sm"
      data-icon-only=""
      aria-label={label}
      {...rest}
    >
      <span className="blip-icon" data-glyph="close" aria-hidden />
    </button>
  );
});
