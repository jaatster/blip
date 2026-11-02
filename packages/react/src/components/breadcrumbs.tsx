/**
 * Breadcrumbs: Breadcrumbs, BreadcrumbsList and BreadcrumbsLink. CSS from @jaatster/blip-components (breadcrumbs.css). A link
 * to the page you are on takes `current` (`aria-current="page"`); list items with no class of their own stay plain
 * `<li>`s.
 */
import { forwardRef } from "react";
import type { ElementType } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { cx } from "../internal/props.js";
import type { NativeProps, Radius, Size } from "../internal/props.js";

const current = (on: boolean | undefined) => (on ? "page" : undefined);

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
 * Renders `<nav class="blip-breadcrumbs" aria-label="Breadcrumb">`.
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
      className={cx("blip-breadcrumbs", className)}
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
 * Renders `<ol class="blip-breadcrumbs-list">`.
 */
export const BreadcrumbsList = /*#__PURE__*/ forwardRef<HTMLOListElement, BreadcrumbsListProps>(function BreadcrumbsList(
  { className, ...rest },
  ref,
) {
  return <ol ref={ref} className={cx("blip-breadcrumbs-list", className)} {...rest} />;
});

/** Own props of {@link BreadcrumbsLink}. */
export interface BreadcrumbsLinkOwnProps {
  /** The page you are on, the last crumb: a soft chip, ink bold text. `aria-current="page"`. */
  current?: boolean;
  /** Corner radius in pixels, 3 by default. `data-blip-r`. */
  radius?: Radius;
}

/** Props for {@link BreadcrumbsLink}: a link's by default, a button's with `as="button"`. */
export type BreadcrumbsLinkProps<T extends ElementType = "a"> = PolymorphicProps<T, BreadcrumbsLinkOwnProps>;

/**
 * A crumb: a ghost box, a link in the accent's text colour. A label in a `<span>` is cut to `--blip-breadcrumbs-max`
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
 * Renders `<a class="blip-box blip-breadcrumbs-link" data-variant="ghost">`.
 */
export const BreadcrumbsLink = /*#__PURE__*/ forwardRef(function BreadcrumbsLink(
  { as: Tag = "a", current: isCurrent, radius, className, ...rest }: BreadcrumbsLinkProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("blip-box blip-breadcrumbs-link", className)}
      type={Tag === "button" ? "button" : undefined}
      data-variant="ghost"
      data-blip-r={radius}
      aria-current={current(isCurrent)}
      {...rest}
    />
  );
}) as PolymorphicComponent<"a", BreadcrumbsLinkOwnProps>;
