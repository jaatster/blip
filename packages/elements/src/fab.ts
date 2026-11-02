/**
 * <blip-fab>: an action button that opens a speed dial, as a WAI-ARIA menu button (see components/fab.css).
 *
 * The button opens and closes the stack above it and says so (aria-haspopup, aria-expanded, aria-controls). Opening
 * puts focus on the first item, the one nearest the button; ArrowUp and ArrowDown move along the stack as it looks
 * (Home and End jump to its ends), Escape closes it and gives focus back to the button, and so does choosing an item.
 * Tab, a press outside or focus going elsewhere closes it where focus is. Items are read as they are, so items
 * rendered later just work.
 *
 *   <blip-fab class="blip-fab-dial">
 *     <button class="blip-box blip-fab" type="button" data-icon-only aria-label="Create">…</button>
 *     <div class="blip-fab-menu" role="menu" aria-label="Create" hidden>
 *       <button class="blip-box blip-fab-action" type="button" role="menuitem">Photo</button>
 *     </div>
 *   </blip-fab>
 *
 *   fab.addEventListener("blip-action", (e) => create(e.detail.value)); // e.preventDefault() keeps it open
 */
import { BlipElement, dismiss, warn } from "@jaatster/blip-core";
import { isOn, unFalse, valueOf, watch } from "./_dom.js";
import type { ActionDetail } from "./menu.js";

let uid = 0;

/**
 * An action button with a speed dial: two or three labelled mini buttons that step up above it, as a WAI-ARIA menu
 * button.
 *
 * @summary An action button that opens a short stack of actions.
 * @attr {boolean} open - The stack is open; setting it opens or closes it. "false" is off.
 * @attr {"fixed" | "absolute" | "static"} [data-position="fixed"] - Floats at the bottom end of the screen, of the
 * nearest positioned box, or sits in the flow.
 * @fires {CustomEvent<ActionDetail>} blip-action - An item was chosen, before it runs. Cancelable: preventDefault()
 * keeps the stack open.
 * @fires {CustomEvent<void>} blip-open - The stack opened.
 * @fires {CustomEvent<void>} blip-close - The stack closed.
 */
export class BlipFab extends BlipElement {
  static override classes = ["blip-fab-dial"];
  static observedAttributes = ["open"];
  #quiet = false;

  /** The button: the .blip-fab (or first button) child. */
  get trigger(): HTMLElement | null {
    return this.querySelector(":scope > .blip-fab") ?? this.querySelector(":scope > button");
  }
  /** The stack: the [role=menu] child. */
  get menu(): HTMLElement | null {
    return this.querySelector(':scope > [role="menu"]');
  }
  /** The stack's items, the one nearest the button first. */
  get items(): HTMLElement[] {
    return [...(this.menu?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
  }
  /** True while the stack is open; setting it opens or closes it. */
  get open(): boolean {
    return !!this.menu && !this.menu.hidden;
  }
  set open(value: boolean) {
    if (value) this.show();
    else this.close();
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    if (unFalse(this, name, value) || this.#quiet || !this.isConnected) return;
    if (isOn(this, "open")) this.show();
    else this.close();
  }

  /** Opens the stack and focuses its first item, the one nearest the button. */
  show(): void {
    this.#sync();
    this.#toggle(true);
    if (this.open) this.#enabled()[0]?.focus();
  }

  /** Closes the stack; focus goes back to the button if it was in the stack. */
  close(): void {
    const inside = this.menu?.contains(document.activeElement);
    if (this.#toggle(false) && inside) this.trigger?.focus();
  }

  protected override connected(): void {
    this.#sync();
    watch(this, this.signal, () => this.#sync(), { subtree: false });
    if (!this.menu && this.children.length) warn("BLIP-M001", "<blip-fab> needs a button and a [role=menu] stack inside it.", this);

    this.on(this, "click", (e) => {
      const t = e.target as Element;
      const item = t.closest<HTMLElement>('[role="menuitem"]');
      if (item && this.items.includes(item)) {
        if (item.getAttribute("aria-disabled") === "true") return;
        const value = valueOf(item);
        if (this.emit<ActionDetail>("action", { item, value }, true)) this.close();
      } else if (this.trigger?.contains(t)) {
        if (this.open) this.close();
        else this.show();
      }
    });

    this.on(this, "keydown", (e: KeyboardEvent) => {
      const items = this.#enabled();
      const at = items.indexOf(document.activeElement as HTMLElement);
      const k = e.key;
      if (this.trigger?.contains(e.target as Node) && (k === "ArrowUp" || k === "ArrowDown")) {
        e.preventDefault();
        this.show();
      } else if (at >= 0) {
        // The stack runs upward: ArrowUp goes on to the next item, ArrowDown back towards the button.
        const n = items.length;
        const to = k === "ArrowUp" ? (at + 1) % n : k === "ArrowDown" ? (at - 1 + n) % n : k === "Home" ? 0 : k === "End" ? n - 1 : -1;
        if (to >= 0) {
          e.preventDefault();
          items[to]!.focus();
        } else if (k === "Tab") this.#toggle(false);
      }
    });

    dismiss(this, {
      signal: this.signal,
      onDismiss: (reason) => {
        if (!this.open) return;
        if (reason === "escape" && this.contains(document.activeElement)) {
          this.#toggle(false);
          this.trigger?.focus();
        } else this.#toggle(false);
      },
    });

    if (isOn(this, "open") && !this.open) this.show();
  }

  #enabled(): HTMLElement[] {
    return this.items.filter((el) => el.getAttribute("aria-disabled") !== "true" && !el.hasAttribute("disabled"));
  }

  /** Shows or hides the stack; true if that changed anything. */
  #toggle(open: boolean): boolean {
    const menu = this.menu;
    if (!menu || this.open === open) return false;
    menu.hidden = !open;
    this.trigger?.setAttribute("aria-expanded", String(open));
    this.#quiet = true;
    this.toggleAttribute("open", open);
    this.#quiet = false;
    this.emit(open ? "open" : "close");
    return true;
  }

  /** The button's and the stack's roles and states, and the items' place out of the tab order. */
  #sync(): void {
    const button = this.trigger;
    const menu = this.menu;
    if (!button || !menu) return;
    const id = (menu.id ||= `blip-fab-${++uid}`);
    if (button instanceof HTMLButtonElement) button.type = "button";
    button.setAttribute("aria-haspopup", "menu");
    button.setAttribute("aria-controls", id);
    button.setAttribute("aria-expanded", String(this.open));
    if (!menu.hasAttribute("aria-label") && !menu.hasAttribute("aria-labelledby")) menu.setAttribute("aria-labelledby", (button.id ||= `${id}-button`));
    for (const item of this.items) item.tabIndex = -1;
  }
}

BlipElement.define("blip-fab", BlipFab);

declare global {
  interface HTMLElementTagNameMap {
    "blip-fab": BlipFab;
  }
}
