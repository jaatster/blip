/**
 * <pp-tooltip>: a tooltip for any trigger, following the WAI-ARIA tooltip pattern and WCAG 1.4.13.
 *
 *   <button class="pp-box pp-button" id="save-btn">Save</button>
 *   <pp-tooltip for="save-btn">Saves to slot 2</pp-tooltip>
 *
 * It describes its trigger (aria-describedby, so a screen reader hears it whether or not it shows), shows after a
 * beat on hover (--pp-duration-beat) and at once on keyboard focus, stays while the pointer moves onto it (a glide,
 * --pp-duration-glide, to get there), and hides when hover and focus leave, on a press, or on Escape, which it
 * keeps from closing a dialog underneath. It sits in the top layer (popover="manual"), shown with its trigger as
 * source, so CSS anchor positioning places it where the browser anchors a popover to its source; elsewhere script
 * places it. It never writes the trigger's anchor-name. Either way it takes the other side when there is no room,
 * and its nub keeps pointing at the trigger's middle. One shows at a time; moving between triggers while one shows
 * skips the wait.
 *
 * Attributes: for (the trigger's id; default the element just before it), placement (top, bottom, left, right).
 * Methods: show(), hide().
 */
import { PixelElement, duration, pixel, reducedMotion, warn } from "@jaatster/blip-core";

type Side = "top" | "bottom" | "left" | "right";
const OTHER: Record<Side, Side> = { top: "bottom", bottom: "top", left: "right", right: "left" };
/** Whether CSS places it: anchor positioning exists, and (learned on the first show) a popover shown with a source
    is anchored to it. */
let anchored: boolean | undefined = typeof CSS !== "undefined" && CSS.supports("position-area", "top") ? undefined : false;
let current: PixelTooltip | null = null;
let count = 0;

export class PixelTooltip extends PixelElement {
  static box = true;
  static classes = ["pp-tooltip"];
  #trigger: HTMLElement | null = null;
  #n = ++count;
  #timer?: ReturnType<typeof setTimeout>;
  #watch?: AbortController;
  #frame = 0;

  /** The id of the element it describes. */
  get htmlFor(): string {
    return this.getAttribute("for") ?? "";
  }
  set htmlFor(id: string) {
    this.setAttribute("for", id);
  }
  /** The side it prefers. */
  get placement(): Side {
    const p = this.getAttribute("placement") as Side | null;
    return p && p in OTHER ? p : "top";
  }
  set placement(side: Side) {
    this.setAttribute("placement", side);
  }

  protected connected(): void {
    this.id ||= `pp-tooltip-${this.#n}`;
    this.setAttribute("role", "tooltip");
    this.popover = "manual";
    if (!this.querySelector(":scope > .pp-tooltip-nub")) {
      const nub = document.createElement("span");
      nub.className = "pp-tooltip-nub";
      nub.setAttribute("aria-hidden", "true");
      this.append(nub);
    }
    const t = (this.#trigger = (this.htmlFor ? document.getElementById(this.htmlFor) : this.previousElementSibling) as HTMLElement | null);
    if (!t) return warn("PP-E020", '<pp-tooltip> needs for="…" naming its trigger, or to come right after it.', this);
    const ids = (t.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean);
    if (!ids.includes(this.id)) t.setAttribute("aria-describedby", [...ids, this.id].join(" "));
    const later = (fn: () => void, ms: number) => {
      clearTimeout(this.#timer);
      this.#timer = setTimeout(fn, ms);
    };
    // Leaving with the pointer hides it, unless the trigger still has keyboard focus (it stays while focused).
    const leave = () => later(() => t.matches(":focus-visible, :has(:focus-visible)") || this.hide(), this.#ms("glide", 160));
    this.on(t, "pointerenter", (e) => {
      if ((e as PointerEvent).pointerType !== "touch") later(() => this.show(), current ? 0 : this.#ms("beat", 400));
    });
    this.on(t, "pointerleave", leave);
    this.on(this, "pointerenter", () => clearTimeout(this.#timer));
    this.on(this, "pointerleave", leave);
    this.on(t, "focusin", () => {
      if (t.matches(":focus-visible, :has(:focus-visible)")) this.show();
    });
    this.on(t, "focusout", () => this.hide());
    this.on(t, "pointerdown", () => this.hide());
    this.on(document, "keydown", (e) => {
      if ((e as KeyboardEvent).key === "Escape" && current === this) {
        e.preventDefault();
        this.hide();
      }
    }, { capture: true });
  }

  protected disconnected(): void {
    this.hide();
    const t = this.#trigger;
    if (!t) return;
    const ids = (t.getAttribute("aria-describedby") ?? "").split(/\s+/).filter((id) => id && id !== this.id);
    if (ids.length) t.setAttribute("aria-describedby", ids.join(" "));
    else t.removeAttribute("aria-describedby");
  }

  /** Shows it now. */
  show(): void {
    const t = this.#trigger;
    clearTimeout(this.#timer);
    if (!t?.isConnected || !this.isConnected) return;
    if (current && current !== this) current.hide();
    current = this;
    // The trigger as source makes it the popover's anchor, where browsers do that.
    if (!this.matches(":popover-open")) (this.showPopover as (o?: { source?: Element }) => void)({ source: t });
    this.#place();
    if (!this.#watch) {
      this.#watch = new AbortController();
      const again = () => {
        cancelAnimationFrame(this.#frame);
        this.#frame = requestAnimationFrame(() => this.#place());
      };
      const options = { capture: true, passive: true, signal: AbortSignal.any([this.#watch.signal, this.signal]) };
      addEventListener("scroll", again, options);
      addEventListener("resize", again, options);
    }
  }

  /** Hides it now. */
  hide(): void {
    clearTimeout(this.#timer);
    cancelAnimationFrame(this.#frame);
    this.#watch?.abort();
    this.#watch = undefined;
    if (current === this) current = null;
    if (this.matches(":popover-open")) this.hidePopover();
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
    const want = this.placement;
    const across = want === "top" || want === "bottom";
    const need = (across ? h : w) + 5 * p;
    const side = room[want] >= need || room[want] >= room[OTHER[want]] ? want : OTHER[want];
    this.dataset.side = side;
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
      this.style.setProperty("--_pp-nub-x", `${Math.min(Math.max(x, 3 * p), w - 10 * p)}px`);
    } else this.style.removeProperty("--_pp-nub-x");
  }
}

PixelTooltip.define("pp-tooltip", PixelTooltip);

declare global {
  interface HTMLElementTagNameMap {
    "pp-tooltip": PixelTooltip;
  }
}
