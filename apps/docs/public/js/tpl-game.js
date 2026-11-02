// Game screens template: press start, the main menu and options, the level map, a level's HUD with a shout and a
// frog who wants coins, pause, the tally and game over. Buttons stand in for play. Starfall (/play/) is the same
// screens with a game in them (play.js).
import { transition } from "@jaatster/blip-effects/transitions.js";

const $ = (s, r = document) => r.querySelector(s);
const game = $(".tpl-game");
// Sound is the site's (site.js): the Options window's switch is one of its controls (data-docs-sound).
const play = (name) => window.docs?.sound?.play(name);
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const DOCS = new URL("../../", location.href).href;

const FOCUS = {
  title: ".tpl-press-start",
  menu: ".tpl-main-choices .blip-choice:not([aria-disabled='true'])",
  map: ".tpl-level-1",
  level: ".tpl-coin",
  over: ".tpl-over-choices .blip-choice",
};
async function show(screen, kind = "dither") {
  if (game.dataset.screen === screen) return;
  await transition(() => {
    game.dataset.screen = screen;
  }, { kind });
  if (screen === "level") startLevel();
  else stopClock();
  if (FOCUS[screen]) $(FOCUS[screen])?.focus?.();
}

// ------------------------------------------------------------------ title, menu, options, map

$(".tpl-press-start").addEventListener("click", () => {
  play("open");
  show("menu");
});
document.addEventListener("keydown", (e) => {
  if (game.dataset.screen === "title" && (e.key === "Enter" || e.key === " ") && !e.repeat && !e.target.closest?.("a")) {
    e.preventDefault();
    play("open");
    show("menu");
  }
});

const options = $(".tpl-options"), menuPanel = $(".tpl-menu-panel");
$(".tpl-main-choices").addEventListener("blip-action", (e) => {
  const v = e.detail.value;
  if (v === "play") {
    play("open");
    show("map");
  } else if (v === "options") {
    play("open");
    menuPanel.hidden = true;
    options.hidden = false;
    $(".tpl-sound").focus();
  } else if (v === "docs") location.href = DOCS;
});
$(".tpl-options-done").addEventListener("click", () => {
  play("back");
  options.hidden = true;
  menuPanel.hidden = false;
  $(".tpl-main-choices .blip-choice[value='options']").focus();
});
const time = $(".tpl-time");
customElements.whenDefined("blip-segmented").then(() => (time.value = document.documentElement.dataset.schemeChoice || "auto"));
time.addEventListener("blip-change", (e) => {
  window.docs?.setScheme?.(e.detail.value);
  play("select");
});
$(".tpl-level-1").addEventListener("click", () => {
  play("success");
  show("level", "dissolve");
});
$(".tpl-map-back").addEventListener("click", () => {
  play("back");
  show("menu");
});

// ------------------------------------------------------------------ the level

const hearts = $(".tpl-hearts"), stars = $(".tpl-stars"), coins = $(".tpl-coins"), score = $(".tpl-score"), clock = $(".tpl-clock");
const track = $(".tpl-track"), shout = $(".tpl-shout"), frog = $(".tpl-frog"), pause = $(".tpl-pause");
let tick, reached = false;
const opening = [...frog.querySelectorAll(".blip-dialogue-text > p")].map((p) => p.textContent.trim());

function stopClock() {
  clearInterval(tick);
  tick = undefined;
}
function startLevel() {
  stopClock();
  Object.assign(hearts, { value: 3 });
  for (const c of [stars, coins, score]) c.value = 0;
  clock.value = 300;
  reached = false;
  setTrack(0);
  frog.say?.(opening);
  shout.clear?.();
  shout.shout?.("1-1 Puddle Path", { hold: 1200 }).then(() => shout.shout("Go!", { hold: 300 }));
  tick = setInterval(() => {
    if (document.hidden || pause.open) return;
    clock.value = Math.max(0, clock.value - 1);
    if (clock.value === 60) shout.shout("Hurry up!", { tone: "warning" });
  }, 1000);
}
function setTrack(at) {
  track.style.setProperty("--blip-hud-value", String(at));
  track.setAttribute("aria-valuenow", String(at));
  track.setAttribute("aria-valuetext", `${at}%${reached ? ", past the checkpoint" : ""}`);
}

// A run of coins climbs a scale (the counter's chain); each moves Pip a little further along the track.
$(".tpl-coin").addEventListener("click", () => {
  coins.value += 1;
  score.value += 10;
  setTrack(Math.min(95, Number(track.getAttribute("aria-valuenow")) + 3));
});
$(".tpl-hit").addEventListener("click", () => {
  play("error");
  hearts.value -= 1;
  if (hearts.value > 0) return;
  stopClock();
  shout.shout("Ouch!", { tone: "danger", hold: 600 }).then(() => show("over"));
});
$(".tpl-checkpoint").addEventListener("click", () => {
  if (reached) return;
  reached = true;
  play("success");
  setTrack(Math.max(45, Number(track.getAttribute("aria-valuenow"))));
  shout.shout("Checkpoint!", { tone: "success" });
});
$(".tpl-finish").addEventListener("click", () => {
  stopClock();
  setTrack(100);
  stars.value = 2;
  play("success");
  shout.shout("Level clear!", { tone: "success", hold: 900 }).then(results);
});
document.addEventListener("keydown", (e) => {
  if (game.dataset.screen !== "level") return;
  if (e.key === "Escape" && !pause.open) {
    e.preventDefault();
    openPause();
  }
});

// The frog answers a choice: the choice goes as his new words type, so the keyboard stays in his box.
frog.addEventListener("blip-action", (e) => {
  requestAnimationFrame(() => frog.focus());
  const have = coins.value;
  if (e.detail.value === "pay" && have >= 30) {
    coins.value = have - 30;
    play("success");
    frog.say(["Splendid! Stand back, nephew.", "One plank at a time…"]);
  } else if (e.detail.value === "pay") {
    play("bump");
    frog.say([`Thirty coins, nephew. You have ${have}.`, "Collect a few more and come back."]);
  } else frog.say("Suit yourself. The trees are always there.");
});
frog.addEventListener("blip-done", () => frog.say(["Still here? The coins won't collect themselves.", "I could patch the bridge for thirty. Fair?"]));

// ------------------------------------------------------------------ pause

function openPause() {
  $(".tpl-pause-coins").textContent = coins.value;
  $(".tpl-pause-stars").textContent = stars.value;
  $(".tpl-pause-time").textContent = fmt(clock.value);
  play("open");
  pause.showModal();
}
$(".tpl-pause-button").addEventListener("click", openPause);
pause.addEventListener("blip-action", (e) => {
  const v = e.detail.value;
  pause.close();
  if (v === "title") show("title");
  else if (v === "docs") location.href = DOCS;
});
pause.addEventListener("close", () => play("back"));

// ------------------------------------------------------------------ the tally, game over

const tally = $(".tpl-tally");
async function results() {
  const left = clock.value, rows = [
    ["Coins", `${coins.value} × 10`, coins.value * 10],
    ["Stars", `${stars.value} × 1000`, stars.value * 1000],
    ["Time", `${left} × 10`, left * 10],
  ];
  const total = rows.reduce((n, r) => n + r[2], 0);
  rows.push(["Score", "", total]);
  $(".blip-tally-rows", tally).innerHTML = rows
    .map(([label, detail, value], i) => {
      const last = i === rows.length - 1;
      return `<div class="blip-tally-row"${last ? " data-total" : ""}><dt>${label}</dt>${detail ? `<dd class="blip-tally-detail">${detail}</dd>` : ""}<dd class="blip-tally-value blip-display blip-pop" data-scale="${last ? 2 : 1}" data-value="${value}" data-pop="${value}">${value}</dd></div>`;
    })
    .join("");
  tally.stars = stars.value;
  tally.toggleAttribute("best", total > 4600);
  await show("results", "mosaic");
  await tally.play?.();
  $(".tpl-results-choices .blip-choice")?.focus();
}
$(".tpl-results-choices").addEventListener("blip-action", (e) => {
  play("open");
  if (e.detail.value === "again") {
    game.dataset.screen = "";
    show("level", "dissolve");
  } else show("map");
});
$(".tpl-over-choices").addEventListener("blip-action", (e) => {
  if (e.detail.value === "retry") {
    play("open");
    show("level", "dissolve");
  } else {
    play("back");
    show("title");
  }
});

// ------------------------------------------------------------------ the touch pad

// The touch pad shows on a coarse pointer and sits over the bottom of the screen: each screen keeps its height clear
// (--tpl-pad, templates.css, which guesses it until this measures it).
const pad = $("blip-touch-pad");
if (pad && "ResizeObserver" in window) {
  new ResizeObserver(() => {
    const h = pad.offsetHeight;
    if (h) game.style.setProperty("--tpl-pad", `${h}px`);
    else game.style.removeProperty("--tpl-pad");
  }).observe(pad);
}
// The touch pad's A sends Enter to what has focus, and a scripted key can't press a button by itself: press it here.
document.addEventListener("keydown", (e) => {
  if (!e.isTrusted && e.key === "Enter" && e.target instanceof HTMLButtonElement) e.target.click();
});
