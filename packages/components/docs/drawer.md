---
name: Drawer
package: "@jaatster/blip-components"
css: drawer.css
element: blip-drawer
react: Drawer
status: stable
equivalents:
  shadcn: Sheet, Drawer
  apg: dialog-modal
  html: '<dialog>'
---

# Drawer

A side sheet: a modal panel that slides in from the end, the start or the bottom edge, for settings, a map, a
cart, a share sheet. It is a [dialog](dialog.md) that lives at an edge, so it has the dialog's parts, keyboard and
events. For a short choice in the middle of the screen, use a dialog; for something that should stay open while the
page is used, a sidebar.

## Usage

```html
<button class="blip-box blip-button" commandfor="settings" command="show-modal">Settings</button>

<blip-drawer light-dismiss>
  <dialog class="blip-box blip-drawer" id="settings" data-side="end" aria-labelledby="settings-title">
    <header class="blip-dialog-header">
      <h2 class="blip-dialog-title" id="settings-title">Settings</h2>
      <form method="dialog"><button class="blip-box blip-button blip-dialog-close" data-variant="ghost" data-size="sm" data-icon-only aria-label="Close"><span class="blip-icon" data-glyph="close" aria-hidden="true"></span></button></form>
    </header>
    <div class="blip-dialog-body">…</div>
    <footer class="blip-dialog-footer">…</footer>
  </dialog>
</blip-drawer>
```

`drawer.css` includes `dialog.css` (the parts). `<blip-drawer>` has the same API as `<blip-dialog>`.

## Anatomy

1. **Sheet**: a candy box, raised, square corners. It runs one pixel past the screen on the sides it touches, so
   only its inner edge shows the ink outline. A sheet on the left edge casts its two-pixel drop onto the page.
2. **Title bar, title, close, body, footer**: the dialog's parts (`.blip-dialog-header` and so on). The body scrolls,
   with the dialog's cue while there is more below: an ink rule over the footer and a dithered fade.
3. **Scrim**: the dialog's one-pixel ink checkerboard.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-side` | `end` (default), `start`, `bottom` | End for settings and details, start for navigation, bottom for share sheets and pickers on phones. End and start follow the text: the right and the left edge in left-to-right text, the left and the right in right-to-left text (`dir="rtl"`), and the sheet slides in from its own edge. |
| `data-size` | `sm` (128 pixels), `md` (160, default), `lg` (224) | Width of a side sheet; a bottom sheet is as tall as its content, up to 85% of the screen. |
| `data-tone` | `accent` (default), any tone or candy | The title bar. |

## States

| State | How | Look |
|---|---|---|
| Opening | `showModal()`, `command="show-modal"`, `open` | Slides in from its edge in six steps over a glide (160 ms), each a whole pixel-snapped sixth of the sheet; the scrim dithers in. |
| Closing | with `<blip-drawer>` | Slides back out the same six steps. |
| Static | `data-blip-static` with `open` | In the page flow: docs, tests, screenshots only. |

With reduced motion it appears and goes at once.

## Accessibility

Everything in the dialog's accessibility section applies: modal (focus kept inside, page inert), named by its
title, focus returned to the opener, Escape through `blip-before-close`, light dismiss only when nothing is lost.

| Key | Does |
|---|---|
| Tab, Shift+Tab | Moves through the sheet's controls only. |
| Escape | Asks to close (`reason: "escape"`). |
| Enter, Space | Presses the focused control. |

## Content

- Title the sheet for what it holds ("Settings", "World map").
- Settings that apply at once (switches) need no Save button; a "Done" closes it.

## Do and don't

- **Do** open a drawer from a button whose label matches the title.
- **Do** use the bottom sheet on narrow screens for short choices.
- **Don't** stack a drawer on a drawer.
- **Don't** use a drawer for primary navigation on wide screens: a sidebar stays put.

## API

`<blip-drawer>`: `open`, `light-dismiss`, `show(opener?)`, `requestClose(value?)`, `close(value?)`, `returnValue`,
`dialog` (read only), and the events `blip-open`, `blip-before-close` (cancelable) and `blip-close`, exactly as
[`<blip-dialog>`](dialog.md#api).

| Class or property | |
|---|---|
| `.blip-drawer` on a `<dialog class="blip-box">` | The sheet. |
| `--blip-r` with `--blip-shape`, `--blip-shape-inner`, or `data-blip-r` | Corner radius (0). |
