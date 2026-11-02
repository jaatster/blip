/**
 * Level tile: LevelMap, LevelTile, LevelNumber, LevelStars and LevelPath. CSS from @jaatster/blip-game (level.css). The
 * current tile's arrow is `<Sprite className="blip-level-here" name="arrow" />` (Sprite from this same entry point).
 */
import { forwardRef } from "react";
import type { ElementType } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../../internal/polymorphic.js";
import { cx, flag, type NativeProps, type Tone } from "../../internal/props.js";

/** Something that shows only pictures or numbers needs a name: `aria-label`, or `aria-labelledby`. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

/** Props for {@link LevelMap}. */
export type LevelMapProps = NativeProps<"ol">;

/**
 * A level map: the tiles in order, in a row that wraps, with room above for the arrow. The list's order is the
 * path, and Tab moves along it. Each `<li>` holds a {@link LevelTile} and the {@link LevelPath} out of it. Name it.
 *
 *   <LevelMap aria-label="World 1 levels">
 *     <li><LevelTile aria-label="Level 1, Sprout Steps: 3 of 3 stars">…</LevelTile><LevelPath /></li>
 *     <li><LevelTile current aria-label="Level 2, Clover Hill: you are here">…</LevelTile><LevelPath locked /></li>
 *     <li><LevelTile locked aria-label="Level 3: locked"><Sprite name="padlock" /></LevelTile></li>
 *   </LevelMap>
 *
 * Renders `<ol class="blip-level-map">`.
 */
export const LevelMap = /*#__PURE__*/ forwardRef<HTMLOListElement, LevelMapProps>(function LevelMap({ className, ...rest }, ref) {
  return <ol ref={ref} className={cx("blip-level-map", className)} {...rest} />;
});

/** Options of {@link LevelTile}. */
export interface LevelTileOptions {
  /** The tile's candy: accent (default), or any tone: a boss in `danger`, a bonus in `purple`. `data-tone`. */
  tone?: Tone;
  /** Where the player is: the tile sits in, bands swapped, under the bobbing arrow. `aria-current="step"`. */
  current?: boolean;
  /** Not open yet: dithered, but still focusable, so its name can say how to unlock it. `aria-disabled="true"`. */
  locked?: boolean;
}

/**
 * Own props of {@link LevelTile}: its options, and a name with everything the tile shows (its number, its name, the
 * stars, why it is locked) in `aria-label` or `aria-labelledby`: the stars and the padlock are pictures.
 */
export type LevelTileOwnProps = LevelTileOptions & Named;

export type LevelTileProps<T extends ElementType = "button"> = PolymorphicProps<T, LevelTileOwnProps>;

/**
 * One stop on a level map: a candy box with the level's number in Pixel Bop and the stars earned, a padlock when it
 * is locked, a sprite for a bonus. A button (`type="button"`) by default; `as="a"` with an href for a link. The
 * current tile carries the arrow first: `<Sprite className="blip-level-here" name="arrow" />`, which bobs over it for
 * five seconds, then rests.
 *
 *   <LevelTile aria-label="Level 2, Clover Hill: 2 of 3 stars">
 *     <LevelNumber>2</LevelNumber>
 *     <LevelStars><Sprite name="star" /><Sprite name="star" /><Sprite name="star-empty" /></LevelStars>
 *   </LevelTile>
 *   <LevelTile current aria-label="Level 3, Puddle Path: you are here">
 *     <Sprite className="blip-level-here" name="arrow" />
 *     <LevelNumber>3</LevelNumber>
 *   </LevelTile>
 *   <LevelTile locked tone="danger" aria-label="Level 5, the boss: locked"><Sprite name="padlock" /></LevelTile>
 *
 * Renders `<button type="button" class="blip-box blip-level">`.
 */
// The public type (the cast below) requires the name; inside, only the options are read.
export const LevelTile = /*#__PURE__*/ forwardRef(function LevelTile(
  {
    as: Tag = "button",
    type,
    tone,
    current,
    locked,
    className,
    ...rest
  }: PolymorphicProps<ElementType, LevelTileOptions>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      type={type ?? (Tag === "button" ? "button" : undefined)}
      className={cx("blip-box blip-level", className)}
      data-tone={tone}
      aria-current={current ? "step" : undefined}
      aria-disabled={locked ? true : undefined}
      {...rest}
    />
  );
}) as PolymorphicComponent<"button", LevelTileOwnProps>;

/** Props for {@link LevelNumber}. */
export type LevelNumberProps = NativeProps<"span">;

/**
 * The level's number, in Pixel Bop at scale 2 with tabular digits.
 *
 *   <LevelNumber>12</LevelNumber>
 *
 * Renders `<span class="blip-level-number">`.
 */
export const LevelNumber = /*#__PURE__*/ forwardRef<HTMLSpanElement, LevelNumberProps>(function LevelNumber(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("blip-level-number", className)} {...rest} />;
});

/** Props for {@link LevelStars}. */
export type LevelStarsProps = NativeProps<"span">;

/**
 * The stars earned: three star sprites, full or empty, a pixel apart. Say the count in the tile's name.
 *
 *   <LevelStars><Sprite name="star" /><Sprite name="star" /><Sprite name="star-empty" /></LevelStars>
 *
 * Renders `<span class="blip-level-stars">`.
 */
export const LevelStars = /*#__PURE__*/ forwardRef<HTMLSpanElement, LevelStarsProps>(function LevelStars(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("blip-level-stars", className)} {...rest} />;
});

/** Own props of {@link LevelPath}. */
export interface LevelPathOwnProps {
  /** Goes down to the next row instead of across. `data-direction="down"`. */
  direction?: "down";
  /** Not walked yet: the dots in the soft line colour. `data-locked`. */
  locked?: boolean;
  children?: never;
}

export type LevelPathProps = LevelPathOwnProps & NativeProps<"span", LevelPathOwnProps>;

/**
 * The dotted way from a tile to the next: dots two pixels square, two apart, `--blip-level-path` pixels long (10). It
 * is scenery, hidden from assistive technology: the list's order is the path.
 *
 *   <li><LevelTile current aria-label="Level 3, Puddle Path: you are here">…</LevelTile><LevelPath locked /></li>
 *
 * Renders `<span class="blip-level-path" aria-hidden="true">`.
 */
export const LevelPath = /*#__PURE__*/ forwardRef<HTMLSpanElement, LevelPathProps>(function LevelPath(
  { direction, locked, className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cx("blip-level-path", className)}
      data-direction={direction}
      data-locked={flag(locked)}
      aria-hidden={true}
      {...rest}
    />
  );
});
