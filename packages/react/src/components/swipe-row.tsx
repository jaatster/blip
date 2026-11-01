/**
 * Swipe rows: SwipeRowFace, SwipeRowMore and SwipeRowActions, the parts that go inside <SwipeRow>, and <SwipeRow>
 * itself (generated from its element, re-exported here). CSS from @jaatster/blip-components (swipe-row.css).
 */
import { forwardRef } from "react";
import { cx, type NativeProps } from "../internal/props.js";

export { SwipeRow, type SwipeRowProps } from "../generated/elements.js";

// Swipe rows: the parts of `SwipeRow` (<chu-swipe-row>), which adds the swipe, More, focus and one-open-at-a-time.

/** Props for {@link SwipeRowFace}. */
export type SwipeRowFaceProps = NativeProps<"div">;

/**
 * What the row shows, first inside `SwipeRow`: a {@link ListItem} (a row of content, or a link or button you press),
 * then a {@link SwipeRowMore}. It slides aside to show the trays under it. Renders `<div class="chu-swipe-row-face">`.
 *
 *   <SwipeRow>
 *     <SwipeRowFace>
 *       <ListItem as="a" href="/inbox/12">…</ListItem>
 *       <SwipeRowMore aria-describedby="msg-12" />
 *     </SwipeRowFace>
 *     <SwipeRowActions side="end"><Button tone="danger" onClick={remove}>Delete</Button></SwipeRowActions>
 *   </SwipeRow>
 */
export const SwipeRowFace = /*#__PURE__*/ forwardRef<HTMLDivElement, SwipeRowFaceProps>(function SwipeRowFace({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("chu-swipe-row-face", className)} {...rest} />;
});

/** Props for {@link SwipeRowMore}. */
export type SwipeRowMoreProps = NativeProps<"button">;

/**
 * The More button, last in the face: a ghost icon button with three dots (the more-horizontal icon, unless you give
 * it another child) that opens and closes the row for a mouse or a keyboard, shown where there is a fine pointer.
 * Named "More actions" unless you name it; describe it by the row's title. The row keeps its `aria-expanded` in
 * step. Renders `<button class="chu-box chu-button chu-swipe-row-more" type="button" data-variant="ghost"
 * data-size="sm" data-icon-only>`.
 *
 *   <SwipeRowMore aria-describedby="msg-12" />
 */
export const SwipeRowMore = /*#__PURE__*/ forwardRef<HTMLButtonElement, SwipeRowMoreProps>(function SwipeRowMore(
  { type = "button", "aria-label": label = "More actions", className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx("chu-box chu-button chu-swipe-row-more", className)}
      type={type}
      data-variant="ghost"
      data-size="sm"
      data-icon-only=""
      aria-label={label}
      {...rest}
    >
      {children ?? (
        <svg className="chu-icon" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M1 5h2v2H1zm4 0h2v2H5zm4 0h2v2H9z" />
        </svg>
      )}
    </button>
  );
});

/** Own props of {@link SwipeRowActions}. */
export interface SwipeRowActionsOwnProps {
  /**
   * The side the tray is on: start shows with a swipe towards the end, end with a swipe towards the start (they
   * follow the text). `data-side`.
   */
  side: "start" | "end";
}

/** Props for {@link SwipeRowActions}. */
export type SwipeRowActionsProps = SwipeRowActionsOwnProps & NativeProps<"div", SwipeRowActionsOwnProps>;

/**
 * One side's tray of actions: one to three {@link Button}s with a tone each (danger for Delete), as tall as the row.
 * A full swipe runs the first. They are always in the tab order: focusing one opens its side. Renders `<div
 * class="chu-swipe-row-actions" data-side>`.
 *
 *   <SwipeRowActions side="start"><Button onClick={archive}>Archive</Button></SwipeRowActions>
 */
export const SwipeRowActions = /*#__PURE__*/ forwardRef<HTMLDivElement, SwipeRowActionsProps>(function SwipeRowActions(
  { side, className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("chu-swipe-row-actions", className)} data-side={side} {...rest} />;
});
