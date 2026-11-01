---
name: Stage
package: "@jaatster/blip-game"
css: stage.css
element: null
react: Stage
status: beta
---

# Stage

A game screen for a HUD, a menu or a map to sit on: a positioned frame with a pastel sky and a ground strip. Put
`<pp-world>` from `@jaatster/blip-effects` inside for the full dithered world, with mountains, hills and clouds. Without it,
and before it draws, the sky is the scheme's world palette in six hard bands, stepping up from the horizon and
dithered where they meet: never a smooth gradient.

## Usage

```html
<section class="pp-stage" data-frame aria-label="Puddle Path">
  <pp-world></pp-world>
  <div class="pp-hud">…</div>
  <div class="pp-stage-ground"></div>
</section>
```

## Anatomy

1. **Sky**: the stage's background, six bands of the nearest scheme's sky (`--pp-stage-band` pixels each, 12),
   counted up from the ground, with a checkerboard row each way where two meet.
2. **World** (`pp-world`, optional): fills the stage behind everything.
3. **Ground** (`.pp-stage-ground`): blades of grass, a light top row, grass, a darker lip, then dirt with pebbles and
   a few flowers (`--pp-stage-ground` pixels, 16).
4. **Scrim** (`.pp-scrim`, optional): a dithered ink layer over everything, for a pause.

## Variants

| Attribute | Use |
|---|---|
| `data-frame` | An ink edge and a drop, for a screen set into a page. |
| `data-pp-scheme` | A stage can carry its own scheme: a night level on a day page. |

## Accessibility

The stage is scenery: give the section a name if it is a region of the page, and keep everything readable on top of
it (POP text reads on any sky). Windows high contrast shows a plain canvas. On paper the sky, the ground and the
world stay off: only what stands on the stage prints.

## Narrow stages

A stage is a size container: it takes the width it is given and cannot grow to fit what is on it. On a narrow one,
display text on it steps down a whole scale, never breaking inside a word or number: at most scale 2 when its
content box is under 480 px, and scale 1 under 320 px (a phone).

## API

| Custom property | Default | |
|---|---|---|
| `--pp-stage-band` | 12 | Each sky band's height, in pixels. |
| `--pp-stage-ground` | 16 | The ground's height, in pixels. |
| `--pp-stage-sky-1` … `-6`, `--pp-stage-grass`, `--pp-stage-dirt` … | the scheme's | The palette, set on each scheme root. |
