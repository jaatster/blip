---
name: Keycap
package: "@blip/components"
css: keycap.css
element: null
react: Keycap
status: stable
equivalents:
  shadcn: Kbd
  html: '<kbd>'
---

# Keycap

A `<kbd>` drawn as a little key: a cream candy box whose shade band is thicker, so it stands up off the page. Use it
to tell people which key or button to press, in text, in menus and in game prompts.

## Usage

```html
Press <kbd class="blip-box blip-keycap">Esc</kbd> to pause.
<kbd class="blip-keys"><kbd class="blip-box blip-keycap">Ctrl</kbd>+<kbd class="blip-box blip-keycap">K</kbd></kbd>
<kbd class="blip-box blip-keycap" data-size="lg" data-tone="green">A</kbd> Jump
```

## Anatomy

1. **Key**: a candy box with a one-pixel light band and a thick shade band (three pixels), radius 2.
2. **Label**: Pixelify Sans, bold, upper case, on the key's face above the shade.
3. **Combination** (optional): `.blip-keys`, an outer `<kbd>` holding keys with a quiet "+" between them.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-size` | `sm` (10 pixels), `md` (12, default), `lg` (16) | `md` sits in body text; `lg` for prompts and shortcut sheets. With a bigger default text size, keys grow with their labels, in whole pixels. |
| `data-tone` | `neutral`, cream (default), any tone or candy | Coloured keys for a gamepad's buttons (A green, B red, X blue, Y slate). |
| `data-blip-pressed` | | Shows a key held down: it sits in its drop (key tests, tutorials). |

## States

A keycap is a picture of a key, not a control: no hover, no focus.

## Accessibility

- `<kbd>` tells assistive technology this is keyboard input; nested `<kbd>`s are a combination.
- Screen readers read the label: write it as the key reads ("Ctrl", "Shift", "Esc"), not as a symbol.
- Colour is never the meaning: the label says the button ("A").

## Content

- A label too long for the room wraps between words and the key grows taller; it is never cut short.
- The key's own name, short: "Esc", "Enter", "Space", "Ctrl". Upper case comes from CSS.
- Platform keys: say "Ctrl" or "Cmd" as the platform does; show the right one when you can.

## Do and don't

- **Do** use keycaps inline in help text and next to menu items.
- **Don't** make a keycap clickable; if it should do something, use a button.

## API

| Class | |
|---|---|
| `.blip-keycap` | The key. Use with `.blip-box` on a `<kbd>`. |
| `.blip-keys` | The combination wrapper (an outer `<kbd>`). |

| Custom property | Default | |
|---|---|---|
| `--blip-band-top`, `--blip-band-bottom` | 1, 3 (lg 2, 4) | The key's light and shade bands, in pixels. |
| `--blip-tone`, `--blip-tone-light`, `--blip-tone-shade`, `--blip-tone-on` | cream | A custom colour. |
