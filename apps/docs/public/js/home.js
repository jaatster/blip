// Home: the sky's clock and the launcher, the live options window, the rules' specimens, the sample screen and the kits.
import { services } from "@jaatster/blip-core";

const root = document.documentElement;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const toaster = () => $("pp-toaster");
let sound; // @jaatster/blip-sound, once the reader turns it on

async function setSound(on) {
  sound ??= await import("@jaatster/blip-sound");
  sound.rememberSound();
  if (on) await sound.enableSound({ volume: 0.7 });
  else sound.disableSound();
  syncSound();
}
const play = (name, options) => sound?.soundOn() && sound.play(name, options);
function syncSound() {
  const on = !!sound?.soundOn();
  const sw = $(".home-sound");
  if (sw) sw.checked = on;
  const t = $(".home-sound-toggle");
  if (t) {
    t.setAttribute("aria-pressed", String(on));
    t.querySelector("span").textContent = on ? "Sound on" : "Sound off";
  }
  for (const b of $$(".home-play-sound")) b.setAttribute("aria-disabled", String(!on));
}
// Remembered from an earlier visit: on again at the first press (rememberSound waits for one).
if (localStorage.getItem("blip:sound") === "on") import("@jaatster/blip-sound").then((s) => { sound = s; root.addEventListener("pointerdown", () => setTimeout(syncSound, 50), { once: true }); });

// ------------------------------------------------------------------ the options window

const scheme = $(".home-scheme");
const syncScheme = () => scheme && (scheme.value = root.dataset.schemeChoice || "auto");
customElements.whenDefined("pp-segmented").then(syncScheme);
document.addEventListener("docs-scheme", () => { syncScheme(); tick(); });
scheme?.addEventListener("pp-change", (e) => {
  window.docs?.setScheme(e.detail.value);
  play("select");
});

const hero = $(".home-hero");
for (const input of $$('input[name="home-accent"]')) {
  input.addEventListener("change", () => {
    const c = input.value;
    for (const [k, v] of [["--pp-accent", ""], ["--pp-accent-light", "-light"], ["--pp-accent-shade", "-shade"]]) {
      if (c) hero.style.setProperty(k, `var(--pp-candy-${c}${v})`);
      else hero.style.removeProperty(k);
    }
    play("select");
  });
}

$(".home-sound")?.addEventListener("change", (e) => setSound(e.target.checked).then(() => play("select")));

$(".home-start")?.addEventListener("click", async (e) => {
  const button = e.currentTarget;
  play("coin");
  import("@jaatster/blip-effects/burst.js").then(({ burst }) => burst(button, { kind: "coin", count: 5 }));
  await customElements.whenDefined("pp-toaster");
  toaster()?.add({ title: "Achievement unlocked", body: "First press: you pressed a real Blip button.", tone: "success" });
});

// The status bar: the time of day the page shows, and whether it follows the clock.
const daytime = $(".home-daytime");
function tick() {
  if (!daytime) return;
  const name = { day: "Day", sunset: "Sunset", night: "Night" }[root.dataset.ppScheme] ?? "";
  daytime.textContent = (root.dataset.schemeChoice || "auto") === "auto" ? `${name}, by your clock` : name;
}
tick();

// ------------------------------------------------------------------ the sky's clock: the reader's own time, as on the TV

const clock = $(".home-clock");
function showTime() {
  if (!clock) return;
  const now = services.now();
  const parts = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).formatToParts(now);
  const part = (type) => parts.find((p) => p.type === type)?.value ?? "";
  const hm = `${part("hour")}:${part("minute")}`;
  const pad = (n) => String(n).padStart(2, "0");
  clock.querySelector("time").setAttribute("datetime", `${pad(now.getHours())}:${pad(now.getMinutes())}`);
  const digits = clock.querySelector(".home-hm");
  digits.textContent = hm;
  digits.dataset.pop = hm;
  clock.querySelector(".home-period").textContent = part("dayPeriod");
  clock.querySelector(".home-date").textContent = now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
}
showTime();
// On the minute, then every minute.
setTimeout(() => {
  showTime();
  setInterval(showTime, 60_000);
}, 60_000 - (services.now().getTime() % 60_000));

// ------------------------------------------------------------------ the launcher: the chosen tile's name above the row

// The tile under the pointer or the keyboard is the chosen one: it lifts in its ring, the arrow bobs over it, and its
// name stands above the row in POP. The name is decoration (each link is named by its own label), so it is not live.
const pick = $(".home-pick");
const tiles = $$(".home-tiles .pp-tile");
function choose(tile) {
  if (!pick || tile.hasAttribute("data-selected")) return;
  for (const t of tiles) t.toggleAttribute("data-selected", t === tile);
  const name = document.getElementById(tile.getAttribute("aria-labelledby"))?.textContent ?? "";
  pick.textContent = name;
  pick.dataset.pop = name;
  pick.dataset.tone = tile.dataset.tone;
  play("select");
}
for (const t of tiles) {
  t.addEventListener("pointerenter", () => choose(t));
  t.addEventListener("focus", () => choose(t));
}

// ------------------------------------------------------------------ rules: motion snaps

$(".home-play")?.addEventListener("click", () => {
  const track = $(".home-track");
  track.removeAttribute("data-run");
  void track.offsetWidth;
  track.setAttribute("data-run", "");
  play("jump");
});

// ------------------------------------------------------------------ two switches

const code = $(".home-switch-code");
const stage = $("#home-stage");
// The sample starts in the page's own scheme; the switches take it from there.
if (stage) {
  const start = root.dataset.ppScheme || "day";
  stage.setAttribute("data-pp-scheme", start);
  code.textContent = `<section data-pp-scheme="${start}">`;
  const seg = $('[data-stage="home-stage"][data-attr="scheme"]');
  customElements.whenDefined("pp-segmented").then(() => seg && (seg.value = start));
}
document.addEventListener("pp-change", (e) => {
  if (!e.target.closest?.('[data-stage="home-stage"]')) return;
  requestAnimationFrame(() => {
    const s = stage.getAttribute("data-pp-scheme") ?? "day", p = stage.getAttribute("data-pp-pixel");
    code.textContent = `<section data-pp-scheme="${s}"${p ? ` data-pp-pixel="${p}"` : ""}>`;
  });
  play("select");
});
for (const b of $$(".home-sample")) {
  b.addEventListener("click", async () => {
    await customElements.whenDefined("pp-toaster");
    toaster()?.add({ title: b.dataset.toast, tone: b.dataset.tone === "danger" ? undefined : "info" });
    play("open");
  });
}

// ------------------------------------------------------------------ kits

const frog = $(".home-frog");
$(".home-coin")?.addEventListener("click", () => {
  const counter = $(".home-coins");
  if (!counter) return;
  counter.value = Number(counter.value) + 10;
  const n = Number(counter.value);
  frog?.say?.(n >= 100 ? `${n} coins! You could buy my boat with that.` : `Splendid! That makes ${n}. Bramble pays fair.`);
});
$(".home-sound-toggle")?.addEventListener("click", () => setSound(!sound?.soundOn()));
for (const b of $$(".home-play-sound")) {
  b.addEventListener("click", () => {
    if (b.getAttribute("aria-disabled") === "true") {
      b.closest(".home-sounds")?.querySelector(".home-sound-toggle")?.focus();
      return;
    }
    play(b.dataset.sound);
  });
}
