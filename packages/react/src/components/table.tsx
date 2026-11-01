/**
 * Table: TableFrame, TableScroll, DataTable, TableCaret, TableSort, TableCheck, TableEmpty and TableLoading, the parts
 * that go inside <Table>, and <Table> itself (generated from its element, re-exported here). CSS from
 * @jaatster/blip-components (table.css). <Table> (the element's wrapper) adds sorting and selection round the markup these
 * render.
 */
import { forwardRef } from "react";
import type { CSSProperties, ElementType } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { box, cx, flag, type NativeProps } from "../internal/props.js";

export { Table, type TableProps } from "../generated/elements.js";

/** A name for something whose words don't name it: `aria-label` or `aria-labelledby`. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

/** Whole pixels, as a length. */
const px = (n: number): string => `calc(${n} * var(--chu-pixel))`;

/** The user's style over one public custom property, when it has a value. */
function withProperty(style: CSSProperties | undefined, name: string, value?: string): CSSProperties | undefined {
  return value === undefined ? style : ({ [name]: value, ...style } as CSSProperties);
}

/** Props for {@link TableFrame}. */
export type TableFrameProps = NativeProps<"div">;

/**
 * The white panel round a table, which sits a pixel inside its outline. Leave it out for a table on a card.
 * Renders `<div class="chu-box chu-table-frame">`.
 *
 *   <TableFrame><DataTable>…</DataTable></TableFrame>
 */
export const TableFrame = /*#__PURE__*/ forwardRef<HTMLDivElement, TableFrameProps>(function TableFrame({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("chu-box chu-table-frame", className)} {...rest} />;
});

/** Own props of {@link TableScroll}. */
export interface TableScrollOwnProps {
  /** Past this height, in whole pixels, the body scrolls under the sticky header. `--chu-table-max-height`. */
  maxHeight?: number;
}

export type TableScrollProps = TableScrollOwnProps & Named & NativeProps<"div", TableScrollOwnProps>;

/**
 * The table's scroll region, with a pixel scrollbar and the header stuck to its top. It scrolls across (and down, with
 * `maxHeight`) rather than squeezing the columns. A named region in the Tab order, so keyboard users scroll it with the
 * arrow keys: name it by the caption (`aria-labelledby`) or with `aria-label`. Leave it out for a short table. Renders
 * `<div class="chu-table-scroll" role="region" tabindex="0">`.
 *
 *   <TableScroll aria-labelledby="scores-cap" maxHeight={120}>…</TableScroll>
 */
export const TableScroll = /*#__PURE__*/ forwardRef<HTMLDivElement, TableScrollProps>(function TableScroll(
  { maxHeight, role = "region", tabIndex = 0, style, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx("chu-table-scroll", className)}
      role={role}
      tabIndex={tabIndex}
      style={withProperty(style, "--chu-table-max-height", maxHeight === undefined ? undefined : px(maxHeight))}
      {...rest}
    />
  );
});

/** Own props of {@link DataTable}. */
export interface DataTableOwnProps {
  /** Every other body row in the sunken surface, instead of row lines: for wide tables. `data-zebra`. */
  zebra?: boolean;
  /** Tighter cells, for long tables and side panels. `data-density`. */
  density?: "compact";
  /**
   * On a phone, rows stack instead of scrolling across: under 576 px of the {@link TableScroll}, each row becomes a
   * block of labelled values. Give each cell that is not the row's heading `data-label`, the column's name.
   * `data-stack`.
   */
  stack?: boolean;
  /** Data on its way, with a {@link TableLoading} row. `aria-busy="true"`. */
  busy?: boolean;
}

export type DataTableProps = DataTableOwnProps & NativeProps<"table", DataTableOwnProps>;

/**
 * A real `<table>` for data people compare across rows and columns, calm in the white panel's tiers. Give it a
 * `<caption>`, `scope="col"` on column headers (`.chu-numeric` on number columns and their headers, `aria-sort` on
 * the sorted one) and `scope="row"` on the cell that names each row. All round it is optional: a
 * {@link TableFrame}, a {@link TableScroll}, and `<Table>` (`<chu-table>`) to sort and select in the page. Renders
 * `<table class="chu-table">`.
 *
 *   <Table>
 *     <TableFrame>
 *       <TableScroll aria-labelledby="scores-cap">
 *         <DataTable zebra>
 *           <caption id="scores-cap">Leaderboard, this week</caption>
 *           <thead><tr><th scope="col" aria-sort="descending"><TableSort>Score</TableSort></th></tr></thead>
 *           <tbody><tr><td className="chu-numeric">98,120</td></tr></tbody>
 *         </DataTable>
 *       </TableScroll>
 *     </TableFrame>
 *   </Table>
 */
export const DataTable = /*#__PURE__*/ forwardRef<HTMLTableElement, DataTableProps>(function DataTable(
  { zebra, density, stack, busy, className, ...rest },
  ref,
) {
  return (
    <table
      ref={ref}
      className={cx("chu-table", className)}
      data-zebra={flag(zebra)}
      data-density={density}
      data-stack={flag(stack)}
      aria-busy={busy ? true : undefined}
      {...rest}
    />
  );
});

/** Props for {@link TableCaret}. */
export type TableCaretProps = NativeProps<"span", { children?: never }>;

/**
 * The pixel caret of a sort button. Both carets show, muted, until its column is sorted; then the one `aria-sort` on
 * the `<th>` says. {@link TableSort} draws one; use this only in a sort button of your own. Renders `<span
 * class="chu-table-caret" aria-hidden="true">`.
 *
 *   <TableCaret />
 */
export const TableCaret = /*#__PURE__*/ forwardRef<HTMLSpanElement, TableCaretProps>(function TableCaret(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("chu-table-caret", className)} aria-hidden {...rest} />;
});

/** Props for {@link TableSort}. */
export type TableSortProps = NativeProps<"button">;

/**
 * A sortable column's header button: a ghost box filling its `<th>`, the label and a pixel caret. Put `aria-sort`
 * on the `<th>` of the sorted column only. `<Table>` sorts when it is pressed; without it, sort on the server.
 * Renders `<button class="chu-box chu-table-sort" data-variant="ghost" type="button">` ending in a
 * {@link TableCaret}.
 *
 *   <th scope="col" className="chu-numeric" aria-sort="descending"><TableSort>Score</TableSort></th>
 */
export const TableSort = /*#__PURE__*/ forwardRef<HTMLButtonElement, TableSortProps>(function TableSort(
  { type = "button", className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx("chu-box chu-table-sort", className)}
      {...box({ variant: "ghost" })}
      type={type}
      {...rest}
    >
      {children}
      <TableCaret />
    </button>
  );
});

export type TableCheckProps<T extends ElementType = "td"> = PolymorphicProps<T, object>;

/**
 * A cell of the narrow checkbox column, holding a small checkbox. In a body row the checkbox is named by the row's
 * header (`aria-labelledby`), and a checked row is selected. In the header, `as="th"` (it takes `scope="col"`) holds a
 * select-all box named in words, with `data-select-all` on its input for `<Table>`. Renders `<td
 * class="chu-table-check">`.
 *
 *   <TableCheck>
 *     <span className="chu-box chu-checkbox" data-size="sm"><input type="checkbox" aria-labelledby="p1" /></span>
 *   </TableCheck>
 */
export const TableCheck = /*#__PURE__*/ forwardRef(function TableCheck(
  { as: Tag = "td", scope, className, ...rest }: TableCheckProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("chu-table-check", className)}
      scope={scope ?? (Tag === "th" ? "col" : undefined)}
      {...rest}
    />
  );
}) as PolymorphicComponent<"td", object>;

/** Own props of {@link TableEmpty}. */
export interface TableEmptyOwnProps {
  /** How many columns the table has: the row's one cell spans them all. `colspan` on the cell. */
  colSpan: number;
}

export type TableEmptyProps = TableEmptyOwnProps & NativeProps<"tr", TableEmptyOwnProps>;

/**
 * A body row for no data: one cell across the table, centred and muted, saying why and what to do. The ref and
 * props are the row's; its children go in the cell. Renders `<tr class="chu-table-empty"><td colspan>`.
 *
 *   <tbody><TableEmpty colSpan={3}>No friends online. Invite someone to play.</TableEmpty></tbody>
 */
export const TableEmpty = /*#__PURE__*/ forwardRef<HTMLTableRowElement, TableEmptyProps>(function TableEmpty(
  { colSpan, className, children, ...rest },
  ref,
) {
  return (
    <tr ref={ref} className={cx("chu-table-empty", className)} {...rest}>
      <td colSpan={colSpan}>{children}</td>
    </tr>
  );
});

/** Props for {@link TableLoading}: as {@link TableEmpty}. */
export type TableLoadingProps = TableEmptyProps;

/**
 * A body row while data loads: one cell across the table, muted, with three stepped dots. Mark the table `busy`.
 * The ref and props are the row's; its children go in the cell. Renders `<tr class="chu-table-loading"><td colspan>`.
 *
 *   <DataTable busy>…<tbody><TableLoading colSpan={3}>Loading matches</TableLoading></tbody></DataTable>
 */
export const TableLoading = /*#__PURE__*/ forwardRef<HTMLTableRowElement, TableLoadingProps>(function TableLoading(
  { colSpan, className, children, ...rest },
  ref,
) {
  return (
    <tr ref={ref} className={cx("chu-table-loading", className)} {...rest}>
      <td colSpan={colSpan}>{children}</td>
    </tr>
  );
});
