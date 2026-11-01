/**
 * Tile: Tile, TileGlint, TileItem, TileLabel and TileList. CSS from @jaatster/blip-components (tile.css). <TileGrid> (the
 * element's wrapper) adds arrow keys and selection round the markup these render.
 */
import { forwardRef } from "react";
import type { ElementType } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { box, cx, type NativeProps, type Size, type Tone, type Variant } from "../internal/props.js";

/** A list element, which keeps its list semantics in Safari only with `role="list"`. */
const isList = (tag: ElementType): boolean => tag === "ul" || tag === "ol";

/** Own props of {@link Tile}. */
export interface TileOwnProps {
  /** Candy (default), soft for a calmer grid, outline (with no glyph: an empty slot) or ghost. `data-variant`. */
  variant?: Variant;
  /** The block's candy: an app's colour, an item's kind. Yellow is for coins. `data-tone`. */
  tone?: Tone;
  /** 20, 28 (default, the TV's block) or 36 pixels square; or size the whole {@link TileList}. `data-size`. */
  size?: Size;
  /** Picked (in an inventory): it lifts inside a ring and the arrow bobs above it. On a button tile. `aria-pressed`. */
  pressed?: boolean;
}

export type TileProps<T extends ElementType = "button"> = PolymorphicProps<T, TileOwnProps>;

/**
 * The TV's app block: a square candy box with one white glyph in an ink outline. Its name is a {@link TileLabel} below.
 * A `<button>` (choosing) or, with `as="a"`, a link (going somewhere; `aria-current` marks the active one), named by
 * its label through `aria-labelledby`. Renders `<button class="chu-box chu-tile">`.
 *
 *   <TileItem>
 *     <Tile tone="red" pressed aria-labelledby="t-sword"><Icon name="sword" /><TileGlint /></Tile>
 *     <TileLabel id="t-sword">Iron sword</TileLabel>
 *   </TileItem>
 */
export const Tile = /*#__PURE__*/ forwardRef(function Tile(
  { as: Tag = "button", variant, tone, size, pressed, className, ...rest }: TileProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("chu-box chu-tile", className)}
      {...box({ variant, tone })}
      data-size={size}
      aria-pressed={pressed}
      {...rest}
    />
  );
}) as PolymorphicComponent<"button", TileOwnProps>;

/** Props for {@link TileGlint}. */
export type TileGlintProps = NativeProps<"span", { children?: never }>;

/**
 * An empty span in a tile: a white glint sweeps across it while the tile is selected. It sweeps every 4.5 seconds, and
 * not at all with reduced motion. Renders `<span class="chu-tile-glint">`.
 *
 *   <Tile tone="green" aria-labelledby="app-play"><Icon name="play" /><TileGlint /></Tile>
 */
export const TileGlint = /*#__PURE__*/ forwardRef<HTMLSpanElement, TileGlintProps>(function TileGlint({ className, ...rest }, ref) {
  return <span ref={ref} className={cx("chu-tile-glint", className)} {...rest} />;
});

/** Own props of {@link TileItem}. */
export interface TileItemOwnProps {
  /**
   * The label shows only while its tile is hovered, focused or selected, in its own space below (it never covers
   * anything): a TV-style launcher. `data-label`.
   */
  label?: "tooltip";
}

export type TileItemProps<T extends ElementType = "li"> = PolymorphicProps<T, TileItemOwnProps>;

/**
 * A fixed-width cell holding a tile, room above it for the arrow, and its label. Renders `<li class="chu-tile-item">`
 * (`as="div"` in a grid that is not a list).
 *
 *   <TileItem label="tooltip">
 *     <Tile as="a" href="/play" tone="green" aria-current="true" aria-labelledby="app-1"><Icon name="play" /></Tile>
 *     <TileLabel id="app-1" boxed>Play</TileLabel>
 *   </TileItem>
 */
export const TileItem = /*#__PURE__*/ forwardRef(function TileItem(
  { as: Tag = "li", label, className, ...rest }: TileItemProps<ElementType>,
  ref,
) {
  return <Tag ref={ref} className={cx("chu-tile-item", className)} data-label={label} {...rest} />;
}) as PolymorphicComponent<"li", TileItemOwnProps>;

/** Own props of {@link TileLabel}. */
export interface TileLabelOwnProps {
  /** A cream bubble round the label, with `label="tooltip"` on its item. Adds `.chu-box`. */
  boxed?: boolean;
}

export type TileLabelProps = TileLabelOwnProps & NativeProps<"span", TileLabelOwnProps>;

/**
 * A tile's name, upper case and centred under it: one to three words, counts included ("Potion ×3"). It names the
 * tile (the tile's `aria-labelledby` points at its `id`) and is hidden itself, so it is heard once. Renders `<span
 * class="chu-tile-label" aria-hidden="true">`.
 *
 *   <TileLabel id="t-sword">Iron sword</TileLabel>
 */
export const TileLabel = /*#__PURE__*/ forwardRef<HTMLSpanElement, TileLabelProps>(function TileLabel(
  { boxed, className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx(boxed && "chu-box", "chu-tile-label", className)} aria-hidden {...rest} />;
});

/** Own props of {@link TileList}. */
export interface TileListOwnProps {
  /** Every tile in it 20, 28 (default) or 36 pixels square, in cells 32, 40 or 48 pixels wide. `data-size`. */
  size?: Size;
}

export type TileListProps<T extends ElementType = "ul"> = PolymorphicProps<T, TileListOwnProps>;

/**
 * The grid of tiles (`.chu-tile-grid`): as many fixed cells as fit. A list (with `role="list"`, so it stays one in
 * Safari) named with `aria-label` or `aria-labelledby`; wrap it in a `<TileGrid>` for one Tab stop, the arrow keys
 * and selection. Keep it to one kind of thing. Renders `<ul class="chu-tile-grid" role="list">` (`as="div"` for
 * pictures that are not a list, without the role).
 *
 *   <TileGrid selection="single">
 *     <TileList aria-label="Inventory">
 *       <TileItem>…</TileItem>
 *     </TileList>
 *   </TileGrid>
 */
export const TileList = /*#__PURE__*/ forwardRef(function TileList(
  { as: Tag = "ul", size, role, className, ...rest }: TileListProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("chu-tile-grid", className)}
      role={role ?? (isList(Tag) ? "list" : undefined)}
      data-size={size}
      {...rest}
    />
  );
}) as PolymorphicComponent<"ul", TileListOwnProps>;
