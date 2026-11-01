/**
 * Skip link: SkipLink. CSS from @jaatster/blip-components (skip-link.css).
 */
import { forwardRef } from "react";
import type { ElementType, ReactNode } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { box, cx } from "../internal/props.js";
import type { BoxProps } from "../internal/props.js";

/** Own props of {@link SkipLink}. */
export interface SkipLinkOwnProps extends Pick<BoxProps, "tone" | "radius"> {
  /** The main landmark's id (`#main`); give the target `tabIndex={-1}` so focus lands there. `href`. */
  href: string;
  /** Where it goes, in words: "Skip to content", not "Skip". */
  children: ReactNode;
}

/** Props for {@link SkipLink}: a link's by default, or your router's link's with `as`. */
export type SkipLinkProps<T extends ElementType = "a"> = PolymorphicProps<T, SkipLinkOwnProps>;

/**
 * The first stop for keyboard users: out of sight until it takes focus, then a candy chip pops in at the top-left
 * corner, over everything, and takes them past the navigation. Put it first in `<body>`, before the app bar.
 *
 *   <SkipLink href="#main">Skip to content</SkipLink>
 *
 * Renders `<a class="chu-box chu-skip-link">`; with `as`, your router's link.
 */
export const SkipLink = /*#__PURE__*/ forwardRef(function SkipLink(
  { as: Tag = "a", tone, radius, className, ...rest }: PolymorphicProps<ElementType, Partial<SkipLinkOwnProps>>,
  ref,
) {
  return <Tag ref={ref} className={cx("chu-box chu-skip-link", className)} {...box({ tone, radius })} {...rest} />;
}) as PolymorphicComponent<"a", SkipLinkOwnProps>;
