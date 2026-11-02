// Game menu template: press start, the main menu, options, a level with a HUD, a frog who wants coins, and pause.
import { transition } from "@jaatster/blip-effects/transitions.js";

const $ = (s, r = document) => r.querySelector(s);
const game = $(".tpl-game");
// Sound is the site's (site.js): the Options window's switch is one of its controls (data-docs-sound).
const play = (name) => window.docs?.sound?.play(name);
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

async function show(screen, kind = "dither") {
  if (game.dataset.screen === screen) return;
  await transition(() => {
    game.dataset.screen = screen;
  }, { kind });
  // In the level the coin button takes focus, so Space collects a coin at once, as the hint says; Tab reaches the frog.
  const focus = { title: ".tpl-press-start", menu: ".tpl-main-choices .blip-choice:not([aria-disabled='true'])", level: ".tpl-coin-button" }[screen];
  const el = $(focus);
  if (screen === "level") startLevel();
  else stopClock();
  el?.focus?.();
}

// ------------------------------------------------------------------ title

$(".tpl-press-start").addEventListener("click", () => {
  play("open");
  show("menu");
});
document.addEventListener("keydown", (e) => {
  if (game.dataset.screen === "title" && (e.key === "Enter" || e.key === " ") && !e.repeat) {
    e.preventDefault();
    play("open");
    show("menu");
  }
});

// ------------------------------------------------------------------ menu and options

const options = $(".tpl-options"), menuPanel = $(".tpl-menu-panel");
$(".tpl-main-choices").addEventListener("blip-action", (e) => {
  const v = e.detail.value;
  if (v === "new") {
    play("success");
    newGame();
    show("level", "dissolve");
  } else if (v === "options") {
    play("open");
    menuPanel.hidden = true;
    options.hidden = false;
    $(".tpl-sound").focus();
  } else if (v === "docs") location.href = "/templates/";
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

// ------------------------------------------------------------------ the level

const coins = $(".tpl-coins"), score = $(".tpl-score"), clock = $(".tpl-clock"), frog = $(".tpl-frog"), pause = $(".tpl-pause");
let tick;
// A new game starts as the page did: the coins, score and clock in the markup, and the frog from his first words.
const fresh = { coins: coins.getAttribute("value"), score: score.getAttribute("value"), clock: clock.getAttribute("value") };
const opening = [...frog.querySelectorAll(".blip-dialogue-text > p")].map((p) => p.textContent.trim());
function newGame() {
  coins.value = Number(fresh.coins);
  score.value = Number(fresh.score);
  clock.value = Number(fresh.clock);
  frog.say?.(opening);
}
function stopClock() {
  clearInterval(tick);
  tick = undefined;
}
function startLevel() {
  stopClock();
  tick = setInterval(() => {
    if (document.hidden || pause.open) return;
    clock.value = Math.max(0, Number(clock.value) - 1);
  }, 1000);
}
function addCoin() {
  coins.value = Number(coins.value) + 1;
  score.value = Number(score.value) + 100;
}
$(".tpl-coin-button").addEventListener("click", addCoin);
document.addEventListener("keydown", (e) => {
  if (game.dataset.screen !== "level") return;
  if (e.key === "Escape" && !pause.open) {
    e.preventDefault();
    openPause();
  } else if (e.key === " " && !pause.open && !e.target.closest?.("button, input, blip-dialogue")) {
    e.preventDefault();
    addCoin();
  }
});
// The frog answers a choice: the choice goes as his new words type, so the keyboard stays in his box (on the arrow,
// and on the choices again once he has finished: the dialogue moves it there itself).
frog.addEventListener("blip-action", (e) => {
  requestAnimationFrame(() => frog.focus());
  const have = Number(coins.value);
  if (e.detail.value === "pay") {
    if (have >= 30) {
      coins.value = have - 30;
      play("success");
      frog.say(["Splendid! The bridge will be ready by sunset.", "Mind the puddles on your way."]);
    } else {
      play("bump");
      frog.say([`Thirty coins, traveller. You have ${have}.`, "Collect a few more and come back."]);
    }
  } else frog.say("Suit yourself. I'll be here, by the water.");
});
frog.addEventListener("blip-done", () => frog.say(["Still here? The coins won't collect themselves.", "I could patch the bridge for thirty. Fair?"]));

// ------------------------------------------------------------------ pause

function openPause() {
  $(".tpl-pause-coins").textContent = coins.value;
  $(".tpl-pause-time").textContent = fmt(Number(clock.value));
  play("open");
  pause.showModal();
}
$(".tpl-pause-button").addEventListener("click", openPause);
pause.addEventListener("blip-action", (e) => {
  const v = e.detail.value;
  pause.close();
  if (v === "title") show("title");
  else if (v === "docs") location.href = "/templates/";
});
pause.addEventListener("close", () => play("back"));

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
