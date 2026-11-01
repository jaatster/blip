/**
 * Markdown to HTML for the docs: the packages' docs/*.md are parsed with satteri (the parser Astro itself uses),
 * then dressed in Blip: tables become the table component, keys in keyboard tables become keycaps, links
 * between docs point at their pages, and code is highlighted by Shiki in colours taken from the tokens.
 */
import { markdownToHast } from "satteri";
import { createCssVariablesTheme, createHighlighter, type Highlighter } from "shiki";

// ------------------------------------------------------------------ a small hast

export type Node =
  | { type: "root"; children: Node[] }
  | { type: "element"; tagName: string; properties?: Record<string, unknown>; children: Node[] }
  | { type: "text"; value: string }
  | { type: "raw"; value: string }
  | { type: "comment"; value: string }
  | { type: string; value?: string; children?: Node[] };
type Element = { type: "element"; tagName: string; properties: Record<string, unknown>; children: Node[] };

export const el = (tagName: string, properties: Record<string, unknown> = {}, children: Node[] = []): Element => ({ type: "element", tagName, properties, children });
export const text = (value: string): Node => ({ type: "text", value });
const isEl = (n: Node | undefined, tag?: string): n is Element => !!n && n.type === "element" && (!tag || (n as Element).tagName === tag);

export function textOf(n: Node): string {
  if (n.type === "text") return (n as { value: string }).value;
  if ("children" in n && Array.isArray(n.children)) return n.children.map(textOf).join("");
  return "";
}

// ------------------------------------------------------------------ serialising

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
export const escapeHtml = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const escapeAttr = (s: string) => s.replaceAll("&", "&amp;").replaceAll('"', "&quot;");

function attrName(key: string): string {
  if (key === "className") return "class";
  if (key === "htmlFor") return "for";
  if (/^(data|aria)[A-Z]/.test(key)) return key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  return key.toLowerCase();
}

export function toHtml(n: Node): string {
  switch (n.type) {
    case "root":
      return (n as { children: Node[] }).children.map(toHtml).join("");
    case "text":
      return escapeHtml((n as { value: string }).value);
    case "raw":
      return (n as { value: string }).value;
    case "comment":
    case "doctype":
      return "";
    case "element": {
      const e = n as Element;
      let attrs = "";
      for (const [k, v] of Object.entries(e.properties ?? {})) {
        if (v === false || v === null || v === undefined) continue;
        const name = attrName(k);
        if (v === true) attrs += ` ${name}`;
        else attrs += ` ${name}="${escapeAttr(Array.isArray(v) ? v.join(" ") : String(v))}"`;
      }
      if (VOID.has(e.tagName)) return `<${e.tagName}${attrs}>`;
      return `<${e.tagName}${attrs}>${e.children.map(toHtml).join("")}</${e.tagName}>`;
    }
    default:
      return "children" in n && Array.isArray(n.children) ? n.children.map(toHtml).join("") : "";
  }
}

// ------------------------------------------------------------------ code

const theme = createCssVariablesTheme({ name: "blip", variablePrefix: "--docs-code-", fontStyle: true });
const LANGS = ["html", "css", "js", "ts", "jsx", "tsx", "json", "sh", "xml", "kotlin", "swift", "yaml"] as const;
let highlighter: Promise<Highlighter> | undefined;
const ALIAS: Record<string, string> = { javascript: "js", typescript: "ts", bash: "sh", shell: "sh", zsh: "sh", console: "sh", svg: "xml", jsonc: "json" };

/** Highlighted code as HTML: a <pre> whose colours are CSS variables, set from the tokens in docs.css. */
export async function highlight(code: string, lang = "text"): Promise<string> {
  highlighter ??= createHighlighter({ themes: [theme], langs: [...LANGS] });
  const h = await highlighter;
  const l = ALIAS[lang] ?? lang;
  const known = (LANGS as readonly string[]).includes(l);
  return h.codeToHtml(code.replace(/\n$/, ""), { lang: known ? l : "text", theme: "blip" });
}

const LANG_LABEL: Record<string, string> = { html: "HTML", css: "CSS", js: "JavaScript", ts: "TypeScript", jsx: "JSX", tsx: "TSX", json: "JSON", sh: "Shell", xml: "SVG", kotlin: "Kotlin", swift: "Swift", yaml: "YAML", text: "Text" };

/** A code block in the docs' frame: the language, a copy button (shown by script), the code. */
export async function codeBlock(code: string, lang = "text", label?: string, tall = false): Promise<string> {
  const l = ALIAS[lang] ?? lang;
  const name = label ?? LANG_LABEL[l] ?? l.toUpperCase();
  return `<figure class="chu-box docs-code"${tall ? " data-tall" : ""}><figcaption class="docs-code-bar"><span class="docs-code-lang">${escapeHtml(name)}</span><button class="chu-box chu-button docs-copy" type="button" data-variant="ghost" data-size="sm" hidden>Copy</button></figcaption>${await highlight(code, l)}</figure>`;
}

// ------------------------------------------------------------------ the docs' own transforms

export interface Heading {
  depth: number;
  id: string;
  text: string;
}
export interface Rendered {
  title: string;
  lede: string;
  html: string;
  headings: Heading[];
}
export interface RenderOptions {
  /** Maps a link found in the markdown (e.g. "alert.md", "../../components/docs/button.md#states") to a URL. */
  link?: (href: string) => string | undefined;
  /** Id prefix, so two rendered documents on one page never share an id. */
  idPrefix?: string;
  /** Keep the first heading and paragraph in the body instead of returning them apart. */
  keepIntro?: boolean;
  /** Shift every heading down by this many levels (an embedded document under the page's own h2). */
  shift?: number;
  /**
   * The component's anatomy figure (HTML), put before the list under the "Anatomy" heading, whose numbers it
   * points at. Without one, that list loses its numerals: numbers pointing at nothing help no one.
   */
  anatomy?: string | null;
}

export function slug(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[`'"’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
}

// Keys in the first column of a keyboard table become keycaps: "Shift+Tab", "Up / Down Arrow", "Ctrl+K".
const KEY = String.raw`(?:Page Up|Page Down|(?:Up|Down|Left|Right) Arrow|Arrow(?:Up|Down|Left|Right)|Shift|Tab|Enter|Return|Escape|Esc|Space|Home|End|Alt|Option|Ctrl|Control|Cmd|Meta|Backspace|Delete|Up|Down|Left|Right|F\d{1,2})`;
const COMBO = new RegExp(String.raw`\b${KEY}(?:\s?\+\s?(?:${KEY}|[A-Z0-9])\b)*`, "g");
const keycap = (k: string, size = "sm") => el("kbd", { className: ["chu-box", "chu-keycap"], dataSize: size }, [text(k.trim())]);

function keycapText(value: string): Node[] {
  const out: Node[] = [];
  let at = 0;
  for (const m of value.matchAll(COMBO)) {
    if (m.index! > at) out.push(text(value.slice(at, m.index)));
    const parts = m[0].split(/\s?\+\s?/);
    out.push(parts.length > 1 ? el("kbd", { className: ["chu-keys"] }, parts.flatMap((p, i) => (i ? [text("+"), keycap(p)] : [keycap(p)]))) : keycap(m[0]));
    at = m.index! + m[0].length;
  }
  if (at < value.length) out.push(text(value.slice(at)));
  return out;
}

function dressTable(table: Element, label: string, labelId: string | undefined, regionNames: Map<string, number>): Element {
  // On a phone the rows stack: each cell is labelled with its column's header (data-label), the first cell leads.
  table.properties = { ...table.properties, className: ["chu-table", "docs-table"], dataDensity: "compact", dataStack: true };
  const head = table.children.find((c) => isEl(c, "thead")) as Element | undefined;
  const firstHeader = head ? textOf(head).trim().split(/\s{2,}|\n/)[0] : "";
  const headCells = head ? ((head.children.find((c) => isEl(c, "tr")) as Element | undefined)?.children.filter((c) => isEl(c)) as Element[]) : [];
  const isKeys = /^keys?$/i.test(textOf(headCells?.[0] ?? text(firstHeader)).trim());
  // Each column's name as its header says it: the label a cell shows when the rows stack (none for a blank header).
  const labels = (headCells ?? []).map((th) => textOf(th).trim());
  if (head) for (const th of headCells ?? []) {
    th.properties = { ...th.properties, scope: "col" };
    // A blank header (a table's last column of notes) still needs a name for screen readers.
    if (!textOf(th).trim()) th.children = [el("span", { className: ["chu-sr-only"] }, [text("Notes")])];
  }
  const body = table.children.find((c) => isEl(c, "tbody")) as Element | undefined;
  if (body) {
    for (const row of body.children.filter((c) => isEl(c, "tr")) as Element[]) {
      const cells = row.children.filter((c) => isEl(c)) as Element[];
      cells.forEach((cell, i) => {
        if (i > 0 && labels[i]) cell.properties = { ...cell.properties, dataLabel: labels[i] };
      });
      if (isKeys && cells[0]) cells[0].children = cells[0].children.flatMap((c) => (c.type === "text" ? keycapText((c as { value: string }).value) : [c]));
      // An empty first column (a table of options with no name) reads better without an empty cell's outline.
    }
  }
  if (isKeys) table.properties.className = ["chu-table", "docs-table", "docs-keys"];
  // Each region needs a name of its own: the heading above it, numbered when one heading has several tables.
  const n = (regionNames.get(label) ?? 0) + 1;
  regionNames.set(label, n);
  const scroll = el("div", { className: ["chu-table-scroll", "docs-table-scroll"], role: "region", tabIndex: 0, ...(labelId && n === 1 ? { ariaLabelledby: labelId } : { ariaLabel: n === 1 ? label : `${label}, table ${n}` }) }, [table]);
  return el("div", { className: ["chu-box", "chu-table-frame", "docs-table-frame"] }, [scroll]);
}

export async function renderMarkdown(source: string, options: RenderOptions = {}): Promise<Rendered> {
  const body = source.replace(/^---\n[\s\S]*?\n---\n/, "");
  const tree = markdownToHast(body, { features: { gfm: true, frontmatter: false, smartPunctuation: false }, position: false }) as unknown as { type: "root"; children: Node[] };
  const prefix = options.idPrefix ?? "";
  const shift = options.shift ?? 0;

  // The title and the first paragraph: the page shows them in its own header.
  let title = "";
  let lede = "";
  if (!options.keepIntro) {
    const kids = tree.children;
    const h1 = kids.findIndex((n) => isEl(n, "h1"));
    if (h1 >= 0) {
      title = textOf(kids[h1]!).trim();
      kids.splice(h1, 1);
    }
    const p = kids.findIndex((n) => isEl(n, "p"));
    const firstH2 = kids.findIndex((n) => isEl(n, "h2"));
    if (p >= 0 && (firstH2 < 0 || p < firstH2)) {
      lede = (kids[p] as Element).children.map(toHtml).join("");
      kids.splice(p, 1);
    }
  }

  const headings: Heading[] = [];
  const used = new Set<string>();
  const codes: { node: Element; code: string; lang: string }[] = [];
  const regionNames = new Map<string, number>();
  let lastHeading: { id: string; text: string } | undefined;
  let anatomyList = false;

  const walk = (parent: { children: Node[] }) => {
    for (let i = 0; i < parent.children.length; i++) {
      const n = parent.children[i]!;
      if (n.type === "comment" || (n.type === "raw" && /^\s*<!--[\s\S]*-->\s*$/.test((n as { value: string }).value))) {
        parent.children.splice(i--, 1);
        continue;
      }
      if (!isEl(n)) continue;
      const tag = n.tagName;
      if (/^h[1-6]$/.test(tag)) {
        const depth = Number(tag[1]);
        const t = textOf(n).trim();
        let id = prefix + slug(t);
        for (let k = 2; used.has(id); k++) id = `${prefix}${slug(t)}-${k}`;
        used.add(id);
        n.properties = { ...n.properties, id };
        if (shift) n.tagName = `h${Math.min(6, depth + shift)}`;
        headings.push({ depth: depth + shift, id, text: t });
        lastHeading = { id, text: t };
        anatomyList = depth === 2 && /^anatomy$/i.test(t);
        continue;
      }
      // The first numbered list under "Anatomy": the figure goes before it, or it becomes a plain list.
      if (tag === "ol" && anatomyList) {
        anatomyList = false;
        if (options.anatomy) {
          n.properties = { ...n.properties, className: ["docs-anatomy-list"] };
          parent.children.splice(i++, 0, { type: "raw", value: options.anatomy });
        } else {
          n.tagName = "ul";
          n.properties = { ...n.properties, className: ["docs-anatomy-plain"] };
        }
      }
      if (tag === "a") {
        const href = String(n.properties?.href ?? "");
        const to = options.link?.(href);
        if (to) n.properties.href = to;
        else if (/^https?:/.test(href)) n.properties.rel = "noopener";
      }
      if (tag === "pre") {
        const code = n.children.find((c) => isEl(c, "code")) as Element | undefined;
        if (code) {
          const cls = (code.properties?.className as string[] | undefined) ?? [];
          const lang = cls.find((c) => c.startsWith("language-"))?.slice(9) ?? "text";
          codes.push({ node: n, code: textOf(code), lang });
        }
        continue;
      }
      if (tag === "table") {
        parent.children[i] = dressTable(n, lastHeading?.text ?? "Table", lastHeading?.id, regionNames);
        continue;
      }
      if (tag === "code") n.properties = { ...n.properties, className: ["docs-inline-code"] };
      walk(n);
    }
  };
  walk(tree);

  await Promise.all(
    codes.map(async (c) => {
      const html = await codeBlock(c.code, c.lang);
      Object.assign(c.node, { type: "raw", value: html, tagName: undefined, children: undefined, properties: undefined });
    }),
  );

  return { title, lede, html: toHtml(tree), headings };
}

/** Inline markdown (a table cell, a sentence from a description) to HTML. */
export async function renderInline(source: string): Promise<string> {
  const { html } = await renderMarkdown(source, { keepIntro: true });
  return html.replace(/^<p>([\s\S]*)<\/p>\s*$/, "$1");
}
