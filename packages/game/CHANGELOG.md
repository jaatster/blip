# @jaatster/blip-game

## 0.2.0

### Minor Changes

- New parts, from building Starfall with the kit:
  
  - `<blip-shout>`: a word that bursts over the play, like "Checkpoint!" or "3 stars!", then goes.
  - `<blip-tally>`: the end-of-level count, row by row, to a total and stars, with a sound per tick.
  - `.blip-hud-track`: the HUD's course track, a line from start to goal with the player's place on it.
  - `spriteCanvas(art, { tone, flip, from, fill })` and `outline`: draw the kit's sprites into a canvas for a game loop; `fill` paints a one-colour silhouette for hit flashes.
  - `.blip-prompt-mouse` (`data-button` left, right or middle) and `.blip-prompt-pill` (Start, Select, Menu): mouse and controller prompts beside the keys.
  - `<blip-counter chain>`: quick gains climb a major scale, so a run of coins sounds like a run.
  
  The dialogue example's Bramble is the teal frog in a straw hat.

## 0.1.1

### Patch Changes

- Updated dependencies
  - @jaatster/blip-tokens@0.1.1
  - @jaatster/blip-components@0.1.1
  - @jaatster/blip-core@0.1.1

## 0.1.0

First release. The game UI kit: dialogue box, choices, hearts and counters, HUD bars, inventory, button prompts, level tiles, pause menu, achievements, stage and sprites.

- Touch pad (`touch-pad.css`, `<blip-touch-pad>`, beta): a pixel D-pad and A and B (and Start) fixed to the bottom of a phone's screen, inside its safe areas, sending real `keydown` and `keyup` events (arrows, and the keys you choose) to a target; several fingers at once, it never takes focus, and it shows only on touch screens unless `data-show="always"`.
