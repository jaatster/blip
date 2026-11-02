/**
 * <blip-swipe-row>: a list row that swipes aside to show its actions. A horizontal swipe on a touch screen slides the
 * face a whole pixel at a time; let go past half the actions and the row holds open, swipe all the way and the
 * first action runs (after a cancelable blip-swipe). One row in a list is open at a time, and a press elsewhere
 * closes it. The page still scrolls: the row takes only horizontal swipes (touch-action: pan-y) and locks the axis
 * once a swipe has gone a few pixels.
 *
 *   <li>
 *     <blip-swipe-row class="blip-swipe-row">
 *       <div class="blip-swipe-row-face">
 *         <div class="blip-list-item">…</div>
 *         <button class="blip-box blip-button blip-swipe-row-more" type="button" data-variant="ghost" data-size="sm"
 *           data-icon-only aria-label="More actions"><svg class="blip-icon">…</svg></button>
 *       </div>
 *       <div class="blip-swipe-row-actions" data-side="start"><button class="blip-box blip-button">Archive</button></div>
 *       <div class="blip-swipe-row-actions" data-side="end"><button class="blip-box blip-button" data-tone="danger">Delete</button></div>
 *     </blip-swipe-row>
 *   </li>
 *
 * The actions are real buttons, always in the tab order: focusing one opens its side, and Escape closes the row.
 * The More button (shown where there is a fine pointer) opens and closes the row for a mouse or a keyboard.
 * Attribute: open (start or end). Methods: show(side), close(). Events: blip-open { side }, blip-close, blip-swipe.
 */
import { BlipElement, frames, pixel } from "@jaatster/blip-core";
import { both } from "./_dom.js";

export type SwipeSide = "start" | "end";

/** What a full swipe is about to run. */
export interface SwipeDetail {
  /** The side swiped open. */
  side: SwipeSide;
  /** Its first action, which is clicked unless the event is canceled. */
  action: HTMLButtonElement;
}

/**
 * A list row that swipes aside to show the actions behind it: swipe past half and it holds open, swipe all the way
 * and the first action runs. The actions are real buttons in the tab order, and a More button opens the row for a
 * mouse or a keyboard.
 *
 * @summary A list row that swipes aside to show its actions.
 * @attr {"start" | "end"} open - The side whose actions show; left out, the row is closed. Setting it opens that side
 * (closing any other open row in the list) or closes it. Reflects the row.
 * @fires {CustomEvent<{ side: SwipeSide }>} blip-open - The row opened on a side, however it happened.
 * @fires {CustomEvent<void>} blip-close - The row closed.
 * @fires {CustomEvent<SwipeDetail>} blip-swipe - A full swipe, before its first action runs. Cancelable:
 * preventDefault() runs nothing and leaves the row open.
 */
export class BlipSwipeRow extends BlipElement {
  static classes = ["blip-swipe-row"];
  static observedAttributes = ["open"];

  /** How far the face is off its place, in CSS px: positive shows the start tray, negative the end one. */
  #x = 0;
  #drag?: { id: number; x: number; y: number; from: number; axis?: "x" | "y" };
  #motion?: AbortController;
  /** When a swipe last ended, whether the row was open when last pressed, and whether a full swipe is clicking. */
  #swiped = -Infinity;
  #pressedOpen = false;
  #running = false;
  #live = false;

  get open(): SwipeSide | null {
    const v = this.getAttribute("open");
    return v === "start" || v === "end" ? v : null;
  }
  set open(side: SwipeSide | null) {
    if (side) this.setAttribute("open", side);
    else this.removeAttribute("open");
  }

  /** Opens a side: end (or start, when there is nothing at the end) by default. */
  show(side: SwipeSide = this.#buttons("end").length ? "end" : "start"): void {
    this.open = side;
  }
  close(): void {
    this.open = null;
  }

  get #face(): HTMLElement | null {
    return this.querySelector(":scope > .blip-swipe-row-face");
  }
  get #more(): HTMLButtonElement | null {
    return this.querySelector(".blip-swipe-row-more");
  }
  #group(side: SwipeSide): HTMLElement | null {
    return this.querySelector(`:scope > .blip-swipe-row-actions[data-side="${side}"]`);
  }
  #buttons(side: SwipeSide): HTMLButtonElement[] {
    return [...(this.#group(side)?.querySelectorAll<HTMLButtonElement>("button:not([disabled])") ?? [])];
  }
  /** +1 when the start is on the left. */
  get #dir(): number {
    return getComputedStyle(this).direction === "rtl" ? -1 : 1;
  }
  /** The side an offset shows. */
  #sideOf(x: number): SwipeSide {
    return x > 0 ? "start" : "end";
  }
  /** A side's offset when open: its actions' width, in whole pixels. */
  #reach(side: SwipeSide): number {
    const p = pixel(this);
    const w = this.#buttons(side).length ? Math.ceil((this.#group(side)?.offsetWidth ?? 0) / p) * p : 0;
    return side === "start" ? w : -w;
  }
  /** How far a swipe goes before it is a full one. */
  get #full(): number {
    return Math.max(this.offsetWidth * 0.6, 24 * pixel(this));
  }

  protected connected(): void {
    this.#x = 0;
    this.#render();
    this.#settle(true);
    // Fonts arriving, or a narrower screen, change the actions' width: keep an open row flush with them.
    const sizes = new ResizeObserver(() => this.#drag?.axis || this.#settle(true));
    for (const el of [this, this.#group("start"), this.#group("end")]) if (el) sizes.observe(el);
    this.signal.addEventListener("abort", () => (sizes.disconnect(), this.#motion?.abort()));

    this.on(this, "pointerdown", (e) => this.#down(e as PointerEvent));
    this.on(this, "pointermove", (e) => this.#move(e as PointerEvent));
    for (const t of ["pointerup", "pointercancel"]) this.on(this, t, (e) => this.#up(e as PointerEvent));
    // A press that ends a swipe is not a click; a press on the face of an open row closes it instead.
    this.on(this, "click", (e) => {
      if (this.#running) return;
      const t = e.target as Element;
      const swiped = performance.now() - this.#swiped < 500;
      const pressedOpen = this.#pressedOpen && (e as MouseEvent).detail > 0;
      this.#pressedOpen = false;
      if (swiped || (pressedOpen && !t.closest(".blip-swipe-row-more, .blip-swipe-row-actions"))) {
        e.preventDefault();
        e.stopPropagation();
        if (!swiped) this.close();
        return;
      }
      if (t.closest(".blip-swipe-row-more")) this.open ? this.close() : this.show();
      else if (t.closest(".blip-swipe-row-actions button")) queueMicrotask(() => this.close());
    }, { capture: true });
    this.on(document, "pointerdown", (e) => {
      if (this.open && !this.contains(e.target as Node)) this.close();
    }, { capture: true });
    // Keyboard and screen readers: an action that gets focus shows its side; the face's own content closes it.
    this.on(this, "focusin", (e) => {
      const t = e.target as Element;
      const g = t.closest(".blip-swipe-row-actions");
      const side = g?.getAttribute("data-side");
      if (side === "start" || side === "end") this.open = side;
      else if (!t.closest(".blip-swipe-row-more")) this.close();
    });
    this.on(this, "focusout", (e) => {
      if (!this.contains((e as FocusEvent).relatedTarget as Node)) this.close();
    });
    this.on(this, "keydown", (e) => {
      const k = e as KeyboardEvent;
      if (k.key !== "Escape" || !this.open || k.defaultPrevented) return;
      k.preventDefault();
      const inside = (document.activeElement as Element | null)?.closest(".blip-swipe-row-actions");
      this.close();
      const more = this.#more;
      if (inside) (more?.getClientRects().length ? more : this.#face?.querySelector<HTMLElement>("a[href], button, input, select, textarea, [tabindex]"))?.focus();
    });
    this.#live = true;
  }

  protected disconnected(): void {
    this.#live = false;
  }

  attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    if (name !== "open" || old === value || !this.#live) return;
    if (value) this.#closeOthers();
    this.#render();
    this.#settle();
    if (this.open) this.emit("open", { side: this.open });
    else if (old === "start" || old === "end") this.emit("close");
  }

  #closeOthers(): void {
    const list = this.closest("ul, ol, [role='list'], [role='grid']") ?? this.parentElement?.parentElement;
    for (const row of list?.querySelectorAll<BlipSwipeRow>("blip-swipe-row[open]") ?? []) if (row !== this) row.close();
  }

  #render(): void {
    this.#more?.setAttribute("aria-expanded", String(!!this.open));
  }

  /** Puts the face at x, in whole pixels, and marks which side shows, and whether as far as a full swipe. */
  #place(x: number): void {
    const p = pixel(this);
    this.#x = Math.round(x / p) * p;
    this.style.setProperty("--_blip-swipe-x", `${this.#x}px`);
    this.style.setProperty("--_blip-swipe-reveal", `${Math.abs(this.#x)}px`);
    if (this.#x) this.setAttribute("data-blip-moved", this.#sideOf(this.#x));
    else this.removeAttribute("data-blip-moved");
    const full = this.#drag?.axis === "x" && Math.abs(this.#x) >= this.#full && this.#buttons(this.#sideOf(this.#x)).length;
    if (full) this.setAttribute("data-blip-full", this.#sideOf(this.#x));
    else this.removeAttribute("data-blip-full");
  }

  /** Steps the face to where `open` says, in up to four whole-pixel frames (at once with reduced motion). */
  #settle(now = false): void {
    const to = this.open ? this.#reach(this.open) : 0;
    this.#motion?.abort();
    const from = this.#x;
    if (now || from === to) return this.#place(to);
    this.#motion = new AbortController();
    const n = Math.min(4, Math.max(1, Math.round(Math.abs(to - from) / pixel(this))));
    void frames(n, 40, (i) => this.#place(from + ((to - from) * (i + 1)) / n), { signal: both(this.signal, this.#motion.signal) });
  }

  #down(e: PointerEvent): void {
    this.#pressedOpen = !!this.open;
    if (e.pointerType === "mouse" || !e.isPrimary || this.#drag) return;
    this.#drag = { id: e.pointerId, x: e.clientX, y: e.clientY, from: this.#x };
  }

  #move(e: PointerEvent): void {
    const d = this.#drag;
    if (!d || e.pointerId !== d.id || d.axis === "y") return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.axis) {
      // Lock the axis once the finger has gone far enough to tell: across swipes the row, along scrolls the page.
      if (Math.hypot(dx, dy) < 4 * pixel(this)) return;
      d.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (d.axis === "y") return;
      this.#motion?.abort();
      this.#closeOthers();
      this.setAttribute("data-blip-dragging", "");
      try {
        this.setPointerCapture(e.pointerId);
      } catch {
        /* a synthetic pointer */
      }
    }
    // Along the text: a swipe to the right goes towards the end left to right, towards the start right to left.
    let x = d.from + dx * this.#dir;
    // Nothing to show on a side: the face stays put that way.
    if (!this.#buttons(this.#sideOf(x)).length) x = 0;
    this.#place(Math.max(-this.offsetWidth, Math.min(this.offsetWidth, x)));
  }

  #up(e: PointerEvent): void {
    const d = this.#drag;
    if (!d || e.pointerId !== d.id) return;
    this.#drag = undefined;
    if (d.axis !== "x") return;
    this.#swiped = performance.now();
    const full = this.getAttribute("data-blip-full") as SwipeSide | null;
    this.removeAttribute("data-blip-dragging");
    this.removeAttribute("data-blip-full");
    if (e.type === "pointercancel") return this.#settle();
    const side = this.#sideOf(this.#x);
    const past = this.#x !== 0 && Math.abs(this.#x) > Math.abs(this.#reach(side)) / 2;
    if (full) {
      const action = this.#buttons(full)[0]!;
      this.open = full;
      if (this.emit<SwipeDetail>("swipe", { side: full, action }, true)) {
        this.#running = true;
        try {
          action.click();
        } finally {
          this.#running = false;
        }
        this.close();
      }
      return;
    }
    if (past && this.open !== side) this.open = side;
    else if (!past && this.open) this.close();
    else this.#settle();
  }
}

BlipElement.define("blip-swipe-row", BlipSwipeRow);

declare global {
  interface HTMLElementTagNameMap {
    "blip-swipe-row": BlipSwipeRow;
  }
}
