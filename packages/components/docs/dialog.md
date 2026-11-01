---
name: Dialog
package: "@blip/components"
css: dialog.css
element: blip-dialog
react: Dialog
status: stable
equivalents:
  shadcn: Dialog, Alert Dialog
  apg: dialog-modal, alertdialog
  html: '<dialog>'
---

# Dialog

A native `<dialog>`, drawn as a raised panel with a title bar, opened over a dithered ink scrim. Use it when the
person has to answer before going on: confirm a destructive action, pick a save slot, fill in something short. For
a menu of actions or extra details, use a [popover](popover.md); for a side panel, a [drawer](drawer.md).

## Usage

```html
<button class="blip-box blip-button" commandfor="save" command="show-modal">Save game</button>

<blip-dialog light-dismiss>
  <dialog class="blip-box blip-dialog" id="save" aria-labelledby="save-title">
    <form method="dialog">
      <header class="blip-dialog-header">
        <h2 class="blip-dialog-title" id="save-title">Save game</h2>
        <button class="blip-box blip-button blip-dialog-close" type="button" commandfor="save" command="close" value="cancel" data-variant="ghost" data-size="sm" data-icon-only aria-label="Close"><span class="blip-icon" data-glyph="close" aria-hidden="true"></span></button>
      </header>
      <div class="blip-dialog-body">…</div>
      <footer class="blip-dialog-footer">
        <button class="blip-box blip-button" type="button" commandfor="save" command="close" value="cancel" data-variant="soft" data-tone="neutral">Cancel</button>
        <button class="blip-box blip-button" value="save">Save</button>
      </footer>
    </form>
  </dialog>
</blip-dialog>
```

```js
const d = document.querySelector("blip-dialog");
d.addEventListener("blip-before-close", (e) => { if (unsaved && !confirmLeave()) e.preventDefault(); });
d.addEventListener("blip-close", (e) => { if (e.detail.returnValue === "save") save(); });
```

Save is the form's only submit button, so Enter in a field saves; Close and Cancel are `type="button"` invokers
(`command="close"`), so they never become the default button. The CSS works on a bare `<dialog>` (open it with
`showModal()` or `command="show-modal"`); `<blip-dialog>` adds the stepped exit, `blip-before-close`, light dismiss, a
reliable return of focus, and invoker buttons in browsers that lack them.

## Anatomy

1. **Panel**: a candy box, raised (`--blip-surface-raised`), radius 4, ink outline, a two-pixel drop.
2. **Title bar** (`.blip-dialog-header`): the tone's light colour, reaching up into the stepped corners (the box's
   top band paints them), with a one-pixel ink rule under it. It grows with the title, so long titles wrap.
3. **Title** (`.blip-dialog-title`): Pixel Bop at scale 1, in capitals.
4. **Sign** (`.blip-dialog-icon`, optional): the tone's glyph, for alert dialogs.
5. **Close** (`.blip-dialog-close`, optional): a small ghost icon button with the pixel cross.
6. **Body** (`.blip-dialog-body`): scrolls when the dialog is taller than the screen; bar and footer stay. While more
   lies below, an ink rule runs over the footer and the text dithers out above it; a pixel scrollbar beside it.
   Paper cannot scroll: printed, an open dialog shows its whole body, grown over the page (past a `max-block-size`
   set on it inline too).
7. **Footer** (`.blip-dialog-footer`): actions at the end, the main one last.
8. **Scrim** (`::backdrop`): a one-pixel ink checkerboard, never a see-through wash.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-size` | `sm` (160 pixels), `md` (224, default), `lg` (320) | Never wider than the screen less 8 pixels a side. |
| `data-tone` | `accent` (default), `info`, `success`, `warning`, `danger` | The title bar. `danger` for destructive confirmations. |
| `role="alertdialog"` | | A confirmation that interrupts. Add `.blip-dialog-icon`, `aria-describedby` on the message, and `autofocus` on the least destructive button. |

## States

| State | How | Look |
|---|---|---|
| Opening | `showModal()`, `command="show-modal"`, `open` | The scrim is a quarter dither for a frame, then half; the panel is one pixel low for that frame, then in place. |
| Closing | with `<blip-dialog>` (`data-blip-closing`) | One frame low with a quarter-dither scrim, then gone. |
| Static | `data-blip-static` with `open` | Drawn in the page flow, without the top layer: docs, tests, screenshots only. |
| More to read | the body scrolls, and has not reached its end | A one-pixel ink rule over the footer, and the body's last twelve pixels dither out in three hard steps (three quarters, a half, a quarter): never a see-through wash. Scrolled down, its top dithers too. It follows the scroll position with a scroll-driven animation; where the browser has none, the rule alone shows while there is more below. With keyboard focus on the body the dither steps aside, so the focus ring stays whole. |

With reduced motion it opens and closes at once.

## Accessibility

- **Modal by the browser.** `showModal()` puts the dialog in the top layer, makes the rest of the page inert (so
  focus cannot leave and screen readers cannot wander), and moves focus to the first focusable element, or to the
  one with `autofocus`.
- **Name it.** `aria-labelledby` pointing at the title (the element warns in development when it is missing).
  Alert dialogs also get `aria-describedby` on the message.
- **Focus on open:** the first field, or for confirmations the least destructive action (`autofocus` on "Keep it").
  A long, read-only dialog can focus its body (`tabindex="0"` on `.blip-dialog-body`).
- **Focus on close** returns to what opened it (the opener, or `show(opener)`), even when the dialog was closed by
  Escape or the scrim.
- **Escape** closes it through `blip-before-close`. Browsers do not let a page block Escape twice in a row: a second
  Escape with no click between closes the dialog at once (`blip-close` with `reason: "escape"`).
- **Light dismiss** (`light-dismiss`) is for dialogs that lose nothing when closed. Never on alert dialogs or forms.
- The page behind does not scroll the dialog's body: `overscroll-behavior: contain`.

| Key | Does |
|---|---|
| Tab, Shift+Tab | Moves through the dialog's controls only; the page behind is inert. |
| Enter, Space | Presses the focused button; in a `<form method="dialog">`, a button closes with its `value`. |
| Escape | Asks to close (`blip-before-close`, `reason: "escape"`). |

## Content

- Title: the question or the task ("Delete slot 2?", "Save game"), in a few words.
- Buttons say what happens ("Delete", "Keep it"), never "OK" and "Cancel" for a destructive choice.
- One sentence of consequence for confirmations ("You can't undo this.").
- Long words (German compounds, file names, links) break onto the next line, at their hyphens where the page's
  `lang` allows, rather than widen the dialog or make its body scroll sideways.

## Do and don't

- **Do** use `data-tone="danger"` and an alert dialog for destructive confirmations, with the danger button last.
- **Do** keep dialogs short; move long flows to a page.
- **Don't** open a dialog on page load or from another dialog.
- **Don't** put a candy button on the title bar; the close cross is ghost.

## API

`<blip-dialog>` wraps one `<dialog>`.

| Member | |
|---|---|
| `open` (attribute and property) | Opens or closes it; reflects the state. `open="false"` is closed (the element takes it off). Set before the `<dialog>` is rendered, it opens the dialog when it arrives. |
| `light-dismiss` (attribute) | A press that starts and ends on the scrim asks to close (`reason: "backdrop"`). |
| `show(opener?)` | Opens it as a modal. `opener` gets focus back afterwards (default: what has focus now). |
| `requestClose(returnValue?)` | Asks to close; resolves `true` if it closed. |
| `close(returnValue?)` | Closes after the exit, without asking. |
| `returnValue` | The value of the button that closed it. |
| `dialog` (read only) | The `<dialog>` it drives. |
| `blip-open` | After it opens. |
| `blip-before-close` (cancelable) | `detail: { reason, returnValue }`, reason `escape`, `backdrop`, `button`, `submit` or `api`. |
| `blip-close` | After it closes; same `detail`. |

Invoker buttons (`commandfor` with `command="show-modal"`, `"close"` or `"request-close"`) work natively where the
browser has them; elsewhere `<blip-dialog>` handles them. A dialog opened directly (`dialog.showModal()`) is tracked
too: `blip-open` fires and `open` is set, and the browser returns focus when it closes. Moved in the page while open
(a portal), it closes and reopens as a modal. Sound: `open` and `back` cues through `provide({ sound })`.

| Class or property | |
|---|---|
| `.blip-dialog`, `.blip-dialog-header`, `.blip-dialog-title`, `.blip-dialog-icon`, `.blip-dialog-close`, `.blip-dialog-body`, `.blip-dialog-footer` | The parts. |
| `--blip-r` with `--blip-shape`, `--blip-shape-inner`, or `data-blip-r` | Corner radius (4). The title bar follows it. |
| `--blip-tone`, `--blip-tone-light`, `--blip-tone-on` | The title bar's colours. |
