---
name: Skeleton
package: "@jaatster/blip-components"
css: skeleton.css
element: null
react: Skeleton
status: stable
equivalents:
  shadcn: Skeleton
---

# Skeleton

A dithered placeholder in the shape of content that is on its way: lines of text, a picture, an avatar. It keeps
the layout from jumping when the content arrives, and a brighter dither sweeps across it now and then to show that
something is happening. For a wait with nothing to sketch, use a [loader](loader.md).

## Usage

```html
<div aria-busy="true">
  <span class="chu-loader" data-size="sm" role="status">Loading friends</span>
  <div aria-hidden="true">
    <span class="chu-skeleton" data-shape="circle"></span>
    <span class="chu-skeleton" data-shape="text" style="inline-size: 70%"></span>
    <span class="chu-skeleton" data-shape="text" style="inline-size: 45%"></span>
  </div>
</div>
```

## Anatomy

1. **Block**: a one-pixel checkerboard of `--chu-line-soft` and the surface, with one pixel taken off each corner:
   the smallest stepped corner. No outline: it is a placeholder, not candy.
2. **Sweep** (`::after`): a band a third as wide where the checkerboard fills in, moved across in six whole-pixel
   steps every four beats. It changes which pixels are lit; nothing blurs and nothing is see-through.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-shape` | `block` (default), `text`, `circle` | A picture or button; a line of body text (6 pixels on a 12-pixel line); an avatar (a pixel disc). |
| `--chu-skeleton-size` | a length in pixels, default `calc(24 * var(--chu-pixel))` | A block's height, a circle's width. |
| `inline-size` | any | Vary text lines (100%, 85%, 60%) so they read as a paragraph. |

## States

| State | Look |
|---|---|
| Waiting | The sweep crosses every 1.6 s. |
| Reduced motion | No sweep: a still dither. |
| Loaded | Remove the skeletons and show the content in the same place. |

## Accessibility

- Skeletons are pictures of nothing: `aria-hidden="true"` on them (or a wrapper).
- Mark the region that is loading `aria-busy="true"` and say in words what is loading (a loader with
  `role="status"`). Put `aria-busy` on a wrapper, never on a `.chu-box` (a card or a button), where it draws the
  busy dots.
- When the content arrives, set `aria-busy="false"` and, if it matters, say so ("12 friends loaded").
- Windows high contrast: a GrayText checkerboard, no sweep.

Skeletons are not interactive: no keys.

## Content

- Match the real layout: the same number of lines, roughly the same widths, the avatar where the avatar goes.

## Do and don't

- **Do** use skeletons for content that takes more than a moment and has a known shape.
- **Don't** show skeletons for more than a few seconds; after that, say what is wrong.
- **Don't** put skeletons inside buttons or form fields.

## API

| Class or attribute | |
|---|---|
| `.chu-skeleton` | The placeholder (a `<span>` or `<div>`). |
| `data-shape` | `block`, `text`, `circle`. |
| `--chu-skeleton-size` | Block height or circle width. |
