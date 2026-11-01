---
name: Wheel picker
package: "@jaatster/blip-components"
css: wheel.css
element: chu-wheel
react: Wheel
status: beta
equivalents:
  apg: spinbutton
---

# Wheel picker

One or more wheels of options with a candy band across the middle, as on a phone's clock: an alarm time, a birthday,
a shirt size. The row on the band is the value; the rows above and below fade out through the dither. Drag a wheel
with a finger or the mouse, turn it with the mouse wheel, or Tab to it and use the arrow keys. It settles onto a row in
steps, and it goes with a form like an input.

`<chu-wheel>` builds the wheels for a time or a date in the page's language, or one wheel per `<select>` inside it.

## Usage

```html
<label class="chu-field-label" for="alarm">Alarm</label>
<chu-wheel class="chu-box chu-wheel" id="alarm" name="alarm" data-type="time" value="07:30"></chu-wheel>

<label class="chu-field-label" for="born">Birthday</label>
<chu-wheel class="chu-box chu-wheel" id="born" name="born" data-type="date" min="1900" max="2026" value="1990-05-17"></chu-wheel>

<label class="chu-field-label" for="size">Shirt size</label>
<chu-wheel class="chu-box chu-wheel" id="size" name="size">
  <select aria-label="Size">
    <option value="s">Small</option>
    <option value="m" selected>Medium</option>
    <option value="l">Large</option>
  </select>
</chu-wheel>
```

### Your own wheels

Write a `<select>` for each wheel, with an `aria-label` that names it and an `<option>` for each row: its `value`
is what the form gets, its text is what the row says, and `selected` marks where it starts (unless the wheel has a
`value`). Without JavaScript the selects show as they are, so give them a `name` too if the form must work without
it. Once `<chu-wheel>` runs it hides and disables them, so only the wheel's own value is sent; the same goes for an
`<input type="time">` or `<input type="date">` left inside a time or date wheel as a fallback. The wheels' values are
joined with spaces ("2 mint"), so keep spaces out of the values of a wheel that has neighbours.

## Anatomy

1. **Well**: the calm field box (a line outline, the surface, a sunken row along the top).
2. **Wheel** (`.chu-wheel-column`): five rows high, one per part of the value.
3. **Band** (`.chu-wheel-band`): a candy box behind the middle row. It is the wheel's spin button, so focus rings it.
4. **Rows** (`.chu-wheel-option`): the row on the band in bold, in the candy's label colour; the rows next to it show
   three pixels in four, the rows beyond half.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-type` | `time`, `date`, none (default) | A time: hours, minutes and AM/PM where the language uses it, in its order. A date: day, month and year in the language's order, months by name. None: one wheel per `<select>`. |
| `data-size` | `sm`, `md` (default), `lg` | Rows 12, 16 or 20 pixels high (24, 32 or 40 CSS px). Use `lg` where fingers do the work. |
| `data-width="full"` | | Fills its container; the wheels share the width. |
| `data-tone` | `accent` (default), `info`, `success`, `warning`, `danger`, `neutral`, any candy name | The band's candy. |
| `hours` | `12`, `24` | A time's clock. The language decides by default (`en-US` 12, `de` 24). |
| `minute-step` | number | Minutes between a time's rows: `5` for every five minutes. |
| `min`, `max` | years | The first and last years on a date's year wheel (a hundred years ago to twenty years ahead). |

The language is the nearest `lang` attribute's (the page's, or one round the wheel), else the browser's.

## States

| State | How | Look |
|---|---|---|
| Rest | | The row on the band is whole and bold; the rest fade out through the dither. |
| Moving | drag, flick, mouse wheel, keys | The rows move a whole pixel at a time under the finger. Let go and they settle on the nearest row in up to four steps of a quarter row; a flick carries on for a few rows first. A tap on a row brings it to the band. With reduced motion they land at once. |
| Focus | keyboard | The yellow ring round that wheel's piece of the band. |
| Disabled | `disabled`, or a disabled fieldset | The well and the band are dithered, the rows muted. Nothing moves. |

## Accessibility

- The wheel picker is a `group`; name it with a `<label for>`, `aria-label` or `aria-labelledby`. Each wheel is a
  `spinbutton` named in the page's language ("hour", "minute", "AM/PM", "day", "month", "year", from
  `Intl.DisplayNames`), or by its select's `aria-label`.
- Each spin button has `aria-valuetext` (the row's words: "May", "7", "PM"), `aria-valuenow`, `aria-valuemin` and
  `aria-valuemax` (the numbers for a time or a date; row numbers, from 1, for your own wheels).
- Every wheel is a tab stop. The rows themselves are hidden from assistive technology: the spin button says it all.
- A finger on a wheel turns the wheel, not the page (`touch-action: none`); scroll the page from beside it.
- The mouse wheel turns the wheel under the pointer a row per notch, and the page doesn't scroll while it does.
- A short month hides the days it doesn't have: 31 May becomes 30 June.
- Windows high contrast: the band is the system highlight.

| Key | Action |
|---|---|
| Tab | Moves from wheel to wheel |
| Up Arrow | The next row (one more) |
| Down Arrow | The row before (one fewer) |
| Page Up / Page Down | Five rows on / back |
| Home / End | The first / last row |

## Content

- Say what the value is for in the label ("Alarm", "Birthday"), not how to use the wheels.
- Keep custom rows to a word or two: a wheel is as wide as its longest row.
- For a few choices on a big screen, segmented buttons or radios show them all at once.

## Do and don't

- **Do** use it on phones for times, dates and short lists people scroll through.
- **Do** set `min` and `max` on a birthday so the years make sense.
- **Don't** use it for numbers people know exactly and would rather type (a price, a quantity): use an input.
- **Don't** put one on a scrolling page edge to edge: leave room beside it to scroll the page.

## API

`<chu-wheel>` (form-associated)

| Attribute / property | Type | |
|---|---|---|
| `name` | string | The form field name. |
| `value` | string | A time `"HH:MM"` (24-hour), a date `"YYYY-MM-DD"`, or your wheels' values joined by spaces. Without one: now, today, or each select's selected option. A form reset goes back to the first value. |
| `data-type` | `time`, `date` | Builds the wheels; set it before the element connects. |
| `data-size` | `sm`, `md`, `lg` | Row height. |
| `hours` | `12`, `24` | A time's clock. |
| `minute-step` | number | Minutes between a time's rows. |
| `min`, `max` | number | A date's first and last years. |
| `disabled` | boolean | Switched off (also follows a disabled fieldset). `"false"` is off. |
| `form` | | As on native controls (read-only). |

| Event | Detail | |
|---|---|---|
| `input` | | The value on the band changed (while it moves, too). |
| `change` | | The wheel settled on a new value. |
| `chu-change` | `{ value }` | After `change`. |

A select (or option) rendered after the element upgrades, or swapped by a framework, rebuilds the wheels.

| Part | |
|---|---|
| `.chu-wheel-column` | One wheel; `data-key` names its part (`hour`, `minute`, `dayPeriod`, `day`, `month`, `year`, or empty for one of your own). Months and your own wheels give way when the well is too narrow, and their rows end in an ellipsis; numbers never do. |
| `.chu-wheel-band` | Its piece of the band: the spin button. |
| `.chu-wheel-list`, `.chu-wheel-option` | Its rows; `[data-current]` is the one on the band. |
