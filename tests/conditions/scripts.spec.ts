/**
 * Lane 6, other scripts. One fixture page (fixtures/scripts.html) with the same text-bearing parts in Russian, Greek,
 * Vietnamese, Chinese, Japanese, Arabic and Hebrew: Pixel Bop at scales 1 to 4, a title, a lead, body text, a label,
 * a button, a tag, a tab, a card title, a table heading and cell, an input's value and a toast's title. By Day:
 *   - Russian and Greek render in the pixel fonts alone (CDP CSS.getPlatformFontsForNode): Pixel Bop for display text,
 *     Pixelify Sans for the rest, and no glyph from a system font (packages/font/docs/font.md, "Supported scripts");
 *   - in every script, a box's text stays inside the box (its ink within the box, inset by the outline), and no line
 *     of a block reaches into the line above (each line's ink, found by showing that line alone, shares no pixel with
 *     the next line's). Scripts the faces do not draw take the system font, and must still fit.
 */
import { test, type Page } from "@playwright/test";
import { expectNone, triage } from "./lib/known.js";
import { fitViewport, fixture, open } from "./lib/open.js";
import { at, decode, distance, type Image } from "./lib/png.js";
import { HIDE_GLYPHS } from "./lib/text.js";

const SCRIPTS = { ru: "Russian", el: "Greek", vi: "Vietnamese", zh: "Chinese", ja: "Japanese", ar: "Arabic", he: "Hebrew" } as const;
const PIXEL_FONTS = ["ru", "el"];

for (const [code, name] of Object.entries(SCRIPTS)) {
  test(`${code} (${name})`, async ({ page }, info) => {
    await open(page, fixture("scripts"), { scheme: "day" });
    // This script alone, so the page is short and every shot small.
    await page.addStyleTag({ content: `[data-script]:not([data-script="${code}"]) { display: none !important; }` });
    const { width } = await fitViewport(page, 1280);
    const failures: string[] = [];
    const notes: string[] = [];
    if (PIXEL_FONTS.includes(code)) {
      const fonts = await fontsOf(page, code);
      notes.push(`${fonts.checked} parts' fonts read`);
      failures.push(...fonts.failures.map((f) => `[${code} fonts] ${f}`));
    }
    const ink = await inkChecks(page, code, width);
    notes.push(`${ink.boxes} boxes and ${ink.blocks} blocks of lines measured`);
    failures.push(...ink.failures.map((f) => `[${code} ink] ${f}`));
    info.annotations.push({ type: "measured", description: notes.join("; ") });
    expectNone(triage(info, "scripts", "conditions/scripts", failures, [`${code} fonts`, `${code} ink`]), `${name} text`);
  });
}

/** Every part's fonts, as the browser picked them: display parts in Pixel Bop, the rest in Pixelify Sans. */
async function fontsOf(page: Page, code: string): Promise<{ checked: number; failures: string[] }> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
  const { nodeIds } = await cdp.send("DOM.querySelectorAll", { nodeId: root.nodeId, selector: `[data-script="${code}"] [data-part]` });
  const failures: string[] = [];
  for (const nodeId of nodeIds) {
    const { attributes = [] } = await cdp.send("DOM.getAttributes", { nodeId });
    const part = attributes[attributes.indexOf("data-part") + 1] ?? "?";
    const want = part.startsWith("display") ? "Pixel Bop" : "Pixelify Sans";
    const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
    const wrong = fonts.filter((f) => f.glyphCount > 0 && (!f.isCustomFont || f.familyName !== want));
    if (wrong.length) failures.push(`${part}: ${wrong.map((f) => `${f.glyphCount} glyph${f.glyphCount === 1 ? "" : "s"} from ${f.isCustomFont ? "" : "the system font "}${f.familyName}`).join(", ")} (should be ${want} only)`);
  }
  await cdp.detach();
  return { checked: nodeIds.length, failures };
}

/**
 * The ink of the section's text: each box's text within the box, and each line of a block clear of the line above.
 * Shots: everything, no glyphs, and each line on its own.
 */
async function inkChecks(page: Page, code: string, width: number): Promise<{ boxes: number; blocks: number; failures: string[] }> {
  const section = `[data-script="${code}"]`;
  const layout = await page.evaluate((section) => {
    const s = document.querySelector(section)!;
    const rect = (e: Element) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
    const boxes = [...s.querySelectorAll<HTMLElement>("[data-part]")].filter((e) => e.closest(".chu-box")).map((e) => {
      const box = e.closest(".chu-box")!;
      const fs = parseFloat(getComputedStyle(e).fontSize);
      return { part: e.dataset.part!, text: rect(e), box: rect(box), pixel: parseFloat(getComputedStyle(box).getPropertyValue("--chu-pixel")) || 2, fs };
    });
    const blocks = [...s.querySelectorAll<HTMLElement>("[data-part]")].filter((e) => e.querySelector("[data-line]")).map((e) => ({
      part: e.dataset.part!,
      rect: rect(e),
      lines: [...e.querySelectorAll<HTMLElement>("[data-line]")].map((l) => rect(l)),
      fs: parseFloat(getComputedStyle(e).fontSize),
    }));
    return { boxes, blocks, lines: Math.max(0, ...blocks.map((b) => b.lines.length)) };
  }, section);
  const shot = async (css?: string) => {
    const style = css ? await page.addStyleTag({ content: css }) : null;
    const img = decode(await page.screenshot({ animations: "disabled", caret: "hide" }));
    await style?.evaluate((s) => (s as Element).remove());
    return img;
  };
  const all = await shot();
  const none = await shot(HIDE_GLYPHS);
  const lineShots: Image[] = [];
  for (let k = 1; k <= layout.lines; k++) lineShots.push(await shot(`${HIDE_GLYPHS}\n${section} [data-line="${k}"] { -webkit-text-fill-color: currentColor !important; }`));
  const failures: string[] = [];
  const clampX = (x: number) => Math.max(0, Math.min(width - 1, Math.round(x)));
  const clampY = (y: number) => Math.max(0, Math.min(all.height - 1, Math.round(y)));
  const inkAt = (img: Image, x: number, y: number) => distance(at(img, x, y), at(none, x, y)) >= 60;

  // A box's text within the box: its ink anywhere near its line, outside the box's inside.
  for (const b of layout.boxes) {
    const x0 = clampX(b.text.x - b.fs / 2), x1 = clampX(b.text.x + b.text.w + b.fs / 2), y0 = clampY(b.text.y - b.fs), y1 = clampY(b.text.y + b.text.h + b.fs);
    const ix0 = b.box.x + b.pixel, ix1 = b.box.x + b.box.w - b.pixel, iy0 = b.box.y + b.pixel, iy1 = b.box.y + b.box.h - b.pixel;
    let worst = 0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!inkAt(all, x, y)) continue;
      worst = Math.max(worst, ix0 - x, x + 1 - ix1, iy0 - y, y + 1 - iy1);
    }
    if (worst > 0) failures.push(`${b.part}: its text's ink reaches ${Math.round(worst)} px out of its box`);
  }
  // Each line clear of the next, and within its block's sides.
  for (const b of layout.blocks) {
    const inks: Set<number>[] = b.lines.map((l, k) => {
      const set = new Set<number>();
      const x0 = clampX(b.rect.x - b.fs), x1 = clampX(b.rect.x + b.rect.w + b.fs), y0 = clampY(l.y - b.fs), y1 = clampY(l.y + l.h + b.fs);
      let out = 0;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        if (!inkAt(lineShots[k]!, x, y)) continue;
        set.add(y * width + x);
        if (x < b.rect.x - 1 || x > b.rect.x + b.rect.w + 1) out++;
      }
      if (out) failures.push(`${b.part}, line ${k + 1}: ${out} pixels of ink outside the block's sides`);
      if (!set.size) failures.push(`${b.part}, line ${k + 1}: no ink found`);
      return set;
    });
    for (let k = 1; k < inks.length; k++) {
      let shared = 0;
      for (const p of inks[k]!) if (inks[k - 1]!.has(p)) shared++;
      if (shared) failures.push(`${b.part}: line ${k + 1} reaches into line ${k} (${shared} pixels of ink overlap)`);
    }
  }
  return { boxes: layout.boxes.length, blocks: layout.blocks.length, failures };
}
