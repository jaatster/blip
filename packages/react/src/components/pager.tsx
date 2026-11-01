/**
 * Pager: PagerTrack, PagerSlide, PagerDots and PagerDot, the parts that go inside <Pager> (generated from its
 * element, re-exported here). CSS from @jaatster/blip-components (pager.css).
 */
import { forwardRef } from "react";
import { cx, type NativeProps } from "../internal/props.js";

export { Pager, type PagerProps } from "../generated/elements.js";

/** Props for {@link PagerTrack}. */
export type PagerTrackProps = NativeProps<"div">;

/**
 * The row of slides: it scrolls sideways and snaps to each, never past one. Inside `<Pager>`, before the dots.
 *
 *   <Pager aria-label="New worlds">
 *     <PagerTrack>
 *       <PagerSlide id="world-1" aria-label="1 of 3">…</PagerSlide>
 *       …
 *     </PagerTrack>
 *     <PagerDots>
 *       <PagerDot href="#world-1" current aria-label="Meadow" />
 *       …
 *     </PagerDots>
 *   </Pager>
 *
 * Renders `<div class="chu-pager-track">`.
 */
export const PagerTrack = /*#__PURE__*/ forwardRef<HTMLDivElement, PagerTrackProps>(function PagerTrack({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("chu-pager-track", className)} {...rest} />;
});

/** Props for {@link PagerSlide}: it needs an `id` for its dot, and a name. */
export type PagerSlideProps = { id: string } & ({ "aria-label": string } | { "aria-labelledby": string }) & NativeProps<"section">;

/**
 * One slide, the track's full width: a card, a picture, a step of a tour. Name it "2 of 4", or by its heading.
 *
 *   <PagerSlide id="world-2" aria-label="2 of 4"><Card>…</Card></PagerSlide>
 *
 * Renders `<section class="chu-pager-slide" role="group" aria-roledescription="slide">`.
 */
export const PagerSlide = /*#__PURE__*/ forwardRef<HTMLElement, PagerSlideProps>(function PagerSlide({ className, ...rest }, ref) {
  return <section ref={ref} className={cx("chu-pager-slide", className)} role="group" aria-roledescription="slide" {...rest} />;
});

/** Props for {@link PagerDots}. */
export type PagerDotsProps = NativeProps<"div">;

/**
 * The dots under the track, one {@link PagerDot} per slide. `<Pager>` puts its previous and next buttons at either
 * end.
 *
 *   <PagerDots>…</PagerDots>
 *
 * Renders `<div class="chu-pager-dots">`.
 */
export const PagerDots = /*#__PURE__*/ forwardRef<HTMLDivElement, PagerDotsProps>(function PagerDots({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("chu-pager-dots", className)} {...rest} />;
});

/** Own props of {@link PagerDot}. */
export interface PagerDotOwnProps {
  /** The `#id` of its slide. */
  href: string;
  /**
   * The slide showing: a wider candy pill. Write it on the first dot; `<Pager>` keeps it in step after.
   * `aria-current="true"`.
   */
  current?: boolean;
}

/** Props for {@link PagerDot}: it needs a name, its slide's. */
export type PagerDotProps = PagerDotOwnProps & ({ "aria-label": string } | { "aria-labelledby": string }) & Omit<NativeProps<"a", PagerDotOwnProps>, "children">;

/**
 * A link to one slide: a four-pixel dot in a 24 px target.
 *
 *   <PagerDot href="#world-1" current aria-label="Meadow" />
 *
 * Renders `<a class="chu-pager-dot">`.
 */
export const PagerDot = /*#__PURE__*/ forwardRef<HTMLAnchorElement, PagerDotProps>(function PagerDot({ current, className, ...rest }, ref) {
  return <a ref={ref} className={cx("chu-pager-dot", className)} aria-current={current ? "true" : undefined} {...rest} />;
});
