/**
 * <chu-action-sheet>: a short column of choices rising from the bottom (a compact dialog in the middle on wide
 * screens), around a <dialog class="chu-box chu-drawer chu-action-sheet">. The dialog's modal behaviour (focus kept
 * inside, chu-before-close, the stepped exit, focus returned, light dismiss) with one promise about the answer: the
 * choice is the value of the button that closed it, as dialog.returnValue, the element's returnValue and
 * chu-close's detail.returnValue, and it is "" when the sheet was dismissed (Escape, the scrim), never the answer
 * from the last time it was open.
 *
 *   <chu-action-sheet light-dismiss>
 *     <dialog class="chu-box chu-drawer chu-action-sheet" id="replay" aria-labelledby="replay-title">
 *       <form method="dialog">
 *         <h2 class="chu-action-sheet-title" id="replay-title">Replay 12</h2>
 *         <div class="chu-action-sheet-actions">
 *           <button class="chu-box chu-button" data-size="lg" data-width="full" data-variant="soft" value="share">Share</button>
 *         </div>
 *         <button class="chu-box chu-button chu-action-sheet-cancel" data-size="lg" data-width="full" data-variant="soft" data-tone="neutral" value="cancel">Cancel</button>
 *       </form>
 *     </dialog>
 *   </chu-action-sheet>
 *
 *   sheet.addEventListener("chu-close", (e) => { if (e.detail.returnValue === "share") share(); });
 */
import { Overlay } from "./_overlay.js";

/**
 * An action sheet: the dialog's modal behaviour around one <dialog class="chu-box chu-drawer chu-action-sheet">. The
 * choice comes back as the value of the button that closed it (returnValue, and chu-close's detail.returnValue); it is
 * empty when the sheet was dismissed, since each opening starts with an empty returnValue.
 *
 * @summary A modal column of choices around one <dialog class="chu-box chu-drawer chu-action-sheet">.
 */
export class BlipActionSheet extends Overlay {
  /** Opens it as a modal, with an empty returnValue. `opener` gets focus back when it closes. */
  show(opener?: Element | null): void {
    const d = this.dialog;
    if (d && !d.open) d.returnValue = "";
    super.show(opener);
  }
}

BlipActionSheet.define("chu-action-sheet", BlipActionSheet);

declare global {
  interface HTMLElementTagNameMap {
    "chu-action-sheet": BlipActionSheet;
  }
}
