---
name: Toggle button
package: "@jaatster/blip-components"
css: button.css
element: null
react: ToggleButton
status: beta
equivalents:
  shadcn: Toggle
  apg: button
---

# Toggle button

A button that stays on until it is pressed again: "Show grid", "Mute music", a favourite heart. It is a
[button](button.md) with `aria-pressed`, so it needs no stylesheet of its own: on, it sits in its drop with its bands
swapped and a one-pixel ink shadow inside its top and left (the 16-bit pushed-in look, which reads without colour);
the calm tiers fill with the soft accent.

## Usage

```html
<button class="blip-box blip-button" type="button" aria-pressed="false">Show grid</button>
<button class="blip-box blip-button" data-icon-only data-tone="pink" aria-pressed="true" aria-label="Favourite">
  <svg class="blip-icon" viewBox="0 0 12 12" aria-hidden="true">…</svg>
</button>
```

```js
button.addEventListener("click", () => {
  const on = button.getAttribute("aria-pressed") === "true";
  button.setAttribute("aria-pressed", String(!on));
});
```

## Anatomy

As for [Button](button.md). The state is drawn by the box: off is the button's rest look, on is "sits in": no drop,
shade band on top and light band below, and the face a pixel lower inside its outline, so a one-pixel ink shadow runs
along its top and left (candy and soft); or the tone's light fill with an ink outline (outline and ghost).

## Variants

| Attribute | Values | Use |
|---|---|---|
| `aria-pressed` | `false`, `true` | The state. Always present on a toggle (`false` when off), so it is announced as a toggle. |
| `data-variant`, `data-tone`, `data-size`, `data-icon-only` | as for Button | Calm tiers suit toolbars; a candy toggle is for the one setting that matters most. |

## States

| State | Look |
|---|---|
| Off | The button at rest; hover lifts, press sits in. |
| On | Sits in, bands swapped, a one-pixel ink shadow inside its top and left (candy, soft); soft accent fill, ink outline (outline, ghost). |
| Focus | The yellow ring, on or off. |
| Disabled | Dithered, keeping its on or off look. |

## Accessibility

- A toggle is a `<button>` with `aria-pressed`. Screen readers say "Show grid, toggle button, pressed".
- **Keep the label the same** when the state changes: the state is `aria-pressed`. Don't swap "Mute" for "Unmute";
  that reads as a different button.
- Icon-only toggles need `aria-label` naming what they turn on ("Favourite", "Mute music").
- A set where only one may be on is a radio group: use the [segmented control](segmented.md).
- A setting that applies at once in a list of settings may read better as a [switch](switch.md).

| Key | Action |
|---|---|
| Tab | Moves to the toggle |
| Enter, Space | Turns it on or off |

## Content

- Name the thing being turned on, as a noun or a short verb phrase: "Show grid", "Snap to pixels", "Turbo".

## Do and don't

- **Do** keep `aria-pressed="false"` on toggles that are off.
- **Don't** change the label or icon to describe the state.
- **Don't** use a toggle for an action that happens once ("Save"): that's a button.

## API

No attributes beyond the button's. See [Button](button.md) for custom properties.
