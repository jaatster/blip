/**
 * <chu-drawer>: a side sheet. The same behaviour as <chu-dialog> (modal, cancelable chu-before-close, stepped exit,
 * focus returned, optional light dismiss) around a <dialog class="chu-box chu-drawer">, which slides in and out
 * from its data-side (end, start or bottom; end and start follow the text) in six whole-pixel steps.
 *
 *   <chu-drawer light-dismiss>
 *     <dialog class="chu-box chu-drawer" id="settings" data-side="end" aria-labelledby="settings-title">…</dialog>
 *   </chu-drawer>
 *   <button class="chu-box chu-button" commandfor="settings" command="show-modal">Settings</button>
 */
import { Overlay } from "./_overlay.js";

/**
 * A side sheet: the same modal behaviour as <chu-dialog> around a <dialog class="chu-box chu-drawer">, which slides in
 * and out from its data-side in six whole-pixel steps.
 *
 * @summary A modal side sheet around one <dialog class="chu-box chu-drawer">.
 */
export class BlipDrawer extends Overlay {}

BlipDrawer.define("chu-drawer", BlipDrawer);

declare global {
  interface HTMLElementTagNameMap {
    "chu-drawer": BlipDrawer;
  }
}
