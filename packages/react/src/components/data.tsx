/**
 * Data display: Card, Tile, List, the parts of a table, Avatar, Tag, Keycap, Stat, Divider, Accordion. CSS from
 * @jaatster/blip-components (card.css, tile.css, list.css, table.css, avatar.css, tag.css, keycap.css, stat.css,
 * divider.css, accordion.css). <TileGrid> and <Table> (the elements' wrappers) add arrow keys, sorting and
 * selection round the markup these render.
 */
import { forwardRef } from "react";
import type { CSSProperties, ElementType } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import {
  box,
  cx,
  flag,
  type NativeProps,
  type Radius,
  type Scale,
  type Size,
  type Tone,
  type Variant,
} from "../internal/props.js";

/** A name for something whose words don't name it: `aria-label` or `aria-labelledby`. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

/** Whole pixels, as a length. */
const px = (n: number): string => `calc(${n} * var(--pp-pixel))`;

/** The user's style over one public custom property, when it has a value. */
function withProperty(style: CSSProperties | undefined, name: string, value?: string): CSSProperties | undefined {
  return value === undefined ? style : ({ [name]: value, ...style } as CSSProperties);
}

/** A list element, which keeps its list semantics in Safari only with `role="list"`. */
const isList = (tag: ElementType): boolean => tag === "ul" || tag === "ol";

/* -------------------------------------------------------------------------------------------------- card */

/** Own props of {@link Card}. */
export interface CardOwnProps {
  /**
   * A cream panel (default), `panel` (the white one), soft or candy, which tint the whole card (text inside takes
   * the box's ink), or outline: flat, for dense pages. `data-variant`.
   */
  variant?: "panel" | "soft" | "candy" | "outline";
  /**
   * On a cream card, a three-pixel strip of its light colour along the top; soft or candy, the card's colour.
   * `data-tone`.
   */
  tone?: Tone;
  /** Padding 6, 8 (default) or 12 pixels, with the title size and corner radius to match. `data-size`. */
  size?: Size;
  /** Corner radius in pixels, 0 to 8 (4 by default; small 3, large 5). `data-pp-r`. */
  radius?: Radius;
  /**
   * The picture beside the text while both fit, above it when they don't (it follows its container, no
   * breakpoint). Wrap the header, body and footer in a {@link CardContent}. `data-layout`.
   */
  layout?: "horizontal";
  /** A card with one main link (a {@link CardLink} in its title) and other actions: it lifts. `data-pp-interactive`. */
  interactive?: boolean;
}
export type CardProps<T extends ElementType = "article"> = PolymorphicProps<T, CardOwnProps>;

/**
 * A panel that holds one thing: a world, a player, an event. An `<article>` with a heading in the page's outline;
 * `as="a"` makes the whole card a link that lifts (keep it short, with nothing else to press inside). One thing per
 * card, never a card in a card; rows of cards go in a grid. Renders `<article class="pp-box pp-card">`.
 *
 *   <Card>
 *     <CardMedia><img src="meadow.png" alt="" /></CardMedia>
 *     <CardHeader>
 *       <div><CardTitle>Meadow</CardTitle><CardSubtitle>World 1 · 8 levels</CardSubtitle></div>
 *       <Tag tone="success">Cleared</Tag>
 *     </CardHeader>
 *     <CardBody><p>Rolling hills, slow clouds and the first boss.</p></CardBody>
 *     <CardFooter><Button>Play</Button></CardFooter>
 *   </Card>
 *   <Card as="a" href="/worlds/meadow">…</Card>
 */
export const Card = forwardRef(function Card(
  { as: Tag = "article", variant, tone, size, radius, layout, interactive, className, ...rest }: CardProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("pp-box pp-card", className)}
      {...box({ tone, radius })}
      data-variant={variant}
      data-size={size}
      data-layout={layout}
      data-pp-interactive={flag(interactive)}
      {...rest}
    />
  );
}) as PolymorphicComponent<"article", CardOwnProps>;

/** Props for {@link CardMedia}. */
export type CardMediaProps = NativeProps<"div">;

/**
 * The card's picture in a one-pixel ink frame, never smoothed. An `<img>`, `<svg>`, `<canvas>` or `<video>`, 16:9
 * unless `--pp-card-media-ratio` says otherwise; `alt=""` when it only decorates. Renders `<div
 * class="pp-card-media">`.
 *
 *   <CardMedia><img src="meadow.png" alt="" /></CardMedia>
 */
export const CardMedia = forwardRef<HTMLDivElement, CardMediaProps>(function CardMedia({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("pp-card-media", className)} {...rest} />;
});

/** Props for {@link CardHeader}. */
export type CardHeaderProps = NativeProps<"header">;

/**
 * The card's header: title and subtitle at the start, anything small at the end. Wrap the title and subtitle in a
 * `<div>`; the end holds a tag or a menu button. Renders `<header class="pp-card-header">`.
 *
 *   <CardHeader><div><CardTitle>Meadow</CardTitle></div><Tag tone="success">Cleared</Tag></CardHeader>
 */
export const CardHeader = forwardRef<HTMLElement, CardHeaderProps>(function CardHeader({ className, ...rest }, ref) {
  return <header ref={ref} className={cx("pp-card-header", className)} {...rest} />;
});

export type CardTitleProps<T extends ElementType = "h3"> = PolymorphicProps<T, object>;

/**
 * The card's title: a few words, on a heading at the right level for the page's outline (`<h2>` to `<h4>`).
 * Renders `<h3 class="pp-card-title">`.
 *
 *   <CardTitle as="h2">Pip Bloom</CardTitle>
 */
export const CardTitle = forwardRef(function CardTitle(
  { as: Tag = "h3", className, ...rest }: CardTitleProps<ElementType>,
  ref,
) {
  return <Tag ref={ref} className={cx("pp-card-title", className)} {...rest} />;
}) as PolymorphicComponent<"h3", object>;

/** Props for {@link CardSubtitle}. */
export type CardSubtitleProps = NativeProps<"p">;

/**
 * One line of facts under the title. Renders `<p class="pp-card-subtitle">`.
 *
 *   <CardSubtitle>World 1 · 8 levels</CardSubtitle>
 */
export const CardSubtitle = forwardRef<HTMLParagraphElement, CardSubtitleProps>(function CardSubtitle(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("pp-card-subtitle", className)} {...rest} />;
});

export type CardBodyProps<T extends ElementType = "div"> = PolymorphicProps<T, object>;

/**
 * The card's text: a `<div>` of paragraphs, or `as="p"` for one. Renders `<div class="pp-card-body">`.
 *
 *   <CardBody as="p">Rolling hills, slow clouds and the first boss.</CardBody>
 */
export const CardBody = forwardRef(function CardBody(
  { as: Tag = "div", className, ...rest }: CardBodyProps<ElementType>,
  ref,
) {
  return <Tag ref={ref} className={cx("pp-card-body", className)} {...rest} />;
}) as PolymorphicComponent<"div", object>;

/** Props for {@link CardFooter}. */
export type CardFooterProps = NativeProps<"footer">;

/**
 * The card's actions, at the end and pushed to the bottom in a row of cards: one or two, the main one in candy.
 * Renders `<footer class="pp-card-footer">`.
 *
 *   <CardFooter><Button variant="soft" size="sm">Message</Button><Button size="sm">Add friend</Button></CardFooter>
 */
export const CardFooter = forwardRef<HTMLElement, CardFooterProps>(function CardFooter({ className, ...rest }, ref) {
  return <footer ref={ref} className={cx("pp-card-footer", className)} {...rest} />;
});

/** Props for {@link CardContent}. */
export type CardContentProps = NativeProps<"div">;

/**
 * The header, body and footer of a horizontal card, side by side with its picture. Renders `<div
 * class="pp-card-content">`.
 *
 *   <Card layout="horizontal"><CardMedia>…</CardMedia><CardContent>…</CardContent></Card>
 */
export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(function CardContent(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("pp-card-content", className)} {...rest} />;
});

/** Props for {@link CardLink}. */
export type CardLinkProps = NativeProps<"a">;

/**
 * A card's main link, in its title: its click area covers the card. Give the card `interactive`; its other buttons stay
 * their own targets above the link, so screen readers hear a short link name and every action stays reachable. For a
 * router's link component, give it `className="pp-card-link"`. Renders `<a class="pp-card-link">`.
 *
 *   <Card interactive>
 *     <CardHeader>
 *       <div><CardTitle><CardLink href="/worlds/night-woods">Night woods</CardLink></CardTitle></div>
 *     </CardHeader>
 *     <CardFooter><Button size="sm">Continue</Button></CardFooter>
 *   </Card>
 */
export const CardLink = forwardRef<HTMLAnchorElement, CardLinkProps>(function CardLink({ className, ...rest }, ref) {
  return <a ref={ref} className={cx("pp-card-link", className)} {...rest} />;
});

/* -------------------------------------------------------------------------------------------------- tile */

/** Own props of {@link Tile}. */
export interface TileOwnProps {
  /** Candy (default), soft for a calmer grid, outline (with no glyph: an empty slot) or ghost. `data-variant`. */
  variant?: Variant;
  /** The block's candy: an app's colour, an item's kind. Yellow is for coins. `data-tone`. */
  tone?: Tone;
  /** 20, 28 (default, the TV's block) or 36 pixels square; or size the whole {@link TileList}. `data-size`. */
  size?: Size;
  /** Picked (in an inventory): it lifts inside a ring and the arrow bobs above it. On a button tile. `aria-pressed`. */
  pressed?: boolean;
}
export type TileProps<T extends ElementType = "button"> = PolymorphicProps<T, TileOwnProps>;

/**
 * The TV's app block: a square candy box with one white glyph in an ink outline. Its name is a {@link TileLabel} below.
 * A `<button>` (choosing) or, with `as="a"`, a link (going somewhere; `aria-current` marks the active one), named by
 * its label through `aria-labelledby`. Renders `<button class="pp-box pp-tile">`.
 *
 *   <TileItem>
 *     <Tile tone="red" pressed aria-labelledby="t-sword"><Icon name="sword" /><TileGlint /></Tile>
 *     <TileLabel id="t-sword">Iron sword</TileLabel>
 *   </TileItem>
 */
export const Tile = forwardRef(function Tile(
  { as: Tag = "button", variant, tone, size, pressed, className, ...rest }: TileProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("pp-box pp-tile", className)}
      {...box({ variant, tone })}
      data-size={size}
      aria-pressed={pressed}
      {...rest}
    />
  );
}) as PolymorphicComponent<"button", TileOwnProps>;

/** Props for {@link TileGlint}. */
export type TileGlintProps = NativeProps<"span", { children?: never }>;

/**
 * An empty span in a tile: a white glint sweeps across it while the tile is selected. It sweeps every 4.5 seconds, and
 * not at all with reduced motion. Renders `<span class="pp-tile-glint">`.
 *
 *   <Tile tone="green" aria-labelledby="app-play"><Icon name="play" /><TileGlint /></Tile>
 */
export const TileGlint = forwardRef<HTMLSpanElement, TileGlintProps>(function TileGlint({ className, ...rest }, ref) {
  return <span ref={ref} className={cx("pp-tile-glint", className)} {...rest} />;
});

/** Own props of {@link TileItem}. */
export interface TileItemOwnProps {
  /**
   * The label shows only while its tile is hovered, focused or selected, in its own space below (it never covers
   * anything): a TV-style launcher. `data-label`.
   */
  label?: "tooltip";
}
export type TileItemProps<T extends ElementType = "li"> = PolymorphicProps<T, TileItemOwnProps>;

/**
 * A fixed-width cell holding a tile, room above it for the arrow, and its label. Renders `<li class="pp-tile-item">`
 * (`as="div"` in a grid that is not a list).
 *
 *   <TileItem label="tooltip">
 *     <Tile as="a" href="/play" tone="green" aria-current="true" aria-labelledby="app-1"><Icon name="play" /></Tile>
 *     <TileLabel id="app-1" boxed>Play</TileLabel>
 *   </TileItem>
 */
export const TileItem = forwardRef(function TileItem(
  { as: Tag = "li", label, className, ...rest }: TileItemProps<ElementType>,
  ref,
) {
  return <Tag ref={ref} className={cx("pp-tile-item", className)} data-label={label} {...rest} />;
}) as PolymorphicComponent<"li", TileItemOwnProps>;

/** Own props of {@link TileLabel}. */
export interface TileLabelOwnProps {
  /** A cream bubble round the label, with `label="tooltip"` on its item. Adds `.pp-box`. */
  boxed?: boolean;
}
export type TileLabelProps = TileLabelOwnProps & NativeProps<"span", TileLabelOwnProps>;

/**
 * A tile's name, upper case and centred under it: one to three words, counts included ("Potion ×3"). It names the
 * tile (the tile's `aria-labelledby` points at its `id`) and is hidden itself, so it is heard once. Renders `<span
 * class="pp-tile-label" aria-hidden="true">`.
 *
 *   <TileLabel id="t-sword">Iron sword</TileLabel>
 */
export const TileLabel = forwardRef<HTMLSpanElement, TileLabelProps>(function TileLabel(
  { boxed, className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx(boxed && "pp-box", "pp-tile-label", className)} aria-hidden {...rest} />;
});

/** Own props of {@link TileList}. */
export interface TileListOwnProps {
  /** Every tile in it 20, 28 (default) or 36 pixels square, in cells 32, 40 or 48 pixels wide. `data-size`. */
  size?: Size;
}
export type TileListProps<T extends ElementType = "ul"> = PolymorphicProps<T, TileListOwnProps>;

/**
 * The grid of tiles (`.pp-tile-grid`): as many fixed cells as fit. A list (with `role="list"`, so it stays one in
 * Safari) named with `aria-label` or `aria-labelledby`; wrap it in a `<TileGrid>` for one Tab stop, the arrow keys
 * and selection. Keep it to one kind of thing. Renders `<ul class="pp-tile-grid" role="list">` (`as="div"` for
 * pictures that are not a list, without the role).
 *
 *   <TileGrid selection="single">
 *     <TileList aria-label="Inventory">
 *       <TileItem>…</TileItem>
 *     </TileList>
 *   </TileGrid>
 */
export const TileList = forwardRef(function TileList(
  { as: Tag = "ul", size, role, className, ...rest }: TileListProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("pp-tile-grid", className)}
      role={role ?? (isList(Tag) ? "list" : undefined)}
      data-size={size}
      {...rest}
    />
  );
}) as PolymorphicComponent<"ul", TileListOwnProps>;

/* -------------------------------------------------------------------------------------------------- list */

/** Own props of {@link List}. */
export interface ListOwnProps {
  /** The list in a white panel. Adds `.pp-box`. */
  boxed?: boolean;
  /** The panel's tier: white (default), `panel`, soft or outline. Implies `boxed`. `data-variant`. */
  variant?: "panel" | "soft" | "outline";
  /** A line-soft pixel line between rows: for rows of content (pressable rows read fine without). `data-dividers`. */
  dividers?: boolean;
  /** Tighter rows (14 pixels at least) and smaller text: long lists, side panels. `data-density`. */
  density?: "compact";
}
export type ListProps<T extends ElementType = "ul"> = PolymorphicProps<T, ListOwnProps>;

/**
 * Rows of things: settings, players, files, sections. Calm: candy stays for the actions inside. A `<ul>` (or
 * `as="ol"`) with `role="list"`, so it stays a list in Safari; name it when it stands alone. Rows are either all
 * pressable or all content, never mixed. Renders `<ul class="pp-list" role="list">`, `<ul class="pp-box pp-list"
 * role="list">` boxed.
 *
 *   <List boxed dividers aria-label="Settings">
 *     <ListItem>…</ListItem>
 *   </List>
 */
export const List = forwardRef(function List(
  { as: Tag = "ul", boxed, variant, dividers, density, role, className, ...rest }: ListProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx((boxed || variant) && "pp-box", "pp-list", className)}
      role={role ?? (isList(Tag) ? "list" : undefined)}
      data-variant={variant}
      data-dividers={flag(dividers)}
      data-density={density}
      {...rest}
    />
  );
}) as PolymorphicComponent<"ul", ListOwnProps>;

/** Own props of {@link ListItem}. */
export interface ListItemOwnProps {
  /** A pressable row's corner radius in pixels, 0 to 8 (3 by default). `data-pp-r`. */
  radius?: Radius;
}
export type ListItemProps<T extends ElementType = "li"> = PolymorphicProps<T, ListItemOwnProps>;

/**
 * A row: a leading icon or avatar, a {@link ListContent}, and perhaps a {@link ListEnd}. As an `<li>` it is a row of
 * content, whose controls are named by its title (`aria-labelledby`). As `as="a"` or `as="button"` (inside a plain
 * `<li>`) it is a row you press: a ghost box, filled on hover, named by its words, `aria-current="page"` for the
 * page you are on; never put a control inside one. Renders `<li class="pp-list-item">`, or `<a class="pp-box
 * pp-list-item" data-variant="ghost">` (a button gets `type="button"`).
 *
 *   <ListItem>
 *     <Icon name="music" />
 *     <ListContent>
 *       <ListTitle id="set-music">Music</ListTitle>
 *       <ListDescription>Chip tunes on the title screen</ListDescription>
 *     </ListContent>
 *     <ListEnd>…a switch with aria-labelledby="set-music"</ListEnd>
 *   </ListItem>
 *   <li><ListItem as="a" href="/settings/general" aria-current="page">…</ListItem></li>
 */
export const ListItem = forwardRef(function ListItem(
  { as: Tag = "li", radius, type, className, ...rest }: ListItemProps<ElementType>,
  ref,
) {
  const pressable = Tag !== "li";
  return (
    <Tag
      ref={ref}
      className={cx(pressable && "pp-box", "pp-list-item", className)}
      {...box({ variant: pressable ? "ghost" : undefined, radius })}
      type={type ?? (Tag === "button" ? "button" : undefined)}
      {...rest}
    />
  );
}) as PolymorphicComponent<"li", ListItemOwnProps>;

export type ListContentProps<T extends ElementType = "div"> = PolymorphicProps<T, object>;

/**
 * The row's words: a {@link ListTitle} and a {@link ListDescription}, one under the other. In a pressable row use
 * `as="span"` (a link or button holds no `<div>`). Renders `<div class="pp-list-content">`.
 *
 *   <ListContent><ListTitle>Cloud save</ListTitle><ListDescription>Synced 2 min ago</ListDescription></ListContent>
 */
export const ListContent = forwardRef(function ListContent(
  { as: Tag = "div", className, ...rest }: ListContentProps<ElementType>,
  ref,
) {
  return <Tag ref={ref} className={cx("pp-list-content", className)} {...rest} />;
}) as PolymorphicComponent<"div", object>;

/** Props for {@link ListTitle}. */
export type ListTitleProps = NativeProps<"span">;

/**
 * The row's title, a few words; give it an `id` to name the row's controls. Renders `<span class="pp-list-title">`.
 *
 *   <ListTitle id="set-music">Music</ListTitle>
 */
export const ListTitle = forwardRef<HTMLSpanElement, ListTitleProps>(function ListTitle({ className, ...rest }, ref) {
  return <span ref={ref} className={cx("pp-list-title", className)} {...rest} />;
});

/** Props for {@link ListDescription}. */
export type ListDescriptionProps = NativeProps<"span">;

/**
 * One line under the title, muted. Renders `<span class="pp-list-description">`.
 *
 *   <ListDescription>Chip tunes on the title screen</ListDescription>
 */
export const ListDescription = forwardRef<HTMLSpanElement, ListDescriptionProps>(function ListDescription(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("pp-list-description", className)} {...rest} />;
});

export type ListEndProps<T extends ElementType = "div"> = PolymorphicProps<T, object>;

/**
 * The row's end: meta text or controls. Meta in tabular digits ("60%", "2 min ago"), or a switch, a tag, a keycap, a
 * chevron for a row that goes somewhere; `as="span"` in a pressable row. Renders `<div class="pp-list-end">`.
 *
 *   <ListEnd>98,120</ListEnd>
 */
export const ListEnd = forwardRef(function ListEnd(
  { as: Tag = "div", className, ...rest }: ListEndProps<ElementType>,
  ref,
) {
  return <Tag ref={ref} className={cx("pp-list-end", className)} {...rest} />;
}) as PolymorphicComponent<"div", object>;

/* ------------------------------------------------------------------------------------------------- table */

/** Props for {@link TableFrame}. */
export type TableFrameProps = NativeProps<"div">;

/**
 * The white panel round a table, which sits a pixel inside its outline. Leave it out for a table on a card.
 * Renders `<div class="pp-box pp-table-frame">`.
 *
 *   <TableFrame><DataTable>…</DataTable></TableFrame>
 */
export const TableFrame = forwardRef<HTMLDivElement, TableFrameProps>(function TableFrame({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("pp-box pp-table-frame", className)} {...rest} />;
});

/** Own props of {@link TableScroll}. */
export interface TableScrollOwnProps {
  /** Past this height, in whole pixels, the body scrolls under the sticky header. `--pp-table-max-height`. */
  maxHeight?: number;
}
export type TableScrollProps = TableScrollOwnProps & Named & NativeProps<"div", TableScrollOwnProps>;

/**
 * The table's scroll region, with a pixel scrollbar and the header stuck to its top. It scrolls across (and down, with
 * `maxHeight`) rather than squeezing the columns. A named region in the Tab order, so keyboard users scroll it with the
 * arrow keys: name it by the caption (`aria-labelledby`) or with `aria-label`. Leave it out for a short table. Renders
 * `<div class="pp-table-scroll" role="region" tabindex="0">`.
 *
 *   <TableScroll aria-labelledby="scores-cap" maxHeight={120}>…</TableScroll>
 */
export const TableScroll = forwardRef<HTMLDivElement, TableScrollProps>(function TableScroll(
  { maxHeight, role = "region", tabIndex = 0, style, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx("pp-table-scroll", className)}
      role={role}
      tabIndex={tabIndex}
      style={withProperty(style, "--pp-table-max-height", maxHeight === undefined ? undefined : px(maxHeight))}
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
 * `<caption>`, `scope="col"` on column headers (`.pp-numeric` on number columns and their headers, `aria-sort` on
 * the sorted one) and `scope="row"` on the cell that names each row. All round it is optional: a
 * {@link TableFrame}, a {@link TableScroll}, and `<Table>` (`<pp-table>`) to sort and select in the page. Renders
 * `<table class="pp-table">`.
 *
 *   <Table>
 *     <TableFrame>
 *       <TableScroll aria-labelledby="scores-cap">
 *         <DataTable zebra>
 *           <caption id="scores-cap">Leaderboard, this week</caption>
 *           <thead><tr><th scope="col" aria-sort="descending"><TableSort>Score</TableSort></th></tr></thead>
 *           <tbody><tr><td className="pp-numeric">98,120</td></tr></tbody>
 *         </DataTable>
 *       </TableScroll>
 *     </TableFrame>
 *   </Table>
 */
export const DataTable = forwardRef<HTMLTableElement, DataTableProps>(function DataTable(
  { zebra, density, stack, busy, className, ...rest },
  ref,
) {
  return (
    <table
      ref={ref}
      className={cx("pp-table", className)}
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
 * class="pp-table-caret" aria-hidden="true">`.
 *
 *   <TableCaret />
 */
export const TableCaret = forwardRef<HTMLSpanElement, TableCaretProps>(function TableCaret(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("pp-table-caret", className)} aria-hidden {...rest} />;
});

/** Props for {@link TableSort}. */
export type TableSortProps = NativeProps<"button">;

/**
 * A sortable column's header button: a ghost box filling its `<th>`, the label and a pixel caret. Put `aria-sort`
 * on the `<th>` of the sorted column only. `<Table>` sorts when it is pressed; without it, sort on the server.
 * Renders `<button class="pp-box pp-table-sort" data-variant="ghost" type="button">` ending in a
 * {@link TableCaret}.
 *
 *   <th scope="col" className="pp-numeric" aria-sort="descending"><TableSort>Score</TableSort></th>
 */
export const TableSort = forwardRef<HTMLButtonElement, TableSortProps>(function TableSort(
  { type = "button", className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx("pp-box pp-table-sort", className)}
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
 * class="pp-table-check">`.
 *
 *   <TableCheck>
 *     <span className="pp-box pp-checkbox" data-size="sm"><input type="checkbox" aria-labelledby="p1" /></span>
 *   </TableCheck>
 */
export const TableCheck = forwardRef(function TableCheck(
  { as: Tag = "td", scope, className, ...rest }: TableCheckProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("pp-table-check", className)}
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
 * props are the row's; its children go in the cell. Renders `<tr class="pp-table-empty"><td colspan>`.
 *
 *   <tbody><TableEmpty colSpan={3}>No friends online. Invite someone to play.</TableEmpty></tbody>
 */
export const TableEmpty = forwardRef<HTMLTableRowElement, TableEmptyProps>(function TableEmpty(
  { colSpan, className, children, ...rest },
  ref,
) {
  return (
    <tr ref={ref} className={cx("pp-table-empty", className)} {...rest}>
      <td colSpan={colSpan}>{children}</td>
    </tr>
  );
});

/** Props for {@link TableLoading}: as {@link TableEmpty}. */
export type TableLoadingProps = TableEmptyProps;

/**
 * A body row while data loads: one cell across the table, muted, with three stepped dots. Mark the table `busy`.
 * The ref and props are the row's; its children go in the cell. Renders `<tr class="pp-table-loading"><td colspan>`.
 *
 *   <DataTable busy>…<tbody><TableLoading colSpan={3}>Loading matches</TableLoading></tbody></DataTable>
 */
export const TableLoading = forwardRef<HTMLTableRowElement, TableLoadingProps>(function TableLoading(
  { colSpan, className, children, ...rest },
  ref,
) {
  return (
    <tr ref={ref} className={cx("pp-table-loading", className)} {...rest}>
      <td colSpan={colSpan}>{children}</td>
    </tr>
  );
});

/* ------------------------------------------------------------------------------------------------ avatar */

/** Own props of {@link Avatar}. */
export interface AvatarOwnProps {
  /** 10, 12, 20 (default), 28 or 36 pixels square; the picture inside is 8, 8, 16, 24 or 32. `data-size`. */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** The matte round a picture, or the candy behind initials. Keep each person's colour the same. `data-tone`. */
  tone?: Tone;
  /** Corner radius in pixels, 0 to 5 (which keeps the picture clear of the corners); by size 1 to 5. `data-pp-r`. */
  radius?: Extract<Radius, 0 | 1 | 2 | 3 | 4 | 5>;
}
export type AvatarProps = AvatarOwnProps & NativeProps<"span", AvatarOwnProps>;

/**
 * A person or player as a picture or initials in a candy box. A picture is an `<img>`, `<svg>` or `<canvas>` (drawn at
 * 8 x 8 or 16 x 16, so it scales by whole numbers) with `alt` naming them; initials are one or two letters (one on xs
 * and sm) with `role="img"` and `aria-label` the full name. Renders `<span class="pp-box pp-avatar">`.
 *
 *   <Avatar tone="pink"><img src="pip.png" alt="Pip Bloom" /></Avatar>
 *   <Avatar tone="teal" role="img" aria-label="Kit Moss">KM</Avatar>
 */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { size, tone, radius, className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cx("pp-box pp-avatar", className)}
      {...box({ tone, radius })}
      data-size={size}
      {...rest}
    />
  );
});

/** Own props of {@link AvatarStatus}. */
export interface AvatarStatusOwnProps {
  /** Success online, warning busy, danger do not disturb. `data-tone`. */
  tone?: "success" | "warning" | "danger";
  /** Outline: away or offline. `data-variant`. */
  variant?: "outline";
  /** None: the dot is named by `aria-label` or `aria-labelledby`. */
  children?: never;
}
export type AvatarStatusProps = AvatarStatusOwnProps & Named & NativeProps<"span", AvatarStatusOwnProps>;

/**
 * The status dot on an avatar's corner: a small candy box with a name ("Online"), so colour is never the only cue.
 * Renders `<span class="pp-box pp-avatar-status" role="img">`.
 *
 *   <Avatar size="lg" tone="pink">
 *     <img src="pip.png" alt="Pip Bloom" />
 *     <AvatarStatus tone="success" aria-label="Online" />
 *   </Avatar>
 */
export const AvatarStatus = forwardRef<HTMLSpanElement, AvatarStatusProps>(function AvatarStatus(
  { tone, variant, role = "img", className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cx("pp-box pp-avatar-status", className)}
      {...box({ variant, tone })}
      role={role}
      {...rest}
    />
  );
});

/** Props for {@link AvatarGroup}. */
export type AvatarGroupProps = Named & NativeProps<"div">;

/**
 * Avatars that overlap by four pixels (three for small ones), ending with a `+3` avatar in neutral. A group named
 * with a label that counts everyone ("Party: Pip, Juno and 3 more"). Renders `<div class="pp-avatar-group"
 * role="group">`.
 *
 *   <AvatarGroup aria-label="Party: Pip, Juno and 3 more">
 *     <Avatar tone="pink"><img src="pip.png" alt="Pip Bloom" /></Avatar>
 *     <Avatar tone="neutral" role="img" aria-label="3 more">+3</Avatar>
 *   </AvatarGroup>
 */
export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(function AvatarGroup(
  { role = "group", className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("pp-avatar-group", className)} role={role} {...rest} />;
});

/* --------------------------------------------------------------------------------------------------- tag */

/** Own props of {@link Tag}. */
export interface TagOwnProps {
  /** Soft (default) to label; candy for a tag you act on; outline for filter chips at rest; ghost. `data-variant`. */
  variant?: Variant;
  /**
   * Meaning first: success for done, danger for out, neutral for away, or a candy; yellow only for coins and stars
   * (it means focus). `data-tone`.
   */
  tone?: Tone;
  /** 12, 14 (default, the TV's pill) or 16 pixels high; large ones can hold an icon. `data-size`. */
  size?: Size;
  /** Corner radius in pixels, 0 to 8 (5 by default; small 4, large 6). `data-pp-r`. */
  radius?: Radius;
  /** A filter chip (`as="button"`) that is on: it sits in. Give a chip `false` when off. `aria-pressed`. */
  pressed?: boolean;
}
export type TagProps<T extends ElementType = "span"> = PolymorphicProps<T, TagOwnProps>;

/**
 * The TV's pill: a short upper-case label that says what something is (a rarity, a status, a zone), in text. With
 * `as="button"` and `pressed` it is a filter chip (it gets `type="button"`; group chips with `role="group"` and a
 * label); with `as="a"`, a tag that goes somewhere. Write it in sentence case. Renders `<span class="pp-box
 * pp-tag">`.
 *
 *   <Tag tone="success">Cleared</Tag>
 *   <Tag tone="orange">Lava zone<TagRemove aria-label="Remove Lava zone" onClick={remove} /></Tag>
 *   <Tag as="button" variant="outline" pressed={swords} onClick={toggle}>Swords</Tag>
 */
export const Tag = forwardRef(function Tag(
  { as: Pill = "span", variant, tone, size, radius, pressed, type, className, ...rest }: TagProps<ElementType>,
  ref,
) {
  return (
    <Pill
      ref={ref}
      className={cx("pp-box pp-tag", className)}
      {...box({ variant, tone, radius })}
      data-size={size}
      type={type ?? (Pill === "button" ? "button" : undefined)}
      aria-pressed={pressed}
      {...rest}
    />
  );
}) as PolymorphicComponent<"span", TagOwnProps>;

/** Props for {@link TagRemove}: a name, and a button's props without children (it draws the cross). */
export type TagRemoveProps = Named & NativeProps<"button", { children?: never }>;

/**
 * A tag's cross: its own small button with a pixel ×, last in the tag. It is 12 pixels square (24 CSS px) and named
 * for what it removes ("Remove Lava zone"); put crosses on medium and large tags. After removing, move focus to the
 * next tag or back to the input that added it. Renders `<button class="pp-tag-remove" type="button">`.
 *
 *   <Tag tone="teal">Co-op<TagRemove aria-label="Remove Co-op" onClick={remove} /></Tag>
 */
export const TagRemove = forwardRef<HTMLButtonElement, TagRemoveProps>(function TagRemove(
  { type = "button", className, ...rest },
  ref,
) {
  return <button ref={ref} className={cx("pp-tag-remove", className)} type={type} {...rest} />;
});

/* ------------------------------------------------------------------------------------------------ keycap */

/** Own props of {@link Keycap}. */
export interface KeycapOwnProps {
  /**
   * 10, 12 (default) or 16 pixels high: medium sits in body text, large for prompts and shortcut sheets. `data-size`.
   */
  size?: Size;
  /**
   * Cream (default), neutral, or a tone or candy: a gamepad's buttons (A green, B red, X blue, Y slate). `data-tone`.
   */
  tone?: Tone;
  /** Shows the key held down: it sits in its drop (key tests, tutorials). `data-pp-pressed`. */
  pressed?: boolean;
}
export type KeycapProps = KeycapOwnProps & NativeProps<"kbd", KeycapOwnProps>;

/**
 * A key to press, drawn as a little key standing up off the page. It is a `<kbd>`, so assistive technology knows it is
 * keyboard input: write the label as the key reads ("Ctrl", "Esc"), not as a symbol. A picture, never a control.
 * Renders `<kbd class="pp-box pp-keycap">`.
 *
 *   <p>Press <Keycap>Esc</Keycap> to pause.</p>
 *   <Keycap size="lg" tone="green">A</Keycap>
 */
export const Keycap = forwardRef<HTMLElement, KeycapProps>(function Keycap(
  { size, tone, pressed, className, ...rest },
  ref,
) {
  return (
    <kbd
      ref={ref}
      className={cx("pp-box pp-keycap", className)}
      {...box({ tone })}
      data-size={size}
      data-pp-pressed={flag(pressed)}
      {...rest}
    />
  );
});

/** Props for {@link Keys}. */
export type KeysProps = NativeProps<"kbd">;

/**
 * A key combination: an outer `<kbd>` holding keycaps, with a quiet "+" between them. Renders `<kbd
 * class="pp-keys">`.
 *
 *   <Keys><Keycap>Ctrl</Keycap>+<Keycap>K</Keycap></Keys>
 */
export const Keys = forwardRef<HTMLElement, KeysProps>(function Keys({ className, ...rest }, ref) {
  return <kbd ref={ref} className={cx("pp-keys", className)} {...rest} />;
});

/* -------------------------------------------------------------------------------------------------- stat */

/** Own props of {@link Stat}. */
export interface StatOwnProps {
  /** The stat in its own panel, for a stat on its own: white (`panel`) or soft. Adds `.pp-box`. `data-variant`. */
  variant?: "panel" | "soft";
  /** A soft panel's colour. `data-tone`. */
  tone?: Tone;
}
export type StatProps = StatOwnProps & NativeProps<"div", StatOwnProps>;

/**
 * One number that matters: its label, its value said big, and how it moved. Use a {@link StatLabel}, a {@link
 * StatValue} and a {@link StatDelta}. Group stats in a `<dl>` (a grid or cluster), three to six in a row: each stat is
 * a `<div>` of a `<dt>` and `<dd>`s, so the label is read with its value. Renders `<div class="pp-stat">`.
 *
 *   <Grid as="dl" min={128}>
 *     <Stat>
 *       <StatLabel>High score</StatLabel>
 *       <StatValue scale={3} pop>98,120</StatValue>
 *       <StatDelta trend="up">+12% vs last week</StatDelta>
 *     </Stat>
 *   </Grid>
 */
export const Stat = forwardRef<HTMLDivElement, StatProps>(function Stat({ variant, tone, className, ...rest }, ref) {
  return (
    <div
      ref={ref}
      className={cx(variant && "pp-box", "pp-stat", className)}
      {...box({ tone })}
      data-variant={variant}
      {...rest}
    />
  );
});

/** Props for {@link StatLabel}. */
export type StatLabelProps = NativeProps<"dt">;

/**
 * The stat's label: one to three words, upper case and muted. Renders `<dt class="pp-stat-label">`.
 *
 *   <StatLabel>Levels cleared</StatLabel>
 */
export const StatLabel = forwardRef<HTMLElement, StatLabelProps>(function StatLabel({ className, ...rest }, ref) {
  return <dt ref={ref} className={cx("pp-stat-label", className)} {...rest} />;
});

/** Own props of {@link StatValue}. */
export interface StatValueOwnProps {
  /** Pixel Bop's whole scale: 1, 2 (default), 3 or 4; pick one the column can hold. `data-scale`. */
  scale?: Scale;
  /**
   * The POP tint and drop: any tone or candy (not red or green for good or bad: that is the delta's job). `data-tone`.
   */
  tone?: Tone;
  /**
   * The TV's look: white letters, an ink outline, a drop in the tone's shade and a tinted lower band. Adds `.pp-pop`
   * and `data-pop`, which holds the same text: string or number children are copied; otherwise give the text here.
   */
  pop?: boolean | string;
}
export type StatValueProps = StatValueOwnProps & NativeProps<"dd", StatValueOwnProps>;

/**
 * The value, big, in Pixel Bop with tabular digits, formatted for reading ("98,120", "412 KB"). Renders `<dd
 * class="pp-stat-value pp-display">`, with `pp-pop` and `data-pop` when it pops.
 *
 *   <StatValue scale={3} tone="green" pop>42</StatValue>
 *   <StatValue>12:30</StatValue>
 */
export const StatValue = forwardRef<HTMLElement, StatValueProps>(function StatValue(
  { scale, tone, pop, className, children, ...rest },
  ref,
) {
  const popping = pop === true || typeof pop === "string";
  const text = typeof children === "string" || typeof children === "number" ? String(children) : undefined;
  return (
    <dd
      ref={ref}
      className={cx("pp-stat-value pp-display", popping && "pp-pop", className)}
      data-scale={scale}
      data-tone={tone}
      data-pop={typeof pop === "string" ? pop : popping ? text : undefined}
      {...rest}
    >
      {children}
    </dd>
  );
});

/** Own props of {@link StatDelta}. */
export interface StatDeltaOwnProps {
  /** The pixel arrow before the words: up (reads success green), down (danger red) or flat (muted). `data-trend`. */
  trend?: "up" | "down" | "flat";
  /** When down is good news (lag, lives lost) or up is bad, say so: success, danger or neutral. `data-tone`. */
  tone?: "success" | "danger" | "neutral";
}
export type StatDeltaProps = StatDeltaOwnProps & NativeProps<"dd", StatDeltaOwnProps>;

/**
 * How the value moved, in words that carry the change. Say its sign and what it compares to ("+12% vs last week", "-6,
 * fewer is better"); the arrow and colour repeat the words. Renders `<dd class="pp-stat-delta">`.
 *
 *   <StatDelta trend="down" tone="success">-6, fewer is better</StatDelta>
 */
export const StatDelta = forwardRef<HTMLElement, StatDeltaProps>(function StatDelta(
  { trend, tone, className, ...rest },
  ref,
) {
  return <dd ref={ref} className={cx("pp-stat-delta", className)} data-trend={trend} data-tone={tone} {...rest} />;
});

/* ----------------------------------------------------------------------------------------------- divider */

/** Own props of {@link Divider}. */
export interface DividerOwnProps {
  /**
   * Solid (default) between groups, dashed (three pixels on, two off), or dither, a soft break in game screens.
   * `data-variant`.
   */
  variant?: "solid" | "dashed" | "dither";
  /** The line colour (ink by day) instead of line-soft. `data-strong`. */
  strong?: boolean;
  /** Where a labelled divider's words sit: center (default), start or end. `data-align`. */
  align?: "center" | "start" | "end";
  /**
   * Vertical: upright, as tall as its row, between groups in a toolbar or cluster. On an `<hr>`. `aria-orientation`.
   */
  orientation?: "horizontal" | "vertical";
}
export type DividerProps<T extends ElementType = "hr"> = PolymorphicProps<T, DividerOwnProps>;

/**
 * A line in whole pixels between real groups of content: an `<hr>`, a separator. A stack's gap often separates enough.
 * A labelled divider is `as="div"` with a word or two, read as text; if the words name a section, use a heading
 * instead. Renders `<hr class="pp-divider">`.
 *
 *   <Divider variant="dither" />
 *   <Divider orientation="vertical" />
 *   <Divider as="div" align="start">Saved games</Divider>
 */
export const Divider = forwardRef(function Divider(
  { as: Tag = "hr", variant, strong, align, orientation, className, ...rest }: DividerProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("pp-divider", className)}
      data-variant={variant}
      data-strong={flag(strong)}
      data-align={align}
      aria-orientation={orientation}
      {...rest}
    />
  );
}) as PolymorphicComponent<"hr", DividerOwnProps>;

/* --------------------------------------------------------------------------------------------- accordion */

/** Props for {@link Accordion}. */
export type AccordionProps = NativeProps<"div">;

/**
 * A stack of questions or sections that open one at a time, on `<details>` with no script. Give every {@link
 * AccordionItem} the same `name` and only one stays open (the browser's own exclusive accordion); leave it off to let
 * several open. Put a real heading before it, and don't nest them. Renders `<div class="pp-accordion">`.
 *
 *   <Accordion>
 *     <AccordionItem name="faq" open>
 *       <AccordionSummary>Can I play offline?</AccordionSummary>
 *       <AccordionPanel boxed><p>Yes. Everything runs on your device.</p></AccordionPanel>
 *     </AccordionItem>
 *   </Accordion>
 */
export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(function Accordion({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("pp-accordion", className)} {...rest} />;
});

/** Props for {@link AccordionItem}: a `<details>`'s, `name` and `open` among them. */
export type AccordionItemProps = NativeProps<"details">;

/**
 * One question and its answer: a native `<details>`. `open` opens it (then the browser toggles it: follow it with
 * `onToggle`); find-in-page opens a closed one holding the match. Renders `<details class="pp-accordion-item">`.
 *
 *   <AccordionItem name="faq">
 *     <AccordionSummary>How do I save my game?</AccordionSummary>
 *     <AccordionPanel boxed><p>The game saves at every checkpoint flag.</p></AccordionPanel>
 *   </AccordionItem>
 */
export const AccordionItem = forwardRef<HTMLDetailsElement, AccordionItemProps>(function AccordionItem(
  { className, ...rest },
  ref,
) {
  return <details ref={ref} className={cx("pp-accordion-item", className)} {...rest} />;
});

/** Props for {@link AccordionChevron}. */
export type AccordionChevronProps = NativeProps<"span", { children?: never }>;

/**
 * The pixel chevron, an empty span drawn and never read: right when closed, down when open. {@link AccordionSummary}
 * draws one; use this only in a summary of your own. Renders `<span class="pp-accordion-chevron">`.
 *
 *   <AccordionChevron />
 */
export const AccordionChevron = forwardRef<HTMLSpanElement, AccordionChevronProps>(function AccordionChevron(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("pp-accordion-chevron", className)} {...rest} />;
});

/** Own props of {@link AccordionSummary}. */
export interface AccordionSummaryOwnProps {
  /**
   * White (default) for FAQs; `panel`; soft or candy (with a tone) for a short menu; outline or ghost for dense
   * settings. `data-variant`.
   */
  variant?: "panel" | "soft" | "candy" | "outline" | "ghost";
  /** A soft or candy summary's colour. `data-tone`. */
  tone?: Tone;
  /** Corner radius in pixels, 0 to 8 (3 by default). `data-pp-r`. */
  radius?: Radius;
}
export type AccordionSummaryProps = AccordionSummaryOwnProps & NativeProps<"summary", AccordionSummaryOwnProps>;

/**
 * The question: a full-width box button with a pixel chevron. The browser names it from its words and gives it an
 * expanded state, Enter and Space. One line in the reader's words; no headings inside. Renders `<summary class="pp-box
 * pp-accordion-summary">`, its words followed by an {@link AccordionChevron}.
 *
 *   <AccordionSummary variant="soft" tone="teal">Sound</AccordionSummary>
 */
export const AccordionSummary = forwardRef<HTMLElement, AccordionSummaryProps>(function AccordionSummary(
  { variant, tone, radius, className, children, ...rest },
  ref,
) {
  return (
    <summary
      ref={ref}
      className={cx("pp-box pp-accordion-summary", className)}
      {...box({ tone, radius })}
      data-variant={variant}
      {...rest}
    >
      {children}
      <AccordionChevron />
    </summary>
  );
});

/** Own props of {@link AccordionPanel}. */
export interface AccordionPanelOwnProps {
  /** The answer in a cream box tucked under its question, rather than plain text. Adds `.pp-box`. */
  boxed?: boolean;
  /** A boxed panel's corner radius in pixels, 0 to 8 (3 by default). `data-pp-r`. */
  radius?: Radius;
}
export type AccordionPanelProps = AccordionPanelOwnProps & NativeProps<"div", AccordionPanelOwnProps>;

/**
 * The answer, short (link out for more); it pops in a pixel as it opens. Renders `<div class="pp-accordion-panel">`,
 * `<div class="pp-box pp-accordion-panel">` boxed.
 *
 *   <AccordionPanel boxed><p>Yes: Settings, then Controls.</p></AccordionPanel>
 */
export const AccordionPanel = forwardRef<HTMLDivElement, AccordionPanelProps>(function AccordionPanel(
  { boxed, radius, className, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cx(boxed && "pp-box", "pp-accordion-panel", className)} {...box({ radius })} {...rest} />
  );
});
