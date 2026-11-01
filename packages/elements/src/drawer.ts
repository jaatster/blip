/**
 * <blip-drawer>: a side sheet. The same behaviour as <blip-dialog> (modal, cancelable blip-before-close, stepped exit,
 * focus returned, optional light dismiss) around a <dialog class="blip-box blip-drawer">, which slides in and out
 * from its data-side (end, start or bottom; end and start follow the text) in six whole-pixel steps.
 *
 *   <blip-drawer light-dismiss>
 *     <dialog class="blip-box blip-drawer" id="settings" data-side="end" aria-labelledby="settings-title">…</dialog>
 *   </blip-drawer>
 *   <button class="blip-box blip-button" commandfor="settings" command="show-modal">Settings</button>
 */
import { Overlay } from "./_overlay.js";

/**
 * A side sheet: the same modal behaviour as <blip-dialog> around a <dialog class="blip-box blip-drawer">, which slides in
 * and out from its data-side in six whole-pixel steps.
 *
 * @summary A modal side sheet around one <dialog class="blip-box blip-drawer">.
 */
export class BlipDrawer extends Overlay {}

BlipDrawer.define("blip-drawer", BlipDrawer);

declare global {
  interface HTMLElementTagNameMap {
    "blip-drawer": BlipDrawer;
  }
}
