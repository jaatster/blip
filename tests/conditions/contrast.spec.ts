/**
 * Lane 1, contrast as rendered. Every example in Day, Sunset and Night: each run of text against the pixels actually
 * under its glyphs (the glyphs hidden and the page shot again), at rest, with every control forced to hover, focus,
 * active and visited (data-chu-state), and with real keyboard focus on each selected, current, pressed or checked
 * control. Text needs 4.5:1, large text 3:1 (24 px, or 18.66 px bold; Pixel Bop counts as bold). Outlined and haloed
 * text (POP, OUTLINE) is measured against its outline. And the two cues of a value: a progress bar's, a meter's or
 * a rating's filled part against its empty part, 3:1 or more in lightness alone (greyscale).
 */
import { test, type Page } from "@playwright/test";
import { examples, id } from "../page/manifest.js";
import { contrast } from "./lib/colour.js";
import { expectNone, triage } from "./lib/known.js";
import { fitViewport, open, SCHEMES, settle } from "./lib/open.js";
import { at, decode, hex, mode } from "./lib/png.js";
import { collectRuns, describe as line, fails, measure, type Measured } from "./lib/text.js";

const STATES = ["hover", "focus", "active", "visited"] as const;

for (const example of examples) {
  test(`${id(example)}`, async ({ page }, info) => {
    // One load: the scheme switches in place (every colour is a role, and the world redraws when it changes).
    await open(page, example, { scheme: SCHEMES[0] });
    const { width } = await fitViewport(page, 1280);
    // One line per failure, with every condition it fails under.
    const failures = new Map<string, { text: string; conditions: string[] }>();
    const add = (condition: string, found: [string, string][]) => {
      for (const [key, text] of found) {
        const seen = failures.get(key);
        if (seen) seen.conditions.push(condition);
        else failures.set(key, { text, conditions: [condition] });
      }
    };
    const keyed = (m: Measured): [string, string] => [`${m.where}|${m.text}|${m.fg}|${m.backdrop}`, line(m)];
    const ran: string[] = [];
    const notes: string[] = [];
    let lowest: Measured | undefined;

    for (const scheme of SCHEMES) {
      if (scheme !== SCHEMES[0]) {
        await page.evaluate((s) => (document.documentElement.dataset.chuScheme = s), scheme);
        await settle(page);
      }
      ran.push(scheme, ...STATES.map((s) => `${scheme} ${s}`), `${scheme} keyboard focus`, `${scheme} two cues`);
      let measured = 0;
      const check = async (condition: string, within?: string) => {
        const all = await measure(page, await collectRuns(page, "#example", within));
        measured += all.length;
        for (const m of all) if (!lowest || m.ratio < lowest.ratio) lowest = m;
        add(condition, all.filter(fails).map(keyed));
      };

      // At rest.
      await check(scheme);
      // Every control forced into each state at once.
      for (const state of STATES) {
        if (!(await force(page, state))) continue;
        await check(`${scheme} ${state}`, "[data-lanes-was]");
        await unforce(page);
      }
      // Real keyboard focus on what is on.
      const focused = await selectedFocus(page, width);
      add(`${scheme} keyboard focus`, focused.failures);
      // Filled against empty.
      const cues = await twoCues(page);
      add(`${scheme} two cues`, cues.failures.map((f) => [f, f]));
      notes.push(`${scheme}: ${measured} runs of text in ${STATES.length + 1} states, ${focused.count} controls with keyboard focus, ${cues.count} filled and empty parts`);
    }

    info.annotations.push({ type: "measured", description: `${notes.join("; ")}${lowest ? `; lowest ${lowest.ratio.toFixed(2)}:1, ${line(lowest)}` : ""}` });
    const lines = [...failures.values()].map(({ text, conditions }) => `[${conditions.join(", ")}] ${text}`);
    expectNone(triage(info, "contrast", id(example), lines, ran), `${id(example)}: text or a value below its contrast`);
  });
}

/** Adds a state to every interactive element's data-chu-state; returns how many took it. */
async function force(page: Page, state: (typeof STATES)[number]): Promise<number> {
  return page.evaluate((state) => {
    const root = document.getElementById("example")!;
    const selector = state === "visited"
      ? "a[href]"
      : ".chu-box:is(button, a[href], summary, label, [role='button'], [role='tab'], [role='menuitem'], [role='option'], [data-chu-interactive]), a[href], button, summary, [role='button'], [role='tab'], [role='menuitem'], [role='menuitemradio'], [role='menuitemcheckbox'], [role='option'], [data-chu-interactive], .chu-box:has(> :is(input, select, textarea))";
    let n = 0;
    for (const el of root.querySelectorAll<HTMLElement>(selector)) {
      if (el.matches(":disabled, [aria-disabled='true']")) continue;
      el.dataset.lanesWas = el.getAttribute("data-chu-state") ?? "\u0000";
      el.setAttribute("data-chu-state", `${el.getAttribute("data-chu-state") ?? ""} ${state}`.trim());
      n++;
    }
    return n;
  }, state);
}

async function unforce(page: Page): Promise<void> {
  await page.evaluate(() => {
    for (const el of document.querySelectorAll<HTMLElement>("[data-lanes-was]")) {
      if (el.dataset.lanesWas === "\u0000") el.removeAttribute("data-chu-state");
      else el.setAttribute("data-chu-state", el.dataset.lanesWas!);
      delete el.dataset.lanesWas;
    }
  });
}

/** Keyboard focus on each selected, current, pressed or checked control that has a label, one at a time: its label
    against what is under it. */
async function selectedFocus(page: Page, width: number): Promise<{ count: number; failures: [string, string][] }> {
  const count = await page.evaluate(() => {
    const root = document.getElementById("example")!;
    const on = "[aria-selected='true'], [aria-current]:not([aria-current='false']), [aria-pressed='true'], [aria-checked='true']";
    const focusable = "button, a[href], [tabindex], summary, [role='tab'], [role='option'], [role='menuitemradio'], [role='menuitemcheckbox']";
    const els = [...root.querySelectorAll<HTMLElement>(on)].filter((e) => e.matches(focusable) && !e.matches(":disabled, [aria-disabled='true']") && e.checkVisibility() && e.textContent!.trim());
    els.forEach((e, i) => (e.dataset.lanesOn = String(i)));
    return els.length;
  });
  const out: [string, string][] = [];
  for (let i = 0; i < count; i++) {
    const sel = `[data-lanes-on="${i}"]`;
    await page.keyboard.press("Shift");
    const box = await page.evaluate((sel) => {
      const el = document.querySelector<HTMLElement>(sel)!;
      el.focus({ preventScroll: true });
      const r = el.getBoundingClientRect();
      return { focused: document.activeElement === el, visible: el.matches(":focus-visible"), x: r.x, y: r.y, w: r.width, h: r.height };
    }, sel);
    // Not focusable itself (an option in a listbox the input drives with aria-activedescendant): nothing to test.
    if (!box.focused) continue;
    if (!box.visible) {
      out.push([`focus|${sel}`, `${sel}: did not take keyboard focus (no :focus-visible)`]);
      continue;
    }
    const x = Math.max(0, Math.floor(box.x) - 8), y = Math.max(0, Math.floor(box.y) - 8);
    const clip = { x, y, width: Math.min(width - x, Math.ceil(box.w) + 16), height: Math.ceil(box.h) + 16 };
    const runs = await collectRuns(page, sel);
    for (const m of (await measure(page, runs, clip)).filter(fails)) out.push([`${m.where}|${m.text}|${m.fg}|${m.backdrop}`, line(m)]);
  }
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  return { count, failures: out };
}

/** Progress bars, meters and ratings that are part full: the filled part against the empty part, in lightness. */
async function twoCues(page: Page): Promise<{ count: number; failures: string[] }> {
  const parts = await page.evaluate(() => {
    const root = document.getElementById("example")!;
    const out: { what: string; kind: "bar" | "cells"; x: number; y: number; w: number; h: number; f: number; cells: number; rtl: boolean }[] = [];
    for (const el of root.querySelectorAll<HTMLProgressElement | HTMLMeterElement>(".chu-progress > progress, .chu-meter > meter")) {
      if (!el.checkVisibility() || (el instanceof HTMLProgressElement && el.position < 0)) continue;
      const min = el instanceof HTMLMeterElement ? el.min : 0;
      const f = (el.value - min) / (el.max - min);
      if (f <= 0.05 || f >= 0.95) continue;
      const r = el.getBoundingClientRect();
      out.push({ what: `${el.tagName.toLowerCase()} "${el.getAttribute("aria-label") ?? el.labels?.[0]?.textContent ?? el.textContent!.trim()}" (${Math.round(f * 100)}%)`, kind: "bar", x: r.x, y: r.y, w: r.width, h: r.height, f, cells: 0, rtl: getComputedStyle(el).direction === "rtl" });
    }
    for (const el of root.querySelectorAll<HTMLElement>(".chu-rating")) {
      if (!el.checkVisibility()) continue;
      const cs = getComputedStyle(el);
      const value = parseFloat(cs.getPropertyValue("--chu-rating-value")), max = parseFloat(cs.getPropertyValue("--chu-rating-max"));
      if (!(value >= 1 && value <= max - 1)) continue;
      const r = el.getBoundingClientRect();
      out.push({ what: `rating "${el.getAttribute("aria-label") ?? el.getAttribute("aria-labelledby") ?? ""}" (${value} of ${max})`, kind: "cells", x: r.x, y: r.y, w: r.width, h: r.height, f: value / max, cells: max, rtl: cs.direction === "rtl" });
    }
    return out;
  });
  if (!parts.length) return { count: 0, failures: [] };
  const img = decode(await page.screenshot({ animations: "disabled" }));
  const dpr = await page.evaluate(() => devicePixelRatio);
  const out: string[] = [];
  for (const p of parts) {
    const X = (x: number) => Math.round(x * dpr), Y = Math.round((p.y + p.h / 2) * dpr);
    if (p.kind === "bar") {
      // The middle of the filled part and of the empty part, a few pixels wide (the gaps between blocks are thin).
      const side = (t: number) => (p.rtl ? p.x + p.w * (1 - t) : p.x + p.w * t);
      const filled = mode(img, X(side(p.f / 2)) - 4, Y - 1, X(side(p.f / 2)) + 4, Y + 1)!;
      const empty = mode(img, X(side((1 + p.f) / 2)) - 4, Y - 1, X(side((1 + p.f) / 2)) + 4, Y + 1)!;
      const k = contrast(filled, empty);
      if (k < 3) out.push(`${p.what}: filled ${hex(filled)} against empty ${hex(empty)}, ${k.toFixed(2)}:1 in lightness (needs 3:1)`);
    } else {
      // The first star (full) against the last (empty), pixel for pixel: some part of the shape must differ by 3:1.
      const cw = p.w / p.cells;
      const first = p.rtl ? p.x + p.w - cw : p.x, last = p.rtl ? p.x : p.x + p.w - cw;
      const pairs = new Map<string, number>();
      let differing = 0;
      for (let y = Math.round(p.y * dpr); y < Math.round((p.y + p.h) * dpr); y++) {
        for (let dx = 0; dx < Math.floor(cw * dpr); dx++) {
          const a = at(img, X(first) + dx, y), b = at(img, X(last) + dx, y);
          if (a === b) continue;
          differing++;
          const key = `${a},${b}`;
          pairs.set(key, (pairs.get(key) ?? 0) + 1);
        }
      }
      const best = [...pairs].filter(([, n]) => n / differing >= 0.15).map(([k]) => { const [a, b] = k.split(",").map(Number); return { a: a!, b: b!, k: contrast(a!, b!) }; }).sort((u, v) => v.k - u.k)[0];
      if (!best || best.k < 3) out.push(`${p.what}: a full star against an empty one differs by at most ${best ? `${best.k.toFixed(2)}:1 (${hex(best.a)} against ${hex(best.b)})` : "nothing"} in lightness (needs 3:1)`);
    }
  }
  return { count: parts.length, failures: out };
}
