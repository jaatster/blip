/**
 * Each docs page (packages/<package>/docs/<name>.md) against the code it documents. CONTRACT.md makes the page, the
 * header comment of its stylesheet and its element's Custom Elements Manifest the component's public API, so they
 * must agree:
 *
 * - its front matter points at things that exist: the stylesheet, the elements, the React component;
 * - every class and part it names (`.pp-x`, or in a class attribute) is in some stylesheet, its own header comment,
 *   or the elements' source (the DOM they add);
 * - every data attribute it names is in a stylesheet or an element, and every value it gives one (`data-x="v"`, and
 *   the Values column of its tables) is one the CSS selects, its stylesheet's comments list, or its element's
 *   manifest types; a value marked "(default)" may be the absence of the attribute;
 * - its element tables list only attributes, properties and methods the manifest has, and only events its elements
 *   fire (or the elements of a page the row links to);
 * - the reverse, for what is public: every attribute, property, method and event in its elements' manifests, and
 *   every class of its own and data attribute its stylesheet's header names and its rules use, are on the page (on
 *   one of the pages, when several share a stylesheet, as the text effects share text.css).
 *
 * Left out, as they need judgement: custom properties (public-properties.json is made from the docs, so it cannot
 * check them), ARIA attributes and keys, the values of attributes the CSS only tests for presence, and whether a
 * class is used on the right element. Each test is named after its page, so `vitest run -t "components/docs/tabs.md"`
 * checks one (scripts/qa.mjs does).
 */
import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { REPO } from "../support/fixtures.ts";

const PACKAGES = join(REPO, "packages");
const read = (file: string): string => readFileSync(file, "utf8");
const walk = (dir: string, ext: string): string[] =>
  !existsSync(dir) ? [] : readdirSync(dir).sort().flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f), ext) : f.endsWith(ext) ? [join(dir, f)] : []));
const rel = (file: string): string => file.slice(REPO.length).replace(/\\/g, "/").replace(/^\//, "");
const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const word = (name: string): RegExp => new RegExp(`(?<![\\w-])${esc(name)}(?![\\w-])`);

// A class or attribute name: no wildcards (`.pp-card-*`, `data-pp-*`) and no placeholders (`pp-r-N`).
const CLASS = /(?<![\w-])\.(pp-[a-z0-9-]*[a-z0-9])(?![\w*-])/g;
const ATTR = /(?<![\w-])(data-[a-z0-9-]*[a-z0-9])(?![\w*-])/g;
const classesIn = (text: string): Set<string> => {
  const found = new Set([...text.matchAll(CLASS)].map((m) => m[1]!));
  for (const m of text.matchAll(/class(?:Name)?="([^"]*)"/g)) for (const c of m[1]!.split(/\s+/)) if (/^pp-[a-z0-9-]*[a-z0-9]$/.test(c)) found.add(c);
  return found;
};
const attrsIn = (text: string): Set<string> => new Set([...text.matchAll(ATTR)].map((m) => m[1]!));

// The code: every package's stylesheets (and the font's), the elements' sources, the manifests and the React exports.
const owners = readdirSync(PACKAGES).filter((p) => existsSync(join(PACKAGES, p, "package.json")) && !["react", "tokens"].includes(p));
const cssFiles = [...owners.flatMap((p) => walk(join(PACKAGES, p, "src"), ".css")), join(PACKAGES, "font/font.css")].filter(existsSync);
interface Stylesheet {
  file: string;
  code: string;
  comments: string[];
  header: string;
}
const sheets = new Map<string, Stylesheet>(
  cssFiles.map((file) => {
    const text = read(file);
    const comments = [...text.matchAll(/\/\*[\s\S]*?\*\//g)].map((m) => m[0]);
    return [file, { file, code: text.replace(/\/\*[\s\S]*?\*\//g, ""), comments, header: /^\s*\/\*/.test(text) ? comments[0]! : "" }];
  }),
);
const tsSource = owners.flatMap((p) => walk(join(PACKAGES, p, "src"), ".ts")).map(read).join("\n");
const cssClasses = new Set([...sheets.values()].flatMap((s) => [...s.code.matchAll(/\.(pp-[a-z0-9-]+)/g)].map((m) => m[1]!)));
const codeNames = new Set([...tsSource.matchAll(/pp-[a-z0-9-]*[a-z0-9]/g)].map((m) => m[0]));
const codeAttrs = new Set([...[...sheets.values()].map((s) => s.code).join("\n").matchAll(ATTR), ...tsSource.matchAll(ATTR)].map((m) => m[1]!));

interface Matcher {
  op: string;
  value: string;
}
/** The values each stylesheet selects a data attribute by, and the attributes it only tests for presence. */
const valued = new Map<string, Map<string, Matcher[]>>();
const presence = new Map<string, Set<string>>();
for (const s of sheets.values()) {
  const values = new Map<string, Matcher[]>();
  for (const m of s.code.matchAll(/\[\s*(data-[a-z0-9-]+)\s*([~|^$*]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]\s]+))\s*(?:[is]\s*)?\]/g)) {
    values.set(m[1]!, [...(values.get(m[1]!) ?? []), { op: m[2]!, value: m[3] ?? m[4] ?? m[5]! }]);
  }
  valued.set(s.file, values);
  presence.set(s.file, new Set([...s.code.matchAll(/\[\s*(data-[a-z0-9-]+)\s*\]/g)].map((m) => m[1]!)));
}
const matches = (v: string, { op, value }: Matcher): boolean =>
  op === "=" ? v === value
  : op === "~=" ? v.split(/\s+/).includes(value)
  : op === "|=" ? v === value || v.startsWith(`${value}-`)
  : op === "^=" ? v.startsWith(value)
  : op === "$=" ? v.endsWith(value)
  : v.includes(value);
const CORE = [...sheets.keys()].filter((f) => rel(f).startsWith("packages/core/"));
/** The stylesheets that style a class, for a value given on an element with that class. */
const styling = (cls: string): string[] => [...sheets.values()].filter((s) => word(`.${cls}`).test(s.code)).map((s) => s.file);

interface Declaration {
  tagName: string;
  attributes?: { name: string; type?: { text: string } }[];
  members?: { kind: string; name: string; attribute?: string }[];
  events?: { name: string }[];
}
const elements = new Map<string, Declaration>();
for (const p of owners) {
  const file = join(PACKAGES, p, "custom-elements.json");
  if (!existsSync(file)) continue;
  for (const mod of JSON.parse(read(file)).modules) for (const d of mod.declarations ?? []) if (d.tagName) elements.set(d.tagName, d);
}
const reactSource = [...walk(join(PACKAGES, "react/src"), ".ts"), ...walk(join(PACKAGES, "react/src"), ".tsx")].map(read).join("\n");

// The docs pages.
interface Doc {
  pkg: string;
  name: string;
  file: string;
  meta: Record<string, string>;
  body: string;
  /** The stylesheets its front matter names, found. */
  css: string[];
  tags: string[];
}
const frontMatter = (text: string): Record<string, string> => {
  const block = /^---\n([\s\S]*?)\n---/.exec(text)?.[1] ?? "";
  // Top-level keys only: a nested map (equivalents:) is the docs site's business.
  return Object.fromEntries([...block.matchAll(/^([a-z][\w-]*):[ \t]*(.*)$/gm)].map((m) => [m[1]!, m[2]!.trim().replace(/^"(.*)"$/, "$1")]));
};
const docs: Doc[] = owners.flatMap((pkg) =>
  walk(join(PACKAGES, pkg, "docs"), ".md").map((file) => {
    const text = read(file);
    const meta = frontMatter(text);
    const css = /^[\w-]+\.css$/.test(meta.css ?? "") ? [join(PACKAGES, pkg, "src", meta.css!), join(PACKAGES, pkg, meta.css!)].filter((f) => sheets.has(f)) : [];
    const tags = !meta.element || meta.element === "null" ? [] : meta.element.split(/,\s*/);
    return { pkg, name: basename(file, ".md"), file, meta, body: text.replace(/^---\n[\s\S]*?\n---\n/, ""), css, tags };
  }),
);
/** The pages that share each stylesheet. */
const sharing = (file: string): Doc[] => docs.filter((d) => d.css.includes(file));

/** The rows of every table on a page, with the heading above it and its header row. */
function tables(body: string): { heading: string; header: string[]; cells: string[] }[] {
  const rows: { heading: string; header: string[]; cells: string[] }[] = [];
  let heading = "";
  let header: string[] | null = null;
  for (const line of body.split("\n")) {
    if (/^#+ /.test(line)) heading = line;
    if (!line.startsWith("|")) {
      header = null;
      continue;
    }
    if (/^\|[\s|:-]+\|$/.test(line)) continue;
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (!header) header = cells;
    else rows.push({ heading, header, cells });
  }
  return rows;
}

/** Where a value a page gives an attribute is wrong, or null. */
function badValue(doc: Doc, attr: string, value: string, near: string[] = []): string | null {
  const context = [...new Set([...doc.css, ...CORE, ...near])];
  let known = context.flatMap((f) => valued.get(f)!.get(attr) ?? []);
  if (!known.length) {
    // Free text where the page's own CSS only tests for it (data-label on a table cell); else any stylesheet's.
    if (context.some((f) => presence.get(f)!.has(attr))) return null;
    known = [...valued.values()].flatMap((v) => v.get(attr) ?? []);
    if (!known.length) return null;
  }
  const values = value.split(/\s+/).filter(Boolean);
  const listed = (v: string) =>
    known.some((m) => matches(v, m)) ||
    // Listed in its stylesheet's comments on a line that names the attribute: "data-size  sm | md (default) | lg".
    doc.css.some((f) => sheets.get(f)!.comments.some((c) => c.split("\n").some((l) => word(attr).test(l) && word(v).test(l)))) ||
    doc.tags.some((t) => elements.get(t)?.attributes?.some((a) => a.name === attr && a.type?.text.includes(`"${v}"`)));
  const wrong = values.filter((v) => !listed(v));
  return wrong.length ? `${attr}="${wrong.join(" ")}"` : null;
}

describe.each(docs.map((d) => [`${d.pkg}/docs/${d.name}.md`, d] as const))("%s", (_, doc) => {
  const where = rel(doc.file);

  it("points at a stylesheet, elements and a React component that exist", () => {
    const problems: string[] = [];
    if (!["stable", "beta"].includes(doc.meta.status ?? "")) problems.push(`status is "${doc.meta.status ?? ""}": stable or beta (CONTRACT.md, "Stable and beta")`);
    if (/^[\w-]+\.css$/.test(doc.meta.css ?? "") && !doc.css.length) problems.push(`css: ${doc.meta.css}, but packages/${doc.pkg}/src/${doc.meta.css} does not exist`);
    for (const t of doc.tags) if (!elements.has(t)) problems.push(`element: ${t} is in no custom-elements.json (run pnpm cem)`);
    const react = doc.meta.react;
    if (react && react !== "null" && !new RegExp(`export\\s+(?:const|function|class)\\s+${esc(react)}\\b|export\\s*\\{[^}]*\\b${esc(react)}\\b`).test(reactSource)) {
      problems.push(`react: ${react} is not exported by @jaatster/blip-react`);
    }
    expect(problems, where).toEqual([]);
  });

  it("names only classes and data attributes that exist", () => {
    const own = doc.css.flatMap((f) => [...classesIn(sheets.get(f)!.header)]);
    const classes = [...classesIn(doc.body)].filter((c) => !cssClasses.has(c) && !codeNames.has(c) && !own.includes(c));
    const ownAttrs = doc.css.flatMap((f) => [...attrsIn(sheets.get(f)!.comments.join("\n"))]);
    const cemAttrs = [...elements.values()].flatMap((d) => (d.attributes ?? []).map((a) => a.name));
    const attrs = [...attrsIn(doc.body)].filter((a) => !codeAttrs.has(a) && !ownAttrs.includes(a) && !cemAttrs.includes(a));
    expect([...classes.map((c) => `.${c}`), ...attrs], `${where} names these, but no stylesheet or element has them`).toEqual([]);
  });

  it("gives data attributes only values the code knows", () => {
    const problems = new Set<string>();
    // In markup and prose: data-x="v", with the stylesheets of the classes on the same tag.
    for (const tag of doc.body.matchAll(/<[a-z][\w-]*\s[^<>]*>/g)) {
      const near = [...classesIn(tag[0])].flatMap(styling);
      for (const m of tag[0].matchAll(/(?<![\w-])(data-[a-z0-9-]+)="([^"]*)"/g)) {
        const bad = badValue(doc, m[1]!, m[2]!, near);
        if (bad) problems.add(bad);
      }
    }
    for (const m of doc.body.replace(/<[a-z][\w-]*\s[^<>]*>/g, "").matchAll(/`(data-[a-z0-9-]+)="([^"]*)"/g)) {
      const bad = badValue(doc, m[1]!, m[2]!);
      if (bad) problems.add(bad);
    }
    // In the Values column of a table whose row is one attribute.
    for (const { header, cells } of tables(doc.body)) {
      const column = header.findIndex((h) => /^values?$/i.test(h));
      const attr = /^`(data-[a-z0-9-]+)`(?: on .*)?$/.exec(cells[0] ?? "")?.[1];
      if (column < 1 || !attr || !cells[column]) continue;
      for (const m of cells[column]!.matchAll(/`"?([\w-]+)"?`( \(default)?/g)) {
        if (m[2]) continue;
        const bad = badValue(doc, attr, m[1]!);
        if (bad) problems.add(bad);
      }
    }
    expect([...problems], `${where} gives these values, but no stylesheet selects them, its comments do not list them and no element takes them`).toEqual([]);
  });

  it.skipIf(!doc.tags.length)("lists only what its elements have", () => {
    const problems: string[] = [];
    for (const { heading, header, cells } of tables(doc.body)) {
      const names = [...(cells[0] ?? "").matchAll(/`([^`]+)`/g)].map((m) => m[1]!);
      if (/^event/i.test(header[0] ?? "")) {
        // An event of its own elements, or of the elements of a page the row links to (a dialogue's choices).
        const linked = [...cells.join(" ").matchAll(/\]\(([\w-]+)\.md/g)].flatMap((m) => docs.filter((d) => d.name === m[1]).flatMap((d) => d.tags));
        for (const n of names.filter((n) => /^pp-/.test(n))) {
          if (![...doc.tags, ...linked].some((t) => elements.get(t)?.events?.some((e) => e.name === n))) problems.push(`event ${n} is fired by none of ${doc.tags.join(", ")}`);
        }
      }
      const tag = /`<(pp-[a-z-]+)>`/.exec(heading)?.[1];
      if (tag && elements.has(tag) && /attribute|propert|method|member/i.test(header[0] ?? "")) {
        const d = elements.get(tag)!;
        for (const n of names.map((n) => n.replace(/\(.*\)$/, "").replace(/=.*$/, "")).filter((n) => /^[a-zA-Z][\w-]*$/.test(n))) {
          if (!d.attributes?.some((a) => a.name === n) && !d.members?.some((m) => m.name === n) && !d.events?.some((e) => e.name === n)) {
            problems.push(`${tag}: "${n}" is not in its manifest`);
          }
        }
      }
    }
    expect(problems, where).toEqual([]);
  });

  it.skipIf(!doc.tags.length)("documents every attribute, property, method and event of its elements", () => {
    const code = [...doc.body.matchAll(/```[\s\S]*?```/g)].map((m) => m[0]).join("\n");
    // In code quotes on its own, called, or given a value: `open`, `show(opener?)`, `value="caves"`.
    const named = (n: string) => new RegExp(`\`\\.?${esc(n)}(?=[\`(=]| \\()`).test(doc.body);
    const missing: string[] = [];
    for (const t of doc.tags) {
      const d = elements.get(t);
      if (!d) continue;
      for (const a of d.attributes ?? []) if (!named(a.name) && !new RegExp(`\\s${esc(a.name)}(?=[=\\s>])`).test(code)) missing.push(`${t} attribute ${a.name}`);
      for (const m of d.members ?? []) if (!m.attribute && !named(m.name)) missing.push(`${t} ${m.kind === "method" ? "method" : "property"} ${m.name}`);
      for (const e of d.events ?? []) if (!named(e.name)) missing.push(`${t} event ${e.name}`);
    }
    expect(missing, `${where} does not mention these, which the manifest makes public`).toEqual([]);
  });

  it.skipIf(!doc.css.length)("documents what its stylesheet's header names", () => {
    const missing: string[] = [];
    for (const file of doc.css) {
      const { header, code } = sheets.get(file)!;
      const pages = sharing(file);
      const text = pages.map((d) => d.body).join("\n");
      // Its own classes: named after one of the pages that share the stylesheet, or the stylesheet itself.
      const own = new RegExp(`^pp-(?:${[...pages.map((d) => d.name), basename(file, ".css")].map(esc).join("|")})(?:-|$)`);
      for (const c of classesIn(header)) if (own.test(c) && !word(c).test(text)) missing.push(`.${c}`);
      // Its attributes: those the header names and its rules use (not those of other components in its markup).
      for (const a of attrsIn(header)) if (new RegExp(`\\[\\s*${esc(a)}(?![\\w-])`).test(code) && !word(a).test(text)) missing.push(a);
      if (missing.length) missing.unshift(`(${rel(file)}, on ${pages.map((d) => `${d.name}.md`).join(" or ")})`);
    }
    expect(missing, `${where}: the stylesheet's header comment names these, and the docs do not`).toEqual([]);
  });
});
