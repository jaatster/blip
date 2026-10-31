/**
 * <pp-field>: wires a field's words to its control, so nothing has to be wired by hand.
 *
 *   <pp-field class="pp-field">
 *     <label class="pp-field-label" for="bio">About you</label>
 *     <span class="pp-box pp-textarea"><textarea id="bio" maxlength="200"></textarea></span>
 *     <p class="pp-field-help">Shown on your profile.</p>
 *     <p class="pp-field-error" hidden>Tell us a little about you.</p>
 *     <p class="pp-field-count"></p>
 *   </pp-field>
 *
 * - Help, error and count are added to the control's aria-describedby (the group's, for a role="group" field).
 * - The error shows when the browser finds the control invalid (on submit, or when a changed value is checked),
 *   and the control (or the pp-segmented / pp-rating) gets aria-invalid; it goes away once the value is valid or
 *   the form is reset. Its words: a hidden error's own text, else the browser's message. An error already showing
 *   in the page (from the server) stays until the value changes. Errors are read out politely.
 * - The count shows "12/200" against maxlength; a screen reader hears how many are left once typing pauses
 *   (count-text: "{left} characters left").
 * - An <output for> follows its control, and a range control's --pp-slider-value fills the slider's groove.
 */
import { PixelElement } from "@jaatster/blip-core";

let uid = 0;
const id = (el: Element) => el.id || (el.id = `pp-field-${++uid}`);
type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/**
 * Wires a field's label, help, error and count to its control (aria-describedby, aria-invalid, live messages), so
 * nothing has to be wired by hand.
 *
 * @summary A form field that wires its words to its control.
 * @attr {string} [count-text="{left} characters left"] - What screen readers hear once typing pauses in a field
 * with a count; {left} is filled in.
 * @attr {string} role - "group" describes the whole group (a set of checkboxes or radios), not its first control.
 * @attr {"inline"} data-layout - The label beside the control (--pp-field-label-width, 64 pixels by default).
 */
export class PixelField extends PixelElement {
  static classes = ["pp-field"];

  /** A hidden error's words, read on the first connect (later the element holds whatever is showing). */
  #written: string | undefined;

  protected connected(): void {
    const controls = [...this.querySelectorAll<Control>("input:not([type=hidden]), select, textarea")];
    const group = this.querySelector<HTMLElement>("pp-segmented, pp-rating");
    const target = this.getAttribute("role") ? this : (group ?? controls[0]);
    if (!target) return;
    const error = this.querySelector<HTMLElement>(".pp-field-error");
    const count = this.querySelector<HTMLElement>(".pp-field-count");
    // A hidden error holds the words to use. A visible one is an error already (from the server): it shows until
    // the value changes, then the browser's messages take over.
    const first = this.#written === undefined;
    const text = error?.textContent?.trim() ?? "";
    if (first) this.#written = error?.hidden ? text : "";
    const written = this.#written ?? "";
    const showing = first ? !!text && !error?.hidden : !!error?.textContent;
    if (error) {
      error.hidden = false;
      error.setAttribute("aria-live", "polite");
    }
    let live: HTMLElement | null = null;

    if (count) {
      count.setAttribute("aria-hidden", "true");
      live = count.nextElementSibling?.matches(".pp-field-count-live") ? (count.nextElementSibling as HTMLElement) : null;
      if (!live) {
        live = Object.assign(document.createElement("span"), { className: "pp-sr-only pp-field-count-live" });
        live.setAttribute("aria-live", "polite");
        count.after(live);
      }
    }
    const described = new Set((target.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
    for (const part of [this.querySelector(".pp-field-help"), error, count]) if (part) described.add(id(part));
    target.setAttribute("aria-describedby", [...described].join(" "));

    // Shown means it has words; emptied, it hides itself (CSS :empty) and adds nothing to the description.
    const invalid = (on: boolean, message = "") => {
      for (const c of [...controls, ...(group ? [group] : [])]) on ? c.setAttribute("aria-invalid", "true") : c.removeAttribute("aria-invalid");
      if (error) error.textContent = on ? written || message : "";
    };
    if (showing && !written && error) {
      // The page's own error: show it as it is until the value changes.
      for (const c of [...controls, ...(group ? [group] : [])]) c.setAttribute("aria-invalid", "true");
    } else invalid(showing);

    let timer: ReturnType<typeof setTimeout> | undefined;
    const update = (typing = false) => {
      const c = controls[0];
      if (count && c && "maxLength" in c && c.maxLength > 0) {
        const n = c.value.length;
        const left = c.maxLength - n;
        count.textContent = `${n}/${c.maxLength}`;
        count.dataset.state = left <= 0 ? "full" : "";
        clearTimeout(timer);
        if (typing) timer = setTimeout(() => (live!.textContent = (this.getAttribute("count-text") ?? "{left} characters left").replace("{left}", String(left))), 700);
      }
      for (const out of this.querySelectorAll("output")) {
        const from = controls.find((x) => out.htmlFor.contains(x.id));
        if (from) out.value = from.value;
      }
      for (const r of controls) {
        if (r instanceof HTMLInputElement && r.type === "range") {
          const min = Number(r.min || 0);
          const max = Number(r.max || 100);
          r.style.setProperty("--pp-slider-value", String(max > min ? (Number(r.value) - min) / (max - min) : 0));
        }
      }
    };
    update();
    this.signal.addEventListener("abort", () => clearTimeout(timer), { once: true });

    const valid = (el: EventTarget | null) => (el as { validity?: ValidityState } | null)?.validity?.valid !== false;
    // invalid doesn't bubble: listen while it comes down.
    this.on(this, "invalid", (e) => invalid(true, (e.target as Control).validationMessage), { capture: true });
    this.on(this, "input", (e) => {
      update(e.target === controls[0]);
      if (valid(e.target) && controls.every(valid) && valid(group)) invalid(false);
    });
    this.on(this, "change", (e) => {
      update();
      (e.target as Control).checkValidity?.();
    });
    // A form reset changes values without events: look again once it is done.
    const form = this.closest("form");
    if (form) {
      this.on(form, "reset", () =>
        setTimeout(() => {
          update();
          invalid(false);
        }),
      );
    }
  }
}

PixelElement.define("pp-field", PixelField);

declare global {
  interface HTMLElementTagNameMap {
    "pp-field": PixelField;
  }
}
