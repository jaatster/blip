---
name: Inventory
package: "@jaatster/blip-game"
css: inventory.css
element: pp-inventory
react: Inventory
status: beta
---

# Inventory

A grid of item slots: soft candy boxes tinted by rarity, a count in the corner, empty slots, and one selected slot.
Pair it with a panel that describes the selected item.

## Usage

```html
<pp-inventory class="pp-inventory" aria-label="Backpack" style="--pp-inventory-columns: 5">
  <button type="button" class="pp-box pp-slot" data-variant="soft" aria-label="Red potion, 3">
    <pp-sprite name="potion"></pp-sprite>
    <span class="pp-slot-count pp-display pp-pop" data-scale="1" aria-hidden="true">3</span>
  </button>
  <button type="button" class="pp-box pp-slot" data-variant="soft" data-rarity="rare"
          aria-selected="true" aria-label="Moon key, rare">
    <pp-sprite name="key" data-tone="blue"></pp-sprite>
  </button>
  <button type="button" class="pp-box pp-slot" data-variant="soft" data-rarity="uncommon"
          aria-label="Reed sword, uncommon, equipped">
    <pp-sprite name="sword" data-tone="green"></pp-sprite>
    <span class="pp-box pp-slot-tag" data-tone="neutral" aria-hidden="true">E</span>
  </button>
  <button type="button" class="pp-box pp-slot" data-variant="outline" aria-label="Empty"></button>
</pp-inventory>
```

```js
import "@jaatster/blip-game/inventory";
bag.addEventListener("pp-select", (e) => showDetails(e.detail.item));
```

## Anatomy

1. **Grid** (`.pp-inventory`): `--pp-inventory-columns` slots across; each slot `--pp-inventory-slot` pixels square (24).
2. **Slot** (`.pp-slot`): a soft candy box, radius 3, holding one sprite.
3. **Count** (`.pp-slot-count`): Pixel Bop digits in POP, bottom corner.
4. **Tag** (`.pp-slot-tag`): a tiny candy label on the top corner: "E" for equipped, "New".

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

- `pp-inventory` is a single-select `listbox`; each slot is a `<button role="option">` with `aria-selected`.
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
| `select(slotOrIndex)` | Selects a slot and sends `pp-select`. |

| Event | `detail` | When |
|---|---|---|
| `pp-select` | `{ item, index, value }` | A slot was selected; `value` is its `value`, `data-value` or name. |
