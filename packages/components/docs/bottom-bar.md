---
name: Bottom bar
package: "@jaatster/blip-components"
css: bottom-bar.css
element: null
react: BottomBar
status: beta
---

# Bottom bar

The phone's way round an app: three to five destinations, an icon over a label, the current one sitting in. A panel
that sticks to the bottom of the screen, clear of the home indicator. In a wide shell it steps aside for the sidebar
and the app bar.

## Usage

```html
<nav class="blip-box blip-bottom-bar" aria-label="Main" data-collapse="auto">
  <ul class="blip-bottom-bar-list" role="list">
    <li><a class="blip-box blip-bottom-bar-item" data-variant="ghost" href="/" aria-current="page">
      <svg class="blip-icon" viewBox="0 0 12 12" aria-hidden="true">…</svg><span class="blip-bottom-bar-label">Today</span></a></li>
    <li><a class="blip-box blip-bottom-bar-item" data-variant="ghost" href="/inbox">
      <svg class="blip-icon" …></svg><span class="blip-bottom-bar-label">Inbox</span>
      <span class="blip-box blip-bottom-bar-badge" data-tone="danger">3<span class="blip-sr-only"> new</span></span></a></li>
  </ul>
</nav>
```

Put it last in the page (or in the app shell), after the content: it sticks to the foot of the screen with
`position: sticky`, so it never covers the end of the page.

## Anatomy

1. **Bar**: `.blip-bottom-bar`, a surface panel with stepped corners, floating a few pixels above the bottom edge and the
   safe area.
2. **Item**: `.blip-bottom-bar-item`, a ghost box as wide as its label plus an even share of the room left: a 12 x 12
   icon over a small upper-case label, set tight (no tracking) so five fit across a 320 px phone.
3. **Label**: `.blip-bottom-bar-label`, cut with an ellipsis only if the labels cannot fit even so.
4. **Badge**: `.blip-bottom-bar-badge`, a small candy box on the icon's corner with a count; empty or `data-dot`, a dot.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-collapse="auto"` | | Hidden when the `blip-shell` container is 600 px or wider, where the sidebar or the app bar takes over. |
| `data-tone` on a badge | any tone (accent default) | `danger` for things that need attention. |
| `data-dot` on a badge | | A dot instead of a count ("something new"). Keep words for screen readers inside. |

## States

| State | How | Look |
|---|---|---|
| Hover | pointer | Fills with the sunken surface and shows its outline. |
| Focus | keyboard | The yellow ring. |
| Current | `aria-current="page"` | Sits in: an accent-light chip, ink label (the others are muted). |

## Accessibility

| Key | Does |
|---|---|
| Tab | Through the items. |
| Enter | Follows the link. |

- A `nav` landmark with a name. When it shares the page with a sidebar for the same destinations, give them the same
  name; `data-collapse="auto"` shows only one at a time.
- Every item has a visible label; icons are decorative (`aria-hidden="true"`).
- Badges add words for screen readers: `3<span class="blip-sr-only"> new</span>`.
- Items are at least 26 pixels high and share the width: generous touch targets.
- Windows high contrast: the current item keeps a border, the others none.

## Content

- When five labels do not fit, the short ones keep their width and the long ones share what is left, cut short with
  an ellipsis as the last resort.
- Three to five destinations; one word each, sentence case (CSS sets upper case). Five words of up to eight letters
  fit at 320 px ("Overview", "Activity"); longer words, as in German, fit five across from 360 px, or four at 320.
- The same icons and names as the sidebar.

## Do and don't

- **Do** keep the bar for top-level destinations; actions belong in the page.
- **Don't** hide labels to fit more items: use fewer items.
- **Don't** change the bar's items from page to page.

## API

| Custom property | Default | |
|---|---|---|
| `--blip-r` with `--blip-shape`, `--blip-shape-inner` | 5 on the bar, 4 on items | Corner radius in pixels. |
| `--blip-box-top`, `--blip-box-fill`, `--blip-box-bottom` | `--blip-surface` | The bar's colour. |

Container name: `blip-shell` (the layout around it, set by you).
