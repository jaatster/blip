---
name: Level tile
package: "@blip/game"
css: level.css
element: null
react: LevelTile
status: beta
---

# Level tile

One stop on a level map: its number in Pixel Bop, the stars earned, a padlock when locked, and an arrow bobbing over
the one you're on. Tiles join into a map with dotted paths.

## Usage

```html
<ol class="blip-level-map" aria-label="World 1 levels">
  <li>
    <button type="button" class="blip-box blip-level" aria-label="Level 2, Clover Hill: 2 of 3 stars">
      <span class="blip-level-number">2</span>
      <span class="blip-level-stars"><blip-sprite name="star"></blip-sprite><blip-sprite name="star"></blip-sprite><blip-sprite name="star-empty"></blip-sprite></span>
    </button>
    <span class="blip-level-path" aria-hidden="true"></span>
  </li>
  <li>
    <button type="button" class="blip-box blip-level" aria-current="step" aria-label="Level 3, Puddle Path: you are here">
      <blip-sprite class="blip-level-here" name="arrow"></blip-sprite>
      <span class="blip-level-number">3</span> …
    </button>
    <span class="blip-level-path" data-locked aria-hidden="true"></span>
  </li>
  <li>
    <button type="button" class="blip-box blip-level" aria-disabled="true" aria-label="Level 4: locked, clear level 3 first">
      <blip-sprite name="padlock"></blip-sprite>
    </button>
  </li>
</ol>
```

## Anatomy

1. **Tile** (`.blip-level`): a candy box, 46 x 44 pixels, radius 4.
2. **Number** (`.blip-level-number`): Pixel Bop at scale 2, tabular.
3. **Stars** (`.blip-level-stars`): three star sprites, full or empty.
4. **Here** (`.blip-level-here`): the arrow sprite over the current tile.
5. **Path** (`.blip-level-path`): dots two pixels square, two apart.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-tone` | accent (default), any tone | A boss in `danger`, a bonus in `purple`. |
| content | number, or a sprite | A chest or trophy for bonus levels. |
| `.blip-level-path[data-direction="down"]` | | A path that goes down to the next row. |
| `.blip-level-path[data-locked]` | | A path not walked yet, in the soft line colour. |

## States

| State | How | Look |
|---|---|---|
| Hover, focus, pressed | pointer, keyboard | Lifts; the yellow ring; sits in. |
| Current | `aria-current="step"` | Sits in, bands swapped; the arrow bobs for five seconds, then rests. |
| Locked | `aria-disabled="true"` | Dithered with the page; the padlock stays crisp on top. |

## Accessibility

- Tiles are buttons (or links) in an ordered list: the order is the path. Tab moves along them.
- Name each tile with everything it shows: number, name, stars, and why it's locked.
- Locked tiles stay focusable (`aria-disabled`, not `disabled`) so they can say how to unlock them.
- The dotted way between tiles prints, though browsers leave backgrounds off paper.

## Content

Level names are short and a little funny; put them in the name, not on the tile.

## Do and don't

- **Do** show progress: stars on every cleared tile.
- **Don't** hide locked levels; show the way ahead.

## API

| Custom property | Default | |
|---|---|---|
| `--blip-level-path` | 10 | A path's length in pixels. |
