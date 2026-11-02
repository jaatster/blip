/**
 * Inventory: Slot, SlotCount and SlotTag, the parts that go inside <Inventory>, and <Inventory> itself (generated from
 * its element, re-exported here). CSS from @jaatster/blip-game (inventory.css).
 */
import { forwardRef } from "react";
import type { ElementType } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../../internal/polymorphic.js";
import { cx, type NativeProps, type Tone } from "../../internal/props.js";

export { Inventory, type InventoryProps } from "../../generated/game.js";

/** Own props of {@link Slot}. */
export interface SlotOwnProps {
  /**
   * The item's rarity, which tints the slot: common (cream, the default), uncommon (green), rare (blue), epic
   * (purple), legendary (orange). Say it in the slot's name too. `data-rarity`.
   */
  rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary";
  /** soft (the default here) for a slot with an item in it; outline for an empty one, flat, no drop. `data-variant`. */
  variant?: "soft" | "outline";
  /** A colour outside the rarity scale. `data-tone`. */
  tone?: Tone;
  /** The selected slot: sits in, bands swapped. `<Inventory>` moves it as the player picks. `aria-selected`. */
  selected?: boolean;
  /** Can't be picked: dithered, and the arrow keys skip it. `aria-disabled="true"`. */
  locked?: boolean;
}

export type SlotProps<T extends ElementType = "button"> = PolymorphicProps<T, SlotOwnProps>;

/**
 * One item slot of an `<Inventory>`: a soft candy box holding one sprite, tinted by rarity, maybe with a
 * {@link SlotCount} and a {@link SlotTag}. The element makes the slots the options of its listbox. Name every slot
 * with what it holds, how many, and anything shown only by colour or a tag ("Dusk gem, epic, 2"); an empty one is
 * "Empty". Leave its sprite unnamed.
 *
 *   <Inventory aria-label="Backpack" onSelect={(e) => show(e.detail.value)}>
 *     <Slot aria-label="Red potion, 3"><Sprite name="potion" /><SlotCount>3</SlotCount></Slot>
 *     <Slot rarity="rare" selected aria-label="Moon key, rare"><Sprite name="key" tone="blue" /></Slot>
 *     <Slot variant="outline" aria-label="Empty" />
 *   </Inventory>
 *
 * Renders `<button type="button" class="blip-box blip-slot" data-variant="soft">`; `as="span"` for a picture of a slot
 * outside the grid (beside the selected item's details).
 */
export const Slot = /*#__PURE__*/ forwardRef(function Slot(
  {
    as: Tag = "button",
    type,
    rarity,
    variant = "soft",
    tone,
    selected,
    locked,
    className,
    ...rest
  }: SlotProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      type={type ?? (Tag === "button" ? "button" : undefined)}
      className={cx("blip-box blip-slot", className)}
      data-variant={variant}
      data-rarity={rarity}
      data-tone={tone}
      aria-selected={selected}
      aria-disabled={locked ? true : undefined}
      {...rest}
    />
  );
}) as PolymorphicComponent<"button", SlotOwnProps>;

/** Props for {@link SlotCount}. */
export type SlotCountProps = NativeProps<"span">;

/**
 * How many are in the slot: Pixel Bop digits in POP, in the bottom corner. Hidden from assistive technology by
 * default: say the count in the slot's name.
 *
 *   <SlotCount>3</SlotCount>
 *
 * Renders `<span class="blip-slot-count blip-display blip-pop" data-scale="1" aria-hidden="true">`.
 */
export const SlotCount = /*#__PURE__*/ forwardRef<HTMLSpanElement, SlotCountProps>(function SlotCount({ className, ...rest }, ref) {
  return (
    <span
      ref={ref}
      className={cx("blip-slot-count blip-display blip-pop", className)}
      data-scale={1}
      aria-hidden={true}
      {...rest}
    />
  );
});

/** Own props of {@link SlotTag}. */
export interface SlotTagOwnProps {
  /** The tag's colour. `data-tone`. */
  tone?: Tone;
}

export type SlotTagProps = SlotTagOwnProps & NativeProps<"span", SlotTagOwnProps>;

/**
 * A tiny candy label on the slot's top corner: "E" for equipped, "New". Hidden from assistive technology by
 * default: say it in the slot's name ("Reed sword, uncommon, equipped").
 *
 *   <SlotTag tone="neutral">E</SlotTag>
 *
 * Renders `<span class="blip-box blip-slot-tag" aria-hidden="true">`.
 */
export const SlotTag = /*#__PURE__*/ forwardRef<HTMLSpanElement, SlotTagProps>(function SlotTag({ tone, className, ...rest }, ref) {
  return (
    <span ref={ref} className={cx("blip-box blip-slot-tag", className)} data-tone={tone} aria-hidden={true} {...rest} />
  );
});
