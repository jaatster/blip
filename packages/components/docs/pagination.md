---
name: Pagination
package: "@jaatster/blip-components"
css: pagination.css
element: null
react: Pagination
status: beta
---

# Pagination

The pages of a long list, or the worlds of a game: previous and next, numbered pages with gaps, and the page you are
on sitting in. When the nav gets narrow, the numbers give way to a compact "3 / 12". Pages are links, so every page has
an address and the browser's back button works.

## Usage

```html
<nav class="pp-pagination" aria-label="Pages">
  <ul class="pp-pagination-list" role="list">
    <li><a class="pp-box pp-pagination-prev" data-variant="ghost" href="?page=4" rel="prev"><span>Previous</span></a></li>
    <li><a class="pp-box pp-pagination-page" data-variant="outline" href="?page=1" aria-label="Page 1">1</a></li>
    <li class="pp-pagination-gap" aria-hidden="true"></li>
    <li><a class="pp-box pp-pagination-page" data-variant="outline" href="?page=5" aria-label="Page 5" aria-current="page">5</a></li>
    <li><a class="pp-box pp-pagination-page" data-variant="outline" href="?page=6" aria-label="Page 6">6</a></li>
    <li class="pp-pagination-status"><span class="pp-sr-only">Page</span> 5 <span aria-hidden="true">/</span><span class="pp-sr-only">of</span> 16</li>
    <li><a class="pp-box pp-pagination-next" data-variant="ghost" href="?page=6" rel="next"><span>Next</span></a></li>
  </ul>
</nav>
```

Write both the numbers and the status: CSS shows whichever fits.

## Anatomy

1. **Previous and next**: `.pp-pagination-prev`, `.pp-pagination-next`, boxes with a pixel chevron (5 x 7) and an
   upper-case label in a `<span>`.
2. **Page**: `.pp-pagination-page`, a square box with the number in tabular figures.
3. **Gap**: `.pp-pagination-gap`, three pixel dots where pages are skipped.
4. **Status**: `.pp-pagination-status`, "5 / 16", shown instead of the numbers when there is no room. It reads
   "Page 5 of 16".

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-variant` on pages | none (candy), `soft`, `outline`, `ghost` | Outline for lists and tables. Candy or soft for games: pages rest in cream and the current page takes the accent. |
| `data-tone` on previous and next | any tone | `neutral` for cream arrows next to candy pages. |
| `data-icon-only` on previous or next | | Just the chevron; give the link `aria-label` ("Previous page"). |
| `data-size` on the nav | `sm` (16 px), md (20, default) | `sm` under tables. |
| `data-compact` on the nav | | Always "3 / 12". Without it, the numbers turn into the status when the nav is under 360 px wide. |

## States

| State | How | Look |
|---|---|---|
| Hover | pointer | Lifts a pixel (outline and ghost: sunken fill). |
| Focus | keyboard | The yellow ring. |
| Pressed | `:active` | Sits in its drop. |
| Current | `aria-current="page"` | The accent, sitting in (outline: accent-light fill, ink outline). |
| Disabled | `aria-disabled="true"` on a previous or next with nowhere to go | Dithered. Drop the `href` and add `role="link"`, so it is announced as a dimmed link. |

## Accessibility

| Key | Does |
|---|---|
| Tab | Through previous, the pages, next. |
| Enter | Follows the link. |

- A `nav` landmark with a name that says what is paged ("Players pages"), when there is more than one.
- Name pages in full: `aria-label="Page 5"`; the current page also has `aria-current="page"`.
- `rel="prev"` and `rel="next"` on the arrows.
- The gap is decorative (`aria-hidden="true"`); the status reads "Page 5 of 16" through its hidden words.
- After a page change, move focus to the top of the new results (or announce them), not back to the nav.
- Windows high contrast: the current page gets a two-pixel border; chevrons take the link colour.

## Content

- Show the first page, the last page, and one or two pages either side of the current one; gaps for the rest.
- "Previous" and "Next", or "Prev" and "Next" in tight spaces; a game can name its pages ("World 3").

## Do and don't

- **Do** say how many items there are near the nav ("Players 81 to 100 of 312").
- **Don't** use pagination for a handful of items: show them all.
- **Don't** reuse one page number's address for different content.

## API

| Custom property | Default | |
|---|---|---|
| `--pp-r` with `--pp-shape`, `--pp-shape-inner` | 4 (sm 3) | Corner radius in pixels. |
| `--pp-band-top`, `--pp-band-bottom` | 3, 3 (sm 2, 2) | Band heights. |
| `--pp-tone` and friends | accent | The current page's colour. |

The nav is a size container (`container-type: inline-size`): it fills the width it is given.
