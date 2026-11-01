---
name: Grid
package: "@blip/components"
css: grid.css
element: null
react: Grid
status: stable
---

# Grid

As many equal columns as fit, each at least a minimum width counted in pixels; one column when the container is
narrower than that. A layout primitive with no breakpoints: it follows its container, so the same grid works in a
page, a sidebar or a card.

## Usage

```html
<ul class="blip-grid" role="list">…cards…</ul>
<dl class="blip-grid" data-min="64" data-gap="6">…stats…</dl>
<div class="blip-grid" style="--blip-grid-min: calc(72 * var(--blip-pixel))">…</div>
```

## Anatomy

`repeat(auto-fit, minmax(min(100%, minimum), 1fr))`: columns share the row equally, never narrower than the minimum,
never wider than the container.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-min` | `32`, `48`, `64`, `80`, `96` (default), `128`, `160`, `192` | A column's minimum width, in pixels (192 CSS px at the default 96). Cards 96 to 160; stats 48 to 128; tiles use `.blip-tile-grid`. |
| `data-gap` | `0`, `1`, `2`, `3`, `4`, `6`, `8` (default), `12`, `16`, `24`, `32` | Pixels between cells (`--blip-space-N`). |
| `data-fill` | | Keeps empty columns when there are few items, so two cards don't stretch across a wide row. |

## Accessibility

Layout only: reading order is source order. A grid of things is usually a list (`<ul role="list">`); a grid of
label-value pairs is a `<dl>`.

## Do and don't

- **Do** set the minimum from the content: the narrowest a card can be and still read well.
- **Don't** use the grid for a data table: use a table.

## API

| Custom property | Default | |
|---|---|---|
| `--blip-grid-min` | 96 pixels | A column's minimum width (a length). |
| `--blip-grid-gap` | `--blip-space-8` | The gap. |
