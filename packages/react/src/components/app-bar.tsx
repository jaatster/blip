/**
 * App bar: AppBar, AppBarBrand, AppBarNav, AppBarToggle, AppBarLinks, AppBarLink and AppBarActions. CSS from
 * @blip/components (app-bar.css). A link to the page you are on takes `current` (`aria-current="page"`); list items
 * with no class of their own stay plain `<li>`s.
 */
import { forwardRef } from "react";
import type { ElementType } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { cx, flag, type IconOnly } from "../internal/props.js";
import type { NativeProps, Radius, Variant } from "../internal/props.js";

/** A landmark, list or group needs a name: `aria-label`, or `aria-labelledby` pointing at its heading. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

const current = (on: boolean | undefined) => (on ? "page" : undefined);

/** Own props of {@link AppBar}. */
export interface AppBarOwnProps {
  /**
   * When the links fold behind the menu button: under 1024 px by default, `medium` under 600 px (a few short links),
   * `always`, or `never`. `data-collapse`.
   */
  collapse?: "medium" | "always" | "never";
  /** Stays at the top while the page scrolls. `data-sticky`. */
  sticky?: boolean;
  /** The bar's corners, 4 by default; 0 for a bar flush to the screen's edges. `data-blip-r`. */
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
 * Renders `<header class="blip-box blip-app-bar">`, a size container (`blip-app-bar`): it folds by its own width.
 */
export const AppBar = /*#__PURE__*/ forwardRef<HTMLElement, AppBarProps>(function AppBar(
  { collapse, sticky, radius, className, ...rest },
  ref,
) {
  return (
    <header
      ref={ref}
      className={cx("blip-box blip-app-bar", className)}
      data-collapse={collapse}
      data-sticky={flag(sticky)}
      data-blip-r={radius}
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
 *     <span className="blip-display blip-pop" data-scale="2" data-pop="Questboard">Questboard</span>
 *   </AppBarBrand>
 *
 * Renders `<a class="blip-app-bar-brand">`; with `as`, your router's link.
 */
export const AppBarBrand = /*#__PURE__*/ forwardRef(function AppBarBrand(
  { as: Tag = "a", className, ...rest }: AppBarBrandProps<ElementType>,
  ref,
) {
  return <Tag ref={ref} className={cx("blip-app-bar-brand", className)} {...rest} />;
}) as PolymorphicComponent<"a", object>;

/** Props for {@link AppBarNav}. */
export type AppBarNavProps = Named & NativeProps<"nav">;

/**
 * The main links' landmark: the menu button, then the links. Name it.
 *
 *   <AppBarNav aria-label="Main">…</AppBarNav>
 *
 * Renders `<nav class="blip-app-bar-nav">`.
 */
export const AppBarNav = /*#__PURE__*/ forwardRef<HTMLElement, AppBarNavProps>(function AppBarNav({ className, ...rest }, ref) {
  return <nav ref={ref} className={cx("blip-app-bar-nav", className)} {...rest} />;
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
 * Renders `<button class="blip-box blip-button blip-app-bar-toggle" type="button" data-variant="ghost" popovertarget>`.
 */
export const AppBarToggle = /*#__PURE__*/ forwardRef<HTMLButtonElement, AppBarToggleProps>(function AppBarToggle(
  { variant = "ghost", iconOnly, type = "button", className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx("blip-box blip-button blip-app-bar-toggle", className)}
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
 * Renders `<ul class="blip-box blip-app-bar-links" popover role="list">`.
 */
export const AppBarLinks = /*#__PURE__*/ forwardRef<HTMLUListElement, AppBarLinksProps>(function AppBarLinks(
  { className, ...rest },
  ref,
) {
  return <ul ref={ref} className={cx("blip-box blip-app-bar-links", className)} popover="" role="list" {...rest} />;
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
 * Renders `<a class="blip-box blip-app-bar-link" data-variant="ghost">`; with `as`, your router's link.
 */
export const AppBarLink = /*#__PURE__*/ forwardRef(function AppBarLink(
  { as: Tag = "a", current: isCurrent, className, ...rest }: AppBarLinkProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("blip-box blip-app-bar-link", className)}
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
 * Renders `<div class="blip-app-bar-actions">`.
 */
export const AppBarActions = /*#__PURE__*/ forwardRef<HTMLDivElement, AppBarActionsProps>(function AppBarActions(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("blip-app-bar-actions", className)} {...rest} />;
});
