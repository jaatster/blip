---
name: Radio group
package: "@jaatster/blip-components"
css: radio.css
element: null
react: RadioGroup
status: beta
---

# Radio group

One choice from a list, all shown at once. Real `<input type="radio">`s inside round candy boxes: the calm well when
off, candy with an ink pixel dot when on. The box's own stepped corners make a pixel circle at these sizes.

## Usage

```html
<fieldset class="pp-field">
  <legend class="pp-field-label">Difficulty</legend>
  <label class="pp-check"><span class="pp-box pp-radio"><input type="radio" name="level" value="story"></span>Story</label>
  <label class="pp-check"><span class="pp-box pp-radio"><input type="radio" name="level" value="normal" checked></span>Normal</label>
  <label class="pp-check"><span class="pp-box pp-radio"><input type="radio" name="level" value="hard"></span>Hard</label>
</fieldset>
```

## Anatomy

1. **Box**: 11 pixels (9 small, 13 large) with radius 4 (3, 5): a stepped circle. Off: line outline, surface, an inset
   row. On: candy that sits in, ink outline.
2. **Dot**: a 5 x 5 pixel dot (3 x 3 small, 7 x 7 large) in ink.
3. **Input**: the native radio, invisible, covering the box and a pixel more.
4. **Row** and **group**: `.pp-check` labels inside a `<fieldset class="pp-field">` with a `<legend>`.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-size` (box or row) | `sm`, `md` (default), `lg` | 9, 11 or 13 pixels. |
| `data-tone` (box) | any tone | The candy when checked (team colours, for example). |

## States

| State | How | Look |
|---|---|---|
| Hover | pointer on the box or its row | The well darkens. |
| Focus | keyboard | The yellow ring round the box. |
| Checked | `checked` | Candy, sits in, ink dot. |
| Invalid | `aria-invalid="true"` on the radios, or `:user-invalid` | Danger outline; pair with an error for the group. |
| Disabled | `disabled` | Dithered; skipped by the arrow keys. |

## Accessibility

- Native radios with the same `name` form a group: the browser gives one tab stop and the arrow keys.
- Name the group with `<fieldset>` and `<legend>`; describe it with `aria-describedby` on the fieldset.
- A required group: put `required` on the radios. An error belongs to the group, below its options.
- Windows high contrast shows the system radio.

| Key | Action |
|---|---|
| Tab | Moves into the group (onto the checked radio, or the first), then out |
| Down / Right Arrow | Checks the next radio (wraps) |
| Up / Left Arrow | Checks the previous radio |
| Space | Checks the focused radio |

## Content

- Order options logically (easy to hard) and keep their labels parallel. To explain an option, put a
  `<p class="pp-check-help" id="…">` after its row and point the radio's `aria-describedby` at it.

## Do and don't

- **Do** preselect a sensible default when there is one.
- **Don't** use radios for more than about seven options; a [select](select.md) is easier to scan.
- **Don't** use radios for two to five choices in a toolbar: a [segmented control](segmented.md) fits better.

## API

| Class | |
|---|---|
| `.pp-radio` | The box. Markup: `class="pp-box pp-radio"` on a `<span>` around the input. |

| Custom property | Default | |
|---|---|---|
| `--pp-tone`, `--pp-tone-light`, `--pp-tone-shade`, `--pp-tone-on` | accent | The checked candy (or `data-tone`). |
