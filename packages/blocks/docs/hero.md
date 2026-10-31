---
name: Hero
package: "@jaatster/blip-blocks"
css: hero.css
element: null
react: Hero
status: beta
---

# Hero

The top of a landing page: a POP headline whose letters drop in one after another, a subhead, a candy call to
action with a soft second one, all over the world with a strip of ground along the bottom. The world is
`<pp-world>` from `@jaatster/blip-effects`; before it draws, or without it, the hero's own sky is the scheme's palette in
hard bands, dithered where they meet.

## Usage

```html
<section class="pp-hero" aria-labelledby="hero-title">
  <pp-world parallax avoid=".pp-hero-title, .pp-hero-lead, .pp-hero-actions, .pp-hero-note"></pp-world>
  <div class="pp-hero-inner">
    <h1 class="pp-hero-title pp-display" id="hero-title">
      <span class="pp-sr-only">Starfall Meadow</span>
      <span aria-hidden="true">
        <span class="pp-hero-word"><span class="pp-pop pp-drop-in" data-pop="S" style="--i: 0">S</span><span class="pp-pop pp-drop-in" data-pop="t" style="--i: 1">t</span>…</span>
        <span class="pp-hero-word"><span class="pp-pop pp-drop-in" data-pop="M" style="--i: 9">M</span>…</span>
      </span>
    </h1>
    <p class="pp-hero-lead">Catch the stars that fall on the meadow before the sun comes up.</p>
    <div class="pp-hero-actions">
      <a class="pp-box pp-button" data-size="lg" href="#editions">Wishlist now</a>
      <a class="pp-box pp-button" data-size="lg" data-variant="soft" data-tone="neutral" href="#demo">Play the free demo</a>
    </div>
    <p class="pp-hero-note">Out this spring, on desktop</p>
  </div>
  <div class="pp-hero-scenery" aria-hidden="true">…sprites standing on the ground…</div>
  <div class="pp-hero-ground"></div>
</section>
```

Splitting the headline by hand is tedious; any template can do it:

```js
let i = 0;
const word = (w) => `<span class="pp-hero-word">${[...w].map((c) => `<span class="pp-pop pp-drop-in" data-pop="${c}" style="--i:${i++}">${c}</span>`).join("")}</span>`;
const letters = (text) => text.split(" ").map((w) => { const html = word(w); i++; return html; }).join(" ");
```

## Anatomy

1. **Sky**: the hero's background (six bands of the nearest scheme's sky, up from the ground), under `pp-world`.
2. **Headline** (`.pp-hero-title`): Pixel Bop in POP at the whole scale that fits: 2 below 600 px wide (the medium
   breakpoint), 3 below 1024 px (wide), 4 above. Words never break; lines balance.
3. **Lead** (`.pp-hero-lead`), **actions** (`.pp-hero-actions`), **note** (`.pp-hero-note`). The world's `avoid`
   names these and the headline, so the sun and moon find the sky beside the words, never behind them; the lead also
   has a one-pixel halo in the page colour, so it stays readable over a cloud.
4. **Scenery** (`.pp-hero-scenery`): things standing on the ground, behind the text.
5. **Ground** (`.pp-hero-ground`): blades of grass, grass, a lip, dirt with pebbles, flowers.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-align` | centred (default), `start` | Start-aligned text for a hero beside a picture. |
| `avoid` on its `pp-world` | `.pp-hero-title, .pp-hero-lead, .pp-hero-actions, .pp-hero-note` | Keeps the sun, the moon and shooting stars clear of the words (and of anything else you name). Name the parts, not `.pp-hero-inner`: the inner is as wide as the hero, the parts are as wide as their words. |
| `--pp-hero-band` | 16 | The fallback sky bands' height in pixels. |
| `--pp-hero-ground` | 24 | The ground's height in pixels. |
| `--pp-hero-tint`, `--pp-hero-drop` | the accent's light and shade | The headline's POP colours. |

## States

The letters drop in on load: each waits `--i` frames hidden, then appears two pixels high for a frame and lands, as
the TV's app names did. A beat between words. With reduced motion the headline is simply there.

## Accessibility

- The headline is read from its hidden copy (`.pp-sr-only`); the letters are `aria-hidden`, so screen readers say
  "Starfall Meadow", not a list of letters.
- One candy button: the main action. The second is soft. Both are links if they go somewhere.
- Text is the scheme's text colour on the sky (ink by day and at sunset, light at night); keep the lead in the
  upper part of the hero, above the hills, and name it in the world's `avoid`, so the moon never sits behind it.
- Windows high contrast shows a plain canvas, no ground.

## Content

- Headline: the product's name, or a short promise. Two words fit best at scale 4.
- Lead: one or two sentences, what it is and who it's for.
- Note: one fact (when, where), never a claim you can't stand behind.

## Do and don't

- **Do** let the world show: keep the hero's content narrow.
- **Don't** put more than two actions in a hero.
- **Don't** put scenery in the sky where text will flow over it on a phone; stand it on the ground.
