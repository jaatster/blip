---
name: Switch
package: "@jaatster/blip-components"
css: switch.css
element: null
react: Switch
status: beta
equivalents:
  shadcn: Switch
  apg: switch
---

# Switch

A setting that is on or off and applies at once: music, screen shake, CRT scanlines. A real
`<input type="checkbox" role="switch">` is the knob, a cream candy box, on a track. Off, the knob rests at the start
of the calm well; on, the track fills with candy and the knob hops to the end, two pixels a step.

## Usage

```html
<label class="chu-check" data-layout="split">
  Screen shake
  <span class="chu-box chu-switch"><input type="checkbox" role="switch" class="chu-box" name="shake"></span>
</label>
```

## Anatomy

1. **Track**: the calm well, 19 x 11 pixels (15 x 9 small, 23 x 13 large), radius 4. On: candy that sits in.
2. **Knob**: the input itself, a neutral cream candy box the track's height, with its own drop. A transparent pixel
   of border makes its target 26 px without changing its look.
3. **Row**: a `.chu-check` label; `data-layout="split"` puts the words first and the switch at the far end. Help goes
   after the row in a `.chu-check-help`, linked with `aria-describedby`.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-size` (track or row) | `sm`, `md` (default), `lg` | 9, 11 or 13 pixels high. |
| `data-tone` (track) | any tone | The track's candy when on. |
| `data-layout="split"` (row) | | Label first, switch at the end: settings lists. |

## States

| State | How | Look |
|---|---|---|
| Hover | pointer on the knob or its row | The knob lifts a pixel. |
| Pressed | pointer down | The knob sits in its drop. |
| On | `checked` | Candy track; the knob at the end. It moves in two-pixel steps over a nudge (80 ms). |
| Focus | keyboard | The yellow ring round the track. |
| Disabled | `disabled` | Track and knob dithered. |

With reduced motion the knob jumps straight to its place.

## Accessibility

- `role="switch"` makes screen readers say "on" and "off" instead of "checked". It's still a checkbox underneath:
  forms send it, Space toggles it.
- Label it like a checkbox (a wrapping `<label>` or `aria-label`). Don't change the label with the state.
- Not colour alone: the knob's position shows the state too.
- Windows high contrast: a bordered track and knob, the knob filled with the highlight colour when on.

| Key | Action |
|---|---|
| Tab | Moves to the switch |
| Space | Turns it on or off |

## Content

- Name the setting, not the action: "Music", not "Turn music on".

## Do and don't

- **Do** use a switch when the change happens at once.
- **Don't** use a switch inside a form that needs a Submit button: use a [checkbox](checkbox.md).

## API

| Class | |
|---|---|
| `.chu-switch` | The track. Markup: `class="chu-box chu-switch"` on a `<span>`; the input inside also has `class="chu-box"`. |

| Custom property | Default | |
|---|---|---|
| `--chu-tone`, `--chu-tone-light`, `--chu-tone-shade`, `--chu-tone-on` | accent | The track's candy when on (or `data-tone`). |
