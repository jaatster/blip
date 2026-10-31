/**
 * Foundations: the tokens drawn with Blip itself, so every swatch, size and motion follows the toolbar's scheme,
 * pixel and motion switches. Names and values come from @jaatster/blip-tokens.
 */
import type { Meta, StoryObj } from "@storybook/html-vite";
import { schemes, shared, type SchemeName } from "@jaatster/blip-tokens";
import { example } from "../lib/render";

const meta = {
  title: "Foundations",
  tags: ["blip", "foundations"],
  parameters: { a11y: { test: "error" } },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const px = (n: number) => `calc(${n} * var(--pp-pixel))`;
const scheme = (): SchemeName => {
  const s = document.documentElement.dataset.ppScheme;
  return s === "sunset" || s === "night" ? s : "day";
};
const section = (title: string, intro: string, body: string) =>
  `<section style="display:grid;gap:${px(6)};margin-block-end:${px(16)}" aria-label="${title}">
    <h2 class="pp-title">${title}</h2>
    <p class="pp-small pp-muted" style="max-inline-size:${px(300)}">${intro}</p>
    ${body}
  </section>`;
const swatch = (name: string, hex: string) =>
  `<li style="display:grid;grid-template-columns:${px(16)} 1fr;gap:${px(4)};align-items:center">
    <span aria-hidden="true" style="inline-size:${px(16)};block-size:${px(16)};background:var(--pp-${name});box-shadow:0 0 0 var(--pp-pixel) var(--pp-ink)"></span>
    <span class="pp-small"><code>--pp-${name}</code> <span class="pp-muted">${hex}</span></span>
  </li>`;
const list = (items: string[], min = 110) => `<ul role="list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(${px(min)},1fr));gap:${px(4)} ${px(8)}">${items.join("")}</ul>`;

export const Colour: Story = {
  render: () => {
    const roles = schemes[scheme()];
    const group = (prefix: RegExp) => Object.entries(roles).filter(([k]) => prefix.test(k)).map(([k, v]) => swatch(k, v));
    const candies = Object.entries(shared).filter(([k, v]) => /^(ink|ink-soft|white|candy-)/.test(k) && typeof v === "string").map(([k, v]) => swatch(k, String(v)));
    return example(
      section("Page and text", `The ${scheme()} scheme's roles. Every text pair is checked against WCAG 2.2 AA when the tokens build.`, list(group(/^(bg|surface|text|line|outline|drop|scrim|selection)/))) +
        section("Accent and intents", "Candy for what can be acted on: the base, its light and shade bands, a text colour for words on the page, and an on colour for words on the candy.", list(group(/^(accent|info|success|warning|danger|focus|link)/))) +
        section("Candies", "The primitives: ink (never black), white, and ten candies, each with a light and a shade.", list(candies, 120)),
    );
  },
};

export const Type: Story = {
  render: () =>
    example(
      section("Pixel Bop", "Display text, all capitals, at whole scales only: data-scale 1 to 4.", [1, 2, 3, 4].map((s) => `<p class="pp-display" data-scale="${s}">Scale ${s}</p>`).join("") +
        `<p class="pp-display pp-pop" data-scale="3" data-pop="Pop!">Pop!</p>`) +
        section("Pixelify Sans", "UI and body text on a size ramp.", ["title", "lead", "body", "small", "caption", "label"].map((c) => `<p class="pp-${c}">${c[0]!.toUpperCase() + c.slice(1)}: the quick pixel jumps over the lazy grid.</p>`).join("")),
    ),
};

export const SpaceAndShape: Story = {
  name: "Space and shape",
  render: () => {
    const space = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32].map((n) =>
      `<li style="display:flex;gap:${px(6)};align-items:center"><code class="pp-small" style="inline-size:${px(40)}">space-${n}</code><span aria-hidden="true" style="inline-size:${px(n)};block-size:${px(4)};background:var(--pp-accent)"></span><span class="pp-small pp-muted">${n} px, ${n * 2} CSS px at pixel 2</span></li>`);
    const radius = [0, 1, 2, 3, 4, 5, 6].map((r) => `<div class="pp-box" data-variant="soft" data-pp-r="${r}" style="display:grid;place-items:center;inline-size:${px(28)};block-size:${px(20)}"><span class="pp-small">${r}</span></div>`);
    const controls = (["sm", "md", "lg"] as const).map((s) => `<button class="pp-box pp-button" type="button" data-size="${s}">${s}</button>`);
    return example(
      section("Space", "Counted in pixels: 1, 2, 3, 4, 6, 8, 12, 16, 24 and 32.", `<ul role="list" style="display:grid;gap:${px(2)}">${space.join("")}</ul>`) +
        section("Corners", "The candy box's stepped corners, radius 0 to 6 pixels (data-pp-r).", `<div style="display:flex;flex-wrap:wrap;gap:${px(6)}">${radius.join("")}</div>`) +
        section("Controls", "Control heights: 16, 20 and 24 pixels.", `<div style="display:flex;gap:${px(6)};align-items:center">${controls.join("")}</div>`),
    );
  },
};

export const Box: Story = {
  render: () => {
    const tiers = ["candy", "soft", "outline", "ghost"];
    const tones = ["accent", "info", "success", "warning", "danger", "neutral", "teal", "pink", "purple", "slate"];
    const states: [string, string][] = [["Rest", ""], ["Hover", ' data-pp-state="hover"'], ["Focus", ' data-pp-state="focus"'], ["Pressed", ' data-pp-state="active"'], ["On", ' aria-pressed="true"'], ["Disabled", " disabled"], ["Busy", ' aria-busy="true"']];
    return example(
      section("Tiers", "Candy is loud, for the main action; soft, outline and ghost are calmer, for dense UI. Panel is a surface.", `<div style="display:flex;flex-wrap:wrap;gap:${px(6)};align-items:center">${tiers.map((t) => `<button class="pp-box pp-button" type="button" data-variant="${t}">${t}</button>`).join("")}<div class="pp-box" data-variant="panel" style="padding:${px(6)}"><span class="pp-small">panel</span></div></div>`) +
        section("Tones", "Meaning first (accent, info, success, warning, danger, neutral), then any candy.", `<div style="display:flex;flex-wrap:wrap;gap:${px(4)}">${tones.map((t) => `<button class="pp-box pp-button" type="button" data-tone="${t}">${t}</button>`).join("")}</div>`) +
        section("States", "One look per state, for every component: hover lifts, pressed sits in its drop, focus is the yellow ring, disabled is dithered, busy steps three dots.", `<div style="display:flex;flex-wrap:wrap;gap:${px(4)};align-items:center">${states.map(([n, a]) => `<button class="pp-box pp-button" type="button"${a}>${n}</button>`).join("")}</div>`),
    );
  },
};

export const Motion: Story = {
  render: () => {
    const durations = Object.entries(shared).filter(([k]) => /^duration-/.test(k)).map(([k, v]) => `<li class="pp-small"><code>--pp-${k}</code> <span class="pp-muted">${v} ms</span></li>`);
    const demos = [["pp-bob", "Bob"], ["pp-blink", "Blink"], ["pp-bump", "Bump"], ["pp-shake", "Shake"], ["pp-pop-in", "Pop in"]].map(([c, n]) => `<span class="pp-box pp-button ${c}" data-variant="soft" style="pointer-events:none">${n}</span>`);
    return example(
      section("Motion snaps", "Everything moves through 2 to 6 even steps, never along a curve. With reduced motion (the toolbar's Motion switch, or the system setting) every duration is 0 and these stop.", `<div style="display:flex;flex-wrap:wrap;gap:${px(6)}">${demos.join("")}</div>`) +
        section("Durations", "Frame-based tokens.", list(durations, 130)),
    );
  },
};
