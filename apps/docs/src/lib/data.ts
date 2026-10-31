/**
 * Everything the docs read from the packages, at build time: the component docs and examples, the tokens, the icons,
 * the staged assets and sizes (scripts/prepare.mjs), and the diagnostic codes in the source. Nothing here is copied
 * by hand, so the site follows the packages.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";

function findRoot(): string {
  let dir = process.cwd();
  while (!existsSync(join(dir, "pnpm-workspace.yaml"))) {
    const up = dirname(dir);
    if (up === dir) throw new Error("docs: run from inside the Blip repository");
    dir = up;
  }
  return dir;
}
export const ROOT = findRoot();
export const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
export const json = <T = any>(rel: string): T => JSON.parse(read(rel));
export const exists = (rel: string) => existsSync(join(ROOT, rel));

// ------------------------------------------------------------------ front matter

export interface Meta {
  name: string;
  package: string;
  css: string | null;
  element: string | null;
  react: string | null;
  status: string;
}

export function frontMatter(source: string): Meta {
  const m = source.match(/^---\n([\s\S]*?)\n---/);
  const out: Record<string, string | null> = {};
  for (const line of (m?.[1] ?? "").split("\n")) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    let v: string | null = kv[2]!.trim();
    if (/^".*"$|^'.*'$/.test(v)) v = v.slice(1, -1);
    if (v === "null" || v === "~" || v === "") v = null;
    out[kv[1]!] = v;
  }
  return { name: out.name ?? "", package: out.package ?? "", css: out.css ?? null, element: out.element ?? null, react: out.react ?? null, status: out.status ?? "beta" };
}

// ------------------------------------------------------------------ groups

export interface Group {
  id: string;
  title: string;
  icon: string;
  blurb: string;
  names?: string[];
  pkg?: string;
}
export const GROUPS: Group[] = [
  { id: "actions", title: "Actions", icon: "bolt", blurb: "Things you press.", names: ["button", "toggle", "button-group", "segmented", "link"] },
  { id: "forms", title: "Forms", icon: "edit", blurb: "Things you fill in and pick.", names: ["field", "input", "textarea", "select", "combobox", "checkbox", "radio", "switch", "slider", "number", "search", "file-drop", "rating"] },
  { id: "navigation", title: "Navigation", icon: "compass", blurb: "Ways round an app or a site.", names: ["app-bar", "sidebar", "bottom-bar", "tabs", "breadcrumbs", "pagination", "menu", "command", "progress-steps", "skip-link"] },
  { id: "feedback", title: "Feedback", icon: "bell", blurb: "What happened, what is happening, what needs you.", names: ["alert", "toast", "dialog", "drawer", "popover", "tooltip", "progress", "loader", "skeleton", "empty-state", "badge"] },
  { id: "data", title: "Data", icon: "table", blurb: "Things to read and compare.", names: ["card", "tile", "list", "table", "avatar", "tag", "keycap", "stat", "divider", "accordion"] },
  { id: "layout", title: "Layout", icon: "maximize", blurb: "Spacing and frames, in whole pixels.", names: ["stack", "cluster", "grid", "window"] },
  { id: "game", title: "Game", icon: "gamepad", blurb: "@jaatster/blip-game: HUDs, dialogue, menus.", pkg: "game" },
  { id: "blocks", title: "Blocks", icon: "desktop", blurb: "@jaatster/blip-blocks: website sections.", pkg: "blocks" },
  { id: "effects", title: "Effects", icon: "sparkle", blurb: "@jaatster/blip-effects: worlds, transitions, text.", pkg: "effects" },
];

// Docs that are foundations, not components: shown on their foundation page.
const FOUNDATION_DOCS: Record<string, string> = { "font/font": "/foundations/type/", "icons/icons": "/foundations/icons/", "sound/sound": "/foundations/sound/" };

export interface Doc {
  pkg: string;
  name: string;
  slug: string;
  url: string;
  file: string;
  source: string;
  meta: Meta;
  group: Group;
  example: string | null;
  foundation: boolean;
}

let docsCache: Doc[] | undefined;
export function docs(): Doc[] {
  if (docsCache) return docsCache;
  const found: Omit<Doc, "slug" | "url" | "group">[] = [];
  for (const pkg of readdirSync(join(ROOT, "packages")).sort()) {
    const dir = `packages/${pkg}/docs`;
    if (!exists(dir) || !statSync(join(ROOT, dir)).isDirectory()) continue;
    for (const f of readdirSync(join(ROOT, dir)).sort()) {
      if (!f.endsWith(".md")) continue;
      const name = f.slice(0, -3);
      const source = read(`${dir}/${f}`);
      const ex = `packages/${pkg}/examples/${name}.html`;
      found.push({ pkg, name, file: `${dir}/${f}`, source, meta: frontMatter(source), example: exists(ex) ? ex : null, foundation: `${pkg}/${name}` in FOUNDATION_DOCS });
    }
  }
  const counts = new Map<string, number>();
  for (const d of found) if (!d.foundation) counts.set(d.name, (counts.get(d.name) ?? 0) + 1);
  const more: Group = { id: "more", title: "More", icon: "puzzle", blurb: "Newer parts." };
  docsCache = found.map((d) => {
    const slug = (counts.get(d.name) ?? 0) > 1 ? `${d.pkg}-${d.name}` : d.name;
    const group = GROUPS.find((g) => (g.pkg ? g.pkg === d.pkg : d.pkg === "components" && g.names?.includes(d.name))) ?? more;
    const url = d.foundation ? FOUNDATION_DOCS[`${d.pkg}/${d.name}`]! : `/components/${slug}/`;
    return { ...d, slug, url, group };
  });
  return docsCache;
}

export const componentDocs = () => docs().filter((d) => !d.foundation);
export const docFor = (pkg: string, name: string) => docs().find((d) => d.pkg === pkg && d.name === name);

/** Components by group, in the groups' order (a group's own order first, then by name). */
export function groupedComponents(): { group: Group; docs: Doc[] }[] {
  const all = componentDocs();
  const groups = [...GROUPS];
  if (all.some((d) => d.group.id === "more")) groups.push(all.find((d) => d.group.id === "more")!.group);
  return groups
    .map((group) => ({
      group,
      docs: all
        .filter((d) => d.group.id === group.id)
        .sort((a, b) => {
          const ia = group.names?.indexOf(a.name) ?? -1, ib = group.names?.indexOf(b.name) ?? -1;
          if (ia !== ib) return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
          return a.meta.name.localeCompare(b.meta.name);
        }),
    }))
    .filter((g) => g.docs.length);
}

/** Where a link inside a doc points: "alert.md", "../../game/docs/hud.md#states", "button.md". */
export function docLink(fromPkg: string) {
  return (href: string): string | undefined => {
    const m = href.match(/^(?:\.\/)?(?:\.\.\/\.\.\/([a-z0-9-]+)\/docs\/|\.\.\/([a-z0-9-]+)\/docs\/)?([a-z0-9-]+)\.md(#.*)?$/);
    if (!m) return undefined;
    const pkg = m[1] ?? m[2] ?? fromPkg;
    const d = docFor(pkg, m[3]!) ?? docs().find((x) => x.name === m[3]);
    return d ? d.url + (m[4] ?? "") : undefined;
  };
}

// ------------------------------------------------------------------ examples

export interface Example {
  html: string;
  note: string;
  source: string;
}
/** An example fragment: the HTML to render, its first comment (what it shows) and the source without that comment. */
export function example(rel: string): Example {
  const raw = read(rel);
  const m = raw.match(/^\s*<!--([\s\S]*?)-->\s*/);
  const note = m ? m[1]!.replace(/\s+/g, " ").trim() : "";
  const body = m ? raw.slice(m[0].length) : raw;
  return { html: body, note, source: body.trim() + "\n" };
}

// ------------------------------------------------------------------ tokens, icons, assets

export interface Tokens {
  pixel: Record<string, number>;
  shared: Record<string, string | number>;
  schemes: Record<"day" | "sunset" | "night", Record<string, string>>;
}
export const tokens = (): Tokens => json("packages/tokens/dist/json/tokens.json");
export interface ManifestEntry {
  name: string;
  path: string;
  cssVar: string;
  type: string;
  scheme: boolean;
  description?: string;
  unit?: string;
  alias?: string;
}
export const manifest = (): ManifestEntry[] => json("packages/tokens/dist/json/manifest.json");
export const tokenSource = (rel: string) => json(`packages/tokens/src/${rel}`);

export interface IconData {
  version: string;
  grid: number;
  categories: { id: string; title: string }[];
  icons: { name: string; category: string; tags: string[]; path: string; evenodd?: boolean }[];
}
let iconCache: IconData | undefined;
export const icons = (): IconData => (iconCache ??= json("packages/icons/dist/icons.json"));
export function iconPath(name: string): string {
  const i = icons().icons.find((x) => x.name === name);
  if (!i) throw new Error(`docs: no icon named "${name}"`);
  return i.path;
}

export interface Budget {
  id: string;
  label: string;
  bytes: number;
  limit: number;
  note: string;
}
export interface Assets {
  importMap: { imports: Record<string, string> };
  defines: Record<string, string>;
  coreModules: string[];
  budgets: Budget[];
  elements: { name: string; bytes: number }[];
  kits: Record<string, Record<string, number>>;
}
export const assets = (): Assets => json("apps/docs/src/generated/assets.json");

export const pkgVersion = (name: string): string => json(`packages/${name}/package.json`).version;

// ------------------------------------------------------------------ diagnostics

export interface Occurrence {
  file: string;
  line: number;
  message: string;
  fix?: string;
}
/** The arguments of the call that starts at `open` (the index of its "("), as source text. */
function callArgs(s: string, open: number): string[] {
  const args: string[] = [];
  let depth = 0, start = open + 1, quote = "", tpl = 0;
  for (let i = open; i < s.length; i++) {
    const c = s[i]!;
    if (quote) {
      if (c === "\\") i++;
      else if (quote === "`" && c === "$" && s[i + 1] === "{") (tpl++, i++);
      else if (quote === "`" && tpl && c === "}") tpl--;
      else if (c === quote && !tpl) quote = "";
      continue;
    }
    if (c === '"' || c === "'" || c === "`") quote = c;
    else if ("([{".includes(c)) depth++;
    else if (")]}".includes(c)) {
      depth--;
      if (depth === 0) {
        args.push(s.slice(start, i).trim());
        return args;
      }
    } else if (c === "," && depth === 1) {
      args.push(s.slice(start, i).trim());
      start = i + 1;
    }
  }
  return args;
}
/** A string literal's text, with ${…} shown as an ellipsis; undefined for anything else. */
function literal(arg: string | undefined): string | undefined {
  const m = arg?.match(/^(["'`])([\s\S]*)\1$/);
  return m ? m[2]!.replace(/\$\{[^}]*\}/g, "…").replace(/\\(["'`])/g, "$1") : undefined;
}

/** Every PP-XNNN code in the packages' source and build scripts, with the message it is raised with. */
export function diagnostics(): Map<string, Occurrence[]> {
  const codes = new Map<string, Occurrence[]>();
  const scan = (rel: string) => {
    const lines = read(rel).split("\n");
    lines.forEach((line, i) => {
      // Doc comments only show how to call warn().
      if (/^\s*(\*|\/\/|\/\*)/.test(line)) return;
      for (const m of line.matchAll(/PP-[A-Z]\d{3}/g)) {
        const code = m[0];
        let message: string | undefined;
        let fix: string | undefined;
        const at = (name: string) => line.lastIndexOf(`${name}(`, m.index);
        if (at("problem") >= 0) {
          const a = callArgs(line, at("problem") + "problem".length);
          message = literal(a[3]);
          fix = literal(a[4]);
        } else if (at("warn") >= 0 && !line.includes("console.warn")) {
          message = literal(callArgs(line, at("warn") + "warn".length)[1]);
        } else if (line.includes("console.warn")) {
          message = literal(callArgs(line, line.indexOf("console.warn(") + "console.warn".length)[0])?.replace(/^Blip PP-[A-Z]\d{3}:\s*/, "");
        } else if (/checkName\(/.test(line)) message = "<element> has no accessible name. Add text or aria-label.";
        if (!message) continue;
        const list = codes.get(code) ?? [];
        list.push({ file: rel, line: i + 1, message, fix });
        codes.set(code, list);
      }
    });
  };
  const walk = (rel: string) => {
    for (const f of readdirSync(join(ROOT, rel)).sort()) {
      const p = `${rel}/${f}`;
      if (f === "node_modules" || f === "dist" || f.startsWith(".")) continue;
      if (statSync(join(ROOT, p)).isDirectory()) walk(p);
      else if (/\.(ts|mjs|js|py)$/.test(f) && !f.endsWith(".d.ts") && !f.endsWith(".test.ts")) scan(p);
    }
  };
  for (const pkg of readdirSync(join(ROOT, "packages")).sort()) {
    for (const sub of ["src", "scripts"]) if (exists(`packages/${pkg}/${sub}`)) walk(`packages/${pkg}/${sub}`);
  }
  return new Map([...codes].sort(([a], [b]) => a.localeCompare(b)));
}

export const rel = (abs: string) => relative(ROOT, abs);

/** A doc's first sentence, as plain text: for indexes and search. */
export function summary(source: string): string {
  const body = source.replace(/^---\n[\s\S]*?\n---\n/, "").replace(/^\s*#[^\n]*\n/, "");
  const para = body.split(/\n\s*\n/).find((p) => p.trim() && !p.trim().startsWith("#") && !p.trim().startsWith("|") && !p.trim().startsWith("```")) ?? "";
  const plain = para.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/`([^`]+)`/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\s+/g, " ").trim();
  const m = plain.match(/^.*?[.!?](?=\s|$)/);
  return (m ? m[0] : plain).trim();
}

/** The headings of a markdown source (## and ###), as plain text: for search keywords. */
export function headingsOf(source: string): string[] {
  return [...source.matchAll(/^#{2,3}\s+(.+)$/gm)].map((m) => m[1]!.replace(/`/g, "").trim());
}

/** Bramble the frog, as the game kit's own dialogue example draws him (an inline SVG sprite). */
export function frog(): string {
  const m = read("packages/game/examples/dialogue.html").match(/<div class="pp-box pp-dialogue-portrait"[^>]*>(<svg[\s\S]*?<\/svg>)<\/div>/);
  return m?.[1] ?? "";
}
