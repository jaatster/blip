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
`<chu-world>` from `@jaatster/blip-effects`; before it draws, or without it, the hero's own sky is the scheme's palette in
hard bands, dithered where they meet.

## Usage

```html
<section class="chu-hero" aria-labelledby="hero-title">
  <chu-world parallax avoid=".chu-hero-title, .chu-hero-lead, .chu-hero-actions, .chu-hero-note"></chu-world>
  <div class="chu-hero-inner">
    <h1 class="chu-hero-title chu-display" id="hero-title">
      <span class="chu-sr-only">Starfall Meadow</span>
      <span aria-hidden="true">
        <span class="chu-hero-word"><span class="chu-pop chu-drop-in" data-pop="S" style="--i: 0">S</span><span class="chu-pop chu-drop-in" data-pop="t" style="--i: 1">t</span>…</span>
        <span class="chu-hero-word"><span class="chu-pop chu-drop-in" data-pop="M" style="--i: 9">M</span>…</span>
      </span>
    </h1>
    <p class="chu-hero-lead">Catch the stars that fall on the meadow before the sun comes up.</p>
    <div class="chu-hero-actions">
      <a class="chu-box chu-button" data-size="lg" href="#editions">Wishlist now</a>
      <a class="chu-box chu-button" data-size="lg" data-variant="soft" data-tone="neutral" href="#demo">Play the free demo</a>
    </div>
    <p class="chu-hero-note">Out this spring, on desktop</p>
  </div>
  <div class="chu-hero-scenery" aria-hidden="true">…sprites standing on the ground…</div>
  <div class="chu-hero-ground"></div>
</section>
```

Splitting the headline by hand is tedious; any template can do it:

```js
let i = 0;
const word = (w) => `<span class="chu-hero-word">${[...w].map((c) => `<span class="chu-pop chu-drop-in" data-pop="${c}" style="--i:${i++}">${c}</span>`).join("")}</span>`;
const letters = (text) => text.split(" ").map((w) => { const html = word(w); i++; return html; }).join(" ");
```

## Anatomy

1. **Sky**: the hero's background (six bands of the nearest scheme's sky, up from the ground), under `chu-world`.
2. **Headline** (`.chu-hero-title`): Pixel Bop in POP at the whole scale that fits: 2 below 600 px wide (the medium
   breakpoint), 3 below 1024 px (wide), 4 above. Words never break; lines balance.
3. **Lead** (`.chu-hero-lead`), **actions** (`.chu-hero-actions`), **note** (`.chu-hero-note`). The world's `avoid`
   names these and the headline, so the sun and moon find the sky beside the words and no star or cloud sits behind
   them; the lead and the note also wear a one-pixel halo in the page colour, so they stay readable where they cross
   a snowy peak, the moon or a cloud.
4. **Scenery** (`.chu-hero-scenery`): things standing on the ground, behind the text.
5. **Ground** (`.chu-hero-ground`): blades of grass, grass, a lip, dirt with pebbles, flowers.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-align` | centred (default), `start` | Start-aligned text for a hero beside a picture. |
| `avoid` on its `chu-world` | `.chu-hero-title, .chu-hero-lead, .chu-hero-actions, .chu-hero-note` | Keeps the sun, the moon, the stars, clouds and shooting stars clear of the words (and of anything else you name). Name the parts, not `.chu-hero-inner`: the inner is as wide as the hero, the parts are as wide as their words. |
| `--chu-hero-band` | 16 | The fallback sky bands' height in pixels. |
| `--chu-hero-ground` | 24 | The ground's height in pixels. |
| `--chu-hero-tint`, `--chu-hero-drop` | the accent's light and shade | The headline's POP colours. |

## States

The letters drop in on load: each waits `--i` frames hidden, then appears two pixels high for a frame and lands, as
the TV's app names did. A beat between words. With reduced motion the headline is simply there.

## Accessibility

- The headline is read from its hidden copy (`.chu-sr-only`); the letters are `aria-hidden`, so screen readers say
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
