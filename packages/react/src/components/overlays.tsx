/**
 * Overlays: the parts inside the Dialog and Drawer elements, Popover, and the tooltip's chip on its own. CSS from
 * @jaatster/blip-components (dialog.css, drawer.css, popover.css, tooltip.css). Dialog, Drawer and Tooltip are the
 * generated element wrappers; these render the markup inside them. A drawer uses the dialog's parts.
 */
import { forwardRef } from "react";
import { cx, flag } from "../internal/props.js";
import type { Intent, NativeProps, Radius, Size, Tone } from "../internal/props.js";

/** A dialog needs a name: `aria-labelledby` pointing at its title, or `aria-label`. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

/** The pixel cross a close button shows when it has no children. */
const cross = <span className="pp-icon" data-glyph="close" aria-hidden="true" />;

/** Invoker attributes, spread because React's DOM types do not list them yet. */
const invoker = (target: string | undefined, command: string) =>
  target === undefined ? {} : { commandfor: target, command };

// -------------------------------------------------------------------------------------------- dialog (pp-dialog)

/** Own props of {@link DialogPanel}. */
export interface DialogPanelOwnProps {
  /** 160, 224 (default) or 320 pixels wide; never wider than the screen less 8 pixels a side. `data-size`. */
  size?: Size;
  /** The title bar's colour: accent (default) or an intent; `danger` for destructive confirmations. `data-tone`. */
  tone?: "accent" | Intent;
  /** Corner radius in pixels, 4 by default; the title bar follows it. `data-pp-r`. */
  radius?: Radius;
  /** Drawn in the page flow, out of the top layer (with `open`): docs, tests and screenshots only. `data-pp-static`. */
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
 * `<Dialog>`, which opens it as a modal, runs every close through `pp-before-close` and gives focus back. Name it by
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
 * Renders `<dialog class="pp-box pp-dialog">`.
 */
export const DialogPanel = forwardRef<HTMLDialogElement, DialogPanelProps>(function DialogPanel(
  { size, tone, radius, static: isStatic, className, ...rest },
  ref,
) {
  return (
    <dialog
      ref={ref}
      className={cx("pp-box pp-dialog", className)}
      data-size={size}
      data-tone={tone}
      data-pp-r={radius}
      data-pp-static={flag(isStatic)}
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
 * Renders `<header class="pp-dialog-header">`.
 */
export const DialogHeader = forwardRef<HTMLElement, DialogHeaderProps>(function DialogHeader(
  { className, ...rest },
  ref,
) {
  return <header ref={ref} className={cx("pp-dialog-header", className)} {...rest} />;
});

/** Props for {@link DialogTitle}. */
export type DialogTitleProps = NativeProps<"h2">;

/**
 * The title: Pixel Bop at scale 1, in capitals. The question or the task, in a few words ("Delete slot 2?"). Give it
 * the id the panel's `aria-labelledby` names.
 *
 *   <DialogTitle id="save-title">Save game</DialogTitle>
 *
 * Renders `<h2 class="pp-dialog-title">`.
 */
export const DialogTitle = forwardRef<HTMLHeadingElement, DialogTitleProps>(function DialogTitle(
  { className, ...rest },
  ref,
) {
  return <h2 ref={ref} className={cx("pp-dialog-title", className)} {...rest} />;
});

/** Props for {@link DialogIcon}. */
export type DialogIconProps = Omit<NativeProps<"span">, "children">;

/**
 * The sign before an alert dialog's title: the panel's tone's glyph (info, success, warning, danger). Empty, and
 * hidden from screen readers.
 *
 *   <DialogHeader><DialogIcon /><DialogTitle id="delete-title">Delete slot 2?</DialogTitle></DialogHeader>
 *
 * Renders `<span class="pp-dialog-icon" aria-hidden="true">`.
 */
export const DialogIcon = forwardRef<HTMLSpanElement, DialogIconProps>(function DialogIcon(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("pp-dialog-icon", className)} aria-hidden="true" {...rest} />;
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
 * Renders `<button class="pp-box pp-button pp-dialog-close" type="button" commandfor command="close"
 * data-variant="ghost" data-size="sm" data-icon-only aria-label="Close">` around `<span class="pp-icon"
 * data-glyph="close" aria-hidden="true">`.
 */
export const DialogClose = forwardRef<HTMLButtonElement, DialogCloseProps>(function DialogClose(
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
      className={cx("pp-box pp-button pp-dialog-close", className)}
      type={type}
      {...invoker(commandFor, "close")}
      data-variant="ghost"
      data-size="sm"
      data-icon-only=""
      aria-label={label}
      aria-labelledby={labelledBy}
      {...rest}
    >
      {children ?? cross}
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
 * Renders `<div class="pp-dialog-body">`.
 */
export const DialogBody = forwardRef<HTMLDivElement, DialogBodyProps>(function DialogBody({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("pp-dialog-body", className)} {...rest} />;
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
 * Renders `<footer class="pp-dialog-footer">`.
 */
export const DialogFooter = forwardRef<HTMLElement, DialogFooterProps>(function DialogFooter(
  { className, ...rest },
  ref,
) {
  return <footer ref={ref} className={cx("pp-dialog-footer", className)} {...rest} />;
});

// -------------------------------------------------------------------------------------------- drawer (pp-drawer)

/** Own props of {@link DrawerSheet}. */
export interface DrawerSheetOwnProps {
  /** The edge it slides in from: right (default), left for navigation, bottom for share sheets. `data-side`. */
  side?: "right" | "left" | "bottom";
  /** 128, 160 (default) or 224 pixels across; a bottom sheet is as tall as its content, up to 85%. `data-size`. */
  size?: Size;
  /** The title bar's colour: accent (default), any tone or candy. `data-tone`. */
  tone?: Tone;
  /** Corner radius in pixels, 0 by default: the sheet is part of the screen's edge. `data-pp-r`. */
  radius?: Radius;
  /** Drawn in the page flow (with `open`): docs, tests and screenshots only. `data-pp-static`. */
  static?: boolean;
}
/** Props for {@link DrawerSheet}. */
export type DrawerSheetProps = DrawerSheetOwnProps & Named & NativeProps<"dialog", DrawerSheetOwnProps>;

/**
 * A side sheet: a modal panel that slides in from an edge in six whole-pixel steps, for settings, a map, a cart. It
 * is a dialog at an edge, so it takes the dialog's parts ({@link DialogHeader}, {@link DialogTitle},
 * {@link DialogClose}, {@link DialogBody}, {@link DialogFooter}). Inside `<Drawer>`; name it by its title.
 *
 *   <Drawer lightDismiss>
 *     <DrawerSheet id="settings" side="right" aria-labelledby="settings-title">
 *       <DialogHeader>
 *         <DialogTitle id="settings-title">Settings</DialogTitle>
 *         <form method="dialog"><DialogClose /></form>
 *       </DialogHeader>
 *       <DialogBody>…</DialogBody>
 *     </DrawerSheet>
 *   </Drawer>
 *
 * Renders `<dialog class="pp-box pp-drawer">`.
 */
export const DrawerSheet = forwardRef<HTMLDialogElement, DrawerSheetProps>(function DrawerSheet(
  { side, size, tone, radius, static: isStatic, className, ...rest },
  ref,
) {
  return (
    <dialog
      ref={ref}
      className={cx("pp-box pp-drawer", className)}
      data-side={side}
      data-size={size}
      data-tone={tone}
      data-pp-r={radius}
      data-pp-static={flag(isStatic)}
      {...rest}
    />
  );
});

// ------------------------------------------------------------------------------------------------------- popover

/** Own props of {@link Popover}. */
export interface PopoverOwnProps {
  /** Where it opens by its button: bottom (default), top, left or right; it flips when short of room. `data-side`. */
  side?: "bottom" | "top" | "left" | "right";
  /** For top and bottom: centred on the button (default), or lined up with its start or end edge. `data-align`. */
  align?: "center" | "start" | "end";
  /** Corner radius in pixels, 3 by default. `data-pp-r`. */
  radius?: Radius;
  /** Drawn in the page flow, without `popover`: docs, tests and screenshots only. `data-pp-static`. */
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
 * Renders `<div class="pp-box pp-popover" popover>`. Where the browser does not make the opener its anchor, name it
 * yourself: `anchor-name` on the button, `position-anchor` on the popover.
 */
export const Popover = forwardRef<HTMLDivElement, PopoverProps>(function Popover(
  { side, align, radius, static: isStatic, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx("pp-box pp-popover", className)}
      popover={isStatic ? undefined : ""}
      data-side={side}
      data-align={align}
      data-pp-r={radius}
      data-pp-static={flag(isStatic)}
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
 * Renders `<span class="pp-popover-nub" aria-hidden="true">`.
 */
export const PopoverNub = forwardRef<HTMLSpanElement, PopoverNubProps>(function PopoverNub(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("pp-popover-nub", className)} aria-hidden="true" {...rest} />;
});

/** Props for {@link PopoverTitle}. */
export type PopoverTitleProps = NativeProps<"p">;

/**
 * An optional bold first line, with the opener's label in it. Give it an id to name a dialog popover by it.
 *
 *   <PopoverTitle id="profile-name">Pixel Pat</PopoverTitle>
 *
 * Renders `<p class="pp-popover-title">`.
 */
export const PopoverTitle = forwardRef<HTMLParagraphElement, PopoverTitleProps>(function PopoverTitle(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("pp-popover-title", className)} {...rest} />;
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
 * Renders `<button class="pp-box pp-button pp-popover-close" type="button" popovertarget popovertargetaction="hide"
 * data-variant="ghost" data-size="sm" data-icon-only aria-label="Close">` around `<span class="pp-icon"
 * data-glyph="close" aria-hidden="true">`.
 */
export const PopoverClose = forwardRef<HTMLButtonElement, PopoverCloseProps>(function PopoverClose(
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
      className={cx("pp-box pp-button pp-popover-close", className)}
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
      {children ?? cross}
    </button>
  );
});

// ---------------------------------------------------------------------------------------------- tooltip (static)

/** Own props of {@link TooltipChip}. */
export interface TooltipChipOwnProps {
  /** Where it sits by its trigger: top (default), bottom, left or right; the nub points the other way. `data-side`. */
  side?: "top" | "bottom" | "left" | "right";
  /** Drawn in the page flow, beside its trigger: docs, tests and screenshots. `data-pp-static`. */
  static?: boolean;
}
/** Props for {@link TooltipChip}. */
export type TooltipChipProps = TooltipChipOwnProps & NativeProps<"span", TooltipChipOwnProps>;

/**
 * The tooltip's chip without its element: the markup `<Tooltip>` makes, for a picture of one. Text only, ending
 * with a {@link TooltipNub}. To describe a trigger with it, give it an id and point the trigger's `aria-describedby`
 * at it. A live tooltip that shows on hover and focus is `<Tooltip>`.
 *
 *   <TooltipChip side="bottom" static>Settings (S)<TooltipNub /></TooltipChip>
 *
 * Renders `<span class="pp-box pp-tooltip" role="tooltip">`.
 */
export const TooltipChip = forwardRef<HTMLSpanElement, TooltipChipProps>(function TooltipChip(
  { side, static: isStatic, className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cx("pp-box pp-tooltip", className)}
      role="tooltip"
      data-side={side}
      data-pp-static={flag(isStatic)}
      {...rest}
    />
  );
});

/** Props for {@link TooltipNub}. */
export type TooltipNubProps = Omit<NativeProps<"span">, "children">;

/**
 * The chip's nub, last in a {@link TooltipChip}: seven pixels wide and four deep, pointing at the trigger's middle.
 * (`<Tooltip>` adds its own.)
 *
 *   <TooltipNub />
 *
 * Renders `<span class="pp-tooltip-nub" aria-hidden="true">`.
 */
export const TooltipNub = forwardRef<HTMLSpanElement, TooltipNubProps>(function TooltipNub(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("pp-tooltip-nub", className)} aria-hidden="true" {...rest} />;
});
