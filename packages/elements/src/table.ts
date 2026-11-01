/**
 * <chu-table>: sorting and row selection for the .chu-table inside it. Light DOM: the table reads and looks the same
 * without it.
 *
 *   <chu-table>
 *     <div class="chu-box chu-table-frame"><div class="chu-table-scroll" …><table class="chu-table">…</table></div></div>
 *   </chu-table>
 *
 * Sorting. A .chu-table-sort button in a column header sorts the table's first <tbody> by that column: ascending
 * first, then each press flips it. A cell's data-sort-value wins over its text; numbers ("98,120", "-6") compare
 * as numbers, anything else in the reader's language with digits in order. The <th> gets aria-sort, the other
 * headers lose it, and a polite live region says "Sorted by Score, descending".
 *   chu-sort     { column, direction, header }: cancel it to refuse the sort, or to sort somewhere else (a server)
 *               and set aria-sort yourself.
 *
 * Selection. A checkbox with data-select-all in the header checks or clears every enabled row checkbox (in
 * .chu-table-check cells of the body) and shows "some" (indeterminate) when only some are checked. The CSS marks a
 * row with a checked box as selected.
 *   chu-select   { rows }: the selected <tr>s, after any change.
 *
 * Rows a framework adds, removes or changes later are taken in: "select all" follows them, and a table this element
 * sorted stays sorted (a sort you did yourself, by cancelling chu-sort, is left alone).
 */
import { BlipElement } from "@jaatster/blip-core";
import { observe } from "./_dom.js";

export type SortDirection = "ascending" | "descending";

/**
 * Sorting and row selection for the .chu-table inside it. Light DOM: the table reads and looks the same without it.
 *
 * @summary Sorting and row selection for a table.
 * @fires {CustomEvent<{ column: number; direction: SortDirection; header: HTMLTableCellElement }>} chu-sort - Before
 * sorting. Cancelable: preventDefault() refuses it (sort on a server, then set aria-sort yourself).
 * @fires {CustomEvent<{ rows: HTMLTableRowElement[] }>} chu-select - After any row checkbox changes; rows are the
 * selected <tr>s.
 */
export class BlipTable extends BlipElement {
  #live?: HTMLElement;
  /** The sort this element applied to each table (column and direction), kept while the header still says so. */
  #sorted = new WeakMap<HTMLTableElement, { th: HTMLTableCellElement; direction: SortDirection }>();
  #observer?: MutationObserver;

  protected override connected(): void {
    this.on(this, "click", (e) => {
      const th = (e.target as Element).closest?.(".chu-table-sort")?.closest("th");
      if (th && this.contains(th)) this.sort(th);
    });
    this.on(this, "change", (e) => {
      const box = e.target as HTMLInputElement;
      const table = box.closest("table");
      if (box.type !== "checkbox" || !table || !box.closest(".chu-table-check, [data-select-all]")) return;
      if (box.hasAttribute("data-select-all")) for (const b of this.#boxes(table)) b.checked = box.checked;
      this.#sync(table);
      this.emit("select", { rows: this.#boxes(table).filter((b) => b.checked).map((b) => b.closest("tr")) });
    });
    for (const table of this.querySelectorAll("table")) this.#sync(table);
    // Rows that come, go or change later: select-all follows them, and a sort this element made is applied again.
    this.#observer = observe(this, this.signal, () => {
      for (const table of this.querySelectorAll("table")) {
        this.#sync(table);
        const sorted = this.#sorted.get(table);
        if (sorted && sorted.th.isConnected && sorted.th.getAttribute("aria-sort") === sorted.direction) this.#order(table, sorted.th.cellIndex, sorted.direction);
        else this.#sorted.delete(table);
      }
    }, (r) => !!(r.target instanceof Element ? r.target : r.target.parentElement)?.closest("table") || [...r.addedNodes].some((n) => n instanceof Element && n.matches("table, :has(table)")), {
      characterData: true,
      attributeFilter: ["data-sort-value"],
    });
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
    if (!this.emit("sort", { column, direction: dir, header: th }, true)) {
      this.#sorted.delete(table);
      return false;
    }
    this.#order(table, column, dir);
    for (const h of th.parentElement?.children ?? []) if (h !== th) h.removeAttribute("aria-sort");
    th.setAttribute("aria-sort", dir);
    this.#sorted.set(table, { th, direction: dir });
    this.#say(`Sorted by ${th.textContent?.trim()}, ${dir}`);
    return true;
  }

  /** Puts the first body's rows in order by a column, moving only when the order changes. */
  #order(table: HTMLTableElement, column: number, dir: SortDirection): void {
    const body = table.tBodies[0];
    if (!body) return;
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
    const key = (row: HTMLTableRowElement) => {
      const cell = row.cells[column];
      return (cell?.dataset.sortValue ?? cell?.textContent ?? "").trim();
    };
    const num = (s: string) => (/^[-+]?[\d,]*\.?\d+$/.test(s) ? Number(s.replace(/,/g, "")) : NaN);
    const now = [...body.rows].filter((r) => !r.matches(".chu-table-empty, .chu-table-loading"));
    const rows = [...now].sort((a, b) => {
      const x = key(a), y = key(b), nx = num(x), ny = num(y);
      const order = Number.isNaN(nx) || Number.isNaN(ny) ? collator.compare(x, y) : nx - ny;
      return dir === "ascending" ? order : -order;
    });
    if (rows.some((r, i) => r !== now[i])) body.append(...rows);
    // Moving the rows is this element's own change, not news.
    this.#observer?.takeRecords();
  }

  /** The selected rows of every table inside. */
  get selectedRows(): HTMLTableRowElement[] {
    return [...this.querySelectorAll<HTMLInputElement>("tbody .chu-table-check input[type=checkbox]:checked")]
      .map((b) => b.closest("tr"))
      .filter((r): r is HTMLTableRowElement => !!r);
  }

  #boxes(table: HTMLTableElement): HTMLInputElement[] {
    return [...table.querySelectorAll<HTMLInputElement>("tbody .chu-table-check input[type=checkbox]")].filter((b) => !b.disabled);
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
      this.#live = Object.assign(document.createElement("span"), { className: "chu-sr-only" });
      this.#live.setAttribute("aria-live", "polite");
      this.append(this.#live);
    }
    this.#live.textContent = text;
  }
}

BlipElement.define("chu-table", BlipTable);

declare global {
  interface HTMLElementTagNameMap {
    "chu-table": BlipTable;
  }
}
