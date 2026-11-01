/**
 * <blip-segmented>: one choice from a few buttons, as a radio group. The arrow keys move and choose (Home and End
 * jump), the value goes with the form, and blip-change says what was chosen.
 *
 *   <blip-segmented class="blip-box blip-segmented" name="view" value="grid" aria-label="View">
 *     <button class="blip-box" type="button" value="list">List</button>
 *     <button class="blip-box" type="button" value="grid" aria-checked="true">Grid</button>
 *   </blip-segmented>
 *
 * Attributes: name, value, disabled, required. Properties: value, disabled. Events: input and change (as a native
 * control), then blip-change { value }.
 * Write aria-checked="true" on the chosen button too, so it looks chosen before the script runs. Buttons added or
 * removed later (by a framework) are wired as they come.
 */
import { BlipElement, rovingFocus, warn } from "@blip/core";
import { isOn, unFalse, watch } from "./_dom.js";

/**
 * One choice from a few buttons, as a radio group: the arrow keys move and choose. Form-associated: the chosen
 * button's value goes with the form.
 *
 * @summary One choice from a row of buttons.
 * @attr {string} name - The form field name.
 * @attr {string} value - The chosen button's value. Setting it chooses that button.
 * @attr {boolean} disabled - Disables every segment (also follows a disabled fieldset). "false" is off.
 * @attr {boolean} required - Invalid until something is chosen. "false" is off.
 * @attr {string} [required-message="Choose one."] - The message while required and nothing is chosen.
 * @attr {"sm" | "md" | "lg"} [data-size="md"] - 16, 20 or 24 pixels high, like buttons.
 * @attr {"full"} data-width - Fills its container; the segments share the width.
 * @attr {"accent" | "info" | "success" | "warning" | "danger" | "neutral" | "red" | "orange" | "yellow" | "green" | "teal" |
 * "blue" | "purple" | "pink" | "slate"} data-tone - The chosen segment's candy.
 * @fires {CustomEvent<{ value: string }>} blip-change - A segment was chosen by click or key (after input and change).
 */
export class BlipSegmented extends BlipElement {
  static formAssociated = true;
  static observedAttributes = ["value", "disabled", "required"];

  #internals = this.attachInternals();
  #initial: string | null = null;
  #formOff = false;

  get value(): string {
    return this.getAttribute("value") ?? "";
  }
  set value(v: string) {
    this.setAttribute("value", v);
  }
  get disabled(): boolean {
    return isOn(this, "disabled");
  }
  set disabled(v: boolean) {
    if (v) this.setAttribute("disabled", "");
    else this.removeAttribute("disabled");
  }
  get form(): HTMLFormElement | null {
    return this.#internals.form;
  }
  get validity(): ValidityState {
    return this.#internals.validity;
  }
  get validationMessage(): string {
    return this.#internals.validationMessage;
  }
  checkValidity(): boolean {
    return this.#internals.checkValidity();
  }
  reportValidity(): boolean {
    return this.#internals.reportValidity();
  }

  /** The segments: the element's own buttons. */
  get items(): HTMLButtonElement[] {
    return [...this.querySelectorAll<HTMLButtonElement>(":scope > button")];
  }

  protected connected(): void {
    if (!this.hasAttribute("role")) this.setAttribute("role", "radiogroup");
    if (this.#initial === null) {
      this.#initial = this.getAttribute("value") ?? this.items.find((b) => b.getAttribute("aria-checked") === "true")?.value ?? "";
      if (!this.hasAttribute("value") && this.#initial) this.value = this.#initial;
    }
    if (!this.getAttribute("aria-label") && !this.getAttribute("aria-labelledby") && !this.#internals.labels.length) {
      warn("BLIP-A001", "<blip-segmented> has no name. Add aria-label or aria-labelledby.", this);
    }
    this.#sync();
    // Buttons rendered later (or taken away) get their role, state and place in the tab order as they come.
    watch(this, this.signal, () => this.#sync(), { subtree: false });
    rovingFocus(this, { items: () => this.items, orientation: "both", onMove: (b) => this.#choose(b as HTMLButtonElement), signal: this.signal });
    this.on(this, "click", (e) => {
      const b = (e.target as Element).closest("button");
      if (b?.parentElement === this && !b.disabled) this.#choose(b);
    });
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    if (name !== "value" && unFalse(this, name, value)) return;
    if (this.isConnected && this.#initial !== null) this.#sync();
  }

  formResetCallback(): void {
    this.value = this.#initial ?? "";
  }
  formStateRestoreCallback(state: string | null): void {
    this.value = state ?? "";
  }
  formDisabledCallback(off: boolean): void {
    this.#formOff = off;
    this.#sync();
  }

  #choose(b: HTMLButtonElement): void {
    if (b.value === this.value) return;
    this.value = b.value;
    // As a native control would: input and change, then the Blip event.
    for (const type of ["input", "change"]) this.dispatchEvent(new Event(type, { bubbles: true }));
    this.emit("change", { value: this.value });
  }

  /** Roles, checked state, the one tab stop, the disabled state and the form value, from the value. */
  #sync(): void {
    const items = this.items;
    const value = this.value;
    const off = this.disabled || this.#formOff;
    const chosen = items.find((b) => b.value === value);
    for (const b of items) {
      b.type = "button";
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", String(b === chosen));
      // Disabled with the group: remember which buttons were already off on their own.
      if (off && !b.disabled) {
        b.disabled = true;
        b.dataset.blipGroupOff = "";
      } else if (!off && b.dataset.blipGroupOff !== undefined) {
        b.disabled = false;
        delete b.dataset.blipGroupOff;
      }
    }
    const stop = chosen && !chosen.disabled ? chosen : items.find((b) => !b.disabled);
    for (const b of items) b.tabIndex = b === stop ? 0 : -1;
    this.#internals.setFormValue(value || null);
    if (isOn(this, "required") && !value) this.#internals.setValidity({ valueMissing: true }, this.getAttribute("required-message") ?? "Choose one.", items[0]);
    else this.#internals.setValidity({});
  }
}

BlipElement.define("blip-segmented", BlipSegmented);

declare global {
  interface HTMLElementTagNameMap {
    "blip-segmented": BlipSegmented;
  }
}
