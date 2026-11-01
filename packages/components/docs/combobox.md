---
name: Combobox
package: "@jaatster/blip-components"
css: combobox.css
element: pp-combobox
react: Combobox
status: beta
equivalents:
  shadcn: Combobox
  apg: combobox
  html: '<datalist>'
---

# Combobox

A text field with a list of suggestions: the WAI-ARIA editable combobox with list and inline autocomplete. Typing
filters the list and completes the first suggestion that starts with what was typed (the completion is selected, so
typing on replaces it). The list is a Blip menu: a cream panel, and the active suggestion in the focus yellow,
as on the TV. The suggestions come from a `<datalist>`, so without JavaScript the browser's own list still works.

## Usage

```html
<label class="pp-field-label" for="world">Start in</label>
<pp-combobox class="pp-combobox" value="caves">
  <span class="pp-box pp-input"><input id="world" name="world" list="worlds"></span>
  <datalist id="worlds">
    <option value="meadow">Meadow</option>
    <option value="caves">Crystal caves</option>
  </datalist>
</pp-combobox>
```

The form value is the chosen suggestion's `value` ("caves"), or the typed text when it matches none. The element
moves the input's `name` to itself, so the value is sent once.

## Anatomy

1. **Field**: the input's well, with the text input.
2. **Toggle** (`.pp-combobox-toggle`): a ghost box with a pixel chevron; it flips while the list is open.
3. **Popup** (`.pp-combobox-popup`): a panel box under the field. Where the browser has anchor positioning (with
   `anchor-scope`) it opens in the top layer (a `popover`), so scrolling boxes and dialogs never clip it, and flips
   above the field when there is no room below. Elsewhere it is placed absolutely under the field.
4. **List** (`.pp-combobox-list`, a `listbox`) and **options** (`.pp-combobox-option`): ghost boxes; the active one
   is yellow candy with ink text.
5. **No match** (`.pp-combobox-empty`): a muted line when the filter leaves nothing.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-size` (on `.pp-input`) | `sm`, `md` (default), `lg` | As for the input. |
| `open` | | Shows the list. The element sets and clears it; set it yourself for docs and tests. |
| `aria-autocomplete="list"` on the input | | Filters without completing the text, for a value your framework controls (React's `value`, Vue's `v-model`). Left out, the element writes `both`. |

## States

| State | How | Look |
|---|---|---|
| Closed | | The field, chevron down. |
| Open | typing, Down Arrow, the toggle | The panel pops in a pixel low for a frame; chevron up. |
| Active option | arrows, pointer, the completion | Yellow candy, ink text. |
| Focus, invalid, disabled | from the input | As for the input. |
| Read-only | `readonly` on the input | The list can't change the value; keys and clicks are ignored. |

## Accessibility

The input gets `role="combobox"`, `aria-autocomplete="both"`, `aria-expanded` and `aria-controls`; the active option
is shown with `aria-activedescendant` and `aria-selected`, so focus stays in the field the whole time. The toggle is
out of the tab order and named "Show suggestions" (`toggle-label`). Pressing an option or the toggle never takes focus
from the field. A click or tap outside, or focus moving elsewhere, closes the list.

| Key | Action |
|---|---|
| Typing | Filters the list, opens it, completes the first match (selected) |
| Down Arrow | Opens the list on the current value; then the next option (wraps) |
| Up Arrow | Opens the list; then the previous option (wraps) |
| Alt + Down Arrow | Opens the list without moving |
| Enter | Takes the active option and closes; with none active, closes (and submits as usual) |
| Escape | Closes the list; when closed, clears the field |
| Tab | Keeps the text (with any completion) and moves on |
| Left / Right Arrow, Home, End | Move in the text; the list stays open with no active option |

## Content

- Suggestion labels are what people type: "Crystal caves", not "CAVES_01". Put machine values in `value`.
- Set `empty-text` to something helpful: "No world by that name".

## Do and don't

- **Do** use it when the list is long (more than about 15) or free text is allowed.
- **Don't** use it when people must choose from a short fixed list: a [select](select.md) is simpler.

## API

`<pp-combobox>` (form-associated)

| Attribute / property | Type | |
|---|---|---|
| `name` | string | The form field name (taken from the input when missing). |
| `value` | string | The suggestion's value, or the text. Setting it shows that suggestion's label. |
| `open` | boolean | The list is showing. |
| `empty-text` | string | Shown when nothing matches ("No matches"). |
| `toggle-label` | string | The toggle's name ("Show suggestions"). |
| `form` (read only) | `HTMLFormElement` or null | The form it belongs to, as on native controls. |

`required` (and `pattern`, `minlength`…) on the input work as usual: the browser checks them, and the element's
`checkValidity()` and `reportValidity()` ask the input.

| Event | Detail | |
|---|---|---|
| `pp-change` | `{ value }` | Once per new value: a suggestion taken, the field cleared, or typed text committed. |
| `pp-open`, `pp-close` | | The list opened or closed. |

Taking a suggestion (or clearing with Escape) also fires `input` and `change` on the field, as typing and leaving it
would; typed text fires the browser's own `change` when the field loses focus. The completion comes a moment after
the keystroke, so a framework's `input` listener hears what was typed. The datalist is read again whenever its
options change (a list your app fetches as the person types), and an input rendered after the element is wired when
it arrives.

| Part | |
|---|---|
| `.pp-combobox-toggle`, `.pp-combobox-popup`, `.pp-combobox-list`, `.pp-combobox-option`, `.pp-combobox-empty` | Added by the element. |
