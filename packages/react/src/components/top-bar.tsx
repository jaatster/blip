/**
 * Top bar: TopBar, TopBarBack, TopBarTitle, TopBarActions and TopBarLarge. CSS from @jaatster/blip-components
 * (top-bar.css). A phone screen's own bar; the site's bar is AppBar.
 */
import { forwardRef } from "react";
import type { ElementType } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { cx, flag, type IconOnly, type NativeProps } from "../internal/props.js";

/** Own props of {@link TopBar}. */
export interface TopBarOwnProps {
  /**
   * A big title under the bar ({@link TopBarLarge}, straight after it) that slides up under the bar as the screen
   * scrolls, when the bar's own title steps in. Make the bar's title a copy (`as="span"`, `aria-hidden`). `data-large`.
   */
  large?: boolean;
}

/** Props for {@link TopBar}. */
export type TopBarProps = TopBarOwnProps & NativeProps<"header", TopBarOwnProps>;

/**
 * A phone screen's bar: a back button, the title in the middle and one or two actions. It sticks to the top of its
 * scroller, inside the notch's safe area, flush with the screen's edges. Put it first in the screen.
 *
 *   <TopBar>
 *     <TopBarBack href="/worlds"><span className="chu-sr-only">Back to </span>Worlds</TopBarBack>
 *     <TopBarTitle>Meadow</TopBarTitle>
 *     <TopBarActions>
 *       <Button variant="ghost" iconOnly aria-label="Share"><Icon name="share" /></Button>
 *     </TopBarActions>
 *   </TopBar>
 *
 * Renders `<header class="chu-box chu-top-bar">`.
 */
export const TopBar = /*#__PURE__*/ forwardRef<HTMLElement, TopBarProps>(function TopBar({ large, className, ...rest }, ref) {
  return <header ref={ref} className={cx("chu-box chu-top-bar", className)} data-large={flag(large)} {...rest} />;
});

/** Props for {@link TopBarBack}: a link's by default, a button's with `as="button"`, or your router's link's. */
export type TopBarBackProps<T extends ElementType = "a"> = PolymorphicProps<T, IconOnly & { iconOnly?: boolean }>;

/**
 * The way back: a ghost button with a pixel chevron, and the previous screen's name (cut short past 48 pixels), or the
 * chevron alone with `iconOnly` and `aria-label="Back"`. Add hidden words to a label so it reads as what it does.
 *
 *   <TopBarBack href="/worlds"><span className="chu-sr-only">Back to </span>Worlds</TopBarBack>
 *   <TopBarBack as="button" type="button" onClick={() => history.back()} iconOnly aria-label="Back" />
 *
 * Renders `<a class="chu-box chu-button chu-top-bar-back" data-variant="ghost">` with the chevron first.
 */
export const TopBarBack = /*#__PURE__*/ forwardRef(function TopBarBack(
  { as: Tag = "a", iconOnly, className, children, ...rest }: TopBarBackProps<ElementType>,
  ref,
) {
  return (
    <Tag ref={ref} className={cx("chu-box chu-button chu-top-bar-back", className)} data-variant="ghost" data-icon-only={flag(iconOnly)} {...rest}>
      <span className="chu-icon chu-top-bar-chevron" aria-hidden="true" />
      {children}
    </Tag>
  );
}) as PolymorphicComponent<"a", IconOnly & { iconOnly?: boolean }>;

/** Props for {@link TopBarTitle}: an `<h1>`'s by default; another heading level, or a `<span>`, with `as`. */
export type TopBarTitleProps<T extends ElementType = "h1"> = PolymorphicProps<T, object>;

/**
 * The screen's name: one line of Pixel Bop, centred on the bar, cut short when long. Usually the screen's heading;
 * with a large title it is a copy: `<TopBarTitle as="span" aria-hidden="true">`.
 *
 *   <TopBarTitle>Meadow</TopBarTitle>
 *
 * Renders `<h1 class="chu-top-bar-title">`.
 */
export const TopBarTitle = /*#__PURE__*/ forwardRef(function TopBarTitle({ as: Tag = "h1", className, ...rest }: TopBarTitleProps<ElementType>, ref) {
  return <Tag ref={ref} className={cx("chu-top-bar-title", className)} {...rest} />;
}) as PolymorphicComponent<"h1", object>;

/** Props for {@link TopBarActions}. */
export type TopBarActionsProps = NativeProps<"div">;

/**
 * One or two ghost icon buttons at the end of the bar, each with an `aria-label`.
 *
 *   <TopBarActions><Button variant="ghost" iconOnly aria-label="Search"><Icon name="search" /></Button></TopBarActions>
 *
 * Renders `<div class="chu-top-bar-actions">`.
 */
export const TopBarActions = /*#__PURE__*/ forwardRef<HTMLDivElement, TopBarActionsProps>(function TopBarActions({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("chu-top-bar-actions", className)} {...rest} />;
});

/** Props for {@link TopBarLarge}: an `<h1>`'s by default; another heading level with `as`. */
export type TopBarLargeProps<T extends ElementType = "h1"> = PolymorphicProps<T, object>;

/**
 * The big title of a `large` bar, straight after it: Pixel Bop at scale 2, the screen's heading.
 *
 *   <TopBar large>…<TopBarTitle as="span" aria-hidden="true">Inbox</TopBarTitle>…</TopBar>
 *   <TopBarLarge>Inbox</TopBarLarge>
 *
 * Renders `<h1 class="chu-top-bar-large">`.
 */
export const TopBarLarge = /*#__PURE__*/ forwardRef(function TopBarLarge({ as: Tag = "h1", className, ...rest }: TopBarLargeProps<ElementType>, ref) {
  return <Tag ref={ref} className={cx("chu-top-bar-large", className)} {...rest} />;
}) as PolymorphicComponent<"h1", object>;
