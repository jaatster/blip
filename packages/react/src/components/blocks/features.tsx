/**
 * Features: Features, FeaturesHead, FeaturesTitle, FeaturesLead, FeaturesGrid, Feature, FeatureMedia, FeatureIcon,
 * FeatureTitle, FeatureText, FeatureStat, FeatureChips and FeatureChip. CSS from @blip/blocks (features.css).
 */
import { forwardRef } from "react";
import type { ElementType, ReactNode } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../../internal/polymorphic.js";
import { cx, type NativeProps, type Tone } from "../../internal/props.js";

/** What a POP part repeats in `data-pop` (the tint on its letters' lower rows): its children, when they are text. */
const popText = (children: ReactNode): string | undefined =>
  typeof children === "string" || typeof children === "number" ? String(children) : undefined;

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
 * Renders `<section class="blip-features">`.
 */
export const Features = /*#__PURE__*/ forwardRef<HTMLElement, FeaturesProps>(function Features({ className, ...rest }, ref) {
  return <section ref={ref} className={cx("blip-features", className)} {...rest} />;
});

/** Props for {@link FeaturesHead}. */
export type FeaturesHeadProps = NativeProps<"header">;

/**
 * The block's head: the title and a lead.
 *
 *   <FeaturesHead><FeaturesTitle>…</FeaturesTitle><FeaturesLead>…</FeaturesLead></FeaturesHead>
 *
 * Renders `<header class="blip-features-head">`.
 */
export const FeaturesHead = /*#__PURE__*/ forwardRef<HTMLElement, FeaturesHeadProps>(function FeaturesHead(
  { className, ...rest },
  ref,
) {
  return <header ref={ref} className={cx("blip-features-head", className)} {...rest} />;
});

/** Props for {@link FeaturesTitle}: a heading's own; `as` picks its level. */
export type FeaturesTitleProps<T extends ElementType = "h2"> = PolymorphicProps<T, object>;

/**
 * The block's title. Give it the id the section is named by.
 *
 *   <FeaturesTitle id="features-title">A small world that keeps time</FeaturesTitle>
 *
 * Renders `<h2 class="blip-features-title">`.
 */
export const FeaturesTitle = /*#__PURE__*/ forwardRef(function FeaturesTitle(
  { as: Tag = "h2", className, ...rest }: FeaturesTitleProps<ElementType>,
  ref,
) {
  return <Tag ref={ref} className={cx("blip-features-title", className)} {...rest} />;
}) as PolymorphicComponent<"h2", object>;

/** Props for {@link FeaturesLead}. */
export type FeaturesLeadProps = NativeProps<"p">;

/**
 * A sentence under the title, in the muted text colour.
 *
 *   <FeaturesLead>Sixty short levels, made to be played a few at a time.</FeaturesLead>
 *
 * Renders `<p class="blip-features-lead">`.
 */
export const FeaturesLead = /*#__PURE__*/ forwardRef<HTMLParagraphElement, FeaturesLeadProps>(function FeaturesLead(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("blip-features-lead", className)} {...rest} />;
});

/** Props for {@link FeaturesGrid}. */
export type FeaturesGridProps = NativeProps<"div">;

/**
 * The features' grid: one column below 600 pixels wide, two below 1024, then six; its order is the reading order at
 * every width. Lead with the feature that makes the product different.
 *
 *   <FeaturesGrid><Feature layout="lead">…</Feature><Feature tone="pink">…</Feature></FeaturesGrid>
 *
 * Renders `<div class="blip-features-grid">`.
 */
export const FeaturesGrid = /*#__PURE__*/ forwardRef<HTMLDivElement, FeaturesGridProps>(function FeaturesGrid(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("blip-features-grid", className)} {...rest} />;
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
 * Renders `<article class="blip-box blip-feature" data-variant="soft">` (`data-variant="panel"` for lead and wide).
 */
export const Feature = /*#__PURE__*/ forwardRef<HTMLElement, FeatureProps>(function Feature(
  { layout, variant, tone, className, ...rest },
  ref,
) {
  return (
    <article
      ref={ref}
      className={cx("blip-box blip-feature", className)}
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
 * Renders `<div class="blip-feature-media">`.
 */
export const FeatureMedia = /*#__PURE__*/ forwardRef<HTMLDivElement, FeatureMediaProps>(function FeatureMedia(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("blip-feature-media", className)} {...rest} />;
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
 * Renders `<span class="blip-box blip-feature-icon">`.
 */
export const FeatureIcon = /*#__PURE__*/ forwardRef<HTMLSpanElement, FeatureIconProps>(function FeatureIcon(
  { tone, className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("blip-box blip-feature-icon", className)} data-tone={tone} {...rest} />;
});

/** Props for {@link FeatureTitle}: a heading's own; `as` picks its level. */
export type FeatureTitleProps<T extends ElementType = "h3"> = PolymorphicProps<T, object>;

/**
 * A feature's heading: short. Bigger on the lead.
 *
 *   <FeatureTitle>Couch co-op</FeatureTitle>
 *
 * Renders `<h3 class="blip-feature-title">`.
 */
export const FeatureTitle = /*#__PURE__*/ forwardRef(function FeatureTitle(
  { as: Tag = "h3", className, ...rest }: FeatureTitleProps<ElementType>,
  ref,
) {
  return <Tag ref={ref} className={cx("blip-feature-title", className)} {...rest} />;
}) as PolymorphicComponent<"h3", object>;

/** Props for {@link FeatureText}. */
export type FeatureTextProps = NativeProps<"p">;

/**
 * A feature's words: one or two sentences; on a stat, what the number counts.
 *
 *   <FeatureText>A friend can hop in or out at any moment, on one keyboard or two gamepads.</FeatureText>
 *
 * Renders `<p class="blip-feature-text">`.
 */
export const FeatureText = /*#__PURE__*/ forwardRef<HTMLParagraphElement, FeatureTextProps>(function FeatureText(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("blip-feature-text", className)} {...rest} />;
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
 * Renders `<p class="blip-feature-stat blip-pop" data-pop="24">`; `data-pop` repeats the number (when the children are
 * text).
 */
export const FeatureStat = /*#__PURE__*/ forwardRef<HTMLParagraphElement, FeatureStatProps>(function FeatureStat(
  { tone, className, children, ...rest },
  ref,
) {
  return (
    <p
      ref={ref}
      className={cx("blip-feature-stat blip-pop", className)}
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
 * Renders `<ul class="blip-feature-chips" role="list">`.
 */
export const FeatureChips = /*#__PURE__*/ forwardRef<HTMLUListElement, FeatureChipsProps>(function FeatureChips(
  { role = "list", className, ...rest },
  ref,
) {
  return <ul ref={ref} className={cx("blip-feature-chips", className)} role={role} {...rest} />;
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
 * Renders `<li class="blip-box" data-variant="soft" data-tone="neutral">`.
 */
export const FeatureChip = /*#__PURE__*/ forwardRef<HTMLLIElement, FeatureChipProps>(function FeatureChip(
  { tone = "neutral", className, ...rest },
  ref,
) {
  return <li ref={ref} className={cx("blip-box", className)} data-variant="soft" data-tone={tone} {...rest} />;
});
