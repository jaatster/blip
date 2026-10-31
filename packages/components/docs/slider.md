---
name: Slider
package: "@jaatster/blip-components"
css: slider.css
element: null
react: Slider
status: beta
---

# Slider

A value from a range by dragging: volume, brightness, speed. A native `<input type="range">` drawn as a chunky groove
with stepped ends and a cream candy knob, with tick marks under it and a value readout beside it if you want them.

## Usage

```html
<pp-field class="pp-field">
  <label class="pp-field-label" for="music">Music</label>
  <div class="pp-slider-group">
    <input class="pp-slider" id="music" name="music" type="range" min="0" max="10" value="7" list="music-ticks">
    <output class="pp-box pp-slider-value" data-variant="panel" for="music" aria-hidden="true">7</output>
    <datalist class="pp-slider-ticks" id="music-ticks">
      <option value="0">0</option><option value="5">5</option><option value="10">10</option>
    </datalist>
  </div>
</pp-field>
```

`<pp-field>` keeps the readout and the groove's fill in step with the slider. Without it, the slider still works; the
groove just doesn't fill (Firefox fills it natively).

## Anatomy

1. **Groove**: four pixels high, a line outline with stepped ends; inside, a shadow row and a sunken row, filled with
   the accent up to the knob's middle.
2. **Knob**: an 8 x 12 pixel cream candy box (ink outline with stepped corners, light and shade bands, glints, a drop),
   in a 12 x 16 target.
3. **Ticks** (optional, `.pp-slider-ticks`): one mark per child, spread so each lines up with the knob at that
   value; a child's text is its label.
4. **Readout** (optional, `.pp-slider-value`): the value in a small panel.

The knob is a pseudo-element of the input, so it can't wear `.pp-box`: it is drawn here from the same tokens and the
same rules as the box.

## Variants

| Part | Use |
|---|---|
| `.pp-slider-group` | Slider and readout side by side, ticks below the slider. |
| `<datalist class="pp-slider-ticks">` linked with `list` | Ticks that also make the knob snap to them while dragging (Chromium). A `<div>` of spans works too. |

## States

| State | How | Look |
|---|---|---|
| Hover | pointer | The knob lifts a pixel; its drop grows so the shadow stays put. |
| Pressed | dragging | The knob sits in its drop. |
| Focus | keyboard | The yellow ring with an ink edge round the knob. |
| Disabled | `disabled` | Knob dithered, groove soft. |

`data-pp-state="hover focus active"` forces those looks in docs and tests.

## Accessibility

- It's a native slider: the keys below, screen readers announce the value, forms send it.
- Label it with a `<label for>`. When the number means little ("2" for brightness), set `aria-valuetext`
  ("Normal") as the value changes.
- The readout is `aria-hidden`: the slider already says its value.
- The whole 16-pixel-high strip takes clicks and drags, so the target is generous.
- Windows high contrast: a solid groove and a bordered system-coloured knob.

| Key | Action |
|---|---|
| Tab | Moves to the slider |
| Right / Up Arrow | One step up |
| Left / Down Arrow | One step down |
| Page Up / Page Down | A bigger step (native) |
| Home / End | The minimum / maximum |

## Content

- Label the ends or a few ticks when the scale isn't obvious ("Dim", "Normal", "Bright").

## Do and don't

- **Do** use a slider when the exact value matters less than the feel.
- **Don't** use one for precise numbers; use a [number stepper](number.md) or an input.

## API

| Custom property | Default | |
|---|---|---|
| `--pp-slider-value` | 0 | How much of the groove is filled, 0 to 1. `<pp-field>` sets it. |

| Class | |
|---|---|
| `.pp-slider` | The input. |
| `.pp-slider-group`, `.pp-slider-ticks`, `.pp-slider-value` | Layout, ticks and readout. |
