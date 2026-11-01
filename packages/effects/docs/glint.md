---
name: Glint
package: "@jaatster/blip-effects"
css: text.css
element: null
react: null
status: beta
---

# Glint

The TV's shine: a band of light sweeps down and right across a candy box in five frames, 80 ms apart, always inside
the box's outline, once when it appears (as a selected tile's does), then it rests. CSS only.

## Usage

```html
<button class="chu-box chu-button">Continue<span class="chu-glint" aria-hidden="true"></span></button>
<div class="chu-box chu-tile" data-tone="red">…<span class="chu-glint" aria-hidden="true"></span></div>
```

Put one `.chu-glint` span inside any `.chu-box`. It reads the box's shape, so stepped corners of any radius stay clean.

## Anatomy

A band of pixels where x + y runs from a point to three past it: the outer two in the edge colour (light yellow, as
on the TV), the middle two white. Its point moves from the top-left corner to the bottom-right in five frames
(2, 14, 26, 38 and 50 pixels on the TV's 28-pixel block), clipped to the fill inside the outline.

## Variants

| | |
|---|---|
| `data-frame="0"` to `"4"` | Holds one frame (docs, tests, screenshots). |
| `--chu-glint-count` | How many sweeps, 4.5 seconds apart (1). Two are over in under five seconds; set `infinite` only where the person can pause it, as for `--chu-blink-count`. |
| `--chu-glint-delay` | Staggers several glints on one screen. |
| `--chu-glint-color`, `--chu-glint-edge` | The band's colours (white, light yellow). |

## States

| State | Look |
|---|---|
| Reduced motion | No glint. |
| Hidden tab | Nothing runs. |
| Forced colours, print | No glint. |

## Accessibility

Decoration only: keep `aria-hidden="true"` on the span. A sweep is short, and nothing moves for more than five
seconds unless you ask for it (WCAG 2.2.2).

## Do and don't

- **Do** glint the one thing you want noticed: the selected tile, the main call to action.
- **Don't** glint a whole grid at once.

## API

`.chu-glint` (a child of a `.chu-box`), `data-frame`, `--chu-glint-count`, `--chu-glint-delay`, `--chu-glint-color`,
`--chu-glint-edge`.
