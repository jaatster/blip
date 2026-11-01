/**
 * Sidebar: Sidebar, SidebarHeading, SidebarList, SidebarItem, SidebarLabel, SidebarBadge and SidebarGroup. CSS from
 * @blip/components (sidebar.css). A link to the page you are on takes `current` (`aria-current="page"`); list items
 * with no class of their own stay plain `<li>`s.
 */
import { forwardRef } from "react";
import type { CSSProperties, ElementType } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { box, cx, flag } from "../internal/props.js";
import type { BoxProps, NativeProps, Radius } from "../internal/props.js";

/** A landmark, list or group needs a name: `aria-label`, or `aria-labelledby` pointing at its heading. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

/** A link that is off has nowhere to go: no `href`. */
type Reachable = { disabled?: false } | { disabled: true; href?: never };

const current = (on: boolean | undefined) => (on ? "page" : undefined);

/** Own props of {@link Sidebar}. */
export interface SidebarOwnProps {
  /** A framed panel: adds `blip-box` and `data-variant="panel"`. Leave it off for a sidebar on the page. */
  framed?: boolean;
  /** The rail: icons only, headings turn to rules, labels show beside items on hover and focus. `data-collapsed`. */
  collapsed?: boolean;
  /**
   * `auto`: a rail while the `blip-shell` container is under 1024 px, hidden under 600 px (where a bottom bar or the
   * app bar's menu takes over). `data-collapse`.
   */
  collapse?: "auto";
  /** The TV's pointer arrow beside the current page: it pokes for a few beats, then rests. `data-arrow`. */
  arrow?: boolean;
  /** The open width in pixels, 120 by default; keep it over 120 (narrower reads as the rail). `--blip-sidebar-width`. */
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
 * Renders `<nav class="blip-sidebar">` (`<nav class="blip-box blip-sidebar" data-variant="panel">` when framed). Rail
 * labels reach outside it: do not clip a rail.
 */
export const Sidebar = /*#__PURE__*/ forwardRef<HTMLElement, SidebarProps>(function Sidebar(
  { framed, collapsed, collapse, arrow, width, className, style, ...rest },
  ref,
) {
  const sized = width === undefined ? style : { ...style, "--blip-sidebar-width": `calc(${width} * var(--blip-pixel))` };
  return (
    <nav
      ref={ref}
      className={cx(framed && "blip-box", "blip-sidebar", className)}
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
 * Renders `<h2 class="blip-sidebar-heading">`.
 */
export const SidebarHeading = /*#__PURE__*/ forwardRef<HTMLHeadingElement, SidebarHeadingProps>(function SidebarHeading(
  { className, ...rest },
  ref,
) {
  return <h2 ref={ref} className={cx("blip-sidebar-heading", className)} {...rest} />;
});

/** Props for {@link SidebarList}. */
export type SidebarListProps = NativeProps<"ul">;

/**
 * A section's items, each in an `<li>`; inside a group, its indented items. Name a section's list by its heading.
 *
 *   <SidebarList aria-labelledby="nav-shop">…</SidebarList>
 *
 * Renders `<ul class="blip-sidebar-list" role="list">`.
 */
export const SidebarList = /*#__PURE__*/ forwardRef<HTMLUListElement, SidebarListProps>(function SidebarList(
  { className, ...rest },
  ref,
) {
  return <ul ref={ref} className={cx("blip-sidebar-list", className)} role="list" {...rest} />;
});

/** Own props of {@link SidebarItem}. */
export interface SidebarItemOwnProps {
  /** The page you are on: sits in, a bold label, and the arrow with the sidebar's `arrow`. `aria-current="page"`. */
  current?: boolean;
  /** Off: dithered and muted, announced as a dimmed link. `role="link"` and `aria-disabled="true"`, with no `href`. */
  disabled?: boolean;
  /** Corner radius in pixels, 3 by default. `data-blip-r`. */
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
 * Renders `<a class="blip-box blip-sidebar-item" data-variant="ghost">`.
 */
export const SidebarItem = /*#__PURE__*/ forwardRef(function SidebarItem(
  { as: Tag = "a", current: isCurrent, disabled, radius, className, ...rest }: SidebarItemProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("blip-box blip-sidebar-item", className)}
      data-variant="ghost"
      data-blip-r={radius}
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
 * Renders `<span class="blip-sidebar-label">`.
 */
export const SidebarLabel = /*#__PURE__*/ forwardRef<HTMLSpanElement, SidebarLabelProps>(function SidebarLabel(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("blip-sidebar-label", className)} {...rest} />;
});

/** Own props of {@link SidebarBadge}. */
export type SidebarBadgeOwnProps = Pick<BoxProps, "tone" | "radius">;

/** Props for {@link SidebarBadge}. */
export type SidebarBadgeProps = SidebarBadgeOwnProps & NativeProps<"span", SidebarBadgeOwnProps>;

/**
 * A count at the end of an item: a soft box; on the rail, a dot. Write "999+" above 999, and add words for screen
 * readers.
 *
 *   <SidebarBadge tone="danger">5<span className="blip-sr-only"> refunds to check</span></SidebarBadge>
 *
 * Renders `<span class="blip-box blip-sidebar-badge">`.
 */
export const SidebarBadge = /*#__PURE__*/ forwardRef<HTMLSpanElement, SidebarBadgeProps>(function SidebarBadge(
  { tone, radius, className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("blip-box blip-sidebar-badge", className)} {...box({ tone, radius })} {...rest} />;
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
 * Renders `<details class="blip-sidebar-group">`.
 */
export const SidebarGroup = /*#__PURE__*/ forwardRef<HTMLDetailsElement, SidebarGroupProps>(function SidebarGroup(
  { className, ...rest },
  ref,
) {
  return <details ref={ref} className={cx("blip-sidebar-group", className)} {...rest} />;
});
