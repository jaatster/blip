/**
 * <chu-number>: a number field with a pixel minus and plus. The input inside stays the real control (the spin
 * button: arrow keys, typing, the form value); the buttons are for pointers and touch. Held down, a button steps
 * once, then again after a beat, then every 100 ms, then every 40 ms, until it is let go or the range ends.
 * Page Up and Page Down step ten at a time.
 *
 *   <chu-number class="chu-number">
 *     <span class="chu-box chu-input"><input id="lives" name="lives" type="number" min="1" max="9" value="3"></span>
 *   </chu-number>
 *
 * Attributes: decrease-label, increase-label (the buttons' names). Event: chu-change { value } when the value is
 * committed (the input's change). An input rendered later, or swapped by a framework, gets the buttons as it comes.
 */
import { BlipElement, warn } from "@jaatster/blip-core";
import { both, elementsChanged, observe } from "./_dom.js";

const button = (step: string, label: string): HTMLButtonElement => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "chu-box chu-number-step";
  b.dataset.variant = "ghost";
  b.dataset.step = step;
  b.tabIndex = -1;
  b.setAttribute("aria-label", label);
  b.append(document.createElement("span"));
  return b;
};

/**
 * A number field with a pixel minus and plus. The <input type="number"> inside stays the real control; the buttons
 * are for pointers and touch, and step faster while held.
 *
 * @summary A number field with step buttons.
 * @attr {string} [decrease-label="Decrease"] - The minus button's accessible name.
 * @attr {string} [increase-label="Increase"] - The plus button's accessible name.
 * @fires {CustomEvent<{ value: string }>} chu-change - The value was committed (the input's change).
 */
export class BlipNumber extends BlipElement {
  static classes = ["chu-number"];

  #down = button("down", "Decrease");
  #up = button("up", "Increase");
  /** The input wired now, and what aborts its wiring when it goes. */
  #field: HTMLInputElement | null = null;
  #wiring?: AbortController;

  get input(): HTMLInputElement | null {
    return this.querySelector("input");
  }

  protected connected(): void {
    this.#field = null;
    this.#wire();
    // An input rendered later, or swapped by a framework, gets the buttons when it arrives.
    observe(this, this.signal, () => this.#wire(), elementsChanged);
    if (!this.input && this.children.length) warn("CHU-E001", "<chu-number> needs an <input type=number> inside.", this);
    for (const [b, dir] of [[this.#down, -1], [this.#up, 1]] as const) {
      this.on(b, "pointerdown", (e) => {
        if (e.button !== 0) return;
        e.preventDefault(); // keep the focus (and the caret) where it is
        this.#hold(b, dir);
      });
      // Keyboard and assistive tech press the button without a pointer: one step.
      this.on(b, "click", (e) => {
        if (e.detail === 0 && this.#step(dir)) this.#commit();
      });
    }
  }

  /** Puts the buttons round the input there is now and listens to it (once per input). */
  #wire(): void {
    const input = this.input;
    if (!input || input === this.#field) return;
    this.#wiring?.abort();
    this.#field = input;
    const signal = both(this.signal, (this.#wiring = new AbortController()).signal);
    this.#down.setAttribute("aria-label", this.getAttribute("decrease-label") ?? "Decrease");
    this.#up.setAttribute("aria-label", this.getAttribute("increase-label") ?? "Increase");
    for (const b of [this.#down, this.#up]) {
      if (input.id) b.setAttribute("aria-controls", input.id);
      else b.removeAttribute("aria-controls");
    }
    if (input.previousElementSibling !== this.#down) input.before(this.#down);
    if (input.nextElementSibling !== this.#up) input.after(this.#up);
    this.#update();
    input.addEventListener("input", () => this.#update(), { signal });
    input.addEventListener("change", () => {
      this.#update();
      this.emit("change", { value: input.value });
    }, { signal });
    input.addEventListener("keydown", (e) => {
      const dir = e.key === "PageUp" ? 1 : e.key === "PageDown" ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      if (this.#step(dir, 10)) this.#commit();
    }, { signal });
    // A form reset changes the value without an event: look again once it is done.
    if (input.form) input.form.addEventListener("reset", () => setTimeout(() => this.#update()), { signal });
    const watchInput = new MutationObserver(() => this.#update());
    watchInput.observe(input, { attributes: true, attributeFilter: ["disabled", "readonly", "min", "max"] });
    signal.addEventListener("abort", () => watchInput.disconnect(), { once: true });
  }

  /** One step (or n), clamped by the input; true if the value changed. Fires input like typing does. */
  #step(dir: number, n = 1): boolean {
    const input = this.input;
    if (!input || input.disabled || input.readOnly || input.matches(":disabled")) return false;
    const before = input.value;
    try {
      if (dir > 0) input.stepUp(n);
      else input.stepDown(n);
    } catch {
      // step="any": one by one, kept inside min and max.
      const v = (Number.isNaN(input.valueAsNumber) ? 0 : input.valueAsNumber) + dir * n;
      input.valueAsNumber = Math.min(input.max === "" ? Infinity : Number(input.max), Math.max(input.min === "" ? -Infinity : Number(input.min), v));
    }
    if (input.value === before) return false;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    this.#update();
    return true;
  }

  #commit(): void {
    this.input?.dispatchEvent(new Event("change", { bubbles: true }));
  }

  /** Steps while the button is held: at once, after a beat, then faster in two steps. Stops on release. */
  #hold(b: HTMLButtonElement, dir: number): void {
    const input = this.input!;
    const from = input.value;
    const stop = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let n = 0;
    const end = () => {
      clearTimeout(timer);
      stop.abort();
      if (input.value !== from) this.#commit();
    };
    const tick = () => {
      if (!this.#step(dir)) return end();
      n++;
      timer = setTimeout(tick, n === 1 ? 400 : n < 10 ? 100 : 40);
    };
    for (const type of ["pointerup", "pointercancel", "pointerleave"]) b.addEventListener(type, end, { signal: stop.signal });
    addEventListener("blur", end, { signal: stop.signal });
    this.signal.addEventListener("abort", end, { signal: stop.signal });
    tick();
  }

  /** A button goes dithered at its end of the range, and both when the input can't change. */
  #update(): void {
    const input = this.input;
    if (!input) return;
    const v = input.valueAsNumber;
    // A disabled fieldset disables the buttons too (they are inside it), so only the input's own state counts here.
    const off = input.disabled || input.readOnly;
    this.#down.disabled = off || (input.min !== "" && v <= Number(input.min));
    this.#up.disabled = off || (input.max !== "" && v >= Number(input.max));
  }
}

BlipElement.define("chu-number", BlipNumber);

declare global {
  interface HTMLElementTagNameMap {
    "chu-number": BlipNumber;
  }
}
