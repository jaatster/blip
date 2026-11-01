/**
 * Long words for the long-words lane: German compounds put into an example's text, and what then sticks out of its
 * box. Both run in the page (each function is self-contained).
 */

/** Real German UI words, 13 to 26 letters (18 on average), with no ß (it upper-cases to SS). */
export const COMPOUNDS = [
  "Einstellungen", "Benachrichtigungen", "Spielstandverwaltung", "Datenschutzeinstellungen", "Bestenlistenübersicht",
  "Freundschaftsanfragen", "Zahlungsinformationen", "Kontoverwaltung", "Netzwerkfehler", "Barrierefreiheit",
  "Tastaturbelegung", "Fortschrittsanzeige", "Speicherplatz", "Erfolgsmeldung", "Sicherheitsprüfung",
  "Geschwindigkeitsbegrenzung",
];

/**
 * Installs window.__lanesWords(on): with on, every word of six letters or more in the example's text (not code or
 * keycaps) becomes a German compound, chosen by the word and in its case, and data-pop follows its element's text;
 * with off, the original text comes back. Returns how many words it swaps.
 */
export function installWords(compounds: string[]): number {
  const root = document.getElementById("example")!;
  const texts: [Text, string, string][] = [];
  const pick = (w: string) => {
    let h = 0;
    for (const c of w.toLowerCase()) h = (h * 31 + c.codePointAt(0)!) >>> 0;
    const c = compounds[h % compounds.length]!;
    if (w === w.toUpperCase()) return c.toUpperCase();
    return w[0] === w[0]!.toUpperCase() ? c : c.toLowerCase();
  };
  let words = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    if (n.parentElement?.closest("script, style, template, code, pre, kbd, samp")) continue;
    const swapped = n.data.replace(/\p{L}{6,}/gu, (w) => (words++, pick(w)));
    if (swapped !== n.data) texts.push([n, n.data, swapped]);
  }
  const pops = [...root.querySelectorAll<HTMLElement>("[data-pop]")].map((el) => [el, el.dataset.pop!] as const);
  (window as unknown as { __lanesWords: (on: boolean) => void }).__lanesWords = (on: boolean) => {
    for (const [n, before, after] of texts) n.data = on ? after : before;
    for (const [el, before] of pops) el.dataset.pop = on ? el.textContent!.trim() : before;
  };
  return words;
}

export interface Measured {
  scrollWidth: number;
  clientWidth: number;
  /** What reaches furthest past the screen's right edge (outside scrollers), outermost first. */
  widest: string[];
  /** Text that sticks out of its box, or is cut off without an ellipsis. */
  out: string[];
  /** Components that truncate text with an ellipsis (allowed: deliberate). */
  truncated: string[];
}

/**
 * Every visible run of text in the example: does it stay inside its box? Its box is the nearest box that holds its
 * line (a block, flex, grid or table cell box) and every candy box around it (inset by the box's outline pixel;
 * a line whose middle falls outside one is out of it vertically too), up to the first box taken out of the flow (a
 * badge over a corner, a chip, a tooltip sits where it is put). Only the innermost box a run leaves is reported. Text
 * in a sideways scroller scrolls; text cut short with text-overflow: ellipsis is deliberate (listed); visually hidden
 * text (clip-path: inset(50%), .pp-sr-only) does not count. Past the screen is the page's width, measured apart.
 */
export function measureWords(): Measured {
  const root = document.getElementById("example")!;
  const html = document.documentElement;
  const out = new Set<string>();
  const truncated = new Set<string>();
  const name = (e: Element) => `${e.tagName.toLowerCase()}${[...e.classList].filter((c) => c.startsWith("pp-") && c !== "pp-box").slice(0, 2).map((c) => `.${c}`).join("")}`;
  const component = (e: Element) => {
    const c = e.parentElement?.closest("[class*='pp-']");
    return c ? ` in ${name(c)}` : "";
  };
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    const text = n.data.trim();
    const el = n.parentElement;
    if (!text || !el || el.closest("script, style, template, select, textarea")) continue;
    if (!el.checkVisibility({ visibilityProperty: true })) continue;
    const chain: Element[] = [];
    let hidden = false;
    for (let a: Element | null = el; a && a !== root.parentElement; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.clipPath.startsWith("inset(50%") || a.classList.contains("pp-sr-only")) { hidden = true; break; }
      chain.push(a);
      if (/absolute|fixed/.test(cs.position)) break;
    }
    if (hidden) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) {
      if (r.width < 1) continue;
      const mid = (r.top + r.bottom) / 2;
      const what = `${name(el)}${component(el)} "${text.slice(0, 24)}"`;
      let formatting = true;
      for (const a of chain) {
        const cs = getComputedStyle(a);
        const b = a.getBoundingClientRect();
        const clips = /hidden|clip/.test(cs.overflowX), scrolls = /auto|scroll/.test(cs.overflowX);
        const box = a.classList.contains("pp-box");
        const p = box ? parseFloat(cs.getPropertyValue("--pp-pixel")) || 2 : 0;
        const over = Math.max(b.left + p - r.left, r.right - (b.right - p));
        const holds = formatting && !["inline", "contents"].includes(cs.display);
        if (holds) formatting = false;
        if ((holds || box || (a !== el && (clips || scrolls))) && over > (box ? 0.5 : 1)) {
          if (scrolls) break;
          if (clips && cs.textOverflow === "ellipsis") { truncated.add(name(a) + component(a)); break; }
          out.add(`${what} runs ${Math.round(over)} px out of the side of ${a === el ? "its own box" : name(a)} (${Math.round(b.width)} px wide)${clips ? ", cut off with no ellipsis" : ""}`);
          break;
        }
        if (box && (mid < b.top + p || mid > b.bottom - p)) {
          out.add(`${what} falls out of the ${mid < b.top + p ? "top" : "bottom"} of ${a === el ? "its own box" : name(a)} (${Math.round(b.height)} px high)`);
          break;
        }
        if (a !== el && scrolls) break;
      }
    }
  }
  // What makes the page wide: the outermost boxes past the right edge, not inside a scroller or a clip.
  const vw = html.clientWidth;
  const widest: { right: number; what: string }[] = [];
  for (const el of root.querySelectorAll("*")) {
    const r = el.getBoundingClientRect();
    if (r.right <= vw + 1 || r.width < 1) continue;
    let inside = false;
    for (let a = el.parentElement; a && a !== html; a = a.parentElement) {
      if (getComputedStyle(a).overflowX !== "visible") { inside = true; break; }
      if (a !== root && a.getBoundingClientRect().right > vw + 1) { inside = true; break; }
    }
    if (!inside) widest.push({ right: r.right, what: `${name(el)}${component(el)} (${Math.round(r.right - vw)} px past)` });
  }
  widest.sort((a, b) => b.right - a.right);
  return { scrollWidth: html.scrollWidth, clientWidth: vw, widest: widest.slice(0, 3).map((w) => w.what), out: [...out], truncated: [...truncated] };
}
