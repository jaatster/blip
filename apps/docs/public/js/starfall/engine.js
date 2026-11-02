// Starfall's rules: the level, Pip, the Grubs and the Plips, what is picked up and what hurts. No DOM and no drawing
// here (render.js draws, tpl-game.js plays), so tests run it in Node. Everything is in game pixels and 60 steps a
// second; step() takes the buttons held and leaves what happened in game.events for the screen to show and sound.

export const TILE = 12, STEPS = 60;

// How Pip moves, in pixels a step (RESEARCH-GAME-FEEL.md has the sources). Running is Celeste's: full speed in about
// six steps, a turn in about eleven, two thirds of the grip in the air. A jump is set by its height and its time to
// the top (Pittman): four tiles in 22 steps. It falls 2.3 times as fast as it rises, hangs at half gravity near the
// top while jump is held, and a tap is cut short to a hop.
const RUN = 1.5, ACCEL = 0.28, AIR = 0.65, FALL = 4;
const JUMP_H = 48, JUMP_T = 22, JUMP = (-2 * JUMP_H) / JUMP_T, RISE = (2 * JUMP_H) / JUMP_T ** 2, DROP = 2.3 * RISE, HANG = 0.67, CUT = -2;
const COYOTE = 6, BUFFER = 7, BOUNCE = -3.2, BOUNCE_HELD = -4.6, PLIP_BOUNCE = -6.2;
/** Forgiveness: slide past a ceiling's corner by up to 5 pixels, step up a ledge's last 4, catch a plank 4 short. */
const CORNER = 5, LEDGE = 4, CATCH = 4;
const SWIPE = 14, SWIPE_HITS = [2, 10], SWIPE_COOL = 22, SAFE = 90, TALK = 22;
/** Shake: trauma from 0 to 1, added by what happens, gone in three quarters of a second; drawn as trauma squared. */
const TRAUMA = { hurt: 0.5, splash: 0.35, stomp: 0.2, swipe: 0.15, bump: 0.15, land: 0.2 };
/** The camera: Pip's look-ahead, how far he must go the other way before it turns, and its window. */
const LOOK = 40, TURN = 24, WINDOW = 6;
/** Grubs and Plips fall as they always have. */
const FOE_GRAVITY = 0.24;
/** What the flag pays for the height it was grabbed at, top first. */
const FLAG = [5000, 2000, 1000, 800, 400, 200, 100];

const SOLID = "#=BRK", ONE_WAY = "-&";
/** Grub: walks, turns at walls and edges. Plip: hops at Pip when close. */
const ENEMY = { g: { kind: "grub", w: 10, h: 7 }, p: { kind: "plip", w: 8, h: 7 } };
const ITEM = { o: "coin", "*": "star", "+": "potion", k: "key", v: "gem" };

/**
 * Reads a level: rows of characters, one a tile (level.js has the legend). The things in it become objects; the tiles
 * left are the ground, the water and the platforms.
 */
export function parse(level) {
  const rows = level.rows.map((r) => [...r]);
  const h = rows.length, w = Math.max(...rows.map((r) => r.length));
  const out = { w, h, rows, items: [], enemies: [], blocks: new Map(), signs: [], start: null, flag: null, goal: null, chest: null, bramble: null, bridge: null };
  let stars = 0, n = 0;
  rows.forEach((row, r) => {
    for (let c = 0; c < w; c++) {
      const ch = row[c] ?? ".";
      const x = c * TILE, y = r * TILE;
      if (ITEM[ch]) out.items.push({ id: n++, kind: ITEM[ch], x: x + 2, y: y + 1, w: 8, h: 10, star: ch === "*" ? stars++ : undefined });
      else if (ENEMY[ch]) out.enemies.push({ ...ENEMY[ch], id: n++, c, x: x + 1, y: y + TILE - ENEMY[ch].h });
      else if (ch === "B" || ch === "R") out.blocks.set(`${c},${r}`, { c, r, gives: ch === "R" ? "gem" : "coin", bump: 0 });
      else if (ch === "@") out.start = { x: x + 2, y: y + 1 };
      else if (ch === "S") out.signs.push({ x: x + TILE / 2, y, hint: out.signs.length });
      else if (ch === "F") out.flag = { x: x + TILE / 2, y: y + TILE, c };
      else if (ch === "C") {
        out.chest = { x: x - 2, y: y + 1, w: 15, h: 11 };
        out.items.push({ id: n++, kind: "star", hidden: true, x: x + 2, y: y + 1, w: 8, h: 10, star: stars++ });
      }
      else if (ch === "b") out.bramble = { x: x + TILE / 2, y: y + TILE };
      else if (ch === "E") {
        let top = r;
        while (top > 0 && level.rows[top - 1][c] === "|") top--;
        out.goal = { x: x + TILE / 2, c, top: top * TILE, bottom: y + TILE };
      } else if (ch === "_") {
        out.bridge ??= { r, c0: c, c1: c };
        out.bridge.c1 = c;
      }
      if (!(ch === "#" || ch === "=" || ch === "~" || ch === "-" || ch === "&" || ch === "T" || ch === "B" || ch === "R" || ch === "_")) row[c] = ".";
    }
  });
  if (out.bridge) for (let c = out.bridge.c0; c <= out.bridge.c1; c++) rows[out.bridge.r][c] = ".";
  return out;
}

/** A new game of a level. `from` carries on from a checkpoint (save()); `assist` gives five hearts and no clock. */
export function createGame(level, { assist = false, from = null, view = 320 } = {}) {
  const map = parse(level);
  const max = assist ? 5 : 3;
  const game = {
    map, assist, view, t: 0, mode: "ready", ready: 90, events: [], camera: 0, was: 0, trauma: 0, freeze: 0, ease: 0,
    look: { dir: 1, offset: LOOK, travel: 0 },
    pip: { x: 0, y: 0, px: 0, py: 0, w: 8, h: 11, vx: 0, vy: 0, face: 1, ground: false, coyote: 0, buffer: 0, swipe: 0, cool: 0, hurt: 0, drop: 0, chain: 0, safe: null, run: 0 },
    stats: { coins: 0, found: 0, score: 0, stars: [], enemies: 0, foes: 0, gems: 0, hearts: max, max, time: level.time ?? 300, key: false, hits: 0, flag: 0 },
    taken: new Set(), checkpoint: null, bridgeBuilt: map.bridge ? 0 : -1, building: false, chestOpen: false, near: { sign: -1, bramble: false, chest: false },
    prev: {},
  };
  for (const e of map.enemies) Object.assign(e, { vx: 0, vy: 0, face: -1, alive: true, dead: 0, t: 0, ground: false });
  const start = from?.checkpoint ?? map.start;
  if (from) {
    Object.assign(game.stats, structuredClone(from.stats), { hearts: max, max });
    for (const id of from.taken) game.taken.add(id);
    game.checkpoint = from.checkpoint;
    game.bridgeBuilt = from.bridgeBuilt ?? game.bridgeBuilt;
    for (const id of from.blocks ?? []) map.blocks.get(id) && (map.rows[map.blocks.get(id).r][map.blocks.get(id).c] = "K");
  }
  Object.assign(game.pip, { x: start.x, y: start.y, px: start.x, py: start.y, safe: { x: start.x, y: start.y } });
  game.camera = game.was = clampCamera(game, game.pip.x + game.pip.w / 2 + LOOK - view / 2);
  return game;
}

/** What a checkpoint keeps, for Continue: where, the stats, and what was already taken. */
export function save(game) {
  const blocks = [...game.map.blocks.entries()].filter(([, b]) => game.map.rows[b.r][b.c] === "K").map(([k]) => k);
  return { checkpoint: game.checkpoint, stats: structuredClone({ ...game.stats }), taken: [...game.taken], bridgeBuilt: game.bridgeBuilt, blocks };
}

const tile = (game, c, r) => (r < 0 || c < 0 || c >= game.map.w ? (c < 0 ? "#" : ".") : r >= game.map.h ? "." : game.map.rows[r][c] ?? ".");
const solid = (ch) => SOLID.includes(ch);
const oneWay = (game, c, r) => ONE_WAY.includes(tile(game, c, r)) || (game.map.bridge && r === game.map.bridge.r && c >= game.map.bridge.c0 && c < game.map.bridge.c0 + game.bridgeBuilt);
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const say = (game, type, detail = {}) => game.events.push({ type, ...detail });
const clampCamera = (game, x) => Math.max(0, Math.min(game.map.w * TILE - game.view, x));

/** The last whole pixel a body covers from `at` over `size` pixels: positions are fractions, pixels are not. */
const end = (at, size) => Math.ceil(at + size) - 1;

/** Moves a body by its speed, a pixel axis at a time against the tiles. Returns what it hit. */
/** Whether a body at (x, y) would overlap a solid tile. */
const blocked = (game, b, x, y) => {
  for (let r = Math.floor(y / TILE); r <= Math.floor(end(y, b.h) / TILE); r++) {
    for (let c = Math.floor(x / TILE); c <= Math.floor(end(x, b.w) / TILE); c++) if (solid(tile(game, c, r))) return true;
  }
  return false;
};

/**
 * Moves a body by its speed, a pixel axis at a time against the tiles. Returns what it hit. A body with `assist` (Pip)
 * is forgiven a near miss: a wall whose top is within LEDGE pixels of his feet is stepped up, a ceiling clipped by
 * CORNER pixels or less is slid past, and a plank his feet sink CATCH pixels below at the top of a jump still holds.
 */
function move(game, b, { oneWays = true, assist = false } = {}) {
  const hit = { left: false, right: false, up: null, down: false };
  b.x += b.vx;
  const r0 = Math.floor(b.y / TILE), r1 = Math.floor(end(b.y, b.h) / TILE);
  if (b.vx) {
    const c = Math.floor((b.vx > 0 ? end(b.x, b.w) : b.x) / TILE);
    for (let r = r0; r <= r1; r++) {
      if (!solid(tile(game, c, r))) continue;
      const lift = b.y + b.h - r * TILE;
      if (assist && r === r1 && b.vy >= 0 && lift <= LEDGE && !blocked(game, b, b.x, r * TILE - b.h)) {
        b.y = r * TILE - b.h;
        break;
      }
      if (b.vx > 0) (b.x = c * TILE - b.w), (hit.right = true);
      else (b.x = (c + 1) * TILE), (hit.left = true);
      b.vx = 0;
      break;
    }
  }
  const bottom = b.y + b.h;
  b.y += b.vy;
  const c0 = Math.floor(b.x / TILE), c1 = Math.floor(end(b.x, b.w) / TILE);
  if (b.vy > 0) {
    const r = Math.floor(end(b.y, b.h) / TILE), give = assist && b.vy < 1.5 ? CATCH : 0.01;
    for (let c = c0; c <= c1; c++) {
      const top = r * TILE;
      if (solid(tile(game, c, r)) || (oneWays && oneWay(game, c, r) && bottom <= top + give)) {
        b.y = top - b.h;
        b.vy = 0;
        hit.down = true;
        break;
      }
    }
  } else if (b.vy < 0) {
    const r = Math.floor(b.y / TILE);
    // Clipping a ceiling's corner by a few pixels slides the head past it rather than stopping the jump.
    if (assist && c0 !== c1 && solid(tile(game, c0, r)) !== solid(tile(game, c1, r))) {
      const by = solid(tile(game, c0, r)) ? (c0 + 1) * TILE - b.x : c1 * TILE - (b.x + b.w);
      if (Math.abs(by) <= CORNER && !blocked(game, b, b.x + by, b.y)) {
        b.x += by;
        return hit;
      }
    }
    // Under two tiles, the one more of the head is under is the one hit.
    const cs = c0 === c1 ? [c0] : b.x + b.w / 2 < c1 * TILE ? [c0, c1] : [c1, c0];
    for (const c of cs) {
      if (!solid(tile(game, c, r))) continue;
      b.y = (r + 1) * TILE;
      b.vy = 0;
      hit.up = { c, r };
      break;
    }
  }
  return hit;
}

/** Moves a value towards a target by at most a step. */
const approach = (v, to, by) => (v < to ? Math.min(to, v + by) : Math.max(to, v - by));

/** One step, with the buttons held: { left, right, down, jump, swipe, talk }. */
export function step(game, input) {
  game.events = [];
  const press = (k) => input[k] && !game.prev[k];
  const pressed = { jump: press("jump"), swipe: press("swipe"), talk: press("talk") };
  game.prev = { ...input };
  game.t++;
  // Where everything was, for drawing between steps on screens faster than 60 Hz.
  const p = game.pip;
  game.was = game.camera;
  p.px = p.x;
  p.py = p.y;
  for (const e of game.map.enemies) (e.px = e.x), (e.py = e.y);
  game.trauma = Math.max(0, game.trauma - 1 / 45);
  if (game.freeze) {
    game.freeze--;
    return game;
  }
  if (game.mode === "ready") {
    if (--game.ready <= 0) {
      game.mode = "play";
      say(game, "go");
    }
    return game;
  }
  if (game.mode === "goal") return goalStep(game);
  if (game.mode !== "play") return game;

  clock(game);
  pipStep(game, input, pressed);
  if (game.mode !== "play") return game;
  enemiesStep(game);
  touchStep(game, pressed);
  buildStep(game);
  for (const b of game.map.blocks.values()) if (b.bump) b.bump--;
  cameraStep(game);
  return game;
}

/**
 * The camera (Keren's "Scroll Back"): dual forward focus. It keeps LOOK pixels more of the level ahead of Pip than
 * behind him, and turns to the other side only once he has gone TURN pixels the other way, so a turn to swipe or to
 * line up a jump never swings the view. The look-ahead slides over at his speed, so the camera turns at twice it
 * (Bonanza Bros.), never at once. Inside a
 * WINDOW pixels wide the camera holds still, so small steps never nudge it; past it, it is locked to him. After a
 * respawn it glides to him. With less motion asked for, the look-ahead is half as far.
 */
function cameraStep(game) {
  const p = game.pip, look = game.look;
  if (Math.abs(p.vx) > 0.4 && Math.sign(p.vx) !== look.dir) look.travel += Math.abs(p.vx);
  else if (Math.sign(p.vx) === look.dir) look.travel = 0;
  if (look.travel > TURN) (look.dir *= -1), (look.travel = 0);
  const want = look.dir * LOOK * (game.calm ? 0.5 : 1), rate = Math.max(0.5, Math.abs(p.vx));
  look.offset = approach(look.offset, want, rate);
  const focus = clampCamera(game, p.x + p.w / 2 + look.offset - game.view / 2);
  if (game.ease) {
    game.ease--;
    game.camera += (focus - game.camera) * 0.15;
  } else if (focus > game.camera + WINDOW / 2) game.camera = focus - WINDOW / 2;
  else if (focus < game.camera - WINDOW / 2) game.camera = focus + WINDOW / 2;
  game.camera = clampCamera(game, game.camera);
}

/** Adds to the shake, up to all of it. */
const shake = (game, kind) => (game.trauma = Math.min(1, game.trauma + TRAUMA[kind]));

function clock(game) {
  if (game.assist || game.t % STEPS) return;
  game.stats.time = Math.max(0, game.stats.time - 1);
  if (game.stats.time === 60) say(game, "hurry");
  if (!game.stats.time) {
    say(game, "timeup");
    lose(game, game.stats.hearts);
  }
}

function jump(game, p) {
  p.vy = JUMP;
  p.buffer = p.coyote = 0;
  p.ground = false;
  say(game, "jump", { x: p.x + p.w / 2, y: p.y + p.h });
}

function pipStep(game, input, pressed) {
  const p = game.pip;
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (dir && p.ground && Math.sign(p.vx) === -dir && Math.abs(p.vx) > 0.8) say(game, "skid", { x: p.x + p.w / 2, y: p.y + p.h, dir });
  p.vx = approach(p.vx, dir * RUN, ACCEL * (p.ground ? 1 : AIR));
  if (dir && !p.swipe) p.face = dir;
  p.buffer = pressed.jump ? BUFFER : Math.max(0, p.buffer - 1);
  // Down and jump on a plank drops through it.
  if (p.buffer && p.ground && input.down && standingOnOneWay(game)) {
    p.y += 2;
    p.drop = 10;
    p.buffer = p.coyote = 0;
    p.ground = false;
  } else if (p.buffer && (p.ground || p.coyote)) jump(game, p);
  // Off a Plip the spring carries him up whether jump is held or not.
  if (p.vy >= 0) p.spring = false;
  if (!input.jump && !p.spring && p.vy < CUT) p.vy = CUT;
  let g = (input.jump || p.spring) && p.vy < 0 ? RISE : DROP;
  if (input.jump && Math.abs(p.vy) < HANG) g /= 2;
  p.vy = Math.min(FALL, p.vy + g);
  if (pressed.swipe && !p.cool) {
    p.swipe = SWIPE;
    p.cool = SWIPE_COOL;
    say(game, "swipe");
  }
  if (p.swipe) p.swipe--;
  if (p.cool) p.cool--;
  if (p.hurt) p.hurt--;
  if (p.drop) p.drop--;
  const was = p.ground, fall = p.vy;
  const hit = move(game, p, { oneWays: !p.drop, assist: true });
  p.ground = hit.down;
  p.coyote = p.ground ? COYOTE : Math.max(0, p.coyote - 1);
  if (hit.up) bumpBlock(game, hit.up.c, hit.up.r);
  if (p.ground) {
    p.chain = 0;
    if (!was && fall > 1) {
      say(game, "land", { x: p.x + p.w / 2, y: p.y + p.h, speed: fall });
      if (fall >= FALL - 0.2) shake(game, "land");
    }
    if (solidUnder(game, p)) p.safe = { x: p.x, y: p.y };
    // A jump pressed just before landing goes on the landing step.
    if (!was && p.buffer) jump(game, p);
  }
  p.run = p.ground && Math.abs(p.vx) > 0.2 ? p.run + Math.abs(p.vx) : 0;
  if (p.x < 0) (p.x = 0), (p.vx = 0);
  const end = game.map.w * TILE - p.w;
  if (p.x > end) (p.x = end), (p.vx = 0);
  if (p.y > game.map.h * TILE + 24) fallIn(game, "fall");
  else if (inWater(game, p)) fallIn(game, "splash");
}

const standingOnOneWay = (game) => {
  const p = game.pip, r = Math.floor((p.y + p.h) / TILE);
  return [Math.floor(p.x / TILE), Math.floor(end(p.x, p.w) / TILE)].every((c) => !solid(tile(game, c, r)));
};
/** Ground under both feet and a tile beyond each: a safe place to come back to, away from the edge of a drop. */
const solidUnder = (game, p) => {
  const r = Math.floor((p.y + p.h) / TILE);
  for (let c = Math.floor(p.x / TILE) - 1; c <= Math.floor(end(p.x, p.w) / TILE) + 1; c++) {
    if (!solid(tile(game, c, r)) && !oneWay(game, c, r)) return false;
  }
  return true;
};
const inWater = (game, b) => {
  const r = Math.floor((b.y + b.h - 3) / TILE);
  return [Math.floor(b.x / TILE), Math.floor(end(b.x, b.w) / TILE)].some((c) => tile(game, c, r) === "~");
};

function bumpBlock(game, c, r) {
  const b = game.map.blocks.get(`${c},${r}`);
  const ch = tile(game, c, r);
  game.pip.vy = 0.5;
  if (!b || ch === "K") return say(game, "thud", { x: c * TILE + TILE / 2, y: (r + 1) * TILE });
  game.map.rows[r][c] = "K";
  b.bump = 8;
  const x = c * TILE + TILE / 2, y = r * TILE;
  if (b.gives === "gem") {
    game.stats.gems++;
    game.stats.score += 500;
    say(game, "gem", { x, y, from: "block" });
  } else {
    game.stats.coins++;
    game.stats.found++;
    game.stats.score += 10;
    say(game, "coin", { x, y, from: "block" });
  }
  shake(game, "bump");
  say(game, "bump", { x, y });
  // A Grub standing on the block is knocked off it.
  for (const e of game.map.enemies) if (e.alive && Math.abs(e.y + e.h - r * TILE) < 2 && e.x + e.w > c * TILE && e.x < (c + 1) * TILE) defeat(game, e, "bumped");
}

function fallIn(game, how) {
  const p = game.pip;
  say(game, how, { x: p.x + p.w / 2, y: p.y + p.h });
  shake(game, "splash");
  if (!lose(game, 1)) return;
  Object.assign(p, { x: p.safe.x, y: p.safe.y, px: p.safe.x, py: p.safe.y, vx: 0, vy: 0, hurt: SAFE, swipe: 0 });
  game.ease = 30;
  say(game, "respawn");
}

/** Takes hearts; false when that was the last, and the game is over. */
function lose(game, n) {
  game.stats.hearts = Math.max(0, game.stats.hearts - n);
  game.stats.hits++;
  if (game.stats.hearts > 0) return true;
  game.mode = "over";
  say(game, "over");
  return false;
}

function hurt(game, from) {
  const p = game.pip;
  if (p.hurt) return;
  say(game, "hurt", { x: p.x + p.w / 2, y: p.y });
  shake(game, "hurt");
  game.freeze = 4;
  if (!lose(game, 1)) return;
  p.hurt = SAFE;
  p.vx = (p.x + p.w / 2 < from.x + from.w / 2 ? -1 : 1) * 1.6;
  p.vy = -2.4;
  p.ground = false;
}

function defeat(game, e, how) {
  e.alive = false;
  e.dead = how === "stomp" ? 30 : 60;
  e.how = how;
  if (how !== "stomp") (e.vy = -2.6), (e.vx = Math.sign(e.x - game.pip.x) || 1);
  const p = game.pip;
  const points = how === "stomp" ? 100 * 2 ** Math.min(p.chain++, 4) : 100;
  game.stats.enemies++;
  game.stats.foes += points;
  game.stats.score += points;
  shake(game, how === "stomp" ? "stomp" : "swipe");
  say(game, "defeat", { kind: e.kind, how, x: e.x + e.w / 2, y: e.y, points, id: e.id });
}

function enemiesStep(game) {
  const p = game.pip;
  for (const e of game.map.enemies) {
    if (!e.alive) {
      if (e.dead) {
        e.dead--;
        if (e.how !== "stomp") (e.vy += FOE_GRAVITY), (e.x += e.vx), (e.y += e.vy);
      }
      continue;
    }
    // Asleep until near the screen.
    if (Math.abs(e.x - p.x) > game.view) continue;
    e.t++;
    if (e.kind === "grub") {
      e.vx = 0.4 * e.face;
      e.vy = Math.min(FALL, e.vy + FOE_GRAVITY);
      const hit = move(game, e);
      e.ground = hit.down;
      if (hit.left || hit.right) e.face *= -1;
      else if (e.ground) {
        const ahead = Math.floor((e.face > 0 ? e.x + e.w + 1 : e.x - 1) / TILE), below = Math.floor((e.y + e.h + 1) / TILE);
        if (!solid(tile(game, ahead, below)) && !oneWay(game, ahead, below)) e.face *= -1;
      }
    } else {
      e.vy = Math.min(FALL, e.vy + FOE_GRAVITY);
      const hit = move(game, e);
      if (hit.down && !e.ground) e.vx = 0;
      e.ground = hit.down;
      e.face = p.x < e.x ? -1 : 1;
      // On the ground a Plip waits, crouches, and hops at Pip when he is near; squashed by a landing, it holds still
      // until it has sprung back.
      if (e.squash) {
        e.squash--;
        e.crouch = true;
        e.t = 0;
      } else if (e.ground) {
        e.crouch = e.t % 80 > 64 && Math.abs(p.x - e.x) < 6 * TILE;
        if (e.t % 80 === 79 && Math.abs(p.x - e.x) < 6 * TILE) {
          e.vy = -3.4;
          e.vx = 0.8 * e.face;
          e.ground = false;
          say(game, "hop", { x: e.x + e.w / 2, y: e.y + e.h });
        }
      }
    }
    if (e.y > game.map.h * TILE || inWater(game, e)) {
      e.alive = false;
      continue;
    }
    if (p.swipe && p.swipe <= SWIPE - SWIPE_HITS[0] && p.swipe >= SWIPE - SWIPE_HITS[1] && overlap(swipeBox(p), e)) {
      defeat(game, e, "swipe");
      game.freeze = 3;
      continue;
    }
    if (!overlap(p, e)) continue;
    if (p.vy > 0 && p.y + p.h - p.vy <= e.y + 3) {
      p.y = e.y - p.h;
      // A Plip is a spring: it squashes, throws Pip high, and is there for the next go. Only the sword beats it.
      if (e.kind === "plip") {
        Object.assign(p, { vy: PLIP_BOUNCE, spring: true });
        p.chain++;
        e.squash = 10;
        say(game, "spring", { x: e.x + e.w / 2, y: e.y, chain: p.chain });
      } else {
        defeat(game, e, "stomp");
        p.vy = game.prev.jump ? BOUNCE_HELD : BOUNCE;
      }
      game.freeze = 3;
    } else hurt(game, e);
  }
}

/** Where the sword reaches: in front of Pip, a little taller than he is. */
export const swipeBox = (p) => ({ x: p.face > 0 ? p.x + p.w - 2 : p.x - 14, y: p.y - 3, w: 16, h: p.h + 4 });

function touchStep(game, pressed) {
  const p = game.pip, m = game.map, s = game.stats;
  for (const it of m.items) {
    // A pickup is taken three pixels before Pip quite touches it.
    if (game.taken.has(it.id) || (it.hidden && !game.chestOpen) || !overlap(p, { x: it.x - 3, y: it.y - 3, w: it.w + 6, h: it.h + 6 })) continue;
    game.taken.add(it.id);
    const at = { x: it.x + it.w / 2, y: it.y };
    if (it.kind === "coin") (s.coins++, s.found++, (s.score += 10));
    else if (it.kind === "star") (s.stars.push(it.star), (s.score += 1000));
    else if (it.kind === "gem") (s.gems++, (s.score += 500));
    else if (it.kind === "key") s.key = true;
    else if (it.kind === "potion") s.hearts = Math.min(s.max, s.hearts + 1);
    say(game, it.kind, { ...at, star: it.star });
  }
  // The checkpoint: touch the flag.
  if (m.flag && !game.checkpoint && p.x + p.w > m.flag.x - 4 && p.x < m.flag.x + 4) {
    game.checkpoint = { x: m.flag.x - p.w / 2, y: m.flag.y - p.h };
    say(game, "checkpoint", { x: m.flag.x, y: m.flag.y });
  }
  // The chest opens to the key, and gives the star inside.
  if (m.chest) {
    const near = overlap(p, { x: m.chest.x - 4, y: m.chest.y, w: m.chest.w + 8, h: m.chest.h });
    if (near && !game.near.chest) say(game, s.key || game.chestOpen ? "chest-near" : "locked");
    if (near && s.key && !game.chestOpen) {
      game.chestOpen = true;
      s.key = false;
      const star = m.items.find((i) => i.hidden);
      if (star) Object.assign(star, { x: m.chest.x + 3, y: m.chest.y - 16 });
      say(game, "chest", { x: m.chest.x + m.chest.w / 2, y: m.chest.y });
    }
    game.near.chest = near;
  }
  if (m.bramble) {
    const near = Math.abs(p.x + p.w / 2 - m.bramble.x) < TALK && Math.abs(p.y + p.h - m.bramble.y) < 4;
    game.near.bramble = near;
    if (near && pressed.talk && p.ground && !game.building) {
      game.mode = "talk";
      p.vx = 0;
      say(game, "talk");
    }
  }
  let sign = -1;
  for (const g of m.signs) if (Math.abs(p.x + p.w / 2 - g.x) < 2.5 * TILE) sign = g.hint;
  if (sign !== game.near.sign) say(game, "sign", { hint: sign });
  game.near.sign = sign;
  if (m.goal && p.x + p.w >= m.goal.x - 1 && p.y + p.h > m.goal.top) {
    const from = Math.max(0, Math.floor((p.y + p.h - m.goal.top) / ((m.goal.bottom - m.goal.top) / FLAG.length)));
    s.flag = FLAG[Math.min(FLAG.length - 1, from)];
    s.score += s.flag;
    Object.assign(p, { x: m.goal.x - p.w, vx: 0, vy: 0, swipe: 0, hurt: 0 });
    game.mode = "goal";
    game.goalT = 0;
    say(game, "goal", { points: s.flag, x: m.goal.x, y: p.y });
  }
}

/** Bramble patches the bridge, a plank at a time. */
export function buildBridge(game) {
  if (!game.map.bridge || game.building || game.bridgeBuilt > 0) return false;
  game.building = true;
  return true;
}

function buildStep(game) {
  const b = game.map.bridge;
  if (!game.building || game.t % 6) return;
  game.bridgeBuilt++;
  say(game, "plank", { x: (b.c0 + game.bridgeBuilt - 1) * TILE + TILE / 2, y: b.r * TILE });
  if (b.c0 + game.bridgeBuilt > b.c1) {
    game.building = false;
    say(game, "built");
  }
}

/** Slides down the pole, then walks off to the right; the time left then counts into the score. */
function goalStep(game) {
  const p = game.pip, g = game.map.goal;
  game.goalT++;
  if (p.y + p.h < g.bottom) p.y = Math.min(g.bottom - p.h, p.y + 1.5);
  else if (game.goalT > 40) {
    p.face = 1;
    p.vx = 1;
    p.x += 1;
    p.run += 1;
    p.ground = true;
  }
  if (game.goalT === 150) {
    game.mode = "clear";
    say(game, "clear");
  }
  return game;
}

/** Back to playing once Bramble has had his say, with the buttons held then not counting as new presses. */
export function resume(game) {
  if (game.mode === "talk") game.mode = "play";
  game.prev = { up: true, jump: true, swipe: true };
}
