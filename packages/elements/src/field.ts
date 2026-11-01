/**
 * <blip-field>: wires a field's words to its control, so nothing has to be wired by hand.
 *
 *   <blip-field class="blip-field">
 *     <label class="blip-field-label" for="bio">About you</label>
 *     <span class="blip-box blip-textarea"><textarea id="bio" maxlength="200"></textarea></span>
 *     <p class="blip-field-help">Shown on your profile.</p>
 *     <p class="blip-field-error" hidden>Tell us a little about you.</p>
 *     <p class="blip-field-count"></p>
 *   </blip-field>
 *
 * - Help, a showing error and count are added to the control's aria-describedby (the group's, for a role="group"
 *   field), and taken out when they go. Parts rendered later or taken away (by a framework) are wired as they come.
 * - The browser's checks: when it finds the control invalid (on submit, or when a changed value is checked), the
 *   error shows and the control (or the blip-segmented / blip-rating) gets aria-invalid; both go once the value is valid
 *   or the form is reset. The words: a hidden error's own text, else the browser's message.
 * - Your own errors are yours: an error that shows with your words (from the server, or your framework's state)
 *   stays until you change it, and the field marks the control invalid while it shows. An aria-invalid you write
 *   stays too: the field only ever takes away the aria-invalid it wrote.
 * - Every error that comes up is read out politely, once.
 * - The count shows "12/200" against maxlength; a screen reader hears how many are left once typing pauses
 *   (count-text: "{left} characters left").
 * - An <output for> follows its control, and a range control's --blip-slider-value fills the slider's groove.
 */
import { BlipElement } from "@blip/core";
import { elementsChanged } from "./_dom.js";

let uid = 0;
const id = (el: Element) => el.id || (el.id = `blip-field-${++uid}`);
const words = (el: Element | null) => el?.textContent?.trim() ?? "";
type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/**
 * Wires a field's label, help, error and count to its control (aria-describedby, aria-invalid, live messages), so
 * nothing has to be wired by hand. Parts rendered later or taken away are wired as they come, and the page's own
 * errors and aria-invalid are left as the page wrote them.
 *
 * @summary A form field that wires its words to its control.
 * @attr {string} [count-text="{left} characters left"] - What screen readers hear once typing pauses in a field
 * with a count; {left} is filled in.
 * @attr {string} role - "group" describes the whole group (a set of checkboxes or radios), not its first control.
 * @attr {"inline"} data-layout - The label beside the control (--blip-field-label-width, 64 pixels by default).
 */
export class BlipField extends BlipElement {
  static classes = ["blip-field"];

  #controls: Control[] = [];
  #group: HTMLElement | null = null;
  #target: Element | null = null;
  #error: HTMLElement | null = null;
  #count: HTMLElement | null = null;
  /** Controls whose aria-invalid the field wrote: the only ones it takes it away from. */
  #marked = new WeakSet<Element>();
  /** Errors hidden with words when first seen: the words for the browser's message. */
  #held = new WeakSet<Element>();
  #heldShown = false;
  /** Ids the field put in the description. */
  #added = new Set<string>();
  /** The words the field last wrote into the error, and the last error read out. */
  #wrote = "";
  #said = "";
  /** The browser finds a control invalid, with this message. */
  #invalid = false;
  #message = "";
  #live?: HTMLElement;
  #observer?: MutationObserver;
  #timer?: ReturnType<typeof setTimeout>;

  protected connected(): void {
    // One polite live region for the field: errors as they come up, and the count after a pause.
    this.#live ??= Object.assign(document.createElement("span"), { className: "blip-sr-only blip-field-live" });
    this.#live.setAttribute("aria-live", "polite");
    if (this.#live.parentElement !== this) this.append(this.#live);
    this.#parts();
    this.#update();
    this.#render(true);
    const observer = (this.#observer = new MutationObserver((records) => {
      if (this.#settle(records)) this.#render();
    }));
    observer.observe(this, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["aria-invalid", "aria-describedby", "hidden"] });
    this.signal.addEventListener("abort", () => {
      observer.disconnect();
      clearTimeout(this.#timer);
    }, { once: true });

    const valid = (el: EventTarget | null) => (el as { validity?: ValidityState } | null)?.validity?.valid !== false;
    // invalid doesn't bubble: listen while it comes down.
    this.on(this, "invalid", (e) => {
      this.#invalid = true;
      this.#message = (e.target as Control).validationMessage;
      this.#render();
    }, { capture: true });
    this.on(this, "input", (e) => {
      this.#update(e.target === this.#controls[0]);
      if (this.#invalid && this.#controls.every(valid) && valid(this.#group)) {
        this.#invalid = false;
        this.#render();
      }
    });
    this.on(this, "change", (e) => {
      this.#update();
      (e.target as Control).checkValidity?.();
    });
    // A form reset changes values without events: look again once it is done.
    const form = this.closest("form");
    if (form) {
      this.on(form, "reset", () =>
        setTimeout(() => {
          this.#update();
          this.#invalid = false;
          this.#render();
        }),
      );
    }
  }

  /** Takes in the page's changes: an aria-invalid it wrote is its own from then on, and parts that came or went are
      found again. True if anything the field shows depends on them. */
  #settle(records: MutationRecord[] = this.#observer?.takeRecords() ?? []): boolean {
    let changed = false;
    let again = false;
    for (const r of records) {
      const t = r.target;
      if (r.type === "attributes" && r.attributeName === "aria-invalid") {
        this.#marked.delete(t as Element);
        changed = true;
      } else if (r.type === "attributes" && r.attributeName === "aria-describedby") changed ||= t === this.#target;
      else if (elementsChanged(r) && t !== this.#live) again = true;
      else if (this.#error?.contains(t)) changed = true;
    }
    if (again) this.#parts();
    return changed || again;
  }

  /** Finds the parts there are now. */
  #parts(): void {
    this.#controls = [...this.querySelectorAll<Control>("input:not([type=hidden]), select, textarea")];
    this.#group = this.querySelector<HTMLElement>("blip-segmented, blip-rating");
    const target = this.getAttribute("role") ? this : (this.#group ?? this.#controls[0] ?? null);
    if (target !== this.#target && this.#target) this.#describe(this.#target, []);
    this.#target = target;
    const error = this.querySelector<HTMLElement>(".blip-field-error");
    if (error !== this.#error) {
      this.#error = error;
      this.#wrote = "";
      this.#heldShown = false;
      if (error?.hidden && words(error)) this.#held.add(error);
    }
    this.#count = this.querySelector<HTMLElement>(".blip-field-count");
    this.#count?.setAttribute("aria-hidden", "true");
  }

  /** Links these parts to the target, keeping the page's own ids and taking out parts that went. */
  #describe(target: Element, parts: string[]): void {
    const ids = (target.getAttribute("aria-describedby") ?? "").split(/\s+/).filter((i) => i && !(this.#added.has(i) && !parts.includes(i)));
    const added = new Set([...this.#added].filter((i) => parts.includes(i)));
    for (const p of parts) {
      if (ids.includes(p)) continue;
      ids.push(p);
      added.add(p);
    }
    this.#added = added;
    if (ids.length) target.setAttribute("aria-describedby", ids.join(" "));
    else target.removeAttribute("aria-describedby");
  }

  /** The error, the description and aria-invalid as they should be now; a new error is read out (not on the first
      look: what is on the page when it loads is read with the page). */
  #render(silent = false): void {
    this.#settle();
    const error = this.#error;
    if (error && this.#held.has(error)) {
      // A hidden error holds the words for the browser's message: shown while the browser finds the control invalid.
      if (this.#invalid) error.hidden = false;
      else if (this.#heldShown) error.hidden = true;
      this.#heldShown = this.#invalid;
    } else if (error && (!words(error) || words(error) === this.#wrote)) {
      // An empty error is the field's to fill with the browser's message. Words the page wrote are left alone.
      const message = this.#invalid ? this.#message : "";
      if (error.textContent !== message) error.textContent = message;
      this.#wrote = message;
    }
    const said = error && !error.hidden ? words(error) : "";
    const target = this.#target;
    if (target) this.#describe(target, [this.querySelector(".blip-field-help"), said ? error : null, this.#count].filter((p): p is Element => !!p).map(id));
    const invalid = this.#invalid || !!said;
    for (const c of [...this.#controls, ...(this.#group ? [this.#group] : [])]) {
      if (invalid && c.getAttribute("aria-invalid") !== "true") {
        c.setAttribute("aria-invalid", "true");
        this.#marked.add(c);
      } else if (!invalid && this.#marked.has(c)) {
        c.removeAttribute("aria-invalid");
        this.#marked.delete(c);
      }
    }
    if (said !== this.#said) {
      this.#said = said;
      if (said && !silent && this.#live) this.#live.textContent = said;
    }
    // What the field just changed is its own: not news.
    this.#observer?.takeRecords();
  }

  /** The count, outputs and slider fills, from the values. */
  #update(typing = false): void {
    const c = this.#controls[0];
    const count = this.#count;
    if (count && c && "maxLength" in c && c.maxLength > 0) {
      const n = c.value.length;
      const left = c.maxLength - n;
      count.textContent = `${n}/${c.maxLength}`;
      count.dataset.state = left <= 0 ? "full" : "";
      clearTimeout(this.#timer);
      if (typing) this.#timer = setTimeout(() => (this.#live!.textContent = (this.getAttribute("count-text") ?? "{left} characters left").replace("{left}", String(left))), 700);
    }
    for (const out of this.querySelectorAll("output")) {
      const from = this.#controls.find((x) => out.htmlFor.contains(x.id));
      if (from) out.value = from.value;
    }
    for (const r of this.#controls) {
      if (r instanceof HTMLInputElement && r.type === "range") {
        const min = Number(r.min || 0);
        const max = Number(r.max || 100);
        r.style.setProperty("--blip-slider-value", String(max > min ? (Number(r.value) - min) / (max - min) : 0));
      }
    }
  }
}

BlipElement.define("blip-field", BlipField);

declare global {
  interface HTMLElementTagNameMap {
    "blip-field": BlipField;
  }
}
