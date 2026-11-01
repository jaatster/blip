// The four rules on small stylesheets: what they reject, and what they leave alone.
import { test } from "node:test";
import assert from "node:assert/strict";
import stylelint from "stylelint";
import config from "../index.js";

/** The warnings a stylesheet gets, as "rule: text" lines (the rule name dropped from the text). */
async function lint(code, rules = {}) {
  const { results } = await stylelint.lint({ code, config: { ...config, rules: { ...config.rules, ...rules } } });
  return results[0].warnings.map((w) => `${w.rule}: ${w.text.replace(/ \(blip\/[a-z-]+\)$/, "")}`);
}
const only = (warnings, rule) => warnings.filter((w) => w.startsWith(`blip/${rule}:`));

test("no-raw-color rejects hex, colour functions and named colours", async () => {
  const w = only(await lint(`a { color: #fff; background: rgb(0 0 0); border-color: red; outline-color: oklch(70% 0.1 200); }`), "no-raw-color");
  assert.equal(w.length, 4);
  assert.match(w[0], /Raw colour "#fff"/);
  assert.match(w[1], /"rgb\(\)"/);
  assert.match(w[2], /Named colour "red"/);
});

test("no-raw-color allows tokens, keywords, color-mix of tokens, and names that are not colours", async () => {
  const w = await lint(`a { color: var(--chu-ink); background: transparent; border-color: currentColor; fill: inherit;
    box-shadow: 0 0 0 var(--chu-pixel) color-mix(in srgb, var(--chu-ink) 50%, transparent);
    animation: red 1s steps(2); font-family: Gold; content: "white"; transition: background 0s; }`);
  assert.deepEqual(only(w, "no-raw-color"), []);
});

test("no-raw-color allows system colours only inside forced-colors", async () => {
  const w = only(await lint(`a { color: CanvasText; } @media (forced-colors: active) { a { color: CanvasText; border-color: Highlight; } }`), "no-raw-color");
  assert.equal(w.length, 1);
  assert.match(w[0], /System colour "CanvasText" outside/);
});

test("no-raw-color leaves masks alone, including custom properties that feed one", async () => {
  const w = await lint(`a { mask: linear-gradient(#000 0 0); --_s: linear-gradient(#000 0 0); --_l: var(--_s), url(x.svg); --chu-shape: var(--_l); }
    b { --chu-shape-4: conic-gradient(#000 25%, transparent 0); --_x: linear-gradient(#000 0 0); }`);
  assert.deepEqual(only(w, "no-raw-color"), ['blip/no-raw-color: Raw colour "#000". Use a colour token: var(--chu-ink), var(--chu-surface), var(--chu-candy-blue)…']);
});

test("whole-pixels rejects raw and font-relative lengths and fractions of a pixel", async () => {
  const w = only(
    await lint(`a { padding: 4px; margin: 1px; inline-size: 2rem; gap: calc(1.5 * var(--chu-pixel)); inset: calc(var(--chu-pixel) / 2); }`),
    "whole-pixels",
  );
  assert.equal(w.length, 5);
  assert.match(w[0], /Raw length "4px"/);
  assert.match(w[1], /"1px" is for system borders/);
  assert.match(w[2], /Font-relative length "2rem"/);
  assert.match(w[3], /fraction of a pixel: "1.5 \* var\(--chu-pixel\)"/);
  assert.match(w[4], /fraction of a pixel: "var\(--chu-pixel\) \/ 2"/);
});

test("whole-pixels allows pixels, tokens, zero, relative layout units, text measures and forced-colors hairlines", async () => {
  const w = await lint(`a { padding: calc(4 * var(--chu-pixel)) var(--chu-space-4); margin: 0 0px; inline-size: calc(100% - var(--_p));
    max-inline-size: 60ch; block-size: 2lh; min-block-size: 50vh; grid-template-columns: 1fr 2fr; translate: calc(-1 * var(--_p)) 0; }
    @media (forced-colors: active) { a { border: 1px solid CanvasText; outline-offset: -1px; } }
    @container (min-width: 600px) { a { padding: var(--chu-space-8); } }`);
  assert.deepEqual(only(w, "whole-pixels"), []);
});

test("whole-pixels takes an allow list for documented exceptions", async () => {
  const w = await lint(`a { letter-spacing: 0.5px; }`, { "blip/whole-pixels": [true, { allow: ["0.5px"] }] });
  assert.deepEqual(only(w, "whole-pixels"), []);
});

test("stepped-motion rejects easing curves, and shorthands that ease by default", async () => {
  const w = only(
    await lint(`a { transition: opacity var(--chu-duration-fade) ease-in; animation-timing-function: cubic-bezier(0, 0, 1, 1); }
      b { transition: transform 160ms; } c { animation: spin 1s linear infinite; }`),
    "stepped-motion",
  );
  assert.equal(w.length, 4);
  assert.match(w[0], /Easing curve "ease-in"/);
  assert.match(w[1], /Easing curve "cubic-bezier\(0, 0, 1, 1\)"/);
  assert.match(w[2], /no timing function, so it eases/);
  assert.match(w[3], /Easing curve "linear"/);
});

test("stepped-motion allows steps, step-end, the ease tokens, none, zero durations and later longhands", async () => {
  const w = await lint(`a { transition: translate var(--chu-duration-slide) var(--chu-ease-2), opacity 0s; animation: pop calc(2 * var(--chu-duration-frame)) steps(1, jump-end) both; }
    b { animation: none; transition: none; } c { transition: color 0s 600000s; }
    d { transition: opacity 160ms; transition-timing-function: steps(4, jump-end); }
    e { animation: var(--my-animation); } @keyframes k { 50% { animation-timing-function: step-end; } }`);
  assert.deepEqual(only(w, "stepped-motion"), []);
});

test("known-tokens rejects unknown --chu-* names and suggests the nearest", async () => {
  const w = only(await lint(`a { gap: var(--chu-space-5); color: var(--chu-candy-yelow); }`), "known-tokens");
  assert.equal(w.length, 2);
  assert.match(w[0], /Unknown token "--chu-space-5". Did you mean "--chu-space-4" or "--chu-space-6"/);
  assert.match(w[1], /Did you mean "--chu-candy-yellow"/);
});

test("known-tokens allows tokens, public properties, local declarations, private names and the allow list", async () => {
  const w = await lint(
    `a { color: var(--chu-ink); gap: var(--chu-stack-gap, var(--chu-space-8)); --chu-mine: 1; padding: var(--chu-mine); margin: var(--_x); inset: var(--chu-app-x); }`,
    { "blip/known-tokens": [true, { allow: ["/^--chu-app-/"] }] },
  );
  assert.deepEqual(only(w, "known-tokens"), []);
});
