/**
 * The box's states, measured in Chromium in Day, Sunset and Night: the disabled dither keeps the label readable,
 * soft and candy boxes give what sits on them the light roles, on reads without colour (a second cue), and on and
 * busy survive Windows high contrast. On paper, every scheme prints in Day's colours and boxes print as they look.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright";
import { boxAssets, boxPage, contrast, launch, type BoxAssets } from "./box-page.ts";

const SCHEMES = ["day", "sunset", "night"];
let browser: Browser;
let assets: BoxAssets;
beforeAll(async () => {
  assets = boxAssets();
  browser = await launch();
}, 60_000);
afterAll(() => browser?.close());

/** A colour as rgb(): computed colours are already; custom properties hold the token's hex. */
const rgb = (c: string) => {
  const h = c.trim();
  if (!h.startsWith("#")) return h;
  return `rgb(${[1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(", ")})`;
};
const prop = (page: Page, selector: string, name: string, pseudo?: string) => page.$eval(selector, (e, [n, p]) => getComputedStyle(e, p).getPropertyValue(n!).trim(), [name, pseudo ?? null] as const);
const luminance = (c: string) => contrast(rgb(c), "rgb(0, 0, 0)") * 0.05 - 0.05;

describe("box: disabled", () => {
  const tones = ["", 'data-tone="danger"', 'data-tone="success"', 'data-variant="soft"', 'data-variant="soft" data-tone="info"', 'data-tone="neutral"', 'data-tone="slate"', 'data-tone="purple"', 'data-variant="outline"', 'data-variant="outline" aria-pressed="true"', 'data-variant="ghost" aria-pressed="true"', 'aria-pressed="true"'];
  const body = tones.map((t, i) => `<button class="pp-box pp-button" ${t} id="d${i}" disabled>Save</button>`).join("");

  it.each(SCHEMES)("%s: the dither under every disabled candy keeps its label at 4.5:1", async (scheme) => {
    const page = await boxPage(browser, assets, { body, components: ["button"], scheme });
    for (let i = 0; i < tones.length; i++) {
      const dither = rgb(await prop(page, `#d${i}`, "--pp-box-dither"));
      const label = await page.$eval(`#d${i}`, (e) => getComputedStyle(e).color);
      expect(contrast(label, dither), `${scheme} ${tones[i] || "accent"}: label ${label} on dither ${dither}`).toBeGreaterThanOrEqual(4.5);
    }
    await page.context().close();
  });

  it("is light at Night (Starlight), not the page", async () => {
    const page = await boxPage(browser, assets, { body, components: ["button"], scheme: "night" });
    expect(luminance(await prop(page, "#d0", "--pp-box-dither"))).toBeGreaterThan(0.5);
    expect(rgb(await prop(page, "#d0", "--pp-box-dither"))).not.toBe(rgb(await prop(page, "html", "--pp-bg")));
    await page.context().close();
  });
});

describe("box: soft and candy boxes are light inside", () => {
  // A container holding a link, a field, an outline button (at rest and hovered) and a ghost button (hovered).
  const holds = (k: string) => `<p>Read the <a id="${k}-a" href="#guide">guide</a>.</p>
    <span class="pp-box pp-input" id="${k}-in"><input id="${k}-i" value="Typed" aria-label="Name"></span>
    <button class="pp-box pp-button" data-variant="outline" id="${k}-o">Details</button>
    <button class="pp-box pp-button" data-variant="outline" data-pp-state="hover" id="${k}-oh">Details</button>
    <button class="pp-box pp-button" data-variant="ghost" id="${k}-g">Skip</button>
    <button class="pp-box pp-button" data-variant="ghost" data-pp-state="hover" id="${k}-gh">Skip</button>
    <span class="pp-muted" id="${k}-m">Muted</span>`;
  const containers = {
    "soft card": `<article class="pp-box pp-card" data-variant="soft" id="soft">${holds("soft")}</article>`,
    "candy card": `<article class="pp-box pp-card" data-variant="candy" data-tone="teal" id="candy">${holds("candy")}</article>`,
    "slate card": `<article class="pp-box pp-card" data-variant="soft" data-tone="slate" id="slate">${holds("slate")}</article>`,
    "soft list": `<ul class="pp-box pp-list" data-variant="soft" role="list" id="list"><li class="pp-list-item">${holds("list")}</li></ul>`,
    "soft window": `<section class="pp-box pp-window" data-variant="soft" aria-label="W" id="win"><div class="pp-window-body">${holds("win")}</div></section>`,
    "soft stat": `<div class="pp-box pp-stat" data-variant="soft" data-tone="pink" id="stat">${holds("stat")}</div>`,
    "alert (soft by default)": `<div class="pp-box pp-alert" data-tone="success" id="alert"><div class="pp-alert-body">${holds("alert")}</div></div>`,
    "candy alert": `<div class="pp-box pp-alert" data-variant="candy" data-tone="danger" id="calert"><div class="pp-alert-body">${holds("calert")}</div></div>`,
  };
  const ids: Record<string, string> = { "soft card": "soft", "candy card": "candy", "slate card": "slate", "soft list": "list", "soft window": "win", "soft stat": "stat", "alert (soft by default)": "alert", "candy alert": "calert" };
  const body = Object.values(containers).join("");

  it.each(SCHEMES)("%s: links, fields and calm buttons read on every soft and candy container", async (scheme) => {
    const page = await boxPage(browser, assets, { body, components: ["button", "card", "list", "window", "stat", "alert", "input"], scheme });
    for (const [name, k] of Object.entries(ids)) {
      const fill = rgb(await prop(page, `#${k}`, "--pp-box-fill"));
      const color = (sel: string) => page.$eval(sel, (e) => getComputedStyle(e).color);
      const at = `${scheme} ${name}`;
      expect(contrast(await color(`#${k}-a`), fill), `${at}: link`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(await color(`#${k}-m`), fill), `${at}: muted text`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(await color(`#${k}-i`), rgb(await prop(page, `#${k}-in`, "--pp-box-fill"))), `${at}: text in the field`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(rgb(await prop(page, `#${k}-in`, "--pp-box-outline")), fill), `${at}: the field's outline`).toBeGreaterThanOrEqual(3);
      for (const b of ["o", "oh", "gh"]) expect(contrast(await color(`#${k}-${b}`), rgb(await prop(page, `#${k}-${b}`, "--pp-box-fill"))), `${at}: button ${b}`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(rgb(await prop(page, `#${k}-o`, "--pp-box-outline")), fill), `${at}: the outline button's outline`).toBeGreaterThanOrEqual(3);
      expect(contrast(await color(`#${k}-g`), fill), `${at}: ghost button`).toBeGreaterThanOrEqual(4.5);
    }
    await page.context().close();
  });

  it("not while the box itself is disabled: its dither still shows what is behind it", async () => {
    const page = await boxPage(browser, assets, { body: '<button class="pp-box pp-button" data-variant="soft" id="b" disabled>Save</button>', components: ["button"], scheme: "night" });
    expect(rgb(await prop(page, "#b", "--pp-box-dither"))).toBe(rgb(await prop(page, "html", "--pp-disabled-dither")));
    await page.context().close();
  });
});

describe("box: on reads without colour", () => {
  const body = `<button class="pp-box pp-button" aria-pressed="true" id="on">On</button>
    <button class="pp-box pp-button" aria-pressed="false" id="off">Off</button>
    <button class="pp-box pp-button" data-variant="soft" aria-pressed="true" id="soft">On</button>
    <button class="pp-box pp-button" data-variant="outline" aria-pressed="true" id="outline">On</button>
    <button class="pp-box pp-tab" role="tab" aria-selected="true" id="tab">Tab</button>
    <label class="pp-check"><span class="pp-box pp-checkbox" id="check"><input type="checkbox" checked></span>Music</label>
    <button class="pp-box pp-button" aria-pressed="true" id="outer"><span class="pp-box pp-badge" id="inner">3</span></button>`;

  it("candy and soft boxes that are on sink their face a pixel inside the outline; others keep theirs", async () => {
    const page = await boxPage(browser, assets, { body, components: ["button", "tabs", "checkbox", "badge"], scheme: "day" });
    const inset = async (sel: string) => [await prop(page, sel, "top", "::after"), await prop(page, sel, "left", "::after")].join(" ");
    for (const sel of ["#on", "#soft", "#tab", "#outer"]) expect(await inset(sel), sel).toBe("2px 2px");
    for (const sel of ["#off", "#outline", "#check", "#inner"]) expect(await inset(sel), sel).toBe("0px 0px");
    await page.context().close();
  });
});

describe("box: more contrast", () => {
  it("draws the focus ring's ink edge two pixels wide, and fills a disabled ghost so only its outline is line", async () => {
    const body = `<button class="pp-box pp-button" data-pp-state="focus" id="f">Save</button>
      <button class="pp-box pp-button" data-variant="ghost" disabled id="g">Skip</button>`;
    const page = await boxPage(browser, assets, { body, components: ["button"], scheme: "day" });
    const shadows = async () => (await prop(page, "#f", "filter")).match(/drop-shadow/g)?.length;
    expect(await shadows()).toBe(8);
    await page.emulateMedia({ contrast: "more" });
    expect(await shadows()).toBe(12);
    expect(rgb(await prop(page, "#g", "--pp-box-fill"))).toBe(rgb(await prop(page, "html", "--pp-surface")));
    await page.context().close();
  });
});

describe("box: Windows high contrast", () => {
  const body = `<button class="pp-box pp-button" aria-pressed="true" id="on">On</button>
    <button class="pp-box pp-button" aria-pressed="false" id="off">Off</button>
    <button class="pp-box pp-tab" role="tab" aria-selected="true" id="tab">Tab</button>
    <a class="pp-box pp-button" data-variant="ghost" href="#p" aria-current="page" id="current">Page</a>
    <button class="pp-box pp-button" aria-pressed="true" disabled id="off-on">On</button>
    <button class="pp-box pp-button" aria-busy="true" id="busy">Saving</button>
    <span id="hl" style="forced-color-adjust:none;background:Highlight;color:HighlightText">x</span>`;

  it.each(["dark", "light"] as const)("%s theme: on, selected and current are the highlight; busy shows its dots", async (colorScheme) => {
    const page = await boxPage(browser, assets, { body, components: ["button", "tabs"], context: { forcedColors: "active", colorScheme } });
    const bg = (sel: string) => page.$eval(sel, (e) => getComputedStyle(e).backgroundColor);
    const highlight = await bg("#hl");
    for (const sel of ["#on", "#tab", "#current"]) expect(await bg(sel), sel).toBe(highlight);
    expect(await bg("#off")).not.toBe(highlight);
    expect(await bg("#off-on"), "on, disabled").not.toBe(await bg("#off"));
    expect(await prop(page, "#busy", "display", "::after")).toBe("block");
    expect(await page.$eval("#busy", (e) => getComputedStyle(e).color)).toBe("rgba(0, 0, 0, 0)");
    await page.context().close();
  });
});

describe("box: paper", () => {
  it("prints Day's colours whatever the scheme, boxes exactly as they look, and no scrim", async () => {
    const page = await boxPage(browser, assets, {
      body: `<section data-pp-scheme="night" id="s"><button class="pp-box pp-button" id="b">Save</button></section><dialog class="pp-box pp-dialog" id="d">Saved</dialog>`,
      components: ["button", "dialog"],
      scheme: "night",
    });
    await page.$eval("#d", (d) => (d as HTMLDialogElement).showModal());
    await page.emulateMedia({ media: "print" });
    const day = await boxPage(browser, assets, { body: "", scheme: "day" });
    for (const name of ["--pp-bg", "--pp-text", "--pp-surface", "--pp-accent", "--pp-disabled-dither"]) {
      const want = await prop(day, "html", name);
      expect(await prop(page, "html", name), name).toBe(want);
      expect(await prop(page, "#s", name), `${name} in a night section`).toBe(want);
    }
    for (const pseudo of [undefined, "::before", "::after"]) expect(await prop(page, "#b", "print-color-adjust", pseudo), pseudo ?? "box").toBe("exact");
    expect(await prop(page, "#d", "background-image", "::backdrop")).toBe("none");
    await page.emulateMedia({ media: "screen" });
    expect(await prop(page, "html", "--pp-bg")).not.toBe(await prop(day, "html", "--pp-bg"));
    await page.context().close();
    await day.context().close();
  });
});
