---
name: Skip link
package: "@jaatster/blip-components"
css: skip-link.css
element: null
react: SkipLink
status: beta
---

# Skip link

The first stop for keyboard users: out of sight until it takes focus, then a candy chip pops in at the top-left corner,
over everything, and takes them past the navigation to the content. Every page with navigation before its content
needs one.

## Usage

```html
<body>
  <a class="blip-box blip-skip-link" href="#main">Skip to content</a>
  <header class="blip-box blip-app-bar">…</header>
  <main id="main" tabindex="-1">…</main>
</body>
```

## Anatomy

1. **Link**: a candy box, upper-case label, fixed to the top-left corner (top-right, right to left), above everything
   (`--blip-layer-tooltip`).

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-tone` | accent (default), any tone | Match the brand. |
| More links | | "Skip to search", "Skip to navigation": each appears in the same corner while it has focus. |

## States

| State | How | Look |
|---|---|---|
| Hidden | not focused | Clipped away (`clip-path: inset(50%)`), but in the tab order and read by screen readers. |
| Focus | Tab | Shown: pops in one pixel low for a frame, then sits in the corner with the yellow ring. |
| Hover, pressed | pointer | Lifts; sits in its drop. |

## Accessibility

| Key | Does |
|---|---|
| Tab (first, from the top of the page) | Shows the link and focuses it. |
| Enter | Jumps to the target; the next Tab continues from there. |

- Put it first in `<body>`, before the app bar.
- Point it at the main landmark and give the target `tabindex="-1"`, so focus lands there in every browser (not just
  the scroll position).
- Name where it goes: "Skip to content", not "Skip".
- It shows on any focus, not only keyboard focus, so a script that focuses it shows it too.
- With reduced motion it appears without the step.

## Content

- "Skip to content" (or "Skip to main content"). Sentence case; CSS sets upper case.

## Do and don't

- **Do** test it: Tab once from the address bar, press Enter, Tab again.
- **Don't** hide it with `display: none` or `visibility: hidden`: that takes it out of the tab order.

## API

| Custom property | Default | |
|---|---|---|
| `--blip-r` with `--blip-shape`, `--blip-shape-inner` | 4 | Corner radius in pixels. |
| `--blip-tone` and friends | accent | Or `data-tone`. |

The link is `position: fixed`; inside an element with layout containment (such as a container) it pins to that
element's corner instead of the window's.
