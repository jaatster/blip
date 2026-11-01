---
name: Action button
package: "@jaatster/blip-components"
css: fab.css
element: chu-fab
react: Fab
status: beta
equivalents:
  apg: menu-button
---

# Action button

A screen's one main action, as a candy block floating at the bottom end of a phone screen: New message, Add level,
Start a run. It stays put while the screen scrolls under it. With `<chu-fab>` it can open a speed dial: two or three
labelled mini buttons that step up above it.

Use it for the one thing people come to the screen to do, when that is making something new. Most screens have no
action button: when the main action belongs to one item, or there are several of equal weight, use buttons in the
content or the [top bar](top-bar.md)'s actions.

## Usage

```html
<button class="chu-box chu-fab" type="button" data-icon-only aria-label="New level"><svg class="chu-icon" …></svg></button>
<button class="chu-box chu-fab" type="button"><svg class="chu-icon" …></svg>New level</button>
```

It floats 8 pixels in from the bottom and end edges of the screen, inside the safe areas (the home indicator, and
the notch in landscape). Put it after a [bottom bar](bottom-bar.md) (`.chu-bottom-bar ~ .chu-fab`) and it floats
clear above the bar; where the bar steps aside for a sidebar (`data-collapse="auto"` in a wide shell), it comes back
down. Anything else it must clear, set `--chu-fab-offset`:

```css
.player-screen { --chu-fab-offset: calc(40 * var(--chu-pixel)); } /* above a mini player */
```

### Speed dial

```html
<chu-fab class="chu-fab-dial">
  <button class="chu-box chu-fab" type="button" data-icon-only aria-label="Add">…</button>
  <div class="chu-fab-menu" role="menu" aria-label="Add" hidden>
    <button class="chu-box chu-fab-action" type="button" role="menuitem"><svg class="chu-icon" …></svg>Screenshot</button>
    <button class="chu-box chu-fab-action" type="button" role="menuitem"><svg class="chu-icon" …></svg>Clip</button>
    <button class="chu-box chu-fab-action" type="button" role="menuitem"><svg class="chu-icon" …></svg>Voice note</button>
  </div>
</chu-fab>
```

`<chu-fab>` (from `@jaatster/blip-elements/fab.js`) makes the button a menu button: it opens and closes the stack, moves
focus into it and back, and closes it on Escape, Tab, a press outside or a choice. The first item sits nearest the
button and the stack runs upward. Opening, each mini button steps up three pixels into place, a frame after the one
below it (at once with reduced motion). Without the script the button shows and the stack stays hidden, so give the
button something to do without it (a link to a page with the choices) when that matters.

## Anatomy

1. **Button**: `.chu-fab`, a candy box 24 pixels (48 px, the large control size) high, radius 5, with the large
   button's bands. An icon, and a label unless it is `data-icon-only`.
2. **Dial** (speed dial): `<chu-fab class="chu-fab-dial">`. It floats in place of its button and holds the stack.
3. **Stack**: `.chu-fab-menu`, `role="menu"`, above the button, lined up with its end.
4. **Mini buttons**: `.chu-fab-action`, `role="menuitem"`: candy boxes 20 pixels (40 px) high, radius 4, an icon
   and one or two words. Marshmallow unless they take a `data-tone`.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-icon-only` | | Square, one icon. Needs `aria-label` naming the action. Without it the button is extended: an icon and a label, for a screen where the icon alone would not say enough. |
| `data-tone` | `accent` (default), `info`, `success`, `warning`, `danger`, `neutral`, any candy name | The button's candy. Keep the accent unless the action has a meaning (`success` to finish). On a mini button, `danger` for a destructive choice. |
| `data-position` | `fixed` (default), `absolute`, `static` | Where it floats: the bottom end of the screen, of the nearest positioned box (a map, a panel, a phone frame in docs), or nowhere: `static` leaves it in the flow. On the button, or on `<chu-fab>` for a speed dial. |

## States

| State | How | Look |
|---|---|---|
| Hover | pointer | Lifts one pixel inside the white ring with an ink edge. |
| Focus | keyboard | The yellow ring with an ink edge, round the stepped corners. |
| Pressed | `:active` | Sits in its drop. |
| Open | `aria-expanded="true"` (set by `<chu-fab>`) | Stays sat in, bands swapped, while the stack is open. |
| Disabled | `disabled` or `aria-disabled="true"` | Dithered. Prefer hiding the button over showing a disabled one. |

The mini buttons have the same states.

## Accessibility

Follows the WAI-ARIA Authoring Practices Menu Button pattern for the speed dial.

| Key | Does |
|---|---|
| Enter, Space | On the button: opens the stack and focuses its first item, nearest the button; again, closes it. On an item: chooses it, closes the stack and returns focus to the button. |
| ArrowUp, ArrowDown | On the button: opens the stack. In the stack: the next item up or down, as the stack looks, wrapping. |
| Home, End | The item nearest the button, or the one furthest from it. |
| Escape | Closes the stack and returns focus to the button. |
| Tab | Closes the stack and moves on. |

- `<chu-fab>` sets `aria-haspopup="menu"`, `aria-expanded` and `aria-controls` on the button, and takes the items out
  of the tab order (`tabindex="-1"`: the arrow keys move between them). Name the stack (`aria-label`); without a
  name it is named by its button.
- An icon-only button needs an `aria-label` naming the action ("New level"), not the icon ("Plus").
- The button is 48 px square or more, the size of a primary target; mini buttons are 40 px high.
- It floats over content: leave room under the last thing on the screen (padding as tall as the button and its
  offset), so it never covers text or a control for good.
- Taps are not delayed by double-tap zoom (`touch-action: manipulation`); pinch zoom still works.
- Windows high contrast: system colours and a real border, as every box.

## Content

- An extended button's label is a verb and a thing, two or three words: "New level", "Start run". Sentence case;
  CSS sets capitals.
- Mini buttons: one or two words each, and always a label, not just an icon.
- Two or three items in a speed dial. More than that is a menu or a sheet.

## Do and don't

- **Do** keep one action button per screen, for its main action.
- **Do** put it after the bottom bar, so it floats clear of it.
- **Don't** use it for a destructive action, or for navigation.
- **Don't** put a menu of more than three items behind it.

## API

### `<chu-fab>`

| Attribute or property | Type | |
|---|---|---|
| `open` | boolean | The stack is open. Setting it opens (and focuses the first item) or closes it. `"false"` is off. |
| `data-position` | `"fixed"` (default), `"absolute"` or `"static"` | Where it floats (see Variants). |
| `trigger` (read only) | `HTMLElement` | The button: the `.chu-fab` child. |
| `menu` (read only) | `HTMLElement` | The stack: the `[role=menu]` child. |
| `items` (read only) | `HTMLElement[]` | The stack's items, the one nearest the button first. |
| `show()` | method | Opens the stack and focuses its first item. |
| `close()` | method | Closes it; focus goes back to the button if it was in the stack. |

| Event | Detail | |
|---|---|---|
| `chu-action` | `{ item, value }` | An item was chosen, before it runs. `value` is its `data-value`, else its `value`, else its label. Cancelable: `preventDefault()` keeps the stack open. |
| `chu-open` | | The stack opened. |
| `chu-close` | | The stack closed. |

### Custom properties

| Custom property | Default | |
|---|---|---|
| `--chu-fab-offset` | 8 pixels; 40 after a bottom bar | How far above the bottom of the screen (after the safe area) it floats. Set it on the button or an ancestor. |
| `--chu-r` with `--chu-shape`, `--chu-shape-inner` | 5 (mini 4) | Corner radius in pixels. |
| `--chu-band-top`, `--chu-band-bottom` | 5, 4 (mini 3, 3) | Band heights in pixels. |
| `--chu-tone`, `--chu-tone-light`, `--chu-tone-shade`, `--chu-tone-on` | accent (mini: marshmallow) | A custom tone. |
