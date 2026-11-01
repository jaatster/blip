/**
 * Dialog: DialogPanel, DialogHeader, DialogTitle, DialogIcon, DialogClose, DialogBody and DialogFooter, the parts that
 * go inside <Dialog>, and <Dialog> itself (generated from its element, re-exported here). CSS from @blip/components
 * (dialog.css).
 */
import { forwardRef } from "react";
import { cx, flag } from "../internal/props.js";
import type { Intent, NativeProps, Radius, Size } from "../internal/props.js";

export { Dialog, type DialogProps } from "../generated/elements.js";

/** A dialog needs a name: `aria-labelledby` pointing at its title, or `aria-label`. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

/** The pixel cross a close button shows when it has no children (made when needed, so nothing runs on import). */
const cross = () => <span className="blip-icon" data-glyph="close" aria-hidden="true" />;

/** Invoker attributes, spread because React's DOM types do not list them yet. */
const invoker = (target: string | undefined, command: string) =>
  target === undefined ? {} : { commandfor: target, command };

/** Own props of {@link DialogPanel}. */
export interface DialogPanelOwnProps {
  /** 160, 224 (default) or 320 pixels wide; never wider than the screen less 8 pixels a side. `data-size`. */
  size?: Size;
  /** The title bar's colour: accent (default) or an intent; `danger` for destructive confirmations. `data-tone`. */
  tone?: "accent" | Intent;
  /** Corner radius in pixels, 4 by default; the title bar follows it. `data-blip-r`. */
  radius?: Radius;
  /** Drawn in the page flow, out of the top layer (with `open`): docs, tests and screenshots only. `data-blip-static`. */
  static?: boolean;
  /**
   * `alertdialog`: a confirmation that interrupts. It then needs `aria-describedby` on its message; add a
   * {@link DialogIcon} to the header, and `autoFocus` on the least destructive button. `role`.
   */
  role?: "dialog" | "alertdialog";
}

/** An alert dialog is described by its message. */
type DialogRole = { role?: "dialog" } | { role: "alertdialog"; "aria-describedby": string };

/** Props for {@link DialogPanel}. */
export type DialogPanelProps = DialogPanelOwnProps & Named & DialogRole & NativeProps<"dialog", DialogPanelOwnProps>;

/**
 * The dialog itself: a native `<dialog>` drawn as a raised panel with a title bar, over a dithered ink scrim. Inside
 * `<Dialog>`, which opens it as a modal, runs every close through `blip-before-close` and gives focus back. Name it by
 * its title, and give it the id its buttons point at.
 *
 *   <Dialog lightDismiss>
 *     <DialogPanel id="save" aria-labelledby="save-title">
 *       <form method="dialog">
 *         <DialogHeader>
 *           <DialogTitle id="save-title">Save game</DialogTitle>
 *           <DialogClose commandFor="save" value="cancel" />
 *         </DialogHeader>
 *         <DialogBody>…</DialogBody>
 *         <DialogFooter>…<Button value="save">Save</Button></DialogFooter>
 *       </form>
 *     </DialogPanel>
 *   </Dialog>
 *
 * Renders `<dialog class="blip-box blip-dialog">`.
 */
export const DialogPanel = /*#__PURE__*/ forwardRef<HTMLDialogElement, DialogPanelProps>(function DialogPanel(
  { size, tone, radius, static: isStatic, className, ...rest },
  ref,
) {
  return (
    <dialog
      ref={ref}
      className={cx("blip-box blip-dialog", className)}
      data-size={size}
      data-tone={tone}
      data-blip-r={radius}
      data-blip-static={flag(isStatic)}
      {...rest}
    />
  );
});

/** Props for {@link DialogHeader}. */
export type DialogHeaderProps = NativeProps<"header">;

/**
 * The title bar: the tone's light colour reaching up into the stepped corners, an ink rule under it. It grows with
 * the title, so long titles wrap. An optional {@link DialogIcon}, the {@link DialogTitle}, an optional
 * {@link DialogClose}.
 *
 *   <DialogHeader><DialogTitle id="save-title">Save game</DialogTitle><DialogClose commandFor="save" /></DialogHeader>
 *
 * Renders `<header class="blip-dialog-header">`.
 */
export const DialogHeader = /*#__PURE__*/ forwardRef<HTMLElement, DialogHeaderProps>(function DialogHeader(
  { className, ...rest },
  ref,
) {
  return <header ref={ref} className={cx("blip-dialog-header", className)} {...rest} />;
});

/** Props for {@link DialogTitle}. */
export type DialogTitleProps = NativeProps<"h2">;

/**
 * The title: Pixel Bop at scale 1, in capitals. The question or the task, in a few words ("Delete slot 2?"). Give it
 * the id the panel's `aria-labelledby` names.
 *
 *   <DialogTitle id="save-title">Save game</DialogTitle>
 *
 * Renders `<h2 class="blip-dialog-title">`.
 */
export const DialogTitle = /*#__PURE__*/ forwardRef<HTMLHeadingElement, DialogTitleProps>(function DialogTitle(
  { className, ...rest },
  ref,
) {
  return <h2 ref={ref} className={cx("blip-dialog-title", className)} {...rest} />;
});

/** Props for {@link DialogIcon}. */
export type DialogIconProps = Omit<NativeProps<"span">, "children">;

/**
 * The sign before an alert dialog's title: the panel's tone's glyph (info, success, warning, danger). Empty, and
 * hidden from screen readers.
 *
 *   <DialogHeader><DialogIcon /><DialogTitle id="delete-title">Delete slot 2?</DialogTitle></DialogHeader>
 *
 * Renders `<span class="blip-dialog-icon" aria-hidden="true">`.
 */
export const DialogIcon = /*#__PURE__*/ forwardRef<HTMLSpanElement, DialogIconProps>(function DialogIcon(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("blip-dialog-icon", className)} aria-hidden="true" {...rest} />;
});

/** Own props of {@link DialogClose}. */
export interface DialogCloseOwnProps {
  /**
   * The dialog's id: the button closes it as an invoker, with `command="close"` and `type="button"` (so it never
   * becomes the form's default button). Leave it out inside a `<form method="dialog">`, where the button submits to
   * close, and in a static picture. `commandfor`.
   */
  commandFor?: string;
}

/** Props for {@link DialogClose}. */
export type DialogCloseProps = DialogCloseOwnProps & NativeProps<"button", DialogCloseOwnProps>;

/**
 * The close cross on the title bar: a small ghost icon button, named "Close" unless you name it, with the pixel
 * cross unless it has children. Drawers use it too.
 *
 *   <DialogClose commandFor="save" value="cancel" />
 *   <form method="dialog"><DialogClose /></form>
 *
 * Renders `<button class="blip-box blip-button blip-dialog-close" type="button" commandfor command="close"
 * data-variant="ghost" data-size="sm" data-icon-only aria-label="Close">` around `<span class="blip-icon"
 * data-glyph="close" aria-hidden="true">`.
 */
export const DialogClose = /*#__PURE__*/ forwardRef<HTMLButtonElement, DialogCloseProps>(function DialogClose(
  {
    commandFor,
    type = commandFor === undefined ? undefined : "button",
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
      className={cx("blip-box blip-button blip-dialog-close", className)}
      type={type}
      {...invoker(commandFor, "close")}
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

/** Props for {@link DialogBody}. */
export type DialogBodyProps = NativeProps<"div">;

/**
 * The content. It scrolls when the dialog is taller than the screen; the title bar and footer stay put. A long,
 * read-only body can take the focus (`tabIndex={0}`, with `role="region"` and a name).
 *
 *   <DialogBody><p>Choose a slot. Saving over a slot replaces what's in it.</p></DialogBody>
 *
 * Renders `<div class="blip-dialog-body">`.
 */
export const DialogBody = /*#__PURE__*/ forwardRef<HTMLDivElement, DialogBodyProps>(function DialogBody({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("blip-dialog-body", className)} {...rest} />;
});

/** Props for {@link DialogFooter}. */
export type DialogFooterProps = NativeProps<"footer">;

/**
 * The actions, at the end, the main one last. They say what happens ("Delete", "Keep it"), never just "OK".
 *
 *   <DialogFooter>
 *     <Button variant="soft" tone="neutral" value="keep" autoFocus>Keep it</Button>
 *     <Button tone="danger" value="delete">Delete</Button>
 *   </DialogFooter>
 *
 * Renders `<footer class="blip-dialog-footer">`.
 */
export const DialogFooter = /*#__PURE__*/ forwardRef<HTMLElement, DialogFooterProps>(function DialogFooter(
  { className, ...rest },
  ref,
) {
  return <footer ref={ref} className={cx("blip-dialog-footer", className)} {...rest} />;
});
