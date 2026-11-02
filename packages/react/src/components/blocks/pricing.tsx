/**
 * Pricing: Pricing, Plan, PlanRibbon, PlanName, PlanPrice, PlanCurrency, PlanAmount, PlanPeriod, PlanText,
 * PlanFeatures and PlanFeature. CSS from @jaatster/blip-blocks (pricing.css).
 */
import { forwardRef } from "react";
import type { ElementType } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../../internal/polymorphic.js";
import { cx, flag, type NativeProps, type Tone } from "../../internal/props.js";

/** Props for {@link Pricing}. */
export type PricingProps = NativeProps<"div">;

/**
 * Plans side by side, three across where there is room, stacked on a phone: panels, and one raised plan marked best
 * value. Three plans at most; mark one, and only one. No invented savings or crossed-out prices.
 *
 *   <Pricing>
 *     <Plan aria-labelledby="plan-standard">
 *       <PlanName id="plan-standard">Standard</PlanName>
 *       <PlanPrice>
 *         <PlanCurrency>$</PlanCurrency><PlanAmount>14.99</PlanAmount><PlanPeriod>one time</PlanPeriod>
 *       </PlanPrice>
 *       <PlanText>The whole game, yours to keep.</PlanText>
 *       <PlanFeatures>
 *         <PlanFeature>60 levels in four worlds</PlanFeature>
 *         <PlanFeature off>The soundtrack</PlanFeature>
 *       </PlanFeatures>
 *       <ButtonLink variant="soft" fullWidth href="#standard">Buy Standard</ButtonLink>
 *     </Plan>
 *     <Plan featured aria-labelledby="plan-deluxe">
 *       <PlanRibbon>Best value</PlanRibbon>
 *       …
 *       <ButtonLink fullWidth href="#deluxe">Buy Deluxe</ButtonLink>
 *     </Plan>
 *   </Pricing>
 *
 * Renders `<div class="blip-pricing">`.
 */
export const Pricing = /*#__PURE__*/ forwardRef<HTMLDivElement, PricingProps>(function Pricing({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("blip-pricing", className)} {...rest} />;
});

/**
 * Own props of {@link Plan}: a panel, or the featured plan, raised and banded in its tone. Only the featured plan
 * takes a tone.
 */
export type PlanOwnProps =
  | {
      /**
       * The plan to pick, marked best value: a raised panel with a band of its tone's light colour along the top, its
       * {@link PlanRibbon} in its candy, and the one candy button. `data-featured`.
       */
      featured: true;
      /** The featured plan's tone (its band, ribbon and button); the accent by default. `data-tone`. */
      tone?: Tone;
    }
  | { featured?: false; tone?: never };

export type PlanProps = PlanOwnProps & NativeProps<"article", { featured?: boolean; tone?: Tone }>;

/**
 * One plan: an `<article>` named by its plan name, with rows for the name, price, text, features and a full-width
 * button at the foot, so buttons line up across plans. A panel, or with `featured` the plan to pick (one per page):
 * raised, banded in its tone, with a {@link PlanRibbon}. Candy stays on what you press: the featured plan's button is
 * the candy one, in its tone; the others' are soft. Buttons name the plan: "Buy Deluxe".
 *
 *   <Plan featured aria-labelledby="plan-deluxe">
 *     <PlanRibbon>Best value</PlanRibbon>
 *     <PlanName id="plan-deluxe">Deluxe</PlanName>
 *     <PlanPrice>
 *       <PlanCurrency>$</PlanCurrency><PlanAmount>19.99</PlanAmount><PlanPeriod>one time</PlanPeriod>
 *     </PlanPrice>
 *     <PlanText>The game, its music, and how it was made.</PlanText>
 *     <PlanFeatures><PlanFeature>Everything in Standard</PlanFeature></PlanFeatures>
 *     <ButtonLink fullWidth href="#deluxe">Buy Deluxe</ButtonLink>
 *   </Plan>
 *
 * Renders `<article class="blip-box blip-plan" data-variant="panel">`, or `<article class="blip-box blip-plan"
 * data-featured>`.
 */
export const Plan = /*#__PURE__*/ forwardRef<HTMLElement, PlanProps>(function Plan({ featured, tone, className, ...rest }, ref) {
  return (
    <article
      ref={ref}
      className={cx("blip-box blip-plan", className)}
      data-variant={featured ? undefined : "panel"}
      data-featured={flag(featured)}
      data-tone={tone}
      {...rest}
    />
  );
});

/** Props for {@link PlanRibbon}. */
export type PlanRibbonProps = NativeProps<"p">;

/**
 * A small candy tab riding a plan's top edge, in Pixel Bop capitals: in the featured plan's candy on that plan, cream
 * elsewhere. Plain text inside the plan ("Best value").
 *
 *   <PlanRibbon>Best value</PlanRibbon>
 *
 * Renders `<p class="blip-box blip-plan-ribbon">`.
 */
export const PlanRibbon = /*#__PURE__*/ forwardRef<HTMLParagraphElement, PlanRibbonProps>(function PlanRibbon(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("blip-box blip-plan-ribbon", className)} {...rest} />;
});

/** Props for {@link PlanName}: a heading's own; `as` picks its level. */
export type PlanNameProps<T extends ElementType = "h3"> = PolymorphicProps<T, object>;

/**
 * The plan's name. Give it the id the plan is named by.
 *
 *   <PlanName id="plan-standard">Standard</PlanName>
 *
 * Renders `<h3 class="blip-plan-name">`.
 */
export const PlanName = /*#__PURE__*/ forwardRef(function PlanName(
  { as: Tag = "h3", className, ...rest }: PlanNameProps<ElementType>,
  ref,
) {
  return <Tag ref={ref} className={cx("blip-plan-name", className)} {...rest} />;
}) as PolymorphicComponent<"h3", object>;

/** Props for {@link PlanPrice}. */
export type PlanPriceProps = NativeProps<"p">;

/**
 * The price, read in order: its {@link PlanCurrency}, {@link PlanAmount} and {@link PlanPeriod} ("$ 14.99 one
 * time"). Say the currency and the period in words where they could be unclear.
 *
 *   <PlanPrice>
 *     <PlanCurrency>$</PlanCurrency><PlanAmount>14.99</PlanAmount><PlanPeriod>one time</PlanPeriod>
 *   </PlanPrice>
 *
 * Renders `<p class="blip-plan-price">`.
 */
export const PlanPrice = /*#__PURE__*/ forwardRef<HTMLParagraphElement, PlanPriceProps>(function PlanPrice(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("blip-plan-price", className)} {...rest} />;
});

/** Props for {@link PlanCurrency}. */
export type PlanCurrencyProps = NativeProps<"span">;

/**
 * The currency, set smaller and raised beside the amount.
 *
 *   <PlanCurrency>$</PlanCurrency>
 *
 * Renders `<span class="blip-plan-currency">`.
 */
export const PlanCurrency = /*#__PURE__*/ forwardRef<HTMLSpanElement, PlanCurrencyProps>(function PlanCurrency(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("blip-plan-currency", className)} {...rest} />;
});

/** Props for {@link PlanAmount}. */
export type PlanAmountProps = NativeProps<"span">;

/**
 * The amount, in Pixel Bop at scale 3 with tabular digits ("." and "," are in the font).
 *
 *   <PlanAmount>14.99</PlanAmount>
 *
 * Renders `<span class="blip-plan-amount">`.
 */
export const PlanAmount = /*#__PURE__*/ forwardRef<HTMLSpanElement, PlanAmountProps>(function PlanAmount(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("blip-plan-amount", className)} {...rest} />;
});

/** Props for {@link PlanPeriod}. */
export type PlanPeriodProps = NativeProps<"span">;

/**
 * How often it is paid, small and bold after the amount: "one time", "a month".
 *
 *   <PlanPeriod>one time</PlanPeriod>
 *
 * Renders `<span class="blip-plan-period">`.
 */
export const PlanPeriod = /*#__PURE__*/ forwardRef<HTMLSpanElement, PlanPeriodProps>(function PlanPeriod(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("blip-plan-period", className)} {...rest} />;
});

/** Props for {@link PlanText}. */
export type PlanTextProps = NativeProps<"p">;

/**
 * A line under the price: what the plan is, in a few words.
 *
 *   <PlanText>The whole game, yours to keep.</PlanText>
 *
 * Renders `<p class="blip-plan-text">`.
 */
export const PlanText = /*#__PURE__*/ forwardRef<HTMLParagraphElement, PlanTextProps>(function PlanText({ className, ...rest }, ref) {
  return <p ref={ref} className={cx("blip-plan-text", className)} {...rest} />;
});

/** Props for {@link PlanFeatures}. */
export type PlanFeaturesProps = NativeProps<"ul">;

/**
 * What the plan includes, one {@link PlanFeature} each, with pixel checks; what it leaves out with a dash. Name what
 * changes between plans: repeat "Everything in Standard" rather than every line.
 *
 *   <PlanFeatures>
 *     <PlanFeature>Couch co-op for two</PlanFeature>
 *     <PlanFeature off>The art book</PlanFeature>
 *   </PlanFeatures>
 *
 * Renders `<ul class="blip-plan-features" role="list">`.
 */
export const PlanFeatures = /*#__PURE__*/ forwardRef<HTMLUListElement, PlanFeaturesProps>(function PlanFeatures(
  { role = "list", className, ...rest },
  ref,
) {
  return <ul ref={ref} className={cx("blip-plan-features", className)} role={role} {...rest} />;
});

/** Own props of {@link PlanFeature}. */
export interface PlanFeatureOwnProps {
  /** Left out of this plan: a dash and muted text, still read as text. `data-off`. */
  off?: boolean;
}

export type PlanFeatureProps = PlanFeatureOwnProps & NativeProps<"li", PlanFeatureOwnProps>;

/**
 * One line of a plan's features, after a pixel check in the success text colour.
 *
 *   <PlanFeature>Free updates and new levels</PlanFeature>
 *   <PlanFeature off>The soundtrack</PlanFeature>
 *
 * Renders `<li>`, or `<li data-off>`.
 */
export const PlanFeature = /*#__PURE__*/ forwardRef<HTMLLIElement, PlanFeatureProps>(function PlanFeature({ off, ...rest }, ref) {
  return <li ref={ref} data-off={flag(off)} {...rest} />;
});
