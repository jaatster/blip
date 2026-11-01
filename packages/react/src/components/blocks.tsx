/**
 * Website blocks: Hero, Features, Pricing, CtaBand and Footer, with their parts. CSS from @jaatster/blip-blocks
 * (blocks.css, or one file per block: hero.css, features.css, pricing.css, cta.css, footer.css).
 *
 * The hero and the CTA band stand on the world: pass a `<World>` (from @jaatster/blip-react/effects) as their first
 * child; without it, and until it draws, their own sky shows, the scheme's palette in hard bands. Their calls to
 * action are a `<ButtonLink>` (or `<Button>`) from @jaatster/blip-react.
 */
import { Fragment, forwardRef } from "react";
import type { CSSProperties, ElementType, ReactNode } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { cx, flag, type NativeProps, type Tone } from "../internal/props.js";

/** A name: `aria-label`, or `aria-labelledby` naming the words' id. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

/** What a POP part repeats in `data-pop` (the tint on its letters' lower rows): its children, when they are text. */
const popText = (children: ReactNode): string | undefined =>
  typeof children === "string" || typeof children === "number" ? String(children) : undefined;

/* ---------------------------------------------------------------------------------------------------------------
 * Hero (hero.css): the top of a landing page, on the world.
 * ------------------------------------------------------------------------------------------------------------- */

/** Own props of {@link Hero}. */
export interface HeroOwnProps {
  /** Where the text sits: centred (the default), or at the start, for a hero beside a picture. `data-align="start"`. */
  align?: "center" | "start";
}
export type HeroProps = HeroOwnProps & NativeProps<"section", HeroOwnProps>;

/**
 * The top of a landing page: a POP headline whose letters drop in one after another, a lead, a candy call to action
 * and a soft second one, over the world with a strip of ground along the bottom. Pass a `<World>` first; before it
 * draws, or without it, the hero's own sky is the scheme's palette in hard bands. Keep the content narrow so the
 * world shows, and two actions at most. Name it by its title.
 *
 *   <Hero aria-labelledby="hero-title">
 *     <World parallax avoid=".pp-hero-title, .pp-hero-lead, .pp-hero-actions, .pp-hero-note" />
 *     <HeroInner>
 *       <HeroTitle id="hero-title">Starfall Meadow</HeroTitle>
 *       <HeroLead>Catch the stars that fall on the meadow before the sun comes up.</HeroLead>
 *       <HeroActions>
 *         <ButtonLink size="lg" href="#editions">Wishlist now</ButtonLink>
 *         <ButtonLink size="lg" variant="soft" tone="neutral" href="#demo">Play the free demo</ButtonLink>
 *       </HeroActions>
 *       <HeroNote>Out this spring, on desktop</HeroNote>
 *     </HeroInner>
 *     <HeroScenery>…sprites standing on the ground…</HeroScenery>
 *     <HeroGround />
 *   </Hero>
 *
 * Renders `<section class="pp-hero">`.
 */
export const Hero = /*#__PURE__*/ forwardRef<HTMLElement, HeroProps>(function Hero({ align, className, ...rest }, ref) {
  return (
    <section
      ref={ref}
      className={cx("pp-hero", className)}
      data-align={align === "start" ? "start" : undefined}
      {...rest}
    />
  );
});

/** Props for {@link HeroInner}. */
export type HeroInnerProps = NativeProps<"div">;

/**
 * The hero's content, centred in a column at most 560 pixels wide: title, lead, actions, note.
 *
 *   <HeroInner><HeroTitle id="hero-title">Starfall Meadow</HeroTitle>…</HeroInner>
 *
 * Renders `<div class="pp-hero-inner">`.
 */
export const HeroInner = /*#__PURE__*/ forwardRef<HTMLDivElement, HeroInnerProps>(function HeroInner({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("pp-hero-inner", className)} {...rest} />;
});

/** Own props of {@link HeroTitle}. */
export interface HeroTitleOwnProps {
  /** The headline, as text: screen readers hear it whole; the page draws it a letter at a time. */
  children: string;
}
export type HeroTitleProps<T extends ElementType = "h1"> = PolymorphicProps<T, HeroTitleOwnProps>;

/**
 * The headline, in POP at the whole scale that fits: 2 below 600 pixels wide, 3 below 1024, then 4. Words never
 * break and lines balance. It splits the text for you: a hidden copy for screen readers, then the letters, each
 * dropping in on its frame (`--i`, its place in the line), a beat between words. With reduced motion it is simply
 * there. The product's name or a short promise: two words fit best.
 *
 *   <HeroTitle id="hero-title">Starfall Meadow</HeroTitle>
 *
 * Renders `<h1 class="pp-hero-title pp-display">` holding `<span class="pp-sr-only">` (the text), then `<span
 * aria-hidden="true">` with a `<span class="pp-hero-word">` per word of `<span class="pp-pop pp-drop-in"
 * data-pop="S" style="--i: 0">` letters.
 */
// The public type (the cast below) requires the text; inside, it is read as it comes.
export const HeroTitle = /*#__PURE__*/ forwardRef(function HeroTitle(
  { as: Tag = "h1", className, children, ...rest }: PolymorphicProps<ElementType, Partial<HeroTitleOwnProps>>,
  ref,
) {
  const text = String(children ?? "");
  let next = 0;
  const words = text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const letters = [...word];
      const first = next;
      next += letters.length + 1; // a beat between words
      return { letters, first };
    });
  return (
    <Tag ref={ref} className={cx("pp-hero-title pp-display", className)} {...rest}>
      <span className="pp-sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map(({ letters, first }, w) => (
          <Fragment key={w}>
            {w > 0 ? " " : null}
            <span className="pp-hero-word">
              {letters.map((letter, l) => (
                <span
                  key={l}
                  className="pp-pop pp-drop-in"
                  data-pop={letter}
                  style={{ "--i": first + l } as CSSProperties}
                >
                  {letter}
                </span>
              ))}
            </span>
          </Fragment>
        ))}
      </span>
    </Tag>
  );
}) as PolymorphicComponent<"h1", HeroTitleOwnProps>;

/** Props for {@link HeroLead}. */
export type HeroLeadProps = NativeProps<"p">;

/**
 * The subhead: one or two sentences, what it is and who it is for. Keep it in the upper part of the hero, above the
 * hills.
 *
 *   <HeroLead>Catch the stars that fall on the meadow before the sun comes up.</HeroLead>
 *
 * Renders `<p class="pp-hero-lead">`.
 */
export const HeroLead = /*#__PURE__*/ forwardRef<HTMLParagraphElement, HeroLeadProps>(function HeroLead({ className, ...rest }, ref) {
  return <p ref={ref} className={cx("pp-hero-lead", className)} {...rest} />;
});

/** Props for {@link HeroActions}. */
export type HeroActionsProps = NativeProps<"div">;

/**
 * The calls to action, in a row that wraps: one candy button for the main action, a soft one beside it. Links if
 * they go somewhere.
 *
 *   <HeroActions>
 *     <ButtonLink size="lg" href="#editions">Wishlist now</ButtonLink>
 *     <ButtonLink size="lg" variant="soft" tone="neutral" href="#demo">Play the free demo</ButtonLink>
 *   </HeroActions>
 *
 * Renders `<div class="pp-hero-actions">`.
 */
export const HeroActions = /*#__PURE__*/ forwardRef<HTMLDivElement, HeroActionsProps>(function HeroActions(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("pp-hero-actions", className)} {...rest} />;
});

/** Props for {@link HeroNote}. */
export type HeroNoteProps = NativeProps<"p">;

/**
 * One small bold fact under the actions (when, where): never a claim you can't stand behind.
 *
 *   <HeroNote>Out this spring, on desktop</HeroNote>
 *
 * Renders `<p class="pp-hero-note">`.
 */
export const HeroNote = /*#__PURE__*/ forwardRef<HTMLParagraphElement, HeroNoteProps>(function HeroNote({ className, ...rest }, ref) {
  return <p ref={ref} className={cx("pp-hero-note", className)} {...rest} />;
});

/** Props for {@link HeroScenery}. */
export type HeroSceneryProps = NativeProps<"div">;

/**
 * Things standing on the ground behind the text: sprites, blocks, a sign, placed absolutely from the bottom. Scenery
 * only, hidden from assistive technology. Stand it on the ground, never in the sky where text flows on a phone.
 *
 *   <HeroScenery><Sprite name="star" style={{ position: "absolute", left: "6%", bottom: 0 }} /></HeroScenery>
 *
 * Renders `<div class="pp-hero-scenery" aria-hidden="true">`.
 */
export const HeroScenery = /*#__PURE__*/ forwardRef<HTMLDivElement, HeroSceneryProps>(function HeroScenery(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("pp-hero-scenery", className)} aria-hidden={true} {...rest} />;
});

/** Props for {@link HeroGround}. */
export type HeroGroundProps = NativeProps<"div", { children?: never }> & { children?: never };

/**
 * The ground along the hero's bottom: blades of grass, grass, a lip, dirt with pebbles, flowers
 * (`--pp-hero-ground` pixels, 24). Last in the hero.
 *
 *   <HeroGround />
 *
 * Renders `<div class="pp-hero-ground">`.
 */
export const HeroGround = /*#__PURE__*/ forwardRef<HTMLDivElement, HeroGroundProps>(function HeroGround({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("pp-hero-ground", className)} {...rest} />;
});

/* ---------------------------------------------------------------------------------------------------------------
 * Features (features.css): what the product does, in a grid that varies its scale.
 * ------------------------------------------------------------------------------------------------------------- */

/** Props for {@link Features}. */
export type FeaturesProps = NativeProps<"section">;

/**
 * What the product does, in a grid that varies its scale: a lead feature with room for a picture, tiles beside it,
 * stat tiles with one big number, and a wide band across the bottom. Not a row of identical cards. Name it by its
 * title.
 *
 *   <Features aria-labelledby="features-title">
 *     <FeaturesHead>
 *       <FeaturesTitle id="features-title">A small world that keeps time</FeaturesTitle>
 *       <FeaturesLead>Sixty short levels, made to be played a few at a time.</FeaturesLead>
 *     </FeaturesHead>
 *     <FeaturesGrid>
 *       <Feature layout="lead">
 *         <FeatureMedia aria-hidden="true">…a picture…</FeatureMedia>
 *         <FeatureTitle>A meadow that keeps time</FeatureTitle>
 *         <FeatureText>The world follows your clock.</FeatureText>
 *       </Feature>
 *       <Feature tone="pink">
 *         <FeatureIcon tone="pink"><Icon name="users" /></FeatureIcon>
 *         <FeatureTitle>Couch co-op</FeatureTitle>
 *         <FeatureText>A friend can hop in or out at any moment.</FeatureText>
 *       </Feature>
 *       <Feature layout="stat" tone="blue">
 *         <FeatureStat>60</FeatureStat>
 *         <FeatureText>hand-made levels in four worlds</FeatureText>
 *       </Feature>
 *     </FeaturesGrid>
 *   </Features>
 *
 * Renders `<section class="pp-features">`.
 */
export const Features = /*#__PURE__*/ forwardRef<HTMLElement, FeaturesProps>(function Features({ className, ...rest }, ref) {
  return <section ref={ref} className={cx("pp-features", className)} {...rest} />;
});

/** Props for {@link FeaturesHead}. */
export type FeaturesHeadProps = NativeProps<"header">;

/**
 * The block's head: the title and a lead.
 *
 *   <FeaturesHead><FeaturesTitle>…</FeaturesTitle><FeaturesLead>…</FeaturesLead></FeaturesHead>
 *
 * Renders `<header class="pp-features-head">`.
 */
export const FeaturesHead = /*#__PURE__*/ forwardRef<HTMLElement, FeaturesHeadProps>(function FeaturesHead(
  { className, ...rest },
  ref,
) {
  return <header ref={ref} className={cx("pp-features-head", className)} {...rest} />;
});

/** Props for {@link FeaturesTitle}: a heading's own; `as` picks its level. */
export type FeaturesTitleProps<T extends ElementType = "h2"> = PolymorphicProps<T, object>;

/**
 * The block's title. Give it the id the section is named by.
 *
 *   <FeaturesTitle id="features-title">A small world that keeps time</FeaturesTitle>
 *
 * Renders `<h2 class="pp-features-title">`.
 */
export const FeaturesTitle = /*#__PURE__*/ forwardRef(function FeaturesTitle(
  { as: Tag = "h2", className, ...rest }: FeaturesTitleProps<ElementType>,
  ref,
) {
  return <Tag ref={ref} className={cx("pp-features-title", className)} {...rest} />;
}) as PolymorphicComponent<"h2", object>;

/** Props for {@link FeaturesLead}. */
export type FeaturesLeadProps = NativeProps<"p">;

/**
 * A sentence under the title, in the muted text colour.
 *
 *   <FeaturesLead>Sixty short levels, made to be played a few at a time.</FeaturesLead>
 *
 * Renders `<p class="pp-features-lead">`.
 */
export const FeaturesLead = /*#__PURE__*/ forwardRef<HTMLParagraphElement, FeaturesLeadProps>(function FeaturesLead(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("pp-features-lead", className)} {...rest} />;
});

/** Props for {@link FeaturesGrid}. */
export type FeaturesGridProps = NativeProps<"div">;

/**
 * The features' grid: one column below 600 pixels wide, two below 1024, then six; its order is the reading order at
 * every width. Lead with the feature that makes the product different.
 *
 *   <FeaturesGrid><Feature layout="lead">…</Feature><Feature tone="pink">…</Feature></FeaturesGrid>
 *
 * Renders `<div class="pp-features-grid">`.
 */
export const FeaturesGrid = /*#__PURE__*/ forwardRef<HTMLDivElement, FeaturesGridProps>(function FeaturesGrid(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("pp-features-grid", className)} {...rest} />;
});

/** Own props of {@link Feature}. */
export interface FeatureOwnProps {
  /**
   * Its place in the wide grid: `lead` (four of six columns, two rows, a picture on top; one per grid), `stat` (a big
   * number and its caption), `wide` (the whole row, side by side), or left out for a tile (two columns).
   * `data-layout`.
   */
  layout?: "lead" | "stat" | "wide";
  /** The tier: a panel (the default for lead and wide) or soft candy (the default for tiles, stats). `data-variant`. */
  variant?: "panel" | "soft";
  /** A soft feature's candy; vary them. `data-tone`. */
  tone?: Tone;
}
export type FeatureProps = FeatureOwnProps & NativeProps<"article", FeatureOwnProps>;

/**
 * One feature: an `<article>` in a candy box (a panel for the lead and the wide band, soft candy for tiles and stats)
 * with an icon or a picture, a real heading and a sentence or two. Not a link: put one inside if it goes somewhere.
 *
 *   <Feature tone="pink">
 *     <FeatureIcon tone="pink"><Icon name="users" /></FeatureIcon>
 *     <FeatureTitle>Couch co-op</FeatureTitle>
 *     <FeatureText>A friend can hop in or out at any moment.</FeatureText>
 *   </Feature>
 *
 * Renders `<article class="pp-box pp-feature" data-variant="soft">` (`data-variant="panel"` for lead and wide).
 */
export const Feature = /*#__PURE__*/ forwardRef<HTMLElement, FeatureProps>(function Feature(
  { layout, variant, tone, className, ...rest },
  ref,
) {
  return (
    <article
      ref={ref}
      className={cx("pp-box pp-feature", className)}
      data-layout={layout}
      data-variant={variant ?? (layout === "lead" || layout === "wide" ? "panel" : "soft")}
      data-tone={tone}
      {...rest}
    />
  );
});

/** Props for {@link FeatureMedia}. */
export type FeatureMediaProps = NativeProps<"div">;

/**
 * The lead feature's picture slot, as wide as the panel; it grows to fill the lead's two rows. First in the feature.
 * Hide a picture that only decorates (`aria-hidden`).
 *
 *   <FeatureMedia aria-hidden="true"><img src={shot} alt="" /></FeatureMedia>
 *
 * Renders `<div class="pp-feature-media">`.
 */
export const FeatureMedia = /*#__PURE__*/ forwardRef<HTMLDivElement, FeatureMediaProps>(function FeatureMedia(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("pp-feature-media", className)} {...rest} />;
});

/** Own props of {@link FeatureIcon}. */
export interface FeatureIconOwnProps {
  /** The icon box's candy, usually the feature's. `data-tone`. */
  tone?: Tone;
}
export type FeatureIconProps = FeatureIconOwnProps & NativeProps<"span", FeatureIconOwnProps>;

/**
 * A small candy box with the feature's icon. The icon is decoration (`aria-hidden`): the heading says what it shows.
 *
 *   <FeatureIcon tone="pink"><Icon name="users" /></FeatureIcon>
 *
 * Renders `<span class="pp-box pp-feature-icon">`.
 */
export const FeatureIcon = /*#__PURE__*/ forwardRef<HTMLSpanElement, FeatureIconProps>(function FeatureIcon(
  { tone, className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("pp-box pp-feature-icon", className)} data-tone={tone} {...rest} />;
});

/** Props for {@link FeatureTitle}: a heading's own; `as` picks its level. */
export type FeatureTitleProps<T extends ElementType = "h3"> = PolymorphicProps<T, object>;

/**
 * A feature's heading: short. Bigger on the lead.
 *
 *   <FeatureTitle>Couch co-op</FeatureTitle>
 *
 * Renders `<h3 class="pp-feature-title">`.
 */
export const FeatureTitle = /*#__PURE__*/ forwardRef(function FeatureTitle(
  { as: Tag = "h3", className, ...rest }: FeatureTitleProps<ElementType>,
  ref,
) {
  return <Tag ref={ref} className={cx("pp-feature-title", className)} {...rest} />;
}) as PolymorphicComponent<"h3", object>;

/** Props for {@link FeatureText}. */
export type FeatureTextProps = NativeProps<"p">;

/**
 * A feature's words: one or two sentences; on a stat, what the number counts.
 *
 *   <FeatureText>A friend can hop in or out at any moment, on one keyboard or two gamepads.</FeatureText>
 *
 * Renders `<p class="pp-feature-text">`.
 */
export const FeatureText = /*#__PURE__*/ forwardRef<HTMLParagraphElement, FeatureTextProps>(function FeatureText(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("pp-feature-text", className)} {...rest} />;
});

/** Own props of {@link FeatureStat}. */
export interface FeatureStatOwnProps {
  /** The number's POP colours, usually the feature's candy (the accent by default). `data-tone`. */
  tone?: Tone;
}
export type FeatureStatProps = FeatureStatOwnProps & NativeProps<"p", FeatureStatOwnProps>;

/**
 * A stat feature's one honest number, in Pixel Bop at scale 3, POP. Its caption follows in a {@link FeatureText}, so
 * the two read as one: "60 hand-made levels in four worlds".
 *
 *   <Feature layout="stat" tone="purple">
 *     <FeatureStat tone="purple">24</FeatureStat>
 *     <FeatureText>chiptune tracks, one for every hour</FeatureText>
 *   </Feature>
 *
 * Renders `<p class="pp-feature-stat pp-pop" data-pop="24">`; `data-pop` repeats the number (when the children are
 * text).
 */
export const FeatureStat = /*#__PURE__*/ forwardRef<HTMLParagraphElement, FeatureStatProps>(function FeatureStat(
  { tone, className, children, ...rest },
  ref,
) {
  return (
    <p
      ref={ref}
      className={cx("pp-feature-stat pp-pop", className)}
      data-tone={tone}
      data-pop={popText(children)}
      {...rest}
    >
      {children}
    </p>
  );
});

/** Props for {@link FeatureChips}. */
export type FeatureChipsProps = NativeProps<"ul">;

/**
 * Small things in a row (options, languages), each a {@link FeatureChip}: the wide band's closing list.
 *
 *   <FeatureChips><FeatureChip>Assist mode</FeatureChip><FeatureChip>Remap any key</FeatureChip></FeatureChips>
 *
 * Renders `<ul class="pp-feature-chips" role="list">`.
 */
export const FeatureChips = /*#__PURE__*/ forwardRef<HTMLUListElement, FeatureChipsProps>(function FeatureChips(
  { role = "list", className, ...rest },
  ref,
) {
  return <ul ref={ref} className={cx("pp-feature-chips", className)} role={role} {...rest} />;
});

/** Own props of {@link FeatureChip}. */
export interface FeatureChipOwnProps {
  /** The chip's candy; neutral by default. `data-tone`. */
  tone?: Tone;
}
export type FeatureChipProps = FeatureChipOwnProps & NativeProps<"li", FeatureChipOwnProps>;

/**
 * One chip in {@link FeatureChips}: a small soft candy box.
 *
 *   <FeatureChip>Reduced motion</FeatureChip>
 *
 * Renders `<li class="pp-box" data-variant="soft" data-tone="neutral">`.
 */
export const FeatureChip = /*#__PURE__*/ forwardRef<HTMLLIElement, FeatureChipProps>(function FeatureChip(
  { tone = "neutral", className, ...rest },
  ref,
) {
  return <li ref={ref} className={cx("pp-box", className)} data-variant="soft" data-tone={tone} {...rest} />;
});

/* ---------------------------------------------------------------------------------------------------------------
 * Pricing (pricing.css): plans side by side.
 * ------------------------------------------------------------------------------------------------------------- */

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
 *     <Plan featured tone="pink" aria-labelledby="plan-deluxe">
 *       <PlanRibbon>Best value</PlanRibbon>
 *       …
 *       <ButtonLink tone="pink" fullWidth href="#deluxe">Buy Deluxe</ButtonLink>
 *     </Plan>
 *   </Pricing>
 *
 * Renders `<div class="pp-pricing">`.
 */
export const Pricing = /*#__PURE__*/ forwardRef<HTMLDivElement, PricingProps>(function Pricing({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("pp-pricing", className)} {...rest} />;
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
 *   <Plan featured tone="pink" aria-labelledby="plan-deluxe">
 *     <PlanRibbon>Best value</PlanRibbon>
 *     <PlanName id="plan-deluxe">Deluxe</PlanName>
 *     <PlanPrice>
 *       <PlanCurrency>$</PlanCurrency><PlanAmount>19.99</PlanAmount><PlanPeriod>one time</PlanPeriod>
 *     </PlanPrice>
 *     <PlanText>The game, its music, and how it was made.</PlanText>
 *     <PlanFeatures><PlanFeature>Everything in Standard</PlanFeature></PlanFeatures>
 *     <ButtonLink tone="pink" fullWidth href="#deluxe">Buy Deluxe</ButtonLink>
 *   </Plan>
 *
 * Renders `<article class="pp-box pp-plan" data-variant="panel">`, or `<article class="pp-box pp-plan"
 * data-featured>`.
 */
export const Plan = /*#__PURE__*/ forwardRef<HTMLElement, PlanProps>(function Plan({ featured, tone, className, ...rest }, ref) {
  return (
    <article
      ref={ref}
      className={cx("pp-box pp-plan", className)}
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
 * Renders `<p class="pp-box pp-plan-ribbon">`.
 */
export const PlanRibbon = /*#__PURE__*/ forwardRef<HTMLParagraphElement, PlanRibbonProps>(function PlanRibbon(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("pp-box pp-plan-ribbon", className)} {...rest} />;
});

/** Props for {@link PlanName}: a heading's own; `as` picks its level. */
export type PlanNameProps<T extends ElementType = "h3"> = PolymorphicProps<T, object>;

/**
 * The plan's name. Give it the id the plan is named by.
 *
 *   <PlanName id="plan-standard">Standard</PlanName>
 *
 * Renders `<h3 class="pp-plan-name">`.
 */
export const PlanName = /*#__PURE__*/ forwardRef(function PlanName(
  { as: Tag = "h3", className, ...rest }: PlanNameProps<ElementType>,
  ref,
) {
  return <Tag ref={ref} className={cx("pp-plan-name", className)} {...rest} />;
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
 * Renders `<p class="pp-plan-price">`.
 */
export const PlanPrice = /*#__PURE__*/ forwardRef<HTMLParagraphElement, PlanPriceProps>(function PlanPrice(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("pp-plan-price", className)} {...rest} />;
});

/** Props for {@link PlanCurrency}. */
export type PlanCurrencyProps = NativeProps<"span">;

/**
 * The currency, set smaller and raised beside the amount.
 *
 *   <PlanCurrency>$</PlanCurrency>
 *
 * Renders `<span class="pp-plan-currency">`.
 */
export const PlanCurrency = /*#__PURE__*/ forwardRef<HTMLSpanElement, PlanCurrencyProps>(function PlanCurrency(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("pp-plan-currency", className)} {...rest} />;
});

/** Props for {@link PlanAmount}. */
export type PlanAmountProps = NativeProps<"span">;

/**
 * The amount, in Pixel Bop at scale 3 with tabular digits ("." and "," are in the font).
 *
 *   <PlanAmount>14.99</PlanAmount>
 *
 * Renders `<span class="pp-plan-amount">`.
 */
export const PlanAmount = /*#__PURE__*/ forwardRef<HTMLSpanElement, PlanAmountProps>(function PlanAmount(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("pp-plan-amount", className)} {...rest} />;
});

/** Props for {@link PlanPeriod}. */
export type PlanPeriodProps = NativeProps<"span">;

/**
 * How often it is paid, small and bold after the amount: "one time", "a month".
 *
 *   <PlanPeriod>one time</PlanPeriod>
 *
 * Renders `<span class="pp-plan-period">`.
 */
export const PlanPeriod = /*#__PURE__*/ forwardRef<HTMLSpanElement, PlanPeriodProps>(function PlanPeriod(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("pp-plan-period", className)} {...rest} />;
});

/** Props for {@link PlanText}. */
export type PlanTextProps = NativeProps<"p">;

/**
 * A line under the price: what the plan is, in a few words.
 *
 *   <PlanText>The whole game, yours to keep.</PlanText>
 *
 * Renders `<p class="pp-plan-text">`.
 */
export const PlanText = /*#__PURE__*/ forwardRef<HTMLParagraphElement, PlanTextProps>(function PlanText({ className, ...rest }, ref) {
  return <p ref={ref} className={cx("pp-plan-text", className)} {...rest} />;
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
 * Renders `<ul class="pp-plan-features" role="list">`.
 */
export const PlanFeatures = /*#__PURE__*/ forwardRef<HTMLUListElement, PlanFeaturesProps>(function PlanFeatures(
  { role = "list", className, ...rest },
  ref,
) {
  return <ul ref={ref} className={cx("pp-plan-features", className)} role={role} {...rest} />;
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

/* ---------------------------------------------------------------------------------------------------------------
 * CTA band (cta.css): one call to action across the page, on the world or on a soft panel.
 * ------------------------------------------------------------------------------------------------------------- */

/** Own props of {@link CtaBand}: on the world (the default), or in a box: a soft panel in a tone, or a plain one. */
export interface CtaBandOwnProps {
  /**
   * A band in a box instead of the world, for a quieter second ask: `soft` (the tone's light fill, its base as a lip
   * along the bottom) or `panel` (the plain surface). Never a slab of candy: its button is outline. `data-variant`.
   */
  variant?: "soft" | "panel";
  /** A soft band's colour. `data-tone`. */
  tone?: Tone;
  /** @deprecated A band is never a slab of candy any more: `candy` now draws the soft panel. Use `variant="soft"`. */
  candy?: boolean;
}
export type CtaBandProps = CtaBandOwnProps & NativeProps<"section", CtaBandOwnProps>;

/**
 * One call to action across the page, on a strip of the world (sky bands of the scheme, a `<World>` if you pass one
 * first, and a {@link CtaGround}) or, with `variant`, on a soft panel. On the world the main button is candy: candy
 * stands on pastel; give the world `avoid` so the sun and moon stay clear of the words. In a box the button is
 * outline: candy stays on what you press. One or two per page, named by the title.
 *
 *   <CtaBand aria-labelledby="cta-title">
 *     <World avoid=".pp-cta-title, .pp-cta-text, .pp-cta-actions" />
 *     <CtaTitle id="cta-title">Catch the first star</CtaTitle>
 *     <CtaText>Wishlist Starfall Meadow and we'll send one email on launch day.</CtaText>
 *     <CtaActions><ButtonLink size="lg" href="#wishlist">Wishlist now</ButtonLink></CtaActions>
 *     <CtaGround />
 *   </CtaBand>
 *   <CtaBand variant="soft" tone="purple" aria-labelledby="press-title">
 *     <CtaTitle boxed id="press-title">Writing about the game?</CtaTitle>
 *     <CtaText>Screenshots, the trailer, logos and a fact sheet, in one download.</CtaText>
 *     <CtaActions><ButtonLink variant="outline" href="#press">Get the press kit</ButtonLink></CtaActions>
 *   </CtaBand>
 *
 * Renders `<section class="pp-cta">`, or `<section class="pp-box pp-cta" data-variant="soft">` with `variant`.
 */
export const CtaBand = /*#__PURE__*/ forwardRef<HTMLElement, CtaBandProps>(function CtaBand(
  { variant, candy, tone, className, ...rest },
  ref,
) {
  const boxed = variant ?? (candy ? "soft" : undefined);
  return (
    <section
      ref={ref}
      className={cx(boxed && "pp-box", "pp-cta", className)}
      data-variant={boxed}
      data-tone={boxed ? tone : undefined}
      {...rest}
    />
  );
});

/** Own props of {@link CtaTitle}. */
export interface CtaTitleOwnProps {
  /** In a boxed band: Pixel Bop at scale 1 in the band's text colour, instead of POP at scale 2 (on the world). */
  boxed?: boolean;
  /** @deprecated Use `boxed`: the band it sits in is a soft panel now, not candy. */
  candy?: boolean;
}
export type CtaTitleProps<T extends ElementType = "h2"> = PolymorphicProps<T, CtaTitleOwnProps>;

/**
 * The band's title: the action's reward in a few words, not the hero's. On the world it is POP at scale 2; in a
 * boxed band (`boxed`), Pixel Bop at scale 1 in the band's text colour. Give it the id the band is named by.
 *
 *   <CtaTitle id="cta-title">Catch the first star</CtaTitle>
 *   <CtaTitle boxed id="press-title">Writing about the game?</CtaTitle>
 *
 * Renders `<h2 class="pp-cta-title pp-display pp-pop" data-scale="2" data-pop="…">` (`data-pop` repeats the text,
 * when the children are text), or `<h2 class="pp-cta-title pp-display" data-scale="1">` with `boxed`.
 */
export const CtaTitle = /*#__PURE__*/ forwardRef(function CtaTitle(
  { as: Tag = "h2", boxed, candy, className, children, ...rest }: CtaTitleProps<ElementType>,
  ref,
) {
  const plain = boxed ?? candy;
  return (
    <Tag
      ref={ref}
      className={cx("pp-cta-title pp-display", !plain && "pp-pop", className)}
      data-scale={plain ? 1 : 2}
      data-pop={plain ? undefined : popText(children)}
      {...rest}
    >
      {children}
    </Tag>
  );
}) as PolymorphicComponent<"h2", CtaTitleOwnProps>;

/** Props for {@link CtaText}. */
export type CtaTextProps = NativeProps<"p">;

/**
 * What happens when you act, and what won't ("Nothing else").
 *
 *   <CtaText>Wishlist Starfall Meadow and we'll send one email on launch day. Nothing else.</CtaText>
 *
 * Renders `<p class="pp-cta-text">`.
 */
export const CtaText = /*#__PURE__*/ forwardRef<HTMLParagraphElement, CtaTextProps>(function CtaText({ className, ...rest }, ref) {
  return <p ref={ref} className={cx("pp-cta-text", className)} {...rest} />;
});

/** Props for {@link CtaActions}. */
export type CtaActionsProps = NativeProps<"div">;

/**
 * The band's buttons, in a centred row that wraps: one primary action.
 *
 *   <CtaActions><ButtonLink size="lg" href="#wishlist">Wishlist now</ButtonLink></CtaActions>
 *
 * Renders `<div class="pp-cta-actions">`.
 */
export const CtaActions = /*#__PURE__*/ forwardRef<HTMLDivElement, CtaActionsProps>(function CtaActions(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("pp-cta-actions", className)} {...rest} />;
});

/** Props for {@link CtaNote}. */
export type CtaNoteProps = NativeProps<"p">;

/**
 * A small bold line under the actions: what happens next, what it costs.
 *
 *   <CtaNote>Free, and no account needed.</CtaNote>
 *
 * Renders `<p class="pp-cta-note">`.
 */
export const CtaNote = /*#__PURE__*/ forwardRef<HTMLParagraphElement, CtaNoteProps>(function CtaNote({ className, ...rest }, ref) {
  return <p ref={ref} className={cx("pp-cta-note", className)} {...rest} />;
});

/** Props for {@link CtaGround}. */
export type CtaGroundProps = NativeProps<"div", { children?: never }> & { children?: never };

/**
 * A short strip of grass and dirt along the bottom of a band on the world. Last in the band.
 *
 *   <CtaGround />
 *
 * Renders `<div class="pp-cta-ground">`.
 */
export const CtaGround = /*#__PURE__*/ forwardRef<HTMLDivElement, CtaGroundProps>(function CtaGround({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("pp-cta-ground", className)} {...rest} />;
});

/* ---------------------------------------------------------------------------------------------------------------
 * Footer (footer.css): the ground the page stands on.
 * ------------------------------------------------------------------------------------------------------------- */

/** Props for {@link Footer}. */
export type FooterProps = NativeProps<"footer">;

/**
 * The ground the page stands on: a grass edge with blades poking up (`--pp-footer-edge` pixels deep, 14), then the
 * brand, link columns, a newsletter sign-up and the legal line, on the sunken surface. Say who made the site and how
 * to reach them; link only the few things people look for at the bottom.
 *
 *   <Footer>
 *     <FooterInner>
 *       <FooterBrand>…</FooterBrand>
 *       <FooterNav aria-label="More from Sherbit Games">
 *         <FooterCol>
 *           <FooterHeading>Studio</FooterHeading>
 *           <ul role="list"><li><a href="#about">About us</a></li><li><a href="#jobs">Jobs</a></li></ul>
 *         </FooterCol>
 *       </FooterNav>
 *       <FooterSignup action="/subscribe" method="post" aria-labelledby="letter">
 *         <FooterHeading id="letter">The Sherbit letter</FooterHeading>
 *         <p>One email when something ships.</p>
 *         <FooterRow>
 *           <label className="pp-sr-only" htmlFor="email">Email address</label>
 *           <FooterField id="email" type="email" name="email" autoComplete="email" required />
 *           <Button type="submit">Subscribe</Button>
 *         </FooterRow>
 *       </FooterSignup>
 *     </FooterInner>
 *     <FooterLegal>
 *       <p>© 2026 Sherbit Games.</p>
 *       <ul role="list"><li><a href="#privacy">Privacy</a></li><li><a href="#terms">Terms</a></li></ul>
 *     </FooterLegal>
 *   </Footer>
 *
 * Renders `<footer class="pp-footer">`.
 */
export const Footer = /*#__PURE__*/ forwardRef<HTMLElement, FooterProps>(function Footer({ className, ...rest }, ref) {
  return <footer ref={ref} className={cx("pp-footer", className)} {...rest} />;
});

/** Props for {@link FooterInner}. */
export type FooterInnerProps = NativeProps<"div">;

/**
 * The footer's main row: brand, links and sign-up side by side from 1024 pixels wide, stacked below.
 *
 *   <FooterInner><FooterBrand>…</FooterBrand><FooterNav aria-label="More">…</FooterNav></FooterInner>
 *
 * Renders `<div class="pp-footer-inner">`.
 */
export const FooterInner = /*#__PURE__*/ forwardRef<HTMLDivElement, FooterInnerProps>(function FooterInner(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("pp-footer-inner", className)} {...rest} />;
});

/** Props for {@link FooterBrand}. */
export type FooterBrandProps = NativeProps<"div">;

/**
 * Who made the site: the name (in POP, say) and one line about them.
 *
 *   <FooterBrand>
 *     <p className="pp-display pp-pop" data-scale="2" data-tone="pink" data-pop="Sherbit">Sherbit</p>
 *     <p className="pp-small">Tiny games about big skies.</p>
 *   </FooterBrand>
 *
 * Renders `<div class="pp-footer-brand">`.
 */
export const FooterBrand = /*#__PURE__*/ forwardRef<HTMLDivElement, FooterBrandProps>(function FooterBrand(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("pp-footer-brand", className)} {...rest} />;
});

/** Props for {@link FooterNav}: a `<nav>` needs a name (`aria-label` or `aria-labelledby`) beside the page's own. */
export type FooterNavProps = Named & NativeProps<"nav">;

/**
 * The footer's links: {@link FooterCol}s side by side, three of four links or fewer. A named navigation landmark.
 *
 *   <FooterNav aria-label="More from Sherbit Games"><FooterCol>…</FooterCol><FooterCol>…</FooterCol></FooterNav>
 *
 * Renders `<nav class="pp-footer-nav">`.
 */
export const FooterNav = /*#__PURE__*/ forwardRef<HTMLElement, FooterNavProps>(function FooterNav({ className, ...rest }, ref) {
  return <nav ref={ref} className={cx("pp-footer-nav", className)} {...rest} />;
});

/** Props for {@link FooterCol}. */
export type FooterColProps = NativeProps<"div">;

/**
 * A column of links: a {@link FooterHeading}, then a `<ul role="list">` of links, which underline on hover.
 *
 *   <FooterCol>
 *     <FooterHeading>Help</FooterHeading>
 *     <ul role="list"><li><a href="#support">Support</a></li><li><a href="#refunds">Refunds</a></li></ul>
 *   </FooterCol>
 *
 * Renders `<div class="pp-footer-col">`.
 */
export const FooterCol = /*#__PURE__*/ forwardRef<HTMLDivElement, FooterColProps>(function FooterCol({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("pp-footer-col", className)} {...rest} />;
});

/** Props for {@link FooterHeading}: a heading's own; `as` picks its level. */
export type FooterHeadingProps<T extends ElementType = "h2"> = PolymorphicProps<T, object>;

/**
 * A column's or the sign-up's heading: small bold capitals.
 *
 *   <FooterHeading>Studio</FooterHeading>
 *
 * Renders `<h2 class="pp-footer-heading">`.
 */
export const FooterHeading = /*#__PURE__*/ forwardRef(function FooterHeading(
  { as: Tag = "h2", className, ...rest }: FooterHeadingProps<ElementType>,
  ref,
) {
  return <Tag ref={ref} className={cx("pp-footer-heading", className)} {...rest} />;
}) as PolymorphicComponent<"h2", object>;

/** Props for {@link FooterSignup}. */
export type FooterSignupProps = NativeProps<"form">;

/**
 * The newsletter sign-up: a heading, the promise in one line (and keep it), then a {@link FooterRow} with the field
 * and its button. Name the form by its heading.
 *
 *   <FooterSignup action="/subscribe" method="post" aria-labelledby="letter">
 *     <FooterHeading id="letter">The Sherbit letter</FooterHeading>
 *     <p>One email when something ships.</p>
 *     <FooterRow>…</FooterRow>
 *   </FooterSignup>
 *
 * Renders `<form class="pp-footer-signup">`.
 */
export const FooterSignup = /*#__PURE__*/ forwardRef<HTMLFormElement, FooterSignupProps>(function FooterSignup(
  { className, ...rest },
  ref,
) {
  return <form ref={ref} className={cx("pp-footer-signup", className)} {...rest} />;
});

/** Props for {@link FooterRow}. */
export type FooterRowProps = NativeProps<"div">;

/**
 * The sign-up's row, which wraps: the field's label (visually hidden when the heading says it), the
 * {@link FooterField} and the submit button.
 *
 *   <FooterRow>
 *     <label className="pp-sr-only" htmlFor="email">Email address</label>
 *     <FooterField id="email" type="email" name="email" autoComplete="email" required />
 *     <Button type="submit">Subscribe</Button>
 *   </FooterRow>
 *
 * Renders `<div class="pp-footer-row">`.
 */
export const FooterRow = /*#__PURE__*/ forwardRef<HTMLDivElement, FooterRowProps>(function FooterRow({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("pp-footer-row", className)} {...rest} />;
});

/** Props for {@link FooterField}: the input's own; `className` and `style` go to the box around it. */
export type FooterFieldProps = NativeProps<"input", { children?: never }> & { children?: never };

/**
 * A text field in an outline candy box: the box draws the focus ring, and the danger outline once the entry is
 * wrong after the person has typed (`:user-invalid`); the browser says why. Give it a real label (`<label
 * htmlFor>`), and for an email `type="email"` and `autoComplete="email"`. The ref and every native prop go to the
 * `<input>`, so forms and labels work as on the bare element; `className` and `style` go to the box.
 *
 *   <FooterField id="email" type="email" name="email" autoComplete="email" placeholder="you@example.com" required />
 *
 * Renders `<span class="pp-box pp-footer-field" data-variant="outline"><input></span>`.
 */
export const FooterField = /*#__PURE__*/ forwardRef<HTMLInputElement, FooterFieldProps>(function FooterField(
  { className, style, ...rest },
  ref,
) {
  return (
    <span className={cx("pp-box pp-footer-field", className)} data-variant="outline" style={style}>
      <input ref={ref} {...rest} />
    </span>
  );
});

/** Props for {@link FooterLegal}. */
export type FooterLegalProps = NativeProps<"div">;

/**
 * The legal line over a soft rule: the small print in a `<p>`, then the policy links in a `<ul role="list">`
 * (they keep their underline).
 *
 *   <FooterLegal>
 *     <p>© 2026 Sherbit Games.</p>
 *     <ul role="list"><li><a href="#privacy">Privacy</a></li><li><a href="#terms">Terms</a></li></ul>
 *   </FooterLegal>
 *
 * Renders `<div class="pp-footer-legal">`.
 */
export const FooterLegal = /*#__PURE__*/ forwardRef<HTMLDivElement, FooterLegalProps>(function FooterLegal(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("pp-footer-legal", className)} {...rest} />;
});
