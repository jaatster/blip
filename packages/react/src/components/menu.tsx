/**
 * Menu: MenuList, MenuItem, MenuLabel, MenuShortcut, MenuSeparator, MenuGroup and MenuHeading, the parts that go
 * inside <Menu>, and <Menu> itself (generated from its element, re-exported here). CSS from @jaatster/blip-components
 * (menu.css).
 */
import { forwardRef } from "react";
import type { ElementType } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { cx } from "../internal/props.js";
import type { NativeProps, Radius } from "../internal/props.js";

export { Menu, type MenuProps } from "../generated/elements.js";

/** A landmark, list or group needs a name: `aria-label`, or `aria-labelledby` pointing at its heading. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

/** Own props of {@link MenuList}. */
export interface MenuListOwnProps {
  /** Corner radius in pixels, 4 by default. `data-chu-r`. */
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
 *         <MenuShortcut><kbd className="chu-box chu-keycap" data-size="sm">Ctrl</kbd>…</MenuShortcut>
 *       </MenuItem>
 *       <MenuSeparator />
 *       <MenuItem kind="checkbox" checked={grid}><MenuLabel>Grid</MenuLabel></MenuItem>
 *       <MenuItem tone="danger"><MenuLabel>Delete level</MenuLabel></MenuItem>
 *     </MenuList>
 *   </Menu>
 *
 * Renders `<div class="chu-box chu-menu-list chu-pop-in" role="menu" popover>`. A submenu is a `<Menu>` in the list,
 * its button a {@link MenuItem}.
 */
export const MenuList = /*#__PURE__*/ forwardRef<HTMLDivElement, MenuListProps>(function MenuList(
  { radius, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx("chu-box chu-menu-list chu-pop-in", className)}
      data-chu-r={radius}
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
  /** What `chu-action` reports as `detail.value` (the label otherwise), so code need not read labels. `data-value`. */
  value?: string;
  /** Corner radius in pixels, 3 by default. `data-chu-r`. */
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
 * Renders `<button class="chu-box chu-menu-item" type="button" role="menuitem">`.
 */
export const MenuItem = /*#__PURE__*/ forwardRef(function MenuItem(
  { as: Tag = "button", kind, checked, tone, value, radius, className, ...rest }: MenuItemProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("chu-box chu-menu-item", className)}
      type={Tag === "button" ? "button" : undefined}
      role={kind === "checkbox" ? "menuitemcheckbox" : kind === "radio" ? "menuitemradio" : "menuitem"}
      aria-checked={checked}
      data-tone={tone}
      data-chu-r={radius}
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
 * Renders `<span class="chu-menu-label">`.
 */
export const MenuLabel = /*#__PURE__*/ forwardRef<HTMLSpanElement, MenuLabelProps>(function MenuLabel({ className, ...rest }, ref) {
  return <span ref={ref} className={cx("chu-menu-label", className)} {...rest} />;
});

/** Props for {@link MenuShortcut}. */
export type MenuShortcutProps = NativeProps<"span">;

/**
 * An item's keys, small keycaps pushed to the end. Drawn for the eye and hidden from screen readers: announce the
 * shortcut with `aria-keyshortcuts` on the item.
 *
 *   <MenuShortcut>
 *     <kbd className="chu-box chu-keycap" data-size="sm">Ctrl</kbd>
 *     <kbd className="chu-box chu-keycap" data-size="sm">D</kbd>
 *   </MenuShortcut>
 *
 * Renders `<span class="chu-menu-shortcut" aria-hidden="true">`.
 */
export const MenuShortcut = /*#__PURE__*/ forwardRef<HTMLSpanElement, MenuShortcutProps>(function MenuShortcut(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("chu-menu-shortcut", className)} aria-hidden="true" {...rest} />;
});

/** Props for {@link MenuSeparator}. */
export type MenuSeparatorProps = Omit<NativeProps<"div">, "children">;

/**
 * A dashed pixel line between groups of items (and before links to pages, if a menu has any).
 *
 *   <MenuSeparator />
 *
 * Renders `<div class="chu-menu-separator" role="separator">`.
 */
export const MenuSeparator = /*#__PURE__*/ forwardRef<HTMLDivElement, MenuSeparatorProps>(function MenuSeparator(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("chu-menu-separator", className)} role="separator" {...rest} />;
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
 * Renders `<div class="chu-menu-heading">`.
 */
export const MenuHeading = /*#__PURE__*/ forwardRef<HTMLDivElement, MenuHeadingProps>(function MenuHeading(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("chu-menu-heading", className)} {...rest} />;
});
