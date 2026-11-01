/**
 * Lane 7, print. Every example opened at Night and printed (print media), as a browser prints by default, with
 * background graphics off:
 *   - every candy box keeps its fill and outline: the box and its ::before and ::after print exact colours
 *     (print-color-adjust), and the PDF paints each box's fill and outline colour; so does every part that shows a
 *     value (a progress bar, a meter, a rating, a slider);
 *   - a Night page prints Day: the page's scheme roles (and every data-blip-scheme section's) are Day's, the page
 *     under print media is pixel for pixel the same page in Day, and the two PDFs paint the same colours;
 *   - the world, the CRT and the scrims do not print: the world and the hero's drawn scenery are not shown, the CRT's
 *     scanlines and vignette are off, scrims and a modal's ::backdrop have no fill;
 *   - nothing is lost in a scroller: paper cannot scroll, so a region that scrolls on paper (a table with a maximum
 *     height, a long list) loses what is out of view.
 */
import { test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { examples, id, ROOT } from "../page/manifest.js";
import { expectNone, triage } from "./lib/known.js";
import { fitViewport, open, settle } from "./lib/open.js";
import { paints, pdfColours } from "./lib/pdf.js";
import { at, decode, hex } from "./lib/png.js";

/** The scheme roles, from the built tokens: in print every one is Day's. */
const ROLES = Object.keys((JSON.parse(readFileSync(join(ROOT, "packages/tokens/dist/json/tokens.json"), "utf8")) as { schemes: { day: Record<string, string> } }).schemes.day);

for (const example of examples) {
  test(`${id(example)}`, async ({ page }, info) => {
    await open(page, example, { scheme: "night" });
    const { width, height } = await fitViewport(page, 1280);
    await page.emulateMedia({ media: "print" });
    await settle(page);
    const failures: string[] = [];

    // What print media computes.
    const computed = await page.evaluate(inPrint, ROLES);
    failures.push(...computed.failures);

    // Night as printed, then the same page in Day.
    const night = decode(await page.screenshot({ animations: "disabled", caret: "hide" }));
    const nightPdf = pdfColours(await page.pdf({ printBackground: false, width: `${width}px`, height: `${height}px` }));
    for (const box of computed.boxes) {
      for (const [part, c] of [["fill", box.fill], ["outline", box.outline]] as const) {
        if (c !== null && !paints(nightPdf, c)) failures.push(`${box.where}: its ${part} (${hex(c)}) is not on the paper (PDF, background graphics off)`);
      }
    }
    await page.evaluate(() => {
      for (const el of document.querySelectorAll<HTMLElement>("[data-blip-scheme]")) el.dataset.blipScheme = "day";
    });
    await settle(page);
    const day = decode(await page.screenshot({ animations: "disabled", caret: "hide" }));
    const dayPdf = pdfColours(await page.pdf({ printBackground: false, width: `${width}px`, height: `${height}px` }));
    const diff = differences(night, day);
    if (diff.count) {
      const where = await page.evaluate((points) => [...new Set(points.map(([x, y]) => {
        const e = document.elementFromPoint(x, y);
        return e ? `${e.tagName.toLowerCase()}${[...e.classList].filter((c) => c.startsWith("blip-") && c !== "blip-box").slice(0, 2).map((c) => `.${c}`).join("")}` : "?";
      }))].join(", "), diff.points);
      failures.push(`a Night page prints differently from Day: ${diff.count} pixels in ${diff.box} (at ${where})`);
    }
    const extra = [...nightPdf.keys()].filter((c) => !paints(dayPdf, c, 1)), missing = [...dayPdf.keys()].filter((c) => !paints(nightPdf, c, 1));
    if (extra.length || missing.length) failures.push(`a Night page's PDF paints other colours than Day's: ${extra.length ? `also ${extra.slice(0, 6).map(hex).join(" ")}` : ""}${missing.length ? ` not ${missing.slice(0, 6).map(hex).join(" ")}` : ""}`.trim());

    // A modal's ::backdrop (the scrim behind a dialog or drawer) has no fill on paper.
    failures.push(...(await backdrops(page)));

    info.annotations.push({ type: "measured", description: `${computed.boxes.length} boxes, ${computed.values} value parts, ${ROLES.length} roles; PDF ${nightPdf.size} colours at Night, ${dayPdf.size} by Day` });
    expectNone(triage(info, "print", id(example), failures.map((f) => `[print] ${f}`), ["print"]), `${id(example)} printed`);
  });
}

/** Runs in the page under print media: what does not print exactly, which roles are not Day's, what of the world
    and the scrims still shows, and each box's fill and outline colour (0xRRGGBB, or null when see-through). */
function inPrint(roles: string[]) {
  const root = document.getElementById("example")!;
  const failures: string[] = [];
  const name = (e: Element) => `${e.tagName.toLowerCase()}${[...e.classList].filter((c) => c.startsWith("blip-") && c !== "blip-box").slice(0, 2).map((c) => `.${c}`).join("")}${e.textContent!.trim() ? ` "${e.textContent!.trim().replace(/\s+/g, " ").slice(0, 20)}"` : ""}`;
  const exact = (e: Element, p?: string) => getComputedStyle(e, p).getPropertyValue("print-color-adjust") === "exact";
  const probe = document.body.appendChild(document.createElement("i"));
  const colour = (value: string): number | null => {
    probe.style.color = "";
    probe.style.color = value.trim();
    const m = getComputedStyle(probe).color.match(/rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?\)/);
    if (!m || (m[4] !== undefined && Number(m[4]) < 1)) return null;
    return (Math.round(+m[1]!) << 16) | (Math.round(+m[2]!) << 8) | Math.round(+m[3]!);
  };
  // How much of an element shows: what its clipping ancestors (and its own clip-path) leave of it.
  const shown = (el: Element) => {
    const r = el.getBoundingClientRect();
    let x0 = r.left, y0 = r.top, x1 = r.right, y1 = r.bottom;
    if (/^inset\(50%/.test(getComputedStyle(el).clipPath)) return 0;
    for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      const cs = getComputedStyle(a);
      const q = a.getBoundingClientRect();
      if (cs.overflowX !== "visible") { x0 = Math.max(x0, q.left); x1 = Math.min(x1, q.right); }
      if (cs.overflowY !== "visible") { y0 = Math.max(y0, q.top); y1 = Math.min(y1, q.bottom); }
      if (/^inset\(50%/.test(cs.clipPath)) return 0;
    }
    return r.width * r.height ? (Math.max(0, x1 - x0) * Math.max(0, y1 - y0)) / (r.width * r.height) : 0;
  };
  const boxes: { where: string; fill: number | null; outline: number | null }[] = [];
  for (const box of root.querySelectorAll(".blip-box")) {
    if (!box.checkVisibility() || box.getBoundingClientRect().width < 2) continue;
    // Scrolled out of sight, or visually hidden (a skip link until it has focus): nothing of it to print.
    if (shown(box) < 0.5) continue;
    const loose = [undefined, "::before", "::after"].filter((p) => !exact(box, p)).map((p) => p ?? "the box");
    if (loose.length) failures.push(`${name(box)}: ${loose.join(", ")} not exact (print-color-adjust), so with background graphics off its fill and outline drop`);
    const cs = getComputedStyle(box);
    boxes.push({ where: name(box), fill: colour(cs.getPropertyValue("--blip-box-fill")), outline: colour(cs.getPropertyValue("--blip-box-outline")) });
  }
  // Parts that show a value: without their colours the value is gone from the paper.
  let values = 0;
  for (const el of root.querySelectorAll("progress, meter, .blip-rating, input[type='range']")) {
    if (!el.checkVisibility()) continue;
    values++;
    const loose = (el.matches(".blip-rating") ? ["::before", "::after"] : [undefined]).filter((p) => !exact(el, p)).map((p) => p ?? "the element");
    if (loose.length) failures.push(`${name(el)}: ${loose.join(", ")} not exact (print-color-adjust), so with background graphics off its value drops`);
  }
  // A scroller's hidden part cannot be reached on paper: what it scrolls to is lost. (A clip that hides on purpose,
  // overflow hidden or clip, hides on screen too.)
  for (const el of root.querySelectorAll("*")) {
    const cs = getComputedStyle(el);
    if (!/auto|scroll/.test(cs.overflowX + cs.overflowY) || !el.checkVisibility()) continue;
    // A frame an example draws round its demo (a phone screen, an app shell) is the example's, not a component's.
    const own = (el as HTMLElement).style;
    if (own.overflow || own.overflowX || own.overflowY) continue;
    const across = /auto|scroll/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 1, down = /auto|scroll/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1;
    if (across || down) failures.push(`${name(el)}: scrolls on paper, so ${down ? `${el.scrollHeight - el.clientHeight} px of it below` : ""}${across && down ? " and " : ""}${across ? `${el.scrollWidth - el.clientWidth} px to the side` : ""} never print`);
  }
  // The world, the CRT and the scrims.
  for (const w of root.querySelectorAll("blip-world, .blip-hero-scenery, .blip-hero-ground")) if (w.checkVisibility()) failures.push(`${name(w)}: the world prints`);
  for (const c of root.querySelectorAll(".blip-crt")) {
    for (const p of ["::before", "::after"]) {
      const cs = getComputedStyle(c, p);
      if (cs.display !== "none" && cs.content !== "none" && (cs.backgroundImage !== "none" || colour(cs.backgroundColor) !== null)) failures.push(`${name(c)}${p}: the CRT prints`);
    }
  }
  for (const s of root.querySelectorAll(".blip-scrim")) {
    const cs = getComputedStyle(s);
    if (s.checkVisibility() && (cs.backgroundImage !== "none" || colour(cs.backgroundColor) !== null)) failures.push(`${name(s)}: the scrim prints`);
  }
  // Day's roles everywhere a scheme is set.
  const day = document.body.appendChild(Object.assign(document.createElement("div"), { hidden: true }));
  day.dataset.blipScheme = "day";
  const want = Object.fromEntries(roles.map((r) => [r, getComputedStyle(day).getPropertyValue(`--blip-${r}`).trim()]));
  for (const el of [document.documentElement, ...root.querySelectorAll("[data-blip-scheme]")]) {
    const off = roles.filter((r) => getComputedStyle(el).getPropertyValue(`--blip-${r}`).trim() !== want[r]);
    if (off.length) failures.push(`${el === document.documentElement ? "the page" : name(el)} (data-blip-scheme="${(el as HTMLElement).dataset.blipScheme}"): prints ${off.length} roles that are not Day's (${off.slice(0, 4).map((r) => `--blip-${r}`).join(", ")})`);
  }
  day.remove();
  probe.remove();
  return { failures, boxes, values };
}

/** Pixels that differ between two shots: how many, their bounding box, and a few of them (CSS px at DPR 1). */
function differences(a: ReturnType<typeof decode>, b: ReturnType<typeof decode>) {
  let count = 0, x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  const points: [number, number][] = [];
  const w = Math.min(a.width, b.width), h = Math.min(a.height, b.height);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (at(a, x, y) === at(b, x, y)) continue;
      if (count % 997 === 0 && points.length < 6) points.push([x + 0.5, y + 0.5]);
      count++;
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
  }
  return { count, points, box: count ? `${x1 - x0 + 1} x ${y1 - y0 + 1} px at ${x0}, ${y0}` : "" };
}

/** Opens each modal dialog and drawer that is closed, and checks its ::backdrop has no fill on paper. */
async function backdrops(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    for (const d of document.querySelectorAll<HTMLDialogElement>("#example dialog:not([open])")) {
      try {
        d.showModal();
      } catch {
        continue;
      }
      const cs = getComputedStyle(d, "::backdrop");
      if (cs.backgroundImage !== "none" || !/^rgba\([^)]*,\s*0\)$|^transparent$/.test(cs.backgroundColor)) out.push(`dialog${d.id ? `#${d.id}` : ""}::backdrop: the scrim prints (${cs.backgroundImage !== "none" ? "an image" : cs.backgroundColor})`);
      d.close();
    }
    return out;
  });
}
