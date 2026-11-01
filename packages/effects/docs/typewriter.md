---
name: Typewriter
package: "@blip/effects"
css: text.css
element: blip-typewriter
react: Typewriter
status: beta
---

# Typewriter

Text that types itself, as the TV's speech bubble does: a letter every 50 ms, a longer hold after a full stop, `!`
or `?` that ends a word (260 ms) or a comma (130 ms). With `blips`, every other voiced letter plays the blip voice,
a word always at the same pitches.

## Usage

```html
<blip-typewriter caret blips mood="happy">Welcome back! Your save is ready.</blip-typewriter>
```

```js
const line = document.querySelector("blip-typewriter");
line.text = "Level two. Good luck!";   // types the new text
line.finish();                          // shows it all at once (a Skip button)
line.addEventListener("blip-typewriter-done", () => next());
```

Blips play through `services.sound()` from `@blip/core`, so they are silent until the app turns sound on
(`enableSound()` from `@blip/sound`).

## Anatomy

The whole text for assistive technology, then the typed part and the untyped rest, which keeps its room (hidden), so
nothing moves while it types. `caret` adds a block after the typed part: it moves with the letters, still, then
blinks for six beats once the last letter is in, and stays, so a caret that says "ready" keeps saying it.

## Variants

| Attribute | | |
|---|---|---|
| `blips` | | Every other voiced letter (letters and digits) plays `blip`. |
| `mood` | `plain` (default), `happy`, `sleepy` | Pitches the blips up or down. |
| `caret` | | A two-pixel block: still while it types, then six blinks on the beat, then still and shown. |

Style the text with any text class: `.blip-body`, `.blip-display` (with `data-scale`, 1 to 4), `.blip-title`.

## States

| State | Look |
|---|---|
| Typing | The typed part, then the hidden rest; the caret still. |
| Done | The caret blinks for six beats (under five seconds), then stays. |
| Reduced motion | The whole text at once, the caret still; no blips. |
| Print | The whole text, no caret. |
| Hidden tab | It keeps its place; no blips play. |

## Accessibility

- The whole text is in the accessibility tree from the start; the typing is visual only.
- Offer a way to skip long text (`finish()`); never make people wait to act.
- Blips are off unless the app has turned sound on.

## Do and don't

- **Do** type dialogue, tips and short messages from a character or the game.
- **Don't** type labels, errors or anything people must read quickly.

## API

| | |
|---|---|
| `text` | The text; setting it types the new text. |
| `play()` | Types from the start; returns a promise. |
| `finish()` | Shows everything now. |
| `blips`, `caret`, `mood` | Properties that mirror the attributes. |
| `blip-typewriter-done` | Fires (bubbling) once per play: when the last letter is in, or on `finish()`. |
| `--blip-duration-letter`, `--blip-duration-stop`, `--blip-duration-comma` | The timing tokens. |
