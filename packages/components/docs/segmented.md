---
name: Segmented control
package: "@jaatster/blip-components"
css: segmented.css
element: pp-segmented
react: Segmented
status: beta
---

# Segmented control

One choice from two to five, side by side on a sunken rail: a view (List, Grid, Map), a time of day, a number of
players. The chosen segment is candy that sits in; the others stay quiet until you point at them. It is a radio
group, so the arrow keys move and choose.

## Usage

With the element (buttons, a `value`, `pp-change`, and a form value):

```html
<pp-segmented class="pp-box pp-segmented" name="view" value="grid" aria-label="View">
  <button class="pp-box" type="button" value="list">List</button>
  <button class="pp-box" type="button" value="grid" aria-checked="true">Grid</button>
  <button class="pp-box" type="button" value="map">Map</button>
</pp-segmented>
```

With no JavaScript at all (native radios; the browser groups them and steers with the arrow keys):

```html
<fieldset class="pp-box pp-segmented">
  <legend class="pp-sr-only">View</legend>
  <label class="pp-box"><input type="radio" name="view" value="list">List</label>
  <label class="pp-box"><input type="radio" name="view" value="grid" checked>Grid</label>
</fieldset>
```

## Anatomy

1. **Rail**: a calm box, sunken fill, line outline, no drop, the control's height (16, 20 or 24 pixels).
2. **Segments**: boxes two pixels inside the rail, upper-case bold labels like buttons, or one icon.
3. **Chosen segment**: candy (the accent, or its `data-tone`) with bands swapped: the pushed-in look.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-size` | `sm`, `md` (default), `lg` | Matches button heights, so it sits in a row with buttons and fields. |
| `data-width="full"` | | Fills its container; segments share the width equally. |
| `data-tone` (on a segment) | any tone | The chosen segment's candy. |
| `data-icon-only` (on a segment) | | One icon; needs `aria-label`. |

## States

| State | How | Look |
|---|---|---|
| Rest | | Label on the rail. |
| Hover | pointer | A calm raised well: surface fill, line outline. |
| Focus | keyboard | The segment shows its well, with the yellow ring round it. |
| Chosen | `aria-checked="true"` (element) or a checked radio | Candy, bands swapped, ink outline. |
| Disabled | `disabled` on a segment, or on the element | Dithered; skipped by the arrow keys. |

## Accessibility

- `<pp-segmented>` gives itself `role="radiogroup"` and its buttons `role="radio"` with `aria-checked`; only the
  chosen one (or the first) is in the tab order.
- Name the group: `aria-label`, `aria-labelledby`, or a `<label for>` pointing at the element. The element warns in
  development when it has no name.
- Without the element, use a `<fieldset>` with a `<legend>` (it may be visually hidden) around native radios.
- If the segments switch between panels of content, use tabs instead.
- Windows high contrast: the chosen segment is drawn in the system highlight colours.

| Key | Action |
|---|---|
| Tab | Moves into the group, onto the chosen segment; Tab again leaves |
| Right / Down Arrow | Moves to the next segment and chooses it (wraps, skips disabled) |
| Left / Up Arrow | Moves to the previous segment and chooses it |
| Home / End | Chooses the first / last segment |
| Space | Chooses the focused segment (native radios) |

## Content

- One or two words a segment; use the same kind of word in every segment.
- Two to five segments. More choices want a select.

## Do and don't

- **Do** write `aria-checked="true"` on the chosen button too, so it looks right before the script runs.
- **Do** put it in a form: with a `name`, its value is sent like a radio group's.
- **Don't** use it for actions; segments choose, buttons act.

## API

`<pp-segmented>` (form-associated)

| Attribute / property | Type | |
|---|---|---|
| `name` | string | The form field name. |
| `value` | string | The chosen button's `value`. Setting it chooses that button. |
| `disabled` | boolean | Disables every segment (also follows a disabled fieldset). |
| `required` | boolean | Invalid until something is chosen (`required-message` sets the text). |
| `items` (property) | `HTMLButtonElement[]` | The segments. |
| `form`, `validity`, `validationMessage`, `checkValidity()`, `reportValidity()` | | As on native controls. |

| Event | Detail | |
|---|---|---|
| `pp-change` | `{ value }` | A segment was chosen by click or key, after `input` and `change` (as a native control fires them). None of them are sent when the value is set from script. |

| Custom property | Default | |
|---|---|---|
| `--pp-tone`, `--pp-tone-light`, `--pp-tone-shade`, `--pp-tone-on` | accent | The chosen segment's candy (or use `data-tone`). |
