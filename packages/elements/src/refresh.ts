/**
 * <blip-refresh>: pull to refresh, round a scroll container. On a touch screen, pull down from the top: the content
 * follows a whole pixel at a time and a pixel arrow steps down with it, flipping once you are past the line. Let go
 * there and the loader spins while the page refreshes (blip-refresh, whose listeners hand it a promise to wait on),
 * then everything steps back. "Refreshing" and "Updated" are announced politely. A mouse never pulls: give the page
 * a Refresh button that calls refresh(), which does the same.
 *
 *   <blip-refresh class="blip-refresh">
 *     <div class="blip-refresh-scroller" tabindex="0" aria-label="Scores">…</div>
 *   </blip-refresh>
 *
 *   refresher.addEventListener("blip-refresh", (e) => e.detail.waitUntil(loadScores()));
 *   refreshButton.addEventListener("click", () => refresher.refresh());
 *
 * It adds the arrow, the loader and a live region itself. Attributes: pull-label, release-label, refreshing-label,
 * done-label. Properties: refreshing, scroller. Method: refresh(). Event: blip-refresh (cancelable).
 */
import { BlipElement, frames, pixel } from "@blip/core";
import { both } from "./_dom.js";

/** How far, in pixels, the content goes: the line to pass, the most it follows, where it holds while refreshing. */
const LINE = 28;
const MOST = 40;
const HOLD = 24;

/** blip-refresh's detail. */
export interface RefreshDetail {
  /**
   * Keeps the loader up until the promise settles; call it while the event is dispatched (as a service worker's
   * waitUntil()). Call it more than once to wait for several.
   */
  waitUntil(promise: PromiseLike<unknown>): void;
}

/**
 * Pull to refresh, round a scroll container: pull down from its top past the line and let go, and the loader shows
 * until the blip-refresh listeners' promises settle. Announced politely. Touch only: pair it with a Refresh button
 * that calls refresh().
 *
 * @summary Pull down from the top of a scroller to refresh it.
 * @attr {string} [pull-label="Pull to refresh"] - Shown by the arrow while pulling.
 * @attr {string} [release-label="Release to refresh"] - Shown once the pull is past the line.
 * @attr {string} [refreshing-label="Refreshing"] - Shown by the loader, and announced.
 * @attr {string} [done-label="Updated"] - Announced when every promise has resolved.
 * @fires {CustomEvent<RefreshDetail>} blip-refresh - A refresh starts: hand detail.waitUntil() the work to wait for.
 * Cancelable: preventDefault() refreshes nothing and steps back.
 */
export class BlipRefresh extends BlipElement {
  static classes = ["blip-refresh"];

  #pull = 0;
  /** While refreshing, then stepping back. */
  #phase: "refreshing" | "done" | null = null;
  #busy: Promise<void> | null = null;
  #touch?: { id: number; x: number; y: number; on?: boolean };
  #motion?: AbortController;

  /** True from the start of a refresh until it has stepped back. */
  get refreshing(): boolean {
    return !!this.#busy;
  }
  /** The scroll container: the .blip-refresh-scroller, else the first other element inside. */
  get scroller(): HTMLElement | null {
    return this.querySelector(":scope > .blip-refresh-scroller") ?? this.querySelector(":scope > :not(.blip-refresh-indicator, .blip-refresh-status)");
  }

  /** Refreshes as a pull does: steps the content down, shows the loader, sends blip-refresh, waits, steps back. */
  refresh(): Promise<void> {
    return (this.#busy ??= this.#run().finally(() => {
      this.#busy = null;
    }));
  }

  #label(name: string, fallback: string): string {
    return this.getAttribute(`${name}-label`) ?? fallback;
  }
  #part(cls: string): HTMLElement | null {
    return this.querySelector(`:scope > .${cls}`);
  }

  protected connected(): void {
    if (!this.#part("blip-refresh-indicator")) {
      const i = document.createElement("div");
      i.className = "blip-refresh-indicator";
      i.setAttribute("aria-hidden", "true");
      i.innerHTML = '<span class="blip-refresh-arrow"></span><span class="blip-loader"></span><span class="blip-refresh-label"></span>';
      this.prepend(i);
    }
    if (!this.#part("blip-refresh-status")) {
      const s = document.createElement("span");
      s.className = "blip-refresh-status blip-sr-only";
      s.setAttribute("role", "status");
      this.append(s);
    }
    this.#show();
    this.signal.addEventListener("abort", () => this.#motion?.abort());
    const at = (e: TouchEvent) => [...e.changedTouches].find((t) => t.identifier === this.#touch?.id);
    this.on(this, "touchstart", (e) => {
      const t = (e as TouchEvent).touches;
      const s = this.scroller;
      // One finger, at the very top of the scroller; a second finger lets go of a pull.
      if (this.#touch?.on && !this.#busy) void this.#to(0);
      if (this.#busy || t.length !== 1 || !s || s.scrollTop > 0) return void (this.#touch = undefined);
      this.#touch = { id: t[0]!.identifier, x: t[0]!.clientX, y: t[0]!.clientY };
    }, { passive: true });
    this.on(this, "touchmove", (e) => {
      const ev = e as TouchEvent;
      const g = this.#touch;
      const t = at(ev);
      if (!g || !t) return;
      const dy = t.clientY - g.y;
      if (g.on === undefined) {
        // Decide on the first move, while the browser still lets us keep it: down and more down than across is a pull.
        g.on = dy > 0 && dy >= Math.abs(t.clientX - g.x) && ev.cancelable && (this.scroller?.scrollTop ?? 1) <= 0;
        if (g.on) this.#motion?.abort();
      }
      if (!g.on) return;
      ev.preventDefault();
      const p = pixel(this);
      this.#set(Math.min(MOST * p, Math.max(0, dy / 2)));
    }, { passive: false });
    for (const type of ["touchend", "touchcancel"]) {
      this.on(this, type, (e) => {
        const g = this.#touch;
        if (!g || !at(e as TouchEvent)) return;
        this.#touch = undefined;
        if (!g.on) return;
        if (e.type === "touchend" && this.#pull >= LINE * pixel(this)) void this.refresh();
        else void this.#to(0);
      });
    }
  }

  async #run(): Promise<void> {
    const waits: PromiseLike<unknown>[] = [];
    let open = true;
    const go = this.emit<RefreshDetail>("refresh", {
      waitUntil: (p) => {
        if (!open) throw new DOMException("Call waitUntil() while blip-refresh is dispatched.", "InvalidStateError");
        waits.push(p);
      },
    }, true);
    open = false;
    if (!go) return this.#to(0);
    // Busy is the content's: a live region inside something busy would keep quiet.
    const s = this.scroller;
    s?.setAttribute("aria-busy", "true");
    this.#phase = "refreshing";
    this.#say(this.#label("refreshing", "Refreshing"));
    // A beat at least, so the loader is seen even when there is nothing to wait for.
    const [done] = await Promise.all([Promise.allSettled(waits), this.#to(HOLD * pixel(this)), new Promise((r) => setTimeout(r, 400))]);
    s?.removeAttribute("aria-busy");
    const ok = done.every((r) => r.status === "fulfilled");
    this.#phase = "done";
    this.#say(ok ? this.#label("done", "Updated") : "");
    await this.#to(0);
    this.#phase = null;
    this.#set(0);
  }

  #say(text: string): void {
    const s = this.#part("blip-refresh-status");
    if (s) s.textContent = text;
  }

  /** Puts the content `px` down, in whole pixels, and says how far along the pull is. */
  #set(px: number): void {
    const p = pixel(this);
    this.#pull = Math.round(px / p) * p;
    if (this.#pull) this.style.setProperty("--_blip-pull", `${this.#pull}px`);
    else this.style.removeProperty("--_blip-pull");
    const state = this.#phase ?? (!this.#pull ? null : this.#pull >= LINE * p ? "ready" : "pulling");
    if (state) this.setAttribute("data-blip-pull", state);
    else this.removeAttribute("data-blip-pull");
    this.#show();
  }

  /** The words by the arrow or the loader. */
  #show(): void {
    const label = this.#part("blip-refresh-indicator")?.querySelector(".blip-refresh-label");
    const state = this.getAttribute("data-blip-pull") ?? this.getAttribute("data-blip-state") ?? "";
    const [name, text] = /refreshing/.test(state) ? ["refreshing", "Refreshing"] : /done/.test(state) ? ["done", "Updated"] : /ready/.test(state) ? ["release", "Release to refresh"] : ["pull", "Pull to refresh"];
    if (label) label.textContent = this.#label(name!, text!);
  }

  /** Steps the content to `px` in up to four whole-pixel frames (at once with reduced motion). */
  #to(px: number): Promise<void> {
    this.#motion?.abort();
    const from = this.#pull;
    if (from === px) return Promise.resolve(this.#set(px));
    this.#motion = new AbortController();
    const n = Math.min(4, Math.max(1, Math.round(Math.abs(px - from) / pixel(this))));
    return frames(n, 40, (i) => this.#set(from + ((px - from) * (i + 1)) / n), { signal: both(this.signal, this.#motion.signal) });
  }
}

BlipElement.define("blip-refresh", BlipRefresh);

declare global {
  interface HTMLElementTagNameMap {
    "blip-refresh": BlipRefresh;
  }
}
