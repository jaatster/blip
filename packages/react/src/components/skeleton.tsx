/**
 * <Skeleton>. CSS from @blip/components (skeleton.css).
 */
import { forwardRef } from "react";
import type { CSSProperties, ElementType } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { cx } from "../internal/props.js";

/** Whole pixels, as a length. */
const px = (n: number): string => `calc(${n} * var(--blip-pixel))`;

/** The user's style over one public custom property, when it has a value. */
function withProperty(style: CSSProperties | undefined, name: string, value?: string): CSSProperties | undefined {
  return value === undefined ? style : ({ [name]: value, ...style } as CSSProperties);
}

/** Own props of {@link Skeleton}. */
export interface SkeletonOwnProps {
  /** A block (default: a picture, a button), a line of body text, or a pixel disc (an avatar). `data-shape`. */
  shape?: "block" | "text" | "circle";
  /** A block's height or a circle's width, in whole pixels (24 by default). `--blip-skeleton-size`. */
  size?: number;
  /** None: a skeleton is empty. */
  children?: never;
}

export type SkeletonProps<T extends ElementType = "span"> = PolymorphicProps<T, SkeletonOwnProps>;

/**
 * A dithered placeholder in the shape of content on its way, so the layout doesn't jump when it arrives. It is a
 * picture of nothing: hide it (or a wrapper) with `aria-hidden`, mark the region that is loading `aria-busy` (on a
 * wrapper, never on a `.blip-box`), and say in words what is loading. Vary text lines with `inlineSize` in `style`.
 * Renders `<span class="blip-skeleton">` (`as="div"` for a `<div>`).
 *
 *   <div aria-busy="true">
 *     <Loader size="sm">Loading friends</Loader>
 *     <div aria-hidden="true">
 *       <Skeleton shape="circle" />
 *       <Skeleton shape="text" style={{ inlineSize: "70%" }} />
 *     </div>
 *   </div>
 */
export const Skeleton = /*#__PURE__*/ forwardRef(function Skeleton(
  { as: Tag = "span", shape, size, style, className, ...rest }: SkeletonProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("blip-skeleton", className)}
      data-shape={shape}
      style={withProperty(style, "--blip-skeleton-size", size === undefined ? undefined : px(size))}
      {...rest}
    />
  );
}) as PolymorphicComponent<"span", SkeletonOwnProps>;
