---
name: Command palette
package: "@blip/components"
css: command.css
element: blip-command
react: CommandPalette
status: beta
equivalents:
  shadcn: Command
  apg: combobox
---

# Command palette

Every page and action one search away: a cream panel over a dithered scrim, a search field, and results in groups.
The result you are on is the yellow FOCUS row; Enter runs it. Give apps with many pages or actions a palette as a
fast path, never as the only path: everything in it should also be reachable from the visible navigation.

## Usage

```html
<button class="blip-box blip-button" data-variant="outline" commandfor="palette" command="show-modal">Search</button>

<blip-command shortcut="mod+k">
  <dialog id="palette" class="blip-box blip-command blip-pop-in" aria-label="Command palette" closedby="any">
    <div class="blip-command-search">
      <svg class="blip-icon" viewBox="0 0 12 12" aria-hidden="true">…</svg>
      <input class="blip-command-input" type="text" aria-label="Search pages and actions" placeholder="Search…">
    </div>
    <div class="blip-command-results" role="listbox" aria-label="Results">
      <div class="blip-command-group" role="group" aria-labelledby="palette-pages">
        <div class="blip-command-heading" id="palette-pages">Pages</div>
        <div class="blip-box blip-command-item" role="option" data-value="/levels" data-keywords="worlds maps">
          <svg class="blip-icon" …></svg><span class="blip-command-label">Levels</span><span class="blip-command-hint">Page</span>
        </div>
      </div>
    </div>
    <p class="blip-command-empty" hidden>Nothing matches. Try a page or an action.</p>
    <p class="blip-sr-only" role="status"></p>
  </dialog>
</blip-command>
```

```js
document.querySelector("blip-command").addEventListener("blip-action", (e) => go(e.detail.value));
```

`<blip-command>` (from `@blip/elements/command.js`) makes the field a combobox over the listbox, filters as you
type, moves the active result and opens and closes the palette on Ctrl+K (Cmd+K on a Mac). The dialog itself is native:
it traps focus, closes on Escape and gives focus back to whatever had it.

## Anatomy

1. **Scrim**: an ink dither over the page (`::backdrop`), never a translucent wash.
2. **Panel**: `.blip-command`, a cream box near the top of the screen. It pops in: a pixel low for a frame, then in place.
3. **Search**: `.blip-command-search`, an icon and the field (`.blip-command-input`), over a one-pixel rule.
4. **Results**: `.blip-command-results`, `role="listbox"`, scrolling; groups (`role="group"`) with a heading.
5. **Result**: a box that is just its text at rest and the yellow FOCUS row when active: icon, label
   (`.blip-command-label`), a quiet hint (`.blip-command-hint`), keycaps at the end (`.blip-command-shortcut`).
6. **Empty state**: `.blip-command-empty`, shown when nothing matches. **Status**: a `role="status"` line that announces
   the count.
7. **Footer** (optional): `.blip-command-footer`, keycap hints for the keys.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `shortcut` on `blip-command` | `mod+k` (default), any `ctrl`, `meta`, `alt`, `shift`, `mod` and a key, or `""` for none | `mod` is Cmd on a Mac, Ctrl elsewhere. A bare key (`/`) never fires while someone is typing in a field. |
| `data-keywords` on a result | words | More words the filter matches ("dashboard" finds Overview). |
| `data-value` on a result | text | What `blip-action` reports; the label otherwise. |
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

### `<blip-command>`

| Attribute, property or method | | |
|---|---|---|
| `shortcut` | attribute | The key that opens it (default `mod+k`). |
| `open` (attribute and property) | boolean | Opens (with an empty search) or closes the palette; reflects whether it is open. |
| `show()` | | Opens it with an empty search. |
| `close()` | | Closes it. |
| `dialog`, `input`, `options` (read only) | | The parts. |

| Event | Detail | |
|---|---|---|
| `blip-action` | `{ item, value }` | A result was chosen (Enter or a click), before it runs. Cancelable: `preventDefault()` keeps the palette open. Bubbles. |
| `blip-open`, `blip-close` | | The palette opened or closed, however it happened. |

Results rendered later (fetched as the person types) get ids and are filtered as they arrive.

A `<button commandfor="…" command="show-modal">` opens the dialog natively; the element starts it with an empty
search either way.

### Custom properties

| Custom property | Default | |
|---|---|---|
| `--blip-r` with `--blip-shape`, `--blip-shape-inner` | 5 on the panel, 3 on results | Corner radius in pixels. |
| `--blip-box-top`, `--blip-box-fill`, `--blip-box-bottom` on `.blip-command` | `--blip-surface-panel` | The panel's colour. |
