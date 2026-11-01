---
name: Top bar
package: "@blip/components"
css: top-bar.css
element: null
react: TopBar
status: beta
---

# Top bar

A phone screen's own bar: a back button, the screen's title in the middle and one or two actions at the end. It
sticks to the top of the screen, inside the notch's safe area, flush with the screen's edges.

**Top bar or app bar?** The [app bar](app-bar.md) is the bar of a whole site or app: the brand, the main links and
the account, the same on every page, folding its links behind a menu on narrow screens. The top bar belongs to one
screen of a phone app: where you are (the title), the way back (the back button) and what you can do here (the
actions). Use the app bar at the top of a website, and on wide screens; use the top bar for the screens inside a
phone app, usually over a [bottom bar](bottom-bar.md) that holds the main destinations.

## Usage

```html
<header class="blip-box blip-top-bar">
  <a class="blip-box blip-button blip-top-bar-back" data-variant="ghost" href="/worlds">
    <span class="blip-icon blip-top-bar-chevron" aria-hidden="true"></span><span class="blip-sr-only">Back to </span>Worlds</a>
  <h1 class="blip-top-bar-title">Meadow</h1>
  <div class="blip-top-bar-actions">
    <button class="blip-box blip-button" type="button" data-variant="ghost" data-icon-only aria-label="Share">…</button>
    <button class="blip-box blip-button" type="button" data-variant="ghost" data-icon-only aria-label="More">…</button>
  </div>
</header>
```

It is CSS only: no script. Put it first in the screen's scroller (the page, or a panel that scrolls). It sticks to
the top, and its padding takes in the notch (`env(safe-area-inset-top)`, and the sides in landscape): give the page
`<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` so the safe areas apply.

### Large title

```html
<header class="blip-box blip-top-bar" data-large>
  <a class="blip-box blip-button blip-top-bar-back" data-variant="ghost" data-icon-only href="/" aria-label="Back">
    <span class="blip-icon blip-top-bar-chevron" aria-hidden="true"></span></a>
  <span class="blip-top-bar-title" aria-hidden="true">Inbox</span>
  <div class="blip-top-bar-actions">…</div>
</header>
<h1 class="blip-top-bar-large">Inbox</h1>
```

With `data-large` the screen opens with a big title under the bar, in Pixel Bop at scale 2. As you scroll, the big
title slides up under the bar, and once it has nearly gone the bar's own title steps up into place, a pixel at a
time, three steps over the last 12 pixels of scrolling. It is a CSS scroll-driven animation (`animation-timeline:
scroll()`), so it needs no script and never lags behind your finger.

- The big title is the heading. The bar's title is a copy for the eye: give it `aria-hidden="true"`, and make it a
  `<span>`, not a heading.
- The bar must be at the top of its scroller, with the big title straight after it: the steps are counted from the
  top of the scroll.
- Where scroll-driven animations are missing, the bar shows its title all along, over the big one: still right,
  just said twice.
- With reduced motion the bar's title appears in one step, once the big title has gone.

## Anatomy

1. **Bar**: `.blip-top-bar`, a panel box with square corners. Its top and side edges are cut away, so it is flush
   with the screen; its bottom edge and one-pixel drop show where the screen's content slides under it.
2. **Back button** (optional): `.blip-top-bar-back`, a ghost button. The chevron (`.blip-top-bar-chevron`, on an
   empty `.blip-icon` span) and, if there is room, the name of the screen it goes back to, cut short with an ellipsis
   past 48 pixels. Alone, it takes `data-icon-only` and `aria-label="Back"`.
3. **Title**: `.blip-top-bar-title`, one line of Pixel Bop at scale 1, centred on the bar while both sides fit; a
   long title is cut short with an ellipsis.
4. **Actions** (optional): `.blip-top-bar-actions`, one or two ghost icon buttons at the end.
5. **Large title** (with `data-large`): `.blip-top-bar-large`, the big title under the bar.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-large` on `.blip-top-bar` | | A big title under the bar that hands over to the bar's own as you scroll. For the top screens of an app (Inbox, Library); detail screens keep the small title. |
| `data-icon-only` on `.blip-top-bar-back` | | The chevron alone, square. Needs `aria-label="Back"`. Use it when the title is long or the previous screen's name says nothing. |

A screen with no way back (a root screen, under a bottom bar) leaves the back button out; the title stays centred.

## States

The buttons are ordinary ghost buttons, so their states are the button's:

| State | How | Look |
|---|---|---|
| Hover | pointer | The sunken well inside a line outline. |
| Focus | keyboard | The yellow ring with an ink edge, inside the bar. |
| Pressed | `:active` | Sits in. |
| On | `aria-pressed="true"` | An action that is a toggle (Favourite): the accent's light fill, sat in. |

## Accessibility

- The bar is a `<header>`; inside `<main>` or a section it is not a landmark, so it adds no noise. Make the title the
  screen's heading (`<h1>`, or the level that fits), unless the large title is.
- The back button is a link (`<a href>`) when it goes to a page, a button when it runs script (`history.back()`).
  With a label, add hidden words so it reads as what it does: `<span class="blip-sr-only">Back to </span>Worlds`.
  Alone, it needs `aria-label="Back"`.
- Icon-only actions need an `aria-label` naming the action ("Share", "New message").
- Targets: the buttons are 20 pixels (40 px) square, over the 24 px minimum; the bar's padding adds room round them.
- A sticky bar can cover what has focus: give the scroller `scroll-padding-top` as tall as the bar, so a control
  focused by the keyboard scrolls into view below it, not under it.
- Taps are not delayed by double-tap zoom (`touch-action: manipulation` on its buttons); pinch zoom still works.
- Windows high contrast: the bar keeps a system border all round, and the chevron takes the button text colour.

## Content

- The title is the screen's name, one to three words: "Inbox", "Meadow", "Sound". Sentence case; CSS sets capitals.
- The back label is the previous screen's title, not "Back". Leave it out when that title is long.
- At most two actions: the screen's most used. Put the rest in a "More" menu (`<blip-menu>` with an icon button).

## Do and don't

- **Do** keep one top bar per screen, at the top of its scroller.
- **Do** use the app bar for a site's own bar, and on wide screens.
- **Don't** put candy buttons in the bar: its actions are ghost icon buttons, so the screen's main action stays the
  candy one (an [action button](fab.md), or a button in the content).
- **Don't** put the large title on a screen that also has a back label and two actions: the big title is for the top
  screens of an app.

## API

| Custom property | Default | |
|---|---|---|
| `--blip-r` with `--blip-shape`, `--blip-shape-inner` | 0 | The bar's corners: square, flush with the screen. |
| `--blip-drop-size` | 1 | The drop under the bar's bottom edge, in pixels. |
