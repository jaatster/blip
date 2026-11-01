/**
 * Lane 5, long words on narrow screens. Every example in German (lang="de"), with every word of six letters or more
 * in its text made a long compound ("Datenschutzeinstellungen"), at 360 and 320 px wide, at the browser's default
 * text size of 16, 20 and 24 px (CDP Page.setFontSizes, switched in place), with hyphenation off (only some platforms
 * have a German dictionary, so this is what every one does without it):
 *   - the words must not make the page wider than the screen, in the examples laid out for phones (the manifest's
 *     RESPONSIVE list); the others are laid out for wide screens, so their width is noted, not failed;
 *   - no text may stick out of its box: the box that holds its line, or any candy box around it (inset by its
 *     outline; a line whose middle falls outside is out of it vertically too), up to the first box taken out of the
 *     flow (a badge over a corner sits where it is put). Text in a sideways scroller scrolls; visually hidden text
 *     does not count; a component that cuts text short with an ellipsis does it on purpose (the bottom bar, as a
 *     last resort), and is listed as a note. A failure that happens without the words too says so: then it is the
 *     narrow screen or the text size, not the words.
 */
import { test } from "@playwright/test";
import { examples, id, RESPONSIVE } from "../page/manifest.js";
import { expectNone, triage } from "./lib/known.js";
import { open, settle } from "./lib/open.js";
import { COMPOUNDS, installWords, measureWords } from "./lib/words.js";

const SIZES = [16, 20, 24];
const WIDTHS = [360, 320];

for (const example of examples) {
  test(`${id(example)}`, async ({ page }, info) => {
    await page.setViewportSize({ width: WIDTHS[0]!, height: 720 });
    await open(page, example, { scheme: "day", lang: "de" });
    // No hyphenation: Chromium hyphenates German only with a dictionary (macOS has one, Linux CI does not), so the
    // lane measures what every platform does without one: words break only where the CSS lets them.
    await page.addStyleTag({ content: "*, *::before, *::after { hyphens: manual !important; }" });
    const words = await page.evaluate(installWords, COMPOUNDS);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Page.enable");
    const failures: string[] = [];
    const ran: string[] = [];
    const notes = [`${words} words made long`];
    const truncating = new Set<string>();
    for (const size of SIZES) {
      await cdp.send("Page.setFontSizes", { fontSizes: { standard: size, fixed: Math.round((size * 13) / 16) } });
      for (const width of WIDTHS) {
        const at = `${width}px ${size}px`;
        ran.push(at);
        await page.setViewportSize({ width, height: 720 });
        await settle(page);
        const before = await page.evaluate(measureWords);
        await page.evaluate(() => (window as unknown as { __lanesWords: (on: boolean) => void }).__lanesWords(true));
        await settle(page);
        const fits = before.scrollWidth <= before.clientWidth + 1;
        const after = await page.evaluate(measureWords);
        await page.evaluate(() => (window as unknown as { __lanesWords: (on: boolean) => void }).__lanesWords(false));
        if (!fits && !RESPONSIVE.includes(example.name)) notes.push(`${at}: ${before.scrollWidth} px wide on a ${before.clientWidth} px screen without the words`);
        if (after.scrollWidth > after.clientWidth + 1) {
          const why = `${after.scrollWidth} px on ${after.clientWidth}: ${after.widest.join("; ") || "?"}`;
          if (!RESPONSIVE.includes(example.name)) notes.push(`${at}: wider than the screen with the words (${why})`);
          else failures.push(`[${at}] the page is wider than the screen (${why})${fits ? "" : ", without the words too"}`);
        }
        // The same element failing the same way before the words went in.
        const kind = (line: string) => line.replace(/ "[^"]*"/, "").replace(/\d+ px/g, "N px");
        const already = new Set(before.out.map(kind));
        for (const o of after.out) failures.push(`[${at}] ${o}${already.has(kind(o)) ? " (without the words too)" : ""}`);
        for (const t of after.truncated) truncating.add(t);
      }
    }
    await cdp.send("Page.setFontSizes", { fontSizes: { standard: 16, fixed: 13 } });
    if (truncating.size) notes.push(`cut short with an ellipsis: ${[...truncating].join(", ")}`);
    info.annotations.push({ type: "measured", description: notes.join("; ") });
    // One line per piece of text, with every condition it fails under.
    const lines = new Map<string, { first: string; conds: string[] }>();
    for (const f of failures) {
      const [, cond, rest] = f.match(/^\[([^\]]*)\] (.*)$/)!;
      const key = rest!.replace(/\d+ px/g, "N px");
      const seen = lines.get(key);
      if (seen) seen.conds.push(cond!);
      else lines.set(key, { first: rest!, conds: [cond!] });
    }
    const merged = [...lines.values()].map(({ first, conds }) => `[${conds.join(", ")}] ${first}`);
    expectNone(triage(info, "long-words", id(example), merged, ran), `${id(example)}: long words at 320 and 360 px`);
  });
}
