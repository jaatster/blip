---
name: Card
package: "@jaatster/blip-components"
css: card.css
element: null
react: Card
status: stable
---

# Card

A cream panel that holds one thing: a world, a player, an event. It can have a picture in a pixel frame, a header,
some text and actions at its foot. A whole card can be a link that lifts; a tone puts a soft strip of colour along
its top.

## Usage

```html
<article class="pp-box pp-card">
  <div class="pp-card-media"><img src="meadow.png" alt=""></div>
  <header class="pp-card-header">
    <div>
      <h3 class="pp-card-title">Meadow</h3>
      <p class="pp-card-subtitle">World 1 · 8 levels</p>
    </div>
    <span class="pp-box pp-tag" data-tone="success">Cleared</span>
  </header>
  <div class="pp-card-body"><p>Rolling hills, slow clouds and the first boss.</p></div>
  <footer class="pp-card-footer"><button class="pp-box pp-button">Play</button></footer>
</article>
```

A whole card as a link: `<a class="pp-box pp-card" href="/worlds/meadow">…</a>`. A card with one main link and other
actions: put `data-pp-interactive` on the card and `class="pp-card-link"` on the link in its title.

## Anatomy

1. **Panel**: the candy box as a cream panel (`--pp-surface-panel`), one-pixel ink outline, stepped corners, a drop.
2. **Media** (optional): `.pp-card-media`, a picture in a one-pixel ink frame, 16:9 by default, never smoothed.
3. **Header**: `.pp-card-header`, the title (`.pp-card-title`) and subtitle (`.pp-card-subtitle`) at the start,
   anything small (a tag, a menu button) at the end.
4. **Body**: `.pp-card-body`, text.
5. **Footer** (optional): `.pp-card-footer`, actions at the end, pushed to the bottom in a row of cards.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-variant` | `panel`, cream (default), `soft`, `candy`, `outline` | Soft and candy tint the whole card (text inside takes the box's ink); outline is flat, for dense pages. `panel` set explicitly is the white panel. |
| `data-tone` | any tone or candy | On a cream card: a three-pixel strip of its light colour along the top, following the corners. With soft or candy: the card's colour. |
| `data-size` | `sm`, `md` (default), `lg` | Padding 6, 8 or 12 pixels, title size, corner radius 3, 4, 5. |
| `data-layout` | `horizontal` | The picture beside the text while both fit, above it when they don't (no breakpoint: it follows its container). Wrap the header, body and footer in `.pp-card-content`. |

## States

| State | How | Look |
|---|---|---|
| Hover | pointer, on a card that is a link or button, or has `data-pp-interactive` | Lifts one pixel; the drop grows to keep the shadow in place. |
| Focus | keyboard | A whole-card link takes the yellow ring round the card. A `.pp-card-link` takes the square yellow ring round its own text. |
| Pressed | `:active` | Sits in its drop. |

A card that is only content has no states.

## Accessibility

- Use `<article>` for a self-contained card and give it a heading (`.pp-card-title` on an `<h2>` to `<h4>`, in the
  page's outline).
- **Whole-card link** (`<a class="pp-box pp-card">`): everything inside becomes the link's name, so keep the content
  short and put no other links or buttons inside.
- **Main link** (`.pp-card-link`): the link is the title; its click area covers the card; other buttons stay their own
  targets above it. Screen readers hear a short link name, and every action stays reachable.
- Pictures that carry meaning get `alt` text; decorative ones `alt=""` (or `aria-hidden` on an `<svg>`).
- Windows high contrast: a system border round the card and the picture.

## Content

- A title of a few words; a subtitle for one line of facts.
- One or two actions, the main one in candy at the end.

## Do and don't

- **Do** make a card one thing: one world, one player, one offer.
- **Do** use a grid (`.pp-grid`) for rows of cards; the footers line up.
- **Don't** put a card inside a card, or a card inside a candy box.
- **Don't** make a whole card a link and also put buttons in it.

## API

| Class | |
|---|---|
| `.pp-card` | The panel. Use with `.pp-box`. |
| `.pp-card-media`, `.pp-card-header`, `.pp-card-title`, `.pp-card-subtitle`, `.pp-card-body`, `.pp-card-footer`, `.pp-card-content`, `.pp-card-link` | Parts. |

| Custom property | Default | |
|---|---|---|
| `--pp-card-media-ratio` | `16 / 9` | The picture's aspect ratio. Pixel art stays crisp at whole-number scales. |
| `--pp-r` with `--pp-shape`, `--pp-shape-inner` | 4 (sm 3, lg 5) | Corner radius in pixels. |
| `--pp-band-top` | 2 (3 with a tone) | The tone strip's height, in pixels, less one. |
