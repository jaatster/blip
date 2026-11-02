/**
 * Progress steps: ProgressSteps, ProgressStepsList, ProgressStepsItem, ProgressStepsMarker, ProgressStepsLabel and
 * ProgressStepsHint. CSS from @jaatster/blip-components (progress-steps.css). A link to the page you are on takes `current`
 * (`aria-current="page"`); list items with no class of their own stay plain `<li>`s.
 */
import { forwardRef } from "react";
import { box, cx, flag } from "../internal/props.js";
import type { BoxProps, NativeProps } from "../internal/props.js";

/** A landmark, list or group needs a name: `aria-label`, or `aria-labelledby` pointing at its heading. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

const current = (on: boolean | undefined) => (on ? "page" : undefined);

/** Own props of {@link ProgressSteps}. */
export interface ProgressStepsOwnProps {
  /** `vertical`: down the side, hints beside the steps (checklists, long names). `data-orientation`. */
  orientation?: "horizontal" | "vertical";
  /** The TV's pointer arrow over the current step (beside it, down the side) bobs a few beats. `data-arrow`. */
  arrow?: boolean;
}

/** Props for {@link ProgressSteps}. */
export type ProgressStepsProps = ProgressStepsOwnProps & NativeProps<"div", ProgressStepsOwnProps>;

/**
 * The steps of a task in order, for wizards, checkouts and first-run checklists: done steps green with a check, the
 * current step sitting in, upcoming ones in outline, and a line joining them. Done steps can be links back (a plain
 * `<a>` around the marker and label); the current and upcoming steps are text.
 *
 *   <ProgressSteps arrow>
 *     <ProgressStepsList aria-label="Checkout">
 *       <ProgressStepsItem done>
 *         <a href="/checkout/basket">
 *           <ProgressStepsMarker>1</ProgressStepsMarker>
 *           <ProgressStepsLabel>Basket<span className="blip-sr-only">, done</span></ProgressStepsLabel>
 *         </a>
 *       </ProgressStepsItem>
 *       <ProgressStepsItem current>
 *         <ProgressStepsMarker>2</ProgressStepsMarker>
 *         <ProgressStepsLabel>Payment</ProgressStepsLabel>
 *         <ProgressStepsHint>Card or coins</ProgressStepsHint>
 *       </ProgressStepsItem>
 *     </ProgressStepsList>
 *   </ProgressSteps>
 *
 * Renders `<div class="blip-progress-steps">`, a size container: under 480 px the hints step aside, under 300 px only
 * the current step keeps its label on screen.
 */
export const ProgressSteps = /*#__PURE__*/ forwardRef<HTMLDivElement, ProgressStepsProps>(function ProgressSteps(
  { orientation, arrow, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx("blip-progress-steps", className)}
      data-orientation={orientation}
      data-arrow={flag(arrow)}
      {...rest}
    />
  );
});

/** Props for {@link ProgressStepsList}. */
export type ProgressStepsListProps = Named & NativeProps<"ol">;

/**
 * The steps: an ordered list with a name, so each step is announced with its position.
 *
 *   <ProgressStepsList aria-label="Checkout">…</ProgressStepsList>
 *
 * Renders `<ol class="blip-progress-steps-list">`.
 */
export const ProgressStepsList = /*#__PURE__*/ forwardRef<HTMLOListElement, ProgressStepsListProps>(function ProgressStepsList(
  { className, ...rest },
  ref,
) {
  return <ol ref={ref} className={cx("blip-progress-steps-list", className)} {...rest} />;
});

/** Own props of {@link ProgressStepsItem}. */
export interface ProgressStepsItemOwnProps {
  /** Finished: green candy and a check, a solid line on. Say so in its label too (", done"). `data-state="done"`. */
  done?: boolean;
  /** The step you are on: sits in, in the accent (or its marker's tone). `aria-current="step"`. */
  current?: boolean;
}

/** Props for {@link ProgressStepsItem}. */
export type ProgressStepsItemProps = ProgressStepsItemOwnProps & NativeProps<"li", ProgressStepsItemOwnProps>;

/**
 * A step: its marker, its label and an optional hint (in a link back, for a done step). Upcoming steps take neither
 * `done` nor `current`.
 *
 *   <ProgressStepsItem current>
 *     <ProgressStepsMarker>2</ProgressStepsMarker><ProgressStepsLabel>Payment</ProgressStepsLabel>
 *   </ProgressStepsItem>
 *
 * Renders `<li class="blip-progress-steps-item">`.
 */
export const ProgressStepsItem = /*#__PURE__*/ forwardRef<HTMLLIElement, ProgressStepsItemProps>(function ProgressStepsItem(
  { done, current: isCurrent, className, ...rest },
  ref,
) {
  return (
    <li
      ref={ref}
      className={cx("blip-progress-steps-item", className)}
      data-state={done ? "done" : undefined}
      aria-current={isCurrent ? "step" : undefined}
      {...rest}
    />
  );
});

/** Own props of {@link ProgressStepsMarker}. */
export type ProgressStepsMarkerOwnProps = Pick<BoxProps, "tone" | "radius">;

/** Props for {@link ProgressStepsMarker}. */
export type ProgressStepsMarkerProps = ProgressStepsMarkerOwnProps & NativeProps<"span", ProgressStepsMarkerOwnProps>;

/**
 * A step's 14-pixel box with its number, counted from 1; a check replaces the number once the step is done. Its
 * tone colours the current step.
 *
 *   <ProgressStepsMarker tone="pink">1</ProgressStepsMarker>
 *
 * Renders `<span class="blip-box blip-progress-steps-marker">`.
 */
export const ProgressStepsMarker = /*#__PURE__*/ forwardRef<HTMLSpanElement, ProgressStepsMarkerProps>(function ProgressStepsMarker(
  { tone, radius, className, ...rest },
  ref,
) {
  return (
    <span ref={ref} className={cx("blip-box blip-progress-steps-marker", className)} {...box({ tone, radius })} {...rest} />
  );
});

/** Props for {@link ProgressStepsLabel}. */
export type ProgressStepsLabelProps = NativeProps<"span">;

/**
 * A step's name, upper case and bold: one or two words.
 *
 *   <ProgressStepsLabel>Basket<span className="blip-sr-only">, done</span></ProgressStepsLabel>
 *
 * Renders `<span class="blip-progress-steps-label">`.
 */
export const ProgressStepsLabel = /*#__PURE__*/ forwardRef<HTMLSpanElement, ProgressStepsLabelProps>(function ProgressStepsLabel(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("blip-progress-steps-label", className)} {...rest} />;
});

/** Props for {@link ProgressStepsHint}. */
export type ProgressStepsHintProps = NativeProps<"span">;

/**
 * An optional short phrase under a step's label (beside it, down the side).
 *
 *   <ProgressStepsHint>Card or coins</ProgressStepsHint>
 *
 * Renders `<span class="blip-progress-steps-hint">`.
 */
export const ProgressStepsHint = /*#__PURE__*/ forwardRef<HTMLSpanElement, ProgressStepsHintProps>(function ProgressStepsHint(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("blip-progress-steps-hint", className)} {...rest} />;
});
