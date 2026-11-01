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
<article class="chu-box chu-card">
  <div class="chu-card-media"><img src="meadow.png" alt=""></div>
  <header class="chu-card-header">
    <div>
      <h3 class="chu-card-title">Meadow</h3>
      <p class="chu-card-subtitle">World 1 · 8 levels</p>
    </div>
    <span class="chu-box chu-tag" data-tone="success">Cleared</span>
  </header>
  <div class="chu-card-body"><p>Rolling hills, slow clouds and the first boss.</p></div>
  <footer class="chu-card-footer"><button class="chu-box chu-button">Play</button></footer>
</article>
```

A whole card as a link: `<a class="chu-box chu-card" href="/worlds/meadow">…</a>`. A card with one main link and other
actions: put `data-chu-interactive` on the card and `class="chu-card-link"` on the link in its title.

Pixel art that must stay crisp, at whole multiples of its pixels:

```html
<div class="chu-card-media" data-fit="pixels" style="--chu-card-art-width: 64; --chu-card-art-height: 36">
  <img src="meadow.png" alt="" width="64" height="36">
</div>
```

## Anatomy

1. **Panel**: the candy box as a cream panel (`--chu-surface-panel`), one-pixel ink outline, stepped corners, a drop.
2. **Media** (optional): `.chu-card-media`, a picture in a one-pixel ink frame, 16:9 by default, never smoothed. It
   covers the frame, scaled by whatever that takes; with `data-fit="pixels"` it is scaled so every art pixel is the
   same whole number of Blip pixels, and centred on the frame's sunken fill.
3. **Header**: `.chu-card-header`, the title (`.chu-card-title`) and subtitle (`.chu-card-subtitle`) at the start,
   anything small (a tag, a menu button) at the end.
4. **Body**: `.chu-card-body`, text.
5. **Footer** (optional): `.chu-card-footer`, actions at the end, pushed to the bottom in a row of cards.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-variant` | `panel`, cream (default), `soft`, `candy`, `outline` | Soft and candy tint the whole card, and give what sits on it the light roles (the tone's ink for text, links and lines; white fields), so it reads in every scheme; outline is flat, for dense pages. `panel` set explicitly is the white panel. |
| `data-tone` | any tone or candy | On a cream card: a three-pixel strip of its light colour along the top, following the corners. With soft or candy: the card's colour. |
| `data-size` | `sm`, `md` (default), `lg` | Padding 6, 8 or 12 pixels, title size, corner radius 3, 4, 5. |
| `data-layout` | `horizontal` | The picture beside the text while both fit, above it when they don't (no breakpoint: it follows its container). Wrap the header, body and footer in `.chu-card-content`. |
| `data-fit="pixels"` (on `.chu-card-media`) | | Pixel art: the picture as big as fits with each art pixel a whole number of Blip pixels, the same across and down, in the middle of the frame. Give its size in art pixels with `--chu-card-art-width` and `--chu-card-art-height`. A cover picture is scaled by fractions (5.9 CSS px per art pixel across, 3.4 down, say) and its pixels come out uneven and blurred. |

## States

| State | How | Look |
|---|---|---|
| Hover | pointer, on a card that is a link or button, or has `data-chu-interactive` | Lifts one pixel; the drop grows to keep the shadow in place. |
| Focus | keyboard | A whole-card link takes the yellow ring round the card. A `.chu-card-link` takes the square yellow ring round its own text. |
| Pressed | `:active` | Sits in its drop. |

A card that is only content has no states.

## Accessibility

- Use `<article>` for a self-contained card and give it a heading (`.chu-card-title` on an `<h2>` to `<h4>`, in the
  page's outline).
- **Whole-card link** (`<a class="chu-box chu-card">`): everything inside becomes the link's name, so keep the content
  short and put no other links or buttons inside.
- **Main link** (`.chu-card-link`): the link is the title; its click area covers the card; other buttons stay their own
  targets above it. Screen readers hear a short link name, and every action stays reachable.
- Pictures that carry meaning get `alt` text; decorative ones `alt=""` (or `aria-hidden` on an `<svg>`).
- Windows high contrast: a system border round the card and the picture.

## Content

- A title of a few words; a subtitle for one line of facts.
- One or two actions, the main one in candy at the end.

## Do and don't

- **Do** make a card one thing: one world, one player, one offer.
- **Do** use a grid (`.chu-grid`) for rows of cards; the footers line up.
- **Don't** put a card inside a card, or a card inside a candy box.
- **Don't** make a whole card a link and also put buttons in it.

## API

| Class | |
|---|---|
| `.chu-card` | The panel. Use with `.chu-box`. |
| `.chu-card-media`, `.chu-card-header`, `.chu-card-title`, `.chu-card-subtitle`, `.chu-card-body`, `.chu-card-footer`, `.chu-card-content`, `.chu-card-link` | Parts. |

| Custom property | Default | |
|---|---|---|
| `--chu-card-media-ratio` | `16 / 9` | The frame's aspect ratio. |
| `--chu-card-art-width`, `--chu-card-art-height` | (none) | With `data-fit="pixels"`, required: the picture's size in its own pixels (a 64 x 36 drawing: 64 and 36). |
| `--chu-r` with `--chu-shape`, `--chu-shape-inner` | 4 (sm 3, lg 5) | Corner radius in pixels. |
| `--chu-band-top` | 2 (3 with a tone) | The tone strip's height, in pixels, less one. |
