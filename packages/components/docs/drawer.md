---
name: Drawer
package: "@jaatster/blip-components"
css: drawer.css
element: pp-drawer
react: Drawer
status: stable
---

# Drawer

A side sheet: a modal panel that slides in from the right, the left or the bottom edge, for settings, a map, a
cart, a share sheet. It is a [dialog](dialog.md) that lives at an edge, so it has the dialog's parts, keyboard and
events. For a short choice in the middle of the screen, use a dialog; for something that should stay open while the
page is used, a sidebar.

## Usage

```html
<button class="pp-box pp-button" commandfor="settings" command="show-modal">Settings</button>

<pp-drawer light-dismiss>
  <dialog class="pp-box pp-drawer" id="settings" data-side="right" aria-labelledby="settings-title">
    <header class="pp-dialog-header">
      <h2 class="pp-dialog-title" id="settings-title">Settings</h2>
      <form method="dialog"><button class="pp-box pp-button pp-dialog-close" data-variant="ghost" data-size="sm" data-icon-only aria-label="Close"><span class="pp-icon" data-glyph="close" aria-hidden="true"></span></button></form>
    </header>
    <div class="pp-dialog-body">…</div>
    <footer class="pp-dialog-footer">…</footer>
  </dialog>
</pp-drawer>
```

`drawer.css` includes `dialog.css` (the parts). `<pp-drawer>` has the same API as `<pp-dialog>`.

## Anatomy

1. **Sheet**: a candy box, raised, square corners. It runs one pixel past the screen on the sides it touches, so
   only its inner edge shows the ink outline. A left sheet casts its two-pixel drop onto the page.
2. **Title bar, title, close, body, footer**: the dialog's parts (`.pp-dialog-header` and so on). The body scrolls.
3. **Scrim**: the dialog's one-pixel ink checkerboard.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-side` | `right` (default), `left`, `bottom` | Right for settings and details, left for navigation, bottom for share sheets and pickers on phones. |
| `data-size` | `sm` (128 pixels), `md` (160, default), `lg` (224) | Width of a side sheet; a bottom sheet is as tall as its content, up to 85% of the screen. |
| `data-tone` | `accent` (default), any tone or candy | The title bar. |

## States

| State | How | Look |
|---|---|---|
| Opening | `showModal()`, `command="show-modal"`, `open` | Slides in from its edge in six steps over a glide (160 ms), each a whole pixel-snapped sixth of the sheet; the scrim dithers in. |
| Closing | with `<pp-drawer>` | Slides back out the same six steps. |
| Static | `data-pp-static` with `open` | In the page flow: docs, tests, screenshots only. |

With reduced motion it appears and goes at once.

## Accessibility

Everything in the dialog's accessibility section applies: modal (focus kept inside, page inert), named by its
title, focus returned to the opener, Escape through `pp-before-close`, light dismiss only when nothing is lost.

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

`<pp-drawer>`: `open`, `light-dismiss`, `show(opener?)`, `requestClose(value?)`, `close(value?)`, `returnValue`, and
the events `pp-open`, `pp-before-close` (cancelable) and `pp-close`, exactly as [`<pp-dialog>`](dialog.md#api).

| Class or property | |
|---|---|
| `.pp-drawer` on a `<dialog class="pp-box">` | The sheet. |
| `--pp-r` with `--pp-shape`, `--pp-shape-inner`, or `data-pp-r` | Corner radius (0). |
