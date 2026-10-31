/**
 * <pp-drawer>: a side sheet. The same behaviour as <pp-dialog> (modal, cancelable pp-before-close, stepped exit,
 * focus returned, optional light dismiss) around a <dialog class="pp-box pp-drawer">, which slides in and out
 * from its data-side in six whole-pixel steps.
 *
 *   <pp-drawer light-dismiss>
 *     <dialog class="pp-box pp-drawer" id="settings" data-side="right" aria-labelledby="settings-title">…</dialog>
 *   </pp-drawer>
 *   <button class="pp-box pp-button" commandfor="settings" command="show-modal">Settings</button>
 */
import { Overlay } from "./_overlay.js";

export class PixelDrawer extends Overlay {}

PixelDrawer.define("pp-drawer", PixelDrawer);

declare global {
  interface HTMLElementTagNameMap {
    "pp-drawer": PixelDrawer;
  }
}
