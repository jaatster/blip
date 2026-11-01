---
name: Textarea
package: "@blip/components"
css: textarea.css
element: null
react: Textarea
status: beta
equivalents:
  shadcn: Textarea
  html: '<textarea>'
---

# Textarea

Several lines of text, in the same calm well as the [input](input.md). It can grow with what's written
(`data-autogrow`, where the browser supports `field-sizing`), or the person can drag it taller by its pixel grip.

## Usage

```html
<blip-field class="blip-field">
  <label class="blip-field-label" for="bio">About you</label>
  <span class="blip-box blip-textarea"><textarea id="bio" name="bio" rows="4" maxlength="200"></textarea></span>
  <p class="blip-field-count"></p>
</blip-field>

<span class="blip-box blip-textarea" data-autogrow><textarea id="note" rows="2"></textarea></span>
```

## Anatomy

1. **Well**: the input's well, padded for lines of text.
2. **Textarea**: the native control, transparent.
3. **Grip**: six pixels stepping down into the bottom corner (Chromium and Safari draw it; Firefox shows its own).

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-autogrow` | | Grows with the text from its `rows` (two lines where the browser can't read them in CSS) up to 12 lines, then scrolls; no grip. A fixed height where `field-sizing` isn't supported. |
| `data-size` | `sm`, `md` (default), `lg` | Text size and corner radius, as for the input. |
| `data-tone` | `success`, any tone | A valid field's outline. |

## States

As for the [input](input.md): focus is the ring round the well; `aria-invalid` or `:user-invalid` the danger outline;
`readonly` flat; `disabled` dithered. Read-only and disabled textareas can't be resized.

## Accessibility

- Label it like any field. For long answers, say in the help what's wanted.
- Pair `maxlength` with a [field](field.md) count: people see "120/200" and screen readers hear what's left when they
  pause.
- Don't trap Tab: in a textarea Tab moves focus on, as normal.

| Key | Action |
|---|---|
| Tab | Moves to the textarea, then on |
| Typing, Enter | Writes text and new lines (native) |

## Content

- Size it for the answer you expect: `rows="2"` for a note, `rows="6"` for a bug report.

## Do and don't

- **Do** use a textarea when the answer may run to more than one line.
- **Don't** hide the grip by setting `resize: none` unless the textarea grows by itself.

## API

| Class / attribute | |
|---|---|
| `.blip-textarea` | The well. Markup: `class="blip-box blip-textarea"`. |
| `data-autogrow` | Grow with the content. |
