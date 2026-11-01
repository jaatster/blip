// Palette maker: a palette started from Blip's own or a preset, turned with four levers (the accent's hue and
// strength, Night's tint and lightness) or started from any colour, worked out with the presets' own maths
// (palette.mjs), checked in Day, Sunset and Night, and exported. What a preset keeps as it is (Candy's Day and Sunset,
// Grape's Night) stays until a lever that moves it is turned; a failing check holds the export back until the
// person says to go ahead anyway.
import { makePalette, oklch, toOklch, contrast } from "/chu/tokens/palette.mjs";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const data = JSON.parse($("#tb-data").textContent);
const SCHEMES = ["day", "sunset", "night"];
const KEY = "blip-docs:palette-maker";
const AA = 4.5;

// ------------------------------------------------------------------ colour

/** palette.day.accent.base -> palette-day-accent, as the tokens name it. */
const kebab = (path) => path.split(".").filter((p, i, a) => !(p === "base" && i === a.length - 1)).join("-");
/** A palette value (#RRGGBB, or an alias to a primitive such as {candy.blue.base}) as a colour, and as CSS. */
const hexOf = (v) => (v.startsWith("{") ? data.hexes[kebab(v.slice(1, -1))] : v.toUpperCase());
const cssOf = (v) => (v.startsWith("{") ? `var(--chu-${kebab(v.slice(1, -1))})` : v.toUpperCase());
const valid = (h) => /^#[0-9a-f]{6}$/i.test(h);
const hueGap = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
/** The weakest of every foreground on every background: the ratio and the pair. */
function worst(fgs, bgs) {
  let w = { ratio: Infinity };
  for (const fg of fgs) for (const bg of bgs) { const ratio = contrast(fg, bg); if (ratio < w.ratio) w = { ratio, fg, bg }; }
  return w;
}

// ------------------------------------------------------------------ state

const preset = (id) => data.palettes.find((p) => p.id === id) ?? data.palettes[0];
/** A preset's recipe, as the levers hold it: the accent from hue and strength or from a colour, Night's page from
    the levers or from a colour, and the text colours a well-known theme brings. */
function fromPreset(id) {
  const r = preset(id).recipe;
  return {
    from: preset(id).id,
    accent: r.accent ?? null,
    lch: r.accent ? toOklch(r.accent) : null,
    hue: r.hue ?? 0,
    strength: r.strength ?? 1,
    night: r.bg ? { bg: r.bg } : { lightness: r.lightness ?? 0.235, tint: r.tint ?? 0, ...(r.baseHue === undefined ? {} : { baseHue: r.baseHue }) },
    text: r.text ?? null,
    muted: r.muted ?? null,
    accentMoved: false,
    nightMoved: false,
    holdDays: false,
    override: false,
  };
}
function load() {
  let saved;
  try { saved = JSON.parse(localStorage.getItem(KEY)); } catch { /* none yet */ }
  if (saved?.v === 1 && data.palettes.some((p) => p.id === saved.from)) return saved;
  return { v: 1, scheme: "night", pixel: "2", ...fromPreset(data.palettes[0].id) };
}
let state = load();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode */ } };
const changed = () => state.accentMoved || state.nightMoved;

/** The recipe for makePalette. */
const recipe = () => ({
  ...(state.accent ? { accent: state.accent } : { hue: state.hue, strength: state.strength }),
  ...state.night,
  ...(state.text ? { text: state.text } : {}),
  ...(state.muted ? { muted: state.muted } : {}),
});

/** What the palette sets: worked out from the recipe, with what the preset keeps where no lever has moved it. */
function values() {
  const p = preset(state.from);
  const out = makePalette(recipe(), data.scene);
  for (const [path, v] of Object.entries(p.keep)) {
    if (/^palette\.night\.(accent|warning)\./.test(path) ? state.accentMoved : state.nightMoved) continue;
    out[path] = v;
  }
  if (p.days && (state.holdDays || !state.accentMoved)) Object.assign(out, p.days);
  return out;
}
/** Every palette colour as a hex: the palette's, and Candy's where it sets nothing (the warning, mostly). */
const colours = (v) => Object.fromEntries(Object.entries({ ...data.defaults, ...v }).map(([k, x]) => [k, hexOf(x)]));

// ------------------------------------------------------------------ checks

/** The pairs the token build checks, in a scheme: each as its weakest pair, so the list stays short. */
function checks(scheme, c) {
  const P = (k) => c[`palette.${scheme}.${k}`];
  const f = data.fixed[scheme];
  const groups = scheme === "night"
    ? (() => {
      const n = { bg: P("bg"), surface: P("surface.base"), raised: P("surface.raised"), sunken: P("surface.sunken"), ink: P("ink") };
      const page = [n.bg, n.surface, n.raised], all = [...page, n.sunken];
      return [
        ["Label on the candy", [n.ink], [P("accent.base")]],
        ["Label on the soft fill, and selected text", [n.ink], [P("accent.light")]],
        ["Accent text on the page and surfaces", [P("accent.text")], page],
        ["Text on the page, surfaces and wells", [P("text.base")], all],
        ["Muted text on the same", [P("text.muted")], all],
        ["Lines on the page and surfaces", [P("line.base")], [n.bg, n.surface], 3],
        ["Info, success and danger text", [f.info, f.success, f.danger], page],
        ["Warning label on its candy", [n.ink], [P("warning.base"), P("warning.light")]],
        ["Warning text on the page and surfaces", [P("warning.text")], page],
        ["Visited links", [f.visited], [n.bg, n.surface]],
        ["Labels on the disabled dithers", [n.ink], [P("text.base"), P("text.muted")]],
      ];
    })()
    : [
      ["Label on the candy", [f.ink], [P("accent.base")]],
      ["Label on the soft fill, and selected text", [f.ink], [P("accent.light")]],
      ["Accent text on the page and surfaces", [P("accent.text")], [f.bg, f.surface, f.raised]],
      ["Label on the disabled dither", [f.ink], [f.dither]],
      ["Warning label on its candy", [f.ink], [P("warning.base"), P("warning.light")]],
      ["Warning text on the page and surfaces", [P("warning.text")], [f.bg, f.surface, f.raised]],
    ];
  return groups.map(([label, fgs, bgs, min = AA]) => ({ label, min, ...worst(fgs, bgs) })).map((x) => ({ ...x, ok: x.ratio >= x.min }));
}

/** What the accent looks like that it should not: success or danger, or yellow, which is focus. An accent close to
    the warning's orange moves the warning to amber instead (makePalette), and that is said too. */
function warnings(scheme, c) {
  const base = c[`palette.${scheme}.accent.base`];
  const [, C, H] = toOklch(base);
  const out = [];
  const moved = c[`palette.${scheme}.warning.base`] !== hexOf(data.defaults[`palette.${scheme}.warning.base`]);
  if (moved) out.push({ id: "amber", tone: "info", text: `<strong>Warnings turn amber.</strong> The accent is close to the warning's orange, so in this palette a warning is ${c[`palette.${scheme}.warning.base`]}: still not yellow, which is focus, and never mistaken for the main button.` });
  if (C < 0.06) return out;
  for (const [id, it] of Object.entries(data.intents)) {
    if (id === "warning" && moved) continue;
    const [, c2, h2] = toOklch(it.base);
    if (c2 >= 0.06 && hueGap(H, h2) <= 15) out.push({ id, tone: "warning", text: `<strong>It looks like ${it.name}.</strong> ${it.why} With the accent this close, every main button reads as ${it.reads}. Turn the hue further from ${it.candy}.` });
  }
  const [, , hf] = toOklch(data.focus);
  if (hueGap(H, hf) <= 20) out.push({ id: "focus", tone: "warning", text: "<strong>Yellow is focus.</strong> The focus ring is the only yellow in an interface, a yellow ring with an ink edge; next to yellow buttons it is hard to see where the keyboard is. Turn the hue further from Lemon Drop." });
  return out;
}

// ------------------------------------------------------------------ output

const ORDER = ["palette.day", "palette.sunset", "palette.night", "world"];
const ordered = (v) => Object.entries(v).sort(([a], [b]) => ORDER.findIndex((p) => a.startsWith(p)) - ORDER.findIndex((p) => b.startsWith(p)) || a.localeCompare(b, "en", { numeric: true }));
const srgb = (h) => ({ colorSpace: "srgb", components: [1, 3, 5].map((i) => Math.round((parseInt(h.slice(i, i + 2), 16) / 255) * 10000) / 10000), hex: h });
const failing = (c) => SCHEMES.flatMap((s) => checks(s, c).filter((x) => !x.ok).map((x) => ({ ...x, scheme: s })));
const failText = (f) => `${data.titles[f.scheme]}: ${f.label.toLowerCase()} ${f.ratio.toFixed(2)}:1`;
const origin = () => `from ${preset(state.from).name}${changed() ? ", changed" : ""}`;
const CANDY = "node_modules/@jaatster/blip-tokens/src/palettes/candy.tokens.json";

function css(v, fails) {
  return [
    `/* My Blip palette, ${origin()}. Load it after @jaatster/blip-tokens/tokens.css: a :root rule in the same layer, loaded later, wins. */`,
    ...(fails.length ? [`/* Under WCAG 2.2 AA, exported anyway: ${fails.map(failText).join("; ")}. */`] : []),
    "@layer chu.tokens {",
    "  :root {",
    ...ordered(v).map(([path, x]) => `    --chu-${kebab(path)}: ${cssOf(x)};`),
    ...(state.pixel !== "2" ? [`    --chu-pixel: ${state.pixel}px;`] : []),
    "  }",
    "}",
  ].join("\n") + "\n";
}
/** The palette as a DTCG token file, laid out as Blip's own are (palettes.mjs). */
function tokensFile(v, fails) {
  const tree = {
    $schema: "https://www.designtokens.org/schemas/2025.10/format.json",
    $description: `My palette, ${origin()}. Add it after Blip's candy palette in the resolver.${fails.length ? ` Under WCAG 2.2 AA, exported anyway: ${fails.map(failText).join("; ")}.` : ""}`,
    $extensions: { blip: { name: "My palette" } },
    $type: "color",
  };
  for (const [path, x] of ordered(v)) {
    const keys = path.split(".");
    let node = tree;
    for (const k of keys.slice(0, -1)) node = node[k] ??= {};
    node[keys.at(-1)] = { $value: x.startsWith("{") ? x : srgb(x.toUpperCase()) };
  }
  tree.palette.$description = "The accent of each time of day, the warning, and Night's page, text, lines and ink. The scheme roles read these.";
  tree.world.night.$description = "The night sky and ground in this palette.";
  return JSON.stringify(tree, null, 2) + "\n";
}
function resolver() {
  return JSON.stringify({
    $schema: "https://www.designtokens.org/schemas/2025.10/resolver.json",
    name: "My Blip palette",
    version: "2025.10",
    modifiers: {
      palette: { contexts: { candy: [{ $ref: CANDY }], mine: [{ $ref: CANDY }, { $ref: "my-palette.tokens.json" }] }, default: "mine" },
      pixel: { contexts: Object.fromEntries(["2", "3", "4"].map((p) => [p, [{ $ref: `node_modules/@jaatster/blip-tokens/src/pixel/${p}.tokens.json` }]])), default: state.pixel },
    },
  }, null, 2) + "\n";
}

// ------------------------------------------------------------------ render

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const preview = $(".tb-preview");
const FORMAT = {
  hue: (x) => [`${Math.round(x)}°`, `${Math.round(x)} degrees`],
  strength: (x) => [x.toFixed(2), x.toFixed(2)],
  tint: (x) => [x.toFixed(3), x.toFixed(3)],
  lightness: (x) => [x.toFixed(3), x.toFixed(3)],
};
/** Where each lever stands: a colour to start from is read for its hue and strength, a page colour for its tint and
    lightness. */
function levers() {
  const page = state.night.bg ? toOklch(state.night.bg) : null;
  return {
    hue: state.accent ? state.lch[2] : state.hue,
    strength: state.accent ? state.lch[1] / 0.15 : state.strength,
    tint: page ? page[1] : state.night.tint,
    lightness: page ? page[0] : state.night.lightness,
  };
}
let worldDrawn = "", worldTimer;
function render() {
  const s = state.scheme, v = values(), c = colours(v);
  const vars = Object.fromEntries(Object.entries({ ...data.defaults, ...v }).map(([k, x]) => [`--chu-${kebab(k)}`, cssOf(x)]));
  // The palette goes where each preview sets its scheme: the roles there read it.
  for (const el of [...$$("[data-strip]"), preview]) for (const [k, x] of Object.entries(vars)) el.style.setProperty(k, x);
  preview.dataset.chuScheme = s;
  if (state.pixel === "2") delete preview.dataset.chuPixel;
  else preview.dataset.chuPixel = state.pixel;
  // A world keeps the colours it first read: a fresh one, once the levers rest, draws the new sky.
  const sky = Object.entries(vars).filter(([k]) => k.startsWith("--chu-world-night-")).join();
  if (sky !== worldDrawn) {
    worldDrawn = sky;
    clearTimeout(worldTimer);
    worldTimer = setTimeout(() => { const w = $(".tb-night chu-world"); w?.replaceWith(w.cloneNode(true)); }, 200);
  }

  // The cards, and what the chosen one is.
  const p = preset(state.from);
  for (const r of $$('input[name="tb-palette"]')) r.checked = r.value === p.id;
  $(".tb-about").innerHTML = `<strong>${esc(p.name)}</strong>: ${esc(p.description)}${p.credit ? ` ${esc(p.credit)}.` : ""}${changed() ? " Changed with the levers." : ""}`;
  $(".tb-reset-label").textContent = `Back to ${p.name}`;

  // The levers, where they stand.
  const at = levers();
  for (const input of $$(".tb-lever")) {
    const id = input.dataset.lever, x = at[id];
    if (document.activeElement !== input) input.value = String(x);
    const min = Number(input.min), max = Number(input.max);
    input.style.setProperty("--chu-slider-value", String(Math.min(1, Math.max(0, (x - min) / (max - min)))));
    const [shown, said] = FORMAT[id](x);
    input.nextElementSibling.textContent = shown;
    input.setAttribute("aria-valuetext", said);
  }
  const hexInput = $("#tb-hex"), brand = state.accent ?? c["palette.night.accent.base"];
  if (document.activeElement !== hexInput) hexInput.value = brand;
  $(".tb-picker").value = brand.toLowerCase();
  for (const row of $$(".tb-days-row")) row.hidden = !p.days;
  $(".tb-days-label").textContent = `Keep ${p.name}'s Day and Sunset`;
  $(".tb-days").checked = state.holdDays;

  // The candy worked out, in the scheme on show, and Night's page.
  const box = $(".tb-derived-box"), A = (k) => c[`palette.${s}.accent.${k}`];
  for (const [k, x] of Object.entries({ "--chu-accent": A("base"), "--chu-accent-light": A("light"), "--chu-accent-shade": A("shade"), "--chu-accent-on": s === "night" ? c["palette.night.ink"] : data.fixed[s].ink })) box.style.setProperty(k, x);
  for (const k of ["light", "base", "shade", "text"]) {
    $(`[data-v="${k}"]`).textContent = A(k);
    $(`.tb-dot[data-k="${k}"]`).style.background = A(k);
  }
  $('[data-v="text-scheme"]').textContent = `on ${data.titles[s]}`;
  const N = { bg: "bg", surface: "surface.base", raised: "surface.raised", sunken: "surface.sunken", text: "text.base", muted: "text.muted", line: "line.base", ink: "ink" };
  for (const [k, path] of Object.entries(N)) {
    $(`[data-nv="${k}"]`).textContent = c[`palette.night.${path}`];
    $(`.tb-dot[data-n="${k}"]`).style.background = c[`palette.night.${path}`];
  }

  // What it looks like that it should not.
  $(".tb-warnings").innerHTML = warnings(s, c).map((w) => `<div class="chu-box chu-alert tb-warn" data-tone="${w.tone}" data-warn="${w.id}"><span class="chu-alert-icon" aria-hidden="true"></span><div class="chu-alert-body"><p>${w.text}</p></div></div>`).join("");

  const list = checks(s, c);
  $(".tb-checks").innerHTML = list.map((x) => `<li data-pass="${x.ok}"><span class="tb-check-sample" style="color:${x.fg};background:${x.bg}">Aa</span><span>${x.label}${x.min !== AA ? ` (${x.min}:1)` : ""}</span><span class="docs-num">${x.ratio.toFixed(2)}:1</span><span class="chu-box chu-tag" data-size="sm" data-tone="${x.ok ? "success" : "danger"}">${x.ok ? "Pass" : "Fail"}</span></li>`).join("");
  const fails = failing(c), total = SCHEMES.reduce((n, sc) => n + checks(sc, c).length, 0);
  $(".tb-summary").textContent = fails.length ? `${fails.length} of ${total} checks fail: ${fails.map(failText).join("; ")}.` : `All ${total} checks pass, in Day, Sunset and Night.`;
  $(".tb-summary").dataset.pass = String(!fails.length);
  for (const cell of $$("[data-strip]")) cell.dataset.pass = String(!fails.some((f) => f.scheme === cell.dataset.strip));

  // The export: held back while a check fails, until the person says to go ahead.
  const blocked = fails.length > 0 && !state.override;
  $(".tb-blocked").hidden = !fails.length;
  $(".tb-blocked-list").innerHTML = fails.map((f) => `<li>${esc(failText(f))}</li>`).join("");
  $(".tb-override").checked = state.override;
  $(".tb-export").dataset.blocked = String(blocked);
  for (const b of $$(".tb-out-actions .chu-button")) b.setAttribute("aria-disabled", String(blocked));
  const held = "/* Held back: a contrast check fails (see above). Turn a lever, or say to export anyway. */\n";
  $("#tb-out-css").textContent = blocked ? held : css(v, fails);
  $("#tb-out-tokens").textContent = blocked ? held : tokensFile(v, fails);
  $("#tb-out-resolver").textContent = blocked ? held : resolver();
  save();
}

// ------------------------------------------------------------------ controls

const schemeControl = $(".tb-scheme"), pixelControl = $(".tb-pixel");
customElements.whenDefined("chu-segmented").then(() => {
  schemeControl.value = state.scheme;
  pixelControl.value = state.pixel;
});
schemeControl.addEventListener("chu-change", (e) => { state.scheme = e.detail.value; render(); });
pixelControl.addEventListener("chu-change", (e) => { state.pixel = e.detail.value; render(); });
// Picking a palette starts from it; picking the one already chosen, once the levers have moved, starts from it again.
for (const r of $$('input[name="tb-palette"]')) {
  r.addEventListener("click", () => {
    if (r.value === state.from && !changed()) return;
    state = { ...state, ...fromPreset(r.value) };
    render();
  });
}
for (const input of $$(".tb-lever")) {
  input.addEventListener("input", () => {
    const id = input.dataset.lever, x = Number(input.value);
    if (id === "hue" || id === "strength") {
      // A colour to start from turns too: its hue round the wheel, its chroma with the strength, its lightness kept.
      if (state.accent) {
        state.lch = id === "hue" ? [state.lch[0], state.lch[1], x] : [state.lch[0], x * 0.15, state.lch[2]];
        state.accent = oklch(...state.lch);
      } else state[id] = x;
      state.accentMoved = true;
    } else {
      // A page colour becomes the levers it stands for, and the one turned moves.
      if (state.night.bg) {
        const [L, C, h] = toOklch(state.night.bg);
        state.night = { lightness: L, tint: C, baseHue: h };
      }
      state.night = { ...state.night, [id]: x };
      state.nightMoved = true;
    }
    state.override = false;
    render();
  });
}
function custom(hex) {
  state.accent = hex.toUpperCase();
  state.lch = toOklch(state.accent);
  state.accentMoved = true;
  state.override = false;
  render();
}
$("#tb-hex").addEventListener("input", (e) => {
  let v = e.target.value.trim();
  if (!v.startsWith("#")) v = `#${v}`;
  const wrap = e.target.closest(".chu-input");
  if (!valid(v)) { wrap.dataset.tone = "danger"; e.target.setAttribute("aria-invalid", "true"); return; }
  delete wrap.dataset.tone;
  e.target.removeAttribute("aria-invalid");
  custom(v);
});
$(".tb-picker").addEventListener("input", (e) => custom(e.target.value));
$(".tb-days").addEventListener("change", (e) => { state.holdDays = e.target.checked; state.override = false; render(); });
$(".tb-override").addEventListener("change", (e) => { state.override = e.target.checked; render(); });
$(".tb-reset").addEventListener("click", () => {
  state = { ...state, ...fromPreset(state.from) };
  render();
});
for (const b of $$(".tb-download")) {
  b.addEventListener("click", () => {
    if (b.getAttribute("aria-disabled") === "true") return;
    const text = $(b.dataset.from).textContent;
    const url = URL.createObjectURL(new Blob([text], { type: b.dataset.file.endsWith(".css") ? "text/css" : "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: b.dataset.file });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    // The next step, once the files are on disk.
    $(".tb-downloaded").innerHTML = b.dataset.file.endsWith(".css")
      ? `Downloaded ${esc(b.dataset.file)}. Load it after <code class="docs-inline-code">@jaatster/blip-tokens/tokens.css</code>.`
      : `Downloaded ${esc(b.dataset.file)}. With both JSON files beside <code class="docs-inline-code">node_modules</code>, check and build them: <code class="docs-inline-code">npx blip-tokens my-palette.resolver.json</code>.`;
  });
}
// Copy is the site's own button; while the export is held back it copies nothing.
for (const b of $$(".tb-out-actions .docs-copy")) b.addEventListener("click", (e) => { if (b.getAttribute("aria-disabled") === "true") e.stopImmediatePropagation(); }, { capture: true });
render();
