---
name: Tag
package: "@jaatster/blip-components"
css: tag.css
element: null
react: Tag
status: stable
equivalents:
  shadcn: Badge
---

# Tag

The TV's pill: a short upper-case label in a rounded box. A tag labels something (a rarity, a status, a zone); a
removable tag has a pixel cross; a filter chip is a toggle button that sits in when it's on.

## Usage

```html
<span class="chu-box chu-tag" data-tone="success">Cleared</span>
<span class="chu-box chu-tag" data-tone="orange">Lava zone<button class="chu-tag-remove" type="button" aria-label="Remove Lava zone"></button></span>
<button class="chu-box chu-tag" data-variant="outline" type="button" aria-pressed="true">Swords</button>
```

## Anatomy

1. **Box**: the candy box, 14 pixels high with a radius of 5: the TV's pill.
2. **Label**: Pixelify Sans, bold, upper case, a little tracking.
3. **Icon** (optional, `lg`): a 12 x 12 icon before the label.
4. **Cross** (optional): `.chu-tag-remove`, its own 12-pixel button (24 CSS px) with a pixel ×.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-variant` | `soft` (default), `candy`, `outline`, `ghost` | Soft to label; candy for a tag you act on (a link to a topic); outline for filter chips at rest. |
| `data-tone` | `accent` (default), `info`, `success`, `warning`, `danger`, `neutral`, any candy name | Meaning first: success for done, danger for out, neutral for away. |
| `data-size` | `sm` (12 pixels), `md` (14, default), `lg` (16) | Small tags in tables and lists; large ones can hold an icon. Put crosses on `md` and `lg`. |

## States

| State | How | Look |
|---|---|---|
| On (filter chip) | `aria-pressed="true"` on a `<button>` | Sits in; outline chips fill with the tone's light colour. |
| Hover, focus, pressed | on a `<button>` or `<a>` tag | From the box: lifts, the yellow ring, sits in. |
| Disabled | `disabled` | Dithered. |
| Cross | hover, focus | Its × lifts a pixel; focus is the square yellow ring round the cross. |

## Accessibility

- A plain tag is text: `<span>`. A filter chip is `<button aria-pressed>`. A tag that goes somewhere is `<a>`.
- Name each cross for what it removes: `aria-label="Remove Lava zone"`. After removing, move focus to the next tag or
  back to the input that added it.
- Group filter chips: `role="group"` with a label ("Filter by weapon").
- Status is in the words, not only the colour.

## Content

- A label keeps one line while it fits; when it does not, it wraps between words and the tag grows taller (a word
  longer than the room breaks as a last resort). A label is never cut short.
- One or two words. Numbers are fine ("2 h left", "Level 42").
- Write tags in sentence case; CSS sets upper case.

## Do and don't

- **Do** keep tones meaningful and consistent across the product.
- **Don't** make yellow tags: yellow means focus (coins and stars aside).
- **Don't** use a tag as a button for an action like "Delete": use a button.

## API

| Class | |
|---|---|
| `.chu-tag` | The pill. Use with `.chu-box`. |
| `.chu-tag-remove` | The cross button inside a tag. |

| Custom property | Default | |
|---|---|---|
| `--chu-r` with `--chu-shape`, `--chu-shape-inner` | 5 (sm 4, lg 6) | Corner radius. |
| `--chu-tone`, `--chu-tone-light`, `--chu-tone-shade`, `--chu-tone-on` | accent | A custom colour. |
