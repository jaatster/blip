---
name: Features
package: "@blip/blocks"
css: features.css
element: null
react: Features
status: beta
---

# Features

What the product does, in a grid that varies its scale: a lead feature with room for a picture, tiles beside it,
stat tiles with one big Pixel Bop number, and a wide band across the bottom. Not a row of identical
icon-heading-text cards.

## Usage

```html
<section class="blip-features" aria-labelledby="features-title">
  <header class="blip-features-head">
    <h2 class="blip-features-title" id="features-title">A small world that keeps time</h2>
    <p class="blip-features-lead">Sixty short levels, made to be played a few at a time.</p>
  </header>
  <div class="blip-features-grid">
    <article class="blip-box blip-feature" data-layout="lead" data-variant="panel">
      <div class="blip-feature-media">…a picture…</div>
      <h3 class="blip-feature-title">A meadow that keeps time</h3>
      <p class="blip-feature-text">The world follows your clock…</p>
    </article>
    <article class="blip-box blip-feature" data-variant="soft" data-tone="pink">
      <span class="blip-box blip-feature-icon" data-tone="pink"><svg class="blip-icon" viewBox="0 0 12 12" aria-hidden="true">…</svg></span>
      <h3 class="blip-feature-title">Couch co-op</h3>
      <p class="blip-feature-text">A friend can hop in or out at any moment.</p>
    </article>
    <article class="blip-box blip-feature" data-layout="stat" data-variant="soft" data-tone="blue">
      <p class="blip-feature-stat blip-pop" data-pop="60">60</p>
      <p class="blip-feature-text">hand-made levels in four worlds</p>
    </article>
    <article class="blip-box blip-feature" data-layout="wide" data-variant="panel">
      <span class="blip-box blip-feature-icon" data-tone="red">…</span>
      <div>…title and text…</div>
      <ul class="blip-feature-chips" role="list"><li class="blip-box" data-variant="soft" data-tone="neutral">Assist mode</li>…</ul>
    </article>
  </div>
</section>
```

## Anatomy

1. **Head** (`.blip-features-head`): title, lead.
2. **Grid** (`.blip-features-grid`): one column below 600 px wide (medium), two below 1024 px (wide), then six.
3. **Feature** (`.blip-feature`): a candy box (panel or soft) with an icon, a title and text.
4. **Media** (`.blip-feature-media`): the lead's picture slot; it grows to fill the lead's two rows.
5. **Stat** (`.blip-feature-stat`): Pixel Bop at scale 3, POP, and its caption.
6. **Chips** (`.blip-feature-chips`): small soft boxes in a row.

## Variants

| `data-layout` | Wide layout | Use |
|---|---|---|
| `lead` | four of six columns, two rows | The one thing to know. One per grid. |
| (none) | two columns | A feature with an icon. |
| `stat` | two columns | One honest number. |
| `wide` | all six columns, side by side | A closing promise with a list of chips. |

Tones: panels for the lead and the wide band, soft candies for tiles and stats. Vary the tones; keep them soft.

## Accessibility

- Features are `<article>`s with real headings; the grid order is the reading order at every width.
- Icons are decoration (`aria-hidden`); the heading says what the icon shows.
- Stats read as text: "60 hand-made levels in four worlds".
- Text on soft candies is ink (AA everywhere).

## Content

Short titles, one or two sentences each. Numbers only if they're true.

## Do and don't

- **Do** lead with the feature that makes the product different.
- **Don't** make every tile the same size; that's what this block avoids.
- **Don't** turn panels into links; put a link inside if one is needed.
