/**
 * <blip-dialog>: a native <dialog> with Blip's manners. Opens it as a modal (focus trapped, page inert, dithered
 * scrim), runs every close through a cancelable blip-before-close and the stepped exit, returns focus to the opener,
 * and with light-dismiss closes on a press on the scrim.
 *
 *   <blip-dialog light-dismiss>
 *     <dialog class="blip-box blip-dialog" id="save" aria-labelledby="save-title">…</dialog>
 *   </blip-dialog>
 *   <button class="blip-box blip-button" commandfor="save" command="show-modal">Save game</button>
 *
 * Attributes: open, light-dismiss. Methods: show(opener?), requestClose(value?), close(value?).
 * Events: blip-open, blip-before-close (cancelable; detail { reason, returnValue }), blip-close (detail the same).
 */
import { Overlay } from "./_overlay.js";

export type { CloseDetail, CloseReason } from "./_overlay.js";

/**
 * A native <dialog> with Blip's manners: opened as a modal, every close through a cancelable blip-before-close
 * and the stepped exit, focus returned to the opener, and an optional light dismiss.
 *
 * @summary A modal dialog around one <dialog class="blip-box blip-dialog">.
 */
export class BlipDialog extends Overlay {}

BlipDialog.define("blip-dialog", BlipDialog);

declare global {
  interface HTMLElementTagNameMap {
    "blip-dialog": BlipDialog;
  }
}
