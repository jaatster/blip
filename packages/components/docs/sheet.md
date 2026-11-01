---
name: Bottom sheet
package: "@blip/components"
css: sheet.css
element: blip-sheet
react: Sheet
status: beta
equivalents:
  shadcn: Drawer
  apg: dialog-modal
  html: '<dialog>'
---

# Bottom sheet

A panel that rises from the bottom of the screen and that you can drag: up to see more, down to put it away. For a
route, a list of friends, a level's details, a player: something to look at without leaving the page, on a phone
above all. It is the [drawer](drawer.md)'s bottom side with a grab handle and heights to snap to, so it is a modal
dialog with the dialog's parts, keyboard and events. For a short list of choices, use an
[action sheet](action-sheet.md); for a question that needs an answer, a [dialog](dialog.md).

## Usage

```html
<button class="blip-box blip-button" commandfor="route" command="show-modal">Route</button>

<blip-sheet light-dismiss>
  <dialog class="blip-box blip-drawer blip-sheet" id="route" data-snap="half full" aria-labelledby="route-title">
    <header class="blip-dialog-header">
      <button class="blip-box blip-sheet-handle" type="button" data-variant="ghost" aria-label="Resize"><span></span></button>
      <h2 class="blip-dialog-title" id="route-title">Route</h2>
      <form method="dialog"><button class="blip-box blip-button blip-dialog-close" data-variant="ghost" data-size="sm" data-icon-only aria-label="Close"><span class="blip-icon" data-glyph="close" aria-hidden="true"></span></button></form>
    </header>
    <div class="blip-dialog-body">…</div>
  </dialog>
</blip-sheet>
```

```js
const sheet = document.querySelector("blip-sheet");
sheet.addEventListener("blip-change", (e) => { if (e.detail.value === "full") loadMore(); });
sheet.snap = "full"; // steps up to full height
```

`sheet.css` styles a bottom drawer: load `drawer.css` too, which brings `dialog.css` (the parts and the scrim); `components.css` has all three. It does not import them itself, so loading it after other components never applies the dialog's rules a second time over theirs. Without `<blip-sheet>` the markup is a
bottom drawer as tall as its content: it opens with `showModal()` and closes with Escape, but has no heights and no
dragging. For the safe areas of a phone with a notch, the page needs `viewport-fit=cover` in its viewport meta.

## Anatomy

1. **Sheet**: the drawer's raised candy box, square corners, running a pixel past the screen's bottom and sides so
   only its top edge shows the ink outline. Its content keeps clear of the bottom and side safe areas.
2. **Grab handle** (`.blip-sheet-handle`): a ghost button, 32 x 12 pixels (24 px tall), at the top centre, with a
   16 x 2 pixel grip (the empty `<span>` inside it). As the header's first child it sits in the title bar; without a
   header, put it first in the sheet. It takes the sheet's tone, so its hover well and its on look match the bar.
3. **Title bar, title, close, body, footer**: the dialog's parts. The title bar grows to make room for the handle.
   The body scrolls, with the dialog's cue while there is more below.
4. **Scrim**: the dialog's one-pixel ink checkerboard.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-snap` | `content` (default), `half`, `full`, a percentage such as `70%` | The heights it rests at, listed smallest first (`"half full"`). It opens at the first. `content` is its own height; `half` is half the screen; `full` stops 8 pixels below the top of the screen and its safe area; a percentage is of the screen. No taller than full. |
| `data-tone` | `accent` (default), any tone or candy | The title bar, as on the dialog. |

## States

| State | How | Look |
|---|---|---|
| Opening | `showModal()`, `command="show-modal"`, `open` | Slides up from the bottom in six steps over a glide (160 ms), each a whole pixel-snapped sixth of the sheet; the scrim dithers in. |
| Changing height | the handle, a drag, or `snap` | Settles at the new height in up to six whole-pixel steps, a frame (40 ms) apart. |
| Dragged | a finger, pen or mouse on the handle or the title bar; a finger on the body at its top | Follows the pointer in whole pixels (`data-blip-dragging` on the sheet). Below its lowest height it slides down instead of shrinking. Let go, it settles at the nearest height, or closes from below half its lowest height. A flick (faster than half a pixel a millisecond) goes on to the next height in its direction, and down from the lowest it closes. |
| Expanded | at its tallest height, when it has two or more | The handle is on (`aria-expanded="true"`): it sits in, in the title bar's colour. |
| Closing | with `<blip-sheet>` | Slides back down the same six steps, from wherever it was dragged to. |
| Static | `data-blip-static` with `open` | In the page flow: docs, tests, screenshots only. |

`<blip-sheet>` sets `data-blip-snap` on the sheet to the height it rests at, and the height itself inline. With reduced
motion it does not slide: it appears and goes at once, and changes height at once. Dragging still follows the
pointer, which is the person's own movement.

## Accessibility

Everything in the dialog's accessibility section applies: modal (focus kept inside, page inert), named by its
title, focus returned to the opener, Escape through `blip-before-close`, light dismiss only when nothing is lost.

- **Every drag has a button.** The handle is a real `<button>`, named ("Resize", or "Change height"), so a keyboard,
  a switch or a screen reader can do what a drag does: press it to step to the next height. Closing has Escape, the
  close button and (with `light-dismiss`) the scrim. That is WCAG 2.2's dragging movements (2.5.7).
- **Its state is announced.** With two or more heights the handle says `aria-expanded="true"` at the tallest and
  `"false"` below it. With one height it has nothing to step through: leave the handle out, or keep it for dragging
  and know that pressing it does nothing.
- **Target size.** The handle is 24 px tall and 64 px wide, and drags also start anywhere on the title bar.
- **Gestures.** The title bar and the handle take no browser gestures (`touch-action: none`), so a drag there never
  scrolls the page. The body scrolls as always; only a finger pulling down while it is already at its top moves the
  sheet. A mouse on the body selects text, as it should.

| Key | Does |
|---|---|
| Tab, Shift+Tab | Moves through the sheet's controls only. |
| Enter, Space (on the handle) | Steps to the next height, and from the tallest back to the lowest. |
| Escape | Asks to close (`reason: "escape"`). |

## Content

- Title the sheet for what it holds ("Route", "Friends").
- Put what matters most in the lowest height: many people never drag a sheet up.
- `half full` suits long content; a short sheet needs only its content's height.

## Do and don't

- **Do** give a sheet with heights a handle, and name it.
- **Do** keep a close button or `light-dismiss` as well as the drag down.
- **Don't** put things that drag sideways (sliders, carousels) at the top of the body, where a drag down moves the
  sheet; they work, but a slip moves the sheet instead.
- **Don't** stack a sheet on a sheet.

## API

`<blip-sheet>`: everything [`<blip-dialog>`](dialog.md#api) has (`open`, `light-dismiss`, `show(opener?)`,
`requestClose(value?)`, `close(value?)`, `returnValue`, `dialog`, and the events `blip-open`, `blip-before-close`
(cancelable) and `blip-close`), and:

| Member | |
|---|---|
| `snaps` (read only) | The heights `data-snap` lists, smallest first; `["content"]` when it lists none. |
| `snap` | The height it rests at, by its name. Set while open, it moves there in steps; set while closed, it opens there. |
| `blip-change` | It settled at another height: `detail: { value }`, the height's name. |
| `blip-close` | As the dialog's; `reason` is `"drag"` when it was dragged or flicked closed. |

| Class or property | |
|---|---|
| `.blip-sheet` with `.blip-drawer` on a `<dialog class="blip-box">` | The sheet. |
| `.blip-sheet-handle` on a `<button class="blip-box" data-variant="ghost">` | The grab handle, with an empty `<span>` for its grip. |
| `--blip-r` with `--blip-shape`, `--blip-shape-inner`, or `data-blip-r` | Corner radius (0). |
