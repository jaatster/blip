---
name: Button group
package: "@jaatster/blip-components"
css: button-group.css
element: null
react: ButtonGroup
status: beta
equivalents:
  shadcn: Button Group, Toggle Group
---

# Button group

Buttons that belong together. Spaced, they are a row of related actions ("Save game", "Save as…", "Cancel"). Attached,
they are one bar that shares its outlines: square where the buttons meet, rounded only at the two ends. Use attached
groups for sets of toggles, a pager, or a main action with its menu button.

## Usage

```html
<div class="pp-button-group" role="group" aria-label="Save">
  <button class="pp-box pp-button">Save game</button>
  <button class="pp-box pp-button" data-variant="soft">Save as…</button>
</div>

<div class="pp-button-group" data-attached role="group" aria-label="Text">
  <button class="pp-box pp-button" data-variant="outline" aria-pressed="true">Bold</button>
  <button class="pp-box pp-button" data-variant="outline" aria-pressed="false">Italic</button>
</div>
```

## Anatomy

1. **Group**: a flex row; spaced groups wrap, attached groups don't.
2. **Buttons**: ordinary `.pp-button`s, every tier, tone and size.
3. **Joints** (attached): neighbours overlap by one pixel, so they share one ink line; the corners that meet are
   square, the outer corners take radius 3 from the box's own stepped tiles.
4. **Separator** (optional): a `<span role="separator">` draws a one-pixel soft line between sets.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-attached` | | One bar with shared outlines. Give every button the same `data-size`. |
| `data-width="full"` | | Fills its container; the buttons share the width (answers, mobile footers). |
| (on the buttons) | any button attribute | Tiers, tones and sizes as for [Button](button.md). In a toolbar, use the calm tiers (`outline`, `ghost`) and keep candy for one main action. |

## States

Every button keeps its own states (hover lifts, pressed sits in its drop, `aria-pressed="true"` sits in with its
bands swapped, focus is the yellow ring, disabled is dithered). In an attached group the button being used is drawn
over its neighbours, so its outline, lift and ring stay whole.

## Accessibility

- Give the group `role="group"` and an `aria-label` when its buttons only make sense together ("Text style",
  "Zoom"). A pager is a `<nav aria-label="…">` with links; mark the current page `aria-current="page"`.
- Buttons whose label is a symbol ("−", "+") need an `aria-label` ("Zoom out").
- Toggles in a group are separate `aria-pressed` buttons. When only one may be on, use a
  [segmented control](segmented.md) instead: it is a radio group.
- **Toolbars.** `role="toolbar"` promises arrow-key movement: one button is in the tab order and the arrows move
  between them. Wire it with the shared controller from `@jaatster/blip-core`:

  ```js
  import { rovingFocus } from "@jaatster/blip-core";
  const bar = document.querySelector('[role="toolbar"]');
  rovingFocus(bar, { items: () => [...bar.querySelectorAll("button")] });
  ```

  Without that script, use `role="group"`: every button stays in the tab order.
- Windows high contrast: each button gets its system border; joints overlap by one CSS pixel.

| Key | In a group | In a toolbar (with rovingFocus) |
|---|---|---|
| Tab | Moves to the next button | Moves into the toolbar, then out of it |
| Left / Right Arrow | | Previous / next button (wraps) |
| Home / End | | First / last button |
| Enter, Space | Presses the button | Presses the button |

## Content

- Keep labels short and parallel: "Slow, Normal, Fast", not "Slow, Normal speed, Make it fast".
- Two to five buttons. More than that wants a menu or a select.

## Do and don't

- **Do** attach toggles that belong together (Bold, Italic, Wavy) and give the group a name.
- **Do** use one candy button at most; the rest soft, outline or ghost.
- **Don't** mix sizes in one attached group.
- **Don't** attach unrelated actions just to save space.

## API

| Custom property | Default | |
|---|---|---|
| `--pp-r`, `--pp-shape`, `--pp-shape-inner` on the buttons | set by the group | Attached groups set these per position; don't override them on attached buttons. |
| `gap` (plain CSS) | 4 pixels | Spacing in spaced groups. |
