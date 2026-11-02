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
- **Controls:** arrow keys or WASD, Space or Z to jump, X to swipe, Esc to pause. A gamepad works too (the standard
  layout). On a phone, the kit's touch pad: A jumps, B swipes, Start pauses.
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
9. A tall pillar near the end: bounce off a Plip to reach the third star.
10. Stairs up to the goal flag. The higher you grab it, the more it scores.
