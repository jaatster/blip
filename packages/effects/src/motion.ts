/**
 * The page's own motion setting, beside the device's: data-chu-motion="reduce" on <html> asks for less motion, and
 * reducedMotion() from @jaatster/blip-core reads it with prefers-reduced-motion. <chu-motion-toggle> is a page-wide pause
 * for it, ready-made: a real <button> with aria-pressed that sets and clears the attribute, so everything that moves
 * on its own stops at once and carries on when it is pressed again, and that remembers the choice on this device
 * (localStorage, "blip:motion"). This module applies a remembered choice as it loads.
 *
 *   <chu-motion-toggle></chu-motion-toggle>                              a soft button: a pause icon, "Pause motion"
 *   <chu-motion-toggle label="Bewegung anhalten"></chu-motion-toggle>    its words
 *   <chu-motion-toggle><button class="chu-box chu-button" type="button">…</button></chu-motion-toggle>    your own
 */
import { BlipElement } from "@jaatster/blip-core";
import { mirror } from "./_pixel.js";

const KEY = "blip:motion", root = document.documentElement;
/** The page's own setting: the toggle shows and changes this one, never the device's. */
const reduced = () => root.dataset.chuMotion === "reduce";

/** Sets or clears data-chu-motion="reduce" on <html>, and remembers the choice. */
function choose(reduce: boolean): void {
  if (reduce) root.dataset.chuMotion = "reduce";
  else delete root.dataset.chuMotion;
  try {
    if (reduce) localStorage.setItem(KEY, "reduce");
    else localStorage.removeItem(KEY);
  } catch {
    /* storage off: nothing to remember */
  }
}

// A choice remembered from an earlier visit, as soon as this module loads: before the elements loaded after it
// connect. A script in the page's <head> can apply it before the first paint (docs/motion-toggle.md).
try {
  if (localStorage.getItem(KEY) === "reduce") root.dataset.chuMotion = "reduce";
} catch {
  /* storage off: nothing remembered */
}

/**
 * <chu-motion-toggle>: a page-wide pause for motion. It wraps a real button (its own, or the one it makes: a soft
 * button with a pause icon and its label) whose aria-pressed says whether data-chu-motion="reduce" is on <html>.
 * Pressing it sets or clears the attribute and remembers the choice on this device; every toggle on the page follows
 * the attribute, whoever sets it. Show it on every page whose world drifts, flares or has events.
 *
 * @summary A page-wide pause for motion: a button that sets data-chu-motion="reduce" on <html>, and remembers it.
 * @attr {string} [label="Pause motion"] - The label of the button it makes when it holds no button of its own.
 */
export class BlipMotionToggle extends BlipElement {
  static observedAttributes = ["label"];
  /** The label attribute, or null. */
  declare label: string | null;
  /** The label of the button it made. */
  #text?: Text;

  attributeChangedCallback(): void {
    if (this.#text) this.#text.data = this.getAttribute("label") ?? "Pause motion";
  }

  protected override connected(): void {
    if (!this.querySelector("button")) {
      const b = this.appendChild(document.createElement("button"));
      b.type = "button";
      b.className = "chu-box chu-button";
      b.dataset.variant = "soft";
      b.innerHTML = '<svg class="chu-icon" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2h3v8H2zm5 0h3v8H7z"/></svg>';
      b.append((this.#text = new Text()));
      this.attributeChangedCallback();
    }
    // Every button inside, one a framework renders later included, shows whether motion is paused and toggles it.
    const sync = () => this.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(reduced())));
    sync();
    this.on(this, "click", (e) => (e.target as Element).closest("button") && choose(!reduced()));
    const watch = new MutationObserver(sync);
    watch.observe(root, { attributeFilter: ["data-chu-motion"] });
    watch.observe(this, { childList: true, subtree: true });
    this.signal.addEventListener("abort", () => watch.disconnect(), { once: true });
  }
}

mirror(BlipMotionToggle, [], ["label"]);
BlipElement.define("chu-motion-toggle", BlipMotionToggle);

declare global {
  interface HTMLElementTagNameMap {
    "chu-motion-toggle": BlipMotionToggle;
  }
}
