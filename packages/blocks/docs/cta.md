---
name: CTA band
package: "@jaatster/blip-blocks"
css: cta.css
element: null
react: CtaBand
status: beta
---

# CTA band

One call to action across the page, on a strip of the world or on a candy band.

## Usage

```html
<section class="pp-cta" aria-labelledby="cta-title">
  <pp-world></pp-world>
  <h2 class="pp-cta-title pp-display pp-pop" data-scale="2" data-pop="Catch the first star" id="cta-title">Catch the first star</h2>
  <p class="pp-cta-text">Wishlist Starfall Meadow and we'll send one email on launch day.</p>
  <div class="pp-cta-actions">
    <a class="pp-box pp-button" data-size="lg" href="#wishlist">Wishlist now</a>
  </div>
  <div class="pp-cta-ground"></div>
</section>

<section class="pp-box pp-cta" data-tone="purple" aria-labelledby="press-title">
  <h2 class="pp-cta-title pp-display" data-scale="1" id="press-title">Writing about the game?</h2>
  <p class="pp-cta-text">Screenshots, the trailer, logos and a fact sheet, in one download.</p>
  <div class="pp-cta-actions"><a class="pp-box pp-button" data-variant="outline" href="#press">Get the press kit</a></div>
</section>
```

## Anatomy

1. **Band**: on the world (`.pp-cta`: sky bands of the nearest scheme, `pp-world`, ground) or candy
   (`.pp-box.pp-cta`: a candy box, radius 5).
2. **Title** (`.pp-cta-title`): POP on the world, Pixel Bop in the tone's ink on candy.
3. **Text** (`.pp-cta-text`), **actions** (`.pp-cta-actions`), **note** (`.pp-cta-note`).
4. **Ground** (`.pp-cta-ground`): a shorter strip of grass and dirt.

## Variants

| Markup | Button | Use |
|---|---|---|
| `.pp-cta` | candy | The main ask of the page. Candy stands on pastel. |
| `.pp-box.pp-cta` with `data-tone` | outline | A secondary ask. Candy never stands on candy. |

## Accessibility

A `<section>` named by its title. Text is the scheme's text on the sky, or the tone's ink on candy (AA). Keep one
primary action.

## Content

Title: the action's reward in a few words. Text: what happens when you act, and what won't ("Nothing else").

## Do and don't

- **Do** use one CTA band per page, two at most.
- **Don't** repeat the hero's exact words.
