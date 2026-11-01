/**
 * Action sheet: ActionSheetPanel, ActionSheetTitle, ActionSheetMessage, ActionSheetActions and ActionSheetCancel, the
 * parts that go inside <ActionSheet>, and <ActionSheet> itself (generated from its element, re-exported here). CSS
 * from @blip/components (action-sheet.css, with drawer.css).
 */
import { forwardRef } from "react";
import { cx, flag } from "../internal/props.js";
import type { NativeProps } from "../internal/props.js";

export { ActionSheet, type ActionSheetProps } from "../generated/elements.js";

/** A dialog needs a name: `aria-labelledby` pointing at its title, or `aria-label`. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

/** Own props of {@link ActionSheetPanel}. */
export interface ActionSheetPanelOwnProps {
  /** `sheet` keeps it at the bottom on wide screens too, where it is otherwise a compact dialog in the middle. `data-layout`. */
  layout?: "sheet";
  /** Drawn in the page flow (with `open`): docs, tests and screenshots only. `data-blip-static`. */
  static?: boolean;
}

/** Props for {@link ActionSheetPanel}. */
export type ActionSheetPanelProps = ActionSheetPanelOwnProps & Named & NativeProps<"dialog", ActionSheetPanelOwnProps>;

/**
 * The sheet: a modal column of choices rising from the bottom (a compact dialog in the middle from 600 px wide). Put
 * a `<form method="dialog">` inside, so each button closes it with its `value`: `<ActionSheet>`'s `onClose` gets it as
 * `event.detail.returnValue`, empty when the sheet was dismissed.
 *
 *   <ActionSheet lightDismiss onClose={(e) => e.detail.returnValue === "share" && share()}>
 *     <ActionSheetPanel id="replay" aria-labelledby="replay-title">
 *       <form method="dialog">
 *         <ActionSheetTitle id="replay-title">Replay 12</ActionSheetTitle>
 *         <ActionSheetActions>
 *           <Button size="lg" fullWidth variant="soft" value="share">Share</Button>
 *           <Button size="lg" fullWidth variant="soft" tone="danger" value="delete">Delete</Button>
 *         </ActionSheetActions>
 *         <ActionSheetCancel />
 *       </form>
 *     </ActionSheetPanel>
 *   </ActionSheet>
 *
 * Renders `<dialog class="blip-box blip-drawer blip-action-sheet">`.
 */
export const ActionSheetPanel = /*#__PURE__*/ forwardRef<HTMLDialogElement, ActionSheetPanelProps>(function ActionSheetPanel(
  { layout, static: isStatic, className, ...rest },
  ref,
) {
  return (
    <dialog
      ref={ref}
      className={cx("blip-box blip-drawer blip-action-sheet", className)}
      data-layout={layout}
      data-blip-static={flag(isStatic)}
      {...rest}
    />
  );
});

/** Props for {@link ActionSheetTitle}. */
export type ActionSheetTitleProps = NativeProps<"h2">;

/**
 * The title, optional: what the choices act on ("Replay 12"), Pixel Bop at scale 1, centred. Give it the id the
 * panel's `aria-labelledby` names.
 *
 * Renders `<h2 class="blip-action-sheet-title">`.
 */
export const ActionSheetTitle = /*#__PURE__*/ forwardRef<HTMLHeadingElement, ActionSheetTitleProps>(function ActionSheetTitle(
  { className, ...rest },
  ref,
) {
  return <h2 ref={ref} className={cx("blip-action-sheet-title", className)} {...rest} />;
});

/** Props for {@link ActionSheetMessage}. */
export type ActionSheetMessageProps = NativeProps<"p">;

/**
 * The message, optional: one short line of context under the title, muted. Point the panel's `aria-describedby` at it.
 *
 * Renders `<p class="blip-action-sheet-message">`.
 */
export const ActionSheetMessage = /*#__PURE__*/ forwardRef<HTMLParagraphElement, ActionSheetMessageProps>(function ActionSheetMessage(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("blip-action-sheet-message", className)} {...rest} />;
});

/** Props for {@link ActionSheetActions}. */
export type ActionSheetActionsProps = NativeProps<"div">;

/**
 * The choices: a column of large, full-width buttons (`size="lg" fullWidth`), each with the `value` it closes with.
 * One may be `tone="danger"`. It scrolls when there are too many for the screen.
 *
 * Renders `<div class="blip-action-sheet-actions">`.
 */
export const ActionSheetActions = /*#__PURE__*/ forwardRef<HTMLDivElement, ActionSheetActionsProps>(function ActionSheetActions(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("blip-action-sheet-actions", className)} {...rest} />;
});

/** Props for {@link ActionSheetCancel}. */
export type ActionSheetCancelProps = NativeProps<"button">;

/**
 * Cancel, set apart below the choices: a large, full-width, soft neutral button that closes with `value="cancel"`
 * (and says "Cancel") unless you say otherwise.
 *
 * Renders `<button class="blip-box blip-button blip-action-sheet-cancel" data-size="lg" data-width="full"
 * data-variant="soft" data-tone="neutral" value="cancel">`.
 */
export const ActionSheetCancel = /*#__PURE__*/ forwardRef<HTMLButtonElement, ActionSheetCancelProps>(function ActionSheetCancel(
  { value = "cancel", children = "Cancel", className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx("blip-box blip-button blip-action-sheet-cancel", className)}
      data-size="lg"
      data-width="full"
      data-variant="soft"
      data-tone="neutral"
      value={value}
      {...rest}
    >
      {children}
    </button>
  );
});
