# Starfall: the game template becomes a game

Plan for turning the game menu template (`/templates/game/`) into a small action platformer with one level, agreed
with the owner on 2026-11-02 and built the same day. The game is in `apps/docs/public/js/starfall/` (the rules in
`engine.js`, tested in `tests/unit/node/starfall.test.ts`, the level in `level.js`, the drawing in `render.js`) and
`tpl-game.js`.

## What it is now

A title screen, a main menu with Options, a level screen and a pause menu, all real Blip UI. The "level" is a coin
button and Bramble the frog's dialogue on a strip of ground: nothing to play.

## What it becomes

The same screens, with a real level in the middle:

1. **Title:** "Starfall" drops in on the world; Press start.
2. **Main menu:** New game, Continue (from the last checkpoint, kept in localStorage), Options, Back to the docs.
3. **The level, "1-1 Puddle Path":** a side-scrolling level about two minutes long.
4. **Pause** (Esc, Start, or the HUD's button): Resume, Restart, Quit to title. It shows coins, stars and time.
5. **Level clear:** the stars you found, coins, time and score, a best score kept locally, and Play again.
6. **Game over** (no hearts left): Try again from the checkpoint, or Quit.

## The level

- **Moves:** run, jump (higher while held; with the coyote time and jump buffer that make jumps feel fair), and a
  short sword swipe. Landing on an enemy defeats it too.
- **Enemies:** a slow walker that turns at edges, and a hopper. A hit costs a heart, with a moment of flashing
  safety after it.
- **Things to find:** coins (100 coins give a heart back), three stars (some off the main path), a checkpoint flag,
  and the goal flag at the end.
- **Hazards:** pits and puddles. Falling in costs a heart and puts you back at the checkpoint.
- **Bramble:** standing at the washed-out rope bridge, with the dialogue the template already has. Pay 30 coins and he
  patches it; say "maybe later" and you have to find the long way round, over the treetops.
- **Time:** 5:00 on the clock, as the HUD says now. Leftover time is added to the score.

## How it is built

- **Drawn in a canvas**, at whole pixels: about 320 x 180 Blip pixels, scaled up by a whole number to fit the
  screen, so everything stays crisp. Tiles are 12 x 12 pixels.
- **Blip's colours only.** The canvas reads the tokens, so the level repaints with Day, Sunset and Night (the Options
  switch, or the clock) and with every palette. Coins, stars, hearts and the sword come from the kit's sprites
  (`pixels(name)`). The hero, the enemies and the tiles are new pixel art in the same style.
- **The level is text:** rows of characters, one per tile (`#` ground, `o` coin, `*` star and so on), easy to read
  and edit.
- **The HUD, dialogue and menus stay real HTML** on top of the canvas: the kit's hearts, counters, dialogue, choices
  and pause dialog, so they work with a keyboard and screen readers as they do now.
- **Controls:** keyboard and mouse (A and D or the arrows to run; Space, W or ↑ to jump; a click or X to swipe; E or a
  right click to talk; S and Space to drop through a plank), or the console layout (the arrows, Z, X). A gamepad in
  the standard layout: A jumps, B or X swipes, Y talks, Start pauses. On a phone, the kit's touch pad, and a tap on
  the Talk hint.
- **Sound:** the sound kit's chip sounds (jump, coin, bump, success, error) when sound is on in Options.
- **Reduced motion:** no screen shake or particle bursts, and the camera moves more gently. The game also pauses when
  the tab is hidden.
- **Tests:** unit tests for the physics, collisions and level reading, and one browser test that starts the game,
  runs, jumps, collects a coin and pauses.

## Steps

1. The engine: the level text, physics, collisions, camera and drawing, with a plain test level.
2. The art: the hero (standing, running, jumping, hurt and swiping), two enemies and the tiles.
3. Level 1-1, Bramble's bridge, the checkpoint and the goal.
4. The screens wired up: menu, pause, level clear, game over, saving.
5. Phones, gamepad, sound, reduced motion, then tests, `pnpm verify`, and live.

You see the level running after step 3, before the polish.

## Decided (2026-11-02)

The owner said go, and asked for good game design that makes great use of the design system, with new components
where the game needs them.

1. **The game logic lives in the template.** A design system should not ship a physics engine. Everything a game's
   screen is made of goes into the game kit instead (below).
2. **The hero is Pip**, a small frog in a red scarf, Bramble's nephew.
3. **The sword is in**, on B / X.
4. **The hills scroll behind the level** without new API: `drawWorld` already draws any one layer at any width, and
   the landscape carries on sideways. The game draws each far layer once into a wide strip and slides the strips
   slower than the ground.

## New in the game kit

- **`@jaatster/blip-game/canvas`:** the kit's sprites, and pixel maps of your own in the sprites' language, painted
  into a canvas in the token colours, so a canvas game follows the scheme and the palette.
- **`<blip-shout>`:** big POP words across the screen ("Ready?", "Go!", "Checkpoint!", "Hurry up!", "Level clear!"),
  queued, said to screen readers, and still with reduced motion.
- **`<blip-tally>`:** the results screen: the stars earned land one by one, each row counts up, the total, a new best.
- **The HUD's course track (`.blip-hud-track`):** how far through the level you are, with the checkpoint and the goal
  marked.

Each comes with its docs page, example, React wrapper, tests and baselines, like every other part of the kit.

## The level, in order

1. A safe start: run, then a step to jump, with a tooltip hint for each and coins showing the way.
2. A small gap, and a row of candy blocks to hit from below.
3. The first Grub (a walker) on flat ground: jump on it, or swipe.
4. A puddle with stepping stones; the first star on a high ledge above it.
5. Stairs, more Grubs, a potion on a ledge. Then the checkpoint flag.
6. Plips (hoppers) over a longer puddle.
7. Bramble at the washed-out bridge. Pay him 30 coins and he patches it, plank by plank. Or climb the trees: the
   treetop way is harder, and has the key.
8. After the bridge: blocks, a gem, Grubs, and the locked chest. The key opens it: the second star.
9. A stone ledge too high to jump to, the path running on under it: bounce off a Plip onto it for the third star.
10. Stairs up to the goal flag. The higher you grab it, the more it scores.

## Game feel (after the first playtest)

The owner found the camera odd and the jumps and coins flat. [RESEARCH-GAME-FEEL.md](RESEARCH-GAME-FEEL.md) has the
practices, from their sources; this is what Starfall does with them.

- **Camera** (Keren): dual forward focus, 40 pixels ahead, turning only after Pip has gone 24 pixels the other way,
  sliding at his speed (so the camera turns at twice it); a 6-pixel window where it holds still; locked to him past
  it; a glide after a respawn; clamped to the level. It scrolls in sub-pixel steps: the level is drawn at the whole
  pixel and the canvas slides by the fraction, in device pixels, so the art stays crisp. Everything that moves is
  drawn between its last two places on screens faster than 60 Hz.
- **Shake** (Eiserloh, Nijman): trauma, added by hits, splashes, stomps and hard landings, gone in three quarters of a
  second, drawn as trauma squared along smooth noise, at most 2 pixels. A switch in the options; off with less motion.
- **Running and jumping** (Celeste, Pittman): full speed in about 6 steps, a turn in about 11, two thirds of the grip in
  the air; a jump of 4 tiles in 22 steps, falling 2.3 times as fast; half gravity at the top while jump is held; a tap
  cut to a hop; coyote time and a buffer that jumps on the landing step.
- **Forgiveness:** a ceiling's corner clipped by 5 pixels or less is slid past; a ledge's last 4 pixels are stepped
  up; a plank 4 pixels short at the top of a jump still holds; pickups are taken 3 pixels early.
- **Juice:** Pip stretches as he jumps and squashes as he lands, more the harder he lands, in whole pixels; dust at
  takeoff, on landing (more on a hard one), and behind him as he runs; landing sounds; repeated sounds vary a
  semitone; coins spin, pop up flashing white and burst into sparkles, climb a major scale as a run of them is picked
  up, and a coin from a block springs out of it; stomps in a row climb too; hit enemies flash white; 3 or 4 steps of
  hit-stop.

Not done: stereo panning (the sound kit plays in mono), water slowing a fall (here water is a hazard), and a shake
slider (a switch instead).

## After the second playtest

- **No soft-lock at the third star.** The tall pillar blocked the way, and stomping its Plip defeated it: one miss and
  Pip was stuck. A Plip is now a spring (landing on one throws Pip high and it stays for another go; only the sword
  beats it), and the star sits on a ledge the path runs under. A test checks the way on is never blocked.
- **Bramble's own face** in his dialogue, drawn from the game's art (the kit's dialogue example draws a green frog
  much like Pip).
- **Controls** as above: the mouse swipes and talks, ↑ and W jump, E talks, and the hints show the keys of what was
  used last (the keyboard and mouse, a gamepad, or the touch pad).
