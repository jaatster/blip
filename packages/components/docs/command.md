---
name: Command palette
package: "@jaatster/blip-components"
css: command.css
element: pp-command
react: CommandPalette
status: beta
---

# Command palette

Every page and action one search away: a cream panel over a dithered scrim, a search field, and results in groups.
The result you are on is the yellow FOCUS row; Enter runs it. Give apps with many pages or actions a palette as a
fast path, never as the only path: everything in it should also be reachable from the visible navigation.

## Usage

```html
<button class="pp-box pp-button" data-variant="outline" commandfor="palette" command="show-modal">Search</button>

<pp-command shortcut="mod+k">
  <dialog id="palette" class="pp-box pp-command pp-pop-in" aria-label="Command palette" closedby="any">
    <div class="pp-command-search">
      <svg class="pp-icon" viewBox="0 0 12 12" aria-hidden="true">…</svg>
      <input class="pp-command-input" type="text" aria-label="Search pages and actions" placeholder="Search…">
    </div>
    <div class="pp-command-results" role="listbox" aria-label="Results">
      <div class="pp-command-group" role="group" aria-labelledby="palette-pages">
        <div class="pp-command-heading" id="palette-pages">Pages</div>
        <div class="pp-box pp-command-item" role="option" data-value="/levels" data-keywords="worlds maps">
          <svg class="pp-icon" …></svg><span class="pp-command-label">Levels</span><span class="pp-command-hint">Page</span>
        </div>
      </div>
    </div>
    <p class="pp-command-empty" hidden>Nothing matches. Try a page or an action.</p>
    <p class="pp-sr-only" role="status"></p>
  </dialog>
</pp-command>
```

```js
document.querySelector("pp-command").addEventListener("pp-action", (e) => go(e.detail.value));
```

`<pp-command>` (from `@jaatster/blip-elements/command.js`) makes the field a combobox over the listbox, filters as you
type, moves the active result and opens and closes the palette on Ctrl+K (Cmd+K on a Mac). The dialog itself is native:
it traps focus, closes on Escape and gives focus back to whatever had it.

## Anatomy

1. **Scrim**: an ink dither over the page (`::backdrop`), never a translucent wash.
2. **Panel**: `.pp-command`, a cream box near the top of the screen. It pops in: a pixel low for a frame, then in place.
3. **Search**: `.pp-command-search`, an icon and the field (`.pp-command-input`), over a one-pixel rule.
4. **Results**: `.pp-command-results`, `role="listbox"`, scrolling; groups (`role="group"`) with a heading.
5. **Result**: a box that is just its text at rest and the yellow FOCUS row when active: icon, label
   (`.pp-command-label`), a quiet hint (`.pp-command-hint`), keycaps at the end (`.pp-command-shortcut`).
6. **Empty state**: `.pp-command-empty`, shown when nothing matches. **Status**: a `role="status"` line that announces
   the count.
7. **Footer** (optional): `.pp-command-footer`, keycap hints for the keys.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `shortcut` on `pp-command` | `mod+k` (default), any `ctrl`, `meta`, `alt`, `shift`, `mod` and a key, or `""` for none | `mod` is Cmd on a Mac, Ctrl elsewhere. A bare key (`/`) never fires while someone is typing in a field. |
| `data-keywords` on a result | words | More words the filter matches ("dashboard" finds Overview). |
| `data-value` on a result | text | What `pp-action` reports; the label otherwise. |
| `aria-disabled="true"` on a result | | Dithered, passed by the arrow keys, never runs. Say why in its hint. |

## States

| State | How | Look |
|---|---|---|
| Active result | `aria-selected="true"` (set by the element) | The yellow FOCUS row, as in a menu. |
| Disabled result | `aria-disabled="true"` | Dithered with the sunken colour, muted text. |
| Filtered out | `hidden` (set by the element) | Gone; a group with nothing left goes too. |
| Nothing found | | The empty state shows; the status says "0 results". |

## Accessibility

The field is a combobox (`role="combobox"`, `aria-controls`, `aria-autocomplete="list"`, `aria-activedescendant`)
over a listbox, inside a modal dialog.

| Key | Does |
|---|---|
| Ctrl+K, Cmd+K (or `shortcut`) | Opens the palette with an empty search; closes it when open. |
| Typing | Filters the results; the first match becomes active. |
| ArrowDown, ArrowUp | Next or previous result, wrapping; disabled results are passed. |
| Enter | Runs the active result and closes the palette. |
| Escape | Closes the palette; focus goes back where it was. |

- The focus stays in the field; the active result is `aria-activedescendant`, and the yellow row shows where Enter
  goes. That is why the field has no ring of its own.
- Name the dialog (`aria-label`), the field (`aria-label`, not just a placeholder) and the listbox.
- The status line announces how many results there are as you type.
- `closedby="any"` lets a click on the scrim close it; the element does the same where that is not supported.
- Shortcut keycaps in results are hidden from screen readers.
- Windows high contrast: the active result is outlined in Highlight.

## Content

- Results read like the visible navigation: page names as they appear, actions as verbs ("New level", "Sign out").
- Hints are one word ("Page", "Scheme") or why a result is off ("Finish it first").
- The empty state suggests what to try.

## Do and don't

- **Do** keep pages first and actions second, each in a group with a heading.
- **Do** let the palette open from a visible button too, for people who do not know the shortcut.
- **Don't** take over a shortcut the browser or screen reader relies on.
- **Don't** put things in the palette that cannot be found anywhere else.

## API

### `<pp-command>`

| Attribute, property or method | | |
|---|---|---|
| `shortcut` | attribute | The key that opens it (default `mod+k`). |
| `open` (attribute and property) | boolean | Opens (with an empty search) or closes the palette; reflects whether it is open. |
| `show()` | | Opens it with an empty search. |
| `close()` | | Closes it. |
| `dialog`, `input`, `options` (read only) | | The parts. |

| Event | Detail | |
|---|---|---|
| `pp-action` | `{ item, value }` | A result was chosen (Enter or a click), before it runs. Cancelable: `preventDefault()` keeps the palette open. Bubbles. |
| `pp-open`, `pp-close` | | The palette opened or closed, however it happened. |

Results rendered later (fetched as the person types) get ids and are filtered as they arrive.

A `<button commandfor="…" command="show-modal">` opens the dialog natively; the element starts it with an empty
search either way.

### Custom properties

| Custom property | Default | |
|---|---|---|
| `--pp-r` with `--pp-shape`, `--pp-shape-inner` | 5 on the panel, 3 on results | Corner radius in pixels. |
| `--pp-box-top`, `--pp-box-fill`, `--pp-box-bottom` on `.pp-command` | `--pp-surface-panel` | The panel's colour. |
