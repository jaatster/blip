---
name: Checkbox
package: "@jaatster/blip-components"
css: checkbox.css
element: null
react: Checkbox
status: beta
equivalents:
  shadcn: Checkbox
  apg: checkbox
  html: '<input type="checkbox">'
---

# Checkbox

A yes or no, or several choices from a list. A real `<input type="checkbox">` inside a candy box: the calm well when
off, candy with an ink pixel check when on, candy with an ink bar when only some of a group are on.

## Usage

```html
<label class="blip-check">
  <span class="blip-box blip-checkbox"><input type="checkbox" name="music" checked></span>
  Music
</label>

<span class="blip-box blip-checkbox"><input type="checkbox" aria-label="Select level 3"></span>
```

## Anatomy

1. **Box**: 11 pixels square (9 small, 13 large), radius 2 (1 small, 3 large). Off: line outline, surface, a sunken inset row. On: candy
   that sits in (shade row on top, light row below), ink outline.
2. **Glyph**: a 7 x 7 pixel check (5 x 5 small), or a bar when indeterminate, in ink.
3. **Input**: the native checkbox, invisible, covering the box and one pixel more (a 26 px target).
4. **Row** (`.blip-check`): a `<label>` with the box and its text.
5. **Help** (optional): a `<p class="blip-check-help" id="…">` right after the row, lined up under the words, linked
   from the input with `aria-describedby` so it describes the option instead of lengthening its name.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-size` (box or row) | `sm`, `md` (default), `lg` | 9, 11 or 13 pixels. |
| `data-tone` (box) | any tone | The candy when checked. Meaning first: success for "done", accent otherwise. |
| `data-layout="split"` (row) | | Label first, box at the far end (settings lists). |

## States

| State | How | Look |
|---|---|---|
| Hover | pointer on the box or its row | The well darkens. |
| Focus | keyboard | The yellow ring round the box. |
| Checked | `checked` | Candy, sits in, ink check. |
| Indeterminate | `input.indeterminate = true` (script only) | Candy, sits in, ink bar. `data-blip-state="indeterminate"` forces the look in docs. |
| Invalid | `aria-invalid="true"`, or `:user-invalid` after a try | Danger outline; pair with an error. |
| Disabled | `disabled` | Dithered; the row's text is muted. |

## Accessibility

- It's a native checkbox: Space toggles it, screen readers announce it, forms send it.
- Wrap it in a `<label class="blip-check">` (the whole row is clickable), or give it `aria-label`.
- A list of checkboxes is a `<fieldset class="blip-field">` with a `<legend>`.
- A "select all" box is indeterminate while some are checked; point it at the others with `aria-controls`.
- Windows high contrast shows the system checkbox.

| Key | Action |
|---|---|
| Tab | Moves to the checkbox |
| Space | Checks or unchecks it |

## Content

- Write labels as positive statements: "Send me patch notes", not "Don't send me patch notes".

## Do and don't

- **Do** use a checkbox for choices that are sent with a form; for settings that apply at once, a
  [switch](switch.md).
- **Don't** use a single checkbox to choose between two named options; use radios.

## API

| Class | |
|---|---|
| `.blip-checkbox` | The box. Markup: `class="blip-box blip-checkbox"` on a `<span>` around the input. |
| `.blip-check`, `.blip-check-help` | The row and an option's help after it (shared with radio and switch). |

| Custom property | Default | |
|---|---|---|
| `--blip-tone`, `--blip-tone-light`, `--blip-tone-shade`, `--blip-tone-on` | accent | The checked candy (or `data-tone`). |
