/**
 * <pp-table>: sorting and row selection for the .pp-table inside it. Light DOM: the table reads and looks the same
 * without it.
 *
 *   <pp-table>
 *     <div class="pp-box pp-table-frame"><div class="pp-table-scroll" …><table class="pp-table">…</table></div></div>
 *   </pp-table>
 *
 * Sorting. A .pp-table-sort button in a column header sorts the table's first <tbody> by that column: ascending
 * first, then each press flips it. A cell's data-sort-value wins over its text; numbers ("98,120", "-6") compare
 * as numbers, anything else in the reader's language with digits in order. The <th> gets aria-sort, the other
 * headers lose it, and a polite live region says "Sorted by Score, descending".
 *   pp-sort     { column, direction, header }: cancel it to refuse the sort, or to sort somewhere else (a server)
 *               and set aria-sort yourself.
 *
 * Selection. A checkbox with data-select-all in the header checks or clears every enabled row checkbox (in
 * .pp-table-check cells of the body) and shows "some" (indeterminate) when only some are checked. The CSS marks a
 * row with a checked box as selected.
 *   pp-select   { rows }: the selected <tr>s, after any change.
 */
import { PixelElement } from "@jaatster/blip-core";

export type SortDirection = "ascending" | "descending";

export class PixelTable extends PixelElement {
  #live?: HTMLElement;

  protected override connected(): void {
    this.on(this, "click", (e) => {
      const th = (e.target as Element).closest?.(".pp-table-sort")?.closest("th");
      if (th && this.contains(th)) this.sort(th);
    });
    this.on(this, "change", (e) => {
      const box = e.target as HTMLInputElement;
      const table = box.closest("table");
      if (box.type !== "checkbox" || !table || !box.closest(".pp-table-check, [data-select-all]")) return;
      if (box.hasAttribute("data-select-all")) for (const b of this.#boxes(table)) b.checked = box.checked;
      this.#sync(table);
      this.emit("select", { rows: this.#boxes(table).filter((b) => b.checked).map((b) => b.closest("tr")) });
    });
    for (const table of this.querySelectorAll("table")) this.#sync(table);
  }

  protected override disconnected(): void {
    this.#live?.remove();
    this.#live = undefined;
  }

  /** Sorts by a column header: in the given direction, or the next one in turn. Returns false if refused. */
  sort(th: HTMLTableCellElement, direction?: SortDirection): boolean {
    const table = th.closest("table");
    const body = table?.tBodies[0];
    if (!table || !body) return false;
    const dir: SortDirection = direction ?? (th.getAttribute("aria-sort") === "ascending" ? "descending" : "ascending");
    const column = th.cellIndex;
    if (!this.emit("sort", { column, direction: dir, header: th }, true)) return false;

    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
    const key = (row: HTMLTableRowElement) => {
      const cell = row.cells[column];
      return (cell?.dataset.sortValue ?? cell?.textContent ?? "").trim();
    };
    const num = (s: string) => (/^[-+]?[\d,]*\.?\d+$/.test(s) ? Number(s.replace(/,/g, "")) : NaN);
    const rows = [...body.rows].filter((r) => !r.matches(".pp-table-empty, .pp-table-loading"));
    rows.sort((a, b) => {
      const x = key(a), y = key(b), nx = num(x), ny = num(y);
      const order = Number.isNaN(nx) || Number.isNaN(ny) ? collator.compare(x, y) : nx - ny;
      return dir === "ascending" ? order : -order;
    });
    body.append(...rows);

    for (const h of th.parentElement?.children ?? []) if (h !== th) h.removeAttribute("aria-sort");
    th.setAttribute("aria-sort", dir);
    this.#say(`Sorted by ${th.textContent?.trim()}, ${dir}`);
    return true;
  }

  /** The selected rows of every table inside. */
  get selectedRows(): HTMLTableRowElement[] {
    return [...this.querySelectorAll<HTMLInputElement>("tbody .pp-table-check input[type=checkbox]:checked")]
      .map((b) => b.closest("tr"))
      .filter((r): r is HTMLTableRowElement => !!r);
  }

  #boxes(table: HTMLTableElement): HTMLInputElement[] {
    return [...table.querySelectorAll<HTMLInputElement>("tbody .pp-table-check input[type=checkbox]")].filter((b) => !b.disabled);
  }

  #sync(table: HTMLTableElement): void {
    const all = table.querySelector<HTMLInputElement>("thead input[data-select-all]");
    if (!all) return;
    const boxes = this.#boxes(table);
    const on = boxes.filter((b) => b.checked).length;
    all.checked = on > 0 && on === boxes.length;
    all.indeterminate = on > 0 && on < boxes.length;
  }

  #say(text: string): void {
    if (!this.#live) {
      this.#live = Object.assign(document.createElement("span"), { className: "pp-sr-only" });
      this.#live.setAttribute("aria-live", "polite");
      this.append(this.#live);
    }
    this.#live.textContent = text;
  }
}

PixelElement.define("pp-table", PixelTable);

declare global {
  interface HTMLElementTagNameMap {
    "pp-table": PixelTable;
  }
}
