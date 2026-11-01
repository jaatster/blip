/**
 * Lane 4, right to left. Every example with dir="rtl" and lang="ar" on <html> (set before the example's elements
 * connect), 1280 wide, and 390 wide for the ones that change on a phone:
 *   - nothing overflows the page sideways (scrollWidth, and no element past either edge outside a scroller);
 *   - every part-full progress bar, meter, rating and slider fills from the right: its filled colour on the right and
 *     its empty colour on the left, the mirror of the same element switched back to left to right;
 *   - a drawer's end side is the left edge and its start side the right edge (live ones opened with showModal(),
 *     static ones at the matching side of their screen);
 *   - every directional glyph the docs place at a start or an end turns round: its pixels right to left are the
 *     mirror of its pixels left to right (the glyph alone, cropped to its ink);
 *   - the layout mirrors: every block, flex or grid box sits at the mirror of its left-to-right place in its parent,
 *     within two pixels (a candy box keeps a pixel or two on its right for its drop, which falls down and right in
 *     every direction). Boxes in a line of text are left out (bidi orders them), and so are the physical sides an
 *     API names (a tooltip's or a popover's data-side="left|right", the nubs that point at a trigger) and what an
 *     example places with inline styles.
 */
import { test, type Page } from "@playwright/test";
import { examples, id, RESPONSIVE } from "../page/manifest.js";
import { expectNone, triage } from "./lib/known.js";
import { open, settle } from "./lib/open.js";
import { at, decode, distance, hex, mode, type Image } from "./lib/png.js";

/**
 * The glyphs that point along the line, so turn round right to left: where they are, and the doc line that says
 * which way they point (start or end of the text) or that they turn. A new directional glyph belongs here.
 */
const GLYPHS: { name: string; host: string; pseudo: "::before" | "::after" | "::before,::after" | ""; doc: string; setup?: (page: Page) => Promise<void> }[] = [
  { name: "breadcrumbs chevron", host: ".chu-breadcrumbs-list > li:nth-child(2)", pseudo: "::before", doc: "components/docs/breadcrumbs.md:75 'Right to left, the chevrons turn round.' (and the header of breadcrumbs.css)" },
  { name: "pagination previous chevron", host: ".chu-pagination-prev > span", pseudo: "::before", doc: "components/docs/pagination.md:36 'Previous and next: … boxes with a pixel chevron'" },
  { name: "pagination next chevron", host: ".chu-pagination-next > span", pseudo: "::after", doc: "components/docs/pagination.md:36 'Previous and next: … boxes with a pixel chevron'" },
  { name: "external link arrow", host: ".chu-link[data-external]", pseudo: "::after", doc: "components/docs/link.md:29 'a pixel arrow after the words'" },
  { name: "accordion chevron, closed", host: "details:not([open]) .chu-accordion-chevron", pseudo: "", doc: "components/docs/accordion.md:35 'pointing along the line when closed (right, or left right to left)'" },
  { name: "submenu chevron", host: ".chu-menu-item[aria-haspopup='menu'] > .chu-menu-label", pseudo: "::after", doc: "components/docs/menu.md:63 'A chevron at its end: it opens a submenu.'" },
  { name: "sidebar group chevron, closed", host: ".chu-sidebar-group:not([open]) > summary > .chu-sidebar-label", pseudo: "::after", doc: "components/docs/sidebar.md:46 'a pixel chevron at the end'" },
  { name: "sidebar pointer arrow", host: ".chu-sidebar[data-arrow] .chu-sidebar-item[aria-current='page'] > .chu-sidebar-label", pseudo: "::before", doc: "components/docs/sidebar.md:41 'room on its start side for the arrow'" },
  { name: "progress steps arrow, down the side", host: ".chu-progress-steps[data-orientation='vertical'][data-arrow] .chu-progress-steps-item[aria-current='step']", pseudo: "::after", doc: "components/docs/progress-steps.md:44 'the TV's pointer arrow over the current step (beside it, down the side)'" },
  { name: "choices pointer", host: ".chu-choices > li:has(> .chu-choice[data-chu-state~='focus'])", pseudo: "::before,::after", doc: "game/docs/choices.md:36 'room on the start side for the pointer'" },
  {
    name: "tab scroll chevrons",
    host: "chu-tabs > .chu-tabs-scroll[data-dir='end'] > span",
    pseudo: "",
    doc: "components/docs/tabs.md:39 'Scroll buttons … soft boxes with pixel chevrons that scroll it'",
    // The buttons only come while the row overflows: narrow the first tab row until it does.
    setup: async (page) => {
      await page.evaluate(() => {
        const tabs = document.querySelector<HTMLElement>("#example chu-tabs");
        if (tabs) tabs.style.inlineSize = "calc(120 * var(--chu-pixel))";
      });
      await settle(page);
    },
  },
];

for (const example of examples) {
  test(`${id(example)}`, async ({ page }, info) => {
    const failures: string[] = [];
    const ran: string[] = [];
    const notes: string[] = [];
    for (const width of [1280, ...(RESPONSIVE.includes(example.name) ? [390] : [])]) {
      const cond = `rtl ${width}`;
      ran.push(cond);
      await page.setViewportSize({ width, height: width === 390 ? 844 : 720 });
      await open(page, example, { scheme: "day", dir: "rtl", lang: "ar" });
      await settle(page);
      const over = await overflow(page);
      notes.push(`${cond}: page ${over.scrollWidth} px wide on a ${over.clientWidth} px screen`);
      if (over.scrollWidth > over.clientWidth + 1 || over.past.length) {
        // Is it right to left that does it? The same page left to right, for the report.
        await page.evaluate(() => (document.documentElement.dir = "ltr"));
        await settle(page);
        const ltr = await overflow(page);
        await page.evaluate(() => (document.documentElement.dir = "rtl"));
        await settle(page);
        const also = ltr.scrollWidth > ltr.clientWidth + 1 || ltr.past.length ? " (left to right too)" : " (only right to left)";
        if (over.scrollWidth > over.clientWidth + 1) failures.push(`[${cond}] the page scrolls sideways: ${over.scrollWidth} px wide on a ${over.clientWidth} px screen${also}; widest: ${over.past.slice(0, 3).join("; ") || "?"}`);
        else for (const p of over.past.slice(0, 6)) failures.push(`[${cond}] past the edge, out of reach${also}: ${p}`);
      }
      if (width !== 1280) continue;
      const fills = await fillsFromTheRight(page);
      notes.push(`${fills.checked} filled bars, meters, ratings and sliders`);
      failures.push(...fills.failures.map((f) => `[${cond}] ${f}`));
      const drawers = await drawerSides(page);
      if (drawers.checked) notes.push(`${drawers.checked} drawers`);
      failures.push(...drawers.failures.map((f) => `[${cond}] ${f}`));
      const layout = await mirrorLayout(page);
      notes.push(`${layout.checked} boxes mirrored`);
      failures.push(...layout.failures.map((f) => `[${cond}] ${f}`));
      const glyphs = await mirrored(page);
      if (glyphs.checked.length) notes.push(`glyphs turned round: ${glyphs.checked.join(", ")}`);
      failures.push(...glyphs.failures.map((f) => `[${cond}] ${f}`));
    }
    info.annotations.push({ type: "measured", description: notes.join("; ") });
    expectNone(triage(info, "rtl", id(example), failures, ran), `${id(example)} right to left`);
  });
}

/** How wide the page is, and what lies past either edge outside a scroller or a clip (out of reach). */
function overflow(page: Page): Promise<{ scrollWidth: number; clientWidth: number; past: string[] }> {
  return page.evaluate(() => {
    const html = document.documentElement;
    const vw = html.clientWidth;
    const past: { over: number; what: string }[] = [];
    const name = (e: Element) => `${e.tagName.toLowerCase()}${[...e.classList].filter((c) => c.startsWith("chu-") && c !== "chu-box").slice(0, 2).map((c) => `.${c}`).join("")}`;
    for (const el of document.body.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      if (r.width <= 1 || r.height <= 1) continue;
      const fixed = getComputedStyle(el).position === "fixed";
      // A sheet runs a pixel past the screen on purpose (drawers): allow fixed things a pixel.
      const slack = fixed ? parseFloat(getComputedStyle(el).getPropertyValue("--chu-pixel")) + 0.5 || 2.5 : 1;
      const over = Math.max(-r.left, r.right - vw);
      if (over <= slack) continue;
      let hidden = false;
      for (let a: Element | null = el; a && a !== html; a = a.parentElement) {
        const cs = getComputedStyle(a);
        if (a !== el && (cs.overflowX !== "visible" || cs.contain.includes("paint"))) { hidden = true; break; }
        if (cs.clipPath !== "none" || cs.visibility === "hidden") { hidden = true; break; }
      }
      if (hidden || !el.checkVisibility({ visibilityProperty: true })) continue;
      past.push({ over, what: `${name(el)}${el.closest("[class*='chu-']") && el.closest("[class*='chu-']") !== el ? ` in ${name(el.parentElement!.closest("[class*='chu-']") ?? el)}` : ""} ${Math.round(over)} px past the ${-r.left > r.right - vw ? "left" : "right"} edge` });
    }
    past.sort((a, b) => b.over - a.over);
    // Report the outermost of nested offenders only: a child of an offender that overflows by no more is noise.
    return { scrollWidth: html.scrollWidth, clientWidth: vw, past: past.map((p) => p.what).filter((w, i, all) => all.indexOf(w) === i) };
  });
}

/**
 * Part-full progress bars, meters, ratings and sliders: the colour a quarter of the way into the filled part and
 * into the empty part, right to left, against the same element switched to left to right on its own. The filled
 * part must be on the right: right to left shows the left-to-right colours, mirrored.
 */
async function fillsFromTheRight(page: Page): Promise<{ checked: number; failures: string[] }> {
  const items = await page.evaluate(() => {
    const out: { key: string; what: string; f: number; first: boolean }[] = [];
    let n = 0;
    const mark = (host: Element, target: Element, what: string, f: number, first = false) => {
      if (!target.checkVisibility() || f <= 0.1 || f >= 0.9) return;
      (host as HTMLElement).dataset.lanesFill = String(n);
      (target as HTMLElement).dataset.lanesFillTarget = String(n);
      out.push({ key: String(n++), what, f, first });
    };
    for (const el of document.querySelectorAll<HTMLProgressElement>("#example .chu-progress > progress")) {
      if (el.position < 0) continue;
      mark(el.parentElement!, el, `progress "${el.labels?.[0]?.textContent ?? el.getAttribute("aria-label") ?? ""}" at ${Math.round(el.position * 100)}%`, el.position);
    }
    for (const el of document.querySelectorAll<HTMLMeterElement>("#example .chu-meter > meter")) {
      mark(el.parentElement!, el, `meter "${el.getAttribute("aria-label") ?? document.getElementById(el.getAttribute("aria-labelledby") ?? "")?.textContent ?? ""}" at ${el.value} of ${el.max}`, (el.value - el.min) / (el.max - el.min));
    }
    for (const el of document.querySelectorAll<HTMLElement>("#example .chu-rating")) {
      const cs = getComputedStyle(el);
      const v = parseFloat(cs.getPropertyValue("--chu-rating-value")), max = parseFloat(cs.getPropertyValue("--chu-rating-max"));
      if (v >= 1 && v <= max - 1) mark(el, el, `rating ${v} of ${max}`, v / max, true);
    }
    for (const el of document.querySelectorAll<HTMLInputElement>("#example input.chu-slider")) {
      const v = parseFloat(getComputedStyle(el).getPropertyValue("--chu-slider-value"));
      if (!Number.isNaN(v)) mark(el, el, `slider "${el.labels?.[0]?.textContent ?? el.id}" at ${Math.round(v * 100)}%`, v);
    }
    return out;
  });
  if (!items.length) return { checked: 0, failures: [] };
  const sample = async () => {
    const img = decode(await page.screenshot({ animations: "disabled" }));
    const rects = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll<HTMLElement>("[data-lanes-fill-target]")].map((e) => {
      const r = e.getBoundingClientRect();
      return [e.dataset.lanesFillTarget!, { x: r.x, y: r.y, w: r.width, h: r.height, rtl: getComputedStyle(e).direction === "rtl", cells: parseFloat(getComputedStyle(e).getPropertyValue("--chu-rating-max")) || 0 }];
    })));
    return { img, rects };
  };
  const rtl = await sample();
  await page.evaluate(() => document.querySelectorAll("[data-lanes-fill]").forEach((e) => e.setAttribute("dir", "ltr")));
  const ltr = await sample();
  await page.evaluate(() => document.querySelectorAll("[data-lanes-fill]").forEach((e) => e.removeAttribute("dir")));
  const failures: string[] = [];
  const colourAt = (s: { img: Image }, r: { x: number; y: number; w: number; h: number }, t: number) => mode(s.img, Math.round(r.x + r.w * t) - 3, Math.round(r.y + r.h / 2) - 1, Math.round(r.x + r.w * t) + 4, Math.round(r.y + r.h / 2) + 2)!;
  for (const it of items) {
    const a = rtl.rects[it.key]!, b = ltr.rects[it.key]!;
    if (!a.rtl) {
      failures.push(`${it.what}: not right to left (direction ${a.rtl})`);
      continue;
    }
    // Ratings: the middle of the first star (full) and of the last (empty). Bars: the middle of each part.
    const full = it.first ? 0.5 / a.cells : it.f / 2, empty = it.first ? 1 - 0.5 / a.cells : (1 + it.f) / 2;
    const ltrFull = colourAt(ltr, b, full), ltrEmpty = colourAt(ltr, b, empty);
    const rtlFull = colourAt(rtl, a, 1 - full), rtlEmpty = colourAt(rtl, a, 1 - empty);
    if (distance(ltrFull, ltrEmpty) < 24) {
      failures.push(`${it.what}: full and empty look the same left to right (${hex(ltrFull)}), so the direction can't be told`);
      continue;
    }
    if (distance(rtlFull, ltrFull) > 24 || distance(rtlEmpty, ltrEmpty) > 24) {
      failures.push(`${it.what}: does not fill from the right: right to left shows ${hex(rtlFull)} where the fill should be (${hex(ltrFull)}) and ${hex(rtlEmpty)} where it should be empty (${hex(ltrEmpty)})`);
    }
  }
  return { checked: items.length, failures };
}

/** Drawers: the end side is the left edge right to left, the start side the right edge. */
async function drawerSides(page: Page): Promise<{ checked: number; failures: string[] }> {
  const failures: string[] = [];
  const ids = await page.evaluate(() => [...document.querySelectorAll<HTMLDialogElement>("#example dialog.chu-drawer")].map((d, i) => {
    d.dataset.lanesDrawer = String(i);
    return { i, side: d.dataset.side ?? "end", live: !d.hasAttribute("data-chu-static"), label: d.querySelector(".chu-dialog-title")?.textContent?.trim() ?? `drawer ${i}` };
  }));
  for (const d of ids) {
    if (d.side === "bottom") continue;
    const sel = `[data-lanes-drawer="${d.i}"]`;
    if (d.live) await page.evaluate((sel) => document.querySelector<HTMLDialogElement>(sel)!.showModal(), sel);
    await settle(page);
    const r = await page.evaluate((sel) => {
      const el = document.querySelector<HTMLElement>(sel)!;
      const b = el.getBoundingClientRect(), p = el.parentElement!.getBoundingClientRect();
      return { left: b.left, right: b.right, pLeft: p.left, pRight: p.right, vw: document.documentElement.clientWidth, pixel: parseFloat(getComputedStyle(el).getPropertyValue("--chu-pixel")) || 2 };
    }, sel);
    const [edgeL, edgeR] = d.live ? [0, r.vw] : [r.pLeft, r.pRight];
    const slack = 2 * r.pixel + 0.5;
    const ok = d.side === "end" ? Math.abs(r.left - edgeL) <= slack && r.right < edgeR - slack : Math.abs(r.right - edgeR) <= slack && r.left > edgeL + slack;
    if (!ok) failures.push(`drawer "${d.label}" (data-side="${d.side}", ${d.live ? "live" : "static"}): should touch the ${d.side === "end" ? "left" : "right"} edge of ${d.live ? "the screen" : "its screen"} right to left, but spans ${Math.round(r.left - edgeL)} to ${Math.round(r.right - edgeL)} px of ${Math.round(edgeR - edgeL)}`);
    if (d.live) {
      await page.evaluate((sel) => document.querySelector<HTMLDialogElement>(sel)!.close(), sel);
      await settle(page);
    }
  }
  return { checked: ids.filter((d) => d.side !== "bottom").length, failures };
}

/** Each directional glyph alone, right to left and left to right: the first must be the mirror of the second. */
async function mirrored(page: Page): Promise<{ checked: string[]; failures: string[] }> {
  const checked: string[] = [];
  const failures: string[] = [];
  for (const g of GLYPHS) {
    if (!(await page.locator(`#example ${g.host}`).count())) continue;
    await g.setup?.(page);
    const found = await page.evaluate((host) => {
      const el = [...document.querySelectorAll<HTMLElement>(`#example ${host}`)].find((e) => e.checkVisibility());
      if (!el) return false;
      el.dataset.lanesGlyph = "";
      return true;
    }, g.host);
    if (!found) {
      failures.push(`${g.name}: none showing in the example (${g.doc})`);
      continue;
    }
    const pseudos = g.pseudo ? g.pseudo.split(",").map((p) => `#example [data-lanes-glyph]${p}`).join(", ") : "#example [data-lanes-glyph]";
    const style = await page.addStyleTag({ content: `#example *, #example *::before, #example *::after { visibility: hidden !important; animation: none !important; } ${pseudos} { visibility: visible !important; }` });
    const shoot = async () => {
      const r = await page.evaluate(() => { const b = document.querySelector("[data-lanes-glyph]")!.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, vw: innerWidth, vh: innerHeight }; });
      const x = Math.max(0, Math.floor(r.x) - 64), y = Math.max(0, Math.floor(r.y) - 32);
      return ink(decode(await page.screenshot({ clip: { x, y, width: Math.min(r.vw - x, Math.ceil(r.w) + 128), height: Math.min(r.vh - y, Math.ceil(r.h) + 64) } })));
    };
    const rtl = await shoot();
    await page.evaluate(() => (document.documentElement.dir = "ltr"));
    await settle(page);
    const ltr = await shoot();
    await page.evaluate(() => (document.documentElement.dir = "rtl"));
    await style.evaluate((s) => (s as Element).remove());
    await page.evaluate(() => document.querySelector("[data-lanes-glyph]")?.removeAttribute("data-lanes-glyph"));
    await settle(page);
    if (!ltr || !rtl) {
      failures.push(`${g.name}: no glyph drawn ${!ltr ? "left to right" : "right to left"} (${g.doc})`);
      continue;
    }
    if (same(ltr, flip(ltr))) {
      failures.push(`${g.name}: symmetric, so it does not point along the line; take it out of the glyph list (${g.doc})`);
      continue;
    }
    checked.push(g.name);
    if (!same(rtl, flip(ltr))) failures.push(`${g.name}: does not turn round right to left: ${same(rtl, ltr) ? "it points the same way as left to right" : "it is drawn differently, not mirrored"} (${g.doc})`);
  }
  return { checked, failures };
}

/**
 * Every block-level box's place in its parent, right to left, against the mirror of its place left to right. One line
 * per kind of box that does not mirror (the first one found, and how many like it).
 */
async function mirrorLayout(page: Page): Promise<{ checked: number; failures: string[] }> {
  const collect = () => page.evaluate(() => {
    const root = document.getElementById("example")!;
    const all = [...root.querySelectorAll("*")];
    const out: { i: number; x: number; w: number; pw: number; name: string; parent: string }[] = [];
    const name = (e: Element) => `${e.tagName.toLowerCase()}${[...e.classList].filter((c) => c !== "chu-box").slice(0, 2).map((c) => `.${c}`).join("")}`;
    all.forEach((el, i) => {
      const cs = getComputedStyle(el);
      if (["inline", "contents", "none"].includes(cs.display) || !el.checkVisibility()) return;
      // In a line of text, bidi orders the boxes; physical sides an API names; places an example sets inline;
      // the world's decoration.
      const pd = el.parentElement ? getComputedStyle(el.parentElement).display : "block";
      if (cs.display.startsWith("inline") && !/flex|grid/.test(pd)) return;
      if (el.closest("[data-side='left'], [data-side='right'], .chu-tooltip-nub, .chu-popover-nub, chu-world, .chu-world") || /(^|;)\s*(left|right|margin-left|margin-right|padding-left|padding-right)\s*:/.test(el.getAttribute("style") ?? "")) return;
      const r = el.getBoundingClientRect();
      if (r.width <= 1 || r.height <= 1) return;
      let a = el.parentElement!;
      while (a !== root && ["inline", "contents"].includes(getComputedStyle(a).display)) a = a.parentElement!;
      const q = a.getBoundingClientRect();
      if (q.width < 2 || /(^|;)\s*padding(-left|-right)?\s*:/.test(a.getAttribute("style") ?? "")) return;
      out.push({ i, x: r.left - q.left, w: r.width, pw: q.width, name: name(el), parent: name(a) });
    });
    return out;
  });
  const pixel = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--chu-pixel")) || 2);
  const rtl = await collect();
  await page.evaluate(() => (document.documentElement.dir = "ltr"));
  await settle(page);
  const ltr = new Map((await collect()).map((r) => [r.i, r]));
  await page.evaluate(() => (document.documentElement.dir = "rtl"));
  await settle(page);
  const kinds = new Map<string, { first: string; n: number }>();
  let checked = 0;
  for (const r of rtl) {
    const l = ltr.get(r.i);
    // Only boxes whose size and parent's size do not depend on the direction.
    if (!l || Math.abs(l.pw - r.pw) > 1.5 || Math.abs(l.w - r.w) > 1.5) continue;
    checked++;
    const mirror = l.pw - l.x - l.w;
    if (Math.abs(r.x - mirror) <= 2 * pixel + 0.5) continue;
    const kind = `${r.name} in ${r.parent}`;
    const seen = kinds.get(kind);
    if (seen) seen.n++;
    else kinds.set(kind, { first: `${kind}: ${Math.round(r.x)} px from its parent's left edge right to left, where the mirror of left to right is ${Math.round(mirror)} px (${Math.round(Math.abs(r.x - mirror))} px off)`, n: 1 });
  }
  return { checked, failures: [...kinds.values()].map((k) => `the layout does not mirror: ${k.first}${k.n > 1 ? `, and ${k.n - 1} more like it` : ""}`) };
}

/** The ink of a shot: the pixels that are not its background (its most common colour), cropped to their bounds. */
function ink(img: Image): Image | null {
  const bg = mode(img, 0, 0, img.width, img.height)!;
  let x0 = img.width, y0 = img.height, x1 = -1, y1 = -1;
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
    if (distance(at(img, x, y), bg) < 24) continue;
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  if (x1 < 0) return null;
  const w = x1 - x0 + 1, h = y1 - y0 + 1, data = new Uint8Array(w * h * 3);
  for (let y = 0; y < h; y++) data.set(img.data.subarray(((y0 + y) * img.width + x0) * 3, ((y0 + y) * img.width + x1 + 1) * 3), y * w * 3);
  return { width: w, height: h, data };
}

function flip(img: Image): Image {
  const data = new Uint8Array(img.data.length);
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
    const s = (y * img.width + x) * 3, d = (y * img.width + (img.width - 1 - x)) * 3;
    data[d] = img.data[s]!; data[d + 1] = img.data[s + 1]!; data[d + 2] = img.data[s + 2]!;
  }
  return { width: img.width, height: img.height, data };
}

/** Pixel for pixel, but for a sliver of antialiasing. */
function same(a: Image, b: Image): boolean {
  if (a.width !== b.width || a.height !== b.height) return false;
  let off = 0;
  for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) if (distance(at(a, x, y), at(b, x, y)) > 30) off++;
  return off <= Math.max(1, a.width * a.height * 0.01);
}

