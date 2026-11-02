---
name: Stack
package: "@jaatster/blip-components"
css: stack.css
element: null
react: Stack
status: stable
---

# Stack

Vertical rhythm: children one under another, a token gap apart. A layout primitive: no colour, no box, no
breakpoints.

## Usage

```html
<div class="blip-stack">…</div>
<div class="blip-stack" data-gap="4" data-align="start">…</div>
<div class="blip-stack"><header>…</header><main>…</main><footer data-push>…</footer></div>
```

## Anatomy

A flex column. The gap is counted in pixels from the spacing tokens, so it scales with the pixel (a section with
`data-blip-pixel="3"` keeps its rhythm).

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-gap` | `0`, `1`, `2`, `3`, `4`, `6`, `8` (default), `12`, `16`, `24`, `32` | Pixels between children (`--blip-space-N`). Tight (2 to 4) inside a component, 8 between parts of a card, 16 and up between sections. |
| `data-align` | `stretch` (default), `start`, `center`, `end` | Where children sit across the stack. `start` keeps tags and buttons at their own width. |
| `data-push` | on a child | Pushes it, and everything after it, to the far end: a footer at the bottom of a tall column. |

## Accessibility

Layout only: reading order is source order, so write the markup in the order it should be read.

## Do and don't

- **Do** nest stacks: a loose one for sections, a tight one inside each.
- **Don't** add margins to children to fix spacing; change the gap.

## API

| Custom property | Default | |
|---|---|---|
| `--blip-stack-gap` | `--blip-space-8` | The gap, for values the attribute doesn't cover. |
