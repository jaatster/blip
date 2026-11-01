/**
 * <blip-touch-pad>: a pixel D-pad and A and B buttons (and Start) for playing on a touch screen. It sends real
 * keyboard events, so a game that listens for keys plays on a phone with no change: the arrow keys from the D-pad,
 * and the keys you choose from A, B and Start. Several fingers work at once. It never takes focus.
 *
 *   <blip-touch-pad for="game" data-a="z" data-b="x" data-start="Enter"></blip-touch-pad>
 *
 * Keys go to the element named by `for`, else to the focused element (so a focused menu's own keys work), bubbling
 * up to the document. Empty, it draws its own parts; write them yourself to name them in your language.
 */
import { BlipElement } from "@blip/core";

/** The legacy keyCode older games read, for the keys that are not one character. */
const CODES: Record<string, number> = { Enter: 13, Escape: 27, " ": 32, Tab: 9, Shift: 16, Control: 17, Backspace: 8, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40 };
const ARROWS: Record<string, string> = { up: "ArrowUp", right: "ArrowRight", down: "ArrowDown", left: "ArrowLeft" };

/** The KeyboardEvent code for a key: "z" is KeyZ, "5" is Digit5, " " is Space; named keys are their own code. */
const codeOf = (key: string) => (key === " " ? "Space" : /^[a-z]$/i.test(key) ? `Key${key.toUpperCase()}` : /^\d$/.test(key) ? `Digit${key}` : key);

interface Held {
  /** The arm or button held (none while a thumb rests on the D-pad's middle), the D-pad if it is one, and where the
      keydown went. */
  el: HTMLElement | null;
  pad: HTMLElement | null;
  target: EventTarget;
}

/**
 * A D-pad and A and B buttons (and Start) for touch screens, sending real keydown and keyup events to a target.
 * Shown only on a coarse pointer unless data-show="always".
 *
 * @summary An on-screen D-pad and buttons that send key events.
 * @attr {string} for - The id of the element to send keys to. Default: the focused element.
 * @attr {string} [data-a="z"] - The key A sends.
 * @attr {string} [data-b="x"] - The key B sends.
 * @attr {string} data-start - Shows Start, sending this key ("Enter" when empty).
 * @attr {"always"} data-show - Shows the pad on every pointer, not only on touch screens.
 * @attr {"inline"} data-position - In the page's flow instead of fixed to the bottom of the screen.
 * @attr {boolean} haptics - A short buzz on each press, where the device can (navigator.vibrate). "false" is off.
 */
export class BlipTouchPad extends BlipElement {
  static classes = ["blip-touch-pad"];

  /** What each pointer holds down. */
  #held = new Map<number, Held>();
  /** When a pointer last went down: a click without one is assistive technology pressing a button. */
  #down = -Infinity;

  protected connected(): void {
    this.setAttribute("role", "group");
    if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Game controls");
    if (!this.firstElementChild) this.#draw();
    this.on(this, "pointerdown", (e) => {
      const ctl = (e.target as Element).closest<HTMLElement>(".blip-touch-pad-dpad, .blip-touch-pad-button");
      if (!ctl || e.button) return;
      // Keep focus, the caret and the text where they are, and the browser's own gestures off.
      e.preventDefault();
      this.#down = e.timeStamp;
      ctl.setPointerCapture(e.pointerId);
      const pad = ctl.matches(".blip-touch-pad-dpad") ? ctl : null;
      this.#hold(e.pointerId, pad ? this.#arm(e, pad) : ctl, pad);
    });
    // A thumb rolled across the D-pad changes direction.
    this.on(this, "pointermove", (e) => {
      const held = this.#held.get(e.pointerId);
      if (!held?.pad) return;
      const arm = this.#arm(e, held.pad);
      if (arm === held.el) return;
      this.#release(e.pointerId);
      this.#hold(e.pointerId, arm, held.pad);
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) this.on(this, type, (e) => this.#release((e as PointerEvent).pointerId));
    this.on(this, "contextmenu", (e) => e.preventDefault());
    // A screen reader's double tap is a click with no pointer before it: a short press.
    this.on(this, "click", (e) => {
      const el = (e.target as Element).closest<HTMLElement>(".blip-touch-pad-arm, .blip-touch-pad-button");
      if (!el || e.timeStamp - this.#down < 1000) return;
      const id = -1 - this.#held.size;
      this.#hold(id, el, null);
      setTimeout(() => this.#release(id), 100);
    });
    // Nothing stays held when the page loses focus or goes away, or the element does.
    const all = () => [...this.#held.keys()].forEach((id) => this.#release(id));
    this.on(window, "blur", all);
    this.on(document, "visibilitychange", all);
    this.signal.addEventListener("abort", all);
  }

  /** The arm a point on the D-pad means: whichever way it is furthest from the middle; none on the middle itself. */
  #arm(e: PointerEvent, pad: HTMLElement): HTMLElement | null {
    const r = pad.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    if (Math.max(Math.abs(x), Math.abs(y)) < r.width / 6) return null;
    const dir = Math.abs(x) > Math.abs(y) ? (x > 0 ? "right" : "left") : y > 0 ? "down" : "up";
    return pad.querySelector(`[data-dir="${dir}"]`);
  }

  /** The key a control sends. */
  #key(el: HTMLElement): string {
    const { dir, button } = el.dataset;
    return dir ? ARROWS[dir]! : button === "start" ? this.dataset.start || "Enter" : this.dataset[button!] || (button === "a" ? "z" : "x");
  }

  #hold(id: number, el: HTMLElement | null, pad: HTMLElement | null): void {
    const to = this.getAttribute("for");
    const target = (to && document.getElementById(to)) || document.activeElement || document;
    // A second finger on a control already held sends nothing more, as a held key doesn't.
    const again = [...this.#held.values()].some((h) => h.el === el);
    this.#held.set(id, { el, pad, target });
    if (!el || again) return;
    el.toggleAttribute("data-blip-pressed", true);
    this.#send("keydown", el, target);
    if (this.flag("haptics")) navigator.vibrate?.(10);
  }

  #release(id: number): void {
    const held = this.#held.get(id);
    this.#held.delete(id);
    const el = held?.el;
    if (!el || [...this.#held.values()].some((h) => h.el === el)) return;
    el.removeAttribute("data-blip-pressed");
    this.#send("keyup", el, held.target);
  }

  /** A real KeyboardEvent, with keyCode and which for games that still read them. */
  #send(type: string, el: HTMLElement, target: EventTarget): void {
    const key = this.#key(el);
    const event = new KeyboardEvent(type, { key, code: codeOf(key), bubbles: true, cancelable: true, composed: true });
    const legacy = CODES[key] ?? key.toUpperCase().charCodeAt(0);
    Object.defineProperties(event, { keyCode: { value: legacy }, which: { value: legacy } });
    target.dispatchEvent(event);
  }

  /** The parts, when the markup has none: the D-pad (four arms round a hub), then Start, then B and A. */
  #draw(): void {
    const part = (cls: string, attrs: Record<string, string> = {}, text = "") => {
      const el = document.createElement("span");
      el.className = cls;
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
      el.append(text);
      return el;
    };
    const pad = part("blip-touch-pad-dpad");
    // Each arm holds an empty span for its arrow.
    for (const d in ARROWS) {
      const arm = part("blip-box blip-touch-pad-arm", { "data-dir": d, role: "button", "aria-label": d[0]!.toUpperCase() + d.slice(1) });
      arm.append(part(""));
      pad.append(arm);
    }
    pad.append(part("blip-box blip-touch-pad-hub", { "aria-hidden": "true" }));
    const buttons = part("blip-touch-pad-buttons");
    for (const b of "ba") buttons.append(part("blip-box blip-touch-pad-button", { "data-button": b, role: "button" }, b.toUpperCase()));
    this.append(pad);
    if (this.hasAttribute("data-start")) this.append(part("blip-box blip-touch-pad-button", { "data-button": "start", role: "button" }, "Start"));
    this.append(buttons);
    // Each says which key it stands for.
    for (const el of this.querySelectorAll<HTMLElement>("[role=button]")) el.setAttribute("aria-keyshortcuts", this.#key(el).replace(/^ $/, "Space"));
  }
}

BlipElement.define("blip-touch-pad", BlipTouchPad);

declare global {
  interface HTMLElementTagNameMap {
    "blip-touch-pad": BlipTouchPad;
  }
}
