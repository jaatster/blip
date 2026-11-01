/**
 * Everything the docs read from the packages, at build time: the component docs and examples, the tokens, the icons,
 * the staged assets and sizes (scripts/prepare.mjs), and the diagnostic codes in the source. Nothing here is copied
 * by hand, so the site follows the packages.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
// @ts-ignore: a plain Node script, without types
import { scan as scanDiagnostics } from "../../../../scripts/diagnostics.mjs";
import { slug } from "./markdown";

function findRoot(): string {
  let dir = process.cwd();
  while (!existsSync(join(dir, "pnpm-workspace.yaml"))) {
    const up = dirname(dir);
    if (up === dir) throw new Error("docs: run from inside the Blip repository");
    dir = up;
  }
  return dir;
}
/** The source, on GitHub. */
export const REPO = "https://github.com/jaatster/blip";

export const ROOT = findRoot();
export const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
export const json = <T = any>(rel: string): T => JSON.parse(read(rel));
export const exists = (rel: string) => existsSync(join(ROOT, rel));

// ------------------------------------------------------------------ front matter

/**
 * What other systems call a component, from the front matter's `equivalents:` map: shadcn/ui's component names,
 * WAI-ARIA APG pattern slugs (keys of APG) and HTML elements. Each a comma-separated list; any may be missing.
 */
export interface Equivalents {
  shadcn: string[];
  apg: string[];
  html: string[];
}
export const EQUIVALENT_KEYS = ["shadcn", "apg", "html"] as const;

export interface Meta {
  name: string;
  package: string;
  css: string | null;
  element: string | null;
  react: string | null;
  status: string;
  equivalents: Equivalents;
}

/** The WAI-ARIA Authoring Practices patterns, by the slug of their page, with the names the APG gives them. */
export const APG: Record<string, string> = {
  accordion: "Accordion", alert: "Alert", alertdialog: "Alert and Message Dialogs", breadcrumb: "Breadcrumb", button: "Button", carousel: "Carousel", checkbox: "Checkbox", combobox: "Combobox", "dialog-modal": "Dialog (Modal)", disclosure: "Disclosure", feed: "Feed", grid: "Grid", landmarks: "Landmarks", link: "Link", listbox: "Listbox", menubar: "Menu and Menubar", "menu-button": "Menu Button", meter: "Meter", radio: "Radio Group", slider: "Slider", "slider-multithumb": "Slider (Multi-Thumb)", spinbutton: "Spinbutton", switch: "Switch", table: "Table", tabs: "Tabs", toolbar: "Toolbar", tooltip: "Tooltip", treeview: "Tree View", treegrid: "Treegrid", windowsplitter: "Window Splitter",
};
export const apgUrl = (slug: string) => `https://www.w3.org/WAI/ARIA/apg/patterns/${slug}/`;

const unquote = (v: string): string | null => {
  let s = v.trim();
  if (/^".*"$|^'.*'$/.test(s)) s = s.slice(1, -1);
  return s === "null" || s === "~" || s === "" ? null : s;
};

export function frontMatter(source: string): Meta {
  const m = source.match(/^---\n([\s\S]*?)\n---/);
  const out: Record<string, string | null> = {};
  // One level of nesting: "equivalents:" then indented "  shadcn: Sheet" lines.
  const nested: Record<string, Record<string, string | null>> = {};
  let parent: string | null = null;
  for (const line of (m?.[1] ?? "").split("\n")) {
    const sub = line.match(/^\s+([A-Za-z_][\w-]*):\s*(.*)$/);
    if (sub && parent) {
      // A YAML comment after the value goes: "Sheet, Drawer  # shadcn's names", "'<dialog>'  # the element".
      const raw = sub[2]!.match(/^('[^']*'|"[^"]*")\s*(?:#.*)?$/)?.[1] ?? sub[2]!.replace(/\s+#.*$/, "");
      (nested[parent] ??= {})[sub[1]!] = unquote(raw);
      continue;
    }
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    const v = unquote(kv[2]!);
    out[kv[1]!] = v;
    parent = v === null ? kv[1]! : null;
  }
  const eq = nested.equivalents ?? {};
  const list = (v: string | null | undefined) => (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const equivalents: Equivalents = { shadcn: list(eq.shadcn), apg: list(eq.apg), html: list(eq.html) };
  const unknown = Object.keys(eq).filter((k) => !(EQUIVALENT_KEYS as readonly string[]).includes(k));
  if (unknown.length) throw new Error(`docs: equivalents has ${unknown.join(", ")}; it takes ${EQUIVALENT_KEYS.join(", ")}`);
  const badApg = equivalents.apg.filter((s) => !(s in APG));
  if (badApg.length) throw new Error(`docs: equivalents.apg "${badApg.join(", ")}" is not an APG pattern's slug (one of: ${Object.keys(APG).join(", ")})`);
  return { name: out.name ?? "", package: out.package ?? "", css: out.css ?? null, element: out.element ?? null, react: out.react ?? null, status: out.status ?? "beta", equivalents };
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
  { id: "phone", title: "Phone", icon: "smartphone", blurb: "Made for touch: sheets, swipes, wheels and a thumb's reach.", names: ["top-bar", "fab", "sheet", "action-sheet", "swipe-row", "refresh", "pager", "wheel"] },
  { id: "layout", title: "Layout", icon: "maximize", blurb: "Spacing and frames, in whole pixels.", names: ["stack", "cluster", "grid", "window"] },
  { id: "game", title: "Game", icon: "gamepad", blurb: "@blip/game: HUDs, dialogue, menus.", pkg: "game" },
  { id: "blocks", title: "Blocks", icon: "desktop", blurb: "@blip/blocks: website sections.", pkg: "blocks" },
  { id: "effects", title: "Effects", icon: "sparkle", blurb: "@blip/effects: worlds, transitions, text.", pkg: "effects" },
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
  /** Small named examples beside the full one: examples/<name>/NN-title.html, in order. */
  snippets: string[];
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
      let meta: Meta;
      try {
        meta = frontMatter(source);
      } catch (e) {
        throw new Error(`${dir}/${f}: ${(e as Error).message}`);
      }
      found.push({ pkg, name, file: `${dir}/${f}`, source, meta, example: exists(ex) ? ex : null, snippets: snippetFiles(pkg, name), foundation: `${pkg}/${name}` in FOUNDATION_DOCS });
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

/** A snippet: one small named example, rendered live on the component's page with its source. */
export interface Snippet extends Example {
  /** From the file name: 02-with-an-icon.html is "With an icon". */
  title: string;
  /** For the heading: <slug>-snippet-with-an-icon. */
  id: string;
}

const SNIPPET = /^(\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.html$/;

/**
 * The snippets in packages/<pkg>/examples/<name>/, in the order of their numbers. The full examples/<name>.html
 * stays the specimen the visual tests and the gallery use; they read only the .html files beside it, never this folder.
 */
function snippetFiles(pkg: string, name: string): string[] {
  const dir = `packages/${pkg}/examples/${name}`;
  if (!exists(dir) || !statSync(join(ROOT, dir)).isDirectory()) return [];
  const files = readdirSync(join(ROOT, dir)).filter((f) => !f.startsWith(".")).sort();
  const bad = files.filter((f) => !SNIPPET.test(f));
  if (bad.length) throw new Error(`docs: ${dir}/ holds ${bad.join(", ")}. Name each snippet NN-title.html (two digits, then the title in lower case with hyphens): 01-sizes.html`);
  const numbers = files.map((f) => f.slice(0, 2));
  const twice = numbers.filter((n, i) => numbers.indexOf(n) !== i);
  if (twice.length) throw new Error(`docs: ${dir}/ has two snippets numbered ${twice.join(", ")}`);
  return files.map((f) => `${dir}/${f}`);
}

export function snippet(doc: Pick<Doc, "slug">, rel: string): Snippet {
  const words = rel.split("/").pop()!.match(SNIPPET)![2]!.replace(/-/g, " ");
  const title = words[0]!.toUpperCase() + words.slice(1);
  return { ...example(rel), title, id: `${doc.slug}-snippet-${slug(words)}` };
}

/** The ids a fragment of markup defines. */
export const idsIn = (html: string): string[] => [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!);

// ------------------------------------------------------------------ tokens, icons, assets

export interface Tokens {
  pixel: Record<string, number>;
  shared: Record<string, string | number>;
  schemes: Record<"day" | "sunset" | "night", Record<string, string>>;
  /** The default palette's name, and each preset: what it sets, and every scheme's roles in it. */
  palette?: string;
  palettes?: Record<string, { name: string; description: string; credit?: string; shared: Record<string, string>; schemes: Record<"day" | "sunset" | "night", Record<string, string>> }>;
}
export const tokens = (): Tokens => json("packages/tokens/dist/json/tokens.json");
export interface ManifestEntry {
  name: string;
  path: string;
  cssVar: string;
  type: string;
  scheme: boolean;
  /** Set by a palette: switched by data-blip-palette (palette.*, world.night.*). */
  palette?: boolean;
  description?: string;
  unit?: string;
  alias?: string;
}
export const manifest = (): ManifestEntry[] => json("packages/tokens/dist/json/manifest.json");
export const tokenSource = (rel: string) => json(`packages/tokens/src/${rel}`);

export interface SchemeBlock {
  /** The scheme its roles are: the device's dark mode is Night. */
  scheme: "day" | "sunset" | "night";
  /** At-rules round it inside the tokens' layer, outermost first: "@media screen". */
  wrap: string[];
  selector: string;
}
/**
 * Where tokens.css sets each scheme's roles: the selector and the at-rules round it, inside @layer blip.tokens. A
 * theme that sets the same roles the same way, after tokens.css, wins in exactly the same places.
 */
export function schemeBlocks(): SchemeBlock[] {
  const css = read("packages/tokens/dist/css/tokens.css").replace(/\/\*[\s\S]*?\*\//g, "");
  const out: SchemeBlock[] = [];
  const stack: string[] = [];
  let start = 0;
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '"' || c === "'") {
      i = css.indexOf(c, i + 1);
      continue;
    }
    if (c === "{") {
      const prelude = css.slice(start, i).trim().replace(/\s+/g, " ");
      stack.push(prelude);
      const scheme = prelude.match(/\[data-blip-scheme="(day|sunset|night)"\]/)?.[1] ?? (/:not\(\[data-blip-scheme\]\)/.test(prelude) ? "night" : null);
      if (scheme && !prelude.startsWith("@")) out.push({ scheme: scheme as SchemeBlock["scheme"], wrap: stack.slice(0, -1).filter((p) => !/^@layer\b/.test(p)), selector: prelude });
      start = i + 1;
    } else if (c === "}") {
      stack.pop();
      start = i + 1;
    } else if (c === ";") start = i + 1;
  }
  return out;
}

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

// ------------------------------------------------------------------ packages and the repository

export interface PackageInfo {
  /** The folder under packages/. */
  dir: string;
  name: string;
  version: string;
  description: string;
  /** packages/<dir>/CHANGELOG.md, when it has one. */
  changelog: string | null;
}
/** Every published package (not the private ones), from its package.json. */
export function packagesInfo(): PackageInfo[] {
  return readdirSync(join(ROOT, "packages"))
    .sort()
    .filter((dir) => exists(`packages/${dir}/package.json`))
    .map((dir) => ({ dir, pkg: json(`packages/${dir}/package.json`) }))
    .filter(({ pkg }) => !pkg.private)
    .map(({ dir, pkg }) => ({ dir, name: pkg.name, version: pkg.version, description: pkg.description ?? "", changelog: exists(`packages/${dir}/CHANGELOG.md`) ? `packages/${dir}/CHANGELOG.md` : null }));
}

/** Where the repository lives, as the packages' `bugs` fields name it (https://github.com/<owner>/<repo>). */
export const repoUrl = (): string => String(json("packages/core/package.json").bugs ?? "").replace(/\/issues\/?$/, "");
/** Where to report a problem: the packages' `bugs` field. */
export const issuesUrl = (): string => String(json("packages/core/package.json").bugs ?? "");
/** A file of the repository on its default branch. */
export const repoFile = (rel: string): string => `${repoUrl()}/blob/main/${rel}`;

/**
 * Where a section of the font's docs is on the type page (they are rendered there with the id prefix "font-"), with
 * its heading; the first of the headings asked for that the docs have.
 */
export function fontSection(...headings: string[]): { url: string; text: string } {
  const found = headingsOf(docFor("font", "font")?.source ?? "");
  const text = headings.find((h) => found.includes(h)) ?? found[0] ?? "Type";
  return { url: `/foundations/type/#font-${slug(text)}`, text };
}

/** The markdown under a "## heading" of a file (up to the next "## "), without the heading. */
export function markdownSection(rel: string, heading: string): string {
  const lines = read(rel).split("\n");
  const start = lines.findIndex((l) => l.replace(/^##\s+/, "").trim() === heading && l.startsWith("## "));
  if (start < 0) throw new Error(`docs: ${rel} has no "## ${heading}" section`);
  const end = lines.findIndex((l, i) => i > start && /^##?\s/.test(l));
  return lines.slice(start + 1, end < 0 ? undefined : end).join("\n").trim();
}

// ------------------------------------------------------------------ diagnostics

export interface Occurrence {
  file: string;
  line: number;
  message: string;
  fix?: string;
}
/**
 * Every BLIP-XNNN code in the packages' source and build scripts, with the message it is raised with. The scan is
 * scripts/diagnostics.mjs's, the same one that writes CONTRACT.md's table of codes.
 */
export const diagnostics = (): Map<string, Occurrence[]> => scanDiagnostics(ROOT) as Map<string, Occurrence[]>;

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
  const m = read("packages/game/examples/dialogue.html").match(/<div class="blip-box blip-dialogue-portrait"[^>]*>(<svg[\s\S]*?<\/svg>)<\/div>/);
  return m?.[1] ?? "";
}
