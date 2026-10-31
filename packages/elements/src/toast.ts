/**
 * <pp-toaster> and toast(): short messages that come up in a corner and leave on their own.
 *
 *   import { toast } from "@jaatster/blip-elements/toast";
 *   const t = toast({ title: "Achievement unlocked", body: "First Flight", tone: "success", action: { label: "View", onClick: openTrophies } });
 *   t.close();
 *
 * toast() uses the first <pp-toaster> in the page, or adds one to the end of <body>. The toaster is a labelled
 * region ("Notifications") holding two live regions made when it connects, so every toast is announced: politely,
 * or assertively for danger. Toasts stack (newest nearest the edge), at most `max` at a time (the rest wait their
 * turn), and every countdown stops while the pointer is over the toaster, keyboard focus is in it, the page is
 * hidden, or a modal dialog is open. A modal makes the page (toasts too) inert, so while one is open toasts are
 * announced from live regions put inside it, and wait behind its scrim until it closes. Escape closes the focused
 * toast. Danger toasts stay until dismissed. Never put the only copy of something important in a toast: it leaves.
 *
 * Attributes: data-placement (bottom-end, bottom-center, top-end, top-center), max (default 3), dismiss-label
 * (default "Dismiss"), aria-label (default "Notifications").
 */
import { PixelElement, services } from "@jaatster/blip-core";

export type ToastTone = "info" | "success" | "warning" | "danger";
export interface ToastOptions {
  /** The first line, in bold. */
  title: string;
  /** A sentence or two under it. */
  body?: string;
  /** Without a tone, a toast is a plain raised panel. */
  tone?: ToastTone;
  /** "candy" is louder than the default soft fill. */
  variant?: "soft" | "candy";
  /** One button. The toast closes after its onClick runs. */
  action?: { label: string; onClick?: () => void };
  /** How long it stays, in ms; 0 keeps it until dismissed. Default: 5 s, longer for long text; 0 for danger. */
  duration?: number;
  /** How it is announced. Default: "assertive" for danger, "polite" otherwise. */
  live?: "polite" | "assertive";
}
export interface ToastHandle {
  /** The toast's element. */
  readonly el: HTMLElement;
  /** Closes it now. */
  close(): void;
  /** Settles once it has gone. */
  readonly closed: Promise<void>;
}

interface Item {
  el: HTMLElement;
  opts: ToastOptions;
  /** ms still to wait; 0 means it stays. */
  left: number;
  start: number;
  timer?: ReturnType<typeof setTimeout>;
  shown: boolean;
  done: () => void;
}

const make = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text = ""): HTMLElementTagNameMap[K] => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text) el.textContent = text;
  return el;
};
interface Live {
  polite: HTMLElement;
  assertive: HTMLElement;
}
/** A polite and an assertive live region, hidden, at the end of `host`. Each line is announced on its own. */
const regions = (host: Element): Live => {
  const region = (role: string) => {
    const r = make("div", "pp-sr-only");
    r.setAttribute("role", role);
    r.setAttribute("aria-atomic", "false");
    host.append(r);
    return r;
  };
  return { polite: region("status"), assertive: region("alert") };
};
const button = (cls: string, variant: string, text = ""): HTMLButtonElement => {
  const b = make("button", `pp-box pp-button ${cls}`, text);
  b.type = "button";
  b.dataset.size = "sm";
  b.dataset.variant = variant;
  return b;
};

/**
 * The corner where toasts come up: a labelled region with live regions, so every toast is announced. Show toasts
 * with toast() or add(); they stack, wait their turn past max, and pause while hovered, focused or behind a modal.
 *
 * @summary The region that shows toasts.
 * @attr {"bottom-end" | "bottom-center" | "top-end" | "top-center"} [data-placement="bottom-end"] - Where the
 * toasts come up.
 * @attr {number} [max=3] - How many toasts show at once; the rest wait their turn.
 * @attr {string} [dismiss-label="Dismiss"] - Each toast's close button's accessible name.
 * @attr {string} [aria-label="Notifications"] - The region's name.
 * @cssprop --pp-toast-duration - A toast's countdown (set by the element on each toast).
 */
export class PixelToaster extends PixelElement {
  static classes = ["pp-toaster"];
  #items: Item[] = [];
  #live?: Live;
  /** Live regions put inside an open modal dialog, which makes everything else inert. */
  #inside = new Map<Element, Live>();
  /** Open modal dialogs, in the order they opened: the last is on top. */
  #modals: Element[] = [];
  #modal: Element | undefined;
  #hover = false;
  #focus = false;
  #paused = false;
  #back: HTMLElement | null = null;

  /** How many toasts show at once. */
  get max(): number {
    return Math.max(1, Number(this.getAttribute("max")) || 3);
  }
  set max(value: number) {
    this.setAttribute("max", String(value));
  }

  protected connected(): void {
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
    if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Notifications");
    this.#live ??= regions(this);
    this.on(this, "pointerenter", () => this.#sync((this.#hover = true)));
    this.on(this, "pointerleave", () => this.#sync((this.#hover = false)));
    // Keyboard focus pauses (pointer users have hover); a click that focuses a button does not.
    this.on(this, "focusin", (e) => {
      const from = (e as FocusEvent).relatedTarget as HTMLElement | null;
      if (from && !this.contains(from)) this.#back = from;
      this.#sync((this.#focus = (e.target as Element).matches(":focus-visible")));
    });
    this.on(this, "focusout", (e) => {
      if (!this.contains((e as FocusEvent).relatedTarget as Node | null)) this.#sync((this.#focus = false));
    });
    this.on(document, "visibilitychange", () => this.#sync());
    // Modal dialogs opening and closing anywhere in the page.
    const modals = new MutationObserver(() => this.#watchModals());
    modals.observe(document.documentElement, { subtree: true, childList: true, attributeFilter: ["open"] });
    this.signal.addEventListener("abort", () => modals.disconnect(), { once: true });
    this.#watchModals();
    this.on(this, "keydown", (e) => {
      const item = this.#items.find((i) => i.el.contains(e.target as Node));
      if ((e as KeyboardEvent).key !== "Escape" || !item) return;
      e.preventDefault();
      this.#dismiss(item);
    });
    // Toasts made while it was away start again.
    for (const item of this.#items) if (item.shown) this.#run(item);
  }

  protected disconnected(): void {
    for (const item of this.#items) clearTimeout(item.timer);
  }

  /** Shows a toast. A string is just a title. */
  add(options: ToastOptions | string): ToastHandle {
    const opts = typeof options === "string" ? { title: options } : options;
    const el = make("div", "pp-box pp-toast");
    el.setAttribute("role", "group");
    el.setAttribute("aria-label", opts.title);
    const tone = opts.tone;
    if (tone) {
      el.dataset.tone = tone;
      const icon = make("span", "pp-toast-icon");
      icon.setAttribute("aria-hidden", "true");
      el.append(icon);
    }
    if (opts.variant === "candy") el.dataset.variant = "candy";
    const body = make("div", "pp-toast-body");
    body.append(make("p", "pp-toast-title", opts.title));
    if (opts.body) body.append(make("p", "", opts.body));
    el.append(body);

    let done!: () => void;
    const closed = new Promise<void>((resolve) => (done = resolve));
    const text = `${opts.title} ${opts.body ?? ""}`;
    const ms = opts.duration ?? (tone === "danger" ? 0 : Math.max(5000, 60 * text.length));
    const item: Item = { el, opts, left: ms, start: 0, shown: false, done };

    if (opts.action) {
      const row = make("div", "pp-toast-actions");
      const act = button("pp-toast-action", "outline", opts.action.label);
      act.addEventListener("click", () => {
        opts.action?.onClick?.();
        this.#dismiss(item);
      });
      row.append(act);
      body.append(row);
    }
    const x = button("pp-toast-close", "ghost");
    x.dataset.iconOnly = "";
    x.setAttribute("aria-label", this.getAttribute("dismiss-label") || "Dismiss");
    const glyph = make("span", "pp-icon");
    glyph.dataset.glyph = "close";
    glyph.setAttribute("aria-hidden", "true");
    x.append(glyph);
    x.addEventListener("click", () => this.#dismiss(item));
    el.append(x);
    if (ms > 0) {
      const bar = make("span", "pp-toast-timer");
      bar.setAttribute("aria-hidden", "true");
      el.style.setProperty("--pp-toast-duration", `${ms}ms`);
      el.append(bar);
    }

    this.#items.push(item);
    el.hidden = true;
    this.append(el);
    this.#fill();
    return { el, close: () => this.#dismiss(item), closed };
  }

  /** Shows waiting toasts while there is room. */
  #fill(): void {
    let room = this.max - this.#items.filter((i) => i.shown).length;
    for (const item of this.#items) {
      if (room <= 0) break;
      if (item.shown) continue;
      item.shown = true;
      item.el.hidden = false;
      room--;
      this.#say(item);
      this.#run(item);
    }
  }

  /** Tracks the topmost open modal dialog (the last to open): its live regions take the announcements, and
      countdowns wait. Dialogs closed or removed from the page drop out. */
  #watchModals(): void {
    const open = [...document.querySelectorAll("dialog:modal")];
    this.#modals = [...this.#modals.filter((d) => open.includes(d)), ...open.filter((d) => !this.#modals.includes(d))];
    const modal = this.#modals.at(-1);
    if (modal && !this.#inside.has(modal)) this.#inside.set(modal, regions(modal));
    for (const [dialog, live] of this.#inside) {
      if (dialog === modal || open.includes(dialog)) continue;
      live.polite.remove();
      live.assertive.remove();
      this.#inside.delete(dialog);
    }
    if (modal !== this.#modal) this.#sync((this.#modal = modal));
  }

  #say({ opts }: Item): void {
    this.#watchModals();
    const live = (this.#modal && this.#inside.get(this.#modal)) || this.#live;
    const region = live?.[opts.live ?? (opts.tone === "danger" ? "assertive" : "polite")];
    const line = make("p", "", `${opts.title}. ${opts.body ?? ""}`.trim());
    // A beat later, so a region made a moment ago is already being listened to.
    setTimeout(() => region?.append(line), 150);
    setTimeout(() => line.remove(), 7000);
    services.sound().play(opts.tone === "success" ? "success" : opts.tone === "danger" ? "error" : "open");
  }

  #run(item: Item): void {
    clearTimeout(item.timer);
    if (!item.left || this.#paused || !this.isConnected) return;
    item.start = performance.now();
    item.timer = setTimeout(() => this.#dismiss(item), item.left);
  }

  #sync(_?: unknown): void {
    const paused = this.#hover || this.#focus || document.hidden || !!this.#modal;
    if (paused === this.#paused) return;
    this.#paused = paused;
    this.toggleAttribute("data-paused", paused);
    const now = performance.now();
    for (const item of this.#items) {
      if (!item.shown || !item.left) continue;
      if (paused) {
        clearTimeout(item.timer);
        item.left = Math.max(1, item.left - (now - item.start));
      } else this.#run(item);
    }
  }

  async #dismiss(item: Item): Promise<void> {
    const at = this.#items.indexOf(item);
    if (at < 0) return;
    this.#items.splice(at, 1);
    clearTimeout(item.timer);
    const { el } = item;
    el.setAttribute("data-pp-leaving", "");
    // Keep keyboard users in the stack: the next toast's close button, or back where they came from.
    if (el.matches(":has(:focus-visible)")) {
      const next = this.#items.find((i) => i.shown)?.el.querySelector<HTMLElement>(".pp-toast-close");
      (next ?? (this.#back?.isConnected ? this.#back : null))?.focus();
    }
    await Promise.all(el.getAnimations().map((a) => a.finished.catch(() => undefined)));
    el.remove();
    item.done();
    this.#sync((this.#focus = this.matches(":has(:focus-visible)")));
    this.#fill();
  }
}

PixelToaster.define("pp-toaster", PixelToaster);

/** Shows a toast in the page's toaster, adding one to <body> if there is none. */
export function toast(options: ToastOptions | string): ToastHandle {
  let toaster = document.querySelector("pp-toaster");
  if (!toaster) toaster = document.body.appendChild(document.createElement("pp-toaster"));
  return toaster.add(options);
}

declare global {
  interface HTMLElementTagNameMap {
    "pp-toaster": PixelToaster;
  }
}
