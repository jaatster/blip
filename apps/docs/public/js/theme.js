// Theme builder: an accent per scheme (or one for all three), worked out the candies' way, made to pass AA, checked,
// and exported. A brand colour that is too dark or too pale for ink labels is nudged until they read (the same hue,
// brighter or softer), and stays itself as the accent text; "keep my exact colour" turns that off, and then a failing
// check holds the export back until the person says to go ahead anyway.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const data = JSON.parse($("#tb-data").textContent);
const SCHEMES = ["day", "sunset", "night"];
const KEY = "blip-docs:theme";
const AA = 4.5;

// ------------------------------------------------------------------ colour

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const hex = (r, g, b) => "#" + [r, g, b].map((c) => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, "0")).join("").toUpperCase();
function hsv(h) {
  const [r, g, b] = rgb(h).map((c) => c / 255);
  const max = Math.max(r, g, b), d = max - Math.min(r, g, b);
  let x = 0;
  if (d) x = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(x * 60 + 360) % 360, max ? d / max : 0, max];
}
function fromHsv(h, s, v) {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return hex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}
const linear = (c) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
function lum(h) {
  const [r, g, b] = rgb(h).map(linear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const worst = (c, list) => Math.min(...list.map((b) => contrast(c, b)));
const valid = (h) => /^#[0-9a-f]{6}$/i.test(h);
/** OKLCH: lightness, chroma and hue, for telling what a colour looks like (an intent, yellow). */
function oklch(h) {
  const [r, g, b] = rgb(h).map(linear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360];
}
const hueGap = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

/**
 * A colour made to take an ink label (4.5:1), keeping its hue: brighter first, then softer. Returns it as it is when
 * it already reads.
 */
function forInk(c) {
  if (contrast(data.ink, c) >= AA) return c;
  const [h, s, v] = hsv(c);
  for (let k = v; k <= 1.0001; k += 0.005) { const x = fromHsv(h, s, Math.min(1, k)); if (contrast(data.ink, x) >= AA) return x; }
  for (let k = s; k >= 0; k -= 0.005) { const x = fromHsv(h, Math.max(0, k), 1); if (contrast(data.ink, x) >= AA) return x; }
  return data.white;
}

/** Accent text for a scheme: the colour itself where it reads on the page and its surfaces, else darker (or, at night, lighter) a step at a time. */
function textFor(scheme, c) {
  const sc = data.schemes[scheme];
  const surfaces = [sc.bg, sc.surface, sc.raised];
  const [h, s, v] = hsv(c);
  if (worst(c, surfaces) >= AA) return c;
  if (!sc.dark) {
    for (let k = v; k >= 0; k -= 0.01) { const x = fromHsv(h, s, k); if (worst(x, surfaces) >= AA) return x; }
    return data.ink;
  }
  for (let k = v; k <= 1.0001; k += 0.01) { const x = fromHsv(h, s, Math.min(1, k)); if (worst(x, surfaces) >= AA) return x; }
  for (let k = s; k >= 0; k -= 0.01) { const x = fromHsv(h, k, 1); if (worst(x, surfaces) >= AA) return x; }
  return data.white;
}

/**
 * An accent for a scheme from what the person picked: a candy (its own bands; ink labels pass on every candy we
 * offer) or any colour. A colour's light band is the base at 0.65 of its saturation and full brightness, its shade
 * the base at 0.84 of its brightness. Labels are ink, on the candy and on the soft fill (the light band) alike, and
 * selected text is ink on the light band: so unless `exact`, the base and the light band are nudged until ink reads.
 */
function derive(scheme, pick, exact) {
  const sc = data.schemes[scheme];
  if (pick.candy) {
    const c = data.candies[pick.candy];
    const own = pick.candy === sc.accent.candy;
    return { candy: pick.candy, brand: c.base, base: c.base, light: c.light, shade: c.shade, text: own ? sc.accent.text : textFor(scheme, c.base), on: data.ink, nudged: {} };
  }
  const brand = pick.hex.toUpperCase();
  const base = exact ? brand : forInk(brand);
  const [h, s, v] = hsv(base);
  const band = fromHsv(h, s * 0.65, 1);
  const light = exact ? band : forInk(band);
  const shade = fromHsv(h, s, v * 0.84);
  // With the colour as it is, the label is ink if ink reads on both fills, else whichever reads better.
  const on = !exact || worst(data.ink, [base, light]) >= AA ? data.ink : worst(data.white, [base, light]) > worst(data.ink, [base, light]) ? data.white : data.ink;
  const nudged = {};
  if (base !== brand) nudged.base = brand;
  if (light !== band) nudged.light = band;
  return { candy: null, brand, base, light, shade, text: textFor(scheme, brand), on, nudged };
}

/** The pairs the token build checks for the accent, in a scheme. */
function checks(scheme, a) {
  const sc = data.schemes[scheme];
  return [
    ["Label on the candy", a.on, a.base],
    ["Label on the soft fill", a.on, a.light],
    ["Accent text on the page", a.text, sc.bg],
    ["Accent text on a surface", a.text, sc.surface],
    ["Accent text on a raised surface", a.text, sc.raised],
    ["Selected text", data.ink, a.light],
    ["Label on the disabled dither", a.on, sc.dither],
  ].map(([label, fg, bg]) => ({ label, fg, bg, ratio: contrast(fg, bg), ok: contrast(fg, bg) >= AA }));
}

/** What the accent looks like that it should not: an intent's colour, or yellow, which is focus. */
function warnings(a) {
  const [, C, H] = oklch(a.base);
  if (C < 0.06) return [];
  const out = [];
  for (const [id, it] of Object.entries(data.intents)) {
    const [, c2, h2] = oklch(it.base);
    if (c2 >= 0.06 && hueGap(H, h2) <= 15) out.push({ id, text: `<strong>It looks like ${it.name}.</strong> ${it.why} With the accent this close, every main button reads as ${it.reads}. Pick a hue further from ${it.candy}, or keep this colour for its own place and let the accent be a candy.` });
  }
  const [, , hf] = oklch(data.focus);
  if (hueGap(H, hf) <= 20) out.push({ id: "focus", text: `<strong>Yellow is focus.</strong> The focus ring is the only yellow in an interface, a yellow ring with an ink edge; next to yellow buttons it is hard to see where the keyboard is. Pick a hue further from Lemon Drop.` });
  return out;
}

// ------------------------------------------------------------------ state

const defaults = () => Object.fromEntries(SCHEMES.map((s) => [s, { candy: data.schemes[s].accent.candy, hex: data.schemes[s].accent.base }]));
function load() {
  let saved;
  try { saved = JSON.parse(localStorage.getItem(KEY)); } catch { /* none yet */ }
  const start = SCHEMES.includes(document.documentElement.dataset.ppScheme) ? document.documentElement.dataset.ppScheme : "day";
  if (saved?.v === 2 && saved.pick?.day) return { scheme: start, pixel: "2", all: false, exact: {}, override: false, ...saved };
  // An older save kept the worked-out accent: keep what was picked, and work it out again.
  if (saved?.accent?.day) return { v: 2, scheme: saved.scheme ?? start, pixel: saved.pixel ?? "2", all: false, exact: {}, override: false, pick: Object.fromEntries(SCHEMES.map((s) => [s, { candy: saved.accent[s].candy ?? null, hex: saved.accent[s].base }])) };
  return { v: 2, scheme: start, pixel: "2", all: false, exact: {}, override: false, pick: defaults() };
}
const state = load();
// A pick of a candy the builder no longer offers (a saved Liquorice) is kept as its colour.
for (const s of SCHEMES) if (state.pick[s]?.candy && !data.candies[state.pick[s].candy]) state.pick[s] = { candy: null, hex: state.pick[s].hex };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode */ } };
const accent = (s) => derive(s, state.pick[s], !!state.exact[s]);
/** Picks for the scheme being edited, or for all three. A new colour needs its own say-so to export failing. */
function setPick(pick) {
  for (const s of state.all ? SCHEMES : [state.scheme]) state.pick[s] = { ...pick };
  state.override = false;
}

// ------------------------------------------------------------------ output

const vars = (a) => ({ "--pp-accent": a.base, "--pp-accent-light": a.light, "--pp-accent-shade": a.shade, "--pp-accent-text": a.text, "--pp-accent-on": a.on, "--pp-selection-bg": a.light });
const comp = (h) => rgb(h).map((c) => Math.round((c / 255) * 1000) / 1000);
const color = (h) => ({ $value: { colorSpace: "srgb", components: comp(h), hex: h } });
const failing = () => SCHEMES.flatMap((s) => checks(s, accent(s)).filter((c) => !c.ok).map((c) => ({ ...c, scheme: s })));
const failText = (f) => `${data.schemes[f.scheme].title}: ${f.label.toLowerCase()} ${f.ratio.toFixed(2)}:1`;

function css() {
  const fails = failing();
  const out = [
    "/* My Blip theme. Load it after @jaatster/blip-tokens/tokens.css: the same layer and selectors, so it wins. */",
    ...(fails.length ? [`/* Under WCAG 2.2 AA, exported anyway: ${fails.map(failText).join("; ")}. */`] : []),
    "@layer pp.tokens {",
  ];
  // Each scheme's roles where tokens.css sets them (data.blocks, read from it when the site was built).
  for (const b of data.blocks) {
    const pad = "  ".repeat(b.wrap.length + 1);
    b.wrap.forEach((w, i) => out.push(`${"  ".repeat(i + 1)}${w} {`));
    out.push(`${pad}${b.selector} {`, ...Object.entries(vars(accent(b.scheme))).map(([k, v]) => `${pad}  ${k}: ${v};`), `${pad}}`);
    b.wrap.forEach((_, i) => out.push(`${"  ".repeat(b.wrap.length - i)}}`));
  }
  if (state.pixel !== "2") out.push(`  :root { --pp-pixel: ${state.pixel}px; }`);
  out.push("}");
  return out.join("\n") + "\n";
}
function tokensFile(scheme) {
  const a = accent(scheme);
  const fails = checks(scheme, a).filter((c) => !c.ok);
  return JSON.stringify({
    $schema: "https://www.designtokens.org/schemas/2025.10/format.json",
    $description: `My theme: the ${data.schemes[scheme].title} accent${a.candy ? ` (${a.candy})` : ""}. Add after Blip's own ${scheme} file in the resolver.${fails.length ? ` Under WCAG 2.2 AA, exported anyway: ${fails.map((f) => `${f.label.toLowerCase()} ${f.ratio.toFixed(2)}:1`).join("; ")}.` : ""}`,
    $type: "color",
    accent: { base: color(a.base), light: color(a.light), shade: color(a.shade), text: { ...color(a.text), $description: "This intent as text on the scheme's surfaces (AA)." }, on: { ...color(a.on), $description: "Labels and icons on this intent's candy (AA)." } },
    selection: { bg: { ...color(a.light), $description: "Selected text background." } },
  }, null, 2) + "\n";
}
function resolver() {
  const ctx = (s) => [{ $ref: `node_modules/@jaatster/blip-tokens/src/schemes/${s}.tokens.json` }, { $ref: `my-theme.${s}.tokens.json` }];
  return JSON.stringify({
    $schema: "https://www.designtokens.org/schemas/2025.10/resolver.json",
    name: "My Blip theme",
    version: "2025.10",
    modifiers: {
      scheme: { contexts: Object.fromEntries(SCHEMES.map((s) => [s, ctx(s)])), default: "day" },
      pixel: { contexts: Object.fromEntries(["2", "3", "4"].map((p) => [p, [{ $ref: `node_modules/@jaatster/blip-tokens/src/pixel/${p}.tokens.json` }]])), default: state.pixel },
    },
  }, null, 2) + "\n";
}

// ------------------------------------------------------------------ render

const preview = $(".tb-preview");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function setVars(el, a) { for (const [k, v] of Object.entries(vars(a))) el.style.setProperty(k, v); }
function render() {
  const s = state.scheme, a = accent(s), sc = data.schemes[s];
  preview.dataset.ppScheme = s;
  if (state.pixel === "2") delete preview.dataset.ppPixel;
  else preview.dataset.ppPixel = state.pixel;
  setVars(preview, a);
  for (const cell of $$("[data-strip]")) setVars(cell, accent(cell.dataset.strip));
  setVars($(".tb-derived-box"), a);
  for (const k of ["light", "base", "shade", "text", "on"]) {
    $(`[data-v="${k}"]`).textContent = a[k];
    $(`.tb-dot[data-k="${k}"]`).style.background = a[k];
    const from = $(`[data-from="${k}"]`);
    if (from) from.textContent = a.nudged[k] ? `from ${a.nudged[k]}` : "";
  }
  $(".tb-scheme-name").textContent = state.all ? "Day, Sunset and Night" : sc.title;
  for (const r of $$('input[name="tb-candy"]')) r.checked = r.value === a.candy;
  const input = $("#tb-hex");
  if (document.activeElement !== input) input.value = a.brand;
  $(".tb-picker").value = a.brand.toLowerCase();
  $(".tb-all").checked = state.all;

  // The nudge, said in words, and the way to keep the colour as it is.
  const nudge = $(".tb-nudge"), exactRow = $(".tb-exact-row");
  const would = a.candy ? {} : derive(s, state.pick[s], false).nudged;
  let note = "";
  if (!a.candy && a.nudged.base) note = `Ink labels need 4.5:1, so the candy is <strong>${a.base}</strong>: your ${esc(a.brand)} (${contrast(data.ink, a.brand).toFixed(2)}:1) made ${lum(a.base) > lum(a.brand) ? "brighter" : "softer"}, in the same hue. Your colour stays as the accent text: links, the chosen underline tab.`;
  else if (!a.candy && a.nudged.light) note = `Ink labels need 4.5:1 on the soft fill too, so the light band is <strong>${a.light}</strong>, softer than the usual ${a.nudged.light}.`;
  else if (!a.candy && state.exact[s]) note = "Your colour exactly as it is. Where a label does not pass, the export waits until it does, or until you say to go ahead.";
  nudge.innerHTML = note;
  nudge.hidden = !note;
  exactRow.hidden = !!a.candy || !(would.base || would.light || state.exact[s]);
  $(".tb-exact").checked = !!state.exact[s];

  // What it looks like that it should not.
  $(".tb-warnings").innerHTML = warnings(a).map((w) => `<div class="pp-box pp-alert tb-warn" data-tone="warning" data-warn="${w.id}"><span class="pp-alert-icon" aria-hidden="true"></span><div class="pp-alert-body"><p>${w.text}</p></div></div>`).join("");

  const list = checks(s, a);
  $(".tb-checks").innerHTML = list.map((c) => `<li data-pass="${c.ok}"><span class="tb-check-sample" style="color:${c.fg};background:${c.bg}">Aa</span><span>${c.label}</span><span class="docs-num">${c.ratio.toFixed(2)}:1</span><span class="pp-box pp-tag" data-size="sm" data-tone="${c.ok ? "success" : "danger"}">${c.ok ? "Pass" : "Fail"}</span></li>`).join("");
  const fails = failing();
  $(".tb-summary").textContent = fails.length ? `${fails.length} of ${SCHEMES.length * list.length} checks fail: ${fails.map(failText).join("; ")}.` : `All ${SCHEMES.length * list.length} checks pass, in Day, Sunset and Night.`;
  $(".tb-summary").dataset.pass = String(!fails.length);
  for (const cell of $$("[data-strip]")) cell.dataset.pass = String(!fails.some((f) => f.scheme === cell.dataset.strip));

  // The export: held back while a check fails, until the person says to go ahead.
  const blocked = fails.length > 0 && !state.override;
  $(".tb-blocked").hidden = !fails.length;
  $(".tb-blocked-list").innerHTML = fails.map((f) => `<li>${esc(failText(f))}</li>`).join("");
  $(".tb-override").checked = state.override;
  $(".tb-export").dataset.blocked = String(blocked);
  for (const b of $$(".tb-out-actions .pp-button")) b.setAttribute("aria-disabled", String(blocked));
  const held = "/* Held back: a contrast check fails (see above). Change the colour, or say to export anyway. */\n";
  $("#tb-out-css").textContent = blocked ? held : css();
  for (const sch of SCHEMES) $(`#tb-out-${sch}`).textContent = blocked ? held : tokensFile(sch);
  $("#tb-out-resolver").textContent = blocked ? held : resolver();
  save();
}

// ------------------------------------------------------------------ controls

const schemeControl = $(".tb-scheme"), pixelControl = $(".tb-pixel");
customElements.whenDefined("pp-segmented").then(() => {
  schemeControl.value = state.scheme;
  pixelControl.value = state.pixel;
});
schemeControl.addEventListener("pp-change", (e) => { state.scheme = e.detail.value; render(); });
pixelControl.addEventListener("pp-change", (e) => { state.pixel = e.detail.value; render(); });
$(".tb-all").addEventListener("change", (e) => {
  state.all = e.target.checked;
  // One accent all day: the one on show now.
  if (state.all) for (const s of SCHEMES) (state.pick[s] = { ...state.pick[state.scheme] }), (state.exact[s] = !!state.exact[state.scheme]);
  render();
});
for (const r of $$('input[name="tb-candy"]')) {
  r.addEventListener("change", () => {
    setPick({ candy: r.value, hex: data.candies[r.value].base });
    render();
  });
}
function custom(v) {
  setPick({ candy: null, hex: v.toUpperCase() });
  render();
}
$("#tb-hex").addEventListener("input", (e) => {
  let v = e.target.value.trim();
  if (!v.startsWith("#")) v = `#${v}`;
  const wrap = e.target.closest(".pp-input");
  if (!valid(v)) { wrap.dataset.tone = "danger"; e.target.setAttribute("aria-invalid", "true"); return; }
  delete wrap.dataset.tone;
  e.target.removeAttribute("aria-invalid");
  custom(v);
});
$(".tb-picker").addEventListener("input", (e) => custom(e.target.value));
$(".tb-exact").addEventListener("change", (e) => {
  for (const s of state.all ? SCHEMES : [state.scheme]) state.exact[s] = e.target.checked;
  state.override = false;
  render();
});
$(".tb-override").addEventListener("change", (e) => { state.override = e.target.checked; render(); });
$(".tb-reset").addEventListener("click", () => {
  state.pick = defaults();
  state.exact = {};
  state.override = false;
  state.all = false;
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
      : `Downloaded ${esc(b.dataset.file)}. With the four JSON files beside <code class="docs-inline-code">node_modules</code>, check and build them: <code class="docs-inline-code">npx blip-tokens my-theme.resolver.json</code>.`;
  });
}
// Copy is the site's own button; while the export is held back it copies nothing.
for (const b of $$(".tb-out-actions .docs-copy")) b.addEventListener("click", (e) => { if (b.getAttribute("aria-disabled") === "true") e.stopImmediatePropagation(); }, { capture: true });
render();
