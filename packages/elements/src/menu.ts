/**
 * <pp-menu>: a WAI-ARIA menu button over the menu markup (see components/menu.css).
 *
 * The list is a native popover (light dismiss, Escape, one menu at a time). This element wires the button
 * (aria-haspopup, aria-expanded, aria-controls), puts focus on the first item when the menu opens (the last with
 * ArrowUp), moves with the arrow keys, Home, End and typeahead, focuses the item under the pointer, toggles checkbox
 * and radio items, opens nested submenus with ArrowRight (ArrowLeft closes them), closes on Tab, and returns focus to
 * the button. It lines the menu up with CSS anchor positioning, or measures where that is missing.
 *
 *   menu.addEventListener("pp-select", (e) => run(e.detail.value)); // e.preventDefault() keeps the menu open
 */
import { PixelElement, rovingFocus, typeahead, pixel, warn } from "@jaatster/blip-core";

export interface MenuSelectDetail {
  item: HTMLElement;
  /** The item's data-value, or its label. */
  value: string;
  /** The new state of a checkbox or radio item. */
  checked?: boolean;
}

const ITEM = '[role^="menuitem"]';
const anchored = typeof CSS !== "undefined" && CSS.supports("position-area", "block-end");
let uid = 0;

export class PixelMenu extends PixelElement {
  static override classes = ["pp-menu"];
  #last = false;
  #tab = false;

  /** The button: the first button (or [aria-haspopup]) child. */
  get trigger(): HTMLElement | null {
    return this.querySelector(":scope > :is(button, [aria-haspopup])");
  }
  /** The list: the [role=menu] child. */
  get menu(): HTMLElement | null {
    return this.querySelector(':scope > [role="menu"]');
  }
  /** This menu's items (not those of its submenus). */
  get items(): HTMLElement[] {
    const menu = this.menu;
    return menu ? [...menu.querySelectorAll<HTMLElement>(ITEM)].filter((el) => el.closest('[role="menu"]') === menu) : [];
  }
  get open(): boolean {
    return !!this.menu?.matches(":popover-open");
  }

  /** Opens the menu and focuses its first item (or its last). */
  show(last = false): void {
    this.#last = last;
    if (this.open) this.#focusEnd();
    else this.menu?.showPopover();
  }
  /** Closes the menu and gives focus back to its button. */
  close(): void {
    if (this.open) this.menu!.hidePopover();
    this.trigger?.focus();
  }

  #enabled(): HTMLElement[] {
    return this.items.filter((el) => el.getAttribute("aria-disabled") !== "true");
  }
  #focusEnd(): void {
    const items = this.#enabled();
    items[this.#last ? items.length - 1 : 0]?.focus();
    this.#last = false;
  }

  protected override connected(): void {
    const button = this.trigger;
    const menu = this.menu;
    if (!button || !menu) return warn("PP-M001", "<pp-menu> needs a button and a [role=menu] list inside it.", this);
    const signal = this.signal;
    const id = (menu.id ||= `pp-menu-${++uid}`);
    const sub = !!this.parentElement?.closest('[role="menu"]');
    const rtl = () => getComputedStyle(this).direction === "rtl";
    if (!menu.hasAttribute("popover")) menu.popover = "auto";
    button.setAttribute("aria-haspopup", "menu");
    button.setAttribute("aria-controls", id);
    button.setAttribute("aria-expanded", String(this.open));
    if (button instanceof HTMLButtonElement) button.popoverTargetElement = menu;
    else this.on(button, "click", () => (this.open ? menu.hidePopover() : this.show()));
    // Unique names, so CSS anchor positioning can line this pair up.
    button.style.setProperty("anchor-name", `--${id}`);
    menu.style.setProperty("position-anchor", `--${id}`);

    rovingFocus(menu, { items: () => this.items, orientation: "vertical", signal });
    typeahead(menu, {
      items: () => (this.items.includes(document.activeElement as HTMLElement) ? this.#enabled() : []),
      label: (el) => (el.querySelector(".pp-menu-label") ?? el).textContent?.trim().toLowerCase() ?? "",
      onMatch: (el) => el.focus(),
      signal,
    });

    this.on(button, "keydown", (e) => {
      if (e.key === (sub ? (rtl() ? "ArrowLeft" : "ArrowRight") : "ArrowDown") || (!sub && e.key === "ArrowUp")) {
        e.preventDefault();
        this.show(e.key === "ArrowUp");
      }
    });

    this.on(menu, "toggle", (e) => {
      const open = e.newState === "open";
      button.setAttribute("aria-expanded", String(open));
      if (open) {
        if (!anchored) this.#place();
        this.#focusEnd();
      } else {
        const active = document.activeElement;
        if (!active || active === document.body || menu.contains(active)) button.focus();
      }
    });

    this.on(menu, "click", (e) => {
      const item = (e.target as Element).closest<HTMLElement>(ITEM);
      if (!item || !this.items.includes(item) || item.matches('[aria-haspopup]:not([aria-haspopup="false"])')) return;
      if (item.getAttribute("aria-disabled") === "true") return e.preventDefault();
      this.#activate(item, true);
    });

    this.on(menu, "keydown", (e) => {
      const item = document.activeElement as HTMLElement;
      if (!this.items.includes(item)) return;
      this.#tab = e.key === "Tab";
      if (e.key === " " && item.hasAttribute("aria-checked")) {
        // Space toggles a checkbox or radio item and leaves the menu open.
        e.preventDefault();
        if (item.getAttribute("aria-disabled") !== "true") this.#activate(item, false);
      } else if (sub && e.key === (rtl() ? "ArrowRight" : "ArrowLeft")) {
        e.preventDefault();
        this.close();
      } else if ((e.key === "Enter" || e.key === " ") && !item.matches("button, a[href]")) {
        e.preventDefault();
        item.click();
      }
    });

    // Leaving the menu (Tab, a click elsewhere) closes it.
    this.on(menu, "focusout", (e) => {
      const to = e.relatedTarget as Node | null;
      if (to && !menu.contains(to) && (to !== button || this.#tab) && this.open) menu.hidePopover();
      this.#tab = false;
    });

    // The item under the pointer takes the focus, so the yellow row follows the pointer as well as the keys.
    this.on(menu, "pointermove", (e) => {
      const item = (e.target as Element).closest<HTMLElement>(ITEM);
      if (item && item !== document.activeElement && this.#enabled().includes(item)) item.focus();
    });

    if (!anchored) {
      const again = () => this.open && this.#place();
      this.on(window, "resize", again);
      this.on(window, "scroll", again, { capture: true, passive: true });
    }
  }

  #activate(item: HTMLElement, close: boolean): void {
    const role = item.getAttribute("role");
    const checked = role === "menuitemcheckbox" ? item.getAttribute("aria-checked") !== "true" : role === "menuitemradio" ? true : undefined;
    const value = item.dataset.value ?? (item.querySelector(".pp-menu-label") ?? item).textContent?.trim() ?? "";
    if (!this.emit<MenuSelectDetail>("select", { item, value, checked }, true)) return;
    if (role === "menuitemradio") {
      for (const radio of (item.closest('[role="group"]') ?? this.menu!).querySelectorAll('[role="menuitemradio"]')) radio.setAttribute("aria-checked", String(radio === item));
    } else if (checked !== undefined) item.setAttribute("aria-checked", String(checked));
    if (!close) return;
    // Close the whole chain of menus, back to the first button.
    let root: PixelMenu = this;
    for (let m = this.parentElement?.closest<PixelMenu>("pp-menu"); m; m = m.parentElement?.closest<PixelMenu>("pp-menu")) root = m;
    root.close();
  }

  /** Where anchor positioning is missing: below the button (beside it for a submenu), kept on screen. */
  #place(): void {
    const menu = this.menu!;
    const b = this.trigger!.getBoundingClientRect();
    const m = menu.getBoundingClientRect();
    const gap = 2 * pixel(this);
    const sub = !!this.parentElement?.closest('[role="menu"]');
    let top = sub ? b.top - 3 * pixel(this) : b.bottom + gap;
    let left = sub ? b.right + gap : this.dataset.align === "end" ? b.right - m.width : b.left;
    if (top + m.height > innerHeight) top = sub ? innerHeight - m.height : b.top - gap - m.height;
    if (left + m.width > innerWidth) left = sub ? b.left - gap - m.width : innerWidth - m.width;
    menu.style.top = `${Math.max(0, top)}px`;
    menu.style.left = `${Math.max(0, left)}px`;
  }
}

PixelElement.define("pp-menu", PixelMenu);

declare global {
  interface HTMLElementTagNameMap {
    "pp-menu": PixelMenu;
  }
  interface HTMLElementEventMap {
    /** From pp-menu and pp-command: an item was chosen. Cancelable. */
    "pp-select": CustomEvent<{ item: HTMLElement; value: string; checked?: boolean }>;
  }
}
