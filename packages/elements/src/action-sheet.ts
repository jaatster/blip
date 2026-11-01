/**
 * <blip-action-sheet>: a short column of choices rising from the bottom (a compact dialog in the middle on wide
 * screens), around a <dialog class="blip-box blip-drawer blip-action-sheet">. The dialog's modal behaviour (focus kept
 * inside, blip-before-close, the stepped exit, focus returned, light dismiss) with one promise about the answer: the
 * choice is the value of the button that closed it, as dialog.returnValue, the element's returnValue and
 * blip-close's detail.returnValue, and it is "" when the sheet was dismissed (Escape, the scrim), never the answer
 * from the last time it was open.
 *
 *   <blip-action-sheet light-dismiss>
 *     <dialog class="blip-box blip-drawer blip-action-sheet" id="replay" aria-labelledby="replay-title">
 *       <form method="dialog">
 *         <h2 class="blip-action-sheet-title" id="replay-title">Replay 12</h2>
 *         <div class="blip-action-sheet-actions">
 *           <button class="blip-box blip-button" data-size="lg" data-width="full" data-variant="soft" value="share">Share</button>
 *         </div>
 *         <button class="blip-box blip-button blip-action-sheet-cancel" data-size="lg" data-width="full" data-variant="soft" data-tone="neutral" value="cancel">Cancel</button>
 *       </form>
 *     </dialog>
 *   </blip-action-sheet>
 *
 *   sheet.addEventListener("blip-close", (e) => { if (e.detail.returnValue === "share") share(); });
 */
import { Overlay } from "./_overlay.js";

/**
 * An action sheet: the dialog's modal behaviour around one <dialog class="blip-box blip-drawer blip-action-sheet">. The
 * choice comes back as the value of the button that closed it (returnValue, and blip-close's detail.returnValue); it is
 * empty when the sheet was dismissed, since each opening starts with an empty returnValue.
 *
 * @summary A modal column of choices around one <dialog class="blip-box blip-drawer blip-action-sheet">.
 */
export class BlipActionSheet extends Overlay {
  /** Opens it as a modal, with an empty returnValue. `opener` gets focus back when it closes. */
  show(opener?: Element | null): void {
    const d = this.dialog;
    if (d && !d.open) d.returnValue = "";
    super.show(opener);
  }
}

BlipActionSheet.define("blip-action-sheet", BlipActionSheet);

declare global {
  interface HTMLElementTagNameMap {
    "blip-action-sheet": BlipActionSheet;
  }
}
