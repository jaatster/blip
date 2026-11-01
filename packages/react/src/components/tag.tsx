/**
 * Tag: Tag and TagRemove. CSS from @blip/components (tag.css).
 */
import { forwardRef } from "react";
import type { ElementType } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { box, cx, type NativeProps, type Radius, type Size, type Tone, type Variant } from "../internal/props.js";

/** A name for something whose words don't name it: `aria-label` or `aria-labelledby`. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

/** Own props of {@link Tag}. */
export interface TagOwnProps {
  /** Soft (default) to label; candy for a tag you act on; outline for filter chips at rest; ghost. `data-variant`. */
  variant?: Variant;
  /**
   * Meaning first: success for done, danger for out, neutral for away, or a candy; yellow only for coins and stars
   * (it means focus). `data-tone`.
   */
  tone?: Tone;
  /** 12, 14 (default, the TV's pill) or 16 pixels high; large ones can hold an icon. `data-size`. */
  size?: Size;
  /** Corner radius in pixels, 0 to 8 (5 by default; small 4, large 6). `data-blip-r`. */
  radius?: Radius;
  /** A filter chip (`as="button"`) that is on: it sits in. Give a chip `false` when off. `aria-pressed`. */
  pressed?: boolean;
}

export type TagProps<T extends ElementType = "span"> = PolymorphicProps<T, TagOwnProps>;

/**
 * The TV's pill: a short upper-case label that says what something is (a rarity, a status, a zone), in text. With
 * `as="button"` and `pressed` it is a filter chip (it gets `type="button"`; group chips with `role="group"` and a
 * label); with `as="a"`, a tag that goes somewhere. Write it in sentence case. Renders `<span class="blip-box
 * blip-tag">`.
 *
 *   <Tag tone="success">Cleared</Tag>
 *   <Tag tone="orange">Lava zone<TagRemove aria-label="Remove Lava zone" onClick={remove} /></Tag>
 *   <Tag as="button" variant="outline" pressed={swords} onClick={toggle}>Swords</Tag>
 */
export const Tag = /*#__PURE__*/ forwardRef(function Tag(
  { as: Pill = "span", variant, tone, size, radius, pressed, type, className, ...rest }: TagProps<ElementType>,
  ref,
) {
  return (
    <Pill
      ref={ref}
      className={cx("blip-box blip-tag", className)}
      {...box({ variant, tone, radius })}
      data-size={size}
      type={type ?? (Pill === "button" ? "button" : undefined)}
      aria-pressed={pressed}
      {...rest}
    />
  );
}) as PolymorphicComponent<"span", TagOwnProps>;

/** Props for {@link TagRemove}: a name, and a button's props without children (it draws the cross). */
export type TagRemoveProps = Named & NativeProps<"button", { children?: never }>;

/**
 * A tag's cross: its own small button with a pixel ×, last in the tag. It is 12 pixels square (24 CSS px) and named
 * for what it removes ("Remove Lava zone"); put crosses on medium and large tags. After removing, move focus to the
 * next tag or back to the input that added it. Renders `<button class="blip-tag-remove" type="button">`.
 *
 *   <Tag tone="teal">Co-op<TagRemove aria-label="Remove Co-op" onClick={remove} /></Tag>
 */
export const TagRemove = /*#__PURE__*/ forwardRef<HTMLButtonElement, TagRemoveProps>(function TagRemove(
  { type = "button", className, ...rest },
  ref,
) {
  return <button ref={ref} className={cx("blip-tag-remove", className)} type={type} {...rest} />;
});
