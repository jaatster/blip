---
name: Card
package: "@jaatster/blip-components"
css: card.css
element: null
react: Card
status: stable
equivalents:
  shadcn: Card
---

# Card

A cream panel that holds one thing: a world, a player, an event. It can have a picture in a pixel frame, a header,
some text and actions at its foot. A whole card can be a link that lifts; a tone puts a soft strip of colour along
its top.

## Usage

```html
<article class="blip-box blip-card">
  <div class="blip-card-media"><img src="meadow.png" alt=""></div>
  <header class="blip-card-header">
    <div>
      <h3 class="blip-card-title">Meadow</h3>
      <p class="blip-card-subtitle">World 1 · 8 levels</p>
    </div>
    <span class="blip-box blip-tag" data-tone="success">Cleared</span>
  </header>
  <div class="blip-card-body"><p>Rolling hills, slow clouds and the first boss.</p></div>
  <footer class="blip-card-footer"><button class="blip-box blip-button">Play</button></footer>
</article>
```

A whole card as a link: `<a class="blip-box blip-card" href="/worlds/meadow">…</a>`. A card with one main link and other
actions: put `data-blip-interactive` on the card and `class="blip-card-link"` on the link in its title.

Pixel art that must stay crisp, at whole multiples of its pixels:

```html
<div class="blip-card-media" data-fit="pixels" style="--blip-card-art-width: 64; --blip-card-art-height: 36">
  <img src="meadow.png" alt="" width="64" height="36">
</div>
```

## Anatomy

1. **Panel**: the candy box as a cream panel (`--blip-surface-panel`), one-pixel ink outline, stepped corners, a drop.
2. **Media** (optional): `.blip-card-media`, a picture in a one-pixel ink frame, 16:9 by default, never smoothed. It
   covers the frame, scaled by whatever that takes; with `data-fit="pixels"` it is scaled so every art pixel is the
   same whole number of Blip pixels, and centred on the frame's sunken fill.
3. **Header**: `.blip-card-header`, the title (`.blip-card-title`) and subtitle (`.blip-card-subtitle`) at the start,
   anything small (a tag, a menu button) at the end.
4. **Body**: `.blip-card-body`, text.
5. **Footer** (optional): `.blip-card-footer`, actions at the end, pushed to the bottom in a row of cards.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-variant` | `panel`, cream (default), `soft`, `candy`, `outline` | Soft and candy tint the whole card, and give what sits on it the light roles (the tone's ink for text, links and lines; white fields), so it reads in every scheme; outline is flat, for dense pages. `panel` set explicitly is the white panel. |
| `data-tone` | any tone or candy | On a cream card: a three-pixel strip of its light colour along the top, following the corners. With soft or candy: the card's colour. |
| `data-size` | `sm`, `md` (default), `lg` | Padding 6, 8 or 12 pixels, title size, corner radius 3, 4, 5. |
| `data-layout` | `horizontal` | The picture beside the text while both fit, above it when they don't (no breakpoint: it follows its container). Wrap the header, body and footer in `.blip-card-content`. |
| `data-fit="pixels"` (on `.blip-card-media`) | | Pixel art: the picture as big as fits with each art pixel a whole number of Blip pixels, the same across and down, in the middle of the frame. Give its size in art pixels with `--blip-card-art-width` and `--blip-card-art-height`. A cover picture is scaled by fractions (5.9 CSS px per art pixel across, 3.4 down, say) and its pixels come out uneven and blurred. |

## States

| State | How | Look |
|---|---|---|
| Hover | pointer, on a card that is a link or button, or has `data-blip-interactive` | Lifts one pixel (the drop grows to keep the shadow in place) inside a white ring with an ink edge. |
| Focus | keyboard | A whole-card link takes the yellow ring round the card. A `.blip-card-link` takes the square yellow ring round its own text. |
| Pressed | `:active` | Sits in its drop. |

A card that is only content has no states.

## Accessibility

- Use `<article>` for a self-contained card and give it a heading (`.blip-card-title` on an `<h2>` to `<h4>`, in the
  page's outline).
- **Whole-card link** (`<a class="blip-box blip-card">`): everything inside becomes the link's name, so keep the content
  short and put no other links or buttons inside.
- **Main link** (`.blip-card-link`): the link is the title; its click area covers the card; other buttons stay their own
  targets above it. Screen readers hear a short link name, and every action stays reachable.
- Pictures that carry meaning get `alt` text; decorative ones `alt=""` (or `aria-hidden` on an `<svg>`).
- Windows high contrast: a system border round the card and the picture.

## Content

- A title of a few words; a subtitle for one line of facts.
- One or two actions, the main one in candy at the end.

## Do and don't

- **Do** make a card one thing: one world, one player, one offer.
- **Do** use a grid (`.blip-grid`) for rows of cards; the footers line up.
- **Don't** put a card inside a card, or a card inside a candy box.
- **Don't** make a whole card a link and also put buttons in it.

## API

| Class | |
|---|---|
| `.blip-card` | The panel. Use with `.blip-box`. |
| `.blip-card-media`, `.blip-card-header`, `.blip-card-title`, `.blip-card-subtitle`, `.blip-card-body`, `.blip-card-footer`, `.blip-card-content`, `.blip-card-link` | Parts. |

| Custom property | Default | |
|---|---|---|
| `--blip-card-media-ratio` | `16 / 9` | The frame's aspect ratio. |
| `--blip-card-art-width`, `--blip-card-art-height` | (none) | With `data-fit="pixels"`, required: the picture's size in its own pixels (a 64 x 36 drawing: 64 and 36). |
| `--blip-r` with `--blip-shape`, `--blip-shape-inner` | 4 (sm 3, lg 5) | Corner radius in pixels. |
| `--blip-band-top` | 2 (3 with a tone) | The tone strip's height, in pixels, less one. |
