---
name: Pause menu
package: "@jaatster/blip-game"
css: pause.css
element: null
react: PauseMenu
status: beta
---

# Pause menu

A cream panel over a dithered ink scrim: the title in POP, a few facts about the run, a menu with the pixel pointer,
and a hint line. It is a native `<dialog>`, so the browser handles focus, Escape and the inert page behind it.

## Usage

```html
<dialog class="pp-box pp-pause" aria-labelledby="pause-title">
  <h2 class="pp-pause-title pp-display pp-pop" data-scale="3" data-pop="Paused" id="pause-title">Paused</h2>
  <p class="pp-pause-stats"><span><pp-sprite name="coin"></pp-sprite>42 coins</span> …</p>
  <pp-choices>
    <ul class="pp-choices" role="list" data-font="display">
      <li><button type="button" class="pp-box pp-choice" data-variant="ghost" value="resume" autofocus>Resume</button></li>
      <li><button type="button" class="pp-box pp-choice" data-variant="ghost" value="options">Options</button></li>
      <li><button type="button" class="pp-box pp-choice" data-variant="ghost" value="quit">Quit to map</button></li>
    </ul>
  </pp-choices>
  <p class="pp-pause-hint pp-prompt"><kbd class="pp-box pp-prompt-key">Esc</kbd> Resume</p>
</dialog>
```

```js
pause.showModal();                                   // pause: focus goes to Resume
pause.addEventListener("pp-action", (e) => { if (e.detail.value === "resume") pause.close(); });
pause.addEventListener("close", resumeGame);         // Escape closes it too
```

## Anatomy

1. **Scrim**: the dialog's `::backdrop`, a checkerboard of ink over the game. Never a translucent wash.
2. **Panel**: a cream candy box, radius 5, centred. A light island in every scheme.
3. **Title**: Pixel Bop at scale 3, POP.
4. **Stats** (`.pp-pause-stats`): a row of small facts with sprites.
5. **Menu**: [choices](choices.md) in Pixel Bop capitals.
6. **Hint** (`.pp-pause-hint`): a [prompt](prompt.md) line.

## States

It pops in: a pixel low for a frame, then in place. With reduced motion it simply appears. Inside a
[stage](stage.md), `<dialog open>` shows it in place without the modal (for docs and attract screens), over a
`.pp-scrim`.

## Accessibility

- `showModal()` moves focus in (to the `autofocus` choice), traps Tab inside, makes the game inert and closes on Escape.
- Name the dialog by its title (`aria-labelledby`).
- The choices: Up and Down move, Enter picks.
- Return focus where it was when the menu closes (the browser does this for `<dialog>`).

## Content

"Paused" or the game's own word. Resume first, the destructive way out ("Quit to map") last; confirm it if progress
would be lost.

## Do and don't

- **Do** stop the game clock and sounds while paused.
- **Don't** put settings themselves in the pause panel; open them from it.
