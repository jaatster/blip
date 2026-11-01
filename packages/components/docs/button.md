---
name: Button
package: "@jaatster/blip-components"
css: button.css
element: null
react: Button
status: stable
---

# Button

A candy box you press. Buttons start actions: save, play, buy, delete. For going somewhere, use a link (an `<a>` can
wear the same classes when it must look like a button).

## Usage

```html
<button class="pp-box pp-button">Save game</button>
<button class="pp-box pp-button" data-variant="soft" data-tone="danger" data-size="sm">Delete save</button>
<button class="pp-box pp-button" data-icon-only aria-label="Add level"><svg class="pp-icon">…</svg></button>
```

## Anatomy

The candy box, from the outside in, then what it holds:

1. **Outline**: one ink pixel round the box, with stepped corners (radius 4 at the default size).
2. **Light band**: the top four pixels of the fill, in the tone's light colour.
3. **Base**: the tone itself, behind the label.
4. **Shade band**: the bottom four pixels of the fill, in the tone's shade.
5. **Glints**: three white pixels at the top left, one at the top right.
6. **Drop**: the outline's shape again, one pixel down and to the right.
7. **Label**: Pixelify Sans, bold, upper case, a little tracking.
8. **Icon** (optional): a 12 x 12 pixel icon before or after the label.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-variant` | `candy` (default), `soft`, `outline`, `ghost` | Loud to quiet. One candy button per view is the primary action; use soft for secondary, outline and ghost in dense UI (toolbars, tables, forms). |
| `data-tone` | `accent` (default), `info`, `success`, `warning`, `danger`, `neutral`, any candy name | Meaning first: `danger` for destructive actions. Candy names are for games and decoration. |
| `data-size` | `sm` (16 px high), `md` (20, default), `lg` (24) | Pixel heights; 32, 40 and 48 CSS px at the default pixel. |
| `data-icon-only` | | Square, one icon. Needs `aria-label`. |
| `data-width="full"` | | Fills its container (mobile, dialogs). |

## States

| State | How | Look |
|---|---|---|
| Hover | pointer | Lifts one pixel; the drop grows to keep the shadow in place. Outline and ghost fill with the sunken surface. |
| Focus | keyboard | Yellow ring one pixel out, ink one pixel beyond, following the stepped corners. |
| Pressed | `:active` | Sits in its drop. |
| On | `aria-pressed="true"` | Sits in, bands swap (shade on top, light below): the pushed-in look. |
| Disabled | `disabled` or `aria-disabled="true"` | Dithered with a light colour (`--pp-disabled-dither`). No lift, no drop. |
| Busy | `aria-busy="true"` | The label hides, keeping its width; three dots step in, one, two, three. |

## Accessibility

- Use a real `<button>` (type="button" outside forms). Enter and Space press it.
- Icon-only buttons need `aria-label` naming the action ("Add level"), not the icon ("Plus").
- Prefer `aria-disabled="true"` over `disabled` when the button should stay focusable and explain why it is off.
- Busy buttons keep focus; announce the result elsewhere (a toast or live region).
- Labels on candy are ink (white on slate): every tone passes WCAG AA, checked when the tokens build.
- Windows high contrast: a system border, system colours, a system focus outline.

## Content

- Name the action: "Save game", "Delete save", not "OK" or "Yes".
- Two or three words. Upper case is applied by CSS; write labels in sentence case.

## Do and don't

- **Do** keep one candy button per view for the main action.
- **Do** use `danger` only for destructive actions, and confirm them.
- **Don't** put a candy button on a candy background: candy stands on pastel.
- **Don't** make buttons yellow: yellow means focus.

## API

| Custom property | Default | |
|---|---|---|
| `--pp-r` with `--pp-shape`, `--pp-shape-inner` | 4 (sm 3, lg 5) | Corner radius in pixels; use `.pp-r-N` to set all three. |
| `--pp-band-top`, `--pp-band-bottom` | 4, 4 | Band heights in pixels. |
| `--pp-drop-size` | 1 | Drop in pixels. |
| `--pp-tone`, `--pp-tone-light`, `--pp-tone-shade`, `--pp-tone-on` | accent | A custom tone. |
