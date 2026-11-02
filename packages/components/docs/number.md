---
name: Number stepper
package: "@jaatster/blip-components"
css: number.css
element: blip-number
react: NumberStepper
status: beta
equivalents:
  apg: spinbutton
  html: '<input type="number">'
---

# Number stepper

A number field with a pixel minus and plus at its ends: lives, potions to buy, team size. The input inside stays the
real control (the spin button: arrow keys, typing, the form value); `<blip-number>` adds the buttons, which repeat in
steps while held. Without JavaScript it is a plain number field.

## Usage

```html
<label class="blip-field-label" for="lives">Lives</label>
<blip-number class="blip-number">
  <span class="blip-box blip-input"><input id="lives" name="lives" type="number" min="1" max="9" value="3"></span>
</blip-number>
```

## Anatomy

1. **Well**: the input's well.
2. **Input**: the native number input, centred, tabular digits, as wide as its value.
3. **Minus, plus**: ghost boxes two pixels inside the well, with 8 x 8 pixel glyphs.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-size` (on `.blip-input`) | `sm`, `md` (default), `lg` | As for the input; the buttons follow. |
| `min`, `max`, `step` (on the input) | numbers | The range and the step; the buttons respect them. |

## States

| State | How | Look |
|---|---|---|
| Hover, pressed (a button) | pointer | The ghost box's sunken well; it sits in while pressed. |
| Held | pointer down | One step at once, another after a beat (400 ms), then every 100 ms, then every 40 ms after ten. |
| At the end of the range | value = `min` or `max` | That button is dithered. |
| Focus, invalid, read-only, disabled | from the input | As for the input; read-only and disabled dither both buttons. |

## Accessibility

- The input is the spin button and carries the label; give it a `<label for>`.
- The buttons are out of the tab order (`tabindex="-1"`): keyboard people use the arrow keys, which are faster. Screen
  readers can still reach and press them; they are named "Decrease" and "Increase" (set `decrease-label` and
  `increase-label` to translate them) and point at the input with `aria-controls`.
- Pressing a button never moves focus away from the input.
- Each step fires `input`, as typing would; letting go fires one `change`.

| Key | Action |
|---|---|
| Tab | Moves to the input |
| Up / Down Arrow | One step up / down (native) |
| Page Up / Page Down | Ten steps up / down |
| Typing | Enter a number directly |

## Content

- Say the unit and the range in the label or help ("Lives (1 to 9)").

## Do and don't

- **Do** use it for small counts people nudge; type larger numbers in a plain input.
- **Don't** use it for things that aren't numbers (a year is fine; a phone number isn't).

## API

`<blip-number>`

| Attribute | Default | |
|---|---|---|
| `decrease-label` | `Decrease` | The minus button's name. |
| `increase-label` | `Increase` | The plus button's name. |

| Property | Type | |
|---|---|---|
| `input` | `HTMLInputElement` | The number input inside. |

| Event | Detail | |
|---|---|---|
| `blip-change` | `{ value }` | The value was committed (the input's `change`). |

An input rendered after the element, or swapped by a framework, gets the buttons when it arrives.

| Part | |
|---|---|
| `.blip-number-step[data-step="down"]`, `.blip-number-step[data-step="up"]` | The buttons the element adds. |
