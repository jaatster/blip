---
name: Hero
package: "@blip/blocks"
css: hero.css
element: null
react: Hero
status: beta
---

# Hero

The top of a landing page: a POP headline whose letters drop in one after another, a subhead, a candy call to
action with a soft second one, all over the world with a strip of ground along the bottom. The world is
`<blip-world>` from `@blip/effects`; before it draws, or without it, the hero's own sky is the scheme's palette in
hard bands, dithered where they meet.

## Usage

```html
<section class="blip-hero" aria-labelledby="hero-title">
  <blip-world parallax avoid=".blip-hero-title, .blip-hero-lead, .blip-hero-actions, .blip-hero-note"></blip-world>
  <div class="blip-hero-inner">
    <h1 class="blip-hero-title blip-display" id="hero-title">
      <span class="blip-sr-only">Starfall Meadow</span>
      <span aria-hidden="true">
        <span class="blip-hero-word"><span class="blip-pop blip-drop-in" data-pop="S" style="--i: 0">S</span><span class="blip-pop blip-drop-in" data-pop="t" style="--i: 1">t</span>…</span>
        <span class="blip-hero-word"><span class="blip-pop blip-drop-in" data-pop="M" style="--i: 9">M</span>…</span>
      </span>
    </h1>
    <p class="blip-hero-lead">Catch the stars that fall on the meadow before the sun comes up.</p>
    <div class="blip-hero-actions">
      <a class="blip-box blip-button" data-size="lg" href="#editions">Wishlist now</a>
      <a class="blip-box blip-button" data-size="lg" data-variant="soft" data-tone="neutral" href="#demo">Play the free demo</a>
    </div>
    <p class="blip-hero-note">Out this spring, on desktop</p>
  </div>
  <div class="blip-hero-scenery" aria-hidden="true">…sprites standing on the ground…</div>
  <div class="blip-hero-ground"></div>
</section>
```

Splitting the headline by hand is tedious; any template can do it:

```js
let i = 0;
const word = (w) => `<span class="blip-hero-word">${[...w].map((c) => `<span class="blip-pop blip-drop-in" data-pop="${c}" style="--i:${i++}">${c}</span>`).join("")}</span>`;
const letters = (text) => text.split(" ").map((w) => { const html = word(w); i++; return html; }).join(" ");
```

## Anatomy

1. **Sky**: the hero's background (six bands of the nearest scheme's sky, up from the ground), under `blip-world`.
2. **Headline** (`.blip-hero-title`): Pixel Bop in POP at the whole scale that fits: 2 below 600 px wide (the medium
   breakpoint), 3 below 1024 px (wide), 4 above. Words never break; lines balance.
3. **Lead** (`.blip-hero-lead`), **actions** (`.blip-hero-actions`), **note** (`.blip-hero-note`). The world's `avoid`
   names these and the headline, so the sun and moon find the sky beside the words and no star or cloud sits behind
   them; the lead and the note also wear a one-pixel halo in the page colour, so they stay readable where they cross
   a snowy peak, the moon or a cloud.
4. **Scenery** (`.blip-hero-scenery`): things standing on the ground, behind the text.
5. **Ground** (`.blip-hero-ground`): blades of grass, grass, a lip, dirt with pebbles, flowers.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-align` | centred (default), `start` | Start-aligned text for a hero beside a picture. |
| `avoid` on its `blip-world` | `.blip-hero-title, .blip-hero-lead, .blip-hero-actions, .blip-hero-note` | Keeps the sun, the moon, the stars, clouds and shooting stars clear of the words (and of anything else you name). Name the parts, not `.blip-hero-inner`: the inner is as wide as the hero, the parts are as wide as their words. |
| `--blip-hero-band` | 16 | The fallback sky bands' height in pixels. |
| `--blip-hero-ground` | 24 | The ground's height in pixels. |
| `--blip-hero-tint`, `--blip-hero-drop` | the accent's light and shade | The headline's POP colours. |

## States

The letters drop in on load: each waits `--i` frames hidden, then appears two pixels high for a frame and lands, as
the TV's app names did. A beat between words. With reduced motion the headline is simply there.

## Accessibility

- The headline is read from its hidden copy (`.blip-sr-only`); the letters are `aria-hidden`, so screen readers say
  "Starfall Meadow", not a list of letters.
- One candy button: the main action. The second is soft. Both are links if they go somewhere.
- Text is the scheme's text colour on the sky (ink by day and at sunset, light at night); keep the lead in the
  upper part of the hero, above the hills, and name it in the world's `avoid`, so the moon never sits behind it.
- Windows high contrast shows a plain canvas, no ground. On paper only the words and the buttons print: the sky, the
  ground, the scenery and the world stay off.

## Content

- Headline: the product's name, or a short promise. Two words fit best at scale 4.
- Lead: one or two sentences, what it is and who it's for.
- Note: one fact (when, where), never a claim you can't stand behind.

## Do and don't

- **Do** let the world show: keep the hero's content narrow.
- **Don't** put more than two actions in a hero.
- **Don't** put scenery in the sky where text will flow over it on a phone; stand it on the ground.
