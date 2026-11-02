/**
 * The behaviour <blip-dialog> and <blip-drawer> share. Each wraps one native <dialog> and opens it as a modal, so the
 * browser traps focus, makes the page inert and draws the scrim. On top of that, every way of closing (Escape, a
 * form with method="dialog", an invoker command, a press on the scrim with light-dismiss, requestClose()) first
 * fires a cancelable blip-before-close, then plays the stepped exit the CSS draws (data-blip-closing), then closes the
 * dialog and gives focus back to what opened it. A dialog opened or closed directly (showModal(), close()) keeps
 * the element in step.
 *
 *   <blip-dialog light-dismiss><dialog class="blip-box blip-dialog" id="save" aria-labelledby="save-title">…</dialog></blip-dialog>
 *   <button class="blip-box blip-button" commandfor="save" command="show-modal">Save game</button>
 */
import { BlipElement, services, warn } from "@jaatster/blip-core";
import { isOn, unFalse } from "./_dom.js";

/** Why it closed. "drag" is a bottom sheet (<blip-sheet>) dragged or flicked down past its lowest height. */
export type CloseReason = "escape" | "backdrop" | "button" | "submit" | "api" | "drag";
export interface CloseDetail {
  reason: CloseReason;
  returnValue?: string;
}

/** Invoker commands (commandfor and command) are native here; elsewhere the element handles them. */
const invokers = typeof HTMLButtonElement !== "undefined" && "commandForElement" in HTMLButtonElement.prototype;

const outside = (el: Element, e: MouseEvent): boolean => {
  const r = el.getBoundingClientRect();
  return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
};

/**
 * The modal behaviour <blip-dialog> and <blip-drawer> share, around the one native <dialog> inside the element.
 *
 * @attr {boolean} open - Opens the dialog as a modal, or closes it; reflects whether it is open. "false" is off.
 * @attr {boolean} light-dismiss - A press that starts and ends on the scrim asks to close (reason "backdrop").
 * @fires {CustomEvent<void>} blip-open - After it opens (also when opened directly with showModal()).
 * @fires {CustomEvent<CloseDetail>} blip-before-close - Before any close: Escape, the scrim, a close button, a
 * method="dialog" submit or requestClose(). Cancelable: preventDefault() keeps it open.
 * @fires {CustomEvent<CloseDetail>} blip-close - After it has closed and given focus back.
 */
export class Overlay extends BlipElement {
  static observedAttributes = ["open"];
  /** Where focus goes back to, and what had focus before it opened (the browser's own choice). */
  #opener: HTMLElement | null = null;
  #before: Element | null = null;
  #reason: CloseReason = "api";
  #shown = false;
  #closing = false;
  #quiet = false;
  #down = false;

  /** The <dialog> it drives. */
  get dialog(): HTMLDialogElement | null {
    return this.querySelector("dialog");
  }
  /** True while open; setting it opens or closes. Mirrors the open attribute. */
  get open(): boolean {
    return !!this.dialog?.open;
  }
  set open(value: boolean) {
    if (value) this.show();
    else void this.close();
  }
  /** The value of the button that closed it last. */
  get returnValue(): string {
    return this.dialog?.returnValue ?? "";
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    if (unFalse(this, name, value) || this.#quiet || !this.isConnected) return;
    if (isOn(this, "open")) this.show();
    else void this.close();
  }

  protected connected(): void {
    // Listen on this element while events go down to the dialog: cancel and close do not bubble, and the dialog
    // may be added after this element connects.
    const mine = (e: Event) => e.target === this.dialog;
    const capture = { capture: true };
    // Escape. When the browser will not let it be cancelled (a second Escape with no click between), it closes at
    // once, with no blip-before-close. During the exit it does nothing.
    this.on(this, "cancel", (e) => {
      if (!mine(e)) return;
      if (this.#closing) return e.preventDefault();
      this.#reason = "escape";
      if (!e.cancelable) return;
      e.preventDefault();
      void this.requestClose(undefined, "escape");
    }, capture);
    // (A close queued before the dialog was reopened, as when it is moved while open, is stale: skip it.)
    this.on(this, "close", (e) => mine(e) && !this.dialog?.open && this.#closed(), capture);
    this.on(this, "submit", (e) => {
      const form = e.target as HTMLFormElement;
      const button = (e as SubmitEvent).submitter as HTMLButtonElement | null;
      const method = button?.getAttribute("formmethod") ?? form.getAttribute("method");
      if (method?.toLowerCase() !== "dialog" || form.closest("dialog") !== this.dialog) return;
      e.preventDefault();
      void this.requestClose(button?.value, "submit");
    }, capture);
    this.on(this, "command", (e) => {
      const { command, source } = e as Event & { command: string; source: Element | null };
      if (mine(e) && this.#command(command, source)) e.preventDefault();
    }, capture);
    if (!invokers) {
      this.on(document, "click", (e) => {
        const button = (e.target as Element | null)?.closest?.("button[commandfor]");
        const id = this.dialog?.id;
        if (button && id && button.getAttribute("commandfor") === id && this.#command(button.getAttribute("command") ?? "", button)) e.preventDefault();
      });
    }
    // Light dismiss: a press that starts and ends on the scrim.
    this.on(this, "pointerdown", (e) => {
      this.#down = mine(e) && outside(e.target as Element, e as PointerEvent);
    });
    this.on(this, "click", (e) => {
      if (this.#down && mine(e) && isOn(this, "light-dismiss") && outside(e.target as Element, e as MouseEvent)) void this.requestClose(undefined, "backdrop");
      this.#down = false;
    });
    // A dialog opened without this element (showModal(), or the app's own code) is still tracked, and one rendered
    // after this element (by a framework) opens if the open attribute asks for it.
    let seen = this.dialog;
    const watch = new MutationObserver(() => {
      const d = this.dialog;
      if (d?.open && !this.#shown) this.#opened(null);
      else if (d && d !== seen && !d.open && isOn(this, "open")) this.show(this.#opener);
      seen = d;
    });
    watch.observe(this, { subtree: true, childList: true, attributeFilter: ["open"] });
    this.signal.addEventListener("abort", () => watch.disconnect(), { once: true });
    if (isOn(this, "open")) this.show(this.#opener);
  }

  /** Moved or removed while open: the dialog leaves the top layer, so close it; the open attribute reopens it, for
      the same opener. */
  protected disconnected(): void {
    if (this.dialog?.open) this.dialog.close();
    this.#shown = this.#closing = false;
  }

  /** Opens the dialog as a modal. `opener` gets focus back when it closes (by default, whatever has focus now). */
  show(opener?: Element | null): void {
    const d = this.dialog;
    // No children yet is a dialog still to come (it opens when it arrives); other children without one are a mistake.
    if (!d) return void (this.children.length && warn("BLIP-E010", `<${this.localName}> needs a <dialog> inside it.`, this));
    if (d.open) return void (this.#shown || this.#opened(null));
    if (!d.isConnected) return;
    if (!d.hasAttribute("aria-labelledby") && !d.hasAttribute("aria-label")) {
      warn("BLIP-A010", "A dialog needs a name: aria-labelledby pointing at its title, or aria-label.", d);
    }
    this.#before = document.activeElement;
    d.showModal();
    this.#opened((opener ?? (this.#before === document.body ? null : this.#before)) as HTMLElement | null);
  }

  /** Asks to close: fires blip-before-close, which a listener may cancel. Resolves true if it closed. */
  async requestClose(returnValue?: string, reason: CloseReason = "api"): Promise<boolean> {
    if (!this.open || this.#closing) return false;
    if (!this.emit<CloseDetail>("before-close", { reason, returnValue }, true)) {
      this.#reason = "api";
      return false;
    }
    await this.close(returnValue, reason);
    return !this.open;
  }

  /** Closes after the stepped exit, without asking. */
  async close(returnValue?: string, reason: CloseReason = "api"): Promise<void> {
    const d = this.dialog;
    if (!d?.open || this.#closing) return;
    this.#closing = true;
    this.#reason = reason;
    d.setAttribute("data-blip-closing", "");
    // The exit is drawn in CSS (none with reduced motion). Wait for the dialog's own finite animations only, and
    // never long, so an endless effect on it or a spinner inside can't hold it open.
    const exits = d.getAnimations().filter((a) => a.effect?.getComputedTiming().endTime !== Infinity);
    await Promise.race([
      Promise.all(exits.map((a) => a.finished.catch(() => undefined))),
      new Promise((done) => setTimeout(done, 1000)),
    ]);
    if (d.open) {
      d.close(returnValue);
      this.#closed();
    }
  }

  #opened(opener: HTMLElement | null): void {
    this.#shown = true;
    this.#opener = opener;
    this.#reflect(true);
    services.sound().play("open");
    this.emit("open");
  }

  #command(command: string, source: Element | null): boolean {
    if (command === "show-modal") this.show(source);
    else if (command === "close" || command === "request-close") void this.requestClose((source as HTMLButtonElement | null)?.value, "button");
    else return false;
    return true;
  }

  #closed(): void {
    const d = this.dialog;
    d?.removeAttribute("data-blip-closing");
    this.#closing = false;
    this.#reflect(false);
    if (!d || !this.#shown) return;
    this.#shown = false;
    // The browser gives focus back to what had it before; send it to the opener instead when that differs.
    const opener = this.#opener;
    const active = document.activeElement;
    if (opener?.isConnected && (!active || active === document.body || active === this.#before || d.contains(active))) opener.focus();
    this.#opener = this.#before = null;
    services.sound().play("back");
    this.emit<CloseDetail>("close", { reason: this.#reason, returnValue: d.returnValue });
    this.#reason = "api";
  }

  #reflect(open: boolean): void {
    this.#quiet = true;
    if (open) this.setAttribute("open", "");
    else this.removeAttribute("open");
    this.#quiet = false;
  }
}
