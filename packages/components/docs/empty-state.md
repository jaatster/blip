---
name: Empty state
package: "@jaatster/blip-components"
css: empty-state.css
element: null
react: EmptyState
status: stable
equivalents:
  shadcn: Empty
---

# Empty state

What a list, a page or a panel shows when it has nothing in it yet: a small pixel picture, a title in Pixel Bop, a
line saying why it is empty or what goes here, and the action that fills it. It turns a dead end into a first step.

## Usage

```html
<div class="pp-empty-state">
  <svg class="pp-empty-state-art" viewBox="0 0 32 24" aria-hidden="true">…</svg>
  <h2 class="pp-empty-state-title">No saves yet</h2>
  <p class="pp-empty-state-text">Start a game and it is saved here after every level. You can keep three.</p>
  <div class="pp-empty-state-actions">
    <button class="pp-box pp-button">New game</button>
    <button class="pp-box pp-button" data-variant="ghost">Load from file</button>
  </div>
</div>
```

The example's picture (an open, empty cardboard box with dust above it) is in
`packages/components/examples/empty-state.html`: copy it, or draw your own.

## Anatomy

1. **Picture** (`.pp-empty-state-art`): an inline SVG drawn on a grid 32 units wide, shown at two pixels a unit
   (one when small), so every unit is whole pixels. Colour it with tokens (`style="fill: var(--pp-outline)"`,
   candies, scheme roles), with an ink outline like everything you can see.
2. **Title** (`.pp-empty-state-title`): Pixel Bop at scale 1, in capitals.
3. **Text** (`.pp-empty-state-text`): one or two sentences, muted, at most 44 characters a line.
4. **Actions** (`.pp-empty-state-actions`): the main way to fill it (candy) and perhaps one more (ghost).

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-size` | `sm`, `md` (default), `lg` | The picture at one, two or three pixels a unit, with the space round it to match: small in panels, cards and sidebars, large on a screen of its own. |

## States

Empty states are static. Replace the whole thing with the content when there is some.

## Accessibility

- The picture says nothing a reader needs: `aria-hidden="true"`.
- The title is a real heading at the right level for its place in the page (`<h2>` in a page section, `<h3>` in a
  card).
- The actions are ordinary buttons or links, named for what they do.

| Key | Does |
|---|---|
| Tab | Moves to the actions. |

## Content

- Title: the plain fact ("No saves yet", "No friends online"), not "Oops!" or "Nothing here :(".
- Text: why it is empty or what will appear, and how to change that.
- First-use empty states invite ("Start a game"); empty search results suggest ("Try fewer words").

## Do and don't

- **Do** offer the action that fills the space.
- **Don't** use an empty state for an error: say what went wrong in an [alert](alert.md).
- **Don't** draw a picture bigger than the content it stands in for.

## API

| Class or attribute | |
|---|---|
| `.pp-empty-state` | The block, centred in its container. |
| `.pp-empty-state-art`, `.pp-empty-state-title`, `.pp-empty-state-text`, `.pp-empty-state-actions` | The parts. |
| `data-size` | `sm`, `md` or `lg`. |
