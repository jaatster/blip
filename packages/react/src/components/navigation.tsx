/**
 * Navigation: AppBar, Sidebar, Breadcrumbs, Pagination, ProgressSteps, BottomBar and SkipLink, and the parts that go
 * inside the Tabs, Menu and CommandPalette elements. CSS from @jaatster/blip-components (app-bar.css, sidebar.css,
 * breadcrumbs.css, pagination.css, progress-steps.css, bottom-bar.css, skip-link.css, tabs.css, menu.css,
 * command.css). A link to the page you are on takes `current` (`aria-current="page"`); list items with no class of
 * their own stay plain `<li>`s.
 */
import { forwardRef } from "react";
import type { CSSProperties, ElementType, ReactNode } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { box, cx, flag } from "../internal/props.js";
import type { BoxProps, NativeProps, Radius, Size, Tone, Variant } from "../internal/props.js";
import type { IconOnly } from "./actions.js";

/** A landmark, list or group needs a name: `aria-label`, or `aria-labelledby` pointing at its heading. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

/** A link that is off has nowhere to go: no `href`. */
type Reachable = { disabled?: false } | { disabled: true; href?: never };

const current = (on: boolean | undefined) => (on ? "page" : undefined);

// ------------------------------------------------------------------------------------------------------- app bar

/** Own props of {@link AppBar}. */
export interface AppBarOwnProps {
  /**
   * When the links fold behind the menu button: under 1024 px by default, `medium` under 600 px (a few short links),
   * `always`, or `never`. `data-collapse`.
   */
  collapse?: "medium" | "always" | "never";
  /** Stays at the top while the page scrolls. `data-sticky`. */
  sticky?: boolean;
  /** The bar's corners, 4 by default; 0 for a bar flush to the screen's edges. `data-pp-r`. */
  radius?: Radius;
}
/** Props for {@link AppBar}. */
export type AppBarProps = AppBarOwnProps & NativeProps<"header", AppBarOwnProps>;

/**
 * The top of an app or a site, on a panel: the brand, the main links, and actions at the end. When the bar gets
 * narrow the links fold behind a menu button: the same list, opened as a popover (a disclosure, no script). Put a
 * {@link SkipLink} before it.
 *
 *   <AppBar>
 *     <AppBarBrand href="/">…</AppBarBrand>
 *     <AppBarNav aria-label="Main">
 *       <AppBarToggle popoverTarget="main-links" iconOnly aria-label="Menu"><Icon name="menu" /></AppBarToggle>
 *       <AppBarLinks id="main-links">
 *         <li><AppBarLink href="/live" current>Live ops</AppBarLink></li>
 *         <li><AppBarLink href="/studio">Studio</AppBarLink></li>
 *       </AppBarLinks>
 *     </AppBarNav>
 *     <AppBarActions>…</AppBarActions>
 *   </AppBar>
 *
 * Renders `<header class="pp-box pp-app-bar">`, a size container (`pp-app-bar`): it folds by its own width.
 */
export const AppBar = /*#__PURE__*/ forwardRef<HTMLElement, AppBarProps>(function AppBar(
  { collapse, sticky, radius, className, ...rest },
  ref,
) {
  return (
    <header
      ref={ref}
      className={cx("pp-box pp-app-bar", className)}
      data-collapse={collapse}
      data-sticky={flag(sticky)}
      data-pp-r={radius}
      {...rest}
    />
  );
});

/** Props for {@link AppBarBrand}: a link's by default, or your router's link's with `as`. */
export type AppBarBrandProps<T extends ElementType = "a"> = PolymorphicProps<T, object>;

/**
 * A link home: an optional mark (an icon) and the wordmark in Pixel Bop, POP style. Under 400 px the wordmark drops
 * to scale 1; under 360 px a brand with a mark shows just the mark, and the wordmark stays the link's name.
 *
 *   <AppBarBrand href="/">
 *     <Icon name="star" />
 *     <span className="pp-display pp-pop" data-scale="2" data-pop="Questboard">Questboard</span>
 *   </AppBarBrand>
 *
 * Renders `<a class="pp-app-bar-brand">`; with `as`, your router's link.
 */
export const AppBarBrand = /*#__PURE__*/ forwardRef(function AppBarBrand(
  { as: Tag = "a", className, ...rest }: AppBarBrandProps<ElementType>,
  ref,
) {
  return <Tag ref={ref} className={cx("pp-app-bar-brand", className)} {...rest} />;
}) as PolymorphicComponent<"a", object>;

/** Props for {@link AppBarNav}. */
export type AppBarNavProps = Named & NativeProps<"nav">;

/**
 * The main links' landmark: the menu button, then the links. Name it.
 *
 *   <AppBarNav aria-label="Main">…</AppBarNav>
 *
 * Renders `<nav class="pp-app-bar-nav">`.
 */
export const AppBarNav = /*#__PURE__*/ forwardRef<HTMLElement, AppBarNavProps>(function AppBarNav({ className, ...rest }, ref) {
  return <nav ref={ref} className={cx("pp-app-bar-nav", className)} {...rest} />;
});

/** Own props of {@link AppBarToggle}. */
export interface AppBarToggleOwnProps {
  /** The links' id: the button opens and closes them (the browser gives it `aria-expanded`). `popovertarget`. */
  popoverTarget: string;
  /** The tier: ghost by default; outline for a button with a label. `data-variant`. */
  variant?: Variant;
  /** Just the icon, square: name it (`aria-label="Menu"`). `data-icon-only`. */
  iconOnly?: boolean;
}
/** Props for {@link AppBarToggle}. */
export type AppBarToggleProps = AppBarToggleOwnProps & IconOnly & NativeProps<"button", AppBarToggleOwnProps>;

/**
 * The menu button, shown only while the links are folded: it opens them as a panel under it. A button, not a menu:
 * the links stay plain links in a list.
 *
 *   <AppBarToggle popoverTarget="main-links" iconOnly aria-label="Menu"><Icon name="menu" /></AppBarToggle>
 *   <AppBarToggle popoverTarget="docs-links" variant="outline"><Icon name="menu" />Menu</AppBarToggle>
 *
 * Renders `<button class="pp-box pp-button pp-app-bar-toggle" type="button" data-variant="ghost" popovertarget>`.
 */
export const AppBarToggle = /*#__PURE__*/ forwardRef<HTMLButtonElement, AppBarToggleProps>(function AppBarToggle(
  { variant = "ghost", iconOnly, type = "button", className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx("pp-box pp-button pp-app-bar-toggle", className)}
      type={type}
      data-variant={variant}
      data-icon-only={flag(iconOnly)}
      {...rest}
    />
  );
});

/** Props for {@link AppBarLinks}. */
export type AppBarLinksProps = NativeProps<"ul">;

/**
 * The main links, each in an `<li>`: a row in the bar; folded, the same list opens from the menu button as a cream
 * panel (it is a `popover`). Give it the id the toggle names; on a bar that never folds, pass `popover={undefined}`.
 *
 *   <AppBarLinks id="main-links"><li><AppBarLink href="/live" current>Live ops</AppBarLink></li></AppBarLinks>
 *
 * Renders `<ul class="pp-box pp-app-bar-links" popover role="list">`.
 */
export const AppBarLinks = /*#__PURE__*/ forwardRef<HTMLUListElement, AppBarLinksProps>(function AppBarLinks(
  { className, ...rest },
  ref,
) {
  return <ul ref={ref} className={cx("pp-box pp-app-bar-links", className)} popover="" role="list" {...rest} />;
});

/** Own props of {@link AppBarLink}. */
export interface AppBarLinkOwnProps {
  /** The page you are on: sits in, an accent-light chip; it stays marked in the folded list. `aria-current="page"`. */
  current?: boolean;
}
/** Props for {@link AppBarLink}: a link's by default, or your router's link's with `as`. */
export type AppBarLinkProps<T extends ElementType = "a"> = PolymorphicProps<T, AppBarLinkOwnProps>;

/**
 * One of the main links: a ghost box, upper case. One or two words, the same links in the same order at every width.
 *
 *   <li><AppBarLink href="/live" current>Live ops</AppBarLink></li>
 *
 * Renders `<a class="pp-box pp-app-bar-link" data-variant="ghost">`; with `as`, your router's link.
 */
export const AppBarLink = /*#__PURE__*/ forwardRef(function AppBarLink(
  { as: Tag = "a", current: isCurrent, className, ...rest }: AppBarLinkProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("pp-box pp-app-bar-link", className)}
      data-variant="ghost"
      aria-current={current(isCurrent)}
      {...rest}
    />
  );
}) as PolymorphicComponent<"a", AppBarLinkOwnProps>;

/** Props for {@link AppBarActions}. */
export type AppBarActionsProps = NativeProps<"div">;

/**
 * Actions, pushed to the end of the bar: icon buttons with names, an account menu, one candy button at most.
 *
 *   <AppBarActions><Button variant="ghost" iconOnly aria-label="Search"><Icon name="search" /></Button></AppBarActions>
 *
 * Renders `<div class="pp-app-bar-actions">`.
 */
export const AppBarActions = /*#__PURE__*/ forwardRef<HTMLDivElement, AppBarActionsProps>(function AppBarActions(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("pp-app-bar-actions", className)} {...rest} />;
});

// ------------------------------------------------------------------------------------------------------- sidebar

/** Own props of {@link Sidebar}. */
export interface SidebarOwnProps {
  /** A framed panel: adds `pp-box` and `data-variant="panel"`. Leave it off for a sidebar on the page. */
  framed?: boolean;
  /** The rail: icons only, headings turn to rules, labels show beside items on hover and focus. `data-collapsed`. */
  collapsed?: boolean;
  /**
   * `auto`: a rail while the `pp-shell` container is under 1024 px, hidden under 600 px (where a bottom bar or the
   * app bar's menu takes over). `data-collapse`.
   */
  collapse?: "auto";
  /** The TV's pointer arrow beside the current page: it pokes for a few beats, then rests. `data-arrow`. */
  arrow?: boolean;
  /** The open width in pixels, 120 by default; keep it over 120 (narrower reads as the rail). `--pp-sidebar-width`. */
  width?: number;
}
/** Props for {@link Sidebar}. */
export type SidebarProps = SidebarOwnProps & Named & NativeProps<"nav", SidebarOwnProps>;

/**
 * An app's main navigation down the side: sections under small headings, items with icons and counts, groups that
 * fold open, the page you are on sitting in. No script: groups are `<details>`. Name the nav.
 *
 *   <Sidebar aria-label="Main" collapse="auto" arrow>
 *     <SidebarHeading id="nav-live">Live ops</SidebarHeading>
 *     <SidebarList aria-labelledby="nav-live">
 *       <li><SidebarItem href="/" current><Icon name="home" /><SidebarLabel>Overview</SidebarLabel></SidebarItem></li>
 *       <li>
 *         <SidebarGroup open>
 *           <SidebarItem as="summary"><Icon name="flag" /><SidebarLabel>Levels</SidebarLabel></SidebarItem>
 *           <SidebarList>…</SidebarList>
 *         </SidebarGroup>
 *       </li>
 *     </SidebarList>
 *   </Sidebar>
 *
 * Renders `<nav class="pp-sidebar">` (`<nav class="pp-box pp-sidebar" data-variant="panel">` when framed). Rail
 * labels reach outside it: do not clip a rail.
 */
export const Sidebar = /*#__PURE__*/ forwardRef<HTMLElement, SidebarProps>(function Sidebar(
  { framed, collapsed, collapse, arrow, width, className, style, ...rest },
  ref,
) {
  const sized = width === undefined ? style : { ...style, "--pp-sidebar-width": `calc(${width} * var(--pp-pixel))` };
  return (
    <nav
      ref={ref}
      className={cx(framed && "pp-box", "pp-sidebar", className)}
      data-variant={framed ? "panel" : undefined}
      data-collapsed={flag(collapsed)}
      data-collapse={collapse}
      data-arrow={flag(arrow)}
      style={sized as CSSProperties | undefined}
      {...rest}
    />
  );
});

/** Props for {@link SidebarHeading}. */
export type SidebarHeadingProps = NativeProps<"h2">;

/**
 * A section's small upper-case heading. Give it an id, and name the list after it with `aria-labelledby`. On the
 * rail it becomes a rule (still read).
 *
 *   <SidebarHeading id="nav-shop">Shop</SidebarHeading>
 *
 * Renders `<h2 class="pp-sidebar-heading">`.
 */
export const SidebarHeading = /*#__PURE__*/ forwardRef<HTMLHeadingElement, SidebarHeadingProps>(function SidebarHeading(
  { className, ...rest },
  ref,
) {
  return <h2 ref={ref} className={cx("pp-sidebar-heading", className)} {...rest} />;
});

/** Props for {@link SidebarList}. */
export type SidebarListProps = NativeProps<"ul">;

/**
 * A section's items, each in an `<li>`; inside a group, its indented items. Name a section's list by its heading.
 *
 *   <SidebarList aria-labelledby="nav-shop">…</SidebarList>
 *
 * Renders `<ul class="pp-sidebar-list" role="list">`.
 */
export const SidebarList = /*#__PURE__*/ forwardRef<HTMLUListElement, SidebarListProps>(function SidebarList(
  { className, ...rest },
  ref,
) {
  return <ul ref={ref} className={cx("pp-sidebar-list", className)} role="list" {...rest} />;
});

/** Own props of {@link SidebarItem}. */
export interface SidebarItemOwnProps {
  /** The page you are on: sits in, a bold label, and the arrow with the sidebar's `arrow`. `aria-current="page"`. */
  current?: boolean;
  /** Off: dithered and muted, announced as a dimmed link. `role="link"` and `aria-disabled="true"`, with no `href`. */
  disabled?: boolean;
  /** Corner radius in pixels, 3 by default. `data-pp-r`. */
  radius?: Radius;
}
/** Props for {@link SidebarItem}: a link's by default, a summary's with `as="summary"`. */
export type SidebarItemProps<T extends ElementType = "a"> = PolymorphicProps<T, SidebarItemOwnProps & Reachable>;

/**
 * An item: a ghost box with an icon, a {@link SidebarLabel}, and an optional {@link SidebarBadge}. Give every item an
 * icon if the sidebar can become a rail. As a group's `<summary>` (`as="summary"`) it opens the group, and gets the
 * chevron; it is never a link.
 *
 *   <li><SidebarItem href="/players"><Icon name="users" /><SidebarLabel>Players</SidebarLabel></SidebarItem></li>
 *   <SidebarItem as="summary"><Icon name="settings" /><SidebarLabel>Settings</SidebarLabel></SidebarItem>
 *
 * Renders `<a class="pp-box pp-sidebar-item" data-variant="ghost">`.
 */
export const SidebarItem = /*#__PURE__*/ forwardRef(function SidebarItem(
  { as: Tag = "a", current: isCurrent, disabled, radius, className, ...rest }: SidebarItemProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("pp-box pp-sidebar-item", className)}
      data-variant="ghost"
      data-pp-r={radius}
      role={disabled ? "link" : undefined}
      aria-disabled={disabled ? true : undefined}
      aria-current={current(isCurrent)}
      {...rest}
    />
  );
}) as PolymorphicComponent<"a", SidebarItemOwnProps & Reachable>;

/** Props for {@link SidebarLabel}. */
export type SidebarLabelProps = NativeProps<"span">;

/**
 * An item's name, cut with an ellipsis. Keep it: it carries the group chevron and the arrow, and names the item on
 * the rail, where it shows beside the item on hover and focus.
 *
 *   <SidebarLabel>Players</SidebarLabel>
 *
 * Renders `<span class="pp-sidebar-label">`.
 */
export const SidebarLabel = /*#__PURE__*/ forwardRef<HTMLSpanElement, SidebarLabelProps>(function SidebarLabel(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("pp-sidebar-label", className)} {...rest} />;
});

/** Own props of {@link SidebarBadge}. */
export type SidebarBadgeOwnProps = Pick<BoxProps, "tone" | "radius">;
/** Props for {@link SidebarBadge}. */
export type SidebarBadgeProps = SidebarBadgeOwnProps & NativeProps<"span", SidebarBadgeOwnProps>;

/**
 * A count at the end of an item: a soft box; on the rail, a dot. Write "999+" above 999, and add words for screen
 * readers.
 *
 *   <SidebarBadge tone="danger">5<span className="pp-sr-only"> refunds to check</span></SidebarBadge>
 *
 * Renders `<span class="pp-box pp-sidebar-badge">`.
 */
export const SidebarBadge = /*#__PURE__*/ forwardRef<HTMLSpanElement, SidebarBadgeProps>(function SidebarBadge(
  { tone, radius, className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("pp-box pp-sidebar-badge", className)} {...box({ tone, radius })} {...rest} />;
});

/** Props for {@link SidebarGroup}. */
export type SidebarGroupProps = NativeProps<"details">;

/**
 * A group that folds open: a native disclosure. Its summary is a {@link SidebarItem} `as="summary"`, then its
 * {@link SidebarList}, indented. Open the group that holds the current page; nest one level at most.
 *
 *   <SidebarGroup open>
 *     <SidebarItem as="summary"><Icon name="flag" /><SidebarLabel>Levels</SidebarLabel></SidebarItem>
 *     <SidebarList>…</SidebarList>
 *   </SidebarGroup>
 *
 * Renders `<details class="pp-sidebar-group">`.
 */
export const SidebarGroup = /*#__PURE__*/ forwardRef<HTMLDetailsElement, SidebarGroupProps>(function SidebarGroup(
  { className, ...rest },
  ref,
) {
  return <details ref={ref} className={cx("pp-sidebar-group", className)} {...rest} />;
});

// --------------------------------------------------------------------------------------------------- breadcrumbs

/** Own props of {@link Breadcrumbs}. */
export interface BreadcrumbsOwnProps {
  /** 12-, 14- (default) or 16-pixel crumbs; `sm` for dense headers and dashboards. `data-size`. */
  size?: Size;
}
/** Props for {@link Breadcrumbs}. */
export type BreadcrumbsProps = BreadcrumbsOwnProps & NativeProps<"nav", BreadcrumbsOwnProps>;

/**
 * Where this page sits: links back up the trail, pixel chevrons between them (drawn by CSS, not read out), and the
 * page you are on at the end. For deep structures; never the main navigation. Named "Breadcrumb" unless you pass
 * `aria-label` or `aria-labelledby`.
 *
 *   <Breadcrumbs>
 *     <BreadcrumbsList>
 *       <li><BreadcrumbsLink href="/">Home</BreadcrumbsLink></li>
 *       <li><BreadcrumbsLink href="/worlds/2/3" current>Level 2-3</BreadcrumbsLink></li>
 *     </BreadcrumbsList>
 *   </Breadcrumbs>
 *
 * Renders `<nav class="pp-breadcrumbs" aria-label="Breadcrumb">`.
 */
export const Breadcrumbs = /*#__PURE__*/ forwardRef<HTMLElement, BreadcrumbsProps>(function Breadcrumbs(
  {
    size,
    "aria-labelledby": labelledBy,
    "aria-label": label = labelledBy === undefined ? "Breadcrumb" : undefined,
    className,
    ...rest
  },
  ref,
) {
  return (
    <nav
      ref={ref}
      className={cx("pp-breadcrumbs", className)}
      data-size={size}
      aria-label={label}
      aria-labelledby={labelledBy}
      {...rest}
    />
  );
});

/** Props for {@link BreadcrumbsList}. */
export type BreadcrumbsListProps = NativeProps<"ol">;

/**
 * The trail: an ordered list, each crumb in an `<li>`; it wraps onto more lines when it must.
 *
 *   <BreadcrumbsList>…</BreadcrumbsList>
 *
 * Renders `<ol class="pp-breadcrumbs-list">`.
 */
export const BreadcrumbsList = /*#__PURE__*/ forwardRef<HTMLOListElement, BreadcrumbsListProps>(function BreadcrumbsList(
  { className, ...rest },
  ref,
) {
  return <ol ref={ref} className={cx("pp-breadcrumbs-list", className)} {...rest} />;
});

/** Own props of {@link BreadcrumbsLink}. */
export interface BreadcrumbsLinkOwnProps {
  /** The page you are on, the last crumb: a soft chip, ink bold text. `aria-current="page"`. */
  current?: boolean;
  /** Corner radius in pixels, 3 by default. `data-pp-r`. */
  radius?: Radius;
}
/** Props for {@link BreadcrumbsLink}: a link's by default, a button's with `as="button"`. */
export type BreadcrumbsLinkProps<T extends ElementType = "a"> = PolymorphicProps<T, BreadcrumbsLinkOwnProps>;

/**
 * A crumb: a ghost box, a link in the accent's text colour. A label in a `<span>` is cut to `--pp-breadcrumbs-max`
 * with an ellipsis (its whole text stays the name); an icon-only crumb needs `aria-label`. As a button
 * (`as="button"`, `type="button"` by default) it opens the {@link MenuList} that folds a long trail's middle.
 *
 *   <li><BreadcrumbsLink href="/worlds/2/3" current>Level 2-3</BreadcrumbsLink></li>
 *   <li>
 *     <Menu>
 *       <BreadcrumbsLink as="button" aria-label="3 more pages"><Icon name="more-horizontal" /></BreadcrumbsLink>
 *       <MenuList aria-label="More pages">…</MenuList>
 *     </Menu>
 *   </li>
 *
 * Renders `<a class="pp-box pp-breadcrumbs-link" data-variant="ghost">`.
 */
export const BreadcrumbsLink = /*#__PURE__*/ forwardRef(function BreadcrumbsLink(
  { as: Tag = "a", current: isCurrent, radius, className, ...rest }: BreadcrumbsLinkProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("pp-box pp-breadcrumbs-link", className)}
      type={Tag === "button" ? "button" : undefined}
      data-variant="ghost"
      data-pp-r={radius}
      aria-current={current(isCurrent)}
      {...rest}
    />
  );
}) as PolymorphicComponent<"a", BreadcrumbsLinkOwnProps>;

// ---------------------------------------------------------------------------------------------------- pagination

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
 * Renders `<nav class="pp-pagination">`, a size container that takes the width it is given.
 */
export const Pagination = /*#__PURE__*/ forwardRef<HTMLElement, PaginationProps>(function Pagination(
  { size, compact, className, ...rest },
  ref,
) {
  return (
    <nav ref={ref} className={cx("pp-pagination", className)} data-size={size} data-compact={flag(compact)} {...rest} />
  );
});

/** Props for {@link PaginationList}. */
export type PaginationListProps = NativeProps<"ul">;

/**
 * The row: previous, the pages (each link in an `<li>`), gaps, the status, next.
 *
 *   <PaginationList>…</PaginationList>
 *
 * Renders `<ul class="pp-pagination-list" role="list">`.
 */
export const PaginationList = /*#__PURE__*/ forwardRef<HTMLUListElement, PaginationListProps>(function PaginationList(
  { className, ...rest },
  ref,
) {
  return <ul ref={ref} className={cx("pp-pagination-list", className)} role="list" {...rest} />;
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
 * Renders `<a class="pp-box pp-pagination-prev" rel="prev"><span>…</span></a>`; with `as`, your router's link.
 */
export const PaginationPrev = /*#__PURE__*/ forwardRef(function PaginationPrev(
  { as: Tag = "a", variant, tone, radius, iconOnly, disabled, rel = disabled ? undefined : "prev", className, children, ...rest }: PaginationPrevProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("pp-box pp-pagination-prev", className)}
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
 * Renders `<a class="pp-box pp-pagination-next" rel="next"><span>…</span></a>`; with `as`, your router's link.
 */
export const PaginationNext = /*#__PURE__*/ forwardRef(function PaginationNext(
  { as: Tag = "a", variant, tone, radius, iconOnly, disabled, rel = disabled ? undefined : "next", className, children, ...rest }: PaginationNextProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("pp-box pp-pagination-next", className)}
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
 * Renders `<a class="pp-box pp-pagination-page">`; with `as`, your router's link.
 */
export const PaginationPage = /*#__PURE__*/ forwardRef(function PaginationPage(
  { as: Tag = "a", variant, tone, radius, current: isCurrent, className, ...rest }: PolymorphicProps<ElementType, PaginationPageOwnProps>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("pp-box pp-pagination-page", className)}
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
 * Renders `<li class="pp-pagination-gap" aria-hidden="true">`.
 */
export const PaginationGap = /*#__PURE__*/ forwardRef<HTMLLIElement, PaginationGapProps>(function PaginationGap(
  { className, ...rest },
  ref,
) {
  return <li ref={ref} className={cx("pp-pagination-gap", className)} aria-hidden="true" {...rest} />;
});

/** Own props of {@link PaginationStatus}. */
export interface PaginationStatusOwnProps {
  /** The page you are on. */
  page: number | string;
  /** How many pages there are. */
  total: number | string;
  /** What a page is called, read before its number (a `pp-sr-only` span): "Page" by default, or "World". */
  label?: string;
  /** The word read between the numbers, in a `pp-sr-only` span: "of" by default. */
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
 * Renders `<li class="pp-pagination-status"><span class="pp-sr-only">Page</span> 5 <span aria-hidden="true">/</span>
 * <span class="pp-sr-only">of</span> 16</li>`.
 */
export const PaginationStatus = /*#__PURE__*/ forwardRef<HTMLLIElement, PaginationStatusProps>(function PaginationStatus(
  { page, total, label = "Page", of = "of", className, ...rest },
  ref,
) {
  return (
    <li ref={ref} className={cx("pp-pagination-status", className)} {...rest}>
      <span className="pp-sr-only">{label}</span> {page} <span aria-hidden="true">/</span>
      <span className="pp-sr-only">{of}</span> {total}
    </li>
  );
});

// ------------------------------------------------------------------------------------------------ progress steps

/** Own props of {@link ProgressSteps}. */
export interface ProgressStepsOwnProps {
  /** `vertical`: down the side, hints beside the steps (checklists, long names). `data-orientation`. */
  orientation?: "horizontal" | "vertical";
  /** The TV's pointer arrow over the current step (beside it, down the side) bobs a few beats. `data-arrow`. */
  arrow?: boolean;
}
/** Props for {@link ProgressSteps}. */
export type ProgressStepsProps = ProgressStepsOwnProps & NativeProps<"div", ProgressStepsOwnProps>;

/**
 * The steps of a task in order, for wizards, checkouts and first-run checklists: done steps green with a check, the
 * current step sitting in, upcoming ones in outline, and a line joining them. Done steps can be links back (a plain
 * `<a>` around the marker and label); the current and upcoming steps are text.
 *
 *   <ProgressSteps arrow>
 *     <ProgressStepsList aria-label="Checkout">
 *       <ProgressStepsItem done>
 *         <a href="/checkout/basket">
 *           <ProgressStepsMarker>1</ProgressStepsMarker>
 *           <ProgressStepsLabel>Basket<span className="pp-sr-only">, done</span></ProgressStepsLabel>
 *         </a>
 *       </ProgressStepsItem>
 *       <ProgressStepsItem current>
 *         <ProgressStepsMarker>2</ProgressStepsMarker>
 *         <ProgressStepsLabel>Payment</ProgressStepsLabel>
 *         <ProgressStepsHint>Card or coins</ProgressStepsHint>
 *       </ProgressStepsItem>
 *     </ProgressStepsList>
 *   </ProgressSteps>
 *
 * Renders `<div class="pp-progress-steps">`, a size container: under 480 px the hints step aside, under 300 px only
 * the current step keeps its label on screen.
 */
export const ProgressSteps = /*#__PURE__*/ forwardRef<HTMLDivElement, ProgressStepsProps>(function ProgressSteps(
  { orientation, arrow, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx("pp-progress-steps", className)}
      data-orientation={orientation}
      data-arrow={flag(arrow)}
      {...rest}
    />
  );
});

/** Props for {@link ProgressStepsList}. */
export type ProgressStepsListProps = Named & NativeProps<"ol">;

/**
 * The steps: an ordered list with a name, so each step is announced with its position.
 *
 *   <ProgressStepsList aria-label="Checkout">…</ProgressStepsList>
 *
 * Renders `<ol class="pp-progress-steps-list">`.
 */
export const ProgressStepsList = /*#__PURE__*/ forwardRef<HTMLOListElement, ProgressStepsListProps>(function ProgressStepsList(
  { className, ...rest },
  ref,
) {
  return <ol ref={ref} className={cx("pp-progress-steps-list", className)} {...rest} />;
});

/** Own props of {@link ProgressStepsItem}. */
export interface ProgressStepsItemOwnProps {
  /** Finished: green candy and a check, a solid line on. Say so in its label too (", done"). `data-state="done"`. */
  done?: boolean;
  /** The step you are on: sits in, in the accent (or its marker's tone). `aria-current="step"`. */
  current?: boolean;
}
/** Props for {@link ProgressStepsItem}. */
export type ProgressStepsItemProps = ProgressStepsItemOwnProps & NativeProps<"li", ProgressStepsItemOwnProps>;

/**
 * A step: its marker, its label and an optional hint (in a link back, for a done step). Upcoming steps take neither
 * `done` nor `current`.
 *
 *   <ProgressStepsItem current>
 *     <ProgressStepsMarker>2</ProgressStepsMarker><ProgressStepsLabel>Payment</ProgressStepsLabel>
 *   </ProgressStepsItem>
 *
 * Renders `<li class="pp-progress-steps-item">`.
 */
export const ProgressStepsItem = /*#__PURE__*/ forwardRef<HTMLLIElement, ProgressStepsItemProps>(function ProgressStepsItem(
  { done, current: isCurrent, className, ...rest },
  ref,
) {
  return (
    <li
      ref={ref}
      className={cx("pp-progress-steps-item", className)}
      data-state={done ? "done" : undefined}
      aria-current={isCurrent ? "step" : undefined}
      {...rest}
    />
  );
});

/** Own props of {@link ProgressStepsMarker}. */
export type ProgressStepsMarkerOwnProps = Pick<BoxProps, "tone" | "radius">;
/** Props for {@link ProgressStepsMarker}. */
export type ProgressStepsMarkerProps = ProgressStepsMarkerOwnProps & NativeProps<"span", ProgressStepsMarkerOwnProps>;

/**
 * A step's 14-pixel box with its number, counted from 1; a check replaces the number once the step is done. Its
 * tone colours the current step.
 *
 *   <ProgressStepsMarker tone="pink">1</ProgressStepsMarker>
 *
 * Renders `<span class="pp-box pp-progress-steps-marker">`.
 */
export const ProgressStepsMarker = /*#__PURE__*/ forwardRef<HTMLSpanElement, ProgressStepsMarkerProps>(function ProgressStepsMarker(
  { tone, radius, className, ...rest },
  ref,
) {
  return (
    <span ref={ref} className={cx("pp-box pp-progress-steps-marker", className)} {...box({ tone, radius })} {...rest} />
  );
});

/** Props for {@link ProgressStepsLabel}. */
export type ProgressStepsLabelProps = NativeProps<"span">;

/**
 * A step's name, upper case and bold: one or two words.
 *
 *   <ProgressStepsLabel>Basket<span className="pp-sr-only">, done</span></ProgressStepsLabel>
 *
 * Renders `<span class="pp-progress-steps-label">`.
 */
export const ProgressStepsLabel = /*#__PURE__*/ forwardRef<HTMLSpanElement, ProgressStepsLabelProps>(function ProgressStepsLabel(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("pp-progress-steps-label", className)} {...rest} />;
});

/** Props for {@link ProgressStepsHint}. */
export type ProgressStepsHintProps = NativeProps<"span">;

/**
 * An optional short phrase under a step's label (beside it, down the side).
 *
 *   <ProgressStepsHint>Card or coins</ProgressStepsHint>
 *
 * Renders `<span class="pp-progress-steps-hint">`.
 */
export const ProgressStepsHint = /*#__PURE__*/ forwardRef<HTMLSpanElement, ProgressStepsHintProps>(function ProgressStepsHint(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("pp-progress-steps-hint", className)} {...rest} />;
});

// ---------------------------------------------------------------------------------------------------- bottom bar

/** Own props of {@link BottomBar}. */
export interface BottomBarOwnProps {
  /** `auto`: hidden while the `pp-shell` container is 600 px or wider (the sidebar takes over). `data-collapse`. */
  collapse?: "auto";
  /** Corner radius in pixels, 5 by default. `data-pp-r`. */
  radius?: Radius;
}
/** Props for {@link BottomBar}. */
export type BottomBarProps = BottomBarOwnProps & Named & NativeProps<"nav", BottomBarOwnProps>;

/**
 * The phone's way round an app: three to five destinations, an icon over a label, the current one sitting in. It
 * sticks to the foot of the screen, clear of the home indicator: put it last, after the content. Name it; when it
 * shares the page with a sidebar for the same destinations, give them the same name.
 *
 *   <BottomBar aria-label="Main" collapse="auto">
 *     <BottomBarList>
 *       <li>
 *         <BottomBarItem href="/" current><Icon name="home" /><BottomBarLabel>Today</BottomBarLabel></BottomBarItem>
 *       </li>
 *       <li>
 *         <BottomBarItem href="/inbox">
 *           <Icon name="inbox" /><BottomBarLabel>Inbox</BottomBarLabel>
 *           <BottomBarBadge tone="danger">3<span className="pp-sr-only"> new</span></BottomBarBadge>
 *         </BottomBarItem>
 *       </li>
 *     </BottomBarList>
 *   </BottomBar>
 *
 * Renders `<nav class="pp-box pp-bottom-bar">`.
 */
export const BottomBar = /*#__PURE__*/ forwardRef<HTMLElement, BottomBarProps>(function BottomBar(
  { collapse, radius, className, ...rest },
  ref,
) {
  return (
    <nav
      ref={ref}
      className={cx("pp-box pp-bottom-bar", className)}
      data-collapse={collapse}
      data-pp-r={radius}
      {...rest}
    />
  );
});

/** Props for {@link BottomBarList}. */
export type BottomBarListProps = NativeProps<"ul">;

/**
 * The destinations, each in an `<li>`, sharing the width.
 *
 *   <BottomBarList>…</BottomBarList>
 *
 * Renders `<ul class="pp-bottom-bar-list" role="list">`.
 */
export const BottomBarList = /*#__PURE__*/ forwardRef<HTMLUListElement, BottomBarListProps>(function BottomBarList(
  { className, ...rest },
  ref,
) {
  return <ul ref={ref} className={cx("pp-bottom-bar-list", className)} role="list" {...rest} />;
});

/** Own props of {@link BottomBarItem}. */
export interface BottomBarItemOwnProps {
  /** The destination you are on: sits in, an accent-light chip with an ink label. `aria-current="page"`. */
  current?: boolean;
  /** Corner radius in pixels, 4 by default. `data-pp-r`. */
  radius?: Radius;
}
/** Props for {@link BottomBarItem}: a link's by default, or your router's link's with `as`. */
export type BottomBarItemProps<T extends ElementType = "a"> = PolymorphicProps<T, BottomBarItemOwnProps>;

/**
 * A destination: a ghost box, a 12 x 12 icon over a small upper-case {@link BottomBarLabel} (always visible; the icon
 * is decorative), at least 26 pixels high.
 *
 *   <li><BottomBarItem href="/" current><Icon name="home" /><BottomBarLabel>Today</BottomBarLabel></BottomBarItem></li>
 *
 * Renders `<a class="pp-box pp-bottom-bar-item" data-variant="ghost">`; with `as`, your router's link.
 */
export const BottomBarItem = /*#__PURE__*/ forwardRef(function BottomBarItem(
  { as: Tag = "a", current: isCurrent, radius, className, ...rest }: BottomBarItemProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("pp-box pp-bottom-bar-item", className)}
      data-variant="ghost"
      data-pp-r={radius}
      aria-current={current(isCurrent)}
      {...rest}
    />
  );
}) as PolymorphicComponent<"a", BottomBarItemOwnProps>;

/** Props for {@link BottomBarLabel}. */
export type BottomBarLabelProps = NativeProps<"span">;

/**
 * A destination's name: one word, cut with an ellipsis if it is too long.
 *
 *   <BottomBarLabel>Inbox</BottomBarLabel>
 *
 * Renders `<span class="pp-bottom-bar-label">`.
 */
export const BottomBarLabel = /*#__PURE__*/ forwardRef<HTMLSpanElement, BottomBarLabelProps>(function BottomBarLabel(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("pp-bottom-bar-label", className)} {...rest} />;
});

/** Own props of {@link BottomBarBadge}. */
export interface BottomBarBadgeOwnProps {
  /** Its colour: accent by default, `danger` for things that need attention. `data-tone`. */
  tone?: Tone;
  /** A dot instead of a count ("something new"); keep words for screen readers in it. `data-dot`. */
  dot?: boolean;
}
/** Props for {@link BottomBarBadge}. */
export type BottomBarBadgeProps = BottomBarBadgeOwnProps & NativeProps<"span", BottomBarBadgeOwnProps>;

/**
 * A count on the corner of an item's icon: a small candy box. Add words for screen readers.
 *
 *   <BottomBarBadge tone="danger">3<span className="pp-sr-only"> new</span></BottomBarBadge>
 *   <BottomBarBadge tone="danger" dot><span className="pp-sr-only">, new</span></BottomBarBadge>
 *
 * Renders `<span class="pp-box pp-bottom-bar-badge">`.
 */
export const BottomBarBadge = /*#__PURE__*/ forwardRef<HTMLSpanElement, BottomBarBadgeProps>(function BottomBarBadge(
  { tone, dot, className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cx("pp-box pp-bottom-bar-badge", className)}
      data-tone={tone}
      data-dot={flag(dot)}
      {...rest}
    />
  );
});

// ----------------------------------------------------------------------------------------------------- skip link

/** Own props of {@link SkipLink}. */
export interface SkipLinkOwnProps extends Pick<BoxProps, "tone" | "radius"> {
  /** The main landmark's id (`#main`); give the target `tabIndex={-1}` so focus lands there. `href`. */
  href: string;
  /** Where it goes, in words: "Skip to content", not "Skip". */
  children: ReactNode;
}
/** Props for {@link SkipLink}: a link's by default, or your router's link's with `as`. */
export type SkipLinkProps<T extends ElementType = "a"> = PolymorphicProps<T, SkipLinkOwnProps>;

/**
 * The first stop for keyboard users: out of sight until it takes focus, then a candy chip pops in at the top-left
 * corner, over everything, and takes them past the navigation. Put it first in `<body>`, before the app bar.
 *
 *   <SkipLink href="#main">Skip to content</SkipLink>
 *
 * Renders `<a class="pp-box pp-skip-link">`; with `as`, your router's link.
 */
export const SkipLink = /*#__PURE__*/ forwardRef(function SkipLink(
  { as: Tag = "a", tone, radius, className, ...rest }: PolymorphicProps<ElementType, Partial<SkipLinkOwnProps>>,
  ref,
) {
  return <Tag ref={ref} className={cx("pp-box pp-skip-link", className)} {...box({ tone, radius })} {...rest} />;
}) as PolymorphicComponent<"a", SkipLinkOwnProps>;

// ---------------------------------------------------------------------------------------------- tabs (pp-tabs)

/** Props for {@link TabList}. */
export type TabListProps = Named & NativeProps<"div">;

/**
 * The row of tabs, first inside `<Tabs>`, which wires the ids, keeps one tab in the tab order, moves with the arrow
 * keys and shows the selected panel. Name it. `aria-orientation="vertical"` puts the tabs down the side. Tabs and
 * panels rendered later (after data arrives) are wired as they come.
 *
 *   <Tabs variant="outline" value={tab} onChange={(e) => setTab(e.detail.value)}>
 *     <TabList aria-label="Settings">
 *       <Tab variant="outline" value="general" selected>General</Tab>
 *       <Tab variant="outline" value="sound">Sound</Tab>
 *     </TabList>
 *     <TabPanel>…</TabPanel>
 *     <TabPanel hidden>…</TabPanel>
 *   </Tabs>
 *
 * Renders `<div class="pp-tabs-list" role="tablist">`.
 */
export const TabList = /*#__PURE__*/ forwardRef<HTMLDivElement, TabListProps>(function TabList({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("pp-tabs-list", className)} role="tablist" {...rest} />;
});

/** Own props of {@link Tab}. */
export interface TabOwnProps {
  /**
   * The tier matching the Tabs' variant: none (candy), soft, outline, or ghost for underline tabs; `<Tabs>` fills it
   * in when it is missing. `data-variant`.
   */
  variant?: Variant;
  /** A tab that keeps its own colour (inventory categories); it still sits in when selected. `data-tone`. */
  tone?: Tone;
  /** Corner radius in pixels: 4 (sm 3, underline 2) by default. `data-pp-r`. */
  radius?: Radius;
  /**
   * The tab whose panel shows: it sits in. Always written (`"false"` with `tabindex="-1"` on the others, so one tab
   * is in the tab order); `<Tabs>` keeps both in step as the person moves. `aria-selected`.
   */
  selected?: boolean;
  /** What `<Tabs>` reports as `detail.value` and selects by its `value` (the label otherwise). `data-value`. */
  value?: string;
}
/** Props for {@link Tab}. */
export type TabProps = TabOwnProps & NativeProps<"button", TabOwnProps>;

/**
 * A tab: a candy box with an upper-case label (an icon before it or a muted count after it are fine). Its size
 * comes from the Tabs' `size`. `aria-disabled="true"` turns it off; the arrow keys skip it.
 *
 *   <Tab variant="outline" selected>General</Tab>
 *   <Tab variant="ghost">Reports <span className="pp-muted">12</span></Tab>
 *
 * Renders `<button class="pp-box pp-tab" type="button" role="tab" aria-selected>`.
 */
export const Tab = /*#__PURE__*/ forwardRef<HTMLButtonElement, TabProps>(function Tab(
  { variant, tone, radius, selected = false, value, type = "button", className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx("pp-box pp-tab", className)}
      type={type}
      {...box({ variant, tone, radius })}
      data-value={value}
      role="tab"
      aria-selected={selected}
      tabIndex={selected ? undefined : -1}
      {...rest}
    />
  );
});

/** Own props of {@link TabPanel}. */
export interface TabPanelOwnProps {
  /** A framed panel: adds `pp-box` and `data-variant="panel"`. */
  framed?: boolean;
}
/** Props for {@link TabPanel}: a div's by default, or another element's with `as`. */
export type TabPanelProps<T extends ElementType = "div"> = PolymorphicProps<T, TabPanelOwnProps>;

/**
 * A tab's panel, in the same order as the tabs (or paired by `aria-controls`). Hide all but the selected one with
 * `hidden`; `<Tabs>` shows the selected one and makes each focusable.
 *
 *   <TabPanel as="section" framed hidden>…</TabPanel>
 *
 * Renders `<div class="pp-tabs-panel" role="tabpanel">` (`class="pp-box pp-tabs-panel" data-variant="panel"` framed).
 */
export const TabPanel = /*#__PURE__*/ forwardRef(function TabPanel(
  { as: Tag = "div", framed, className, ...rest }: TabPanelProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx(framed && "pp-box", "pp-tabs-panel", className)}
      data-variant={framed ? "panel" : undefined}
      role="tabpanel"
      {...rest}
    />
  );
}) as PolymorphicComponent<"div", TabPanelOwnProps>;

// ---------------------------------------------------------------------------------------------- menu (pp-menu)

/** Own props of {@link MenuList}. */
export interface MenuListOwnProps {
  /** Corner radius in pixels, 4 by default. `data-pp-r`. */
  radius?: Radius;
}
/** Props for {@link MenuList}. */
export type MenuListProps = MenuListOwnProps & Named & NativeProps<"div", MenuListOwnProps>;

/**
 * The menu: a cream panel and a native popover that pops in under its button, inside `<Menu>` after the button.
 * `<Menu>` wires the button, adds the keyboard and returns focus. Name it.
 *
 *   <Menu>
 *     <Button variant="soft">Level</Button>
 *     <MenuList aria-label="Level">
 *       <MenuItem value="duplicate" aria-keyshortcuts="Control+D">
 *         <Icon name="copy" /><MenuLabel>Duplicate</MenuLabel>
 *         <MenuShortcut><kbd className="pp-box pp-keycap" data-size="sm">Ctrl</kbd>…</MenuShortcut>
 *       </MenuItem>
 *       <MenuSeparator />
 *       <MenuItem kind="checkbox" checked={grid}><MenuLabel>Grid</MenuLabel></MenuItem>
 *       <MenuItem tone="danger"><MenuLabel>Delete level</MenuLabel></MenuItem>
 *     </MenuList>
 *   </Menu>
 *
 * Renders `<div class="pp-box pp-menu-list pp-pop-in" role="menu" popover>`. A submenu is a `<Menu>` in the list,
 * its button a {@link MenuItem}.
 */
export const MenuList = /*#__PURE__*/ forwardRef<HTMLDivElement, MenuListProps>(function MenuList(
  { radius, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx("pp-box pp-menu-list pp-pop-in", className)}
      data-pp-r={radius}
      role="menu"
      popover=""
      {...rest}
    />
  );
});

/** Own props of {@link MenuItem}. */
export interface MenuItemOwnProps {
  /**
   * An action (`item`, the default: `menuitem`), or a `checkbox` or `radio` item (`menuitemcheckbox`,
   * `menuitemradio`) with a check or a dot in a gutter. Radio items pick one within their {@link MenuGroup}. `role`.
   */
  kind?: "item" | "checkbox" | "radio";
  /** A checkbox or radio item's state: a check, or a dot. Always written for those, not for actions. `aria-checked`. */
  checked?: boolean;
  /** A destructive item: red text until it is focused. Confirm what it does, and put it last. `data-tone`. */
  tone?: "danger";
  /** What `pp-action` reports as `detail.value` (the label otherwise), so code need not read labels. `data-value`. */
  value?: string;
  /** Corner radius in pixels, 3 by default. `data-pp-r`. */
  radius?: Radius;
}
/** Checkbox and radio items have a state; actions do not. */
type MenuItemKind = { kind?: "item"; checked?: never } | { kind: "checkbox" | "radio"; checked: boolean };
/** Props for {@link MenuItem}: a button's by default, a link's with `as="a"`. */
export type MenuItemProps<T extends ElementType = "button"> = PolymorphicProps<T, MenuItemOwnProps & MenuItemKind>;

/**
 * An item: just its text at rest, the yellow FOCUS row while focused. An optional icon, then a {@link MenuLabel}
 * (keep it), then an optional {@link MenuShortcut}; announce a shortcut with `aria-keyshortcuts`.
 * `aria-disabled="true"` turns it off (say why in the label). As the button of a nested `<Menu>` it opens a
 * submenu (`<Menu>` adds `aria-haspopup="menu"`, which draws the chevron).
 *
 *   <MenuItem value="duplicate"><Icon name="copy" /><MenuLabel>Duplicate</MenuLabel></MenuItem>
 *   <MenuItem kind="radio" checked={sort === "name"} value="name"><MenuLabel>Name</MenuLabel></MenuItem>
 *   <MenuItem as="a" href="/profile"><MenuLabel>Profile</MenuLabel></MenuItem>
 *
 * Renders `<button class="pp-box pp-menu-item" type="button" role="menuitem">`.
 */
export const MenuItem = /*#__PURE__*/ forwardRef(function MenuItem(
  { as: Tag = "button", kind, checked, tone, value, radius, className, ...rest }: MenuItemProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("pp-box pp-menu-item", className)}
      type={Tag === "button" ? "button" : undefined}
      role={kind === "checkbox" ? "menuitemcheckbox" : kind === "radio" ? "menuitemradio" : "menuitem"}
      aria-checked={checked}
      data-tone={tone}
      data-pp-r={radius}
      data-value={value}
      {...rest}
    />
  );
}) as PolymorphicComponent<"button", MenuItemOwnProps & MenuItemKind>;

/** Props for {@link MenuLabel}. */
export type MenuLabelProps = NativeProps<"span">;

/**
 * An item's words. It carries the check or dot and the submenu chevron, and typeahead matches it: keep it. Start with
 * a verb, sentence case.
 *
 *   <MenuLabel>Export as PNG</MenuLabel>
 *
 * Renders `<span class="pp-menu-label">`.
 */
export const MenuLabel = /*#__PURE__*/ forwardRef<HTMLSpanElement, MenuLabelProps>(function MenuLabel({ className, ...rest }, ref) {
  return <span ref={ref} className={cx("pp-menu-label", className)} {...rest} />;
});

/** Props for {@link MenuShortcut}. */
export type MenuShortcutProps = NativeProps<"span">;

/**
 * An item's keys, small keycaps pushed to the end. Drawn for the eye and hidden from screen readers: announce the
 * shortcut with `aria-keyshortcuts` on the item.
 *
 *   <MenuShortcut>
 *     <kbd className="pp-box pp-keycap" data-size="sm">Ctrl</kbd>
 *     <kbd className="pp-box pp-keycap" data-size="sm">D</kbd>
 *   </MenuShortcut>
 *
 * Renders `<span class="pp-menu-shortcut" aria-hidden="true">`.
 */
export const MenuShortcut = /*#__PURE__*/ forwardRef<HTMLSpanElement, MenuShortcutProps>(function MenuShortcut(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("pp-menu-shortcut", className)} aria-hidden="true" {...rest} />;
});

/** Props for {@link MenuSeparator}. */
export type MenuSeparatorProps = Omit<NativeProps<"div">, "children">;

/**
 * A dashed pixel line between groups of items (and before links to pages, if a menu has any).
 *
 *   <MenuSeparator />
 *
 * Renders `<div class="pp-menu-separator" role="separator">`.
 */
export const MenuSeparator = /*#__PURE__*/ forwardRef<HTMLDivElement, MenuSeparatorProps>(function MenuSeparator(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("pp-menu-separator", className)} role="separator" {...rest} />;
});

/** Props for {@link MenuGroup}. */
export type MenuGroupProps = Named & NativeProps<"div">;

/**
 * Items under a {@link MenuHeading}, named by it; radio items in a group pick one.
 *
 *   <MenuGroup aria-labelledby="sort-by">
 *     <MenuHeading id="sort-by">Sort tiles by</MenuHeading>
 *     <MenuItem kind="radio" checked><MenuLabel>Name</MenuLabel></MenuItem>
 *     <MenuItem kind="radio" checked={false}><MenuLabel>Last used</MenuLabel></MenuItem>
 *   </MenuGroup>
 *
 * Renders `<div role="group">`.
 */
export const MenuGroup = /*#__PURE__*/ forwardRef<HTMLDivElement, MenuGroupProps>(function MenuGroup({ className, ...rest }, ref) {
  return <div ref={ref} className={className} role="group" {...rest} />;
});

/** Props for {@link MenuHeading}. */
export type MenuHeadingProps = NativeProps<"div">;

/**
 * A group's heading: small and muted. Give it an id and name the group by it.
 *
 *   <MenuHeading id="show">Show</MenuHeading>
 *
 * Renders `<div class="pp-menu-heading">`.
 */
export const MenuHeading = /*#__PURE__*/ forwardRef<HTMLDivElement, MenuHeadingProps>(function MenuHeading(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("pp-menu-heading", className)} {...rest} />;
});

// ------------------------------------------------------------------------------------ command palette (pp-command)

/** Own props of {@link CommandPanel}. */
export interface CommandPanelOwnProps {
  /** Corner radius in pixels, 5 by default. `data-pp-r`. */
  radius?: Radius;
}
/** Props for {@link CommandPanel}: a dialog's by default (`as="div"` only for a static picture). */
export type CommandPanelProps<T extends ElementType = "dialog"> = PolymorphicProps<T, CommandPanelOwnProps & Named>;

/**
 * The palette: a cream panel near the top of the screen over a dithered scrim, a native modal `<dialog>` inside
 * `<CommandPalette>`, which opens it with the shortcut, filters as you type and moves the yellow row. A click on the
 * scrim closes it (`closedby="any"`). Name it, and give it an id for a button that opens it.
 *
 *   <CommandPalette onAction={(e) => go(e.detail.value)}>
 *     <CommandPanel id="palette" aria-label="Command palette">
 *       <CommandSearch>
 *         <Icon name="search" /><CommandInput aria-label="Search pages and actions" placeholder="Search…" />
 *       </CommandSearch>
 *       <CommandResults aria-label="Results">
 *         <CommandGroup aria-labelledby="palette-pages">
 *           <CommandHeading id="palette-pages">Pages</CommandHeading>
 *           <CommandItem value="/levels" keywords="worlds maps">
 *             <Icon name="flag" /><CommandLabel>Levels</CommandLabel><CommandHint>Page</CommandHint>
 *           </CommandItem>
 *         </CommandGroup>
 *       </CommandResults>
 *       <CommandEmpty>Nothing matches. Try a page or an action.</CommandEmpty>
 *       <CommandStatus />
 *     </CommandPanel>
 *   </CommandPalette>
 *
 * Renders `<dialog class="pp-box pp-command pp-pop-in" closedby="any">`.
 */
export const CommandPanel = /*#__PURE__*/ forwardRef(function CommandPanel(
  // The name is required by CommandPanelProps; inside, the props are just passed on.
  { as: Tag = "dialog", radius, className, ...rest }: PolymorphicProps<ElementType, CommandPanelOwnProps>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("pp-box pp-command pp-pop-in", className)}
      data-pp-r={radius}
      closedby={Tag === "dialog" ? "any" : undefined}
      {...rest}
    />
  );
}) as PolymorphicComponent<"dialog", CommandPanelOwnProps & Named>;

/** Props for {@link CommandSearch}. */
export type CommandSearchProps = NativeProps<"div">;

/**
 * The search row: an icon and the {@link CommandInput}, over a one-pixel rule.
 *
 *   <CommandSearch><Icon name="search" /><CommandInput aria-label="Search pages and actions" /></CommandSearch>
 *
 * Renders `<div class="pp-command-search">`.
 */
export const CommandSearch = /*#__PURE__*/ forwardRef<HTMLDivElement, CommandSearchProps>(function CommandSearch(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("pp-command-search", className)} {...rest} />;
});

/** Props for {@link CommandInput}. */
export type CommandInputProps = Named & NativeProps<"input">;

/**
 * The search field. `<CommandPalette>` makes it a combobox over the results; the focus stays here while the arrow
 * keys move the yellow row, so it has no ring of its own. Name it (`aria-label`, not just a placeholder). The ref and
 * every native prop go to the input.
 *
 *   <CommandInput aria-label="Search pages and actions" placeholder="Search…" />
 *
 * Renders `<input class="pp-command-input" type="text">`.
 */
export const CommandInput = /*#__PURE__*/ forwardRef<HTMLInputElement, CommandInputProps>(function CommandInput(
  { type = "text", className, ...rest },
  ref,
) {
  return <input ref={ref} className={cx("pp-command-input", className)} type={type} {...rest} />;
});

/** Props for {@link CommandResults}. */
export type CommandResultsProps = Named & NativeProps<"div">;

/**
 * The results: a scrolling listbox of {@link CommandGroup}s (pages first, then actions). Name it.
 *
 *   <CommandResults aria-label="Results">…</CommandResults>
 *
 * Renders `<div class="pp-command-results" role="listbox">`.
 */
export const CommandResults = /*#__PURE__*/ forwardRef<HTMLDivElement, CommandResultsProps>(function CommandResults(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("pp-command-results", className)} role="listbox" {...rest} />;
});

/** Props for {@link CommandGroup}. */
export type CommandGroupProps = Named & NativeProps<"div">;

/**
 * Results under a {@link CommandHeading}, named by it. A group whose results are all filtered out goes too.
 *
 *   <CommandGroup aria-labelledby="palette-actions">
 *     <CommandHeading id="palette-actions">Actions</CommandHeading>…
 *   </CommandGroup>
 *
 * Renders `<div class="pp-command-group" role="group">`.
 */
export const CommandGroup = /*#__PURE__*/ forwardRef<HTMLDivElement, CommandGroupProps>(function CommandGroup(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("pp-command-group", className)} role="group" {...rest} />;
});

/** Props for {@link CommandHeading}. */
export type CommandHeadingProps = NativeProps<"div">;

/**
 * A group's heading. Give it an id and name the group by it.
 *
 *   <CommandHeading id="palette-pages">Pages</CommandHeading>
 *
 * Renders `<div class="pp-command-heading">`.
 */
export const CommandHeading = /*#__PURE__*/ forwardRef<HTMLDivElement, CommandHeadingProps>(function CommandHeading(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("pp-command-heading", className)} {...rest} />;
});

/** Own props of {@link CommandItem}. */
export interface CommandItemOwnProps {
  /** What `pp-action` reports as `detail.value` (the label otherwise): a path, an action's name. `data-value`. */
  value?: string;
  /** More words the filter matches, space-separated ("home dashboard" finds Overview). `data-keywords`. */
  keywords?: string;
  /** Corner radius in pixels, 3 by default. `data-pp-r`. */
  radius?: Radius;
}
/** Props for {@link CommandItem}. */
export type CommandItemProps = CommandItemOwnProps & NativeProps<"div", CommandItemOwnProps>;

/**
 * A result: just its text at rest, the yellow FOCUS row while active (`<CommandPalette>` sets `aria-selected` and
 * hides the ones the search filters out). An icon, a {@link CommandLabel}, an optional {@link CommandHint} and
 * {@link CommandShortcut}. `aria-disabled="true"` turns it off: say why in its hint.
 *
 *   <CommandItem value="new-level" keywords="create add">
 *     <Icon name="plus" /><CommandLabel>New level</CommandLabel>
 *   </CommandItem>
 *
 * Renders `<div class="pp-box pp-command-item" role="option">`.
 */
export const CommandItem = /*#__PURE__*/ forwardRef<HTMLDivElement, CommandItemProps>(function CommandItem(
  { value, keywords, radius, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx("pp-box pp-command-item", className)}
      role="option"
      data-value={value}
      data-keywords={keywords}
      data-pp-r={radius}
      {...rest}
    />
  );
});

/** Props for {@link CommandLabel}. */
export type CommandLabelProps = NativeProps<"span">;

/**
 * A result's name, as the visible navigation says it ("Players", "New level"); the filter and `pp-action` read it.
 *
 *   <CommandLabel>Levels</CommandLabel>
 *
 * Renders `<span class="pp-command-label">`.
 */
export const CommandLabel = /*#__PURE__*/ forwardRef<HTMLSpanElement, CommandLabelProps>(function CommandLabel(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("pp-command-label", className)} {...rest} />;
});

/** Props for {@link CommandHint}. */
export type CommandHintProps = NativeProps<"span">;

/**
 * A quiet note after the label: one word ("Page", "Scheme"), or why a result is off ("Finish it first").
 *
 *   <CommandHint>Page</CommandHint>
 *
 * Renders `<span class="pp-command-hint">`.
 */
export const CommandHint = /*#__PURE__*/ forwardRef<HTMLSpanElement, CommandHintProps>(function CommandHint(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("pp-command-hint", className)} {...rest} />;
});

/** Props for {@link CommandShortcut}. */
export type CommandShortcutProps = NativeProps<"span">;

/**
 * A result's keys, small keycaps at the end, hidden from screen readers.
 *
 *   <CommandShortcut>
 *     <kbd className="pp-box pp-keycap" data-size="sm">G</kbd><kbd className="pp-box pp-keycap" data-size="sm">L</kbd>
 *   </CommandShortcut>
 *
 * Renders `<span class="pp-command-shortcut" aria-hidden="true">`.
 */
export const CommandShortcut = /*#__PURE__*/ forwardRef<HTMLSpanElement, CommandShortcutProps>(function CommandShortcut(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("pp-command-shortcut", className)} aria-hidden="true" {...rest} />;
});

/** Props for {@link CommandEmpty}. */
export type CommandEmptyProps = NativeProps<"p">;

/**
 * What shows when nothing matches: suggest what to try. Hidden until then (`<CommandPalette>` shows it); pass
 * `hidden={false}` for a static picture.
 *
 *   <CommandEmpty>Nothing matches. Try a page or an action.</CommandEmpty>
 *
 * Renders `<p class="pp-command-empty" hidden>`.
 */
export const CommandEmpty = /*#__PURE__*/ forwardRef<HTMLParagraphElement, CommandEmptyProps>(function CommandEmpty(
  { hidden = true, className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("pp-command-empty", className)} hidden={hidden} {...rest} />;
});

/** Props for {@link CommandStatus}. */
export type CommandStatusProps = Omit<NativeProps<"p">, "children">;

/**
 * The live line that announces how many results there are as you type ("3 results"). Empty: `<CommandPalette>`
 * writes it.
 *
 *   <CommandStatus />
 *
 * Renders `<p class="pp-sr-only" role="status">`.
 */
export const CommandStatus = /*#__PURE__*/ forwardRef<HTMLParagraphElement, CommandStatusProps>(function CommandStatus(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("pp-sr-only", className)} role="status" {...rest} />;
});

/** Props for {@link CommandFooter}. */
export type CommandFooterProps = NativeProps<"div">;

/**
 * Optional keycap hints for the keys along the bottom, each a `<span>` of keycaps and a word. For the eye only:
 * hidden from screen readers, which hear the combobox.
 *
 *   <CommandFooter><span><kbd className="pp-box pp-keycap" data-size="sm">Enter</kbd> Open</span></CommandFooter>
 *
 * Renders `<div class="pp-command-footer" aria-hidden="true">`.
 */
export const CommandFooter = /*#__PURE__*/ forwardRef<HTMLDivElement, CommandFooterProps>(function CommandFooter(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("pp-command-footer", className)} aria-hidden="true" {...rest} />;
});
