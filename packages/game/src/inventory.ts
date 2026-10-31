/**
 * <pp-inventory>: a grid of item slots as a single-select listbox (see inventory.css). The arrow keys move in two
 * dimensions (Up and Down by a whole row, however many columns the grid has right now), Home and End jump to the
 * ends, typing a letter jumps to the next item whose name starts with it, and Enter, Space or a click selects.
 *
 *   inventory.addEventListener("pp-select", (e) => show(e.detail.item));   // { item, index, value }
 */
import { PixelElement, rovingFocus, typeahead } from "@jaatster/blip-core";

export interface SelectDetail {
  item: HTMLElement;
  index: number;
  /** The slot's value or data-value, else its name. */
  value: string;
}

/**
 * A grid of item slots as a single-select listbox: the arrow keys move in two dimensions, Home and End jump to the
 * ends, a letter jumps to the next item with that name, and Enter, Space or a click selects.
 *
 * @summary An inventory grid of item slots.
 * @fires {CustomEvent<SelectDetail>} pp-select - A slot was selected.
 */
export class PixelInventory extends PixelElement {
  static override classes = ["pp-inventory"];

  /** The slots, in order. Slots added later become options as they are found. */
  get slots(): HTMLElement[] {
    const slots = [...this.querySelectorAll<HTMLElement>(".pp-slot")];
    for (const slot of slots) {
      if (slot.getAttribute("role") === "option") continue;
      slot.setAttribute("role", "option");
      if (!slot.hasAttribute("aria-selected")) slot.setAttribute("aria-selected", "false");
    }
    return slots;
  }
  /** The selected slot, if any. */
  get selected(): HTMLElement | undefined {
    return this.slots.find((s) => s.getAttribute("aria-selected") === "true");
  }

  protected override connected(): void {
    this.setAttribute("role", "listbox");
    void this.slots;
    const roving = rovingFocus(this, { items: () => this.slots, loop: false, signal: this.signal });
    this.on(this, "keydown", (e: KeyboardEvent) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      const i = this.slots.indexOf(document.activeElement as HTMLElement);
      const columns = getComputedStyle(this).gridTemplateColumns.split(" ").length;
      const next = i + (e.key === "ArrowDown" ? columns : -columns);
      if (i < 0 || next < 0 || next >= this.slots.length) return;
      e.preventDefault();
      roving.focus(next);
    });
    typeahead(this, {
      items: () => this.slots,
      label: (el) => (el.getAttribute("aria-label") ?? el.textContent ?? "").trim().toLowerCase(),
      onMatch: (el) => roving.focus(this.slots.indexOf(el)),
      signal: this.signal,
    });
    this.on(this, "click", (e: Event) => {
      const slot = (e.target as Element).closest<HTMLElement>(".pp-slot");
      if (slot && this.contains(slot) && slot.getAttribute("aria-disabled") !== "true") this.select(slot);
    });
  }

  /** Selects a slot (by element or index) and sends pp-select. */
  select(slot: HTMLElement | number): void {
    const item = typeof slot === "number" ? this.slots[slot] : slot;
    if (!item) return;
    for (const s of this.slots) s.setAttribute("aria-selected", String(s === item));
    const value = item.getAttribute("value") ?? item.dataset.value ?? item.getAttribute("aria-label") ?? "";
    this.emit<SelectDetail>("select", { item, index: this.slots.indexOf(item), value });
  }
}

PixelElement.define("pp-inventory", PixelInventory);

declare global {
  interface HTMLElementTagNameMap {
    "pp-inventory": PixelInventory;
  }
}
