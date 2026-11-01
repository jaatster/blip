/**
 * Bottom sheet: SheetPanel and SheetHandle, the parts that go inside <Sheet>, and <Sheet> itself (generated from its
 * element, re-exported here). The title bar, title, close, body and footer are the dialog's parts. CSS from
 * @blip/components (sheet.css).
 */
import { forwardRef } from "react";
import { cx, flag } from "../internal/props.js";
import type { NativeProps, Radius, Tone } from "../internal/props.js";

export { Sheet, type SheetProps } from "../generated/elements.js";

/** A dialog needs a name: `aria-labelledby` pointing at its title, or `aria-label`. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

/** Own props of {@link SheetPanel}. */
export interface SheetPanelOwnProps {
  /**
   * The heights it snaps to, smallest first: `content` (its own height, the default), `half`, `full`, or a
   * percentage of the screen, as `"half full"`. It opens at the first. Read by `<Sheet>`. `data-snap`.
   */
  snap?: string;
  /** The title bar's colour: accent (default), any tone or candy. `data-tone`. */
  tone?: Tone;
  /** Corner radius in pixels, 0 by default: the sheet is part of the screen's edge. `data-blip-r`. */
  radius?: Radius;
  /** Drawn in the page flow (with `open`): docs, tests and screenshots only. `data-blip-static`. */
  static?: boolean;
}

/** Props for {@link SheetPanel}. */
export type SheetPanelProps = SheetPanelOwnProps & Named & NativeProps<"dialog", SheetPanelOwnProps>;

/**
 * A bottom sheet: a drawer at the bottom edge that you can drag between its heights or down to close. It takes the
 * dialog's parts ({@link DialogHeader}, {@link DialogTitle}, {@link DialogClose}, {@link DialogBody},
 * {@link DialogFooter}) and a {@link SheetHandle} as the header's first child. Inside `<Sheet>`; name it by its title.
 *
 *   <Sheet lightDismiss>
 *     <SheetPanel id="route" snap="half full" aria-labelledby="route-title">
 *       <DialogHeader>
 *         <SheetHandle />
 *         <DialogTitle id="route-title">Route</DialogTitle>
 *       </DialogHeader>
 *       <DialogBody>…</DialogBody>
 *     </SheetPanel>
 *   </Sheet>
 *
 * Renders `<dialog class="blip-box blip-drawer blip-sheet">`.
 */
export const SheetPanel = /*#__PURE__*/ forwardRef<HTMLDialogElement, SheetPanelProps>(function SheetPanel(
  { snap, tone, radius, static: isStatic, className, ...rest },
  ref,
) {
  return (
    <dialog
      ref={ref}
      className={cx("blip-box blip-drawer blip-sheet", className)}
      data-snap={snap}
      data-tone={tone}
      data-blip-r={radius}
      data-blip-static={flag(isStatic)}
      {...rest}
    />
  );
});

/** Props for {@link SheetHandle}. */
export type SheetHandleProps = Omit<NativeProps<"button">, "children">;

/**
 * The grab handle: a ghost button with a pixel grip at the top centre, named "Resize" unless you name it. Pressing it
 * (or Enter) steps through the sheet's heights; drags start on it. `<Sheet>` sets its `aria-expanded`.
 *
 *   <DialogHeader><SheetHandle /><DialogTitle id="route-title">Route</DialogTitle></DialogHeader>
 *
 * Renders `<button class="blip-box blip-sheet-handle" type="button" data-variant="ghost" aria-label="Resize">` around
 * an empty `<span>`.
 */
export const SheetHandle = /*#__PURE__*/ forwardRef<HTMLButtonElement, SheetHandleProps>(function SheetHandle(
  { "aria-labelledby": labelledBy, "aria-label": label = labelledBy === undefined ? "Resize" : undefined, className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx("blip-box blip-sheet-handle", className)}
      type="button"
      data-variant="ghost"
      aria-label={label}
      aria-labelledby={labelledBy}
      {...rest}
    >
      <span />
    </button>
  );
});
