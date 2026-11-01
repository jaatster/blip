---
name: Menu
package: "@jaatster/blip-components"
css: menu.css
element: chu-menu
react: Menu
status: beta
equivalents:
  shadcn: Dropdown Menu
  apg: menu-button
---

# Menu

A short list of actions that drops from a button: the TV's Inputs menu, a cream panel with the yellow FOCUS row on the
item you are on. Use a menu for actions and options (Duplicate, Export, Sort by). For links that take you somewhere,
use the app bar's links or a sidebar; for choosing a value in a form, use a select.

## Usage

```html
<chu-menu class="chu-menu">
  <button class="chu-box chu-button" data-variant="soft">Level</button>
  <div class="chu-box chu-menu-list chu-pop-in" role="menu" aria-label="Level" popover>
    <button class="chu-box chu-menu-item" role="menuitem" aria-keyshortcuts="Control+D" data-value="duplicate">
      <svg class="chu-icon" viewBox="0 0 12 12" aria-hidden="true">…</svg>
      <span class="chu-menu-label">Duplicate</span>
      <span class="chu-menu-shortcut" aria-hidden="true"><kbd class="chu-box chu-keycap" data-size="sm">Ctrl</kbd><kbd class="chu-box chu-keycap" data-size="sm">D</kbd></span>
    </button>
    <div class="chu-menu-separator" role="separator"></div>
    <button class="chu-box chu-menu-item" role="menuitemcheckbox" aria-checked="true"><span class="chu-menu-label">Grid</span></button>
    <button class="chu-box chu-menu-item" role="menuitem" data-tone="danger"><span class="chu-menu-label">Delete level</span></button>
  </div>
</chu-menu>
```

The list is a native popover, so it opens above everything and closes on Escape or a click outside. `<chu-menu>`
(from `@jaatster/blip-elements/menu.js`) wires the button, adds the keyboard and returns focus. A submenu is a `chu-menu`
nested in the list, its button a menu item:

```html
<chu-menu class="chu-menu">
  <button class="chu-box chu-menu-item" role="menuitem"><span class="chu-menu-label">Export</span></button>
  <div class="chu-box chu-menu-list chu-pop-in" role="menu" aria-label="Export" popover>…</div>
</chu-menu>
```

## Anatomy

1. **Button**: any button; while its menu is open (`aria-expanded="true"`) it sits in.
2. **Panel**: `.chu-menu-list`, a cream box (`--chu-surface-panel`: cream by day, deep blue at night) with a drop. It
   pops in: one pixel low for a frame, then in place (`.chu-pop-in`).
3. **Item**: a box that is just its text at rest and the yellow FOCUS row (a candy box with glints) when focused.
4. **Label**: `.chu-menu-label`. It carries the check or dot and the submenu chevron; keep it.
5. **Icon** (optional): a 12 x 12 icon before the label.
6. **Shortcut** (optional): `.chu-menu-shortcut`, keycaps from the keycap component, pushed to the end.
7. **Separator**: `.chu-menu-separator`, a dashed pixel line. **Group heading**: `.chu-menu-heading` in a
   `role="group"`.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `role` on an item | `menuitem`, `menuitemcheckbox`, `menuitemradio` | Checkbox items toggle; radio items in a `role="group"` pick one. With any of them, every label gets a gutter, so labels line up. |
| `aria-checked` | `true`, `false` | A check (8 x 5) or a dot (4 x 4) in the gutter. |
| `aria-haspopup="menu"` on an item | | A chevron at its end: it opens a submenu. |
| `data-tone="danger"` on an item | | A destructive item: red text until it is focused. Confirm what it does. |
| `data-align` on `.chu-menu` | `start` (default), `end` | Which edge of its button the menu lines up with: `end` for a "more" button at the end of a row. |

## States

| State | How | Look |
|---|---|---|
| Focus | keyboard, or the pointer (the element moves focus to the item under it) | The yellow FOCUS row: a yellow candy box, ink outline, ink text. It is the focus indicator, so there is no ring. |
| Checked | `aria-checked="true"` | A check, or a dot for radio items. |
| Submenu open | `aria-expanded="true"` on an item | A quiet sunken row while the focus is in the submenu. |
| Disabled | `aria-disabled="true"` | Dithered with the sunken colour, muted text. The arrow keys pass it; clicks do nothing. |
| Button, menu open | `aria-expanded="true"` | The button sits in, bands swapped. |

## Accessibility

Follows the WAI-ARIA Authoring Practices Menu Button pattern.

| Key | Where | Does |
|---|---|---|
| Enter, Space, ArrowDown | button | Opens the menu and focuses the first item. |
| ArrowUp | button | Opens the menu and focuses the last item. |
| ArrowDown, ArrowUp | menu | Next or previous item, wrapping; disabled items are passed. |
| Home, End | menu | First or last item. |
| A letter | menu | The next item whose label starts with it (typeahead). |
| Enter | item | Runs it and closes every open menu; focus goes back to the button. On a checkbox or radio item it also toggles. |
| Space | checkbox or radio item | Toggles it and keeps the menu open. |
| ArrowRight (ArrowLeft right to left) | submenu item | Opens the submenu on its first item. |
| ArrowLeft (ArrowRight right to left), Escape | submenu | Closes the submenu; focus goes back to its item. |
| Escape | menu | Closes it; focus goes back to the button. |
| Tab | menu | Closes it and moves on. |

- The button gets `aria-haspopup="menu"`, `aria-expanded` and `aria-controls`; name the list with `aria-label`.
- Shortcuts are drawn for the eye and hidden from screen readers; announce them with `aria-keyshortcuts` on the item.
- A click outside, or Escape, closes the menu (the popover's light dismiss).
- Yellow means focus: the yellow row is where Enter goes, and nothing else in a menu is yellow.
- The popup appears with a one-frame step, and at once with reduced motion.
- Windows high contrast: the focused item is outlined in Highlight; checks and chevrons take the text colour.

## Content

- Start items with a verb ("Duplicate", "Export as PNG"); sentence case.
- Disabled items say why when they can: "Publish (finish the level first)".
- Keep menus short: about ten items. Group with headings and separators; put the destructive item last.

## Do and don't

- **Do** use `data-value` on items, so code does not depend on the label.
- **Do** keep a submenu to one level.
- **Don't** put links to pages and actions in one menu without a separator between them.
- **Don't** colour items; the danger tone is the only one.

## API

### `<chu-menu>`

| Attribute, property or method | | |
|---|---|---|
| `open` (attribute and property) | boolean | Opens or closes the menu; reflects whether it is open. |
| `show(last?)` | | Opens it and focuses the first item (the last with `true`). |
| `close()` | | Closes it; focus goes back to the button if it was in the menu. |
| `trigger`, `menu`, `items` (read only) | | The button, the list, and this menu's items (not its submenus'). |
| `data-align` | attribute | `start` (default) or `end`: the edge of the button the menu lines up with. |

| Event | Detail | |
|---|---|---|
| `chu-action` | `{ item, value, checked? }` | An item was chosen, before it runs. `value` is its `data-value`, else its `value`, else its label; `checked` is the new state of a checkbox or radio item. Cancelable: `preventDefault()` keeps the menu open and the item unchanged. Bubbles. |
| `chu-open`, `chu-close` | | The menu opened or closed, however it happened. |

Items are read as they are, so items rendered later just work; a button or list rendered after the element is
wired when it arrives.

Placement uses CSS anchor positioning (below the button, flipping above or to the other side when there is no room);
where that is missing, the element measures and places the menu itself.

### Custom properties

| Custom property | Default | |
|---|---|---|
| `--chu-r` with `--chu-shape`, `--chu-shape-inner` | 4 on the list, 3 on items | Corner radius in pixels. |
| `--chu-box-top`, `--chu-box-fill`, `--chu-box-bottom` on `.chu-menu-list` | `--chu-surface-panel` | The panel's colour. |
