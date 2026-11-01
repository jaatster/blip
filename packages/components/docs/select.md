---
name: Select
package: "@jaatster/blip-components"
css: select.css
element: null
react: Select
status: beta
equivalents:
  shadcn: Native Select, Select
  html: '<select>'
---

# Select

One value from a list, with the native `<select>` in the input's calm well and a pixel chevron. Where the browser has
the customisable select (`appearance: base-select`), its picker becomes a Blip menu: a cream panel with an ink
outline, stepped corners and a drop; the row with the keyboard or pointer lights up in the focus yellow as a candy box;
the chosen row has a pixel check. Elsewhere the browser's own list opens, in the scheme's colours where it allows.

## Usage

```html
<label class="chu-field-label" for="world">Home world</label>
<span class="chu-box chu-select">
  <select id="world" name="world">
    <option class="chu-box" value="meadow">Meadow</option>
    <option class="chu-box" value="caves" selected>Crystal caves</option>
  </select>
</span>
```

## Anatomy

1. **Well**: the input's well; the whole of it opens the select.
2. **Value**: the chosen option's text.
3. **Chevron**: four rows of pixels (7, 5, 3, 1) in the text colour.
4. **Menu** (customisable select): the picker panel, its rows (`option.chu-box`) and the check.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-size` | `sm`, `md` (default), `lg` | As for the input. |
| `data-tone` | `success`, any tone | A valid field's outline. |
| `class="chu-box"` on each `<option>` | | The highlighted row is a candy box (corners, bands, glints). Without it the row is a flat yellow bar. |

## States

| State | How | Look |
|---|---|---|
| Focus | keyboard | The ring round the well. |
| Open | the picker is showing | The menu pops in a pixel low for a frame; the focused row is yellow candy. |
| Invalid | `aria-invalid="true"` or `:user-invalid` | Danger outline. |
| Disabled | `disabled` | Dithered. A disabled option is muted. |

## Accessibility

- It is the browser's select: keyboard, typeahead, screen readers and mobile pickers are native.
- Label it with a `<label for>`. A first option like "Choose a server" with `value=""` plus `required` makes a
  choice compulsory.
- Use `<optgroup label>` to group long lists. More than about 15 options? Consider a [combobox](combobox.md).
- One value only. For several, use a group of [checkboxes](checkbox.md); `multiple` and `size` aren't styled.

| Key | Action |
|---|---|
| Tab | Moves to the select |
| Space, Enter, Alt + Down Arrow | Opens the list |
| Up / Down Arrow | Moves through the options |
| Letters | Jump to the next option starting with them |
| Enter | Chooses the focused option |
| Escape | Closes without changing |

## Content

- Order options in a way people expect (alphabetical, by size, by date), and say in the label what they choose.

## Do and don't

- **Do** put the most likely choice first, or preselect it.
- **Don't** use a select for two options: a [switch](switch.md), radios or a [segmented control](segmented.md) shows
  both at once.

## API

| Class | |
|---|---|
| `.chu-select` | The well. Markup: `class="chu-box chu-select"`. |
| `option.chu-box` | A candy row in the customisable select's menu. |
