/**
 * Footer: Footer, FooterInner, FooterBrand, FooterNav, FooterCol, FooterHeading, FooterSignup, FooterRow, FooterField
 * and FooterLegal. CSS from @blip/blocks (footer.css).
 */
import { forwardRef } from "react";
import type { ElementType } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../../internal/polymorphic.js";
import { cx, type NativeProps } from "../../internal/props.js";

/** A name: `aria-label`, or `aria-labelledby` naming the words' id. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

/** Props for {@link Footer}. */
export type FooterProps = NativeProps<"footer">;

/**
 * The ground the page stands on: a grass edge with blades poking up (`--blip-footer-edge` pixels deep, 14), then the
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
 *           <label className="blip-sr-only" htmlFor="email">Email address</label>
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
 * Renders `<footer class="blip-footer">`.
 */
export const Footer = /*#__PURE__*/ forwardRef<HTMLElement, FooterProps>(function Footer({ className, ...rest }, ref) {
  return <footer ref={ref} className={cx("blip-footer", className)} {...rest} />;
});

/** Props for {@link FooterInner}. */
export type FooterInnerProps = NativeProps<"div">;

/**
 * The footer's main row: brand, links and sign-up side by side from 1024 pixels wide, stacked below.
 *
 *   <FooterInner><FooterBrand>…</FooterBrand><FooterNav aria-label="More">…</FooterNav></FooterInner>
 *
 * Renders `<div class="blip-footer-inner">`.
 */
export const FooterInner = /*#__PURE__*/ forwardRef<HTMLDivElement, FooterInnerProps>(function FooterInner(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("blip-footer-inner", className)} {...rest} />;
});

/** Props for {@link FooterBrand}. */
export type FooterBrandProps = NativeProps<"div">;

/**
 * Who made the site: the name (in POP, say) and one line about them.
 *
 *   <FooterBrand>
 *     <p className="blip-display blip-pop" data-scale="2" data-tone="pink" data-pop="Sherbit">Sherbit</p>
 *     <p className="blip-small">Tiny games about big skies.</p>
 *   </FooterBrand>
 *
 * Renders `<div class="blip-footer-brand">`.
 */
export const FooterBrand = /*#__PURE__*/ forwardRef<HTMLDivElement, FooterBrandProps>(function FooterBrand(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("blip-footer-brand", className)} {...rest} />;
});

/** Props for {@link FooterNav}: a `<nav>` needs a name (`aria-label` or `aria-labelledby`) beside the page's own. */
export type FooterNavProps = Named & NativeProps<"nav">;

/**
 * The footer's links: {@link FooterCol}s side by side, three of four links or fewer. A named navigation landmark.
 *
 *   <FooterNav aria-label="More from Sherbit Games"><FooterCol>…</FooterCol><FooterCol>…</FooterCol></FooterNav>
 *
 * Renders `<nav class="blip-footer-nav">`.
 */
export const FooterNav = /*#__PURE__*/ forwardRef<HTMLElement, FooterNavProps>(function FooterNav({ className, ...rest }, ref) {
  return <nav ref={ref} className={cx("blip-footer-nav", className)} {...rest} />;
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
 * Renders `<div class="blip-footer-col">`.
 */
export const FooterCol = /*#__PURE__*/ forwardRef<HTMLDivElement, FooterColProps>(function FooterCol({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("blip-footer-col", className)} {...rest} />;
});

/** Props for {@link FooterHeading}: a heading's own; `as` picks its level. */
export type FooterHeadingProps<T extends ElementType = "h2"> = PolymorphicProps<T, object>;

/**
 * A column's or the sign-up's heading: small bold capitals.
 *
 *   <FooterHeading>Studio</FooterHeading>
 *
 * Renders `<h2 class="blip-footer-heading">`.
 */
export const FooterHeading = /*#__PURE__*/ forwardRef(function FooterHeading(
  { as: Tag = "h2", className, ...rest }: FooterHeadingProps<ElementType>,
  ref,
) {
  return <Tag ref={ref} className={cx("blip-footer-heading", className)} {...rest} />;
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
 * Renders `<form class="blip-footer-signup">`.
 */
export const FooterSignup = /*#__PURE__*/ forwardRef<HTMLFormElement, FooterSignupProps>(function FooterSignup(
  { className, ...rest },
  ref,
) {
  return <form ref={ref} className={cx("blip-footer-signup", className)} {...rest} />;
});

/** Props for {@link FooterRow}. */
export type FooterRowProps = NativeProps<"div">;

/**
 * The sign-up's row, which wraps: the field's label (visually hidden when the heading says it), the
 * {@link FooterField} and the submit button.
 *
 *   <FooterRow>
 *     <label className="blip-sr-only" htmlFor="email">Email address</label>
 *     <FooterField id="email" type="email" name="email" autoComplete="email" required />
 *     <Button type="submit">Subscribe</Button>
 *   </FooterRow>
 *
 * Renders `<div class="blip-footer-row">`.
 */
export const FooterRow = /*#__PURE__*/ forwardRef<HTMLDivElement, FooterRowProps>(function FooterRow({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("blip-footer-row", className)} {...rest} />;
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
 * Renders `<span class="blip-box blip-footer-field" data-variant="outline"><input></span>`.
 */
export const FooterField = /*#__PURE__*/ forwardRef<HTMLInputElement, FooterFieldProps>(function FooterField(
  { className, style, ...rest },
  ref,
) {
  return (
    <span className={cx("blip-box blip-footer-field", className)} data-variant="outline" style={style}>
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
 * Renders `<div class="blip-footer-legal">`.
 */
export const FooterLegal = /*#__PURE__*/ forwardRef<HTMLDivElement, FooterLegalProps>(function FooterLegal(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("blip-footer-legal", className)} {...rest} />;
});
