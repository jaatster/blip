// After the build: each page's headings (its h2 and h3 with an id, in <main>, not those inside a live example)
// go into dist/search.json, so search can find a section and open the page at it. Run by astro.config.mjs when the
// site has built; `node scripts/search-sections.mjs [dist]` runs it again on a built site.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Containers whose headings belong to an example or a demo, not to the page's outline. */
const SKIP = /\b(docs-stage|docs-code|home-hero|home-stage|home-kit-stage|tb-preview|tpl-preview)\b/;
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr", "use", "path", "rect", "circle"]);
const decode = (s) => s.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

/** The outline of one page's HTML: [id, text] for each h2 and h3 in <main>, outside examples. */
export function outline(html) {
  const a = html.indexOf("<main"), b = html.lastIndexOf("</main>");
  if (a < 0 || b < a) return [];
  // Scripts, styles and code may hold "<" that is not a tag.
  const main = html.slice(a, b).replace(/<(script|style|pre|textarea)\b[\s\S]*?<\/\1>/g, "");
  const out = [];
  const stack = []; // [tag, skipped]
  const tag = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([^>]*?)(\/?)>/g;
  for (let m; (m = tag.exec(main)); ) {
    const [, close, name0, attrs, selfClose] = m;
    const name = name0.toLowerCase();
    if (close) {
      // Close up to the matching tag (HTML may leave some open, as <p> and <li> can).
      const at = stack.map((s) => s[0]).lastIndexOf(name);
      if (at >= 0) stack.length = at;
      continue;
    }
    const skipped = (stack.at(-1)?.[1] ?? false) || SKIP.test(/\bclass="([^"]*)"/.exec(attrs)?.[1] ?? "");
    if ((name === "h2" || name === "h3") && !skipped) {
      const id = /\bid="([^"]+)"/.exec(attrs)?.[1];
      const end = main.indexOf(`</${name}>`, tag.lastIndex);
      const text = decode(main.slice(tag.lastIndex, end));
      if (id && text) out.push([id, text]);
    }
    if (!selfClose && !VOID.has(name)) stack.push([name, skipped]);
  }
  return out;
}

/** Adds every page's sections to <dist>/search.json, with the words its synonyms give a section. */
export function addSections(dist) {
  const file = join(dist, "search.json");
  if (!existsSync(file)) return;
  const data = JSON.parse(readFileSync(file, "utf8"));
  const cache = new Map();
  let pages = 0, sections = 0;
  for (const group of data.groups) {
    for (const item of group.items) {
      if (!item.url.startsWith("/") || item.url.includes("#")) continue;
      if (!cache.has(item.url)) {
        const page = join(dist, item.url, "index.html");
        cache.set(item.url, existsSync(page) ? outline(readFileSync(page, "utf8")) : []);
      }
      const list = cache.get(item.url).map(([id, text]) => {
        const extra = data.sectionWords?.[`${item.url}#${id}`];
        return extra ? [id, text, extra] : [id, text];
      });
      if (list.length) (item.sections = list), pages++, (sections += list.length);
    }
  }
  // A synonym aimed at a section that does not exist is a mistake in src/lib/search.ts.
  for (const key of Object.keys(data.sectionWords ?? {})) {
    const [url, id] = key.split("#");
    if (!(cache.get(url) ?? []).some(([x]) => x === id)) throw new Error(`docs: a search synonym points at ${key}, but that page has no heading with that id`);
  }
  writeFileSync(file, JSON.stringify(data));
  return { pages, sections };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dist = resolve(process.argv[2] ?? join(fileURLToPath(new URL("..", import.meta.url)), "dist"));
  const r = addSections(dist);
  console.log(`docs: search sections for ${r?.pages ?? 0} pages (${r?.sections ?? 0} headings)`);
}
