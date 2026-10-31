/**
 * <pp-dialog>: a native <dialog> with Blip's manners. Opens it as a modal (focus trapped, page inert, dithered
 * scrim), runs every close through a cancelable pp-before-close and the stepped exit, returns focus to the opener,
 * and with light-dismiss closes on a press on the scrim.
 *
 *   <pp-dialog light-dismiss>
 *     <dialog class="pp-box pp-dialog" id="save" aria-labelledby="save-title">…</dialog>
 *   </pp-dialog>
 *   <button class="pp-box pp-button" commandfor="save" command="show-modal">Save game</button>
 *
 * Attributes: open, light-dismiss. Methods: show(opener?), requestClose(value?), close(value?).
 * Events: pp-open, pp-before-close (cancelable; detail { reason, returnValue }), pp-close (detail the same).
 */
import { Overlay } from "./_overlay.js";

export type { CloseDetail, CloseReason } from "./_overlay.js";

/**
 * A native <dialog> with Blip's manners: opened as a modal, every close through a cancelable pp-before-close
 * and the stepped exit, focus returned to the opener, and an optional light dismiss.
 *
 * @summary A modal dialog around one <dialog class="pp-box pp-dialog">.
 */
export class PixelDialog extends Overlay {}

PixelDialog.define("pp-dialog", PixelDialog);

declare global {
  interface HTMLElementTagNameMap {
    "pp-dialog": PixelDialog;
  }
}
