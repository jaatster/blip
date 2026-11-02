/**
 * List: List, ListItem, ListContent, ListTitle, ListDescription and ListEnd. CSS from @jaatster/blip-components (list.css).
 */
import { forwardRef } from "react";
import type { ElementType } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { box, cx, flag, type NativeProps, type Radius } from "../internal/props.js";

/** A list element, which keeps its list semantics in Safari only with `role="list"`. */
const isList = (tag: ElementType): boolean => tag === "ul" || tag === "ol";

/** Own props of {@link List}. */
export interface ListOwnProps {
  /** The list in a white panel. Adds `.blip-box`. */
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
 * pressable or all content, never mixed. Renders `<ul class="blip-list" role="list">`, `<ul class="blip-box blip-list"
 * role="list">` boxed.
 *
 *   <List boxed dividers aria-label="Settings">
 *     <ListItem>…</ListItem>
 *   </List>
 */
export const List = /*#__PURE__*/ forwardRef(function List(
  { as: Tag = "ul", boxed, variant, dividers, density, role, className, ...rest }: ListProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx((boxed || variant) && "blip-box", "blip-list", className)}
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
  /** A pressable row's corner radius in pixels, 0 to 8 (3 by default). `data-blip-r`. */
  radius?: Radius;
}

export type ListItemProps<T extends ElementType = "li"> = PolymorphicProps<T, ListItemOwnProps>;

/**
 * A row: a leading icon or avatar, a {@link ListContent}, and perhaps a {@link ListEnd}. As an `<li>` it is a row of
 * content, whose controls are named by its title (`aria-labelledby`). As `as="a"` or `as="button"` (inside a plain
 * `<li>`) it is a row you press: a ghost box, filled on hover, named by its words, `aria-current="page"` for the
 * page you are on; never put a control inside one. Renders `<li class="blip-list-item">`, or `<a class="blip-box
 * blip-list-item" data-variant="ghost">` (a button gets `type="button"`).
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
export const ListItem = /*#__PURE__*/ forwardRef(function ListItem(
  { as: Tag = "li", radius, type, className, ...rest }: ListItemProps<ElementType>,
  ref,
) {
  const pressable = Tag !== "li";
  return (
    <Tag
      ref={ref}
      className={cx(pressable && "blip-box", "blip-list-item", className)}
      {...box({ variant: pressable ? "ghost" : undefined, radius })}
      type={type ?? (Tag === "button" ? "button" : undefined)}
      {...rest}
    />
  );
}) as PolymorphicComponent<"li", ListItemOwnProps>;

export type ListContentProps<T extends ElementType = "div"> = PolymorphicProps<T, object>;

/**
 * The row's words: a {@link ListTitle} and a {@link ListDescription}, one under the other. In a pressable row use
 * `as="span"` (a link or button holds no `<div>`). Renders `<div class="blip-list-content">`.
 *
 *   <ListContent><ListTitle>Cloud save</ListTitle><ListDescription>Synced 2 min ago</ListDescription></ListContent>
 */
export const ListContent = /*#__PURE__*/ forwardRef(function ListContent(
  { as: Tag = "div", className, ...rest }: ListContentProps<ElementType>,
  ref,
) {
  return <Tag ref={ref} className={cx("blip-list-content", className)} {...rest} />;
}) as PolymorphicComponent<"div", object>;

/** Props for {@link ListTitle}. */
export type ListTitleProps = NativeProps<"span">;

/**
 * The row's title, a few words; give it an `id` to name the row's controls. Renders `<span class="blip-list-title">`.
 *
 *   <ListTitle id="set-music">Music</ListTitle>
 */
export const ListTitle = /*#__PURE__*/ forwardRef<HTMLSpanElement, ListTitleProps>(function ListTitle({ className, ...rest }, ref) {
  return <span ref={ref} className={cx("blip-list-title", className)} {...rest} />;
});

/** Props for {@link ListDescription}. */
export type ListDescriptionProps = NativeProps<"span">;

/**
 * One line under the title, muted. Renders `<span class="blip-list-description">`.
 *
 *   <ListDescription>Chip tunes on the title screen</ListDescription>
 */
export const ListDescription = /*#__PURE__*/ forwardRef<HTMLSpanElement, ListDescriptionProps>(function ListDescription(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("blip-list-description", className)} {...rest} />;
});

export type ListEndProps<T extends ElementType = "div"> = PolymorphicProps<T, object>;

/**
 * The row's end: meta text or controls. Meta in tabular digits ("60%", "2 min ago"), or a switch, a tag, a keycap, a
 * chevron for a row that goes somewhere; `as="span"` in a pressable row. Renders `<div class="blip-list-end">`.
 *
 *   <ListEnd>98,120</ListEnd>
 */
export const ListEnd = /*#__PURE__*/ forwardRef(function ListEnd(
  { as: Tag = "div", className, ...rest }: ListEndProps<ElementType>,
  ref,
) {
  return <Tag ref={ref} className={cx("blip-list-end", className)} {...rest} />;
}) as PolymorphicComponent<"div", object>;
