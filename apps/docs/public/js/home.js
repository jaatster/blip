// Home: the sky's clock and the launcher, the live options window, the rules' specimens, the sample screen and the kits.
import { services } from "@jaatster/blip-core";

const root = document.documentElement;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const toaster = () => $("blip-toaster");
// Sound is the site's (site.js, window.docs.sound): the Options window's switch and the kit's button are its
// controls (data-docs-sound), and the kit's keys wait for it.
const play = (name, options) => window.docs?.sound?.play(name, options);
function syncSound() {
  const on = !!window.docs?.sound?.on;
  for (const b of $$(".home-play-sound")) b.setAttribute("aria-disabled", String(!on));
}
document.addEventListener("docs-sound", syncSound);
syncSound();

// ------------------------------------------------------------------ the options window

const scheme = $(".home-scheme");
const syncScheme = () => scheme && (scheme.value = root.dataset.schemeChoice || "auto");
customElements.whenDefined("blip-segmented").then(syncScheme);
document.addEventListener("docs-scheme", () => { syncScheme(); tick(); });
scheme?.addEventListener("blip-change", (e) => {
  window.docs?.setScheme(e.detail.value);
  play("select");
});

// The accents are palettes (index.astro): picking one sets the site's palette as the palette menu does, and the
// swatches follow the site's palette, whoever sets it. A palette with no swatch here (Dracula, Nord) leaves none
// picked, and the legend names it.
const accentName = $(".home-accent-name");
function syncAccent() {
  // No data-blip-palette is the default palette, the first swatch.
  const id = root.dataset.blipPalette || $('input[name="home-accent"]')?.value;
  for (const input of $$('input[name="home-accent"]')) input.checked = input.value === id;
  const item = document.querySelector(`.docs-palette [data-value="palette:${CSS.escape(id ?? "")}"]`);
  if (accentName) accentName.textContent = item?.dataset.name ?? id ?? "";
}
for (const input of $$('input[name="home-accent"]')) {
  input.addEventListener("change", () => {
    window.docs?.setPalette(input.value);
    play("select");
  });
}
document.addEventListener("docs-palette", syncAccent);
syncAccent();

$(".home-start")?.addEventListener("click", async (e) => {
  const button = e.currentTarget;
  play("coin");
  import("@jaatster/blip-effects/burst.js").then(({ burst }) => burst(button, { kind: "coin", count: 5 }));
  await customElements.whenDefined("blip-toaster");
  toaster()?.add({ title: "Achievement unlocked", body: "First press: you pressed a real Blip button.", tone: "success" });
});

// The status bar: the time of day the page shows, and whether it follows the clock.
const daytime = $(".home-daytime");
function tick() {
  if (!daytime) return;
  const name = { day: "Day", sunset: "Sunset", night: "Night" }[root.dataset.blipScheme] ?? "";
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
const tiles = $$(".home-tiles .blip-tile");
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
  const start = root.dataset.blipScheme || "day";
  stage.setAttribute("data-blip-scheme", start);
  code.textContent = `<section data-blip-scheme="${start}">`;
  const seg = $('[data-stage="home-stage"][data-attr="scheme"]');
  customElements.whenDefined("blip-segmented").then(() => seg && (seg.value = start));
}
document.addEventListener("blip-change", (e) => {
  if (!e.target.closest?.('[data-stage="home-stage"]')) return;
  requestAnimationFrame(() => {
    const s = stage.getAttribute("data-blip-scheme") ?? "day", p = stage.getAttribute("data-blip-pixel");
    code.textContent = `<section data-blip-scheme="${s}"${p && p !== "2" ? ` data-blip-pixel="${p}"` : ""}>`;
  });
  play("select");
});
for (const b of $$(".home-sample")) {
  b.addEventListener("click", async () => {
    await customElements.whenDefined("blip-toaster");
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
for (const b of $$(".home-play-sound")) {
  b.addEventListener("click", () => {
    if (b.getAttribute("aria-disabled") === "true") {
      b.closest(".home-sounds")?.querySelector(".home-sound-toggle")?.focus();
      return;
    }
    play(b.dataset.sound);
  });
}
