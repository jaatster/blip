// The docs' own behaviour, on top of Blip's elements: the display menu (scheme and pixel), the palette menu,
// Auto following the clock, search through the command palette, copy buttons, the install boxes, the example
// switches and "On this page".
import { autoScheme, setScheme } from "@jaatster/blip-core";

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
  if (meta) meta.content = getComputedStyle(root).getPropertyValue("--pp-bg").trim() || meta.content;
}
function applyScheme(choice) {
  stopAuto?.();
  stopAuto = undefined;
  root.dataset.schemeChoice = choice;
  root.removeAttribute("data-pp-scheme-fade");
  if (choice === "auto") stopAuto = autoScheme(root);
  else setScheme(choice, root);
  requestAnimationFrame(themeColor);
  document.dispatchEvent(new CustomEvent("docs-scheme", { detail: { choice, scheme: root.dataset.ppScheme } }));
}
function applyPixel(px) {
  if (px === "3" || px === "4") root.dataset.ppPixel = px;
  else delete root.dataset.ppPixel;
}
root.addEventListener("pp-scheme-change", () => requestAnimationFrame(themeColor));

// ------------------------------------------------------------------ palette

// The palettes the menu offers, the default first (set by having no data-pp-palette).
const paletteMenu = document.querySelector(".docs-palette");
const paletteItems = paletteMenu ? [...paletteMenu.querySelectorAll('[role="menuitemradio"]')] : [];
const paletteIds = paletteItems.map((item) => item.dataset.value.split(":")[1]);
const defaultPalette = paletteIds[0];
const currentPalette = () => root.dataset.ppPalette || defaultPalette;
function applyPalette(id) {
  if (!id || id === defaultPalette || !paletteIds.includes(id)) delete root.dataset.ppPalette;
  else root.dataset.ppPalette = id;
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
  paletteMenu.hidden = false;
  syncPalette();
  paletteMenu.addEventListener(paletteMenu.dataset.docsChoose || "pp-action", (e) => {
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
  const scheme = root.dataset.schemeChoice || "auto", pixel = root.dataset.ppPixel || "2";
  for (const item of display.querySelectorAll('[role="menuitemradio"]')) {
    const [k, v] = item.dataset.value.split(":");
    item.setAttribute("aria-checked", String((k === "scheme" && v === scheme) || (k === "pixel" && v === pixel)));
  }
}
if (display) {
  display.hidden = false;
  syncMenu();
  // The event a chosen item fires, as the element's manifest names it (the page writes it in data-docs-choose).
  display.addEventListener(display.dataset.docsChoose || "pp-action", (e) => {
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

// ------------------------------------------------------------------ keys: Cmd on a Mac

if (mac) for (const k of document.querySelectorAll("[data-mod]")) k.textContent = "Cmd";

// ------------------------------------------------------------------ search

// The palette filters its options itself (every word in an option's label or data-keywords). Before it does, each
// option is matched with search-match.js, which knows synonyms, sections and typos: a match takes the words typed
// into its keywords, so the palette keeps it, shows the section it found and opens the page there; the best come
// first in their group.
const palette = document.querySelector("pp-command.docs-search");
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
    out.push(`<div class="pp-command-group" role="group" aria-labelledby="docs-search-g${gi}"><div class="pp-command-heading" id="docs-search-g${gi}">${esc(group.title)}</div>`);
    for (const item of group.items) {
      const icon = item.icon ? `<svg class="pp-icon" aria-hidden="true"><use href="/pp/icons/sprite.svg#pp-icon-${esc(item.icon)}"/></svg>` : "";
      out.push(`<div class="pp-box pp-command-item" role="option" id="docs-search-o${n++}" data-value="${esc(item.url)}" data-keywords="${esc(item.keywords || "")}">${icon}<span class="pp-command-label">${esc(item.title)}</span><span class="pp-command-hint">${esc(item.hint || "")}</span></div>`);
      items.push(item);
    }
    out.push("</div>");
  });
  list.innerHTML = out.join("");
  entries = [...list.querySelectorAll('[role="option"]')].map((el, i) => ({ el, i, item: items[i], p: prepare(items[i]), hint: el.querySelector(".pp-command-hint") }));
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
  for (const g of list?.querySelectorAll(".pp-command-group") ?? []) g.append(...[...g.querySelectorAll('[role="option"]')].sort(byId));
  list?.append(...[...list.querySelectorAll(".pp-command-group")].sort((a, b) => byId(a.firstElementChild, b.firstElementChild)));
}
let match;
palette?.addEventListener("input", (e) => {
  if (!entries.length || !match || !e.target.matches?.(".pp-command-input")) return;
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
  const groups = [...palette.querySelectorAll(".pp-command-group")].map((g, n) => {
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
  customElements.whenDefined("pp-command").then(() => {
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
  palette.addEventListener(palette.dataset.docsChoose || "pp-action", (e) => {
    const url = e.detail.value;
    if (url) location.href = url;
  });
}

// ------------------------------------------------------------------ copy

const live = Object.assign(document.createElement("p"), { className: "pp-sr-only" });
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
const installs = [...document.querySelectorAll("pp-tabs.docs-install")];
function chooseInstall(id, from) {
  for (const box of installs) if (box !== from && box.querySelector(`[role="tab"][data-value="${CSS.escape(id)}"]`)) box.setAttribute("value", id);
}
if (installs.length) {
  const saved = store.get(KEYS.install);
  if (saved) chooseInstall(saved);
  document.addEventListener("pp-change", (e) => {
    const box = e.target.closest?.("pp-tabs.docs-install");
    if (!box || !e.detail?.value) return;
    store.set(KEYS.install, e.detail.value);
    chooseInstall(e.detail.value, box);
  });
}

// ------------------------------------------------------------------ example switches: a scheme or a pixel for one stage

document.addEventListener("pp-change", (e) => {
  const control = e.target.closest?.("[data-stage]");
  if (!control) return;
  const stage = document.getElementById(control.dataset.stage);
  const value = e.detail?.value ?? control.value;
  if (!stage) return;
  if (control.dataset.attr === "scheme") {
    if (value === "page") stage.removeAttribute("data-pp-scheme");
    else stage.setAttribute("data-pp-scheme", value);
  } else if (control.dataset.attr === "pixel") {
    if (value === "2") stage.removeAttribute("data-pp-pixel");
    else stage.setAttribute("data-pp-pixel", value);
  }
});

// ------------------------------------------------------------------ the sidebar shows where you are

const nav = document.querySelector(".docs-sidebar");
const here = nav?.querySelector('[aria-current="page"]');
if (nav && here && nav.scrollHeight > nav.clientHeight) nav.scrollTop = Math.max(0, here.offsetTop - nav.clientHeight / 3);

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

// ------------------------------------------------------------------ sound, if the reader turned it on before

if (store.get("blip:sound") === "on") import("@jaatster/blip-sound").then((s) => s.rememberSound());
