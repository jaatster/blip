/**
 * CTA band: CtaBand, CtaTitle, CtaText, CtaActions, CtaNote and CtaGround. CSS from @jaatster/blip-blocks (cta.css). It
 * stands on the world: pass a `<World>` (from @jaatster/blip-react/effects) as its first child; without it, and until it
 * draws, its own sky shows, the scheme's palette in hard bands. Its calls to action are a `<ButtonLink>` (or
 * `<Button>`) from @jaatster/blip-react.
 */
import { forwardRef } from "react";
import type { ElementType, ReactNode } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../../internal/polymorphic.js";
import { cx, type NativeProps, type Tone } from "../../internal/props.js";

/** What a POP part repeats in `data-pop` (the tint on its letters' lower rows): its children, when they are text. */
const popText = (children: ReactNode): string | undefined =>
  typeof children === "string" || typeof children === "number" ? String(children) : undefined;

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
 *     <World avoid=".chu-cta-title, .chu-cta-text, .chu-cta-actions" />
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
 * Renders `<section class="chu-cta">`, or `<section class="chu-box chu-cta" data-variant="soft">` with `variant`.
 */
export const CtaBand = /*#__PURE__*/ forwardRef<HTMLElement, CtaBandProps>(function CtaBand(
  { variant, candy, tone, className, ...rest },
  ref,
) {
  const boxed = variant ?? (candy ? "soft" : undefined);
  return (
    <section
      ref={ref}
      className={cx(boxed && "chu-box", "chu-cta", className)}
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
 * Renders `<h2 class="chu-cta-title chu-display chu-pop" data-scale="2" data-pop="…">` (`data-pop` repeats the text,
 * when the children are text), or `<h2 class="chu-cta-title chu-display" data-scale="1">` with `boxed`.
 */
export const CtaTitle = /*#__PURE__*/ forwardRef(function CtaTitle(
  { as: Tag = "h2", boxed, candy, className, children, ...rest }: CtaTitleProps<ElementType>,
  ref,
) {
  const plain = boxed ?? candy;
  return (
    <Tag
      ref={ref}
      className={cx("chu-cta-title chu-display", !plain && "chu-pop", className)}
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
 * Renders `<p class="chu-cta-text">`.
 */
export const CtaText = /*#__PURE__*/ forwardRef<HTMLParagraphElement, CtaTextProps>(function CtaText({ className, ...rest }, ref) {
  return <p ref={ref} className={cx("chu-cta-text", className)} {...rest} />;
});

/** Props for {@link CtaActions}. */
export type CtaActionsProps = NativeProps<"div">;

/**
 * The band's buttons, in a centred row that wraps: one primary action.
 *
 *   <CtaActions><ButtonLink size="lg" href="#wishlist">Wishlist now</ButtonLink></CtaActions>
 *
 * Renders `<div class="chu-cta-actions">`.
 */
export const CtaActions = /*#__PURE__*/ forwardRef<HTMLDivElement, CtaActionsProps>(function CtaActions(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("chu-cta-actions", className)} {...rest} />;
});

/** Props for {@link CtaNote}. */
export type CtaNoteProps = NativeProps<"p">;

/**
 * A small bold line under the actions: what happens next, what it costs.
 *
 *   <CtaNote>Free, and no account needed.</CtaNote>
 *
 * Renders `<p class="chu-cta-note">`.
 */
export const CtaNote = /*#__PURE__*/ forwardRef<HTMLParagraphElement, CtaNoteProps>(function CtaNote({ className, ...rest }, ref) {
  return <p ref={ref} className={cx("chu-cta-note", className)} {...rest} />;
});

/** Props for {@link CtaGround}. */
export type CtaGroundProps = NativeProps<"div", { children?: never }> & { children?: never };

/**
 * A short strip of grass and dirt along the bottom of a band on the world. Last in the band.
 *
 *   <CtaGround />
 *
 * Renders `<div class="chu-cta-ground">`.
 */
export const CtaGround = /*#__PURE__*/ forwardRef<HTMLDivElement, CtaGroundProps>(function CtaGround({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("chu-cta-ground", className)} {...rest} />;
});
