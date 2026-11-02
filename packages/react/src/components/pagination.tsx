/**
 * Pagination: Pagination, PaginationList, PaginationPrev, PaginationNext, PaginationPage, PaginationGap and
 * PaginationStatus. CSS from @jaatster/blip-components (pagination.css). A link to the page you are on takes `current`
 * (`aria-current="page"`); list items with no class of their own stay plain `<li>`s.
 */
import { forwardRef } from "react";
import type { ElementType, ReactNode } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { box, cx, flag, type IconOnly } from "../internal/props.js";
import type { BoxProps, NativeProps, Size } from "../internal/props.js";

/** A landmark, list or group needs a name: `aria-label`, or `aria-labelledby` pointing at its heading. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

/** A link that is off has nowhere to go: no `href`. */
type Reachable = { disabled?: false } | { disabled: true; href?: never };

const current = (on: boolean | undefined) => (on ? "page" : undefined);

/** Own props of {@link Pagination}. */
export interface PaginationOwnProps {
  /** 16-, 20- (default) or 24-pixel pages; `sm` under tables. `data-size`. */
  size?: Size;
  /** Always the compact "3 / 12"; without it, only while the nav is under 360 px wide. `data-compact`. */
  compact?: boolean;
}

/** Props for {@link Pagination}. */
export type PaginationProps = PaginationOwnProps & Named & NativeProps<"nav", PaginationOwnProps>;

/**
 * The pages of a long list, or the worlds of a game: previous and next, numbered pages with gaps, the page you are on
 * sitting in. Pages are links, so each has an address. Write both the pages and the {@link PaginationStatus}: CSS
 * shows whichever fits. Name the nav for what it pages.
 *
 *   <Pagination aria-label="Player pages">
 *     <PaginationList>
 *       <li><PaginationPrev variant="ghost" href="?page=4">Previous</PaginationPrev></li>
 *       <li><PaginationPage variant="outline" href="?page=1" aria-label="Page 1">1</PaginationPage></li>
 *       <PaginationGap />
 *       <li><PaginationPage variant="outline" href="?page=5" aria-label="Page 5" current>5</PaginationPage></li>
 *       <li><PaginationPage variant="outline" href="?page=6" aria-label="Page 6">6</PaginationPage></li>
 *       <PaginationStatus page={5} total={16} />
 *       <li><PaginationNext variant="ghost" href="?page=6">Next</PaginationNext></li>
 *     </PaginationList>
 *   </Pagination>
 *
 * Renders `<nav class="blip-pagination">`, a size container that takes the width it is given.
 */
export const Pagination = /*#__PURE__*/ forwardRef<HTMLElement, PaginationProps>(function Pagination(
  { size, compact, className, ...rest },
  ref,
) {
  return (
    <nav ref={ref} className={cx("blip-pagination", className)} data-size={size} data-compact={flag(compact)} {...rest} />
  );
});

/** Props for {@link PaginationList}. */
export type PaginationListProps = NativeProps<"ul">;

/**
 * The row: previous, the pages (each link in an `<li>`), gaps, the status, next.
 *
 *   <PaginationList>…</PaginationList>
 *
 * Renders `<ul class="blip-pagination-list" role="list">`.
 */
export const PaginationList = /*#__PURE__*/ forwardRef<HTMLUListElement, PaginationListProps>(function PaginationList(
  { className, ...rest },
  ref,
) {
  return <ul ref={ref} className={cx("blip-pagination-list", className)} role="list" {...rest} />;
});

/** Own props of {@link PaginationPrev} and {@link PaginationNext}. */
export interface PaginationArrowOwnProps extends BoxProps {
  /** Just the chevron: name the link (`aria-label="Previous page"`); its words stay inside. `data-icon-only`. */
  iconOnly?: boolean;
  /**
   * Nowhere to go (the first or the last page): dithered, announced as a dimmed link. `role="link"` and
   * `aria-disabled="true"`, with no `href` (and no `rel`).
   */
  disabled?: boolean;
  /** The words ("Previous", "Prev", "Next", or a game's own), in the `<span>` that carries the chevron. */
  children?: ReactNode;
}

/** Props for {@link PaginationPrev}: a link's by default, or your router's link's with `as`. */
export type PaginationPrevProps<T extends ElementType = "a"> = PolymorphicProps<T, PaginationArrowOwnProps & IconOnly & Reachable>;

/** Props for {@link PaginationNext}. */
export type PaginationNextProps<T extends ElementType = "a"> = PaginationPrevProps<T>;

const arrowAttrs = ({ variant, tone, radius, iconOnly, disabled }: PaginationArrowOwnProps) => ({
  ...box({ variant, tone, radius }),
  "data-icon-only": flag(iconOnly),
  role: disabled ? "link" : undefined,
  "aria-disabled": disabled ? true : undefined,
});

/**
 * Back a page: a box with a pixel chevron and an upper-case label. `rel="prev"` unless it is disabled.
 *
 *   <li><PaginationPrev variant="ghost" href="?page=4">Previous</PaginationPrev></li>
 *   <li><PaginationPrev variant="ghost" disabled>Previous</PaginationPrev></li>
 *   <li><PaginationPrev iconOnly aria-label="Previous page" href="?page=4">Previous</PaginationPrev></li>
 *
 * Renders `<a class="blip-box blip-pagination-prev" rel="prev"><span>…</span></a>`; with `as`, your router's link.
 */
export const PaginationPrev = /*#__PURE__*/ forwardRef(function PaginationPrev(
  { as: Tag = "a", variant, tone, radius, iconOnly, disabled, rel = disabled ? undefined : "prev", className, children, ...rest }: PaginationPrevProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("blip-box blip-pagination-prev", className)}
      {...arrowAttrs({ variant, tone, radius, iconOnly, disabled })}
      rel={rel}
      {...rest}
    >
      <span>{children}</span>
    </Tag>
  );
}) as PolymorphicComponent<"a", PaginationArrowOwnProps & IconOnly & Reachable>;

/**
 * On a page: a box with an upper-case label and a pixel chevron. `rel="next"` unless it is disabled.
 *
 *   <li><PaginationNext variant="ghost" href="?page=6">Next</PaginationNext></li>
 *
 * Renders `<a class="blip-box blip-pagination-next" rel="next"><span>…</span></a>`; with `as`, your router's link.
 */
export const PaginationNext = /*#__PURE__*/ forwardRef(function PaginationNext(
  { as: Tag = "a", variant, tone, radius, iconOnly, disabled, rel = disabled ? undefined : "next", className, children, ...rest }: PaginationNextProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("blip-box blip-pagination-next", className)}
      {...arrowAttrs({ variant, tone, radius, iconOnly, disabled })}
      rel={rel}
      {...rest}
    >
      <span>{children}</span>
    </Tag>
  );
}) as PolymorphicComponent<"a", PaginationArrowOwnProps & IconOnly & Reachable>;

/** Own props of {@link PaginationPage}. */
export interface PaginationPageOwnProps extends BoxProps {
  /** The page you are on: the accent, sitting in (outline: an accent-light fill). `aria-current="page"`. */
  current?: boolean;
}

/** Props for {@link PaginationPage}: a link's by default, or your router's link's with `as`. */
export type PaginationPageProps<T extends ElementType = "a"> = PolymorphicProps<T, PaginationPageOwnProps & Named>;

/**
 * A page: a square box with its number in tabular figures. Name it in full (`aria-label="Page 5"`, or a game's
 * "World 3"). Candy and soft pages rest in cream and the current one takes the accent; outline suits lists and tables.
 *
 *   <li><PaginationPage variant="outline" href="?page=5" aria-label="Page 5" current>5</PaginationPage></li>
 *
 * Renders `<a class="blip-box blip-pagination-page">`; with `as`, your router's link.
 */
export const PaginationPage = /*#__PURE__*/ forwardRef(function PaginationPage(
  { as: Tag = "a", variant, tone, radius, current: isCurrent, className, ...rest }: PolymorphicProps<ElementType, PaginationPageOwnProps>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("blip-box blip-pagination-page", className)}
      {...box({ variant, tone, radius })}
      aria-current={current(isCurrent)}
      {...rest}
    />
  );
}) as PolymorphicComponent<"a", PaginationPageOwnProps & Named>;

/** Props for {@link PaginationGap}. */
export type PaginationGapProps = Omit<NativeProps<"li">, "children">;

/**
 * Three pixel dots where pages are skipped. Decorative: hidden from screen readers.
 *
 *   <PaginationGap />
 *
 * Renders `<li class="blip-pagination-gap" aria-hidden="true">`.
 */
export const PaginationGap = /*#__PURE__*/ forwardRef<HTMLLIElement, PaginationGapProps>(function PaginationGap(
  { className, ...rest },
  ref,
) {
  return <li ref={ref} className={cx("blip-pagination-gap", className)} aria-hidden="true" {...rest} />;
});

/** Own props of {@link PaginationStatus}. */
export interface PaginationStatusOwnProps {
  /** The page you are on. */
  page: number | string;
  /** How many pages there are. */
  total: number | string;
  /** What a page is called, read before its number (a `blip-sr-only` span): "Page" by default, or "World". */
  label?: string;
  /** The word read between the numbers, in a `blip-sr-only` span: "of" by default. */
  of?: string;
}

/** Props for {@link PaginationStatus}. */
export type PaginationStatusProps = PaginationStatusOwnProps &
  Omit<NativeProps<"li", PaginationStatusOwnProps>, "children">;

/**
 * The compact "5 / 16", shown instead of the pages when there is no room for them (always, with the nav's
 * `compact`). Screen readers hear "Page 5 of 16".
 *
 *   <PaginationStatus page={5} total={16} />
 *   <PaginationStatus page={3} total={8} label="World" />
 *
 * Renders `<li class="blip-pagination-status"><span class="blip-sr-only">Page</span> 5 <span aria-hidden="true">/</span>
 * <span class="blip-sr-only">of</span> 16</li>`.
 */
export const PaginationStatus = /*#__PURE__*/ forwardRef<HTMLLIElement, PaginationStatusProps>(function PaginationStatus(
  { page, total, label = "Page", of = "of", className, ...rest },
  ref,
) {
  return (
    <li ref={ref} className={cx("blip-pagination-status", className)} {...rest}>
      <span className="blip-sr-only">{label}</span> {page} <span aria-hidden="true">/</span>
      <span className="blip-sr-only">{of}</span> {total}
    </li>
  );
});
