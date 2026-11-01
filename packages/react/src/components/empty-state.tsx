/**
 * Empty state: EmptyState, EmptyStateArt, EmptyStateTitle, EmptyStateText and EmptyStateActions. CSS from
 * @jaatster/blip-components (empty-state.css).
 */
import { forwardRef } from "react";
import type { ElementType } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { cx, type NativeProps, type Size } from "../internal/props.js";

/** Own props of {@link EmptyState}. */
export interface EmptyStateOwnProps {
  /**
   * The picture at one, two (default) or three pixels a unit: small in panels, cards and sidebars, large on a screen
   * of its own. `data-size`.
   */
  size?: Size;
}

export type EmptyStateProps = EmptyStateOwnProps & NativeProps<"div", EmptyStateOwnProps>;

/**
 * What a list, page or panel shows when it has nothing in it yet. A small pixel picture, a title, a line saying why it
 * is empty or what goes here, and the action that fills it. Not for errors: that is an alert. Replace it with the
 * content when there is some. Renders `<div class="chu-empty-state">`.
 *
 *   <EmptyState>
 *     <EmptyStateArt viewBox="0 0 32 24">…</EmptyStateArt>
 *     <EmptyStateTitle>No saves yet</EmptyStateTitle>
 *     <EmptyStateText>Start a game and it is saved here after every level.</EmptyStateText>
 *     <EmptyStateActions><Button>New game</Button></EmptyStateActions>
 *   </EmptyState>
 */
export const EmptyState = /*#__PURE__*/ forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { size, className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("chu-empty-state", className)} data-size={size} {...rest} />;
});

/** Own props of {@link EmptyStateArt}. */
export interface EmptyStateArtOwnProps {
  /** The drawing's grid: 32 units wide (two pixels a unit, one when small), as tall as it needs. `viewBox`. */
  viewBox: `0 0 32 ${number}`;
}

export type EmptyStateArtProps = EmptyStateArtOwnProps & NativeProps<"svg", EmptyStateArtOwnProps>;

/**
 * The empty state's picture: an inline SVG on a grid 32 units wide. Draw it in whole units, coloured with tokens
 * (`style={{ fill: "var(--chu-outline)" }}`, candies, scheme roles) with an ink outline. It says nothing a reader needs,
 * so it is hidden. Renders `<svg class="chu-empty-state-art" aria-hidden="true">`.
 *
 *   <EmptyStateArt viewBox="0 0 32 24"><path style={{ fill: "var(--chu-outline)" }} d="M1 4h3v1H1z" /></EmptyStateArt>
 */
export const EmptyStateArt = /*#__PURE__*/ forwardRef<SVGSVGElement, EmptyStateArtProps>(function EmptyStateArt(
  { className, ...rest },
  ref,
) {
  return <svg ref={ref} className={cx("chu-empty-state-art", className)} aria-hidden {...rest} />;
});

export type EmptyStateTitleProps<T extends ElementType = "h2"> = PolymorphicProps<T, object>;

/**
 * The empty state's title in Pixel Bop: the plain fact ("No saves yet"). A real heading at the right level for its
 * place: `<h2>` in a page section, `as="h3"` in a card. Renders `<h2 class="chu-empty-state-title">`.
 *
 *   <EmptyStateTitle as="h3">No items</EmptyStateTitle>
 */
export const EmptyStateTitle = /*#__PURE__*/ forwardRef(function EmptyStateTitle(
  { as: Tag = "h2", className, ...rest }: EmptyStateTitleProps<ElementType>,
  ref,
) {
  return <Tag ref={ref} className={cx("chu-empty-state-title", className)} {...rest} />;
}) as PolymorphicComponent<"h2", object>;

/** Props for {@link EmptyStateText}. */
export type EmptyStateTextProps = NativeProps<"p">;

/**
 * The empty state's line: why it is empty or what will appear, and how to change that. Renders `<p
 * class="chu-empty-state-text">`.
 *
 *   <EmptyStateText>Open chests to fill your bag.</EmptyStateText>
 */
export const EmptyStateText = /*#__PURE__*/ forwardRef<HTMLParagraphElement, EmptyStateTextProps>(function EmptyStateText(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("chu-empty-state-text", className)} {...rest} />;
});

/** Props for {@link EmptyStateActions}. */
export type EmptyStateActionsProps = NativeProps<"div">;

/**
 * The empty state's actions: the main way to fill it (candy) and perhaps one more (ghost). Renders `<div
 * class="chu-empty-state-actions">`.
 *
 *   <EmptyStateActions><Button>New game</Button><Button variant="ghost">Load from file</Button></EmptyStateActions>
 */
export const EmptyStateActions = /*#__PURE__*/ forwardRef<HTMLDivElement, EmptyStateActionsProps>(function EmptyStateActions(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("chu-empty-state-actions", className)} {...rest} />;
});
