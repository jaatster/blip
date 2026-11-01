---
name: Action sheet
package: "@jaatster/blip-components"
css: action-sheet.css
element: chu-action-sheet
react: ActionSheet
status: beta
equivalents:
  apg: dialog-modal
  html: '<dialog>'
---

# Action sheet

A short column of big buttons that rises from the bottom of the screen: what to do with this replay, this photo,
this save slot. One choice may be destructive, and Cancel sits apart below the rest. It is a modal dialog, so the
page waits and focus stays inside until a choice is made or the sheet is dismissed. For a menu that stays near its
button on a wide screen, use a [menu](menu.md); for a question that needs explaining, a [dialog](dialog.md).

## Usage

```html
<button class="chu-box chu-button" commandfor="replay" command="show-modal">Replay 12</button>

<chu-action-sheet light-dismiss>
  <dialog class="chu-box chu-drawer chu-action-sheet" id="replay" aria-labelledby="replay-title" aria-describedby="replay-text">
    <form method="dialog">
      <h2 class="chu-action-sheet-title" id="replay-title">Replay 12</h2>
      <p class="chu-action-sheet-message" id="replay-text">World 3-2, saved 2 minutes ago.</p>
      <div class="chu-action-sheet-actions">
        <button class="chu-box chu-button" data-size="lg" data-width="full" data-variant="soft" value="share">Share</button>
        <button class="chu-box chu-button" data-size="lg" data-width="full" data-variant="soft" value="rename">Rename</button>
        <button class="chu-box chu-button" data-size="lg" data-width="full" data-variant="soft" data-tone="danger" value="delete">Delete</button>
      </div>
      <button class="chu-box chu-button chu-action-sheet-cancel" data-size="lg" data-width="full" data-variant="soft" data-tone="neutral" value="cancel">Cancel</button>
    </form>
  </dialog>
</chu-action-sheet>
```

### The choice

The sheet is a `<form method="dialog">`, so each button closes it with its `value`. Read the choice where the
platform puts it, or from the event:

```js
const sheet = document.querySelector("chu-action-sheet");
sheet.addEventListener("chu-close", (e) => {
  if (e.detail.returnValue === "delete") deleteReplay();   // also sheet.returnValue, and the dialog's returnValue
});
```

| Closed by | `returnValue` | `reason` |
|---|---|---|
| A choice | its `value` (`"share"`) | `"submit"` |
| Cancel | its `value` (`"cancel"` by convention) | `"submit"` |
| Escape | `""` | `"escape"` |
| The scrim (with `light-dismiss`) | `""` | `"backdrop"` |

`<chu-action-sheet>` empties `returnValue` each time it opens (with `show()`, `open` or an invoker button), so a
dismissed sheet never reports the choice from the time before. `chu-before-close` comes first and can be cancelled,
as on the dialog.

`action-sheet.css` styles a bottom drawer: load `drawer.css` too (`components.css` has both). For the safe areas of
a phone with a notch, the page needs `viewport-fit=cover` in its viewport meta.

## Anatomy

1. **Sheet**: the drawer's raised candy box. On a phone it runs a pixel past the bottom and sides of the screen,
   square corners, so only its top edge shows the ink outline, and keeps its content clear of the safe areas.
2. **Title** (`.chu-action-sheet-title`, optional): Pixel Bop at scale 1, centred.
3. **Message** (`.chu-action-sheet-message`, optional): one muted line under the title.
4. **Actions** (`.chu-action-sheet-actions`): a column of large (48 px), full-width buttons. It scrolls when there
   are too many for the screen.
5. **Cancel** (`.chu-action-sheet-cancel`): a large, full-width, soft neutral button, below a soft rule and a gap.
6. **Scrim**: the dialog's one-pixel ink checkerboard.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-layout` | `sheet` | From 600 px of screen width an action sheet is a compact dialog in the middle (160 pixels wide, radius 4, a two-pixel drop) that pops in as the dialog does, because a column of full-width buttons across a desktop screen reads badly and the pointer is far from the bottom. `data-layout="sheet"` keeps it at the bottom at every width. |
| `role="alertdialog"` | | For a destructive choice that interrupts: add `aria-describedby` on the message, and `autofocus` on the safe button. |

The buttons are ordinary [buttons](button.md): soft for the choices, `data-tone="danger"` for the destructive one
(candy when it is the whole point of the sheet), and soft `neutral` for Cancel.

## States

| State | How | Look |
|---|---|---|
| Opening | `showModal()`, `command="show-modal"`, `open` | On a phone, slides up in six whole-pixel steps over a glide (160 ms); wide, one pixel low for a frame, then in place. The scrim dithers in. |
| Closing | with `<chu-action-sheet>` | The same backwards. |
| Static | `data-chu-static` with `open` | In the page flow: docs, tests, screenshots only. |

The buttons have the box's states: hover, pressed, focus, disabled. With reduced motion the sheet appears and goes at
once.

## Accessibility

Everything in the dialog's accessibility section applies: `showModal()` makes the page inert and keeps focus inside,
the sheet is named by its title (`aria-labelledby`, or `aria-label` without one), focus goes to the first choice
(or the one with `autofocus`) and back to the opener when it closes, and Escape asks to close.

- Use `light-dismiss` only when dismissing loses nothing; never on an alert dialog.
- Every choice is a real button with a visible label, at least 48 px tall: more than the 44 px a main action wants.

| Key | Does |
|---|---|
| Tab, Shift+Tab | Moves through the choices and Cancel only. |
| Enter, Space | Chooses the focused button, which closes the sheet with its `value`. |
| Escape | Asks to close (`reason: "escape"`, `returnValue` empty). |

## Content

- Two to six choices. Each is a verb ("Share", "Delete replay"), in sentence case; the CSS sets the capitals.
- A title only when the sheet needs to say what the choices act on; a message only for a consequence ("Deleting it
  can't be undone.").
- Put the destructive choice last, before Cancel.

## Do and don't

- **Do** keep Cancel, even with `light-dismiss`: not everyone knows the scrim closes it.
- **Do** read the choice from `returnValue` or `chu-close`, not from a click on a button.
- **Don't** put fields, links or toggles in an action sheet; use a [bottom sheet](sheet.md) or a dialog.
- **Don't** open one action sheet from another.

## API

`<chu-action-sheet>`: everything [`<chu-dialog>`](dialog.md#api) has: `open`, `light-dismiss`, `show(opener?)` (which
also empties `returnValue`), `requestClose(value?)`, `close(value?)`, `returnValue`, `dialog`, and the events
`chu-open`, `chu-before-close` (cancelable) and `chu-close` (`detail: { reason, returnValue }`).

| Class or property | |
|---|---|
| `.chu-action-sheet` with `.chu-drawer` on a `<dialog class="chu-box">` | The sheet. |
| `.chu-action-sheet-title`, `.chu-action-sheet-message`, `.chu-action-sheet-actions`, `.chu-action-sheet-cancel` | The parts. |
| `--chu-r` with `--chu-shape`, `--chu-shape-inner`, or `data-chu-r` | Corner radius (0 at the bottom, 4 in the middle). |
