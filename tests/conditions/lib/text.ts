/**
 * Text as it renders: every visible run of text in an example (text nodes, and the values and placeholders of form
 * controls), with its colour, size and text shadows, measured against the pixels actually under its glyphs. The
 * glyphs are found by shooting the page twice, as is and with every glyph made transparent: the pixels that change
 * are the glyphs, and the second shot shows what is under them.
 */
import type { Page } from "@playwright/test";
import { contrastOver, parse, type RGBA } from "./colour.js";
import { at, decode, distance, hex, type Image } from "./png.js";

export interface Run {
  text: string;
  /** Where, in CSS px of the page (the viewport is the whole page). */
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  /** The product of every ancestor's opacity. */
  opacity: number;
  size: number;
  weight: number;
  family: string;
  /** Text shadows within a pixel of the glyph (an outline or a halo): [colour, dx, dy]. */
  ring: [string, number, number][];
  /** Any other text shadow. */
  shadow: boolean;
  disabled: boolean;
  /** Where it is: the element and the component around it. */
  where: string;
}

/** Hides every glyph (text, values, placeholders, decorations) and nothing else. */
export const HIDE_GLYPHS = `*, *::before, *::after, *::marker { -webkit-text-fill-color: transparent !important; text-shadow: none !important; caret-color: transparent !important; text-decoration-color: transparent !important; }
::placeholder { -webkit-text-fill-color: transparent !important; color: transparent !important; }`;

/**
 * Collects the runs inside `scope` (a selector; the example by default), leaving out text that something else covers
 * (a tooltip, a chip, a popover). With `within`, only runs inside elements matching it. Runs in the page.
 */
export function collectRuns(page: Page, scope = "#example", within?: string): Promise<Run[]> {
  return page.evaluate(([scope, within]) => {
    const root = document.querySelector(scope);
    if (!root) return [];
    // Hit-testing finds what is on top; overlays that ignore the pointer count too.
    const hit = document.head.appendChild(Object.assign(document.createElement("style"), { textContent: "* { pointer-events: auto !important; }" }));
    const covered = (el: Element, r: { left: number; top: number; width: number; height: number }) => {
      let hidden = 0, n = 0;
      for (const fx of [0.2, 0.5, 0.8]) for (const fy of [0.35, 0.65]) {
        const x = r.left + r.width * fx, y = r.top + r.height * fy;
        if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;
        n++;
        const top = document.elementFromPoint(x, y);
        if (top && top !== el && !el.contains(top) && !top.contains(el)) hidden++;
      }
      return n > 0 && hidden / n > 0.3;
    };
    const pixel = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--chu-pixel")) || 2;
    const out: Run[] = [];
    const visibleRect = (el: Element, r: DOMRect) => {
      let x0 = r.left, y0 = r.top, x1 = r.right, y1 = r.bottom;
      for (let a: Element | null = el; a && a !== document.documentElement; a = a.parentElement) {
        const cs = getComputedStyle(a);
        if (cs.overflowX !== "visible" || cs.clipPath !== "none") { const q = a.getBoundingClientRect(); x0 = Math.max(x0, q.left); x1 = Math.min(x1, q.right); }
        if (cs.overflowY !== "visible" || cs.clipPath !== "none") { const q = a.getBoundingClientRect(); y0 = Math.max(y0, q.top); y1 = Math.min(y1, q.bottom); }
        if (cs.position === "fixed") break;
      }
      return x1 - x0 > 2 && y1 - y0 > 2 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
    };
    const opacityOf = (el: Element) => {
      let o = 1;
      for (let a: Element | null = el; a; a = a.parentElement) o *= parseFloat(getComputedStyle(a).opacity);
      return o;
    };
    const where = (el: Element) => {
      const name = (e: Element) => `${e.tagName.toLowerCase()}${[...e.classList].filter((c) => c.startsWith("chu-") && c !== "chu-box").slice(0, 2).map((c) => `.${c}`).join("")}`;
      const parts = [name(el)];
      for (let a = el.parentElement; a && a !== root && parts.length < 3; a = a.parentElement) {
        if ([...a.classList].some((c) => c.startsWith("chu-") && c !== "chu-box")) parts.unshift(name(a));
      }
      const state = el.closest("[data-chu-state], [aria-pressed='true'], [aria-selected='true'], [aria-current]:not([aria-current='false']), [aria-checked='true']");
      return parts.join(" > ") + (state && root.contains(state) ? ` (${[...state.attributes].filter((x) => /^(data-chu-state|aria-(pressed|selected|current|checked))$/.test(x.name)).map((x) => `${x.name}=${x.value}`).join(" ")})` : "");
    };
    const shadows = (cs: CSSStyleDeclaration): { ring: [string, number, number][]; other: boolean } => {
      const ring: [string, number, number][] = [];
      let other = false;
      if (cs.textShadow === "none") return { ring, other };
      for (const m of cs.textShadow.matchAll(/(rgba?\([^)]*\)|color\([^)]*\)|#[0-9a-fA-F]+|[a-z]+)\s+(-?[\d.]+)px\s+(-?[\d.]+)px(?:\s+(-?[\d.]+)px)?/g)) {
        const dx = parseFloat(m[2]!), dy = parseFloat(m[3]!), blur = parseFloat(m[4] ?? "0");
        if (blur === 0 && Math.abs(dx) <= pixel && Math.abs(dy) <= pixel && (dx || dy)) ring.push([m[1]!, dx, dy]);
        else other = true;
      }
      return { ring, other };
    };
    const push = (el: Element, text: string, rect: DOMRect | { left: number; top: number; right: number; bottom: number; width: number; height: number }, color: string) => {
      if (rect.width < 2 || rect.height < 4) return;
      if (within && !el.closest(within)) return;
      if (covered(el, rect)) return;
      const v = visibleRect(el, rect as DOMRect);
      if (!v) return;
      const cs = getComputedStyle(el);
      const fill = cs.webkitTextFillColor;
      const { ring, other } = shadows(cs);
      out.push({
        text: text.slice(0, 40),
        ...v,
        color: fill && fill !== cs.color && !/rgba?\(0, 0, 0, 0\)/.test(fill) ? fill : color,
        opacity: opacityOf(el),
        size: parseFloat(cs.fontSize),
        weight: Number(cs.fontWeight),
        family: cs.fontFamily.split(",")[0]!.replace(/["']/g, "").trim(),
        ring,
        shadow: other,
        disabled: !!el.closest(":disabled, [aria-disabled='true']"),
        where: where(el),
      });
    };
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      const text = n.textContent!.trim();
      const el = n.parentElement;
      if (!text || !el || el.closest("script, style, template, select, option, textarea")) continue;
      if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const r of range.getClientRects()) push(el, text, r, getComputedStyle(el).color);
    }
    // What a form control shows: its value, or its placeholder while empty.
    for (const el of root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select")) {
      if (el instanceof HTMLInputElement && !/^(text|search|email|url|tel|password|number|date|time|datetime-local|month|week|submit|button|reset)$/.test(el.type)) continue;
      if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
      const shown = el instanceof HTMLSelectElement ? el.selectedOptions[0]?.textContent?.trim() ?? "" : el.value;
      const placeholder = !(el instanceof HTMLSelectElement) && !shown ? el.placeholder : "";
      if (!shown && !placeholder) continue;
      const cs = getComputedStyle(el);
      const b = el.getBoundingClientRect();
      const l = parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft), t = parseFloat(cs.borderTopWidth) + parseFloat(cs.paddingTop);
      const r = parseFloat(cs.borderRightWidth) + parseFloat(cs.paddingRight), bt = parseFloat(cs.borderBottomWidth) + parseFloat(cs.paddingBottom);
      const box = { left: b.left + l, top: b.top + t, right: b.right - r, bottom: b.bottom - bt, width: b.width - l - r, height: b.height - t - bt };
      push(el, placeholder ? `placeholder "${placeholder}"` : shown, box, placeholder ? getComputedStyle(el, "::placeholder").color : cs.color);
    }
    hit.remove();
    return out;
  }, [scope, within ?? null] as const);
}

export interface Measured extends Run {
  /** The lowest contrast against any backdrop colour under at least 15% of the glyph pixels. */
  ratio: number;
  backdrop: string;
  fg: string;
  large: boolean;
}

/** WCAG large text: 24 px, or 18.66 px bold. Pixel Bop is drawn bold (two-pixel strokes) at every scale. */
export const isLarge = (r: Run): boolean => r.size >= 24 || (r.size >= 18.66 && (r.weight >= 700 || r.family === "Pixel Bop"));

/**
 * Shoots the page (the viewport, which the caller has grown to the whole page) with and without glyphs, and measures
 * each run. `clip` limits both shots to a rectangle (CSS px).
 */
export async function measure(page: Page, runs: Run[], clip?: { x: number; y: number; width: number; height: number }): Promise<Measured[]> {
  if (!runs.length) return [];
  const shot = async () => decode(await page.screenshot({ clip, animations: "disabled", caret: "hide" }));
  const dpr = await page.evaluate(() => devicePixelRatio);
  const a = await shot();
  const style = await page.addStyleTag({ content: HIDE_GLYPHS });
  const b = await shot();
  await style.evaluate((s) => (s as HTMLStyleElement).remove());
  const ox = clip?.x ?? 0, oy = clip?.y ?? 0;
  const out: Measured[] = [];
  for (const run of runs) {
    const fg = parse(run.color);
    if (!fg) continue;
    const colour: RGBA = { ...fg, a: fg.a * run.opacity };
    if (colour.a < 0.05) continue;
    const large = isLarge(run);
    // Outlined or haloed text (POP, OUTLINE, a halo): the glyph stands on its own ring.
    if (run.ring.length) {
      let worst = Infinity, backdrop = "";
      for (const [c] of run.ring) {
        const ring = parse(c);
        if (!ring || ring.a < 1) continue;
        const k = contrastOver(colour, (Math.round(ring.r) << 16) | (Math.round(ring.g) << 8) | Math.round(ring.b));
        if (k < worst) [worst, backdrop] = [k, c];
      }
      if (worst < Infinity) out.push({ ...run, ratio: worst, backdrop: `${backdrop} (its outline)`, fg: run.color, large });
      continue;
    }
    const hist = new Map<number, number>();
    let total = 0;
    const x0 = Math.max(0, Math.floor((run.x - ox) * dpr)), y0 = Math.max(0, Math.floor((run.y - oy) * dpr));
    const x1 = Math.min(a.width, Math.ceil((run.x - ox + run.w) * dpr)), y1 = Math.min(a.height, Math.ceil((run.y - oy + run.h) * dpr));
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const under = at(b, x, y), shown = at(a, x, y);
        if (distance(shown, under) < 24) continue;
        // Only this run's own glyph pixels: a mix of its colour and what is under it. Text covered by something
        // else (a chip, a tooltip, another run) shows other colours there, and is left out.
        if (!onSegment(shown, under, colour)) continue;
        hist.set(under, (hist.get(under) ?? 0) + 1);
        total++;
      }
    }
    if (total < 4) continue;
    let worst = Infinity, backdrop = 0;
    for (const [c, n] of hist) {
      if (n / total < 0.15) continue;
      const k = contrastOver(colour, c);
      if (k < worst) [worst, backdrop] = [k, c];
    }
    if (worst < Infinity) out.push({ ...run, ratio: worst, backdrop: hex(backdrop), fg: run.color, large });
  }
  return out;
}

/** Whether a shown pixel is a mix of the text colour (laid over the backdrop) and the backdrop: an antialiased
    glyph pixel of that text. */
function onSegment(shown: number, under: number, fg: RGBA): boolean {
  const u = [(under >> 16) & 255, (under >> 8) & 255, under & 255];
  const f = [fg.r * fg.a + u[0]! * (1 - fg.a), fg.g * fg.a + u[1]! * (1 - fg.a), fg.b * fg.a + u[2]! * (1 - fg.a)];
  const s = [(shown >> 16) & 255, (shown >> 8) & 255, shown & 255];
  const d = f.map((v, i) => v - u[i]!), w = s.map((v, i) => v - u[i]!);
  const len = d[0]! ** 2 + d[1]! ** 2 + d[2]! ** 2;
  const t = len ? Math.min(1, Math.max(0, (w[0]! * d[0]! + w[1]! * d[1]! + w[2]! * d[2]!) / len)) : 0;
  return Math.hypot(w[0]! - t * d[0]!, w[1]! - t * d[1]!, w[2]! - t * d[2]!) <= 28;
}

/** A failing measurement as one line (without its condition): what, where, the colours, the ratio and the threshold. */
export const describe = (m: Measured): string =>
  `${m.where} "${m.text}"${m.disabled ? " (disabled)" : ""}: ${m.fg}${m.opacity < 1 ? ` at opacity ${m.opacity.toFixed(2)}` : ""} on ${m.backdrop}, ${m.ratio.toFixed(2)}:1 (needs ${m.large ? 3 : 4.5}:1, ${m.size}px ${m.weight}${m.family === "Pixel Bop" ? " Pixel Bop" : ""})`;

export const fails = (m: Measured): boolean => m.ratio < (m.large ? 3 : 4.5);

export type { Image };
