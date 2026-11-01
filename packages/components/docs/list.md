---
name: List
package: "@jaatster/blip-components"
css: list.css
element: null
react: List
status: stable
equivalents:
  shadcn: Item
---

# List

Rows of things: settings, players, files, menu sections. Each row can have a leading icon or avatar, a title with a
line of description, and meta text or controls at its end. Lists are calm: a white panel, line-soft dividers, and
ghost boxes for rows you press, so candy stays for the actions inside them.

## Usage

```html
<ul class="chu-box chu-list" role="list" data-dividers aria-label="Settings">
  <li class="chu-list-item">
    <svg class="chu-icon" viewBox="0 0 12 12" aria-hidden="true">…</svg>
    <div class="chu-list-content">
      <span class="chu-list-title" id="set-music">Music</span>
      <span class="chu-list-description">Chip tunes on the title screen</span>
    </div>
    <div class="chu-list-end">
      <span class="chu-box chu-switch"><input type="checkbox" role="switch" class="chu-box" aria-labelledby="set-music" checked></span>
    </div>
  </li>
</ul>

<nav aria-label="Settings sections">
  <ul class="chu-box chu-list" role="list">
    <li><a class="chu-box chu-list-item" data-variant="ghost" href="/settings/general" aria-current="page">…</a></li>
  </ul>
</nav>
```

## Anatomy

1. **List**: `<ul>` or `<ol>` with `.chu-list`; add `.chu-box` for the white panel round it.
2. **Row**: `.chu-list-item`, on the `<li>` (a row of content), or on the `<a>`/`<button>` inside it (a row you press).
3. **Leading** (optional): an icon, avatar or picture, first in the row.
4. **Content**: `.chu-list-content` with `.chu-list-title` and `.chu-list-description`.
5. **End** (optional): `.chu-list-end`, meta text (tabular digits) or controls: a switch, a tag, a keycap, a chevron.
6. **Dividers** (optional): one line-soft pixel between rows.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `.chu-box` on the list | `data-variant`: `panel`, white (default), `soft`, `outline` | The list in a panel. A soft list gives what sits on it the light roles (the tone's ink for text, links and lines), so it reads in every scheme. |
| `data-dividers` | | A line between rows. Use for content rows; pressable rows read fine without. |
| `data-density` | `compact` | Tighter rows (14 pixels min), smaller text: long lists, side panels. |
| Row tier | `data-variant="ghost"` on a pressable row | Required on `<a>`/`<button>` rows: quiet at rest, filled on hover. |

## States

| State | How | Look |
|---|---|---|
| Hover | pointer, on a pressable row | The sunken well with a line outline (from the ghost box). |
| Focus | keyboard | The well plus the yellow ring. |
| Current | `aria-current="page"` (navigation), or `aria-selected`/`aria-pressed` in a widget | The tone's light fill with an ink outline; all text in the row goes ink. |
| Disabled | `disabled` or `aria-disabled="true"` | Dithered, muted. |

## Accessibility

- Keep the list a list: `role="list"` restores list semantics that `list-style: none` removes in Safari.
- A pressable row is one real `<a>` (going somewhere) or `<button>` (doing something); its name is its title and
  description. Mark the page you're on with `aria-current="page"`.
- A row of content may hold controls; name each one by the row's title (`aria-labelledby`). Never put a control
  inside a pressable row.
- Icons are `aria-hidden`; avatars without an image carry `role="img"` and a name.
- Keyboard: Tab moves between pressable rows and controls; Enter (and Space for buttons) activates.

## Content

- Titles of a few words; one line of description at most.
- Meta at the end: short facts ("60%", "2 min ago", a score), not sentences.

## Do and don't

- **Do** put the setting's control at the end of its row, named by the row.
- **Do** use a chevron at the end of a row that goes somewhere.
- **Don't** make a whole row pressable and give it a button too.
- **Don't** mix pressable and plain rows in one list.

## API

| Class | |
|---|---|
| `.chu-list` | The list. |
| `.chu-list-item`, `.chu-list-content`, `.chu-list-title`, `.chu-list-description`, `.chu-list-end` | Parts. |

| Custom property | Default | |
|---|---|---|
| `--chu-r` with `--chu-shape`, `--chu-shape-inner` | 3 | The pressable row's corner radius. |
