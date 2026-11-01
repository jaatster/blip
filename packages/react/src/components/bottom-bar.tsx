/**
 * Bottom bar: BottomBar, BottomBarList, BottomBarItem, BottomBarLabel and BottomBarBadge. CSS from @blip/components
 * (bottom-bar.css). A link to the page you are on takes `current` (`aria-current="page"`); list items with no class of
 * their own stay plain `<li>`s.
 */
import { forwardRef } from "react";
import type { ElementType } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { cx, flag } from "../internal/props.js";
import type { NativeProps, Radius, Tone } from "../internal/props.js";

/** A landmark, list or group needs a name: `aria-label`, or `aria-labelledby` pointing at its heading. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

const current = (on: boolean | undefined) => (on ? "page" : undefined);

/** Own props of {@link BottomBar}. */
export interface BottomBarOwnProps {
  /** `auto`: hidden while the `blip-shell` container is 600 px or wider (the sidebar takes over). `data-collapse`. */
  collapse?: "auto";
  /** Corner radius in pixels, 5 by default. `data-blip-r`. */
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
 *           <BottomBarBadge tone="danger">3<span className="blip-sr-only"> new</span></BottomBarBadge>
 *         </BottomBarItem>
 *       </li>
 *     </BottomBarList>
 *   </BottomBar>
 *
 * Renders `<nav class="blip-box blip-bottom-bar">`.
 */
export const BottomBar = /*#__PURE__*/ forwardRef<HTMLElement, BottomBarProps>(function BottomBar(
  { collapse, radius, className, ...rest },
  ref,
) {
  return (
    <nav
      ref={ref}
      className={cx("blip-box blip-bottom-bar", className)}
      data-collapse={collapse}
      data-blip-r={radius}
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
 * Renders `<ul class="blip-bottom-bar-list" role="list">`.
 */
export const BottomBarList = /*#__PURE__*/ forwardRef<HTMLUListElement, BottomBarListProps>(function BottomBarList(
  { className, ...rest },
  ref,
) {
  return <ul ref={ref} className={cx("blip-bottom-bar-list", className)} role="list" {...rest} />;
});

/** Own props of {@link BottomBarItem}. */
export interface BottomBarItemOwnProps {
  /** The destination you are on: sits in, an accent-light chip with an ink label. `aria-current="page"`. */
  current?: boolean;
  /** Corner radius in pixels, 4 by default. `data-blip-r`. */
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
 * Renders `<a class="blip-box blip-bottom-bar-item" data-variant="ghost">`; with `as`, your router's link.
 */
export const BottomBarItem = /*#__PURE__*/ forwardRef(function BottomBarItem(
  { as: Tag = "a", current: isCurrent, radius, className, ...rest }: BottomBarItemProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("blip-box blip-bottom-bar-item", className)}
      data-variant="ghost"
      data-blip-r={radius}
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
 * Renders `<span class="blip-bottom-bar-label">`.
 */
export const BottomBarLabel = /*#__PURE__*/ forwardRef<HTMLSpanElement, BottomBarLabelProps>(function BottomBarLabel(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("blip-bottom-bar-label", className)} {...rest} />;
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
 *   <BottomBarBadge tone="danger">3<span className="blip-sr-only"> new</span></BottomBarBadge>
 *   <BottomBarBadge tone="danger" dot><span className="blip-sr-only">, new</span></BottomBarBadge>
 *
 * Renders `<span class="blip-box blip-bottom-bar-badge">`.
 */
export const BottomBarBadge = /*#__PURE__*/ forwardRef<HTMLSpanElement, BottomBarBadgeProps>(function BottomBarBadge(
  { tone, dot, className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cx("blip-box blip-bottom-bar-badge", className)}
      data-tone={tone}
      data-dot={flag(dot)}
      {...rest}
    />
  );
});
