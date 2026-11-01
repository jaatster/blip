/**
 * <Link>. CSS from @jaatster/blip-components (link.css).
 */
import { forwardRef } from "react";
import type { ElementType } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { cx } from "../internal/props.js";

/** Props for {@link Link}. */
export interface LinkOwnProps {
  /** A link on its own line (under a card, at the end of a list): bold, underlined on hover. `data-variant="standalone"`. */
  standalone?: boolean;
  /**
   * Opens somewhere else: adds the pixel arrow, and its words are read out with the link ("opens in a new tab").
   * `true` reads "opens in a new tab". `data-external`.
   */
  external?: string | true;
}

/** Props for {@link Link}: a link's by default, or your router's link's with `as`. */
export type LinkProps<T extends ElementType = "a"> = PolymorphicProps<T, LinkOwnProps>;

/**
 * Words that go somewhere: underlined, in the accent's text colour; focus paints it yellow with ink letters.
 * Renders `<a class="chu-link">`; with `as`, your router's link (the class is all the styling).
 *
 *   <Link href="/rules">house rules</Link>
 *   <Link standalone href="/levels">All levels</Link>
 *   <Link href="https://example.com/wiki" target="_blank" rel="noopener" external>Wiki</Link>
 *   <Link as={RouterLink} to="/rules">house rules</Link>
 */
export const Link = /*#__PURE__*/ forwardRef(function Link({ as: Tag = "a", standalone, external, className, ...rest }: LinkProps<ElementType>, ref) {
  return (
    <Tag
      ref={ref}
      className={cx("chu-link", className)}
      data-variant={standalone ? "standalone" : undefined}
      data-external={external === true ? "opens in a new tab" : external}
      {...rest}
    />
  );
}) as PolymorphicComponent<"a", LinkOwnProps>;
