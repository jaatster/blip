---
name: World
package: "@jaatster/blip-effects"
css: world.css
element: pp-world
react: World
status: beta
---

# World

The TV's backdrop: a soft pastel landscape with a dithered sky, snowy mountains, trees on the hills, a meadow, grass
and dirt, for Day, Sunset and Night. It is drawn in the browser a pixel at a time (no image files), at the page's
pixel made a whole number of device pixels, so it stays crisp and even on a 125% or 175% screen, and it is only
redrawn when its size, its screen or its time of day changes. Put it behind a hero, a title screen, a game menu or
an empty state.

## Usage

```html
<section style="position: relative">
  <pp-world scheme="day" parallax avoid="h1"></pp-world>
  <h1 class="pp-display pp-pop" data-scale="3" data-pop="Blip">Blip</h1>
</section>
```

```js
import "@jaatster/blip-effects/world";                         // defines <pp-world>
import { drawWorld } from "@jaatster/blip-effects/world";
drawWorld(canvas.getContext("2d"), "night");               // the TV's 320 x 180 picture, for a game or a poster
```

`<pp-world>` fills its positioned container (`position: absolute; inset: 0`). The container becomes its own stacking
context, so the world sits behind the container's content and in front of its background.

### Where its motion belongs

A still world (no `clouds`, `stars` or `events`) can sit behind any hero, title screen, call to action or empty state.
Motion that runs on (drifting clouds, flaring stars, passing birds) is for moments where it adds to the look: a hero,
a title or attract screen, a call to action, a game's stage. It never goes behind reading text, forms or dashboards,
where it pulls the eye from the work. A page whose world moves shows the [motion toggle](motion-toggle.md), which
pauses all of it at once and remembers the choice (WCAG 2.2.2, Pause, Stop, Hide):

```html
<pp-world parallax clouds stars events avoid="h1"></pp-world>
…
<pp-motion-toggle></pp-motion-toggle>
```

### Keeping the sky clear of the words

The moon, the sun and the stars belong to the sky, not behind a headline or between its words. `avoid` takes a
selector list of what they keep clear of, matched in the world's container (its parent, or the nearest ancestor that
holds a match):

```html
<section class="pp-hero" aria-labelledby="hero-title">
  <pp-world parallax avoid=".pp-hero-title, .pp-hero-lead, .pp-hero-actions, .pp-hero-note"></pp-world>
  …
</section>
```

Clouds that would sit behind an avoided element are left out; a drifting cloud passes behind it out of sight and
comes back past it.

Each box gets a margin of five world pixels (more up and down when the world slides with `parallax`). Then:

- the **moon** stays where the TV has it if that is clear; otherwise it takes the nearest clear place in the sky above
  the peaks, its own row first;
- the **sun** slides along its lane, the horizon, to the nearest clear place;
- a **star** that would sit on or near a box (within a flare's arms and the margin) is left out, so none lands
  between words or under letters; the stars that flare are the ones still shown, and a **shooting star**'s whole
  streak is clear;
- where its part of the sky has no clear place, each goes to the same place across the sky if that is clear, and
  otherwise stays out of sight: nothing in the sky sits behind the words.

Places are whole world pixels and the same every time for the same layout. They are worked out again whenever the
world or one of the avoided elements resizes (text wrapping, a font arriving), and on `avoid` changing.

## Anatomy

Five layers, back to front, each its own canvas so parallax can slide them:

1. **Sky**: six stops blended with a 4 x 4 Bayer dither; the sun at sunset; the moon (with craters and a dithered
   glow) and sixty stars at night; clouds in three tones.
2. **Peaks**: mountains with a lit face, a shadow face, a lit edge and zigzag snow.
3. **Hills**: round trees and pines along the middle hills.
4. **Near**: the near hills, bushes and grass tufts.
5. **Ground**: grass, a grass lip hanging over the dirt, pebbles, flowers.

Over the sky: drifting clouds, two flaring stars, a flock of birds or a shooting star.

Each canvas holds a world pixel per canvas pixel and is scaled up by the world pixel's whole number of device pixels,
placed on whole device pixels; the layers slide by transforms, never by fractions of a layout pixel.

At 320 x 180 world pixels the picture is the TV's, pixel for pixel. A wider world keeps the TV's composition in the
middle and carries on to the sides in 350-pixel periods of the same landscape (the same seeds in the middle, others
beside it). A taller one stretches its sky; a shorter one gives up dirt first, then meadow, then sky, so the
mountains stay in view.

## Variants

| Attribute | Values | |
|---|---|---|
| `scheme` | `day`, `sunset`, `night`, `auto`, or left out | Left out, the world follows the page's scheme (`data-pp-scheme`, or the device's dark mode), stepping its palette over a minute when the page's Auto changes. `auto` follows the clock itself (Day 6:00 to 17:00, Sunset to 19:00, Night after; `services.now()`), and steps through six mixed palettes, ten seconds apart, when the time of day changes; the sun, moon and stars switch halfway. |
| `parallax` | | The layers slide against the pointer, 0 to 4 pixels a step (the sky stays put), and lift a little as the world scrolls past. Two steps a move, each on a whole pixel, even when a move is cut short by the next. |
| `clouds` | absent, present (`drift`), `none` | Absent (or `"false"`): still clouds, as on the TV's Home. Present: they drift right at a tenth of their size in pixels a second, a whole pixel at a time, as on the screensaver, for as long as the page is open: show the motion toggle. `none`: no clouds. |
| `stars` | | At night, a real star flares now and then: small, big, small, gone (at most two). It runs on: show the motion toggle. |
| `events` | | A few seconds in, then every one to two minutes: by day and at sunset a flock of three crosses the sky in a loose V, flapping; at night a shooting star streaks down and left in nine frames. It runs on: show the motion toggle. |
| `zoom` | a whole number, default `1` | World pixel = zoom x `--pp-pixel`, made a whole number of device pixels. `zoom="2"` at full screen is the TV's own scale. |
| `avoid` | a selector list, default none | What the sun, the moon, the stars, clouds and shooting stars keep clear of: matched in the world's container, each box with a five-pixel margin. See above. |

## States

| State | Look |
|---|---|
| Reduced motion | A still, correct frame: no drift, no flares, no events, no parallax, no fades. |
| Paused (the motion toggle, or the device's reduced motion turned on) | Stops at once: a flaring star goes out, a flock or a shooting star goes, the layers come back to rest, a fade lands, and the clouds stop where they are. When the pause ends, it carries on from there. |
| Hidden tab, or scrolled out of view | Nothing moves (clouds, stars, birds, parallax). A change of time of day or of size is still drawn, so the world is right when it comes back. |
| Loading (before the script) | The sky's top colour. |
| A 125%, 150% or 175% screen | Every world pixel is the same whole number of device pixels (3, 3 or 4 at the 2 px pixel), so nothing blurs or wobbles. Moving the window to another screen draws it again. |
| Forced colours, print | Hidden: it is decoration. |

## Accessibility

- The world is decoration: it is `aria-hidden` and takes no pointer events. Put any meaning in the content.
- Text on the world: use POP (`.pp-pop`) for big text and OUTLINE (`.pp-outline`) for small text, which read on every
  sky, or a one-pixel halo in the page colour, as the hero's lead and the call to action's text wear. Plain text
  needs a panel behind it. Name the text in `avoid`, so no moon, star or cloud sits behind it.
- Motion is small and slow, stops with reduced motion, and pauses at once with `data-pp-motion="reduce"` on `<html>`,
  which the [motion toggle](motion-toggle.md) sets. With `clouds`, `stars` or `events` the motion runs on, so the
  page must offer that pause (WCAG 2.2.2): show the toggle.

## Do and don't

- **Do** use one world per view, behind the main content.
- **Do** let the world follow the page (leave `scheme` out) when the page has a scheme switcher or Auto.
- **Do** give a world with words over it `avoid`, naming the words (not a wide wrapper), so the moon finds the sky
  beside them.
- **Do** show the motion toggle on a page whose world drifts, flares or has events.
- **Don't** put a moving world behind reading text, forms or dashboards; a still one, or none, belongs there.
- **Don't** put candy boxes straight on a busy part of the world without a panel; candy stands on pastel, and the
  ground is busy.
- **Don't** scale the world with CSS transforms; set `zoom` or the page's pixel.

## API

| | | |
|---|---|---|
| `scheme`, `parallax`, `clouds`, `stars`, `events`, `zoom`, `avoid` | properties | Mirror the attributes (`scheme` reads `inherit` when left out). |
| `drawWorld(ctx, scheme, w = 320, h = 180, options)` | function | Draws the world into a 2D context at (0, 0). Options: `palette`, `from` (an element whose tokens to read), `features` (which time of day's sun, moon and stars), `clouds` (default `true`), `layer` (`sky`, `peaks`, `hills`, `near`, `ground`), `avoid` (boxes in world pixels, `[x0, y0, x1, y1]`, that the sun, the moon, the stars and the clouds keep clear of). |
| `worldPalette(scheme, from?)` | function | The 44 colours (0xRRGGBB) from the `--pp-world-*` tokens. A palette pack repaints the world by overriding them. |
| `--pp-pixel` | custom property | The world pixel (times `zoom`). |
