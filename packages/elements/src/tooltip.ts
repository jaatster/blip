/**
 * <blip-tooltip>: a tooltip for any trigger, following the WAI-ARIA tooltip pattern and WCAG 1.4.13.
 *
 *   <button class="blip-box blip-button" id="save-btn">Save</button>
 *   <blip-tooltip for="save-btn">Saves to slot 2</blip-tooltip>
 *
 * It describes its trigger (aria-describedby, so a screen reader hears it whether or not it shows), shows after a
 * beat on hover (--blip-duration-beat) and at once on keyboard focus, stays while the pointer moves onto it (a glide,
 * --blip-duration-glide, to get there), and closes when hover and focus leave, on a press, or on Escape, which it
 * keeps from closing a dialog underneath. It sits in the top layer (popover="manual"), shown with its trigger as
 * source, so CSS anchor positioning places it where the browser anchors a popover to its source; elsewhere script
 * places it. It never writes the trigger's anchor-name. Either way it takes the other side when there is no room
 * (above or below, when there is room on neither side of a trigger it would stand beside), and its nub keeps pointing at the trigger's middle. One shows at a time; moving between triggers while one shows
 * skips the wait. A trigger rendered after the tooltip, or replaced by a framework, is found again as it arrives.
 *
 * Attributes: for (the trigger's id; default the element just before it), data-side (top, bottom, left, right: the
 * side it prefers), open. Methods: show(), close(). Events: blip-open, blip-close.
 */
import { BlipElement, duration, pixel, reducedMotion, warn } from "@jaatster/blip-core";
import { both, isOn, unFalse } from "./_dom.js";

type Side = "top" | "bottom" | "left" | "right";
const OTHER: Record<Side, Side> = { top: "bottom", bottom: "top", left: "right", right: "left" };
/** Whether CSS places it: anchor positioning exists, and (learned on the first show) a popover shown with a source
    is anchored to it. */
let anchored: boolean | undefined = typeof CSS !== "undefined" && CSS.supports("position-area", "top") ? undefined : false;
let current: BlipTooltip | null = null;
let count = 0;

/**
 * A tooltip for any trigger, following the WAI-ARIA tooltip pattern and WCAG 1.4.13: it describes its trigger,
 * shows after a beat on hover and at once on keyboard focus, stays while the pointer moves onto it, and closes on
 * Escape. It sits in the top layer and takes the other side when there is no room.
 *
 * @summary A short description that shows on hover and focus.
 * @attr {string} for - The trigger's id; left out, the element just before the tooltip.
 * @attr {"top" | "bottom" | "left" | "right"} [data-side="top"] - The side it prefers. While it shows on the other
 * side for want of room, data-side says so; it goes back when it closes.
 * @attr {boolean} open - It is showing; setting it shows or closes it. Reflects the tooltip. "false" is off.
 * @fires {CustomEvent<void>} blip-open - It showed.
 * @fires {CustomEvent<void>} blip-close - It closed.
 */
export class BlipTooltip extends BlipElement {
  static box = true;
  static classes = ["blip-tooltip"];
  static observedAttributes = ["open", "for", "data-side"];
  /** Every connected tooltip, and one observer for them all that finds each trigger again when the page changes. */
  static #all = new Set<BlipTooltip>();
  static #page = typeof MutationObserver === "undefined" ? undefined : new MutationObserver(() => BlipTooltip.#all.forEach((t) => t.#resolve()));

  #trigger: HTMLElement | null = null;
  #wiring?: AbortController;
  #n = ++count;
  #timer?: ReturnType<typeof setTimeout>;
  #watch?: AbortController;
  #frame = 0;
  #quiet = false;
  /** The side the page asked for (none is top). While it shows elsewhere, data-side says where. */
  #side: string | null = null;

  /** The id of the element it describes. */
  get htmlFor(): string {
    return this.getAttribute("for") ?? "";
  }
  set htmlFor(id: string) {
    this.setAttribute("for", id);
  }
  /** True while it shows; setting it shows or closes it. */
  get open(): boolean {
    return this.matches(":popover-open");
  }
  set open(value: boolean) {
    if (value) this.show();
    else this.close();
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    if ((name === "open" && unFalse(this, name, value)) || this.#quiet) return;
    if (name === "data-side") this.#side = value;
    if (!this.isConnected) return;
    if (name === "for") this.#resolve();
    else if (name === "open") isOn(this, "open") ? this.show() : this.close();
    else if (this.open) this.#place();
  }

  protected connected(): void {
    this.id ||= `blip-tooltip-${this.#n}`;
    this.setAttribute("role", "tooltip");
    this.popover = "manual";
    if (!this.querySelector(":scope > .blip-tooltip-nub")) {
      const nub = document.createElement("span");
      nub.className = "blip-tooltip-nub";
      nub.setAttribute("aria-hidden", "true");
      this.append(nub);
    }
    this.#trigger = null;
    this.#resolve();
    // A trigger may still be on its way (rendered after the tooltip): say so only if it has not come a moment later.
    if (!this.#trigger) setTimeout(() => this.isConnected && !this.#trigger && warn("BLIP-E020", '<blip-tooltip> needs for="…" naming its trigger, or to come right after it.', this));
    const all = BlipTooltip.#all;
    all.add(this);
    if (all.size === 1) BlipTooltip.#page?.observe(document.documentElement, { childList: true, subtree: true });
    // Leaving the chip with the pointer closes it too, unless the trigger has keyboard focus.
    this.on(this, "pointerenter", () => clearTimeout(this.#timer));
    this.on(this, "pointerleave", () => this.#leave());
    this.on(document, "keydown", (e) => {
      if ((e as KeyboardEvent).key === "Escape" && current === this) {
        e.preventDefault();
        this.close();
      }
    }, { capture: true });
    if (isOn(this, "open")) this.show();
  }

  protected disconnected(): void {
    this.close();
    this.#unwire();
    const all = BlipTooltip.#all;
    all.delete(this);
    if (!all.size) BlipTooltip.#page?.disconnect();
  }

  /** Finds the trigger (by for, or the element just before it); a new one is described and listened to. */
  #resolve(): void {
    const t = (this.htmlFor ? document.getElementById(this.htmlFor) : this.previousElementSibling) as HTMLElement | null;
    if (t === this.#trigger) return;
    this.#unwire();
    this.#trigger = t;
    if (!t) return;
    const ids = (t.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean);
    if (!ids.includes(this.id)) t.setAttribute("aria-describedby", [...ids, this.id].join(" "));
    const signal = both(this.signal, (this.#wiring = new AbortController()).signal);
    const later = (fn: () => void, ms: number) => {
      clearTimeout(this.#timer);
      this.#timer = setTimeout(fn, ms);
    };
    t.addEventListener("pointerenter", (e) => {
      if ((e as PointerEvent).pointerType !== "touch") later(() => this.show(), current ? 0 : this.#ms("beat", 400));
    }, { signal });
    t.addEventListener("pointerleave", () => this.#leave(), { signal });
    t.addEventListener("focusin", () => {
      if (t.matches(":focus-visible, :has(:focus-visible)")) this.show();
    }, { signal });
    t.addEventListener("focusout", () => this.close(), { signal });
    t.addEventListener("pointerdown", () => this.close(), { signal });
  }

  /** Lets go of the trigger: its listeners, and this tooltip's id in its description. */
  #unwire(): void {
    this.#wiring?.abort();
    this.#wiring = undefined;
    const t = this.#trigger;
    this.#trigger = null;
    if (!t) return;
    if (current === this) this.close();
    const ids = (t.getAttribute("aria-describedby") ?? "").split(/\s+/).filter((id) => id && id !== this.id);
    if (ids.length) t.setAttribute("aria-describedby", ids.join(" "));
    else t.removeAttribute("aria-describedby");
  }

  /** Leaving with the pointer closes it after a glide (time to reach the chip), unless the trigger has keyboard focus. */
  #leave(): void {
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => this.#trigger?.matches(":focus-visible, :has(:focus-visible)") || this.close(), this.#ms("glide", 160));
  }

  /** Shows it now. */
  show(): void {
    const t = this.#trigger;
    clearTimeout(this.#timer);
    if (!t?.isConnected || !this.isConnected) return;
    if (current && current !== this) current.close();
    current = this;
    const opening = !this.open;
    // The trigger as source makes it the popover's anchor, where browsers do that.
    if (opening) (this.showPopover as (o?: { source?: Element }) => void)({ source: t });
    this.#place();
    if (!this.#watch) {
      this.#watch = new AbortController();
      const again = () => {
        cancelAnimationFrame(this.#frame);
        this.#frame = requestAnimationFrame(() => this.#place());
      };
      const options = { capture: true, passive: true, signal: both(this.#watch.signal, this.signal) };
      addEventListener("scroll", again, options);
      addEventListener("resize", again, options);
    }
    if (!opening) return;
    this.#reflect(() => this.setAttribute("open", ""));
    this.emit("open");
  }

  /** Closes it now. */
  close(): void {
    clearTimeout(this.#timer);
    cancelAnimationFrame(this.#frame);
    this.#watch?.abort();
    this.#watch = undefined;
    if (current === this) current = null;
    if (!this.open) return;
    this.hidePopover();
    // Back to the side the page asked for.
    this.#reflect(() => {
      this.removeAttribute("open");
      if (this.#side === null) this.removeAttribute("data-side");
      else this.setAttribute("data-side", this.#side);
    });
    this.emit("close");
  }

  /** Changes its own attributes without taking them for the page's. */
  #reflect(change: () => void): void {
    this.#quiet = true;
    change();
    this.#quiet = false;
  }

  /** A delay from a duration token, kept with reduced motion (a wait is not motion). */
  #ms(token: string, fallback: number): number {
    return reducedMotion() ? fallback : duration(token, fallback, this);
  }

  /** Picks the side with room, places the chip (unless CSS does), and points the nub at the trigger's middle. */
  #place(): void {
    const t = this.#trigger;
    if (!t || !this.isConnected) return;
    const p = pixel(this);
    const a = t.getBoundingClientRect();
    const { offsetWidth: w, offsetHeight: h } = this;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const room: Record<Side, number> = { top: a.top, bottom: vh - a.bottom, left: a.left, right: vw - a.right };
    const want = (this.#side && this.#side in OTHER ? this.#side : "top") as Side;
    const need = (want === "top" || want === "bottom" ? h : w) + 5 * p;
    let side = room[want] >= need || room[want] >= room[OTHER[want]] ? want : OTHER[want];
    // Beside the trigger with room on neither side (a phone): above it, or below when there is more room there.
    if (room[side] < need && (side === "left" || side === "right")) side = room.top >= h + 5 * p || room.top >= room.bottom ? "top" : "bottom";
    const across = side === "top" || side === "bottom";
    this.#reflect(() => (this.dataset.side = side));
    const edge = 2 * p;
    const clamp = (v: number, max: number) => Math.round(Math.min(Math.max(v, edge), Math.max(edge, max - edge)));
    let left = across ? clamp(a.left + a.width / 2 - w / 2, vw - w) : side === "left" ? a.left - 5 * p - w : a.right + 5 * p;
    if (anchored !== false) {
      // Did CSS put it beside the trigger? If not, this browser does not anchor to a source: use script from now on.
      const r = this.getBoundingClientRect();
      const gap = side === "top" ? a.top - r.bottom : side === "bottom" ? r.top - a.bottom : side === "left" ? a.left - r.right : r.left - a.right;
      anchored = Math.abs(gap - 5 * p) <= p;
      if (anchored) left = r.left;
    }
    if (!anchored) {
      const top = across ? (side === "top" ? a.top - 5 * p - h : a.bottom + 5 * p) : clamp(a.top + a.height / 2 - h / 2, vh - h);
      this.style.setProperty("position-area", "none");
      this.style.left = `${Math.round(left)}px`;
      this.style.top = `${Math.round(top)}px`;
    }
    // The nub, on whole pixels, kept clear of the corners.
    if (across) {
      const x = Math.round((a.left + a.width / 2 - left) / p - 3.5) * p;
      this.style.setProperty("--_blip-nub-x", `${Math.min(Math.max(x, 3 * p), w - 10 * p)}px`);
    } else this.style.removeProperty("--_blip-nub-x");
  }
}

BlipTooltip.define("blip-tooltip", BlipTooltip);

declare global {
  interface HTMLElementTagNameMap {
    "blip-tooltip": BlipTooltip;
  }
}
