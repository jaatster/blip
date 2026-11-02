/**
 * <blip-rating>: a row of stars (or hearts) to set a score, as a radio group: the arrow keys move and set it,
 * Space sets the focused star, and the pointer previews what a click would set. The score goes with the form.
 *
 *   <blip-rating class="blip-rating" name="fun" value="4" aria-label="How fun was it?"></blip-rating>
 *   <blip-rating class="blip-rating" data-shape="heart" max="3" value="2" readonly aria-label="Lives"></blip-rating>
 *
 * Attributes: name, value, max (5), readonly, disabled, required, star-label (each star's name, "{n} stars" by
 * default; {n} and {max} are filled in). Properties: value, max. Events: input and change (as a native control),
 * then blip-change { value }.
 * For a score that never changes (a review list), the plain CSS rating with role="img" needs no script.
 */
import { BlipElement, rovingFocus, warn } from "@jaatster/blip-core";
import { isOn, unFalse } from "./_dom.js";

/**
 * A row of stars (or hearts) to set a score, as a radio group. Form-associated: the score goes with the form.
 *
 * @summary Set a score with stars or hearts.
 * @attr {string} name - The form field name.
 * @attr {number} value - The score, 0 to max. 0 is "not rated" (nothing is sent).
 * @attr {number} [max=5] - How many stars.
 * @attr {boolean} readonly - Shows the score; it cannot be changed (it stays in the tab order). "false" is off.
 * @attr {boolean} disabled - Switched off (also follows a disabled fieldset). "false" is off.
 * @attr {boolean} required - Invalid while the score is 0. "false" is off.
 * @attr {string} [required-message="Choose a rating."] - The message while required and not rated.
 * @attr {string} [star-label="{n} stars"] - Each star's name; {n} and {max} are filled in.
 * @attr {"heart"} data-shape - Hearts instead of stars.
 * @fires {CustomEvent<{ value: number }>} blip-change - A star was set by click or key (after input and change).
 * @cssprop --blip-rating-value - The score drawn (set by the element).
 * @cssprop --blip-rating-max - How many stars are drawn (set by the element).
 */
export class BlipRating extends BlipElement {
  static formAssociated = true;
  static classes = ["blip-rating"];
  static observedAttributes = ["value", "max", "readonly", "disabled", "required"];

  #internals = this.attachInternals();
  #initial: string | null = null;
  #formOff = false;
  #preview = 0;

  get value(): number {
    return Math.min(this.max, Math.max(0, Number(this.getAttribute("value")) || 0));
  }
  set value(v: number) {
    this.setAttribute("value", String(v));
  }
  get max(): number {
    return Math.max(1, Math.round(Number(this.getAttribute("max")) || 5));
  }
  set max(v: number) {
    this.setAttribute("max", String(v));
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

  get #stars(): HTMLElement[] {
    return [...this.querySelectorAll<HTMLElement>(":scope > .blip-rating-star")];
  }
  get #live(): boolean {
    return !isOn(this, "readonly") && !isOn(this, "disabled") && !this.#formOff;
  }

  protected connected(): void {
    this.#initial ??= this.getAttribute("value");
    if (!this.getAttribute("aria-label") && !this.getAttribute("aria-labelledby") && !this.#internals.labels.length) {
      warn("BLIP-A001", "<blip-rating> has no name. Add aria-label or aria-labelledby.", this);
    }
    this.#sync();
    const star = (e: Event) => (e.target as Element).closest<HTMLElement>(".blip-rating-star");
    rovingFocus(this, { items: () => (this.#live ? this.#stars : []), orientation: "both", onMove: (s) => this.#set(this.#stars.indexOf(s) + 1), signal: this.signal });
    this.on(this, "click", (e) => {
      const s = star(e);
      if (s && this.#live) this.#set(this.#stars.indexOf(s) + 1);
    });
    this.on(this, "keydown", (e) => {
      const s = star(e);
      if (s && this.#live && e.key === " ") {
        e.preventDefault();
        this.#set(this.#stars.indexOf(s) + 1);
      }
    });
    this.on(this, "pointerover", (e) => {
      const s = star(e);
      if (s && this.#live && e.pointerType !== "touch") this.#show(this.#stars.indexOf(s) + 1);
    });
    this.on(this, "pointerleave", () => this.#show(0));
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    if (name !== "value" && name !== "max" && unFalse(this, name, value)) return;
    if (this.isConnected) this.#sync();
  }

  formResetCallback(): void {
    this.value = Number(this.#initial) || 0;
  }
  formStateRestoreCallback(state: string | null): void {
    this.value = Number(state) || 0;
  }
  formDisabledCallback(off: boolean): void {
    this.#formOff = off;
    this.#sync();
  }

  #set(n: number): void {
    this.#preview = 0;
    if (n === this.value) return this.#sync();
    this.value = n;
    for (const type of ["input", "change"]) this.dispatchEvent(new Event(type, { bubbles: true }));
    this.emit("change", { value: n });
  }

  #show(n: number): void {
    this.#preview = n;
    this.toggleAttribute("data-preview", n > 0);
    this.style.setProperty("--blip-rating-value", String(n || this.value));
  }

  /** Stars, roles, checked state, the one tab stop and the form value, from the attributes. */
  #sync(): void {
    const max = this.max;
    const value = this.value;
    const live = this.#live;
    let stars = this.#stars;
    if (stars.length !== max) {
      const label = this.getAttribute("star-label");
      const noun = this.dataset.shape === "heart" ? "heart" : "star";
      stars = Array.from({ length: max }, (_, i) => {
        const s = document.createElement("span");
        s.className = "blip-rating-star";
        s.setAttribute("role", "radio");
        const n = i + 1;
        s.setAttribute("aria-label", label ? label.replace("{n}", String(n)).replace("{max}", String(max)) : `${n} ${noun}${n === 1 ? "" : "s"}`);
        return s;
      });
      this.replaceChildren(...stars);
    }
    const on = Math.round(value);
    if (!this.hasAttribute("role")) this.setAttribute("role", "radiogroup");
    const flag = (el: Element, name: string, on: boolean) => (on ? el.setAttribute(name, "true") : el.removeAttribute(name));
    const off = isOn(this, "disabled") || this.#formOff;
    flag(this, "aria-readonly", isOn(this, "readonly"));
    flag(this, "aria-disabled", off);
    stars.forEach((s, i) => {
      s.setAttribute("aria-checked", String(i + 1 === on));
      // Read-only keeps one tab stop, so the score can be reached; disabled has none.
      s.tabIndex = !off && i === Math.max(0, on - 1) ? 0 : -1;
      flag(s, "aria-disabled", off);
    });
    this.style.setProperty("--blip-rating-max", String(max));
    this.#show(this.#preview);
    this.#internals.setFormValue(value ? String(value) : null);
    if (isOn(this, "required") && !value) this.#internals.setValidity({ valueMissing: true }, this.getAttribute("required-message") ?? "Choose a rating.", stars[0]);
    else this.#internals.setValidity({});
  }
}

BlipElement.define("blip-rating", BlipRating);

declare global {
  interface HTMLElementTagNameMap {
    "blip-rating": BlipRating;
  }
}
