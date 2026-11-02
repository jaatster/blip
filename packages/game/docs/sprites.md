---
name: Sprites
package: "@jaatster/blip-game"
css: sprites.css
element: blip-sprite
react: Sprite
status: beta
---

# Sprites

The game kit's art: coins, gems, hearts, stars, keys, potions, chests, trophies, padlocks, a pointer, an arrow,
sparkles, a sword, a shield and a clock. Whole-pixel, multi-colour SVG in token colours with a one-pixel ink outline,
one sprite pixel to one Blip pixel, so sprites line up with every box and letter at any `--blip-pixel`.

## Usage

```html
<blip-sprite name="coin"></blip-sprite>
<blip-sprite name="potion" data-tone="blue" aria-label="Mana potion"></blip-sprite>
```

```js
import { sprite, spriteNames } from "@jaatster/blip-game/sprites";
el.innerHTML = sprite("heart-half");                     // the same SVG as a string: servers, templates
sprite("gem", { tone: "teal", label: "Teal gem" });
```

## Anatomy

Each sprite is drawn as its fill, one character per pixel; the ink outline is added round it (four-neighbour, so
corners come out notched like the candy box). Colours are the candy tokens: a sprite's own candy as light, base and
shade, plus white glints and the fixed colours of its materials (a cork, a slate shackle, a yellow star).

| Sprite | Size (pixels) | Tone |
|---|---|---|
| `coin` | 8 x 10 | yellow, fixed |
| `gem` | 11 x 10 | purple |
| `heart`, `heart-half`, `heart-empty` | 11 x 10 | red; empty is slate |
| `star`, `star-empty` | 13 x 12 | yellow; empty is slate |
| `key` | 14 x 8 | orange |
| `potion` | 11 x 13 | red |
| `chest` | 15 x 11 | orange, slate bands |
| `trophy` | 15 x 13 | orange, a yellow star |
| `padlock` | 13 x 12 | orange, a slate shackle |
| `pointer` | 14 x 10 | white glove |
| `arrow` | 10 x 6 | the scheme's accent |
| `sparkle`, `sparkle-small` | 5 x 5, 3 x 3 | yellow light, no outline (it belongs to the sky) |
| `sword`, `shield` | 13 x 14 | blue |
| `clock` | 11 x 10 | red |

## Variants

`data-tone` on `blip-sprite` (or the SVG) recolours the sprite's own candy: any candy name, `neutral` or `accent`.
Potions, gems, keys, hearts, swords and shields are made for it.

## Accessibility

- With `aria-label` a sprite is a picture (`role="img"`); without, it is decoration and hidden from assistive tech.
  Inside a named control (a slot, a tile) leave it unnamed and name the control.
- Sprites keep their colours in Windows high contrast, as images do.

## Canvas games

A game drawn in a `<canvas>` gets the same art from `@jaatster/blip-game/canvas.js`: `spriteCanvas()` paints a sprite
into a small canvas at one canvas pixel to one sprite pixel, in the token colours at an element, so it follows the
time of day and the palette. Your own art can be drawn in the sprites' language and gets the same ink outline:

```js
import { spriteCanvas } from "@jaatster/blip-game/canvas.js";

const coin = spriteCanvas("coin");
const frog = spriteCanvas({ map: "..ll./.lwol/lcccc/.lcs.", tone: "green" });   // l c s: the tone's light, base, shade
const back = spriteCanvas({ map: "..ll./.lwol/lcccc/.lcs.", tone: "green" }, { flip: true });
const flash = spriteCanvas("coin", { fill: "var(--blip-white)" });                // one colour: a hit's flash
ctx.drawImage(coin, x, y);   // whole pixels, on a canvas scaled up with image-rendering: pixelated
```

A map is the fill, one character a pixel, rows split by `/`; the outline is added round it, and `o` inside it draws
ink. The other keys are the colours the sprites use: `w` white; `y Y d` yellow; `g G h` slate; `n N m` orange; `k K`
cream; `b B v` blue; `r R x` red, each light, base, shade. A leading `!` leaves the outline off. The canvases read the
tokens when they are made: keep them, and make them again when the scheme or the palette changes. [Starfall](https://jaatster.com/blip/play/), the
game on Blip's site, draws its hero, its enemies and its blocks this way.

## Do and don't

- **Do** use sprites at one sprite pixel to one Blip pixel. For bigger art, raise the pixel for the section
  (`data-blip-pixel="3"`), never scale a sprite.
- **Don't** colour a sprite yellow unless it is a coin, a star or a sparkle: yellow means focus.

## API

| Export | |
|---|---|
| `sprite(name, { tone, label })` | The SVG string; empty for an unknown name. |
| `spriteNames` | Every name. |
| `pixels(name)` | The outlined pixel rows, for canvas games and tools. |
| `BlipSprite` | The `blip-sprite` element: `name` mirrors the attribute. |
| `spriteCanvas(art, { tone, flip, from, fill })` | From `canvas.js`: a sprite's name, or `{ map, tone }`, painted into a canvas in the token colours at `from` (the page by default), or all in one colour with `fill`. Undefined for an unknown name. |
| `outline(map)` | From `canvas.js`: your own map's pixel rows with the ink outline added. |

| Custom property | |
|---|---|
| `--blip-sprite-light`, `--blip-sprite-base`, `--blip-sprite-shade` | A custom tone, set on the sprite. |
