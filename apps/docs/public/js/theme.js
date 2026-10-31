// Theme builder: an accent per scheme, worked out the candies' way, checked against AA, and exported.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const data = JSON.parse($("#tb-data").textContent);
const SCHEMES = ["day", "sunset", "night"];
const KEY = "blip-docs:theme";

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
function lum(h) {
  const [r, g, b] = rgb(h).map((c) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const worst = (c, list) => Math.min(...list.map((b) => contrast(c, b)));
const valid = (h) => /^#[0-9a-f]{6}$/i.test(h);

/** An accent for a scheme: light and shade from the base (unless a candy gives its own), then text and label. */
function derive(scheme, base, candy) {
  const sc = data.schemes[scheme];
  const [h, s, v] = hsv(base);
  const light = candy ? data.candies[candy].light : fromHsv(h, s * 0.65, 1);
  const shade = candy ? data.candies[candy].shade : fromHsv(h, s, v * 0.84);
  // The label: ink if it reads on both the candy and its soft light, else whichever reads better.
  const on = worst(data.ink, [base, light]) >= 4.5 ? data.ink : worst(data.white, [base, light]) > worst(data.ink, [base, light]) ? data.white : data.ink;
  // Text on the scheme's surfaces: the default's own when it is the default candy, else the base darkened (or, at
  // night, lightened) a step at a time until it passes AA on the page and both surfaces.
  let text = base;
  const surfaces = [sc.bg, sc.surface, sc.raised];
  if (candy && candy === sc.accent.candy) text = sc.accent.text;
  else if (!sc.dark) {
    for (let k = v; k >= 0; k -= 0.01) { text = fromHsv(h, s, k); if (worst(text, surfaces) >= 4.5) break; }
  } else {
    let found = false;
    for (let k = v; k <= 1.0001 && !found; k += 0.01) { text = fromHsv(h, s, Math.min(1, k)); found = worst(text, surfaces) >= 4.5; }
    for (let k = s; k >= 0 && !found; k -= 0.01) { text = fromHsv(h, k, 1); found = worst(text, surfaces) >= 4.5; }
  }
  return { candy: candy ?? null, base: base.toUpperCase(), light, shade, text, on };
}
const defaults = () => Object.fromEntries(SCHEMES.map((s) => [s, { ...data.schemes[s].accent }]));

// ------------------------------------------------------------------ state

let state;
try { state = JSON.parse(localStorage.getItem(KEY)); } catch { /* none yet */ }
if (!state?.accent?.day) state = { scheme: SCHEMES.includes(document.documentElement.dataset.ppScheme) ? document.documentElement.dataset.ppScheme : "day", pixel: "2", accent: defaults() };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode */ } };

// ------------------------------------------------------------------ output

const vars = (a) => ({ "--pp-accent": a.base, "--pp-accent-light": a.light, "--pp-accent-shade": a.shade, "--pp-accent-text": a.text, "--pp-accent-on": a.on, "--pp-selection-bg": a.light });
const comp = (h) => rgb(h).map((c) => Math.round((c / 255) * 1000) / 1000);
const color = (h) => ({ $value: { colorSpace: "srgb", components: comp(h), hex: h } });

function css() {
  const block = (sel, a, pad = "  ") => `${pad}${sel} {\n${Object.entries(vars(a)).map(([k, v]) => `${pad}  ${k}: ${v};`).join("\n")}\n${pad}}`;
  const out = [
    "/* My Blip theme. Load it after @jaatster/blip-tokens/tokens.css. */",
    "@layer pp.tokens {",
    block(':root, [data-pp-scheme="day"]', state.accent.day),
    block('[data-pp-scheme="sunset"]', state.accent.sunset),
    block('[data-pp-scheme="night"]', state.accent.night),
    "  @media (prefers-color-scheme: dark) {",
    block(":root:not([data-pp-scheme])", state.accent.night, "    "),
    "  }",
  ];
  if (state.pixel !== "2") out.push(`  :root { --pp-pixel: ${state.pixel}px; }`);
  out.push("}");
  return out.join("\n") + "\n";
}
function tokensFile(scheme) {
  const a = state.accent[scheme];
  return JSON.stringify({
    $schema: "https://www.designtokens.org/schemas/2025.10/format.json",
    $description: `My theme: the ${data.schemes[scheme].title} accent${a.candy ? ` (${a.candy})` : ""}. Add after Blip's own ${scheme} file in the resolver.`,
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
function setVars(el, a) { for (const [k, v] of Object.entries(vars(a))) el.style.setProperty(k, v); }
function render() {
  const s = state.scheme, a = state.accent[s], sc = data.schemes[s];
  preview.dataset.ppScheme = s;
  if (state.pixel === "2") delete preview.dataset.ppPixel;
  else preview.dataset.ppPixel = state.pixel;
  setVars(preview, a);
  for (const cell of $$("[data-strip]")) setVars(cell, state.accent[cell.dataset.strip]);
  const box = $(".tb-derived-box");
  setVars(box, a);
  for (const k of ["light", "base", "shade", "text", "on"]) {
    $(`[data-v="${k}"]`).textContent = a[k];
    $(`.tb-dot[data-k="${k}"]`).style.background = a[k];
  }
  $(".tb-scheme-name").textContent = sc.title;
  for (const r of $$('input[name="tb-candy"]')) r.checked = r.value === a.candy;
  const input = $("#tb-hex");
  if (document.activeElement !== input) input.value = a.base;
  $(".tb-picker").value = a.base.toLowerCase();
  const checks = [
    ["Label on the candy", a.on, a.base],
    ["Label on the soft light", a.on, a.light],
    ["Accent text on the page", a.text, sc.bg],
    ["Accent text on a surface", a.text, sc.surface],
    ["Accent text on a raised surface", a.text, sc.raised],
    ["Selected text", data.ink, a.light],
  ];
  $(".tb-checks").innerHTML = checks.map(([label, fg, bg]) => {
    const r = contrast(fg, bg), ok = r >= 4.5;
    return `<li data-pass="${ok}"><span class="tb-check-sample" style="color:${fg};background:${bg}">Aa</span><span>${label}</span><span class="docs-num">${r.toFixed(2)}:1</span><span class="pp-box pp-tag" data-size="sm" data-tone="${ok ? "success" : "danger"}">${ok ? "Pass" : "Fail"}</span></li>`;
  }).join("");
  $("#tb-out-css").textContent = css();
  for (const sch of SCHEMES) $(`#tb-out-${sch}`).textContent = tokensFile(sch);
  $("#tb-out-resolver").textContent = resolver();
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
for (const r of $$('input[name="tb-candy"]')) {
  r.addEventListener("change", () => {
    const c = data.candies[r.value];
    state.accent[state.scheme] = derive(state.scheme, c.base, r.value);
    render();
  });
}
$("#tb-hex").addEventListener("input", (e) => {
  let v = e.target.value.trim();
  if (!v.startsWith("#")) v = `#${v}`;
  const wrap = e.target.closest(".pp-input");
  if (!valid(v)) { wrap.dataset.tone = "danger"; e.target.setAttribute("aria-invalid", "true"); return; }
  delete wrap.dataset.tone;
  e.target.removeAttribute("aria-invalid");
  state.accent[state.scheme] = derive(state.scheme, v.toUpperCase(), null);
  render();
});
$(".tb-picker").addEventListener("input", (e) => {
  state.accent[state.scheme] = derive(state.scheme, e.target.value.toUpperCase(), null);
  render();
});
$(".tb-reset").addEventListener("click", () => { state.accent = defaults(); render(); });
for (const b of $$(".tb-download")) {
  b.addEventListener("click", () => {
    const text = $(b.dataset.from).textContent;
    const url = URL.createObjectURL(new Blob([text], { type: b.dataset.file.endsWith(".css") ? "text/css" : "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: b.dataset.file });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}
render();
