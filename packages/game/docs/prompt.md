---
name: Prompts
package: "@jaatster/blip-game"
css: prompt.css
element: null
react: Prompt
status: beta
---

# Prompts

Which button does what: keyboard keys, gamepad face buttons, the D-pad, bumpers and triggers, the "Press A to jump"
line, and the title screen's blinking PRESS START. Labels, not controls.

## Usage

```html
<p class="blip-prompt">Press <kbd class="blip-box blip-prompt-button" data-button="a">A</kbd> to jump</p>
<p class="blip-prompt">Hold <kbd class="blip-box blip-prompt-shoulder" data-button="rb">RB</kbd> to dash</p>
<p class="blip-prompt"><kbd class="blip-box blip-prompt-key">Esc</kbd> Pause</p>
<span class="blip-prompt-dpad" data-dir="left" role="img" aria-label="D-pad left"></span>
<p class="blip-prompt-start blip-display blip-pop" data-scale="2" data-pop="Press start">Press start</p>
```

## Anatomy

1. **Line** (`.blip-prompt`): small bold capitals with glyphs in the flow.
2. **Key** (`.blip-prompt-key`): a cream keycap, a top face and a front face three pixels deep, Pixel Bop capitals or an icon.
3. **Face button** (`.blip-prompt-button`): a sixteen-pixel circle (the candy box at radius 7), the letter's six columns centred exactly.
4. **Shoulder** (`.blip-prompt-shoulder`): a slate bumper; triggers stand taller with rounder corners.
5. **D-pad** (`.blip-prompt-dpad`): an ink plus with a drop, slate fill, a dimple, and one arm lit in the accent.

## Variants

| Part | Attribute | Values |
|---|---|---|
| Face button | `data-button` | `a` green, `b` red, `x` blue, `y` orange. Yellow is kept for focus, so Y is orange. `data-tone` picks any other. |
| Shoulder | `data-button` | `lb`, `rb`, `l`, `r` (bumpers); `lt`, `rt`, `zl`, `zr` (triggers, taller). |
| D-pad | `data-dir` | `up`, `down`, `left`, `right`, or none for the pad at rest. |
| Key | content | A word (`Esc`, `Enter`), a letter, or an `aria-hidden` icon (`.blip-icon`) with its name in a `.blip-sr-only` span. Wide keys take a `min-inline-size`. |

## States

PRESS START blinks on the beat for five seconds, then stays lit: blinking never runs on (WCAG 2.2.2). With reduced
motion it does not blink. Prompts have no hover, focus or pressed states; they are not buttons.

## Accessibility

- Use `<kbd>` for keys and buttons: screen readers read their letters. Name an icon key with hidden text, not
  `aria-label` (it is not a role that takes one, and some screen readers ignore it there):
  `<kbd class="blip-box blip-prompt-key"><svg class="blip-icon" aria-hidden="true">…</svg><span class="blip-sr-only">Up arrow</span></kbd>`.
- The D-pad is a picture: `role="img"` with `aria-label`. It prints, though browsers leave backgrounds off paper.
- Write the line so it reads as a sentence: "Press A to jump".
- Show the prompts for the device in use; let players choose.

## Content

Verbs after the glyph: "to jump", "Pause", "Back". Keep a prompt to one action.

## Do and don't

- **Do** match the colours players know (A green, B red, X blue), with the letter always shown.
- **Don't** make a prompt clickable; if it should be, use a button.

## API

No custom properties: the glyphs are fixed pixel sizes (16 pixels high; triggers 17).
