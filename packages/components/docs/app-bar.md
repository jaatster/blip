---
name: App bar
package: "@jaatster/blip-components"
css: app-bar.css
element: null
react: AppBar
status: beta
---

# App bar

The top of an app or a site, on a panel: the brand in Pixel Bop, the main links, and actions at the end. When the bar
gets narrow the links fold behind a menu button. The folded list is the same list, opened as a popover: a disclosure,
so it needs no script and no second copy of the links.

## Usage

```html
<header class="chu-box chu-app-bar">
  <a class="chu-app-bar-brand" href="/">
    <svg class="chu-icon" viewBox="0 0 12 12" aria-hidden="true">…</svg>
    <span class="chu-display chu-pop" data-scale="2" data-pop="Questboard">Questboard</span>
  </a>
  <nav class="chu-app-bar-nav" aria-label="Main">
    <button class="chu-box chu-button chu-app-bar-toggle" data-variant="ghost" data-icon-only popovertarget="main-links"
            aria-label="Menu"><svg class="chu-icon" …></svg></button>
    <ul class="chu-box chu-app-bar-links" id="main-links" popover role="list">
      <li><a class="chu-box chu-app-bar-link" data-variant="ghost" href="/live" aria-current="page">Live ops</a></li>
      <li><a class="chu-box chu-app-bar-link" data-variant="ghost" href="/studio">Studio</a></li>
    </ul>
  </nav>
  <div class="chu-app-bar-actions">
    <button class="chu-box chu-button" data-variant="ghost" data-icon-only aria-label="Search">…</button>
    <chu-menu class="chu-menu" data-align="end">…an account menu…</chu-menu>
  </div>
</header>
```

## Anatomy

1. **Bar**: `.chu-app-bar`, a surface panel with an ink outline and a drop. It is a size container
   (`chu-app-bar`), so it folds by its own width wherever it sits.
2. **Brand**: `.chu-app-bar-brand`, a link home: an optional mark (an icon) and the wordmark in Pixel Bop, POP style.
3. **Menu button**: `.chu-app-bar-toggle`, a button with `popovertarget`, shown only when the links are folded.
4. **Links**: `.chu-app-bar-links`, a `popover` list of `.chu-app-bar-link` ghost boxes. A row in the bar; folded, a cream
   panel under the menu button that pops in.
5. **Actions**: `.chu-app-bar-actions`, pushed to the end: icon buttons, an account menu, one candy button at most.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-collapse` | none (default: folds under 64rem), `medium` (folds under 37.5rem), `always`, `never` | Pick the width at which the links stop fitting. `medium` suits a site with three short links. In rem, so 1024 and 600 px at the default text size, and wider with a bigger one, whose links need more room. |
| `data-sticky` | | Stays at the top while the page scrolls. |
| `data-scale` on the wordmark | `1`, `2` | Under 400 px the wordmark drops to scale 1; under 360 px a brand with a mark shows only the mark (the wordmark stays as the link's name). |

### In an app shell

The app bar, the sidebar and the bottom bar answer to one container named `chu-shell`:

```html
<div style="container: chu-shell / inline-size">
  <header class="chu-box chu-app-bar">…</header>
  <nav class="chu-sidebar" data-collapse="auto">…</nav>   <!-- a rail under 1024 px, gone under 600 px -->
  <main>…</main>
  <nav class="chu-box chu-bottom-bar" data-collapse="auto">…</nav>   <!-- only under 600 px -->
</div>
```

## States

| State | How | Look |
|---|---|---|
| Hover | pointer | A link fills with the sunken surface and shows its outline. |
| Focus | keyboard | The yellow ring. |
| Current | `aria-current="page"` | The link sits in: an accent-light chip with an ink outline. It stays marked in the folded list. |
| Folded | narrow, or `data-collapse="always"` | The menu button shows; the links wait in the popover. |
| Folded, open | the menu button pressed | A cream panel under the button, the links in a column. |

## Accessibility

| Key | Does |
|---|---|
| Tab | Through the brand, the menu button (or the links), and the actions. |
| Enter, Space | On the menu button: opens or closes the links. |
| Escape | Closes the open links; a click outside closes them too. |

- The folded links are a disclosure (APG Disclosure Navigation), not an ARIA menu: they stay plain links in a list.
  The browser exposes the menu button's expanded state from `popovertarget`, and Tab goes from the button into the
  open list.
- Name the `nav` (`aria-label="Main"`) and the icon-only menu button (`aria-label="Menu"`).
- Mark the current page with `aria-current="page"`; it is always visible, folded or not.
- The brand link's name is its wordmark text, kept even when only the mark shows.
- Put a skip link before the bar.
- Windows high contrast: the current link keeps a border, the others none.

## Content

- Two to five links, one or two words each, sentence case (CSS sets upper case).
- Actions are icon buttons with names; at most one candy button (the main action).
- Under 400 px keep two or three actions; move the rest to the bottom bar or an account menu.

## Do and don't

- **Do** pair a folding bar with a bottom bar or the sidebar on phones, so the main destinations are one tap away.
- **Do** keep the same links in the same order at every width.
- **Don't** put a second copy of the links in the page for the folded state.
- **Don't** fill the bar with candy; it is a frame, and the content is the star.

## API

| Custom property | Default | |
|---|---|---|
| `--chu-r` with `--chu-shape`, `--chu-shape-inner` | 4 | The bar's corners (`data-chu-r="0"` for a bar flush to the screen's edges). |
| `--chu-box-top`, `--chu-box-fill`, `--chu-box-bottom` | `--chu-surface` | The bar's colour. |
| `--chu-drop-size` | 1 | The bar's drop. |

Container names: `chu-app-bar` (the bar), `chu-shell` (the layout around it, set by you).
