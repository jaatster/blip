---
name: Divider
package: "@jaatster/blip-components"
css: divider.css
element: null
react: Divider
status: stable
equivalents:
  shadcn: Separator
  html: '<hr>'
---

# Divider

A line drawn in whole pixels that separates groups: solid, dashed or dithered, across or upright, with or without a
label in the middle. Quiet by default (line-soft).

## Usage

```html
<hr class="pp-divider">
<hr class="pp-divider" data-variant="dither">
<hr class="pp-divider" aria-orientation="vertical">
<div class="pp-divider">Today</div>
```

## Anatomy

1. **Line**: one pixel high (two for the dither), drawn as a background in whole pixels.
2. **Label** (optional): upper-case caption text between two lines, or at one end.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-variant` | `solid` (default), `dashed` (three pixels on, two off), `dither` (a two-pixel checkerboard, the world's dither) | Solid between groups; dashed for something torn off or optional; dither as a soft break in game screens. |
| `data-strong` | | The line colour (ink by day) instead of line-soft. |
| `data-align` | `center` (default), `start`, `end` | Where a label sits. |
| `aria-orientation="vertical"` | on `<hr>` | Upright, as tall as its row: between groups in a toolbar or cluster. |

## States

None: a divider is not interactive.

## Accessibility

- `<hr>` is a separator for assistive technology; use it between real groups of content.
- A labelled divider is a `<div>`: its text is read as text ("Today"). If the label names a section, use a heading
  instead.
- Purely decorative lines inside a component can be drawn by the component; don't add `<hr>`s for looks.
- Windows high contrast: the line takes the system text colour.

## Content

- Labels of one or two words: "Today", "Or", "Saved games".

## Do and don't

- **Do** prefer space to lines: a stack's gap often separates enough.
- **Don't** stack dividers or put one at the very top or bottom of a panel.

## API

| Custom property | Default | |
|---|---|---|
| `--pp-divider-space` | 6 pixels (4 upright) | The space each side of the line. |
