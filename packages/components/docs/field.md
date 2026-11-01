---
name: Field
package: "@jaatster/blip-components"
css: field.css
element: pp-field
react: Field
status: beta
equivalents:
  shadcn: Field
  html: '<fieldset>'
---

# Field

A label, a control, and the words around it: help, an error with its pixel "!", a character count. Stacked by default;
inline puts the label in its own column. A `<fieldset>` with the same class groups checkboxes, radios or switches
under a legend. `<pp-field>` wires it all up, so nothing has to be linked by hand.

## Usage

```html
<pp-field class="pp-field">
  <label class="pp-field-label" for="name">Player name</label>
  <span class="pp-box pp-input"><input id="name" name="name" required minlength="3" maxlength="16"></span>
  <p class="pp-field-help">Shown on the leaderboard.</p>
  <p class="pp-field-error"></p>
  <p class="pp-field-count"></p>
</pp-field>

<fieldset class="pp-field" aria-describedby="style-help">
  <legend class="pp-field-label">Play style</legend>
  <label class="pp-check"><span class="pp-box pp-radio"><input type="radio" name="style" value="explore"></span>Explorer</label>
  …
  <p class="pp-field-help" id="style-help">You can change it later.</p>
</fieldset>
```

Without the element, write the links yourself: `aria-describedby` on the control naming the help and error, and
`aria-invalid="true"` while the error shows. With it, write your own errors and `aria-invalid` as you like (a
framework's state is fine): the field links them and leaves them to you.

## Anatomy

1. **Label** (`.pp-field-label`, or a `<legend>`): bold small text. A required control adds a red `*` after it.
2. **Control**: any input, textarea, select, combobox, stepper, slider, file drop, segmented control or rating.
3. **Help** (`.pp-field-help`): muted small text.
4. **Error** (`.pp-field-error`): bold, in the danger tone, after a pixel "!". Hidden while empty.
5. **Count** (`.pp-field-count`): "12/200" at the end of the row; it turns orange at the limit.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-layout="inline"` | | Label in a column beside the control, centred on a default-height control. For settings and short forms on wide screens; stack them again on narrow ones. |

## States

| State | How | Look |
|---|---|---|
| Required | `required` on the control | A red `*` after the label, for sight only: the control says "required" itself. |
| Invalid | the error has text; `aria-invalid="true"` on the control | Error message with its icon; the control's danger outline. |
| At the limit | `data-state="full"` on the count | Bold, warning text. |

## Accessibility

What `<pp-field>` does:

- Adds the help, a showing error and the count to the control's `aria-describedby` (keeping any ids already there),
  and takes each out when it goes. For a group (`role="group"` on the field), they describe the group. Parts your
  framework renders later, or takes away (an error shown only after the server answers), are linked as they come.
- Shows the error when the browser finds the control invalid (on submit, or when a changed value is checked) and
  marks the control (or the `pp-segmented` / `pp-rating`) `aria-invalid="true"`; clears both once the value is
  valid, or the form is reset. The words: write them in the error with `hidden` to use them as the message without
  showing them at load; with none, the browser's own message is used.
- Your own errors are yours. An error that shows with your words (from the server, or your framework's state) stays
  until you change or remove it, and the control is marked invalid while it shows. An `aria-invalid` you write
  stays too: the field only ever takes away the `aria-invalid` it wrote itself.
- Reads out every error as it comes up, once, from a polite live region of its own, without moving focus (an error
  already on the page when it loads is read with the page).
- Counts characters against `maxlength`. The count is part of the control's description (read as "12/200" when
  the field is focused); while typing, the visible count is hidden from screen readers and, after a pause, a polite
  message says how many are left (`count-text`, default "{left} characters left").
- Keeps an `<output for>` in step with its control, and fills a slider's groove (`--pp-slider-value`).

Also: every control needs a visible label. Use a `<fieldset>` and `<legend>` for groups. Put help before you need it,
not only in errors.

## Content

- Labels are short nouns in sentence case: "Player name", not "Enter your player name:".
- Help says what's expected ("8 letters or more"); errors say how to fix it ("Enter an email like
  pal@example.com"), never just "Invalid".

## Do and don't

- **Do** write your own error words in a hidden `.pp-field-error`; the browser's are generic.
- **Do** mark optional fields "(optional)" in the label when most fields are required.
- **Don't** use placeholder text as the label.
- **Don't** show an error before the person has had a go.

## API

`<pp-field>`

| Attribute | Default | |
|---|---|---|
| `count-text` | `{left} characters left` | What screen readers hear after typing pauses. |
| `role="group"` | | Describe the whole group, not its first control. |

| Class | |
|---|---|
| `.pp-field` | The field. Also on `<fieldset>`. |
| `.pp-field-label`, `.pp-field-help`, `.pp-field-error`, `.pp-field-count` | Its parts. |

| Custom property | Default | |
|---|---|---|
| `--pp-field-label-width` | 64 pixels | The label column in the inline layout. |
