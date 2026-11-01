# @blip/effects

## 0.1.0

First release. The opt-in effects: the dithered world backdrop with parallax and time of day, transitions (dissolve, dither, mosaic), drop text, typewriter, glint, bursts, the CRT filter, `<blip-motion-toggle>`, a page-wide pause that sets `data-blip-motion="reduce"` on `<html>` and remembers the choice, and `<blip-attract>`, attract mode: a short demo of real markup played by a pixel pointer from a script (`move`, `press`, `type`, `wait`, `show`, `hide`, `poster`), looping while on screen, one labelled image to assistive technology with its markup inert, and every change undone between loops. The world's drifting clouds, flaring stars and events, and every demo, stop at once with the toggle (or the device's reduced motion), a demo on its still frame, and carry on when it is pressed again. Every canvas draws whole device pixels at any screen scale; the sky keeps its sun, moon, stars and clouds clear of the words named in `avoid`; the CRT is a dither of ink, never a wash; the caret, the glint and the CRT's flicker stop after a few beats; the world, the CRT and the glint stay off paper.

- Renamed from Blip: the package is `@jaatster/blip-effects` (was `@jaatster/blip-effects`); the elements are `<chu-*>` with `Blip*` classes (was `<pp-*>` and `Pixel*`), and events, attributes, classes and custom properties start `chu-`.
- Renamed from Blip: the package is `@blip/effects` (was `@jaatster/blip-effects`); the elements are `<blip-*>` with `Blip*` classes (was `<chu-*>` and `Blip*`), and events, attributes, classes and custom properties start `blip-`.
- The world repaints when the page's palette changes (`data-blip-palette`): the night sky and ground are the palette's.
