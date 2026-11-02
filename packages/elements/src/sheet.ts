/**
 * <blip-sheet>: a bottom sheet. The drawer's modal behaviour (blip-before-close, the stepped exit, focus returned,
 * light dismiss) around a <dialog class="blip-box blip-drawer blip-sheet">, plus heights to snap to and dragging.
 *
 *   <blip-sheet light-dismiss>
 *     <dialog class="blip-box blip-drawer blip-sheet" id="route" data-snap="half full" aria-labelledby="route-title">
 *       <header class="blip-dialog-header">
 *         <button class="blip-box blip-sheet-handle" type="button" data-variant="ghost" aria-label="Resize"><span></span></button>
 *         <h2 class="blip-dialog-title" id="route-title">Route</h2>
 *       </header>
 *       <div class="blip-dialog-body">…</div>
 *     </dialog>
 *   </blip-sheet>
 *
 * data-snap on the dialog lists its heights, smallest first: content (its own height, the default), half, full, or a
 * percentage of the screen. It opens at the first. The handle steps through them (a click, Enter or Space; the arrow
 * keys go one up or down). A drag on the handle or the title bar, or down from the body while the body is scrolled to
 * its top, moves the sheet with the finger in whole pixels; let go, it settles at the nearest height in steps, or
 * closes (reason "drag") from below half its lowest height or after a flick down from there.
 */
import { duration, frames, pixel } from "@jaatster/blip-core";
import { Overlay } from "./_overlay.js";

export interface SheetChangeDetail {
  /** The height it now rests at, by its name in data-snap. */
  value: string;
}

/** Faster than this (CSS px per ms) is a flick: on to the next height, or closed. */
const FLICK = 0.5;
/** How far a press moves before it is a drag (CSS px). */
const SLOP = 8;
const NAMED: Record<string, string> = { half: "50%", full: "100%" };

interface Drag {
  id: number;
  x: number;
  y: number;
  /** The body, when the drag started there (it only pulls down, and only from the top). */
  body: Element | null;
  live?: boolean;
  /** Once live: its height when the drag began, the heights it snaps to, the pixel, the last move and the speed. */
  from?: number;
  hs?: number[];
  p?: number;
  t?: number;
  ly?: number;
  v?: number;
}

/**
 * A bottom sheet: the drawer's modal behaviour around one <dialog class="blip-box blip-drawer blip-sheet">, with snap
 * heights (data-snap on the dialog), a grab handle that steps through them, and dragging: from the handle, the title
 * bar, or the body scrolled to its top, following the finger in whole pixels, settling at the nearest height or
 * closing when dragged or flicked down past its lowest.
 *
 * @summary A draggable bottom sheet around one <dialog class="blip-box blip-drawer blip-sheet">.
 * @fires {CustomEvent<SheetChangeDetail>} blip-change - It settled at another height, by the handle, a drag or snap.
 */
export class BlipSheet extends Overlay {
  #at = 0;
  #drag: Drag | null = null;
  #moved = false;
  /** How far a drag has pulled it below the screen (CSS px). */
  #off = 0;
  #run?: AbortController;

  /** The heights the dialog's data-snap lists, smallest first; ["content"] when it lists none. */
  get snaps(): string[] {
    const list = this.dialog?.dataset.snap?.split(/\s+/).filter(Boolean) ?? [];
    return list.length ? list : ["content"];
  }
  /** The height it rests at, by its name in data-snap. Set while open, it moves there in steps; set while closed,
      it opens there (else it opens at the first). */
  get snap(): string {
    return this.snaps[this.#at]!;
  }
  set snap(value: string) {
    const i = this.snaps.indexOf(value);
    if (i < 0) return;
    if (this.open) void this.#go(i);
    else this.#at = i;
  }

  protected connected(): void {
    // Before the overlay's own wiring, which may open it at once.
    this.on(this, "blip-open", (e) => e.target === this && this.#set(Math.min(this.#at, this.snaps.length - 1)));
    this.on(this, "blip-close", (e) => {
      const d = this.dialog;
      if (e.target !== this || !d) return;
      this.#run?.abort();
      this.#at = this.#off = 0;
      this.#size(d, "");
      d.style.removeProperty("--_blip-sheet-drag");
      d.removeAttribute("data-blip-snap");
    });
    this.on(this, "pointerdown", (e) => {
      const d = this.dialog;
      const t = e.target as Element;
      if (!d?.open || e.button || this.#drag) return;
      const body = t.closest(".blip-dialog-body");
      const free = !t.closest("button, a, input, select, textarea");
      const top = !!t.closest(".blip-sheet-handle") || (free && !!t.closest(".blip-dialog-header"));
      // From the body, only a finger or a pen (a mouse selects text there), only off its controls, only at its top.
      if (!top && !(free && body && e.pointerType !== "mouse" && body.scrollTop <= 0)) return;
      this.#drag = { id: e.pointerId, x: e.clientX, y: e.clientY, body: top ? null : body };
    });
    this.on(this, "pointermove", (e) => {
      const g = this.#drag;
      const d = this.dialog;
      if (!g || !d || e.pointerId !== g.id) return;
      if (!g.live) {
        const dx = e.clientX - g.x;
        const dy = e.clientY - g.y;
        if (Math.hypot(dx, dy) < SLOP) return;
        if (Math.abs(dx) > Math.abs(dy) || (g.body && (dy < 0 || g.body.scrollTop > 0))) return void (this.#drag = null);
        this.#run?.abort();
        Object.assign(g, { live: true, y: e.clientY, ly: e.clientY, t: e.timeStamp, p: pixel(d), hs: this.snaps.map((s) => this.#measure(s)), from: this.#visual() });
        try {
          d.setPointerCapture(e.pointerId);
        } catch {
          /* a synthetic pointer */
        }
        d.setAttribute("data-blip-dragging", "");
        return;
      }
      g.v = (e.clientY - g.ly!) / Math.max(1, e.timeStamp - g.t!);
      g.ly = e.clientY;
      g.t = e.timeStamp;
      this.#place(g.from! - (e.clientY - g.y), g.hs!, g.p!);
    });
    const end = (e: PointerEvent) => {
      const g = this.#drag;
      if (!g || e.pointerId !== g.id) return;
      this.#drag = null;
      if (!g.live) return;
      this.dialog?.removeAttribute("data-blip-dragging");
      this.#moved = true;
      setTimeout(() => (this.#moved = false));
      const h = this.#visual();
      const { hs, p } = g as Required<Drag>;
      const v = e.timeStamp - g.t! > 100 ? 0 : g.v ?? 0;
      // The nearest height, where closed is 0; a flick goes on to the next one in its direction (they are listed
      // smallest first).
      let i = -1;
      let best = h;
      hs.forEach((x, k) => Math.abs(x - h) < best && ([best, i] = [Math.abs(x - h), k]));
      const above = hs.findIndex((x) => x > h + p);
      if (e.type === "pointercancel") i = this.#at;
      else if (v > FLICK) i = hs.findLastIndex((x) => x < h - p);
      else if (v < -FLICK && above >= 0) i = above;
      if (i < 0) void this.requestClose(undefined, "drag").then((closed) => void (closed || this.#go(this.#at)));
      else void this.#go(i);
    };
    this.on(this, "pointerup", end);
    this.on(this, "pointercancel", end);
    // A finger pulling down from the top of the body: keep the browser from scrolling (or bouncing) instead.
    this.on(this, "touchmove", (e) => {
      const g = this.#drag;
      if (g?.body && e.cancelable && (g.live || e.touches[0]!.clientY > g.y)) e.preventDefault();
    }, { passive: false });
    // The handle steps up through the heights, then back to the lowest; the click that ends a drag is not a press.
    this.on(this, "click", (e) => {
      const h = (e.target as Element).closest(".blip-sheet-handle");
      const n = this.snaps.length;
      if (this.#moved) {
        this.#moved = false;
        e.preventDefault();
        e.stopPropagation();
      } else if (h && n > 1) void this.#go((this.#at + 1) % n);
    }, { capture: true });
    super.connected();
  }

  /** Moves to a height in up to six whole-pixel steps, a frame apart (at once with reduced motion). */
  async #go(i: number): Promise<void> {
    const d = this.dialog;
    if (!d?.open) return;
    this.#run?.abort();
    const run = (this.#run = new AbortController());
    const p = pixel(d);
    const hs = this.snaps.map((s) => this.#measure(s));
    const from = this.#visual();
    const to = hs[i]!;
    const n = Math.min(6, Math.max(1, Math.round(Math.abs(to - from) / p)));
    await frames(n, duration("frame", 40, d), (k) => this.#place(from + ((to - from) * (k + 1)) / n, hs, p), { signal: run.signal });
    if (run.signal.aborted) return;
    const was = this.#at;
    this.#set(i);
    if (i !== was) this.emit<SheetChangeDetail>("change", { value: this.snap });
  }

  /** Rests at a height: its CSS length (responsive), data-blip-snap, and the handle's aria-expanded. */
  #set(i: number): void {
    const d = this.dialog;
    if (!d) return;
    const n = this.snaps.length;
    this.#at = i;
    this.#size(d, this.snap);
    this.#off = 0;
    d.style.removeProperty("--_blip-sheet-drag");
    d.setAttribute("data-blip-snap", this.snap);
    if (n > 1) for (const h of d.querySelectorAll(".blip-sheet-handle")) h.setAttribute("aria-expanded", String(i === n - 1));
  }

  #size(d: HTMLDialogElement, name: string): void {
    const len = NAMED[name] ?? (name.endsWith("%") ? name : "");
    d.style.blockSize = len && `round(down, ${len}, var(--blip-pixel))`;
  }

  /** How tall a height is here, in CSS px. */
  #measure(name: string): number {
    const d = this.dialog!;
    const keep = d.style.blockSize;
    this.#size(d, name);
    const h = d.getBoundingClientRect().height;
    d.style.blockSize = keep;
    return h;
  }

  /** How much of it shows: its height less what is pulled below the screen. */
  #visual(): number {
    const d = this.dialog!;
    return d.getBoundingClientRect().height - this.#off;
  }

  /** Shows h of it, in whole pixels, up to its tallest height; below its lowest, it slides down instead of shrinking. */
  #place(h: number, hs: number[], p: number): void {
    const d = this.dialog!;
    const low = Math.min(...hs);
    const v = Math.round(Math.max(0, Math.min(h, Math.max(...hs))) / p) * p;
    d.style.blockSize = `${Math.max(v, low)}px`;
    d.style.setProperty("--_blip-sheet-drag", `${(this.#off = Math.max(0, low - v))}px`);
  }
}

BlipSheet.define("blip-sheet", BlipSheet);

declare global {
  interface HTMLElementTagNameMap {
    "blip-sheet": BlipSheet;
  }
}
