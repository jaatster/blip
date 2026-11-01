/**
 * @jaatster/blip-core's base styles in Chromium: text follows a larger default text size set in the browser (as Chrome's
 * font settings do) and stays on whole pixels at the default; prefers-contrast: more strengthens what is soft;
 * ligatures are off whatever the font; long words hyphenate or break in titles and reading text; and layers.css puts
 * Blip between Tailwind's base and its utilities, in either import order.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright";
import { STYLES, assets, launch, open, type Assets } from "./base-page.ts";

let browser: Browser;
let a: Assets;
beforeAll(async () => {
  [a, browser] = await Promise.all([assets(), launch()]);
}, 60_000);
afterAll(() => browser?.close());

/** Opens a Blip page with the browser's default text size set to px, as chrome://settings/fonts does. */
const sized = (px: number, body = "") =>
  open(browser, a, {
    head: STYLES,
    body,
    before: async (page) => {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Page.enable");
      await cdp.send("Page.setFontSizes", { fontSizes: { standard: px, fixed: Math.round((px * 13) / 16) } });
    },
  });
const SIZES = ["caption", "small", "body", "lead", "title"];
/** The page's text size and each --pp-size-* in CSS px. */
const measure = (page: Page) =>
  page.evaluate((sizes) => {
    const probe = document.body.appendChild(document.createElement("span"));
    const px = (v: string) => ((probe.style.fontSize = v), parseFloat(getComputedStyle(probe).fontSize));
    const out = { html: parseFloat(getComputedStyle(document.documentElement).fontSize), ...Object.fromEntries(sizes.map((s) => [s, px(`var(--pp-size-${s})`)])) };
    probe.remove();
    return out;
  }, SIZES);

describe("text size", () => {
  it("is Blip's own, on whole pixels, at the browser's default", async () => {
    const page = await sized(16);
    expect(await measure(page)).toEqual({ html: 16, caption: 12, small: 14, body: 16, lead: 18, title: 22 });
    await page.context().close();
  });

  it.each([
    [20, { html: 20, caption: 15, small: 17.5, body: 20, lead: 22.5, title: 27.5 }],
    [24, { html: 24, caption: 18, small: 21, body: 24, lead: 27, title: 33 }],
  ])("follows a larger default of %i px, every size in step", async (px, want) => {
    const page = await sized(px);
    expect(await measure(page)).toEqual(want);
    await page.context().close();
  });

  it("never goes below Blip's own sizes", async () => {
    const page = await sized(12);
    expect(await measure(page)).toEqual({ html: 16, caption: 12, small: 14, body: 16, lead: 18, title: 22 });
    await page.context().close();
  });

  it("leaves the pixel and everything counted in it alone", async () => {
    const page = await sized(24, '<div style="block-size: var(--pp-control-md); inline-size: var(--pp-space-8)"></div>');
    expect(await page.evaluate(() => [getComputedStyle(document.querySelector("div")!).blockSize, getComputedStyle(document.querySelector("div")!).inlineSize])).toEqual(["40px", "16px"]);
    await page.context().close();
  });
});

describe("prefers-contrast: more", () => {
  const body = `<p class="pp-muted">Best time 1:42</p><hr><a href="#x" id="link">Rules</a>
    <section data-pp-scheme="night"><p class="pp-muted">At night</p><hr></section>`;
  const read = (page: Page) =>
    page.evaluate(() => {
      const css = (el: Element, p: string) => getComputedStyle(el).getPropertyValue(p).trim();
      const [day, night] = [document.documentElement, document.querySelector("section")!];
      const link = document.getElementById("link")!;
      link.focus({ focusVisible: true } as FocusOptions);
      return {
        day: [css(day, "--pp-text-muted"), css(day, "--pp-text"), css(day, "--pp-line-soft"), css(day, "--pp-line")],
        night: [css(night, "--pp-text-muted"), css(night, "--pp-text"), css(night, "--pp-line-soft"), css(night, "--pp-line")],
        muted: [getComputedStyle(document.querySelector(".pp-muted")!).color, getComputedStyle(night.querySelector(".pp-muted")!).color],
        rule: [getComputedStyle(document.querySelector("hr")!).backgroundColor, getComputedStyle(night.querySelector("hr")!).backgroundColor],
        ring: getComputedStyle(link).boxShadow,
      };
    });

  it("gives muted text the text colour, soft lines the line colour, and the focus ring a thicker ink edge, in every scheme", async () => {
    const page = await open(browser, a, { head: STYLES, body, context: { contrast: "more" } });
    const more = await read(page);
    expect(more.day[0]).toBe(more.day[1]);
    expect(more.day[2]).toBe(more.day[3]);
    expect(more.night[0]).toBe(more.night[1]);
    expect(more.night[2]).toBe(more.night[3]);
    expect(more.ring).toMatch(/ 0px 0px 6px$/);
    // ... and it shows: the same page without the preference draws them softer.
    const plain = await open(browser, a, { head: STYLES, body });
    const less = await read(plain);
    expect(less.day[0]).not.toBe(less.day[1]);
    expect(less.night[2]).not.toBe(less.night[3]);
    expect(less.ring).toMatch(/ 0px 0px 4px$/);
    expect(more.muted).not.toEqual(less.muted);
    expect(more.rule).not.toEqual(less.rule);
    const shot = (p: Page) => p.screenshot({ clip: { x: 0, y: 0, width: 400, height: 200 } });
    expect(Buffer.compare(await shot(page), await shot(plain))).not.toBe(0);
    await page.context().close();
    await plain.context().close();
  });
});

describe("ligatures", () => {
  it("are off for every piece of text, form controls included, whatever the font", async () => {
    const page = await open(browser, a, {
      head: STYLES,
      body: '<p>first file field</p><button>Fill in</button><input value="final"><p class="pp-display">fi</p><code>fi</code>',
    });
    const r = await page.evaluate(() => {
      const all = ["html", "p", "button", "input", ".pp-display", "code"].map((s) => getComputedStyle(document.querySelector(s)!).fontVariantLigatures);
      // The width of "fi" as the page sets it, and with ligatures forced off: the same, in Pixelify Sans and a serif.
      const width = (family: string, ligatures?: string) => {
        const s = document.body.appendChild(Object.assign(document.createElement("span"), { textContent: "fi fl ffi ff" }));
        s.style.fontFamily = family;
        s.style.fontKerning = "none";
        if (ligatures) s.style.fontVariantLigatures = ligatures;
        const w = s.getBoundingClientRect().width;
        s.remove();
        return w;
      };
      return { all, widths: ["Pixelify Sans", "serif"].map((f) => [width(f), width(f, "none")]) };
    });
    expect(r.all.every((v) => v === "no-common-ligatures")).toBe(true);
    for (const [page_, off] of r.widths) expect(page_).toBe(off);
    await page.context().close();
  });
});

describe("long words", () => {
  it("hyphenate or break in titles and reading text instead of running out of their box", async () => {
    const word = "Datenschutzeinstellungen";
    const tags = ["h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "dt", "dd", "blockquote", "figcaption"];
    const page = await open(browser, a, {
      html: 'lang="de"',
      head: STYLES,
      body: `<div style="inline-size: 120px">${tags.map((t) => (t === "li" ? `<ul><li>${word}</li></ul>` : t === "dt" || t === "dd" ? `<dl><${t}>${word}</${t}></dl>` : `<${t}>${word}</${t}>`)).join("")}
        <div class="pp-title">${word}</div><span class="pp-lead" style="display:block">${word}</span><span class="pp-body" style="display:block">${word}</span></div>`,
    });
    const r = await page.evaluate((tags) => [...tags, ".pp-title", ".pp-lead", ".pp-body"].map((t) => {
      const e = document.querySelector<HTMLElement>(t)!, cs = getComputedStyle(e);
      return [t, cs.hyphens, cs.overflowWrap, e.scrollWidth <= e.clientWidth];
    }), tags);
    // Hyphenated where the lang has a dictionary; otherwise broken anywhere (as all text may be), never run out of the box.
    for (const [t, hyphens, wrap, fits] of r) expect([t, hyphens, wrap, fits]).toEqual([t, "auto", "anywhere", true]);
    await page.context().close();
  });
});

describe("layers.css", () => {
  // Tailwind CSS v4's shape, cut down: its layer order (properties first, its fallbacks for browsers without
  // @property), preflight in base, utilities in utilities.
  const tailwind = `@layer properties;
    @layer theme, base, components, utilities;
    @layer properties { *, ::after, ::before { --tw-font-weight: initial; } }
    @layer theme { :root { --spacing: 0.25rem; --color-red-600: rgb(231, 0, 11); } }
    @layer base { *, ::after, ::before { box-sizing: border-box; margin: 0; padding: 0; border: 0 solid; } a { color: inherit; text-decoration: inherit; } button { background-color: transparent; font: inherit; } }
    @layer utilities { .px-12 { padding-inline: calc(var(--spacing) * 12); } .text-red-600 { color: var(--color-red-600); } .no-underline { text-decoration-line: none; } .font-bold { --tw-font-weight: 700; font-weight: 700; } }`;
  // A component of Blip's own, the way the components package layers its rules.
  const component = "@layer pp.components { .pp-thing { padding-inline: 16px; color: var(--pp-accent-text); } }";
  const body = '<button class="pp-box pp-thing" id="plain">Save</button><button class="pp-box pp-thing px-12 text-red-600" id="utility">Save</button><a href="#x" id="link">Rules</a><a href="#x" id="red" class="text-red-600 no-underline font-bold">Rules</a>';
  const sheets = (order: string[]) => order.map((href) => `<link rel="stylesheet" href="${href}">`).join("");
  const read = (page: Page) =>
    page.evaluate(() => {
      const cs = (id: string) => getComputedStyle(document.getElementById(id)!);
      return {
        plain: [cs("plain").paddingInlineStart, cs("plain").color],
        utility: [cs("utility").paddingInlineStart, cs("utility").color],
        link: [cs("link").color, cs("link").textDecorationLine],
        red: [cs("red").color, cs("red").textDecorationLine, cs("red").getPropertyValue("--tw-font-weight")],
        box: getComputedStyle(document.getElementById("plain")!, "::before").maskImage !== "none",
      };
    });

  it.each([
    ["Tailwind first", ["/layers.css", "/tailwind.css", "/packages/font/font.css", "/tokens.css", "/core.css", "/component.css"]],
    ["Blip first", ["/layers.css", "/packages/font/font.css", "/tokens.css", "/core.css", "/component.css", "/tailwind.css"]],
  ])("lets utilities win and keeps the components' look, %s", async (_, order) => {
    const page = await open(browser, a, { head: sheets(order), body, routes: { "/tailwind.css": tailwind, "/component.css": component } });
    const r = await read(page);
    expect(r.plain[0]).toBe("16px");
    expect(r.utility).toEqual(["48px", "rgb(231, 0, 11)"]);
    // Tailwind's own order holds too: its properties fallbacks stay under the utilities.
    expect(r.red).toEqual(["rgb(231, 0, 11)", "none", "700"]);
    // Preflight does not undo Blip's base: links keep their colour and underline; the box keeps its outline.
    expect(r.link[1]).toBe("underline");
    expect(r.link[0]).not.toBe("rgb(0, 0, 0)");
    expect(r.box).toBe(true);
    await page.context().close();
  });

  it("is what makes the difference: without it, Tailwind first, Blip beats the utilities", async () => {
    const page = await open(browser, a, { head: sheets(["/tailwind.css", "/packages/font/font.css", "/tokens.css", "/core.css", "/component.css"]), body, routes: { "/tailwind.css": tailwind, "/component.css": component } });
    expect((await read(page)).utility[0]).toBe("16px");
    await page.context().close();
  });
});
