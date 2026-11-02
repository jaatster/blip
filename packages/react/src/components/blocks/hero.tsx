/**
 * Hero: Hero, HeroInner, HeroTitle, HeroLead, HeroActions, HeroNote, HeroScenery and HeroGround. CSS from
 * @jaatster/blip-blocks (hero.css). It stands on the world: pass a `<World>` (from @jaatster/blip-react/effects) as its first child;
 * without it, and until it draws, its own sky shows, the scheme's palette in hard bands. Its calls to action are a
 * `<ButtonLink>` (or `<Button>`) from @jaatster/blip-react.
 */
import { Fragment, forwardRef } from "react";
import type { CSSProperties, ElementType } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../../internal/polymorphic.js";
import { cx, type NativeProps } from "../../internal/props.js";

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
 *     <World parallax avoid=".blip-hero-title, .blip-hero-lead, .blip-hero-actions, .blip-hero-note" />
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
 * Renders `<section class="blip-hero">`.
 */
export const Hero = /*#__PURE__*/ forwardRef<HTMLElement, HeroProps>(function Hero({ align, className, ...rest }, ref) {
  return (
    <section
      ref={ref}
      className={cx("blip-hero", className)}
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
 * Renders `<div class="blip-hero-inner">`.
 */
export const HeroInner = /*#__PURE__*/ forwardRef<HTMLDivElement, HeroInnerProps>(function HeroInner({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("blip-hero-inner", className)} {...rest} />;
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
 * Renders `<h1 class="blip-hero-title blip-display">` holding `<span class="blip-sr-only">` (the text), then `<span
 * aria-hidden="true">` with a `<span class="blip-hero-word">` per word of `<span class="blip-pop blip-drop-in"
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
    <Tag ref={ref} className={cx("blip-hero-title blip-display", className)} {...rest}>
      <span className="blip-sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map(({ letters, first }, w) => (
          <Fragment key={w}>
            {w > 0 ? " " : null}
            <span className="blip-hero-word">
              {letters.map((letter, l) => (
                <span
                  key={l}
                  className="blip-pop blip-drop-in"
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
 * Renders `<p class="blip-hero-lead">`.
 */
export const HeroLead = /*#__PURE__*/ forwardRef<HTMLParagraphElement, HeroLeadProps>(function HeroLead({ className, ...rest }, ref) {
  return <p ref={ref} className={cx("blip-hero-lead", className)} {...rest} />;
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
 * Renders `<div class="blip-hero-actions">`.
 */
export const HeroActions = /*#__PURE__*/ forwardRef<HTMLDivElement, HeroActionsProps>(function HeroActions(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("blip-hero-actions", className)} {...rest} />;
});

/** Props for {@link HeroNote}. */
export type HeroNoteProps = NativeProps<"p">;

/**
 * One small bold fact under the actions (when, where): never a claim you can't stand behind.
 *
 *   <HeroNote>Out this spring, on desktop</HeroNote>
 *
 * Renders `<p class="blip-hero-note">`.
 */
export const HeroNote = /*#__PURE__*/ forwardRef<HTMLParagraphElement, HeroNoteProps>(function HeroNote({ className, ...rest }, ref) {
  return <p ref={ref} className={cx("blip-hero-note", className)} {...rest} />;
});

/** Props for {@link HeroScenery}. */
export type HeroSceneryProps = NativeProps<"div">;

/**
 * Things standing on the ground behind the text: sprites, blocks, a sign, placed absolutely from the bottom. Scenery
 * only, hidden from assistive technology. Stand it on the ground, never in the sky where text flows on a phone.
 *
 *   <HeroScenery><Sprite name="star" style={{ position: "absolute", left: "6%", bottom: 0 }} /></HeroScenery>
 *
 * Renders `<div class="blip-hero-scenery" aria-hidden="true">`.
 */
export const HeroScenery = /*#__PURE__*/ forwardRef<HTMLDivElement, HeroSceneryProps>(function HeroScenery(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("blip-hero-scenery", className)} aria-hidden={true} {...rest} />;
});

/** Props for {@link HeroGround}. */
export type HeroGroundProps = NativeProps<"div", { children?: never }> & { children?: never };

/**
 * The ground along the hero's bottom: blades of grass, grass, a lip, dirt with pebbles, flowers
 * (`--blip-hero-ground` pixels, 24). Last in the hero.
 *
 *   <HeroGround />
 *
 * Renders `<div class="blip-hero-ground">`.
 */
export const HeroGround = /*#__PURE__*/ forwardRef<HTMLDivElement, HeroGroundProps>(function HeroGround({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("blip-hero-ground", className)} {...rest} />;
});
