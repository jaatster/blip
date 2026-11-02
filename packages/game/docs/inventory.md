---
name: Inventory
package: "@jaatster/blip-game"
css: inventory.css
element: blip-inventory
react: Inventory
status: beta
---

# Inventory

A grid of item slots: soft candy boxes tinted by rarity, a count in the corner, empty slots, and one selected slot.
Pair it with a panel that describes the selected item.

## Usage

```html
<blip-inventory class="blip-inventory" aria-label="Backpack" style="--blip-inventory-columns: 5">
  <button type="button" class="blip-box blip-slot" data-variant="soft" aria-label="Red potion, 3">
    <blip-sprite name="potion"></blip-sprite>
    <span class="blip-slot-count blip-display blip-pop" data-scale="1" aria-hidden="true">3</span>
  </button>
  <button type="button" class="blip-box blip-slot" data-variant="soft" data-rarity="rare"
          aria-selected="true" aria-label="Moon key, rare">
    <blip-sprite name="key" data-tone="blue"></blip-sprite>
  </button>
  <button type="button" class="blip-box blip-slot" data-variant="soft" data-rarity="uncommon"
          aria-label="Reed sword, uncommon, equipped">
    <blip-sprite name="sword" data-tone="green"></blip-sprite>
    <span class="blip-box blip-slot-tag" data-tone="neutral" aria-hidden="true">E</span>
  </button>
  <button type="button" class="blip-box blip-slot" data-variant="outline" aria-label="Empty"></button>
</blip-inventory>
```

```js
import "@jaatster/blip-game/inventory";
bag.addEventListener("blip-select", (e) => showDetails(e.detail.item));
```

Slots a framework renders after the element upgrades become options and join the keys as they arrive.

## Anatomy

1. **Grid** (`.blip-inventory`): `--blip-inventory-columns` slots across; each slot `--blip-inventory-slot` pixels square (24).
2. **Slot** (`.blip-slot`): a soft candy box, radius 3, holding one sprite.
3. **Count** (`.blip-slot-count`): Pixel Bop digits in POP, bottom corner.
4. **Tag** (`.blip-slot-tag`): a tiny candy label on the top corner: "E" for equipped, "New".

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-rarity` | `common` (cream, default), `uncommon` (green), `rare` (blue), `epic` (purple), `legendary` (orange) | The slot's tint. Say the rarity in the slot's name too. |
| `data-variant` | `soft` (items), `outline` (empty) | Empty slots are flat, with no drop. |
| `data-tone` | any tone | A slot outside the rarity scale. |

## States

| State | How | Look |
|---|---|---|
| Hover | pointer | Lifts a pixel. |
| Focus | keyboard | The yellow ring. |
| Selected | `aria-selected="true"` | Sits in, bands swapped. |
| Pressed | `:active` | Sits in its drop. |
| Locked | `aria-disabled="true"` | Dithered; arrow keys skip it. |

## Accessibility

- `blip-inventory` is a single-select `listbox`; each slot is a `<button role="option">` with `aria-selected`.
- **Keyboard:** one slot is in the tab order. **Left** and **Right** move along, **Up** and **Down** move a whole row
  (however many columns the grid has at its current width), **Home** and **End** jump to the ends, typing a letter
  jumps to the next item whose name starts with it, **Enter** or **Space** selects.
- Name every slot with what it holds, how many, and anything shown only as colour or a tag: "Dusk gem, epic, 2".
- Slots are 24 pixels square: 48 CSS pixels at the default pixel, twice the minimum target.

## Content

Item names in sentence case; counts as plain numbers. Keep descriptions for the detail panel, not the slot.

## Do and don't

- **Do** show what's selected in a panel beside the grid.
- **Don't** rely on the rarity colour alone; say it.

## API

| Member | |
|---|---|
| `slots` | The slots, in order. |
| `selected` | The selected slot, if any. |
| `select(slotOrIndex)` | Selects a slot and sends `blip-select`. |

| Event | `detail` | When |
|---|---|---|
| `blip-select` | `{ item, index, value }` | A slot was selected; `value` is its `value`, `data-value` or name. |
