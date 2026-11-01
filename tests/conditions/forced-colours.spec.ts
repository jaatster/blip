/**
 * Lane 3, forced colours (Windows high contrast), in its dark and its light theme. Every control in every example that
 * is on (pressed, selected, current or checked) must look different from the same control off: it is shot as it is,
 * switched off (aria-pressed, aria-selected and aria-checked to "false", aria-current removed, a checkbox or radio
 * unchecked) and shot again, and at least 2% of its pixels (and 12 or more) must change. The bands and the sunk face
 * that show "on" are gone in forced colours, so on needs a cue of its own (the system highlight). And a busy control
 * must look different from the same control not busy, and one whose label it hides must show a cue in its place (its
 * stepped dots), not an empty box.
 */
import { test, type Page } from "@playwright/test";
import { examples, id } from "../page/manifest.js";
import { expectNone, triage } from "./lib/known.js";
import { fitViewport, open, settle } from "./lib/open.js";
import { at, decode, distance, mode } from "./lib/png.js";

const THEMES = ["dark", "light"] as const;

for (const example of examples) {
  test(`${id(example)}`, async ({ page }, info) => {
    // One load: forced colours and the theme switch in place (Playwright's media emulation).
    await page.emulateMedia({ forcedColors: "active", colorScheme: THEMES[0] });
    await open(page, example, { scheme: "day" });
    const { width, height } = await fitViewport(page, 1280);
    const all: string[] = [];
    const summary: string[] = [];
    for (const theme of THEMES) {
      await page.emulateMedia({ forcedColors: "active", colorScheme: theme });
      await settle(page);
      const failures: string[] = [];
      const notes: string[] = [];
      const on = await onControls(page);
      let compared = 0;
      for (const c of on) {
        const clip = clipOf(c.rect, width, height);
        if (!clip) continue;
        const a = decode(await page.screenshot({ clip, animations: "disabled", caret: "hide" }));
        const switched = await page.evaluate((i) => (window as unknown as { __lanesOff: (i: number) => boolean }).__lanesOff(i), c.i);
        if (!switched) {
          notes.push(`${c.where}: its element turned it back on, so it was not compared`);
          continue;
        }
        const b = decode(await page.screenshot({ clip, animations: "disabled", caret: "hide" }));
        await page.evaluate((i) => (window as unknown as { __lanesOn: (i: number) => void }).__lanesOn(i), c.i);
        compared++;
        let changed = 0;
        for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) if (distance(at(a, x, y), at(b, x, y)) >= 48) changed++;
        const area = a.width * a.height;
        if (changed < Math.max(12, area * 0.02)) failures.push(`[${theme}] ${c.where} (${c.state}): looks the same on and off (${changed} of ${area} pixels change)`);
      }
      // Busy controls: busy must look different from not busy, and a label it hides needs a cue in its place.
      const busy = await busyControls(page);
      for (const c of busy) {
        const clip = clipOf(c.rect, width, height);
        if (!clip) continue;
        const a = decode(await page.screenshot({ clip, animations: "disabled", caret: "hide" }));
        await page.evaluate((i) => document.querySelector(`[data-lanes-busy="${i}"]`)!.removeAttribute("aria-busy"), c.i);
        const b = decode(await page.screenshot({ clip, animations: "disabled", caret: "hide" }));
        await page.evaluate((i) => document.querySelector(`[data-lanes-busy="${i}"]`)!.setAttribute("aria-busy", "true"), c.i);
        let changed = 0;
        for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) if (distance(at(a, x, y), at(b, x, y)) >= 48) changed++;
        if (changed < Math.max(12, a.width * a.height * 0.02)) failures.push(`[${theme}] ${c.where} (aria-busy): looks the same busy and not busy (${changed} of ${a.width * a.height} pixels change)`);
        if (!c.hidden) continue;
        // Its label is hidden: inside its edge (3 px in), something other than its ground must show.
        const inner = { x: 5, y: 5, w: a.width - 10, h: a.height - 10 };
        const ground = mode(a, inner.x, inner.y, inner.x + inner.w, inner.y + inner.h)!;
        let marks = 0;
        for (let y = inner.y; y < inner.y + inner.h; y++) for (let x = inner.x; x < inner.x + inner.w; x++) if (distance(at(a, x, y), ground) >= 48) marks++;
        if (marks < 8) failures.push(`[${theme}] ${c.where} (aria-busy): its label is hidden and nothing shows in its place (${marks} marked pixels)`);
      }
      summary.push(`${theme}: ${compared} of ${on.length} on controls compared with off, ${busy.length} busy controls${notes.length ? ` (${notes.join("; ")})` : ""}`);
      all.push(...failures);
    }
    info.annotations.push({ type: "measured", description: summary.join("; ") });
    expectNone(triage(info, "forced-colours", id(example), all, [...THEMES]), `${id(example)} in forced colours`);
  });
}

interface Control {
  i: number;
  where: string;
  state: string;
  rect: { x: number; y: number; w: number; h: number };
}

/** Every visible control that is on, with what switches it off and back (window.__lanesOff/__lanesOn). */
function onControls(page: Page): Promise<Control[]> {
  return page.evaluate(() => {
    const root = document.getElementById("example")!;
    const control = "button, a[href], summary, input, [tabindex], [role='button'], [role='tab'], [role='option'], [role='menuitem'], [role='menuitemradio'], [role='menuitemcheckbox'], [role='radio'], [role='checkbox'], [role='switch'], [role='treeitem'], [role='gridcell'], [role='row']";
    const name = (e: Element) => `${e.tagName.toLowerCase()}${[...e.classList].filter((c) => c.startsWith("chu-") && c !== "chu-box").slice(0, 2).map((c) => `.${c}`).join("")}`;
    const label = (e: Element) => (e.getAttribute("aria-label") ?? e.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 24);
    const found: { el: Element; box: Element; attr: string; value: string }[] = [];
    // A control that paints nothing of its own (a rating's star, a transparent radio over a drawing) shows its state
    // through what draws it, so it has no look to compare.
    const clear = (c: string) => c === "transparent" || /^rgba\([^)]*,\s*0\)$/.test(c);
    const paintsNothing = (el: Element) => {
      const own = (p?: string) => {
        const cs = getComputedStyle(el, p);
        return (p && (cs.content === "none" || cs.content === "normal")) || (cs.backgroundImage === "none" && clear(cs.backgroundColor) && parseFloat(cs.borderTopWidth) === 0 && cs.boxShadow === "none" && cs.outlineStyle === "none");
      };
      return !el.textContent!.trim() && !el.children.length && own() && own("::before") && own("::after");
    };
    for (const el of root.querySelectorAll("[aria-pressed='true'], [aria-selected='true'], [aria-current]:not([aria-current='false']), [aria-checked='true']")) {
      if (!el.matches(control) || paintsNothing(el)) continue;
      const attr = ["aria-pressed", "aria-selected", "aria-checked"].find((a) => el.getAttribute(a) === "true") ?? "aria-current";
      found.push({ el, box: el, attr, value: el.getAttribute(attr)! });
    }
    // A checked checkbox or radio drawn by a box (its own, or the one around it); one whose look a script draws
    // elsewhere (a rating's stars) has no box and is left out.
    for (const el of root.querySelectorAll<HTMLInputElement>("input:is([type='checkbox'], [type='radio']):checked")) {
      const box = el.closest(".chu-box");
      if (box && root.contains(box)) found.push({ el, box, attr: "checked", value: "" });
    }
    const out: { i: number; where: string; state: string; rect: { x: number; y: number; w: number; h: number } }[] = [];
    const undo: (() => void)[] = [];
    const redo: (() => void)[] = [];
    const kept: typeof found = [];
    found.forEach((item) => {
      const { el, box, attr, value } = item;
      // Static copies drawn for the picture are inert, but they still draw their state.
      if (!box.checkVisibility()) return;
      const r = box.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      const i = out.length;
      kept[i] = item;
      out.push({ i, where: `${name(box)}${box !== el ? ` > ${name(el)}` : ""} "${label(box.closest("label") ?? box)}"`, state: attr === "checked" ? "checked" : `${attr}=${value}`, rect: { x: r.x, y: r.y, w: r.width, h: r.height } });
      if (attr === "checked") {
        const input = el as HTMLInputElement;
        undo[i] = () => (input.checked = false);
        redo[i] = () => (input.checked = true);
      } else if (attr === "aria-current") {
        undo[i] = () => el.removeAttribute(attr);
        redo[i] = () => el.setAttribute(attr, value);
      } else {
        undo[i] = () => el.setAttribute(attr, "false");
        redo[i] = () => el.setAttribute(attr, value);
      }
    });
    const w = window as unknown as { __lanesOff: (i: number) => Promise<boolean>; __lanesOn: (i: number) => void };
    // Off, then two frames for any element that watches the attribute; false if it put the state back.
    w.__lanesOff = (i) => new Promise((resolve) => {
      undo[i]!();
      const { el, attr } = kept[i]!;
      requestAnimationFrame(() => requestAnimationFrame(() => resolve(attr === "checked" ? !(el as HTMLInputElement).checked : attr === "aria-current" ? !el.hasAttribute(attr) : el.getAttribute(attr) === "false")));
    });
    w.__lanesOn = (i) => redo[i]!();
    return out;
  });
}

/** Busy controls (aria-busy="true" on a button, a link, a tab…), and whether each hides its label (transparent text). */
function busyControls(page: Page): Promise<{ i: number; where: string; hidden: boolean; rect: { x: number; y: number; w: number; h: number } }[]> {
  return page.evaluate(() => {
    const root = document.getElementById("example")!;
    // Controls only: a region marked busy while it loads (a card of skeletons, a table) shows its own loading parts.
    return [...root.querySelectorAll<HTMLElement>(":is(button, a[href], summary, label, input, [role='button'], [role='tab'], [role='menuitem'], [role='option'], [role='switch'], [data-chu-interactive])[aria-busy='true']")]
      .filter((el) => el.checkVisibility() && el.getBoundingClientRect().width >= 8)
      .map((el, i) => {
        el.dataset.lanesBusy = String(i);
        const r = el.getBoundingClientRect();
        return {
          i,
          where: `${el.tagName.toLowerCase()}${[...el.classList].filter((c) => c.startsWith("chu-") && c !== "chu-box").slice(0, 2).map((c) => `.${c}`).join("")} "${el.textContent!.trim().slice(0, 24)}"`,
          hidden: /^rgba\([^)]*,\s*0\)$|^transparent$/.test(getComputedStyle(el).color) && !!el.textContent!.trim(),
          rect: { x: r.x, y: r.y, w: r.width, h: r.height },
        };
      });
  });
}

/** A screenshot clip round a rectangle, grown by `pad` px (shrunk when negative), inside the page. */
function clipOf(r: { x: number; y: number; w: number; h: number }, width: number, height: number, pad = 2) {
  const x = Math.max(0, Math.floor(r.x - pad)), y = Math.max(0, Math.floor(r.y - pad));
  const w = Math.min(width - x, Math.ceil(r.w + 2 * pad)), h = Math.min(height - y, Math.ceil(r.h + 2 * pad));
  return w >= 4 && h >= 4 ? { x, y, width: w, height: h } : null;
}
