/**
 * Card: Card, CardMedia, CardHeader, CardTitle, CardSubtitle, CardBody, CardFooter, CardContent and CardLink. CSS from
 * @jaatster/blip-components (card.css).
 */
import { forwardRef } from "react";
import type { CSSProperties, ElementType } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { box, cx, flag, type NativeProps, type Radius, type Size, type Tone } from "../internal/props.js";

/** Own props of {@link Card}. */
export interface CardOwnProps {
  /**
   * A cream panel (default), `panel` (the white one), soft or candy, which tint the whole card (text inside takes
   * the box's ink), or outline: flat, for dense pages. `data-variant`.
   */
  variant?: "panel" | "soft" | "candy" | "outline";
  /**
   * On a cream card, a three-pixel strip of its light colour along the top; soft or candy, the card's colour.
   * `data-tone`.
   */
  tone?: Tone;
  /** Padding 6, 8 (default) or 12 pixels, with the title size and corner radius to match. `data-size`. */
  size?: Size;
  /** Corner radius in pixels, 0 to 8 (4 by default; small 3, large 5). `data-chu-r`. */
  radius?: Radius;
  /**
   * The picture beside the text while both fit, above it when they don't (it follows its container, no
   * breakpoint). Wrap the header, body and footer in a {@link CardContent}. `data-layout`.
   */
  layout?: "horizontal";
  /** A card with one main link (a {@link CardLink} in its title) and other actions: it lifts. `data-chu-interactive`. */
  interactive?: boolean;
}

export type CardProps<T extends ElementType = "article"> = PolymorphicProps<T, CardOwnProps>;

/**
 * A panel that holds one thing: a world, a player, an event. An `<article>` with a heading in the page's outline;
 * `as="a"` makes the whole card a link that lifts (keep it short, with nothing else to press inside). One thing per
 * card, never a card in a card; rows of cards go in a grid. Renders `<article class="chu-box chu-card">`.
 *
 *   <Card>
 *     <CardMedia><img src="meadow.png" alt="" /></CardMedia>
 *     <CardHeader>
 *       <div><CardTitle>Meadow</CardTitle><CardSubtitle>World 1 · 8 levels</CardSubtitle></div>
 *       <Tag tone="success">Cleared</Tag>
 *     </CardHeader>
 *     <CardBody><p>Rolling hills, slow clouds and the first boss.</p></CardBody>
 *     <CardFooter><Button>Play</Button></CardFooter>
 *   </Card>
 *   <Card as="a" href="/worlds/meadow">…</Card>
 */
export const Card = /*#__PURE__*/ forwardRef(function Card(
  { as: Tag = "article", variant, tone, size, radius, layout, interactive, className, ...rest }: CardProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("chu-box chu-card", className)}
      {...box({ tone, radius })}
      data-variant={variant}
      data-size={size}
      data-layout={layout}
      data-chu-interactive={flag(interactive)}
      {...rest}
    />
  );
}) as PolymorphicComponent<"article", CardOwnProps>;

/** Own props of {@link CardMedia}. */
export interface CardMediaOwnProps {
  /**
   * `pixels`: pixel art, as big as fits with every art pixel the same whole number of Blip pixels across and
   * down, in the middle of the frame (a cover picture is scaled by fractions, and its pixels come out uneven and
   * blurred). Give its size in its own pixels with `artWidth` and `artHeight`. `data-fit`.
   */
  fit?: "pixels";
  /** With `fit="pixels"`: the picture's width in its own pixels (a 64 x 36 drawing: 64). `--chu-card-art-width`. */
  artWidth?: number;
  /** With `fit="pixels"`: the picture's height in its own pixels (a 64 x 36 drawing: 36). `--chu-card-art-height`. */
  artHeight?: number;
}

/** Pixel art needs its size: `fit="pixels"` comes with `artWidth` and `artHeight`. */
type CardMediaFit = { fit?: undefined; artWidth?: never; artHeight?: never } | { fit: "pixels"; artWidth: number; artHeight: number };

/** Props for {@link CardMedia}. */
export type CardMediaProps = CardMediaFit & NativeProps<"div", CardMediaOwnProps>;

/**
 * The card's picture in a one-pixel ink frame, never smoothed. An `<img>`, `<svg>`, `<canvas>` or `<video>`, 16:9
 * unless `--chu-card-media-ratio` says otherwise; `alt=""` when it only decorates. Pixel art takes `fit="pixels"` and
 * its size in its own pixels, so every art pixel comes out the same whole number of Blip pixels. Renders `<div
 * class="chu-card-media">`.
 *
 *   <CardMedia><img src="meadow.png" alt="" /></CardMedia>
 *   <CardMedia fit="pixels" artWidth={64} artHeight={36}><img src="meadow.png" alt="" width={64} height={36} /></CardMedia>
 */
export const CardMedia = /*#__PURE__*/ forwardRef<HTMLDivElement, CardMediaProps>(function CardMedia(
  { fit, artWidth, artHeight, style, className, ...rest },
  ref,
) {
  const art = fit === undefined ? style : { ...style, "--chu-card-art-width": String(artWidth), "--chu-card-art-height": String(artHeight) };
  return <div ref={ref} className={cx("chu-card-media", className)} data-fit={fit} style={art as CSSProperties | undefined} {...rest} />;
});

/** Props for {@link CardHeader}. */
export type CardHeaderProps = NativeProps<"header">;

/**
 * The card's header: title and subtitle at the start, anything small at the end. Wrap the title and subtitle in a
 * `<div>`; the end holds a tag or a menu button. Renders `<header class="chu-card-header">`.
 *
 *   <CardHeader><div><CardTitle>Meadow</CardTitle></div><Tag tone="success">Cleared</Tag></CardHeader>
 */
export const CardHeader = /*#__PURE__*/ forwardRef<HTMLElement, CardHeaderProps>(function CardHeader({ className, ...rest }, ref) {
  return <header ref={ref} className={cx("chu-card-header", className)} {...rest} />;
});

export type CardTitleProps<T extends ElementType = "h3"> = PolymorphicProps<T, object>;

/**
 * The card's title: a few words, on a heading at the right level for the page's outline (`<h2>` to `<h4>`).
 * Renders `<h3 class="chu-card-title">`.
 *
 *   <CardTitle as="h2">Pip Bloom</CardTitle>
 */
export const CardTitle = /*#__PURE__*/ forwardRef(function CardTitle(
  { as: Tag = "h3", className, ...rest }: CardTitleProps<ElementType>,
  ref,
) {
  return <Tag ref={ref} className={cx("chu-card-title", className)} {...rest} />;
}) as PolymorphicComponent<"h3", object>;

/** Props for {@link CardSubtitle}. */
export type CardSubtitleProps = NativeProps<"p">;

/**
 * One line of facts under the title. Renders `<p class="chu-card-subtitle">`.
 *
 *   <CardSubtitle>World 1 · 8 levels</CardSubtitle>
 */
export const CardSubtitle = /*#__PURE__*/ forwardRef<HTMLParagraphElement, CardSubtitleProps>(function CardSubtitle(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("chu-card-subtitle", className)} {...rest} />;
});

export type CardBodyProps<T extends ElementType = "div"> = PolymorphicProps<T, object>;

/**
 * The card's text: a `<div>` of paragraphs, or `as="p"` for one. Renders `<div class="chu-card-body">`.
 *
 *   <CardBody as="p">Rolling hills, slow clouds and the first boss.</CardBody>
 */
export const CardBody = /*#__PURE__*/ forwardRef(function CardBody(
  { as: Tag = "div", className, ...rest }: CardBodyProps<ElementType>,
  ref,
) {
  return <Tag ref={ref} className={cx("chu-card-body", className)} {...rest} />;
}) as PolymorphicComponent<"div", object>;

/** Props for {@link CardFooter}. */
export type CardFooterProps = NativeProps<"footer">;

/**
 * The card's actions, at the end and pushed to the bottom in a row of cards: one or two, the main one in candy.
 * Renders `<footer class="chu-card-footer">`.
 *
 *   <CardFooter><Button variant="soft" size="sm">Message</Button><Button size="sm">Add friend</Button></CardFooter>
 */
export const CardFooter = /*#__PURE__*/ forwardRef<HTMLElement, CardFooterProps>(function CardFooter({ className, ...rest }, ref) {
  return <footer ref={ref} className={cx("chu-card-footer", className)} {...rest} />;
});

/** Props for {@link CardContent}. */
export type CardContentProps = NativeProps<"div">;

/**
 * The header, body and footer of a horizontal card, side by side with its picture. Renders `<div
 * class="chu-card-content">`.
 *
 *   <Card layout="horizontal"><CardMedia>…</CardMedia><CardContent>…</CardContent></Card>
 */
export const CardContent = /*#__PURE__*/ forwardRef<HTMLDivElement, CardContentProps>(function CardContent(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("chu-card-content", className)} {...rest} />;
});

/** Props for {@link CardLink}: a link's by default, or your router's link's with `as`. */
export type CardLinkProps<T extends ElementType = "a"> = PolymorphicProps<T, object>;

/**
 * A card's main link, in its title: its click area covers the card. Give the card `interactive`; its other buttons stay
 * their own targets above the link, so screen readers hear a short link name and every action stays reachable.
 * Renders `<a class="chu-card-link">`; with `as`, your router's link.
 *
 *   <Card interactive>
 *     <CardHeader>
 *       <div><CardTitle><CardLink href="/worlds/night-woods">Night woods</CardLink></CardTitle></div>
 *     </CardHeader>
 *     <CardFooter><Button size="sm">Continue</Button></CardFooter>
 *   </Card>
 */
export const CardLink = /*#__PURE__*/ forwardRef(function CardLink({ as: Tag = "a", className, ...rest }: CardLinkProps<ElementType>, ref) {
  return <Tag ref={ref} className={cx("chu-card-link", className)} {...rest} />;
}) as PolymorphicComponent<"a", object>;
