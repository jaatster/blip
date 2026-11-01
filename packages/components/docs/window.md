---
name: Window
package: "@blip/components"
css: window.css
element: null
react: Window
status: stable
---

# Window

A pixel window: a cream panel whose top band is the title bar, a Pixel Bop title, small candy controls, a body and
an optional sunken status bar. For game menus, pause screens and retro dashboards. It does not drag.

## Usage

```html
<section class="blip-box blip-window" aria-labelledby="sys-title">
  <header class="blip-window-bar">
    <h2 class="blip-window-title blip-display blip-pop" id="sys-title">System</h2>
    <div class="blip-window-controls">
      <button class="blip-box blip-window-control" data-control="minimize" type="button" aria-label="Minimize System"><span></span></button>
      <button class="blip-box blip-window-control" data-control="maximize" type="button" aria-label="Maximize System"><span></span></button>
      <button class="blip-box blip-window-control" data-control="close" type="button" aria-label="Close System"><span></span></button>
    </div>
  </header>
  <div class="blip-window-body">…</div>
  <footer class="blip-window-status"><span>Ready</span><span>12:30</span></footer>
</section>
```

## Anatomy

1. **Panel**: the candy box, radius 4, cream body (`--blip-surface-panel`), ink outline, drop.
2. **Title bar**: the box's own light band, 16 pixels with its ink rule, in the tone's light colour; it follows the
   stepped corners and keeps the box's glints.
3. **Title**: `.blip-window-title`, Pixel Bop at scale 1 (with `.blip-display`), POP with `.blip-pop`.
4. **Controls**: `.blip-window-control`, 12-pixel candy buttons (24 CSS px): cream, and red to close. The glyph is an
   empty span, drawn from `data-control`.
5. **Body**: `.blip-window-body`, padded, scrolls if the window has a height.
6. **Status bar** (optional): `.blip-window-status`, the box's shade band, sunken, 14 pixels with an ink rule, one line.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-tone` | `accent` (default), any tone or candy | The title bar's colour: `success` for done, `warning` for a heads-up, `danger` for an error. |
| `data-control` | `close`, `minimize`, `maximize` | The control's glyph. Close is red unless given a tone. |
| `data-variant` | cream panel (default), `soft`, `candy` | A whole-window tint, for a small game dialog. What sits on it takes the light roles (the tone's ink for text, links and lines; white fields), so it reads in every scheme. |

## States

The window has none. Its controls take the box's states: hover lifts, pressed sits in, focus is the yellow ring.

## Accessibility

- A window is a region of the page: a `<section>` named by its title (`aria-labelledby`). If it is modal, use a
  `<dialog>` with the dialog component and put the window's classes inside.
- Controls are real buttons named for what they do to which window: "Close System", not "X".
- The controls do what they say: wire them up (hide, collapse the body, enlarge) or leave them out.
- Status bar text is plain text; if it updates (a save, a clock), give it `role="status"` so changes are announced.
- Windows high contrast: system borders round the panel, the bar's rule and the status rule.

## Content

- Titles of one or two words, upper case from Pixel Bop: "System", "Paused", "Saved".
- One line in the status bar, two pieces at most (left and right).

## Do and don't

- **Do** use windows for game menus and dashboards where the retro frame helps.
- **Don't** use a window for every panel in an app: a card is calmer.
- **Don't** add controls that do nothing.

## API

| Class | |
|---|---|
| `.blip-window` | The panel. Use with `.blip-box`. |
| `.blip-window-bar`, `.blip-window-title`, `.blip-window-controls`, `.blip-window-control`, `.blip-window-body`, `.blip-window-status` | Parts. |

| Custom property | Default | |
|---|---|---|
| `--blip-r` with `--blip-shape`, `--blip-shape-inner` | 4 | Corner radius. |
| `--blip-tone`, `--blip-tone-light`, `--blip-tone-shade`, `--blip-tone-on` | accent | A custom title bar colour. |
