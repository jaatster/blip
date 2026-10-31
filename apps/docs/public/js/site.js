// The docs' own behaviour, on top of Blip's elements: the display menu (scheme and pixel), Auto following the
// clock, search through the command palette, copy buttons, the example switches and "On this page".
import { autoScheme, setScheme } from "@jaatster/blip-core";

const root = document.documentElement;
const KEYS = { scheme: "blip-docs:scheme", pixel: "blip-docs:pixel" };
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
  display.addEventListener("pp-select", (e) => {
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
};

// ------------------------------------------------------------------ keys: Cmd on a Mac

if (mac) for (const k of document.querySelectorAll("[data-mod]")) k.textContent = "Cmd";

// ------------------------------------------------------------------ search

const palette = document.querySelector("pp-command.docs-search");
const searchButton = document.querySelector(".docs-search-button");
let index;
function buildResults(data) {
  const list = palette.querySelector('[role="listbox"]');
  const out = [];
  let n = 0;
  data.groups.forEach((group, gi) => {
    out.push(`<div class="pp-command-group" role="group" aria-labelledby="docs-search-g${gi}"><div class="pp-command-heading" id="docs-search-g${gi}">${esc(group.title)}</div>`);
    for (const item of group.items) {
      const icon = item.icon ? `<svg class="pp-icon" aria-hidden="true"><use href="/pp/icons/sprite.svg#pp-icon-${esc(item.icon)}"/></svg>` : "";
      out.push(`<div class="pp-box pp-command-item" role="option" id="docs-search-o${n++}" data-value="${esc(item.url)}" data-keywords="${esc(item.keywords || "")}">${icon}<span class="pp-command-label">${esc(item.title)}</span><span class="pp-command-hint">${esc(item.hint || "")}</span></div>`);
    }
    out.push("</div>");
  });
  list.innerHTML = out.join("");
}
function loadIndex() {
  if (!palette) return Promise.resolve();
  index ??= (async () => {
    palette.dataset.loading = "";
    try {
      const data = await (await fetch("/search.json")).json();
      buildResults(data);
    } finally {
      delete palette.dataset.loading;
      palette.querySelector("input")?.dispatchEvent(new Event("input"));
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
  palette.querySelector("dialog")?.addEventListener("toggle", (e) => e.newState === "open" && loadIndex());
  palette.addEventListener("pp-select", (e) => {
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
