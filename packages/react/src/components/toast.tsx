/**
 * Toast: Toast, ToastIcon, ToastBody, ToastTitle, ToastActions, ToastAction, ToastClose, ToastTimer and StaticToaster,
 * the parts that go inside <Toaster>, and <Toaster> itself (generated from its element, re-exported here). CSS from
 * @blip/components (toast.css). Toasts drawn by hand, for docs and screenshots: live toasts come from toast() and
 * <Toaster>.
 */
import { forwardRef } from "react";
import { box, cx, type Intent, type NativeProps } from "../internal/props.js";

export { Toaster, type ToasterProps } from "../generated/elements.js";

/** A name for something whose words don't name it: `aria-label` or `aria-labelledby`. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

/** Own props of {@link Toast}. */
export interface ToastOwnProps {
  /**
   * What kind of news, in the tone's soft fill like an alert; left out, a raised panel in the scheme's colours.
   * `data-tone`.
   */
  tone?: Intent;
  /** Soft (the default with a tone), or candy for celebrations ("Level clear!"). `data-variant`. */
  variant?: "soft" | "candy";
}

export type ToastProps = ToastOwnProps & Named & NativeProps<"div", ToastOwnProps>;

/**
 * A toast drawn by hand, for a {@link StaticToaster} in docs and screenshots. Live toasts come from toast() (or a
 * `<Toaster>`'s add()), which builds this markup, announces it, times it and stacks it. A group named by its title.
 * Renders `<div class="blip-box blip-toast" role="group">`.
 *
 *   <Toast tone="success" aria-label="Achievement unlocked">
 *     <ToastIcon />
 *     <ToastBody>
 *       <ToastTitle>Achievement unlocked</ToastTitle>
 *       <p>First Flight: clear World 1 without taking a hit.</p>
 *       <ToastActions><ToastAction>View</ToastAction></ToastActions>
 *     </ToastBody>
 *     <ToastClose />
 *     <ToastTimer />
 *   </Toast>
 */
export const Toast = /*#__PURE__*/ forwardRef<HTMLDivElement, ToastProps>(function Toast(
  { tone, variant, role = "group", className, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cx("blip-box blip-toast", className)} {...box({ variant, tone })} role={role} {...rest} />
  );
});

/** Props for {@link ToastIcon}. */
export type ToastIconProps = NativeProps<"span">;

/**
 * The toast's sign: the tone's 12 x 12 glyph, on toasts with a tone only. Decorative. Renders `<span
 * class="blip-toast-icon" aria-hidden="true">`.
 *
 *   <ToastIcon />
 */
export const ToastIcon = /*#__PURE__*/ forwardRef<HTMLSpanElement, ToastIconProps>(function ToastIcon({ className, ...rest }, ref) {
  return <span ref={ref} className={cx("blip-toast-icon", className)} aria-hidden {...rest} />;
});

/** Props for {@link ToastBody}. */
export type ToastBodyProps = NativeProps<"div">;

/**
 * The toast's content column: title, text, action. Renders `<div class="blip-toast-body">`.
 *
 *   <ToastBody><ToastTitle>Level clear!</ToastTitle><p>3 of 3 stars, 2:41.</p></ToastBody>
 */
export const ToastBody = /*#__PURE__*/ forwardRef<HTMLDivElement, ToastBodyProps>(function ToastBody({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("blip-toast-body", className)} {...rest} />;
});

/** Props for {@link ToastTitle}. */
export type ToastTitleProps = NativeProps<"p">;

/**
 * The toast's title, first and short: "Saved to slot 2", not "Success!". Renders `<p class="blip-toast-title">`.
 *
 *   <ToastTitle>Saved to slot 2</ToastTitle>
 */
export const ToastTitle = /*#__PURE__*/ forwardRef<HTMLParagraphElement, ToastTitleProps>(function ToastTitle(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("blip-toast-title", className)} {...rest} />;
});

/** Props for {@link ToastActions}. */
export type ToastActionsProps = NativeProps<"div">;

/**
 * The row holding the toast's one action. Renders `<div class="blip-toast-actions">`.
 *
 *   <ToastActions><ToastAction>Undo</ToastAction></ToastActions>
 */
export const ToastActions = /*#__PURE__*/ forwardRef<HTMLDivElement, ToastActionsProps>(function ToastActions(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("blip-toast-actions", className)} {...rest} />;
});

/** Props for {@link ToastAction}. */
export type ToastActionProps = NativeProps<"button">;

/**
 * The toast's action: a small outline button named for what it does ("Undo", "View", "Try again"). The toast
 * leaves, so it must also be reachable another way. Renders `<button class="blip-box blip-button blip-toast-action"
 * type="button" data-size="sm" data-variant="outline">`.
 *
 *   <ToastAction onClick={undo}>Undo</ToastAction>
 */
export const ToastAction = /*#__PURE__*/ forwardRef<HTMLButtonElement, ToastActionProps>(function ToastAction(
  { type = "button", className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx("blip-box blip-button blip-toast-action", className)}
      type={type}
      {...box({ variant: "outline" })}
      data-size="sm"
      {...rest}
    />
  );
});

/** Props for {@link ToastClose}: a button's, without children (it draws the cross). */
export type ToastCloseProps = NativeProps<"button", { children?: never }>;

/**
 * The toast's dismiss button: a ghost icon button with the pixel cross, named "Dismiss" unless you name it
 * otherwise. Renders `<button class="blip-box blip-button blip-toast-close" type="button" data-variant="ghost"
 * data-size="sm" data-icon-only aria-label="Dismiss">` holding the cross.
 *
 *   <ToastClose />
 */
export const ToastClose = /*#__PURE__*/ forwardRef<HTMLButtonElement, ToastCloseProps>(function ToastClose(
  { type = "button", "aria-label": label = "Dismiss", className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx("blip-box blip-button blip-toast-close", className)}
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

/** Props for {@link ToastTimer}. */
export type ToastTimerProps = NativeProps<"span", { children?: never }>;

/**
 * The countdown: a two-pixel strip over the toast's bottom band that steps down in eight whole-pixel steps. Leave
 * it out of a toast that stays (danger toasts stay until dismissed). In a static toaster it holds still, full.
 * Renders `<span class="blip-toast-timer" aria-hidden="true">`.
 *
 *   <ToastTimer />
 */
export const ToastTimer = /*#__PURE__*/ forwardRef<HTMLSpanElement, ToastTimerProps>(function ToastTimer(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("blip-toast-timer", className)} aria-hidden {...rest} />;
});

/** Props for {@link StaticToaster}. */
export type StaticToasterProps = Named & NativeProps<"div">;

/**
 * Toasts in the page flow instead of a corner, for docs and screenshots: nothing times out, nothing is announced.
 * A region, so give each its own name. For real toasts, put a `<Toaster>` in your layout and call toast(). Renders
 * `<div class="blip-toaster" data-blip-static role="region">`.
 *
 *   <StaticToaster aria-label="Notifications, example">
 *     <Toast aria-label="Saved to slot 2">
 *       <ToastBody><ToastTitle>Saved to slot 2</ToastTitle></ToastBody>
 *       <ToastClose />
 *     </Toast>
 *   </StaticToaster>
 */
export const StaticToaster = /*#__PURE__*/ forwardRef<HTMLDivElement, StaticToasterProps>(function StaticToaster(
  { role = "region", className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("blip-toaster", className)} data-blip-static="" role={role} {...rest} />;
});
