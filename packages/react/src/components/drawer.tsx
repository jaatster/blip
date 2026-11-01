/**
 * Drawer: DrawerSheet, the parts that go inside <Drawer>, and <Drawer> itself (generated from its element, re-exported
 * here). CSS from @jaatster/blip-components (drawer.css).
 */
import { forwardRef } from "react";
import { cx, flag } from "../internal/props.js";
import type { NativeProps, Radius, Size, Tone } from "../internal/props.js";

export { Drawer, type DrawerProps } from "../generated/elements.js";

/** A dialog needs a name: `aria-labelledby` pointing at its title, or `aria-label`. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

/** Own props of {@link DrawerSheet}. */
export interface DrawerSheetOwnProps {
  /**
   * The edge it slides in from: end (default) for settings and details, start for navigation, bottom for share
   * sheets. End and start follow the text: the right and the left in left-to-right text, the other way round in
   * right-to-left. `data-side`.
   */
  side?: "end" | "start" | "bottom";
  /** 128, 160 (default) or 224 pixels across; a bottom sheet is as tall as its content, up to 85%. `data-size`. */
  size?: Size;
  /** The title bar's colour: accent (default), any tone or candy. `data-tone`. */
  tone?: Tone;
  /** Corner radius in pixels, 0 by default: the sheet is part of the screen's edge. `data-chu-r`. */
  radius?: Radius;
  /** Drawn in the page flow (with `open`): docs, tests and screenshots only. `data-chu-static`. */
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
 *     <DrawerSheet id="settings" side="end" aria-labelledby="settings-title">
 *       <DialogHeader>
 *         <DialogTitle id="settings-title">Settings</DialogTitle>
 *         <form method="dialog"><DialogClose /></form>
 *       </DialogHeader>
 *       <DialogBody>…</DialogBody>
 *     </DrawerSheet>
 *   </Drawer>
 *
 * Renders `<dialog class="chu-box chu-drawer">`.
 */
export const DrawerSheet = /*#__PURE__*/ forwardRef<HTMLDialogElement, DrawerSheetProps>(function DrawerSheet(
  { side, size, tone, radius, static: isStatic, className, ...rest },
  ref,
) {
  return (
    <dialog
      ref={ref}
      className={cx("chu-box chu-drawer", className)}
      data-side={side}
      data-size={size}
      data-tone={tone}
      data-chu-r={radius}
      data-chu-static={flag(isStatic)}
      {...rest}
    />
  );
});
