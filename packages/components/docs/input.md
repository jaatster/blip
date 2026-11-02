---
name: Input
package: "@jaatster/blip-components"
css: input.css
element: null
react: Input
status: beta
equivalents:
  shadcn: Input, Input Group
  html: '<input>'
---

# Input

A text field. Inputs can't have pseudo-elements, so the candy box is a wrapper and the native `<input>` sits inside it,
transparent. The look is the box's calm one: a line outline, the surface, one sunken row along the top (the inset), no
drop. Every text type works: text, email, password, number, url, tel, date, time, search.

## Usage

```html
<label class="blip-field-label" for="email">Email</label>
<span class="blip-box blip-input"><input id="email" name="email" type="email" autocomplete="email"></span>

<span class="blip-box blip-input">
  <span class="blip-input-affix" aria-hidden="true">https://</span>
  <input id="site" type="url" placeholder="pixel.example">
</span>
```

Wrap it in a [field](field.md) for the label, help and error.

## Anatomy

1. **Well**: the box, calm tier: line outline with stepped corners, surface fill, a one-pixel sunken inset at the top.
2. **Input**: the native control, transparent, filling the well.
3. **Affixes** (optional): a `.blip-icon` or `.blip-input-affix` text before or after the value, muted.
4. **Buttons** (optional): a `<button class="blip-box" data-variant="ghost">` inside the well ("show password") sits two
   pixels in from the edge, square.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-size` | `sm` (16 pixels), `md` (20, default), `lg` (24) | The same heights as buttons, so a field and its button line up. |
| `data-tone` | `success`, any tone | Outline and inset in that tone: a checked, valid value ("That name is free"). |

## States

| State | How | Look |
|---|---|---|
| Focus | the input has focus | The yellow ring with an ink edge round the whole well. |
| Invalid | `aria-invalid="true"`, or `:user-invalid` after the person has tried | Danger outline and a pink inset; pair it with an error message. |
| Read-only | `readonly` | Flat: no outline, no bands, a sunken fill. Still focusable and selectable. |
| Disabled | `disabled` | Dithered, soft outline, muted text. |
| Placeholder | `placeholder` | Muted text (it passes AA; it's still not a label). |

`data-blip-state="focus"` on the well forces the ring in docs and tests.

## Accessibility

- Every input needs a label: a `<label for>` (or `aria-label` when the context is visual, like a search icon).
- Use the right `type`, `autocomplete` and `inputmode`, so phones show the right keyboard and browsers can fill it in.
- Text inside is 16 px at every size but `lg`, so phones don't zoom in.
- The date and time pickers keep the browser's own keyboard support; their buttons are pixel glyphs.
- Number inputs hide the browser's tiny spinners; use the [number stepper](number.md) for buttons.
- Errors use colour, an icon and words. Windows high contrast: a system border, a dashed one when invalid, and a
  system focus outline.

| Key | Action |
|---|---|
| Tab | Moves to the input |
| Typing, arrows, Home, End | Edit the text (native) |
| Up / Down Arrow | Step a number, date or time (native) |

## Content

- Placeholders show an example ("pixel.example"), never the label or instructions.
- Prefer one field per thing asked; don't split phone numbers or dates across fields.

## Do and don't

- **Do** size fields to their content where you can (a postcode field needn't fill the row).
- **Do** use `readonly` for values people need to copy, `disabled` for ones that don't apply.
- **Don't** put candy on inputs: candy is for checked things and the main action.

## API

| Class | |
|---|---|
| `.blip-input` | The well. Markup: `class="blip-box blip-input"` on a `<span>` or `<div>`. |
| `.blip-input-affix` | Text before or after the value. |

| Custom property | Default | |
|---|---|---|
| `--blip-r` with `--blip-shape`, `--blip-shape-inner` | 4 (sm 3, lg 5) | Corner radius, as for buttons. |
| `--blip-box-outline`, `--blip-box-top`, `--blip-box-fill` | line, sunken, surface | The well's colours. |
