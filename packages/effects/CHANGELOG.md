# @jaatster/blip-effects

## 0.1.3

### Patch Changes

- Updated dependencies
  - @jaatster/blip-tokens@0.2.0
  - @jaatster/blip-core@0.1.2

## 0.1.2

### Patch Changes

- The world's docs show how to scroll it behind a canvas game: paint each far layer once into a strip with `drawWorld`, then slide the strips at a fraction of the camera. The examples use the palette's accent instead of pink.

## 0.1.1

### Patch Changes

- Updated dependencies
  - @jaatster/blip-tokens@0.1.1
  - @jaatster/blip-core@0.1.1

## 0.1.0

First release. The opt-in effects: the dithered world backdrop with parallax and time of day, transitions (dissolve, dither, mosaic), drop text, typewriter, glint, bursts, the CRT filter, `<blip-motion-toggle>`, a page-wide pause that sets `data-blip-motion="reduce"` on `<html>` and remembers the choice, and `<blip-attract>`, attract mode: a short demo of real markup played by a pixel pointer from a script (`move`, `press`, `type`, `wait`, `show`, `hide`, `poster`), looping while on screen, one labelled image to assistive technology with its markup inert, and every change undone between loops. The world's drifting clouds, flaring stars and events, and every demo, stop at once with the toggle (or the device's reduced motion), a demo on its still frame, and carry on when it is pressed again. Every canvas draws whole device pixels at any screen scale; the sky keeps its sun, moon, stars and clouds clear of the words named in `avoid`; the CRT is a dither of ink, never a wash; the caret, the glint and the CRT's flicker stop after a few beats; the world, the CRT and the glint stay off paper.

- The world repaints when the page's palette changes (`data-blip-palette`): the night sky and ground are the palette's.
