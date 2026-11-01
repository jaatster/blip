// The foundations pages' specimens: type to try Pixel Bop, replay the moves, send the page through a transition,
// the sound board and the voice, and the icon browser.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const restart = (el, fn) => { fn(false); void el.offsetWidth; fn(true); };

// ------------------------------------------------------------------ type: try Pixel Bop

const tryText = $("#try-text"), tryOut = $(".docs-try-out"), tryScale = $(".docs-try-scale"), tryPop = $(".docs-try-pop");
function renderTry() {
  if (!tryOut) return;
  const text = tryText.value || "Pixel Bop";
  tryOut.textContent = text;
  tryOut.dataset.scale = tryScale?.value || "3";
  tryOut.classList.toggle("chu-pop", !!tryPop?.checked);
  if (tryPop?.checked) tryOut.dataset.pop = text;
  else delete tryOut.dataset.pop;
}
tryText?.addEventListener("input", renderTry);
tryScale?.addEventListener("chu-change", renderTry);
tryPop?.addEventListener("change", renderTry);

// ------------------------------------------------------------------ motion

for (const b of $$("[data-replay]")) {
  b.addEventListener("click", () => {
    const el = $(b.dataset.replay);
    if (el) restart(el, (on) => el.toggleAttribute("data-run", on));
  });
}
for (const b of $$("[data-play]")) {
  b.addEventListener("click", () => {
    const cls = b.dataset.play;
    const el = b.closest(".docs-move")?.querySelector(`[data-move="${cls}"]`);
    if (el) restart(el, (on) => el.classList.toggle(cls, on));
  });
}
for (const b of $$(".docs-transition")) {
  b.addEventListener("click", async () => {
    const { transition } = await import("@jaatster/blip-effects/transitions.js");
    await transition(() => {}, { kind: b.dataset.kind });
    b.focus();
  });
}

// ------------------------------------------------------------------ depth: a toggle to press

for (const b of $$(".docs-toggle-demo")) b.addEventListener("click", () => b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true")));

// ------------------------------------------------------------------ sound: the board and the voice

let sound;
const board = $(".docs-board");
async function setSound(on) {
  sound ??= await import("@jaatster/blip-sound");
  sound.rememberSound();
  if (on) await sound.enableSound({ volume: Number($(".docs-volume-input")?.value ?? 7) / 10 });
  else sound.disableSound();
  syncBoard();
}
function syncBoard() {
  const on = !!sound?.soundOn();
  const t = $(".docs-sound-toggle");
  if (t) {
    t.setAttribute("aria-pressed", String(on));
    t.querySelector("span:last-child").textContent = on ? "Sound on" : "Sound off";
  }
  for (const k of $$(".docs-sound-key, .docs-voice-play")) k.setAttribute("aria-disabled", String(!on));
  const hint = $(".docs-board-hint");
  if (hint) hint.textContent = on ? "Sound is on. It stays on as you move around the site, until you turn it off." : "Sound is off. Turn it on with the first button.";
}
if (board || $(".docs-voice")) {
  if (localStorage.getItem("blip:sound") === "on") import("@jaatster/blip-sound").then((s) => { sound = s; document.addEventListener("pointerdown", () => setTimeout(syncBoard, 60), { once: true }); });
  $(".docs-sound-toggle")?.addEventListener("click", () => setSound(!sound?.soundOn()));
  $(".docs-volume-input")?.addEventListener("change", (e) => {
    if (sound?.soundOn()) sound.enableSound({ volume: Number(e.target.value) / 10 }).then(() => sound.play("select"));
  });
  for (const k of $$(".docs-sound-key")) {
    k.addEventListener("click", () => {
      if (k.getAttribute("aria-disabled") === "true") return $(".docs-sound-toggle")?.focus();
      if (k.dataset.sound === "blip") "Blip".split("").forEach((c, i) => setTimeout(() => sound.play("blip", { rate: sound.voiceRate(c) }), i * 90));
      else sound.play(k.dataset.sound);
    });
  }
  const out = $(".docs-voice-out");
  $(".docs-voice-play")?.addEventListener("click", (e) => {
    if (e.currentTarget.getAttribute("aria-disabled") === "true") return $(".docs-sound-toggle")?.focus();
    const mood = $(".docs-voice-mood")?.value ?? "";
    if (mood) out.setAttribute("mood", mood);
    else out.removeAttribute("mood");
    out.text = $(".docs-voice-text").value || "…";
  });
}

// ------------------------------------------------------------------ icons: search, pick, copy

const icons = $(".docs-icons");
if (icons) {
  const search = $(".docs-icon-search input"), category = $(".docs-icon-category"), count = $(".docs-icon-count"), empty = $(".docs-icon-empty");
  const items = $$(".docs-icon-grid > li");
  const titles = Object.fromEntries($$(".docs-icon-category option").filter((o) => o.value).map((o) => [o.value, o.textContent.replace(/\s*\(\d+\)$/, "")]));
  function filter() {
    const words = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const cat = category.value;
    let shown = 0;
    for (const li of items) {
      const group = li.closest(".docs-icon-group").dataset.category;
      const text = `${li.dataset.name} ${li.dataset.tags}`;
      const ok = (!cat || cat === group) && words.every((w) => text.includes(w));
      li.hidden = !ok;
      if (ok) shown++;
    }
    for (const g of $$(".docs-icon-group")) g.hidden = !g.querySelector("li:not([hidden])");
    empty.hidden = shown > 0;
    count.textContent = `${shown} ${shown === 1 ? "icon" : "icons"}`;
  }
  search.addEventListener("input", filter);
  category.addEventListener("change", filter);

  const detail = $(".docs-icon-detail");
  function pick(button) {
    for (const b of $$(".docs-icon-button[aria-pressed='true']")) b.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-pressed", "true");
    const name = button.dataset.icon, path = button.querySelector("path").getAttribute("d");
    const li = button.closest("li"), cat = button.closest(".docs-icon-group").dataset.category;
    for (const p of $$(".docs-icon-big path", detail)) p.setAttribute("d", path);
    $(".docs-icon-detail-name", detail).textContent = name;
    $(".docs-icon-detail-tags", detail).textContent = `${titles[cat] ?? cat} · ${li.dataset.tags.split(" ").join(", ")}`;
    const svg = `<svg class="chu-icon" viewBox="0 0 12 12" aria-hidden="true"><path d="${path}"/></svg>`;
    const copies = { svg, name, element: `<chu-icon name="${name}"></chu-icon>` };
    for (const b of $$("[data-copy-kind]", detail)) b.dataset.copy = copies[b.dataset.copyKind];
    $(".docs-icon-snippet code", detail).textContent = svg;
  }
  icons.addEventListener("click", (e) => {
    const b = e.target.closest(".docs-icon-button");
    if (b) pick(b);
  });
  const initial = $(".docs-icon-button[aria-pressed='true']") ?? $(".docs-icon-button");
  if (initial) pick(initial);
  const q = new URLSearchParams(location.search).get("icon");
  if (q) {
    search.value = q;
    filter();
  }
}
