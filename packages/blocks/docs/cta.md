---
name: CTA band
package: "@jaatster/blip-blocks"
css: cta.css
element: null
react: CtaBand
status: beta
---

# CTA band

One call to action across the page, on a strip of the world or, for a quieter second ask, on a soft panel.

## Usage

```html
<section class="pp-cta" aria-labelledby="cta-title">
  <pp-world avoid=".pp-cta-title, .pp-cta-text, .pp-cta-actions, .pp-cta-note"></pp-world>
  <h2 class="pp-cta-title pp-display pp-pop" data-scale="2" data-pop="Catch the first star" id="cta-title">Catch the first star</h2>
  <p class="pp-cta-text">Wishlist Starfall Meadow and we'll send one email on launch day.</p>
  <div class="pp-cta-actions">
    <a class="pp-box pp-button" data-size="lg" href="#wishlist">Wishlist now</a>
  </div>
  <div class="pp-cta-ground"></div>
</section>

<section class="pp-box pp-cta" data-variant="soft" data-tone="purple" aria-labelledby="press-title">
  <h2 class="pp-cta-title pp-display" data-scale="1" id="press-title">Writing about the game?</h2>
  <p class="pp-cta-text">Screenshots, the trailer, logos and a fact sheet, in one download.</p>
  <div class="pp-cta-actions"><a class="pp-box pp-button" data-variant="outline" href="#press">Get the press kit</a></div>
</section>
```

## Anatomy

1. **Band**: on the world (`.pp-cta`: sky bands of the nearest scheme, `pp-world`, ground) or in a box
   (`.pp-box.pp-cta`: the soft tier by default, radius 5: the tone's light fill with its base as a lip along the
   bottom; `data-variant="panel"` for the plain surface). Never a slab of candy: candy stays on the button.
2. **Title** (`.pp-cta-title`): POP on the world, Pixel Bop at scale 1 in ink on a soft panel.
3. **Text** (`.pp-cta-text`), **actions** (`.pp-cta-actions`), **note** (`.pp-cta-note`). On the world the text and
   the note wear a one-pixel halo in the page colour, so they stay readable where they cross a snowy peak, the moon
   or a cloud.
4. **Ground** (`.pp-cta-ground`): a shorter strip of grass and dirt.

## Variants

| Markup | Button | Use |
|---|---|---|
| `.pp-cta` | candy | The main ask of the page. Candy stands on pastel. Give its world `avoid` (the title, text, actions and note) so the sun, the moon, the stars and clouds stay clear of the words. |
| `.pp-box.pp-cta` with `data-tone` (soft by default) | outline | A secondary ask, quieter: a soft panel in the tone. |
| `.pp-box.pp-cta` with `data-variant="panel"` | outline | The same ask on the plain surface. |

## Accessibility

A `<section>` named by its title. Text is the scheme's text on the sky, or ink on the soft panel's light fill (AA in
every scheme: the soft panel stays light at night). Keep one primary action. On paper the band on the world prints
its words and buttons only, without the sky, the ground or the world.

## Content

Title: the action's reward in a few words. Text: what happens when you act, and what won't ("Nothing else").

## Do and don't

- **Do** use one CTA band per page, two at most.
- **Don't** repeat the hero's exact words.
