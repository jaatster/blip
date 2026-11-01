# @jaatster/blip-game

## Unreleased

- Touch pad (`touch-pad.css`, `<chu-touch-pad>`, beta): a pixel D-pad and A and B (and Start) fixed to the bottom of a phone's screen, inside its safe areas, sending real `keydown` and `keyup` events (arrows, and the keys you choose) to a target; several fingers at once, it never takes focus, and it shows only on touch screens unless `data-show="always"`.

## 0.1.0

First release. The game UI kit: dialogue box, choices, hearts and counters, HUD bars, inventory, button prompts, level tiles, pause menu, achievements, stage and sprites.

- Renamed from Blip: the package is `@jaatster/blip-game` (was `@jaatster/blip-game`); the elements are `<chu-*>` with `Blip*` classes (was `<pp-*>` and `Pixel*`), and events, attributes, classes and custom properties start `chu-`.
