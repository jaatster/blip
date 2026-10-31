/**
 * <pp-number>: a number field with a pixel minus and plus. The input inside stays the real control (the spin
 * button: arrow keys, typing, the form value); the buttons are for pointers and touch. Held down, a button steps
 * once, then again after a beat, then every 100 ms, then every 40 ms, until it is let go or the range ends.
 * Page Up and Page Down step ten at a time.
 *
 *   <pp-number class="pp-number">
 *     <span class="pp-box pp-input"><input id="lives" name="lives" type="number" min="1" max="9" value="3"></span>
 *   </pp-number>
 *
 * Attributes: decrease-label, increase-label (the buttons' names). Event: pp-change { value } when the value is
 * committed (the input's change).
 */
import { PixelElement, warn } from "@jaatster/blip-core";

const button = (step: string, label: string): HTMLButtonElement => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "pp-box pp-number-step";
  b.dataset.variant = "ghost";
  b.dataset.step = step;
  b.tabIndex = -1;
  b.setAttribute("aria-label", label);
  b.append(document.createElement("span"));
  return b;
};

export class PixelNumber extends PixelElement {
  static classes = ["pp-number"];

  #down = button("down", "Decrease");
  #up = button("up", "Increase");

  get input(): HTMLInputElement | null {
    return this.querySelector("input");
  }

  protected connected(): void {
    const input = this.input;
    if (!input) return warn("PP-E001", "<pp-number> needs an <input type=number> inside.", this);
    this.#down.setAttribute("aria-label", this.getAttribute("decrease-label") ?? "Decrease");
    this.#up.setAttribute("aria-label", this.getAttribute("increase-label") ?? "Increase");
    if (input.id) for (const b of [this.#down, this.#up]) b.setAttribute("aria-controls", input.id);
    input.before(this.#down);
    input.after(this.#up);
    this.#update();

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
    this.on(input, "input", () => this.#update());
    this.on(input, "change", () => {
      this.#update();
      this.emit("change", { value: input.value });
    });
    this.on(input, "keydown", (e) => {
      const dir = e.key === "PageUp" ? 1 : e.key === "PageDown" ? -1 : 0;
      if (!dir) return;
      e.preventDefault();
      if (this.#step(dir, 10)) this.#commit();
    });
    // A form reset changes the value without an event: look again once it is done.
    if (input.form) this.on(input.form, "reset", () => setTimeout(() => this.#update()));
    const watch = new MutationObserver(() => this.#update());
    watch.observe(input, { attributes: true, attributeFilter: ["disabled", "readonly", "min", "max"] });
    this.signal.addEventListener("abort", () => watch.disconnect(), { once: true });
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

PixelElement.define("pp-number", PixelNumber);

declare global {
  interface HTMLElementTagNameMap {
    "pp-number": PixelNumber;
  }
}
