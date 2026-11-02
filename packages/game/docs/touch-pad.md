---
name: Touch pad
package: "@jaatster/blip-game"
css: touch-pad.css
element: blip-touch-pad
react: TouchPad
status: beta
---

# Touch pad

A pixel D-pad on the left and A and B on the right, with Start between them if you want it, for playing a keyboard
game on a phone. It sends real keyboard events (the arrow keys from the D-pad, your keys from A, B and Start), so a
game that listens for keys needs no change. Several fingers work at once: run and jump. It sits fixed along the bottom
of the screen inside the notch's and the home bar's safe areas, and it shows only on touch screens.

## Usage

```html
<!-- import "@jaatster/blip-game/touch-pad.js" and @jaatster/blip-game/touch-pad.css (or game.css) -->
<canvas id="game" tabindex="0"></canvas>
<blip-touch-pad for="game" data-a="z" data-b="x" data-start="Enter"></blip-touch-pad>
```

The game listens as it always has:

```js
addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") player.run(-1);
  if (e.key === "z" && !e.repeat) player.jump();
});
addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") player.stop();
});
```

Keys go to the element named by `for` and bubble up to the document and the window, so listeners on any of them
hear them. Without `for` they go to the focused element: a focused menu (`<blip-choices>`, a list with the arrow keys)
moves with the D-pad, as with the keyboard. Leave room at the bottom of the game for the pad: about 60 pixels (120
CSS px) plus the safe area. With Start it all fits a 320 px screen at the default pixel; on anything narrower (or with
a chunkier pixel) B and A wrap to a row of their own, still on the right, rather than widen the page.

The pad doesn't mirror right to left: a controller's sides are physical, so it sets `direction: ltr` on itself and the
D-pad stays on the left, A and B on the right, in every language.

### What it can't do

The events are real `KeyboardEvent`s with `key`, `code`, `keyCode` and `which`, but the browser marks them as sent by
a script (`isTrusted` is false): they reach every listener, but they never type into a field, press a focused button
or scroll the page. A game reads keys with listeners, so it works; for a menu of buttons, listen for the key and call
`click()` yourself.

## Anatomy

1. **D-pad** (`.blip-touch-pad-dpad`): four slate arms (`.blip-touch-pad-arm`, each with a white pixel arrow) round a
   sat-in hub (`.blip-touch-pad-hub`). Arms are 16 pixels square, the whole pad 52: 104 CSS px at the default pixel.
2. **B and A** (`.blip-touch-pad-buttons`): red and green face buttons 22 pixels across (44 CSS px), on a diagonal with
   B lower and nearer the thumb, as on the 16-bit pads, with their letters in Pixel Bop.
3. **Start** (`data-start`): a small slate pill, low in the middle.

Empty, the element draws these parts. Write them yourself (the second example) to name them in your language or to
leave a part out.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-a`, `data-b` | a key (`z`, `x` by default) | What A and B send: a letter or digit, `" "` (Space), or a key's name (`Enter`, `Shift`, `Escape`). |
| `data-start` | a key (`Enter` when empty) | Shows Start, sending this key. |
| `data-show="always"` | | Shows the pad on every pointer. By default it shows only on a coarse one (`@media (pointer: coarse)`): a phone or tablet, not a laptop with a touch screen. |
| `data-position="inline"` | | In the page's flow instead of fixed to the bottom: for a demo, or a layout of your own. |
| `data-blip-pixel` | `3`, `4` | The pixel switch: a chunkier pad for a tablet or a TV. Every size is in pixels, so it stays crisp. |
| `haptics` | boolean | A 10 ms buzz on each press where the device has one (`navigator.vibrate`). Off unless asked for. |

## States

| State | How | Look |
|---|---|---|
| Rest | | Candy on its drop. |
| Held | a finger, the mouse or a pen on it | Sits in its drop (`data-blip-pressed`, set while held). |
| Rolled | a thumb slid across the D-pad | The arm under the thumb takes over: the old arrow's `keyup`, then the new one's `keydown`. The middle of the D-pad presses nothing. |

## Accessibility

The touch pad duplicates the keyboard: everything it does, the keys do. So:

- **It never takes focus.** Its controls are not in the tab order, and pressing one keeps focus (and the caret)
  where it was, so the game, or a menu in it, keeps the keys. Keyboard players use their keys.
- **Screen readers can still use it.** It is a `group` named "Game controls" (set `aria-label` to rename it) of
  `button`s named Up, Down, Left, Right, A, B and Start, each with `aria-keyshortcuts` saying which key it stands for.
  A screen reader's double tap presses a button for a tenth of a second (`keydown`, then `keyup`), so a turn-based
  or menu-driven game can be played by touch with VoiceOver or TalkBack. Hiding it from them would leave a blind
  player on a phone with no keyboard nothing to play with; leaving it in the tab order would take focus from the
  game. On screens where it is hidden (a fine pointer) it is hidden from assistive technology too.
- **Nothing stays stuck.** Lifting a finger, a cancelled touch, the window losing focus or the page being hidden
  releases every key it holds.
- **Several fingers**: each holds its own control. Two fingers on one control send one `keydown` and one `keyup`, as a
  held key does.
- Its controls take every touch (`touch-action: none`): no scrolling, zooming or long-press menu on them. Between them
  the pad lets touches through to the game.
- Targets are 44 CSS px or more: an arm is drawn 32 px square, but a thumb anywhere on its side of the 104 px D-pad presses it;
  A and B are 44.
- Windows high contrast: system colours, and a held control is the system highlight.

| Key | Action |
|---|---|
| (none) | It is not in the tab order: it sends keys, it doesn't take them. |

## Content

- Say which button does what in your game's own help ("A jumps, B runs"), with the prompts from `prompt.css`.

## Do and don't

- **Do** pick keys your game already uses, and say so in `data-a` and `data-b`.
- **Do** leave the bottom of the game clear for the pad on phones.
- **Don't** force it on desktops (`data-show="always"`) unless the game is meant to be played with a mouse.
- **Don't** put it over buttons or text people need: it sits on top of them.

## API

`<blip-touch-pad>`

| Attribute | Type | |
|---|---|---|
| `for` | string | The id of the element to send keys to. Default: the focused element. |
| `data-a`, `data-b` | string | The keys A and B send (`z`, `x`). |
| `data-start` | string | Shows Start, sending this key (`Enter` when empty). |
| `data-show` | `always` | Shows it on every pointer. |
| `data-position` | `inline` | In the page's flow. |
| `haptics` | boolean | A short buzz on each press. `"false"` is off. |

It fires no events of its own: it sends `keydown` and `keyup` to its target.

| Part | |
|---|---|
| `.blip-touch-pad-dpad` | The D-pad. |
| `.blip-touch-pad-arm` | An arm: `data-dir` `up`, `right`, `down` or `left`, holding an empty `<span>` for its arrow. |
| `.blip-touch-pad-hub` | The D-pad's middle. |
| `.blip-touch-pad-buttons` | B and A. |
| `.blip-touch-pad-button` | A button: `data-button` `a`, `b` or `start`. |
