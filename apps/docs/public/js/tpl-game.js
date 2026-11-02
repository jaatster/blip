// Starfall, the game template. The screens (title, menu, map, level, tally, game over, pause) are Blip UI. The level
// is starfall/engine.js stepped 60 times a second and drawn by starfall/render.js; this keeps the HUD, the shouts, the
// hints, Bramble and the achievements in step with it, and reads the keyboard, a gamepad and the touch pad.
import { transition } from "@jaatster/blip-effects/transitions.js";
import { pixel, reducedMotion, services } from "@jaatster/blip-core";
import { LEVEL } from "./starfall/level.js";
import { TILE, buildBridge, createGame, resume, save, step } from "./starfall/engine.js";
import { createRenderer } from "./starfall/render.js";
import { ART } from "./starfall/art.js";
import { spriteCanvas } from "@jaatster/blip-game/canvas.js";
import "@jaatster/blip-icons/element.js";

const $ = (s, r = document) => r.querySelector(s);
const main = $(".tpl-game");
const sound = (name, options) => services.sound().play(name, options);
const STEP = 1000 / 60;
const DOCS = new URL("../", location.href).href;

// What the game remembers between visits: the best tally, the checkpoint, assist mode, the achievements.
const STORE = "blip:starfall";
const load = () => {
  try {
    return JSON.parse(localStorage.getItem(STORE) ?? "{}") ?? {};
  } catch {
    return {};
  }
};
const store = (patch) => {
  try {
    localStorage.setItem(STORE, JSON.stringify({ ...load(), ...patch }));
  } catch {}
};

// ------------------------------------------------------------------ screens

const pad = $("blip-touch-pad");
/** The touch pad's buttons: in the level A jumps, B swipes and Start pauses; elsewhere A presses and B goes back. */
function padFor(playing) {
  if (!pad) return;
  Object.assign(pad.dataset, playing ? { a: "z", b: "x", start: "Escape" } : { a: "Enter", b: "Escape", start: "Enter" });
}
const FOCUS = {
  title: ".tpl-press-start",
  menu: ".tpl-main-choices .blip-choice:not([aria-disabled='true'])",
  map: ".tpl-level-1",
  over: ".tpl-over-choices .blip-choice",
};

async function show(screen, kind = "dither") {
  if (main.dataset.screen === screen) return;
  if (screen !== "level") stopLoop();
  await transition(() => {
    main.dataset.screen = screen;
  }, { kind });
  padFor(screen === "level");
  if (FOCUS[screen]) $(FOCUS[screen])?.focus?.();
}

// ------------------------------------------------------------------ title, menu, options, map

$(".tpl-press-start").addEventListener("click", () => {
  sound("open");
  openMenu();
});
document.addEventListener("keydown", (e) => {
  if (main.dataset.screen === "title" && (e.key === "Enter" || e.key === " ") && !e.repeat) {
    e.preventDefault();
    sound("open");
    openMenu();
  }
});

const options = $(".tpl-options"), menuPanel = $(".tpl-menu-panel"), cont = $(".tpl-main-choices .blip-choice[value='continue']");
function openMenu() {
  const saved = !!load().checkpoint;
  cont.setAttribute("aria-disabled", String(!saved));
  $(".tpl-save-note").textContent = saved ? "Continue goes back to the checkpoint." : "No checkpoint saved yet.";
  show("menu");
}
$(".tpl-main-choices").addEventListener("blip-action", (e) => {
  const v = e.detail.value;
  if (v === "play") {
    sound("open");
    openMap();
  } else if (v === "continue" && load().checkpoint) {
    sound("success");
    startLevel(load().checkpoint);
  } else if (v === "options") {
    sound("open");
    menuPanel.hidden = true;
    options.hidden = false;
    $(".tpl-sound").focus();
  } else if (v === "docs") location.href = DOCS;
});
$(".tpl-options-done").addEventListener("click", () => {
  sound("back");
  options.hidden = true;
  menuPanel.hidden = false;
  $(".tpl-main-choices .blip-choice[value='options']").focus();
});
const assist = $(".tpl-assist"), shakes = $(".tpl-shake");
assist.checked = !!load().assist;
assist.addEventListener("change", () => store({ assist: assist.checked }));
shakes.checked = load().shake !== false;
shakes.addEventListener("change", () => store({ shake: shakes.checked }));
const time = $(".tpl-time");
customElements.whenDefined("blip-segmented").then(() => (time.value = document.documentElement.dataset.schemeChoice || "auto"));
time.addEventListener("blip-change", (e) => {
  window.docs?.setScheme?.(e.detail.value);
  sound("select");
});

function openMap() {
  const best = load().best;
  const tile = $(".tpl-level-1"), stars = best?.stars ?? 0;
  tile.querySelectorAll(".blip-level-stars blip-sprite").forEach((s, i) => s.setAttribute("name", i < stars ? "star" : "star-empty"));
  tile.setAttribute("aria-label", `Level 1-1, Puddle Path: ${best ? `${stars} of 3 stars, best ${best.score.toLocaleString()}` : "no stars yet"}`);
  $(".tpl-best").textContent = best ? `Best: ${best.score.toLocaleString()}` : "Best: none yet";
  show("map");
}
$(".tpl-level-1").addEventListener("click", () => {
  sound("success");
  startLevel(null);
});
$(".tpl-map-back").addEventListener("click", () => {
  sound("back");
  openMenu();
});

// ------------------------------------------------------------------ the level

const stage = $(".tpl-stage"), frame = $(".tpl-frame"), canvas = $(".tpl-canvas");
const overlay = $(".tpl-overlay"), hints = $(".tpl-hints"), shout = $(".tpl-shout");
const hud = {
  hearts: $(".tpl-hearts"), stars: $(".tpl-stars"), key: $(".tpl-key"), track: $(".tpl-track"),
  coins: $(".tpl-coins"), score: $(".tpl-score"), clock: $(".tpl-clock"),
};
const renderer = createRenderer(canvas);
stage.tabIndex = -1;
let game = null, raf = 0, last = 0, acc = 0, paused = false, device = "keyboard";
// For tests: the game being played.
window.starfall = { get game() { return game; } };

function fit() {
  if (main.dataset.screen !== "level") return;
  const size = renderer.resize(stage, pixel(stage));
  frame.style.width = `${size.width}px`;
  frame.style.height = `${size.height}px`;
  if (!game) return;
  game.view = renderer.view;
  renderer.draw(game);
  place();
}
new ResizeObserver(fit).observe(stage);

function startLevel(from) {
  game = createGame(LEVEL, { assist: !!load().assist, from, view: renderer.view });
  game.calm = reducedMotion();
  game.still = load().shake === false;
  held.clear();
  hud.clock.hidden = game.assist;
  hud.hearts.max = game.stats.max;
  const flag = game.map.flag;
  if (flag) $(".tpl-track-checkpoint").style.setProperty("--blip-hud-at", String(Math.round((flag.x / (game.map.w * TILE)) * 100)));
  for (const el of [overlay, hints]) el.replaceChildren();
  shout.clear();
  frog.hidden = true;
  sync();
  show("level", "dissolve").then(() => {
    fit();
    stage.focus();
    shout.shout("Ready?", { hold: 600 });
    startLoop();
  });
}

function startLoop() {
  cancelAnimationFrame(raf);
  paused = false;
  last = performance.now();
  acc = 0;
  raf = requestAnimationFrame(tick);
}
function stopLoop() {
  cancelAnimationFrame(raf);
  raf = 0;
}

function tick(now) {
  raf = requestAnimationFrame(tick);
  pollGamepad();
  if (paused || !game) {
    last = now;
    return;
  }
  acc += Math.min(100, now - last);
  last = now;
  while (acc >= STEP) {
    acc -= STEP;
    step(game, buttons());
    renderer.happen(game);
    react(game);
    if (paused) break;
  }
  renderer.draw(game, acc / STEP);
  place();
}

// ------------------------------------------------------------------ the buttons

// Held keys, and keys pressed since the last step: a tap shorter than a frame still counts for one step.
const held = new Set(), tapped = new Set();
// Two hands on a keyboard and a mouse (A and D or the arrows, Space, W or ↑ to jump, a click to swipe, E or a right
// click to talk), or the console layout on the keyboard alone (the arrows, Z to jump, X to swipe). Both work at once.
const KEYS = {
  ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right", ArrowDown: "down", s: "down", S: "down",
  " ": "jump", ArrowUp: "jump", w: "jump", W: "jump", z: "jump", Z: "jump", k: "jump", K: "jump",
  x: "swipe", X: "swipe", j: "swipe", J: "swipe",
  e: "talk", E: "talk", Enter: "talk",
};
document.addEventListener("keydown", (e) => {
  if (main.dataset.screen !== "level" || pause.open || !frog.hidden) return;
  if (e.key === "Escape" || e.key === "p" || e.key === "P") {
    e.preventDefault();
    openPause();
    return;
  }
  const b = KEYS[e.key];
  if (!b) return;
  e.preventDefault();
  held.add(b);
  if (!e.repeat) tapped.add(b);
  look(e.isTrusted ? "keyboard" : "touch");
});
document.addEventListener("keyup", (e) => KEYS[e.key] && held.delete(KEYS[e.key]));
addEventListener("blur", () => held.clear());

// The mouse, over the level: the left button swipes, the right one talks (and never opens the menu there).
stage.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "touch" || !game || game.mode !== "play" || !frog.hidden || e.target.closest("button")) return;
  if (e.button === 0) tapped.add("swipe");
  else if (e.button === 2) tapped.add("talk");
  else return;
  e.preventDefault();
  stage.focus();
  look("keyboard");
});
stage.addEventListener("contextmenu", (e) => e.preventDefault());

// A gamepad in the standard layout: the D-pad or the left stick, A jumps, B or X swipes, Y or up talks, Start pauses.
let gp = {};
function pollGamepad() {
  const g = [...(navigator.getGamepads?.() ?? [])].find(Boolean);
  if (!g) return;
  const on = (i) => !!g.buttons[i]?.pressed, ax = g.axes[0] ?? 0, ay = g.axes[1] ?? 0;
  const now = { left: on(14) || ax < -0.4, right: on(15) || ax > 0.4, down: on(13) || ay > 0.6, jump: on(0), swipe: on(1) || on(2), talk: on(3) || on(12) || ay < -0.6, start: on(9) };
  if (Object.values(now).some(Boolean)) look("pad");
  if (now.start && !gp.start) pause.open ? pause.close() : openPause();
  gp = now;
}
const buttons = () => {
  const b = (n) => held.has(n) || tapped.has(n) || !!gp[n];
  const now = { left: b("left"), right: b("right"), down: b("down"), jump: b("jump"), swipe: b("swipe"), talk: b("talk") };
  tapped.clear();
  return now;
};

/**
 * The hints name the keys of what was used last: the keyboard and mouse, a gamepad, or the touch pad (A and B, and
 * a tap on the hint itself to talk).
 */
function look(next) {
  if (next === device) return;
  device = next;
  for (const el of hints.querySelectorAll(".tpl-bubble")) el.querySelector(".blip-prompt").innerHTML = el.html();
}

// ------------------------------------------------------------------ what happened

// Sounds that repeat vary a semitone either way, so the hundredth jump never grates; coins picked up close together
// climb a major scale, and start again after a pause, so a line of coins plays a tune (RESEARCH-GAME-FEEL.md).
const vary = () => 2 ** ((Math.random() * 2 - 1) / 12);
const MAJOR = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19];
let chain = 0, chainAt = -99;
function coin(t) {
  chain = t - chainAt > 45 ? 0 : Math.min(chain + 1, MAJOR.length - 1);
  chainAt = t;
  sound("coin", { rate: 2 ** (MAJOR[chain] / 12) });
}

function react(g) {
  for (const e of g.events) {
    switch (e.type) {
      case "go": shout.shout("Go!", { hold: 300 }); break;
      case "jump": sound("jump", { rate: vary() }); break;
      case "land": sound(e.speed > 3 ? "bump" : "step", { rate: (e.speed > 3 ? 0.55 : 0.8) * vary(), volume: Math.min(1, 0.3 + e.speed / 6) }); break;
      case "swipe": sound("select", { rate: 1.6 * vary() }); break;
      case "coin": coin(g.t); break;
      case "star": points(e.x, e.y, 1000); sound("success"); break;
      case "gem": points(e.x, e.y, 500); sound("coin", { rate: 1.5 }); break;
      case "potion": sound("coin", { rate: 0.8 }); break;
      case "key": sound("open"); achieve("treetops"); break;
      case "bump": sound("bump", { rate: vary() }); break;
      case "thud": sound("bump", { rate: 0.7 * vary() }); break;
      case "defeat":
        points(e.x, e.y, e.points);
        // Stomps in a row climb too: each a whole tone higher.
        sound("bump", { rate: e.how === "stomp" ? 1.3 * 2 ** ((2 * Math.log2(e.points / 100)) / 12) : vary() });
        if (e.how === "stomp") achieve("stomp");
        break;
      case "hurt": sound("error"); break;
      case "splash": case "fall": sound("back"); break;
      case "checkpoint":
        sound("success");
        shout.shout("Checkpoint!", { tone: "success" });
        store({ checkpoint: save(g) });
        break;
      case "locked": bubble("chest", "Locked: the key is up in the trees", g.map.chest.x + g.map.chest.w / 2, g.map.chest.y, 3000); break;
      case "chest": sound("open"); break;
      case "talk": talk(); break;
      case "sign": hint(e.hint); break;
      case "plank": sound("step", { rate: 1.3 }); break;
      case "built": sound("success"); achieve("bridge"); break;
      case "hurry": shout.shout("Hurry up!", { tone: "warning" }); break;
      case "over": gameOver(); break;
      case "goal": sound("success"); points(e.x, e.y, e.points); break;
      case "clear": levelClear(); break;
    }
  }
  sync();
}

const set = (el, v) => el.value !== v && (el.value = v);
let lastTrack = -1;
/** The HUD follows the game: each counter only when its number changes, so each counts and sounds once. */
function sync() {
  const s = game.stats;
  set(hud.coins, s.coins);
  set(hud.score, s.score);
  set(hud.clock, s.time);
  set(hud.hearts, s.hearts);
  set(hud.stars, s.stars.length);
  hud.key.hidden = !s.key;
  const p = game.pip, at = Math.round(Math.min(100, Math.max(0, (p.x / (game.map.w * TILE - p.w)) * 100)));
  if (at !== lastTrack) {
    lastTrack = at;
    hud.track.style.setProperty("--blip-hud-value", String(at));
    hud.track.setAttribute("aria-valuenow", String(at));
    hud.track.setAttribute("aria-valuetext", `${at}%${game.checkpoint ? ", past the checkpoint" : ""}`);
  }
}

// ------------------------------------------------------------------ over the canvas: hints, points

// A keycap, or the mouse (a click) as a keycap with the mouse icon in it.
const keycap = (k) => (k === "mouse" ? '<kbd class="blip-box blip-prompt-key" aria-label="Click"><blip-icon name="mouse"></blip-icon></kbd>' : `<kbd class="blip-box blip-prompt-key">${k}</kbd>`);
const PAD = {
  a: '<kbd class="blip-box blip-prompt-button" data-button="a">A</kbd>',
  b: '<kbd class="blip-box blip-prompt-button" data-button="b">B</kbd>',
  y: '<kbd class="blip-box blip-prompt-button" data-button="y">Y</kbd>',
  "dpad-left": '<span class="blip-prompt-dpad" data-dir="left" role="img" aria-label="D-pad left"></span>',
  "dpad-right": '<span class="blip-prompt-dpad" data-dir="right" role="img" aria-label="D-pad right"></span>',
  "dpad-up": '<span class="blip-prompt-dpad" data-dir="up" role="img" aria-label="D-pad up"></span>',
};
/** A hint's keys for what was used last; the touch pad has the gamepad's A and B, and a tap on the hint for the rest. */
const prompt = (keys, text) => () => {
  const set = keys?.[device] ?? keys?.[device === "touch" ? "pad" : "keyboard"] ?? [];
  return `${set.map((k) => (device === "keyboard" ? keycap(k) : (PAD[k] ?? keycap(k)))).join("")} ${text}`;
};

/** A hint over a point in the level: the kit's tooltip, drawn in place, with the keys to press. */
function bubble(id, text, x, y, ms, keys, press) {
  hints.querySelector(`[data-id="${id}"]`)?.remove();
  // A hint that is an action too (Talk) is a button: a tap or a click does it.
  const el = Object.assign(document.createElement(press ? "button" : "span"), { className: "blip-box blip-tooltip tpl-bubble" });
  if (press) Object.assign(el, { type: "button", onclick: press });
  Object.assign(el.dataset, { id, side: "top", x, y, blipStatic: "" });
  el.html = prompt(keys, text);
  el.innerHTML = `<span class="blip-prompt">${el.html()}</span><span class="blip-tooltip-nub" aria-hidden="true"></span>`;
  hints.append(el);
  if (ms) setTimeout(() => el.remove(), ms);
  place();
  return el;
}
function hint(i) {
  hints.querySelector('[data-id="sign"]')?.remove();
  const h = LEVEL.hints[i], s = game.map.signs[i];
  if (h && s) bubble("sign", h.text, s.x, s.y, 0, h.keys);
}

/** Points scored rise a few pixels from where they were won, in POP. */
function points(x, y, n) {
  if (!n) return;
  const el = Object.assign(document.createElement("p"), { className: "tpl-points blip-display blip-pop", textContent: `+${n}` });
  Object.assign(el.dataset, { pop: `+${n}`, scale: "1", x, y });
  overlay.append(el);
  setTimeout(() => el.remove(), 700);
  place();
}

/** Keeps what is laid over the canvas over its place in the level as the camera moves. */
function place() {
  if (!game) return;
  const b = game.map.bramble;
  if (b && game.near.bramble && game.mode === "play" && !game.building && !hints.querySelector('[data-id="talk"]')) bubble("talk", "Talk", b.x, b.y - 16, 0, { keyboard: ["E"], pad: ["y"], touch: [] }, () => tapped.add("talk"));
  else if (!game.near.bramble || game.mode !== "play") hints.querySelector('[data-id="talk"]')?.remove();
  if (!game.near.chest) hints.querySelector('[data-id="chest"]')?.remove();
  for (const el of [...hints.children, ...overlay.children]) {
    const at = renderer.toPage(game, Number(el.dataset.x), Number(el.dataset.y));
    el.style.left = `${at.x}px`;
    el.style.top = `${at.y}px`;
  }
}

// ------------------------------------------------------------------ achievements

const ACHIEVEMENTS = {
  stomp: ["First stomp", "Jump on a Grub."],
  treetops: ["Treetop runner", "Find the key up in the trees."],
  bridge: ["Bridge builder", "Pay Bramble to patch his bridge."],
  untouched: ["Untouchable", "Clear 1-1 without a scratch."],
  stars: ["Star collector", "Find all three stars in 1-1."],
};
function achieve(id) {
  const got = load().achievements ?? [];
  if (got.includes(id)) return;
  store({ achievements: [...got, id] });
  const [title, text] = ACHIEVEMENTS[id];
  const toast = Object.assign(document.createElement("div"), { className: "blip-box blip-achievement" });
  toast.innerHTML = `<span class="blip-box blip-achievement-icon"><blip-sprite name="trophy"></blip-sprite><span class="blip-achievement-sparkles"></span></span><p class="blip-achievement-label">Achievement unlocked</p><p class="blip-achievement-title">${title}</p><p class="blip-achievement-text">${text}</p>`;
  $(".tpl-achievements").append(toast);
  sound("success");
  setTimeout(() => toast.remove(), 4000);
}

// ------------------------------------------------------------------ Bramble

const frog = $(".tpl-frog"), choices = $(".tpl-frog-choices");
// His portrait is his own face, from the game's art (the kit's dialogue example draws a different frog).
const face = spriteCanvas(ART["bramble-face"]);
if (face) {
  face.style.setProperty("--_tpl-w", String(face.width));
  $(".tpl-frog-face").replaceChildren(face);
}
let building = false;
function talk() {
  paused = true;
  held.clear();
  const built = game.bridgeBuilt > 0 || game.building;
  choices.hidden = built;
  frog.hidden = false;
  padFor(false);
  frog.say?.(built ? "Off you go, Pip! Mind the planks: they're still wet." : ["Pip! The rope bridge washed out in last night's storm.", "I could patch it up for thirty coins. Fair?"]);
  requestAnimationFrame(() => frog.focus());
}
frog.addEventListener("blip-action", (e) => {
  requestAnimationFrame(() => frog.focus());
  const have = game.stats.coins;
  choices.hidden = true;
  if (e.detail.value === "pay" && have >= 30) {
    game.stats.coins -= 30;
    building = true;
    sync();
    frog.say(["Splendid! Stand back, nephew.", "One plank at a time…"]);
  } else if (e.detail.value === "pay") {
    sound("bump");
    frog.say([`Thirty coins, nephew. You have ${have}.`, "Or climb the trees, if you're brave. The key's up there."]);
  } else frog.say("Suit yourself. The trees are always there.");
});
frog.addEventListener("blip-done", () => {
  frog.hidden = true;
  if (building) buildBridge(game);
  building = false;
  resume(game);
  padFor(true);
  stage.focus();
  paused = false;
});

// ------------------------------------------------------------------ pause

const pause = $(".tpl-pause");
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
function openPause() {
  if (!game || pause.open || !["play", "ready"].includes(game.mode) || !frog.hidden) return;
  paused = true;
  held.clear();
  $(".tpl-pause-coins").textContent = game.stats.coins;
  $(".tpl-pause-stars").textContent = game.stats.stars.length;
  $(".tpl-pause-time").textContent = game.assist ? "No clock" : fmt(game.stats.time);
  padFor(false);
  sound("open");
  pause.showModal();
}
$(".tpl-pause-button").addEventListener("click", openPause);
let leaving = false;
pause.addEventListener("blip-action", (e) => {
  const v = e.detail.value;
  leaving = v !== "resume";
  pause.close();
  if (v === "restart") startLevel(null);
  else if (v === "title") show("title");
  leaving = false;
});
pause.addEventListener("close", () => {
  sound("back");
  if (leaving || main.dataset.screen !== "level") return;
  padFor(true);
  stage.focus();
  paused = false;
});
document.addEventListener("visibilitychange", () => document.hidden && main.dataset.screen === "level" && openPause());

// ------------------------------------------------------------------ the end of the level

const tally = $(".tpl-tally");
function levelClear() {
  const s = game.stats, left = game.assist ? 0 : s.time, total = s.score + left * 10;
  const rows = [
    // Every coin found counts, the ones paid to Bramble too: they are in the score.
    ["Coins", `${s.found} × 10`, s.found * 10],
    ["Gems", `${s.gems} × 500`, s.gems * 500],
    ["Enemies", `${s.enemies}`, s.foes],
    ["Stars", `${s.stars.length} × 1000`, s.stars.length * 1000],
    ["Flag", "", s.flag],
    ["Time", `${left} × 10`, left * 10],
    ["Score", "", total],
  ];
  $(".blip-tally-rows", tally).innerHTML = rows
    .map(([label, detail, value], i) => {
      const last = i === rows.length - 1;
      return `<div class="blip-tally-row"${last ? " data-total" : ""}><dt>${label}</dt>${detail ? `<dd class="blip-tally-detail">${detail}</dd>` : ""}<dd class="blip-tally-value blip-display blip-pop" data-scale="${last ? 2 : 1}" data-value="${value}" data-pop="${value}">${value}</dd></div>`;
    })
    .join("");
  const best = load().best, isBest = !best || total > best.score;
  store({ checkpoint: null, best: { score: Math.max(total, best?.score ?? 0), stars: Math.max(s.stars.length, best?.stars ?? 0) } });
  tally.stars = s.stars.length;
  tally.toggleAttribute("best", isBest);
  if (!s.hits) achieve("untouched");
  if (s.stars.length === 3) achieve("stars");
  shout.shout("Level clear!", { tone: "success", hold: 1200 }).then(async () => {
    await show("results", "mosaic");
    await tally.play?.();
    $(".tpl-results-choices .blip-choice")?.focus();
  });
}
$(".tpl-results-choices").addEventListener("blip-action", (e) => {
  sound("open");
  if (e.detail.value === "again") startLevel(null);
  else openMap();
});

function gameOver() {
  const timeUp = game.stats.time === 0 && !game.assist;
  $(".tpl-over-why").textContent = timeUp ? "The clock ran out." : "Out of hearts.";
  shout.shout(timeUp ? "Time up!" : "Ouch!", { tone: "danger", hold: 700 }).then(() => show("over"));
}
$(".tpl-over-choices").addEventListener("blip-action", (e) => {
  if (e.detail.value === "retry") {
    sound("open");
    startLevel(load().checkpoint ?? null);
  } else {
    sound("back");
    show("title");
  }
});

// ------------------------------------------------------------------ less motion, the touch pad

// Less motion, asked for on the device or on the page: no dust, no shake, a steady camera, a steady dither.
const calm = () => game && (game.calm = reducedMotion());
matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", calm);
new MutationObserver(calm).observe(document.documentElement, { attributes: true, attributeFilter: ["data-blip-motion"] });

// The touch pad shows on a coarse pointer and sits over the bottom of the screen: each screen keeps its height clear
// (--tpl-pad, templates.css, which guesses it until this measures it).
if (pad && "ResizeObserver" in window) {
  new ResizeObserver(() => {
    const h = pad.offsetHeight;
    if (h) main.style.setProperty("--tpl-pad", `${h}px`);
    else main.style.removeProperty("--tpl-pad");
  }).observe(pad);
}

// The touch pad's A sends Enter to what has focus, and a scripted key can't press a button by itself: press it here.
// Its B sends Escape, which a dialog only closes on for a real key: close it here.
document.addEventListener("keydown", (e) => {
  if (e.isTrusted) return;
  if (e.key === "Enter" && e.target instanceof HTMLButtonElement) e.target.click();
  else if (e.key === "Escape" && pause.open) pause.close();
});
