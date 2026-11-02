---
name: Swipe rows
package: "@jaatster/blip-components"
css: swipe-row.css
element: blip-swipe-row
react: SwipeRow
status: beta
---

# Swipe rows

A list row that slides aside to show a few actions behind it: Archive at its start, Delete and Flag at its end. On
a touch screen you swipe the row, and its face moves a whole pixel at a time over a sunken tray of candy buttons;
let go past half the actions and it holds open, swipe all the way and the first action runs. With a mouse or a
keyboard, the row's More button opens it, and every action is a real button in the tab order. It goes round a row
of a [list](list.md).

## Usage

```html
<ul class="blip-box blip-list" role="list" data-dividers aria-label="Inbox">
  <li>
    <blip-swipe-row class="blip-swipe-row">
      <div class="blip-swipe-row-face">
        <a class="blip-box blip-list-item" data-variant="ghost" href="/inbox/12">
          <span class="blip-list-content"><span class="blip-list-title" id="msg-12">Pip Bloom</span>…</span>
        </a>
        <button class="blip-box blip-button blip-swipe-row-more" type="button" data-variant="ghost" data-size="sm"
          data-icon-only aria-label="More actions" aria-describedby="msg-12">
          <svg class="blip-icon" viewBox="0 0 12 12" aria-hidden="true">…</svg>
        </button>
      </div>
      <div class="blip-swipe-row-actions" data-side="start">
        <button class="blip-box blip-button" type="button">Archive</button>
      </div>
      <div class="blip-swipe-row-actions" data-side="end">
        <button class="blip-box blip-button" type="button" data-tone="danger">Delete</button>
        <button class="blip-box blip-button" type="button" data-tone="warning">Flag</button>
      </div>
    </blip-swipe-row>
  </li>
</ul>
```

```js
import "@jaatster/blip-elements/swipe-row";
document.querySelector("#delete-12").addEventListener("click", () => removeMessage(12));
```

Each action does its work in its own click handler, so a press, a key and a full swipe all run the same code.

## Anatomy

1. **Row**: `<blip-swipe-row class="blip-swipe-row">`, inside the list's `<li>`. With the element it is a sunken well,
   clipped at its sides while the face is aside.
2. **Face**: `.blip-swipe-row-face`, what the row shows: a `.blip-list-item` (a row of content, or a link or button
   you press), then the More button. It is painted in the list's colour, so it hides the trays.
3. **More**: `.blip-swipe-row-more`, a ghost icon button with three dots, shown where there is a fine pointer.
4. **Trays**: `.blip-swipe-row-actions` with `data-side="start"` or `"end"`, each holding one to three candy
   buttons, as tall as the row.

Before the element runs (no script, or not loaded yet) the trays sit at the row's ends like any buttons, and More
is hidden, so every action still works.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-side` on a tray | `start`, `end` | Where the tray is. Start shows with a swipe towards the end (to the right in left-to-right text), end with a swipe towards the start. They follow the text. |
| `data-tone` on an action | `danger`, `warning`, `info`, `success`, `neutral`, accent (default) | Meaning first: danger for Delete, accent for Archive. |
| `data-size` on an action | `sm` | Shorter labels for a compact list (`data-density="compact"`). |

## States

| State | How | Look |
|---|---|---|
| Closed | no `open` | The face covers the row. |
| Open | `open="start"` or `open="end"` | The face is aside by the tray's width, in whole pixels, and holds there. More's `aria-expanded` is `"true"`. |
| Dragging | `data-blip-dragging` (set by the element) | The face follows the finger a pixel at a time; text cannot be selected. |
| Aside | `data-blip-moved="start"` or `"end"` (set by the element) | The face narrows off that side's tray (its title, description and end text end in an ellipsis rather than wrap into a sliver), and the tray lies over the other. Right to left it mirrors. |
| Full swipe | `data-blip-full="start"` or `"end"` (set by the element) | Past 60% of the row: the side's first action stretches across the tray, and letting go runs it. |
| Focus | keyboard | An action that gets focus opens its side, with the yellow ring; the face's own focus closes the row. |
| Hover, pressed, disabled | from the buttons | The candy box's own looks. A disabled action is skipped by a full swipe. |

The face snaps open or shut in up to four whole-pixel frames, and at once with reduced motion.

## Accessibility

- Every action is a real, named `<button>`, always in the tab order. Focusing one opens its side, so nothing that
  can be focused stays hidden; focus leaving the row closes it.
- More is a button named "More actions", described by the row's title (`aria-describedby`), with `aria-expanded`
  kept in step by the element. It shows where there is a fine pointer (`any-pointer: fine`), for a mouse, a
  trackpad and the keyboard that comes with them. On a touch-only screen it is hidden (`display: none`, so it is
  not focusable either) and the swipe or the actions themselves are the way in.
- Name repeated actions by their row when the label alone would be ambiguous: `aria-describedby` pointing at the
  title, as More does.
- The page keeps scrolling: the row sets `touch-action: pan-y`, so vertical swipes stay the browser's, and a
  swipe only takes the row once it has gone a few pixels more across than along.
- A mouse never drags the row: it uses More. Pen and touch swipe.
- A full swipe sends a cancelable `blip-swipe` first: confirm a destructive one, or refuse it, there. Prefer an
  undo (a [toast](toast.md) with an Undo button) over a question for Delete.
- Windows high contrast: the well and the face are the system canvas; the buttons keep their system borders.

| Key | Action |
|---|---|
| Tab | Moves through the face, More, then the start actions and the end actions; each opens its side |
| Enter, Space | On More: opens the row (the end, or the start when the end has none), or closes it. On an action: runs it, and the row closes |
| Escape | Closes the row; focus goes back to More |

## Content

- One to three actions a side, one or two words each ("Archive", "Delete", "Mark read"), with an icon if you like.
- Put the action a full swipe should run first in its tray.
- Use the same actions in the same places on every row of a list.

## Do and don't

- **Do** keep the actions available elsewhere too (on the item's page, or in a menu) for people who never swipe.
- **Do** use danger only for destructive actions, and let people undo them.
- **Don't** put a swipe row inside something that scrolls sideways or a pager: the two swipes fight.
- **Don't** hide the only way to do something in a swipe.

## API

### `<blip-swipe-row>`

| Attribute, property or method | | |
|---|---|---|
| `open` (attribute and property) | `"start"`, `"end"` or none | The side that shows. Setting it opens that side (closing any other open row in the list) or closes the row. Reflects the row. |
| `show(side?)` | | Opens a side: the end by default, or the start when the end has no actions. |
| `close()` | | Closes the row. |

| Event | Detail | |
|---|---|---|
| `blip-open` | `{ side }` | The row opened on a side, however it happened. |
| `blip-close` | | The row closed. |
| `blip-swipe` | `{ side, action }` | A full swipe, before the side's first action runs (the element clicks it). Cancelable: `preventDefault()` runs nothing and leaves the row open. Bubbles. |

One row in a list is open at a time, and a press anywhere else closes it. A press on the face of an open row closes
it rather than following its link.

### Custom properties

| Custom property | Default | |
|---|---|---|
| `--blip-swipe-row-face` | the list's fill (`--blip-box-fill`), else `--blip-bg` | The face's colour; set it when the row sits on something else. |
