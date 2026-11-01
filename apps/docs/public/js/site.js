// The docs' own behaviour, on top of Blip's elements: the display menu (scheme and pixel), the palette menu,
// Auto following the clock, search through the command palette, copy buttons, the install boxes, the example
// switches and "On this page".
import { autoScheme, setScheme } from "@blip/core";

const root = document.documentElement;
// install: the package manager the install boxes show (INSTALL_KEY in src/lib/install.ts).
const KEYS = { scheme: "blip-docs:scheme", pixel: "blip-docs:pixel", palette: "blip-docs:palette", install: "blip-docs:install" };
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* private mode */ } },
};
const query = new URLSearchParams(location.search);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

// ------------------------------------------------------------------ scheme and pixel

let stopAuto;
function themeColor() {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = getComputedStyle(root).getPropertyValue("--blip-bg").trim() || meta.content;
}
function applyScheme(choice) {
  stopAuto?.();
  stopAuto = undefined;
  root.dataset.schemeChoice = choice;
  root.removeAttribute("data-blip-scheme-fade");
  if (choice === "auto") stopAuto = autoScheme(root);
  else setScheme(choice, root);
  requestAnimationFrame(themeColor);
  document.dispatchEvent(new CustomEvent("docs-scheme", { detail: { choice, scheme: root.dataset.blipScheme } }));
}
function applyPixel(px) {
  if (px === "3" || px === "4") root.dataset.blipPixel = px;
  else delete root.dataset.blipPixel;
}
root.addEventListener("blip-scheme-change", () => requestAnimationFrame(themeColor));

// ------------------------------------------------------------------ palette

// The palettes the menu offers, the default first (set by having no data-blip-palette).
const paletteMenu = document.querySelector(".docs-palette");
const paletteItems = paletteMenu ? [...paletteMenu.querySelectorAll('[role="menuitemradio"]')] : [];
const paletteIds = paletteItems.map((item) => item.dataset.value.split(":")[1]);
const defaultPalette = paletteIds[0];
const currentPalette = () => root.dataset.blipPalette || defaultPalette;
function applyPalette(id) {
  if (!id || id === defaultPalette || !paletteIds.includes(id)) delete root.dataset.blipPalette;
  else root.dataset.blipPalette = id;
  requestAnimationFrame(themeColor);
  syncPalette();
  document.dispatchEvent(new CustomEvent("docs-palette", { detail: { palette: currentPalette() } }));
}
function syncPalette() {
  if (!paletteMenu) return;
  const id = currentPalette();
  for (const item of paletteItems) item.setAttribute("aria-checked", String(item.dataset.value === `palette:${id}`));
  const name = paletteItems.find((item) => item.dataset.value === `palette:${id}`)?.dataset.name ?? id;
  paletteMenu.querySelector(":scope > button")?.setAttribute("aria-label", `Palette: ${name}`);
  for (const b of document.querySelectorAll("[data-docs-palette]")) b.setAttribute("aria-pressed", String(b.dataset.docsPalette === id));
}
if (paletteMenu) {
  syncPalette();
  paletteMenu.addEventListener(paletteMenu.dataset.docsChoose || "blip-action", (e) => {
    const [k, v] = String(e.detail.value).split(":");
    if (k !== "palette") return;
    store.set(KEYS.palette, v === defaultPalette ? null : v);
    applyPalette(v);
  });
}
// Buttons that switch the site's palette (the colour page's gallery), saved as the menu saves it.
document.addEventListener("click", (e) => {
  const b = e.target.closest?.("[data-docs-palette]");
  if (b) window.docs.setPalette(b.dataset.docsPalette);
});
syncPalette();

const display = document.querySelector(".docs-display");
function syncMenu() {
  if (!display) return;
  const scheme = root.dataset.schemeChoice || "auto", pixel = root.dataset.blipPixel || "2";
  for (const item of display.querySelectorAll('[role="menuitemradio"]')) {
    const [k, v] = item.dataset.value.split(":");
    item.setAttribute("aria-checked", String((k === "scheme" && v === scheme) || (k === "pixel" && v === pixel)));
  }
}
if (display) {
  syncMenu();
  // The event a chosen item fires, as the element's manifest names it (the page writes it in data-docs-choose).
  display.addEventListener(display.dataset.docsChoose || "blip-action", (e) => {
    const [k, v] = String(e.detail.value).split(":");
    if (k === "scheme") {
      store.set(KEYS.scheme, v === "auto" ? null : v);
      applyScheme(v);
    } else if (k === "pixel") {
      store.set(KEYS.pixel, v === "2" ? null : v);
      applyPixel(v);
    }
  });
}
applyScheme(root.dataset.schemeChoice || "auto");

/** For page scripts: change the reader's scheme or pixel, saved as the display menu saves it. */
window.docs = {
  setScheme(choice) {
    store.set(KEYS.scheme, choice === "auto" ? null : choice);
    applyScheme(choice);
    syncMenu();
  },
  setPixel(px) {
    store.set(KEYS.pixel, px === "2" ? null : px);
    applyPixel(px);
    syncMenu();
  },
  setPalette(id) {
    store.set(KEYS.palette, !id || id === defaultPalette ? null : id);
    applyPalette(id);
  },
};

// Chosen in another tab, or by the page around this one (the templates' live previews are frames): follow it.
// A template has no palette menu, so the presets come from the head script (Base.astro).
const presets = (document.querySelector("script[data-presets]")?.dataset.presets || "").split(" ").filter(Boolean);
addEventListener("storage", (e) => {
  if (e.key === KEYS.palette) {
    if (e.newValue && presets.includes(e.newValue)) root.dataset.blipPalette = e.newValue;
    else delete root.dataset.blipPalette;
    requestAnimationFrame(themeColor);
    syncPalette();
  } else if (e.key === KEYS.scheme) {
    applyScheme(e.newValue || "auto");
    syncMenu();
  }
});

// ------------------------------------------------------------------ keys: Cmd on a Mac

if (mac) for (const k of document.querySelectorAll("[data-mod]")) k.textContent = "Cmd";

// ------------------------------------------------------------------ search

// The palette filters its options itself (every word in an option's label or data-keywords). Before it does, each
// option is matched with search-match.js, which knows synonyms, sections and typos: a match takes the words typed
// into its keywords, so the palette keeps it, shows the section it found and opens the page there; the best come
// first in their group.
const palette = document.querySelector("blip-command.docs-search");
const searchButton = document.querySelector(".docs-search-button");
let index;
let entries = [];
async function buildResults(data) {
  const { prepare } = await import("/js/search-match.js");
  const list = palette.querySelector('[role="listbox"]');
  const out = [];
  const items = [];
  let n = 0;
  data.groups.forEach((group, gi) => {
    out.push(`<div class="blip-command-group" role="group" aria-labelledby="docs-search-g${gi}"><div class="blip-command-heading" id="docs-search-g${gi}">${esc(group.title)}</div>`);
    for (const item of group.items) {
      const icon = item.icon ? `<svg class="blip-icon" aria-hidden="true"><use href="/blip/icons/sprite.svg#blip-icon-${esc(item.icon)}"/></svg>` : "";
      out.push(`<div class="blip-box blip-command-item" role="option" id="docs-search-o${n++}" data-value="${esc(item.url)}" data-keywords="${esc(item.keywords || "")}">${icon}<span class="blip-command-label">${esc(item.title)}</span><span class="blip-command-hint">${esc(item.hint || "")}</span></div>`);
      items.push(item);
    }
    out.push("</div>");
  });
  list.innerHTML = out.join("");
  entries = [...list.querySelectorAll('[role="option"]')].map((el, i) => ({ el, i, item: items[i], p: prepare(items[i]), hint: el.querySelector(".blip-command-hint") }));
}
/** Each option back as it was built: its own keywords, hint, link and place. */
function restore() {
  for (const e of entries) {
    e.el.dataset.keywords = e.item.keywords || "";
    e.el.dataset.value = e.item.url;
    e.hint.textContent = e.item.hint || "";
  }
  const list = palette?.querySelector('[role="listbox"]');
  const byId = (a, b) => a.id.localeCompare(b.id, undefined, { numeric: true });
  for (const g of list?.querySelectorAll(".blip-command-group") ?? []) g.append(...[...g.querySelectorAll('[role="option"]')].sort(byId));
  list?.append(...[...list.querySelectorAll(".blip-command-group")].sort((a, b) => byId(a.firstElementChild, b.firstElementChild)));
}
let match;
palette?.addEventListener("input", (e) => {
  if (!entries.length || !match || !e.target.matches?.(".blip-command-input")) return;
  const query = e.target.value;
  const found = match(query, entries.map((x) => x.p));
  const typed = query.toLowerCase().trim();
  for (const x of entries) {
    const m = found.get(x.p);
    x.score = m?.score ?? 0;
    x.el.dataset.keywords = m ? `${x.item.keywords || ""} ${typed}` : x.item.keywords || "";
    x.el.dataset.value = m?.section ? `${x.item.url}#${m.section.id}` : x.item.url;
    x.hint.textContent = m?.section ? m.section.text : x.item.hint || "";
  }
  if (!typed) return restore();
  // Best first in each group, and the group with the best first, so the first one shown (the one Enter opens) is
  // the best of all.
  const byEl = new Map(entries.map((x) => [x.el, x]));
  const groups = [...palette.querySelectorAll(".blip-command-group")].map((g, n) => {
    const opts = [...g.querySelectorAll('[role="option"]')].map((el) => byEl.get(el)).sort((a, b) => b.score - a.score || a.i - b.i);
    g.append(...opts.map((x) => x.el));
    return { g, n, best: opts[0]?.score ?? 0 };
  });
  palette.querySelector('[role="listbox"]').append(...groups.sort((a, b) => b.best - a.best || a.n - b.n).map((x) => x.g));
}, { capture: true });
function loadIndex() {
  if (!palette) return Promise.resolve();
  index ??= (async () => {
    palette.dataset.loading = "";
    try {
      const [data, lib] = await Promise.all([fetch("/search.json").then((r) => r.json()), import("/js/search-match.js")]);
      await buildResults(data);
      match = lib.search;
    } finally {
      delete palette.dataset.loading;
      palette.querySelector("input")?.dispatchEvent(new Event("input", { bubbles: true }));
    }
  })();
  return index;
}
if (palette && searchButton) {
  customElements.whenDefined("blip-command").then(() => {
    searchButton.setAttribute("role", "button");
    searchButton.addEventListener("click", (e) => {
      e.preventDefault();
      palette.show();
    });
  });
  for (const ev of ["pointerenter", "focus", "touchstart"]) searchButton.addEventListener(ev, loadIndex, { once: true, passive: true });
  const dialog = palette.querySelector("dialog");
  dialog?.addEventListener("toggle", (e) => e.newState === "open" && loadIndex());
  // Closed: the options go back to how they were built, for the next search.
  dialog?.addEventListener("close", restore);
  palette.addEventListener(palette.dataset.docsChoose || "blip-action", (e) => {
    const url = e.detail.value;
    if (url) location.href = url;
  });
}

// ------------------------------------------------------------------ copy

const live = Object.assign(document.createElement("p"), { className: "blip-sr-only" });
live.setAttribute("role", "status");
document.body.append(live);
const labels = new WeakMap();
async function copyText(button, text) {
  if (!labels.has(button)) labels.set(button, button.innerHTML);
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = "Copied";
    live.textContent = `Copied ${text.length > 60 ? "to the clipboard" : text}`;
  } catch {
    button.textContent = "Copy failed";
    live.textContent = "Could not copy. Select the text and press Ctrl+C.";
  }
  clearTimeout(button._copyTimer);
  button._copyTimer = setTimeout(() => (button.innerHTML = labels.get(button)), 1600);
}
for (const b of document.querySelectorAll(".docs-copy")) {
  b.hidden = false;
  b.addEventListener("click", () => {
    const from = b.dataset.copyFrom ? document.querySelector(b.dataset.copyFrom) : b.closest(".docs-code")?.querySelector("pre");
    copyText(b, b.dataset.copy ?? from?.textContent ?? "");
  });
}

// ------------------------------------------------------------------ install: one package manager in every box

// Each install box (components/Install.astro) is tabs, one per package manager and the CDN. The one picked is
// remembered, and every box on the page turns to it.
const installs = [...document.querySelectorAll("blip-tabs.docs-install")];
function chooseInstall(id, from) {
  for (const box of installs) if (box !== from && box.querySelector(`[role="tab"][data-value="${CSS.escape(id)}"]`)) box.setAttribute("value", id);
}
if (installs.length) {
  const saved = store.get(KEYS.install);
  if (saved) chooseInstall(saved);
  document.addEventListener("blip-change", (e) => {
    const box = e.target.closest?.("blip-tabs.docs-install");
    if (!box || !e.detail?.value) return;
    store.set(KEYS.install, e.detail.value);
    chooseInstall(e.detail.value, box);
  });
}

// ------------------------------------------------------------------ example switches: a scheme or a pixel for one stage

document.addEventListener("blip-change", (e) => {
  const control = e.target.closest?.("[data-stage]");
  if (!control) return;
  const stage = document.getElementById(control.dataset.stage);
  const value = e.detail?.value ?? control.value;
  if (!stage) return;
  if (control.dataset.attr === "scheme") {
    if (value === "page") stage.removeAttribute("data-blip-scheme");
    else stage.setAttribute("data-blip-scheme", value);
  } else if (control.dataset.attr === "pixel") {
    if (value === "2") stage.removeAttribute("data-blip-pixel");
    else stage.setAttribute("data-blip-pixel", value);
  }
});

// ------------------------------------------------------------------ on this page

const toc = document.querySelector(".docs-toc");
if (toc && "IntersectionObserver" in window) {
  const links = new Map([...toc.querySelectorAll("a")].map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
  const seen = new Set();
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) en.isIntersecting ? seen.add(en.target.id) : seen.delete(en.target.id);
    const first = [...links.keys()].find((id) => seen.has(id));
    if (first) for (const [id, a] of links) a.toggleAttribute("aria-current", id === first), id === first && a.setAttribute("aria-current", "true");
  }, { rootMargin: "-80px 0px -55% 0px" });
  for (const id of links.keys()) {
    const h = document.getElementById(id);
    if (h) io.observe(h);
  }
}

// ------------------------------------------------------------------ sound: one state for every control on the site

// Every sound control carries data-docs-sound: a switch (<input>) shows it as checked, a button as aria-pressed with
// its .docs-sound-label and its two icons (.docs-sound-on, .docs-sound-off, docs.css). This keeps the reader's choice
// (localStorage "blip:sound", as @blip/sound's rememberSound uses it) and every control in step, and tells page
// scripts with a "docs-sound" event. Remembered as on, the controls say on from the first paint, and the audio starts
// at the first click or key anywhere else (browsers start audio only then); pressing a control first turns it off.
const SOUND_KEY = "blip:sound";
let soundWanted = store.get(SOUND_KEY) === "on";
let soundVolume = 0.7;
let soundLib; // @blip/sound, once it is needed
let soundReady; // the last enableSound(): resolves once the audio runs
const soundModule = async () => (soundLib ??= await import("@blip/sound"));
const isSoundControl = (t) => !!t?.closest?.("[data-docs-sound], label:has([data-docs-sound])");
function enableAudio() {
  soundReady = soundLib.enableSound({ volume: soundVolume });
  return soundReady;
}
function syncSound() {
  for (const el of document.querySelectorAll("[data-docs-sound]")) {
    if (el instanceof HTMLInputElement) el.checked = soundWanted;
    else {
      el.setAttribute("aria-pressed", String(soundWanted));
      const label = el.querySelector(".docs-sound-label");
      if (label) label.textContent = soundWanted ? "Sound on" : "Sound off";
    }
  }
  document.dispatchEvent(new CustomEvent("docs-sound", { detail: { on: soundWanted } }));
}
async function setSound(on) {
  soundWanted = on;
  store.set(SOUND_KEY, on ? "on" : "off");
  syncSound();
  const lib = await soundModule();
  if (soundWanted !== on) return;
  if (on) await enableAudio();
  else lib.disableSound();
}
function playSound(name, options) {
  if (!soundWanted || !soundLib) return;
  // Not running yet (remembered from an earlier visit): this press starts it.
  if (!soundLib.soundOn() && navigator.userActivation?.isActive !== false) enableAudio();
  soundReady?.then(() => soundWanted && soundLib.play(name, options));
}
window.docs.sound = {
  get on() { return soundWanted; },
  set: setSound,
  toggle: () => setSound(!soundWanted),
  play: playSound,
  /** 0 to 1, for this page. */
  setVolume(v) {
    soundVolume = v;
    if (soundWanted && soundLib?.soundOn()) enableAudio();
  },
};
document.addEventListener("click", (e) => {
  const b = e.target.closest?.("button[data-docs-sound]");
  if (b) setSound(b.getAttribute("aria-pressed") !== "true").then(() => soundWanted && playSound("select"));
});
document.addEventListener("change", (e) => {
  if (e.target instanceof HTMLInputElement && e.target.matches("[data-docs-sound]")) setSound(e.target.checked).then(() => soundWanted && playSound("select"));
});
// Remembered as on: ready the module, and start the audio at the first click, key or touch that is not on a sound
// control (a control's own press decides for itself).
if (soundWanted) {
  soundModule();
  const wake = new AbortController();
  const start = (e) => {
    if (!soundWanted || !soundLib) return wake.abort();
    if (isSoundControl(e.target)) return;
    enableAudio().then((running) => running && wake.abort());
  };
  for (const type of ["click", "keydown", "touchend"]) addEventListener(type, start, { signal: wake.signal, capture: true });
}
// Another tab (or a template in a frame) changed it.
addEventListener("storage", (e) => {
  if (e.key !== SOUND_KEY || (e.newValue === "on") === soundWanted) return;
  soundWanted = e.newValue === "on";
  if (!soundWanted) soundLib?.disableSound();
  syncSound();
});
syncSound();
