/**
 * <pp-segmented>: one choice from a few buttons, as a radio group. The arrow keys move and choose (Home and End
 * jump), the value goes with the form, and pp-change says what was chosen.
 *
 *   <pp-segmented class="pp-box pp-segmented" name="view" value="grid" aria-label="View">
 *     <button class="pp-box" type="button" value="list">List</button>
 *     <button class="pp-box" type="button" value="grid" aria-checked="true">Grid</button>
 *   </pp-segmented>
 *
 * Attributes: name, value, disabled, required. Properties: value, disabled. Events: input and change (as a native
 * control), then pp-change { value }.
 * Write aria-checked="true" on the chosen button too, so it looks chosen before the script runs.
 */
import { PixelElement, rovingFocus, warn } from "@jaatster/blip-core";

export class PixelSegmented extends PixelElement {
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
    return this.hasAttribute("disabled");
  }
  set disabled(v: boolean) {
    this.toggleAttribute("disabled", v);
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
      warn("PP-A001", "<pp-segmented> has no name. Add aria-label or aria-labelledby.", this);
    }
    this.#sync();
    rovingFocus(this, { items: () => this.items, orientation: "both", onMove: (b) => this.#choose(b as HTMLButtonElement), signal: this.signal });
    this.on(this, "click", (e) => {
      const b = (e.target as Element).closest("button");
      if (b?.parentElement === this && !b.disabled) this.#choose(b);
    });
  }

  attributeChangedCallback(): void {
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
        b.dataset.ppGroupOff = "";
      } else if (!off && b.dataset.ppGroupOff !== undefined) {
        b.disabled = false;
        delete b.dataset.ppGroupOff;
      }
    }
    const stop = chosen && !chosen.disabled ? chosen : items.find((b) => !b.disabled);
    for (const b of items) b.tabIndex = b === stop ? 0 : -1;
    this.#internals.setFormValue(value || null);
    if (this.hasAttribute("required") && !value) this.#internals.setValidity({ valueMissing: true }, this.getAttribute("required-message") ?? "Choose one.", items[0]);
    else this.#internals.setValidity({});
  }
}

PixelElement.define("pp-segmented", PixelSegmented);

declare global {
  interface HTMLElementTagNameMap {
    "pp-segmented": PixelSegmented;
  }
}
