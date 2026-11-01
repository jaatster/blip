/**
 * Lane 2, seams at fractional ratios. Every candy box of every example (Day), shot alone (glyphs, pictures, controls
 * and every other element's paint made invisible) on one page switched between device pixel ratios. At 1.25, 1.5,
 * 1.75 and 2.625 (and 1.5 again with the example moved one CSS px right and down, so every box also sits on an odd
 * position), no pixel may blend where the box at 1x is one colour all round it: a seam, where two of its layers meet
 * edge to edge. Its outer edges may be soft there; a Blip pixel spans a fraction of a screen pixel. At 1x, 2x
 * and 3x every pixel lands whole: no device pixel of a box is a colour it does not show at the other whole ratios.
 * The box stream's definitions, and how a box is told from what shows behind it: lib/seams.ts. A failure says
 * whether its seams are faint (under 1.15:1) or visible.
 */
import { test, type Page } from "@playwright/test";
import { examples, id } from "../page/manifest.js";
import { expectNone, triage } from "./lib/known.js";
import { fitViewport, open } from "./lib/open.js";
import { blends, BOXES_ONLY, clipFor, collectBoxes, faint, ownersAt1x, paletteOf, seams, shootAt, type Found, type Render } from "./lib/seams.js";

/** Fractional ratios, each [ratio, moved one CSS px right and down]. */
const FRACTIONAL: [number, boolean][] = [[1.25, false], [1.5, false], [1.75, false], [2.625, false], [1.5, true]];

for (const example of examples) {
  test(`${id(example)}`, async ({ page }, info) => {
    await open(page, example, { scheme: "day" });
    const viewport = await fitViewport(page, 1280);
    await page.addStyleTag({ content: BOXES_ONLY });
    const boxes = await collectBoxes(page);
    const clip = clipFor(boxes, viewport.width, viewport.height);
    if (!clip) {
      info.annotations.push({ type: "measured", description: "no candy boxes" });
      return;
    }
    const cdp = await page.context().newCDPSession(page);
    const shoot = (dpr: number) => shootAt(page, cdp, viewport, dpr, clip);
    // Per box and kind (blends at whole ratios, seams at fractional ones): the conditions it fails under, and how.
    const failures = new Map<string, { i: number; kind: "blends" | "seams"; conditions: string[]; found: string[]; faint: boolean }>();
    const stats: string[] = [];
    const hex = (c: number) => `#${c.toString(16).padStart(6, "0")}`;
    const note = (condition: string, found: Found[], kind: "blends" | "seams") => {
      let checked = 0, bad = 0;
      found.forEach((f, i) => {
        checked += f.checked;
        const n = kind === "seams" ? f.seams : f.blended;
        bad += n;
        if (!n) return;
        const entry = failures.get(`${kind} ${i}`) ?? { i, kind, conditions: [], found: [], faint: true };
        entry.conditions.push(condition);
        entry.faint &&= kind === "seams" && faint(f.worst);
        const at = f.first!.map((v) => v.toFixed(1)).join(", ");
        entry.found.push(`${condition}: ${n} pixel${n === 1 ? "" : "s"} (first at ${at}${f.worst ? `, ${hex(f.worst.colour)} in ${hex(f.worst.around)}, ${f.worst.contrast.toFixed(2)}:1` : ""})`);
        failures.set(`${kind} ${i}`, entry);
      });
      stats.push(`${condition}: ${checked} px, ${bad} ${kind === "seams" ? "seam" : "blended"}`);
    };

    const one = await shoot(1);
    one.owner = await ownersAt1x(page, cdp, one, clip);
    const two = await shoot(2);
    const three = await shoot(3);
    const ideal = boxes.map((_, i) => paletteOf(one, i));
    const renders: [string, Render][] = [["1x", one], ["2x", two], ["3x", three]];
    sameBoxes(one, two, three);
    // Whole ratios: nothing off the palette the box shows at the others.
    const atTwo = boxes.map((_, i) => paletteOf(two, i));
    note("1x", boxes.map((_, i) => blends(one, i, atTwo[i]!)), "blends");
    note("2x", boxes.map((_, i) => blends(two, i, ideal[i]!)), "blends");
    note("3x", boxes.map((_, i) => blends(three, i, ideal[i]!)), "blends");
    // Fractional ratios: no seams.
    for (const [dpr, moved] of FRACTIONAL) {
      if (moved) await move(page);
      const r = await shoot(dpr);
      sameBoxes(one, r);
      const condition = `${dpr}x${moved ? " odd" : ""}`;
      renders.push([condition, r]);
      note(condition, boxes.map((_, i) => seams(r, one, i, ideal[i]!)), "seams");
    }

    info.annotations.push({ type: "measured", description: `${boxes.length} boxes; ${stats.join("; ")}` });
    const lines = [...failures.values()].map(({ i, kind, conditions, found, faint }) => {
      const b = one.boxes[i]!;
      return `[${conditions.join(", ")}] ${kind === "seams" ? `${faint ? "faint" : "visible"} seams` : "blends"} in ${b.name}${b.context ? ` (in ${b.context})` : ""}: ${found.join("; ")}`;
    });
    const unknown = triage(info, "seams", id(example), lines, renders.map(([c]) => c));
    expectNone(unknown, `${id(example)}: boxes that blend inside or show seams`);
  });
}

/** Every shot must hold the same boxes, or the comparison means nothing. */
function sameBoxes(first: Render, ...others: Render[]): void {
  for (const r of others) {
    if (r.boxes.length !== first.boxes.length) throw new Error(`${first.boxes.length} boxes at 1x but ${r.boxes.length} at ${r.dpr}x: the layout changed with the ratio`);
  }
}

/** Moves the example one CSS px right and down without changing its width (the test page's body padding). */
async function move(page: Page): Promise<void> {
  await page.addStyleTag({ content: "body { padding: calc(12 * var(--blip-pixel) + 1px) calc(12 * var(--blip-pixel) - 1px) calc(12 * var(--blip-pixel) - 1px) calc(12 * var(--blip-pixel) + 1px) !important; }" });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}
