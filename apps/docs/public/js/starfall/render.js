// Draws a game of Starfall into a canvas at whole pixels. Behind the level is Blip's world: drawWorld paints each of
// its far layers once into a strip as wide as it will ever slide, and the strips move slower the further back they
// are. The ground is painted in the world's own grass and dirt colours, the art through the game kit's canvas
// sprites, so the level follows the time of day and the palette. Nothing here changes the game.
import { spriteCanvas } from "@jaatster/blip-game/canvas.js";
import { drawWorld } from "@jaatster/blip-effects/world.js";
import { ART } from "./art.js";
import { TILE, swipeBox } from "./engine.js";

/** How far each world layer slides for a pixel of camera: the sky stays, the near hills go half as fast. */
const LAYERS = [["sky", 0], ["peaks", 0.12], ["hills", 0.25], ["near", 0.5]];
const KIT = ["coin", "star", "potion", "key", "gem", "chest", "padlock", "sparkle", "sparkle-small", "heart"];

export function createRenderer(canvas) {
  const ctx = canvas.getContext("2d");
  const r = { scale: 1, view: 320, height: 180, top: 0, dpr: 1, look: "", art: new Map(), strips: [], terrain: null, colours: {}, bits: [] };

  /**
   * Fits the canvas to a box: the biggest whole number of device pixels a game pixel that still shows 320 x 180, and
   * never less than the page's pixel. Wider or taller boxes see more of the level, or more sky.
   */
  r.resize = (box, blip = 2) => {
    const dpr = devicePixelRatio || 1;
    const w = box.clientWidth * dpr, h = box.clientHeight * dpr;
    const s = Math.max(Math.round(blip * dpr), Math.floor(Math.min(h / 180, w / 320)) || 1);
    const view = Math.ceil(w / s), height = Math.ceil(h / s);
    if (s === r.scale && view === r.view && height === r.height && dpr === r.dpr) return false;
    Object.assign(r, { scale: s, view, height, dpr, look: "" });
    canvas.width = view;
    canvas.height = height;
    canvas.style.width = `${(view * s) / dpr}px`;
    canvas.style.height = `${(height * s) / dpr}px`;
    return true;
  };

  /** CSS pixels on the page for a point in the level, for what is laid over the canvas (hints, points). */
  r.toPage = (game, x, y) => ({ x: ((x - Math.round(game.camera)) * r.scale) / r.dpr, y: ((y + r.top) * r.scale) / r.dpr });

  /** Reads the colours and paints the art again when the scheme or the palette has changed. */
  r.refresh = (game, force = false) => {
    const root = document.documentElement, scheme = root.dataset.blipScheme || "day";
    const look = `${scheme}|${root.dataset.blipPalette ?? ""}|${r.view}x${r.height}|${game.map.w}`;
    if (!force && look === r.look) return;
    r.look = look;
    const css = getComputedStyle(root), world = (n) => css.getPropertyValue(`--blip-world-${scheme}-${n}`).trim();
    const token = (n) => css.getPropertyValue(`--blip-${n}`).trim();
    r.colours = {
      grass: world("grass"), top: world("grass-top"), lip: world("grass-lip"), dirt: world("dirt"), shadow: world("dirt-shadow"), pebble: world("dirt-pebble"),
      leaf: world("tree-lit"), leafShade: world("tree-shadow"), water: token("candy-teal"), waterLight: token("candy-teal-light"), waterShade: token("candy-teal-shade"),
      white: token("white"), ink: token("ink"), pole: token("candy-slate-light"), poleShade: token("candy-slate"), dust: token("candy-cream"),
    };
    r.art.clear();
    for (const [name, art] of Object.entries(ART)) {
      r.art.set(name, spriteCanvas(art));
      r.art.set(`${name}<`, spriteCanvas(art, { flip: true }));
    }
    for (const name of KIT) r.art.set(name, spriteCanvas(name));
    r.art.set("star-empty", spriteCanvas("star-empty"));
    // The world, a strip a layer, as wide as the camera will slide it.
    const span = Math.max(0, game.map.w * TILE - r.view);
    r.strips = LAYERS.map(([layer, f]) => {
      const strip = Object.assign(document.createElement("canvas"), { width: Math.ceil(r.view + span * f) + 2, height: r.height });
      drawWorld(strip.getContext("2d"), scheme, strip.width, r.height, { layer });
      return [strip, f];
    });
    r.terrain = paintTerrain(game, r);
  };

  /** Reacts to what happened this step: dust, splashes, sparkles. With less motion asked for, none of it. */
  r.happen = (game) => {
    if (game.calm) return;
    for (const e of game.events) {
      if (e.type === "land" || e.type === "skid" || e.type === "plank") burst(r, e.x, e.y, 4, r.colours.dust, 1, 12);
      else if (e.type === "splash") burst(r, e.x, e.y, 10, r.colours.waterLight, 2.4, 26);
      else if (e.type === "defeat") burst(r, e.x, e.y + 4, 8, r.colours.white, 1.6, 16);
      else if (e.type === "coin" || e.type === "star" || e.type === "gem" || e.type === "key" || e.type === "potion") r.bits.push({ x: e.x - 2, y: e.y + 2, life: 10, sparkle: true });
      else if (e.type === "hop") burst(r, e.x, e.y, 3, r.colours.dust, 0.8, 10);
    }
  };

  r.draw = (game) => {
    r.refresh(game);
    const cam = Math.round(game.camera), shake = game.shake && !game.calm ? (game.shake % 2 ? 1 : -1) : 0;
    r.top = r.height - game.map.h * TILE;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, r.view, r.height);
    for (const [strip, f] of r.strips) ctx.drawImage(strip, -Math.round(cam * f), 0);
    ctx.save();
    ctx.translate(-cam + shake, r.top);
    drawWater(ctx, game, r, cam);
    ctx.drawImage(r.terrain, 0, 0);
    drawThings(ctx, game, r, cam);
    ctx.restore();
  };

  return r;
}

const hash = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;

/** The tiles that never change: ground, stone, planks, leaves and trunks, painted once into one long canvas. */
function paintTerrain(game, r) {
  const { map } = game, c = r.colours;
  const out = Object.assign(document.createElement("canvas"), { width: map.w * TILE, height: map.h * TILE });
  const ctx = out.getContext("2d");
  const at = (col, row) => (row < 0 || col < 0 || col >= map.w || row >= map.h ? "." : map.rows[row][col]);
  const px = (x, y, colour) => ((ctx.fillStyle = colour), ctx.fillRect(x, y, 1, 1));
  for (let row = 0; row < map.h; row++) {
    for (let col = 0; col < map.w; col++) {
      const ch = at(col, row), x = col * TILE, y = row * TILE;
      if (ch === "#") {
        const top = at(col, row - 1) !== "#";
        ctx.fillStyle = c.dirt;
        ctx.fillRect(x, y, TILE, TILE);
        for (let i = 0; i < 3; i++) {
          const h = hash(col * 3 + i, row);
          px(x + (h % TILE), y + ((h >> 8) % TILE), c.pebble);
        }
        if (top) {
          // Grass five rows deep, its lip hanging unevenly over a line of shadow, as the world's ground.
          ctx.fillStyle = c.grass;
          ctx.fillRect(x, y, TILE, 5);
          ctx.fillStyle = c.top;
          ctx.fillRect(x, y, TILE, 1);
          for (let i = 0; i < TILE; i++) {
            const lip = [0, 1, 1, 2, 1, 0, 1, 2, 2, 1, 0, 1][(i + col * 5) % 12];
            ctx.fillStyle = c.lip;
            ctx.fillRect(x + i, y + 5, 1, lip);
            px(x + i, y + 5 + lip, c.shadow);
            if (hash(col, i) % 3 === 0) px(x + i, y - 1, c.grass);
          }
        }
        if (at(col - 1, row) !== "#" && at(col - 1, row) !== "=") ctx.fillStyle = c.shadow, ctx.fillRect(x, y + (top ? 6 : 0), 1, TILE - (top ? 6 : 0));
        if (at(col + 1, row) !== "#" && at(col + 1, row) !== "=") ctx.fillStyle = c.shadow, ctx.fillRect(x + TILE - 1, y + (top ? 6 : 0), 1, TILE - (top ? 6 : 0));
      } else if (ch === "=") ctx.drawImage(r.art.get("stone"), x, y);
      else if (ch === "-") ctx.drawImage(r.art.get("plank"), x, y);
      else if (ch === "T") {
        ctx.fillStyle = c.shadow;
        ctx.fillRect(x + 4, y, 4, TILE);
        ctx.fillStyle = c.dirt;
        ctx.fillRect(x + 4, y, 2, TILE);
      } else if (ch === "&") {
        // Leaves: a lit top, a shaded underside and a ragged edge, standable like a plank.
        const left = at(col - 1, row) !== "&", right = at(col + 1, row) !== "&";
        for (let i = 0; i < TILE; i++) {
          const edge = (left && i < 2) || (right && i > TILE - 3);
          const t = edge ? 1 : 0, b = 7 + (hash(col, i) % 3) - (edge ? 2 : 0);
          ctx.fillStyle = c.top;
          ctx.fillRect(x + i, y + t, 1, 1);
          ctx.fillStyle = c.grass;
          ctx.fillRect(x + i, y + t + 1, 1, 2);
          ctx.fillStyle = c.leafShade;
          ctx.fillRect(x + i, y + t + 3, 1, b - 3);
          ctx.fillStyle = c.shadow;
          ctx.fillRect(x + i, y + t + b, 1, 1);
        }
      }
    }
  }
  return out;
}

/** Water, its surface stepping a pixel along every few frames, the body dithered towards its shade. */
function drawWater(ctx, game, r, cam) {
  const { map } = game, c = r.colours, c0 = Math.max(0, Math.floor(cam / TILE)), c1 = Math.min(map.w - 1, Math.ceil((cam + r.view) / TILE));
  const wave = Math.floor(game.t / 12);
  for (let row = 0; row < map.h; row++) {
    for (let col = c0; col <= c1; col++) {
      if (map.rows[row][col] !== "~") continue;
      const x = col * TILE, y = row * TILE, surface = map.rows[row - 1]?.[col] !== "~";
      ctx.fillStyle = c.water;
      ctx.fillRect(x, y, TILE, TILE);
      // Deeper down, every other pixel is the shade.
      ctx.fillStyle = c.waterShade;
      for (let j = surface ? 7 : 0; j < TILE; j++) for (let i = j % 2; i < TILE; i += 2) ctx.fillRect(x + i, y + j, 1, 1);
      if (surface) {
        ctx.fillStyle = c.waterLight;
        ctx.fillRect(x, y + 1, TILE, 2);
        ctx.fillStyle = c.white;
        for (let i = 0; i < TILE; i++) if ((i + col * TILE + wave) % 6 < 2) ctx.fillRect(x + i, y + ((i + wave) % 6 === 0 ? 0 : 1), 1, 1);
      }
    }
  }
}

/** Draws art a whole pixel at a time, facing either way. */
function sprite(ctx, r, name, x, y, flip = false) {
  const art = r.art.get(flip ? `${name}<` : name) ?? r.art.get(name);
  if (art) ctx.drawImage(art, Math.round(x), Math.round(y));
  return art;
}

/** The checker of the box's disabled look: every other pixel, its phase swapping every few frames. */
function dithered(ctx, r, art, x, y, phase) {
  const tmp = (r.tmp ??= document.createElement("canvas"));
  tmp.width = art.width;
  tmp.height = art.height;
  const t = tmp.getContext("2d");
  t.drawImage(art, 0, 0);
  t.globalCompositeOperation = "destination-out";
  for (let j = 0; j < art.height; j++) for (let i = (j + phase) % 2; i < art.width; i += 2) t.fillRect(i, j, 1, 1);
  ctx.drawImage(tmp, Math.round(x), Math.round(y));
}

function burst(r, x, y, n, colour, speed, life) {
  for (let i = 0; i < n; i++) {
    const a = Math.PI + (Math.PI * (i + 0.5)) / n;
    r.bits.push({ x, y, vx: Math.cos(a) * speed * (0.6 + (i % 3) * 0.2), vy: Math.sin(a) * speed, colour, life });
  }
}

function drawThings(ctx, game, r, cam) {
  const { map, pip: p } = game;
  const near = (x) => x > cam - 32 && x < cam + r.view + 32;
  const bob = (k) => (game.calm ? 0 : Math.floor((game.t + k * 7) / 20) % 2);
  // Signs and Bramble stand behind everything that moves.
  for (const s of map.signs) if (near(s.x)) sprite(ctx, r, "sign", s.x - 6, s.y + 3);
  if (map.bramble && near(map.bramble.x)) sprite(ctx, r, "bramble", map.bramble.x - 8, map.bramble.y - 15, game.pip.x < map.bramble.x);
  // The bridge: its posts on both banks, washed out until Bramble lays it plank by plank and strings the rope.
  if (map.bridge && near(map.bridge.c0 * TILE)) {
    const b = map.bridge, y = b.r * TILE, x0 = b.c0 * TILE - 3, x1 = (b.c1 + 1) * TILE + 1;
    for (const x of [x0, x1]) {
      ctx.fillStyle = r.colours.ink;
      ctx.fillRect(x - 1, y - 13, 4, 14);
      ctx.fillStyle = r.colours.shadow;
      ctx.fillRect(x, y - 12, 2, 12);
    }
    for (let i = 0; i < game.bridgeBuilt; i++) sprite(ctx, r, "plank", (b.c0 + i) * TILE, y);
    const rope = game.bridgeBuilt ? Math.min(x1, (b.c0 + game.bridgeBuilt) * TILE) : x0 + 6;
    ctx.fillStyle = r.colours.dust;
    ctx.fillRect(x0 + 2, y - 11, rope - x0 - 2, 1);
    if (!game.bridgeBuilt) ctx.fillRect(x1 - 6, y - 11, 6, 1);
  }
  // The checkpoint and the goal: slate poles, the accent's flag.
  if (map.flag && near(map.flag.x)) {
    const up = !!game.checkpoint;
    ctx.fillStyle = r.colours.ink;
    ctx.fillRect(map.flag.x - 1, map.flag.y - 30, 3, 30);
    ctx.fillStyle = r.colours.pole;
    ctx.fillRect(map.flag.x, map.flag.y - 29, 1, 29);
    sprite(ctx, r, "flag", map.flag.x + 1, up ? map.flag.y - 31 : map.flag.y - 12);
  }
  if (map.goal && near(map.goal.x)) {
    const g = map.goal, h = g.bottom - g.top;
    ctx.fillStyle = r.colours.ink;
    ctx.fillRect(g.x - 1, g.top, 3, h);
    ctx.fillStyle = r.colours.pole;
    ctx.fillRect(g.x, g.top + 1, 1, h - 1);
    sprite(ctx, r, "star", g.x - 6, g.top - 12);
    const fy = game.mode === "goal" || game.mode === "clear" ? Math.min(g.bottom - 14, g.top + 2 + game.goalT * 1.5) : g.top + 2;
    sprite(ctx, r, "flag", g.x - 10, fy, true);
  }
  // Blocks, which bump when hit.
  for (const b of map.blocks.values()) {
    const x = b.c * TILE + 1, y = b.r * TILE + 1 - (b.bump ? Math.min(b.bump, 9 - b.bump) : 0);
    if (near(x)) sprite(ctx, r, map.rows[b.r][b.c] === "K" ? "block-spent" : "block", x, y);
  }
  if (map.chest && near(map.chest.x)) {
    if (game.chestOpen) sprite(ctx, r, "chest-open", map.chest.x, map.chest.y - 1);
    else {
      sprite(ctx, r, "chest", map.chest.x, map.chest.y);
      sprite(ctx, r, "padlock", map.chest.x + 1, map.chest.y + 4);
    }
  }
  for (const it of map.items) {
    if (game.taken.has(it.id) || (it.hidden && !game.chestOpen) || !near(it.x)) continue;
    const art = r.art.get(it.kind);
    if (!art) continue;
    const x = it.x + it.w / 2 - art.width / 2, y = it.y + it.h - art.height + (it.kind === "coin" ? 0 : bob(it.id));
    ctx.drawImage(art, Math.round(x), Math.round(y));
    if (it.kind === "star" && !game.calm && (game.t + it.id * 13) % 90 < 8) sprite(ctx, r, "sparkle", x + art.width - 4, y - 2);
  }
  for (const e of map.enemies) {
    if (!near(e.x) || (!e.alive && !e.dead)) continue;
    const flip = e.face < 0;
    if (e.kind === "grub") {
      const name = !e.alive && e.how === "stomp" ? "grub-flat" : Math.floor(e.t / 10) % 2 ? "grub-2" : "grub-1";
      const art = r.art.get(name);
      sprite(ctx, r, name, e.x + e.w / 2 - art.width / 2, e.y + e.h - art.height + 1, flip);
    } else {
      const name = e.crouch || !e.alive ? "plip-2" : "plip-1";
      const art = r.art.get(name);
      sprite(ctx, r, name, e.x + e.w / 2 - art.width / 2, e.y + e.h - art.height + 1, flip);
    }
  }
  // Pip.
  const pose = p.hurt > 70 ? "pip-hurt" : !p.ground ? (p.vy < 0 ? "pip-jump" : "pip-fall") : Math.abs(p.vx) > 0.2 ? (Math.floor(p.run / 7) % 2 ? "pip-run-2" : "pip-run-1") : game.t % 200 < 8 ? "pip-blink" : "pip-idle";
  const art = r.art.get(p.face < 0 ? `${pose}<` : pose);
  const x = p.x + p.w / 2 - art.width / 2, y = p.y + p.h - art.height + 1;
  if (p.hurt && game.mode === "play") dithered(ctx, r, art, x, y, game.calm ? 0 : Math.floor(game.t / 4) % 2);
  else ctx.drawImage(art, Math.round(x), Math.round(y));
  if (p.swipe) {
    const box = swipeBox(p), name = p.swipe > 7 ? "swipe-1" : "swipe-2";
    sprite(ctx, r, name, p.face > 0 ? box.x + 1 : box.x + 3, box.y + 2, p.face < 0);
  }
  // The bits: dust, drops, sparkles.
  r.bits = r.bits.filter((b) => {
    if (b.sparkle) sprite(ctx, r, "sparkle-small", b.x, b.y - (10 - b.life) / 2);
    else {
      b.x += b.vx;
      b.y += b.vy;
      b.vy += 0.15;
      ctx.fillStyle = b.colour;
      ctx.fillRect(Math.round(b.x), Math.round(b.y), 1, 1);
    }
    return --b.life > 0;
  });
}
