---
name: Sidebar
package: "@jaatster/blip-components"
css: sidebar.css
element: null
react: Sidebar
status: beta
equivalents:
  shadcn: Sidebar
---

# Sidebar

An app's main navigation down the side: sections under small headings, items with icons and counts, groups that fold
open, and the page you are on sitting in. Folded to a rail it keeps just the icons, and an item shows its name beside
it on hover and focus. It needs no script: groups are `<details>`.

## Usage

```html
<nav class="blip-sidebar" aria-label="Main" data-collapse="auto">
  <h2 class="blip-sidebar-heading" id="nav-live">Live ops</h2>
  <ul class="blip-sidebar-list" role="list" aria-labelledby="nav-live">
    <li><a class="blip-box blip-sidebar-item" data-variant="ghost" href="/" aria-current="page">
      <svg class="blip-icon" viewBox="0 0 12 12" aria-hidden="true">…</svg><span class="blip-sidebar-label">Overview</span></a></li>
    <li><a class="blip-box blip-sidebar-item" data-variant="ghost" href="/players">
      <svg class="blip-icon" …></svg><span class="blip-sidebar-label">Players</span>
      <span class="blip-box blip-sidebar-badge">128</span></a></li>
    <li><details class="blip-sidebar-group" open>
      <summary class="blip-box blip-sidebar-item" data-variant="ghost"><svg class="blip-icon" …></svg><span class="blip-sidebar-label">Levels</span></summary>
      <ul class="blip-sidebar-list" role="list">
        <li><a class="blip-box blip-sidebar-item" data-variant="ghost" href="/levels/1"><span class="blip-sidebar-label">World 1</span></a></li>
      </ul>
    </details></li>
  </ul>
</nav>
```

Add `blip-box` and `data-variant="panel"` to the `nav` for a framed panel; leave them off for a sidebar on the page.

## Anatomy

1. **Sidebar**: `.blip-sidebar`, 120 pixels wide (`--blip-sidebar-width`), with room on its start side for the arrow.
2. **Heading**: `.blip-sidebar-heading`, small upper-case muted text that names the list after it.
3. **Item**: `.blip-sidebar-item`, a ghost box: an icon, the label, an optional badge.
4. **Label**: `.blip-sidebar-label`. It carries the group chevron and the arrow, and names the item on the rail; keep it.
5. **Badge**: `.blip-sidebar-badge`, a soft box with a count; `data-tone` colours it. On the rail, a dot.
6. **Group**: `<details class="blip-sidebar-group">` with the item as its `<summary>`: a pixel chevron at the end that
   turns down when open. Its list is indented.
7. **Arrow** (`data-arrow`): the TV's pointer arrow beside the current page.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-collapsed` | | The rail: icons only, headings become rules, labels show beside an item on hover and focus. |
| `data-collapse="auto"` | | A rail when the `blip-shell` container is under 1024 px; hidden under 600 px, where a bottom bar or the app bar's menu takes over. |
| `data-arrow` | | The pointer arrow beside the current page pokes at it for a few beats, then rests. |
| `--blip-sidebar-width` | 120 pixels | Keep it over 120 px wide: the rail is any sidebar whose content box is under 100 px. |

## States

| State | How | Look |
|---|---|---|
| Hover | pointer | Fills with the sunken surface and shows its outline. On the rail, the label shows beside it. |
| Focus | keyboard | The yellow ring. On the rail, the label shows beside it. |
| Current | `aria-current="page"` | Sits in: an accent-light chip with an ink outline, bold label; the arrow with `data-arrow`. |
| Open group | `<details open>` | The chevron turns down; the group's items show. |
| Disabled | `aria-disabled="true"` (a link without `href`, `role="link"`) | Dithered, muted. |

## Accessibility

| Key | Does |
|---|---|
| Tab | Through the items in order, including group summaries. |
| Enter | Follows a link; on a group summary, opens or closes the group. |
| Space | On a group summary, opens or closes the group. |

- A `nav` landmark with a name (`aria-label`); name each list by its heading (`aria-labelledby`).
- Groups are native disclosures: the summary is announced as a button with its expanded state.
- Open the group that holds the current page, so the current page is always visible.
- On the rail the labels are hidden visually only: every item keeps its name, and the name shows on focus as well as
  hover. Badges keep their text for screen readers (add context: `5<span class="blip-sr-only"> refunds to check</span>`).
- Rail labels reach outside the sidebar, so do not clip a rail (`overflow: hidden`).
- The arrow pokes at most six beats, and not at all with reduced motion.
- Windows high contrast: the current item keeps a border; chevrons and the arrow take the text colour.

## Content

- A rail sits at the start edge of the screen: an item's name shows beside it, over the content, never wider than
  the sidebar (a longer name wraps).
- Item names are nouns, one or two words, sentence case: "Players", "Sales".
- Two to four sections, about five items each. Group long lists rather than scrolling them.
- Counts are numbers; above 999 write "999+".

## Do and don't

- **Do** use the same icons as the bottom bar for the same destinations.
- **Do** give every item an icon if the sidebar can become a rail.
- **Don't** nest groups more than one level.
- **Don't** use a group summary as a link to a page; it only opens the group.

## API

| Custom property | Default | |
|---|---|---|
| `--blip-sidebar-width` | `calc(120 * var(--blip-pixel))` | The open width. |
| `--blip-r` with `--blip-shape`, `--blip-shape-inner` | 3 on items, 2 on badges | Corner radius in pixels. |
| `--blip-tone` and friends on a badge | accent | Or `data-tone`. |

Container names: `blip-sidebar` (the sidebar, for the rail), `blip-shell` (the layout around it, set by you).
