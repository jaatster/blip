---
name: Tile
package: "@blip/components"
css: tile.css
element: blip-tile-grid
react: Tile
status: stable
---

# Tile

The TV's app block: a square candy box with a white glyph in an ink outline, and its name below. The selected tile
lifts two pixels inside a ring and an arrow bobs above it; a glint can sweep across it. Use tiles for launchers,
inventories, level and world pickers: a few big things to choose between, each best known by its picture.

## Usage

```html
<blip-tile-grid selection="single">
  <ul class="blip-tile-grid" role="list" aria-label="Inventory">
    <li class="blip-tile-item">
      <button class="blip-box blip-tile" data-tone="red" aria-pressed="true" aria-labelledby="t-sword">
        <svg class="blip-icon" viewBox="0 0 12 12" aria-hidden="true">…</svg>
        <span class="blip-tile-glint"></span>
      </button>
      <span class="blip-tile-label" id="t-sword" aria-hidden="true">Iron sword</span>
    </li>
    …
  </ul>
</blip-tile-grid>
```

## Anatomy

1. **Tile**: a square candy box (`.blip-box.blip-tile`), a `<button>` or `<a>`. Bands as on the TV: about 20% light, 18%
   shade, never thicker than on a 28-pixel block.
2. **Glyph**: a 12 x 12 icon, white with a one-pixel ink outline (diagonals included), one pixel above the middle.
3. **Item**: `.blip-tile-item`, a fixed-width cell holding the tile, room above it for the arrow, and the label.
4. **Label**: `.blip-tile-label`, upper case, centred under the tile; it names the tile (`aria-labelledby`) and is
   `aria-hidden` itself, so screen readers hear it once, as the button's name.
5. **Ring**: drawn round the box's own shape when selected: one pixel of white, one of ink.
6. **Arrow**: the TV's 10 x 6 pointer over the selected tile, white with an ink outline, bobbing on the beat for six
   beats (under five seconds), then resting.
7. **Glint** (optional): `.blip-tile-glint`, an empty span; a white band with light candy edges sweeps across in five
   frames once, as the tile is selected.
8. **Grid**: `.blip-tile-grid`, as many fixed cells as fit.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-tone` | `accent` (default), `info`, `success`, `warning`, `danger`, `neutral`, any candy name | The block's candy. In a launcher, the app's colour; in an inventory, the item's kind. Yellow is allowed for coins. |
| `data-variant` | `candy` (default), `soft`, `outline`, `ghost` | Soft for a calmer grid; an `outline` tile with no glyph is an empty slot. |
| `data-size` | `sm` (20 pixels), `md` (28, default), `lg` (36) | On the tile, or on the `.blip-tile-grid` for every tile in it. Cells are 32, 40 and 48 pixels wide. |
| `data-label="tooltip"` | on `.blip-tile-item` | The label shows only while its tile is hovered, focused or selected, in its own space below (it never covers anything). Give the label `.blip-box` for a cream bubble. |

## States

| State | How | Look |
|---|---|---|
| Hover | pointer | Lifts one pixel (from the box). |
| Focus | keyboard | The yellow ring. |
| Pressed | `:active` | Sits in its drop. |
| Selected | `aria-pressed="true"`, `aria-selected="true"`, `aria-checked="true"`, `aria-current`, or `data-selected` (looks only) | Lifts two pixels, keeps its bands, white ring with an ink edge; the arrow bobs above it six times; the glint sweeps once. Nothing moves for more than five seconds. |
| Selected with focus | both | The ring and the arrow turn focus yellow: the TV's look, where the selected block is the focused one. |
| Disabled | `disabled` or `aria-disabled="true"` | Dithered. Arrow keys skip it. |

## Accessibility

- Each tile is a real `<button>` (choosing) or `<a>` (going somewhere), named by its visible label through
  `aria-labelledby`; the label is `aria-hidden` so it isn't read twice. The glyph is `aria-hidden`.
- Say what selection means with the right attribute: `aria-pressed` for a pick in an inventory, `aria-current="true"`
  for the active app in a launcher. `data-selected` is only for pictures of the state (docs, tests).
- `<blip-tile-grid>` makes the grid one Tab stop. Keyboard:

  | Key | Does |
  |---|---|
  | Tab | Into the grid, onto the selected tile (or the first); Tab again leaves it. |
  | Left, Right | The previous or next tile; mirrored in right-to-left pages. |
  | Up, Down | The nearest tile in the row above or below. |
  | Home, End | The first or last tile. |
  | Enter, Space | Press the tile (with `selection="single"`, select it). |

- Without the element every tile is its own Tab stop: nothing is lost, there are just more stops.
- The arrow, ring and glint are decoration. Reduced motion stops the bob and the glint. In Windows high contrast the
  selected tile gets a dashed system outline, distinct from the solid focus outline.

## Content

- One glyph per tile, from `@blip/icons` or drawn on the same 12 x 12 grid. Pictures, not letters.
- Labels: one to three words, sentence case (CSS sets upper case). Counts go in the label: "Potion ×3".

## Do and don't

- **Do** keep a tile grid to one kind of thing: apps, items or levels.
- **Do** use tones that mean something (an item's kind, an app's colour), not a rainbow for its own sake.
- **Don't** put text inside the block, or more than one glyph.
- **Don't** use a tile for a command with no picture: that's a button.

## API

| Class or attribute | |
|---|---|
| `.blip-tile` | The block. Use with `.blip-box`. |
| `.blip-tile-item`, `.blip-tile-label`, `.blip-tile-glint`, `.blip-tile-grid` | Cell, label, glint span, grid. |

| Custom property | Default | |
|---|---|---|
| `--blip-tile-glyph` | `--blip-white` | The glyph's colour. |
| `--blip-tile-ring` | `--blip-white` | The selection ring's and arrow's colour (focus turns them yellow). |
| `--blip-tile-cell` | 40 pixels (32, 48), or 5rem (4, 6) if that is wider | A cell's width; keep it an even number of pixels so the arrow centres on whole pixels. The default widens with a bigger default text size, so a label still breaks between words. |
| `--blip-tone`, `--blip-tone-light`, `--blip-tone-shade`, `--blip-tone-on` | accent | A custom candy. |

### `<blip-tile-grid>`

| Attribute or property | | |
|---|---|---|
| `selection` | `single` | Pressing a tile sets `aria-pressed="true"` on it and `"false"` on the others. |
| | `follow` | The focused tile is the current one (`aria-current="true"`), as on the TV's Home row. |
| `tiles` | read only | The focusable tiles, in order. |
| `select(tile)` | method | Selects a tile; returns `false` if a listener refused. |

| Event | Detail | |
|---|---|---|
| `blip-select` | `{ tile }` | Before the selection moves. Cancelable: `preventDefault()` keeps the old one. |

Tiles added or removed later keep one Tab stop between them: the tile that had it, else the selected one, else the
first.
