/**
 * <blip-tile-grid>: a grid of tiles as one Tab stop. The arrow keys move between tiles in two dimensions (Up and Down
 * keep the column), Home and End jump to the first and last; disabled tiles are skipped. Light DOM: without it,
 * every tile is its own Tab stop and still works.
 *
 *   <blip-tile-grid selection="single">
 *     <ul class="blip-tile-grid" role="list" aria-label="Inventory">…<button class="blip-box blip-tile" aria-pressed="false">…</ul>
 *   </blip-tile-grid>
 *
 *   selection="single"   pressing a tile selects it (aria-pressed="true") and clears the others
 *   selection="follow"   the tile with focus is the current one (aria-current="true"), as on the TV's Home row
 *
 *   blip-select   { tile }: before the selection moves; cancel it to keep the old one.
 *
 * Tab lands on the selected (or current) tile, or the first one. Tiles added or removed later (by a framework) keep
 * one Tab stop between them.
 */
import { BlipElement, rovingFocus } from "@blip/core";
import { watch } from "./_dom.js";

const SELECTED = '[aria-pressed="true"], [aria-current]:not([aria-current="false"]), [aria-selected="true"]';

/**
 * A grid of tiles as one Tab stop: the arrow keys move in two dimensions, Home and End jump to the ends, disabled
 * tiles are skipped. Optionally it keeps the selection.
 *
 * @summary A grid of tiles moved through with the arrow keys.
 * @attr {"single" | "follow"} selection - "single": pressing a tile selects it (aria-pressed); "follow": the focused
 * tile is the current one (aria-current). Left out, selection is yours.
 * @fires {CustomEvent<{ tile: HTMLElement }>} blip-select - Before the selection moves. Cancelable: preventDefault()
 * keeps the old one.
 */
export class BlipTileGrid extends BlipElement {
  /** "single" or "follow"; anything else leaves selection to you. */
  get selection(): string {
    return this.getAttribute("selection") ?? "";
  }
  set selection(value: string) {
    this.setAttribute("selection", value);
  }

  /** The tiles that take focus, in order. */
  get tiles(): HTMLElement[] {
    return [...this.querySelectorAll<HTMLElement>(".blip-tile")].filter((t) => t.matches("button, a[href], [tabindex]"));
  }

  #stop: HTMLElement | null = null;

  protected override connected(): void {
    this.#stop = null;
    this.#keepStop();
    // Tiles rendered later (or taken away): one Tab stop still, where it was if that tile is still here.
    watch(this, this.signal, () => this.#keepStop());
    this.on(this, "focusin", (e) => {
      if (this.tiles.includes(e.target as HTMLElement)) this.#stop = e.target as HTMLElement;
    });

    const enabled = () => this.tiles.filter((t) => !t.hasAttribute("disabled") && t.getAttribute("aria-disabled") !== "true");
    const roving = rovingFocus(this, {
      items: () => this.tiles,
      orientation: "horizontal",
      signal: this.signal,
      onMove: (tile) => {
        if (this.selection === "follow") this.select(tile);
      },
    });

    // Up and Down: the nearest tile in the next row, by where the cells are (empty slots and gaps don't matter).
    this.on(this, "keydown", (e: KeyboardEvent) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      const items = enabled();
      const i = items.indexOf(document.activeElement as HTMLElement);
      if (i < 0) return;
      const box = (t: HTMLElement) => (t.closest(".blip-tile-item") ?? t).getBoundingClientRect();
      const from = box(items[i]!);
      const sign = e.key === "ArrowDown" ? 1 : -1;
      let next = -1, best = Infinity;
      items.forEach((t, k) => {
        const r = box(t), dy = (r.top - from.top) * sign;
        const score = dy * 1e4 + Math.abs(r.left - from.left);
        if (dy > 1 && score < best) [next, best] = [k, score];
      });
      e.preventDefault();
      if (next >= 0) roving.focus(next);
    });

    this.on(this, "click", (e) => {
      const tile = (e.target as Element).closest?.<HTMLElement>(".blip-tile");
      if (this.selection === "single" && tile && enabled().includes(tile)) this.select(tile);
    });
  }

  /** One tile in the tab order: the one that had the stop, else the selected one, else the first. */
  #keepStop(): void {
    const tiles = this.tiles;
    const stop = (this.#stop && tiles.includes(this.#stop) ? this.#stop : null) ?? tiles.find((t) => t.matches(SELECTED)) ?? tiles[0] ?? null;
    this.#stop = stop;
    for (const t of tiles) t.tabIndex = t === stop ? 0 : -1;
  }

  /** Selects a tile (aria-pressed in "single", aria-current in "follow"). Returns false if refused. */
  select(tile: HTMLElement): boolean {
    if (tile.matches(SELECTED)) return true;
    if (!this.emit("select", { tile }, true)) return false;
    for (const t of this.tiles) {
      if (this.selection === "follow") {
        if (t === tile) t.setAttribute("aria-current", "true");
        else t.removeAttribute("aria-current");
      } else t.setAttribute("aria-pressed", String(t === tile));
    }
    return true;
  }
}

BlipElement.define("blip-tile-grid", BlipTileGrid);

declare global {
  interface HTMLElementTagNameMap {
    "blip-tile-grid": BlipTileGrid;
  }
}
