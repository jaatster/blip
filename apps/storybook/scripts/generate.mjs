#!/usr/bin/env node
/**
 * Generates Blip's Storybook from the files the packages already have, so nothing is written twice:
 *
 *   packages/<pkg>/examples/<name>.html  ->  src/generated/<slug>.stories.ts   a "Gallery" story (the whole fragment),
 *                                                                               one story per separable section, and
 *                                                                               the interaction stories of
 *                                                                               src/interactions/<name>.ts
 *   packages/<pkg>/docs/<name>.md        ->  src/generated/<slug>.mdx          the docs page: the markdown, with the
 *                                                                               gallery after the introduction
 *
 * Sections: the fragment's top-level elements (a top-level <style> goes with every section). Elements that point at
 * each other (ids in for, aria-*, commandfor, popovertarget, list, a handler's getElementById or querySelector) stay
 * together. A section is named by the comment before it, a heading before it, its own first label or heading, or
 * whether it is a static picture or the live element. Only fragments with two or more named sections are split.
 *
 *   node scripts/generate.mjs            (run by the dev, build and test scripts)
 */
import { parseFragment, serialize } from "parse5";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = resolve(HERE, "..");
const ROOT = resolve(APP, "../..");
const OUT = join(APP, "src/generated");
const INTERACTIONS = join(APP, "src/interactions");
/** --report lists every fragment's sections and their names (to check the splitting). */
const REPORT = process.argv.includes("--report");
/**
 * Accessibility problems known to live in a component, shared with the axe scan (tests/a11y/known-issues.ts): the
 * stories of that example leave exactly those nodes out of their axe check, so the rest stays checked.
 */
const KNOWN = join(ROOT, "tests/a11y/known-issues.ts");
const known = existsSync(KNOWN) ? (await import(pathToFileURL(KNOWN).href)).KNOWN_ISSUES ?? [] : [];

/** The core components' groups (PLAN.md). Kits are a group each. */
const GROUPS = {
  Actions: ["button", "button-group", "toggle", "segmented", "link"],
  Forms: ["field", "input", "textarea", "select", "combobox", "checkbox", "radio", "switch", "slider", "number", "search", "file-drop", "rating"],
  Navigation: ["app-bar", "tabs", "sidebar", "breadcrumbs", "pagination", "menu", "command", "progress-steps", "bottom-bar", "skip-link"],
  Feedback: ["alert", "toast", "dialog", "drawer", "popover", "tooltip", "progress", "loader", "skeleton", "empty-state", "badge"],
  Data: ["card", "tile", "list", "table", "avatar", "tag", "keycap", "stat", "divider", "accordion"],
  Layout: ["stack", "cluster", "grid", "window"],
};
const KITS = { game: "Game", blocks: "Blocks", effects: "Effects", icons: "Icons", font: "Font", sound: "Effects" };
/** Fragments that are one composition, not separable states. */
const WHOLE = new Set(["blocks/landing", "components/divider"]);
/**
 * Names for the sections of fragments whose parts carry no caption of their own, in order. A fragment listed here is
 * split even where the automatic names are missing; if its sections no longer number the same, the generator says so
 * and falls back to the automatic names.
 */
const NAMES = {
  "components/accordion": ["FAQ", "States"],
  "components/avatar": ["Pictures", "Initials and status", "Groups"],
  "components/badge": ["Tones and tiers", "Pinned"],
  "components/button": ["States", "Tones", "Sizes and icons"],
  "components/card": ["Profile and worlds", "States", "Horizontal"],
  "components/checkbox": ["States", "Sizes and tones", "Group"],
  "components/cluster": ["Tags", "Toolbar", "Switching"],
  "components/field": ["Form", "Inline"],
  "components/grid": ["Cards", "Stats", "Fill"],
  "components/input": ["Types and affixes", "States", "Sizes"],
  "components/keycap": ["In text", "Combinations and sizes", "Game prompts"],
  "components/loader": ["Ring and dots", "With a label", "In a panel"],
  "components/number": ["Fields", "States", "Sizes"],
  "components/progress": ["Bars", "Sizes", "Meters", "Loading a level"],
  "components/radio": ["States", "Sizes and tones", "Group"],
  "components/rating": ["Set a score", "Show a score"],
  "components/search": ["Search", "Filter bar", "Sizes and states"],
  "components/select": ["Selects", "Sizes"],
  "components/slider": ["Settings", "States"],
  "components/stat": ["Grid", "Compact"],
  "components/switch": ["States", "Sizes and tones", "Game settings"],
  "components/table": ["Leaderboard", "Small tables"],
  "components/tabs": ["Live", "States"],
  "components/tag": ["Tones", "Tiers and sizes", "Removable", "Filter chips"],
  "components/tile": ["Inventory", "States", "Sizes and tiers", "Launcher"],
  "components/toggle": ["States", "Icon toggles"],
  "components/tooltip": ["Static", "In a form", "Live"],
  "effects/world": ["Page scheme", "Each scheme"],
  "game/hud": ["In a game", "Parts"],
  "game/level": ["World select", "Tiles"],
  "game/prompt": ["Title screen", "Lines and glyphs"],
  "game/sprites": ["The set", "Toned"],
};

const problems = [];
const posix = (p) => p.split("\\").join("/");
const rel = (from, to) => {
  const r = posix(relative(dirname(from), to));
  return r.startsWith(".") ? r : `./${r}`;
};

// ------------------------------------------------------------------------------------------------- read the files

const packages = readdirSync(join(ROOT, "packages")).filter((p) => existsSync(join(ROOT, "packages", p, "package.json"))).sort();
const docs = new Map(); // name -> { file, front, pkg }
for (const pkg of packages) {
  const dir = join(ROOT, "packages", pkg, "docs");
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".md")).sort()) {
    const file = join(dir, f);
    const front = frontMatter(readFileSync(file, "utf8"));
    const name = f.replace(/\.md$/, "");
    docs.set(`${pkg}/${name}`, { file, front, pkg, name });
    if (!docs.has(name)) docs.set(name, { file, front, pkg, name });
  }
}

const examples = [];
for (const pkg of packages) {
  const dir = join(ROOT, "packages", pkg, "examples");
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".html")).sort()) examples.push({ pkg, name: f.replace(/\.html$/, ""), file: join(dir, f) });
}

function frontMatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  const out = {};
  if (!m) return out;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([\w-]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    let v = kv[2].trim().replace(/^"(.*)"$/, "$1");
    out[kv[1]] = v === "null" ? null : v;
  }
  return out;
}

function groupOf(pkg, name) {
  if (pkg === "components") {
    const group = Object.keys(GROUPS).find((g) => GROUPS[g].includes(name));
    if (!group) problems.push(`packages/components/examples/${name}.html: not in any group. Add "${name}" to GROUPS in scripts/generate.mjs.`);
    return ["Components", group ?? "Other"];
  }
  return [KITS[pkg] ?? pkg[0].toUpperCase() + pkg.slice(1)];
}

// ------------------------------------------------------------------------------------------------------ sections

const REF_ATTRS = ["for", "aria-labelledby", "aria-describedby", "aria-controls", "aria-owns", "aria-activedescendant", "aria-details", "aria-errormessage", "aria-flowto", "commandfor", "popovertarget", "interestfor", "list", "form", "headers", "anchor"];
const text = (node) => (node.nodeName === "#text" ? node.value : (node.childNodes ?? []).map(text).join(" ")).replace(/\s+/g, " ").trim();
/** A heading's own words, without the counts or badges inside it. */
const ownText = (node) => (node.childNodes ?? []).filter((c) => c.nodeName === "#text").map((c) => c.value).join("").replace(/\s+/g, " ").trim() || text(node);
const attr = (node, name) => node.attrs?.find((a) => a.name === name)?.value;
function* walk(node) {
  yield node;
  for (const c of node.childNodes ?? []) yield* walk(c);
  if (node.content) yield* walk(node.content);
}

/** What a top-level element defines (ids, tags) and points at (ids, tags). */
function links(node) {
  const ids = new Set(), tags = new Set(), refIds = new Set(), refTags = new Set();
  for (const n of walk(node)) {
    if (!n.attrs) continue;
    tags.add(n.nodeName);
    const id = attr(n, "id");
    if (id) ids.add(id);
    for (const a of n.attrs) {
      if (REF_ATTRS.includes(a.name)) a.value.split(/\s+/).filter(Boolean).forEach((v) => refIds.add(v));
      if (a.name.startsWith("on")) {
        for (const m of a.value.matchAll(/getElementById\(\s*['"]([^'"]+)['"]/g)) refIds.add(m[1]);
        for (const m of a.value.matchAll(/querySelector(?:All)?\(\s*['"]#([\w-]+)['"]/g)) refIds.add(m[1]);
        for (const m of a.value.matchAll(/querySelector(?:All)?\(\s*['"]([a-z][\w-]*-[\w-]*)['"]/g)) refTags.add(m[1]);
      }
    }
  }
  return { ids, tags, refIds, refTags };
}

/** A short name from a comment: "States, forced with data-blip-state: ..." -> "States". */
function nameFromComment(comment) {
  const t = comment.replace(/\s+/g, " ").trim();
  const m = /^(.{2,40}?)(?:[:.;,(]|\s[-–]\s|$)/.exec(t);
  return m ? m[1].trim() : t.slice(0, 40);
}
const HEADING = /^h[1-6]$/;
/** A section's name from inside it: its aria-label, its labelling heading, a first heading, or a first label. */
function nameFromInside(node, byId) {
  const label = attr(node, "aria-label");
  if (label) return label;
  const by = attr(node, "aria-labelledby");
  if (by && byId.has(by.split(/\s+/)[0])) return ownText(byId.get(by.split(/\s+/)[0]));
  const first = (node.childNodes ?? []).find((c) => c.attrs);
  if (first && (HEADING.test(first.nodeName) || /\bblip-label\b/.test(attr(first, "class") ?? "")) && ownText(first).length <= 40) return ownText(first);
  return undefined;
}
const isStatic = (node) => [...walk(node)].some((n) => n.attrs && (n.attrs.some((a) => a.name === "data-blip-static") || (n.attrs.some((a) => a.name === "inert") && n.attrs.some((a) => a.name === "aria-hidden"))));
const isLive = (node) => [...walk(node)].some((n) => /^blip-/.test(n.nodeName ?? "") || n.attrs?.some((a) => a.name.startsWith("on") || a.name === "commandfor" || a.name === "popovertarget"));
/** A short top-level paragraph or heading before a block captions it ("Wide", "Medium: 800 px"). */
const isCaption = (n) => HEADING.test(n.nodeName) || (n.nodeName === "p" && text(n).length <= 80 && !(n.childNodes ?? []).some((c) => c.attrs && !["span", "em", "strong", "b", "i"].includes(c.nodeName)));

function sectionsOf(html) {
  const frag = parseFragment(html);
  const styles = [], blocks = [];
  let caption = null, header = true, heading = null;
  const kids = frag.childNodes.filter((n) => n.nodeName !== "#text" || n.value.trim());
  kids.forEach((n, i) => {
    if (n.nodeName === "#text") return;
    if (n.nodeName === "#comment") {
      if (header && !blocks.length) header = false; // the file's own description
      else caption = n.data;
      return;
    }
    header = false;
    if (n.nodeName === "style" || n.nodeName === "script" || n.nodeName === "template") return void styles.push(n);
    // A caption only when an element follows it.
    if (isCaption(n) && kids.slice(i + 1).some((k) => k.attrs && !isCaption(k))) return void (heading = n);
    blocks.push({ nodes: heading ? [heading, n] : [n], caption, heading: heading ? ownText(heading) : undefined });
    caption = null;
    heading = null;
  });
  if (heading) blocks.push({ nodes: [heading], caption, heading: ownText(heading) });

  // Keep together what points at each other: union-find over the blocks.
  const byId = new Map();
  for (const n of walk(frag)) {
    const id = n.attrs && attr(n, "id");
    if (id) byId.set(id, n);
  }
  const info = blocks.map((b) => {
    const l = b.nodes.map(links);
    return { ids: new Set(l.flatMap((x) => [...x.ids])), tags: new Set(l.flatMap((x) => [...x.tags])), refIds: new Set(l.flatMap((x) => [...x.refIds])), refTags: new Set(l.flatMap((x) => [...x.refTags])) };
  });
  const parent = blocks.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const join2 = (a, b) => {
    const [x, y] = [find(a), find(b)].sort((p, q) => p - q);
    parent[y] = x;
  };
  info.forEach((a, i) => info.forEach((b, j) => {
    if (i === j) return;
    if ([...a.refIds].some((id) => b.ids.has(id) && !a.ids.has(id)) || [...a.refTags].some((t) => b.tags.has(t) && !a.tags.has(t))) join2(i, j);
  }));
  const groups = new Map();
  blocks.forEach((b, i) => {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(b);
  });

  // "Static" and "Live" name sections only where the fragment has both: a picture and the working thing.
  const kinds = [...groups.values()].map((members) => {
    const nodes = members.flatMap((m) => m.nodes);
    return nodes.every((n) => isStatic(n)) ? "Static" : members.some((m) => isLive(m.nodes.at(-1))) ? "Live" : undefined;
  });
  const both = kinds.includes("Static") && kinds.includes("Live");
  const sections = [...groups.values()].map((members, i) => {
    const nodes = members.flatMap((m) => m.nodes);
    const lead = members[0];
    const main = lead.nodes.at(-1);
    let name = lead.caption ? nameFromComment(lead.caption) : lead.heading ? nameFromComment(lead.heading) : nameFromInside(main, byId);
    if (!name && both) name = kinds[i];
    return { name, named: !!name, text: nodes.map(text).join(" "), html: [...styles, ...nodes].map((n) => serializeNode(n)).join("\n") };
  });
  return sections;
}

function serializeNode(node) {
  // parse5 serialises children; wrap the node in a throwaway parent to get its outer HTML.
  return serialize({ nodeName: "#document-fragment", childNodes: [node] });
}

// ------------------------------------------------------------------------------------------------- interactions

/** The stories a src/interactions/<name>.ts module exports: export const X = { name: "…", … }. */
function interactionsOf(name) {
  const file = join(INTERACTIONS, `${name}.ts`);
  if (!existsSync(file)) return null;
  const src = readFileSync(file, "utf8");
  const stories = [...src.matchAll(/^export const ([A-Z]\w*)(?:\s*:\s*[^=]+)?\s*=\s*\{\s*name:\s*"([^"]+)"/gm)].map((m) => ({ id: m[1], name: m[2] }));
  if (!stories.length) problems.push(`src/interactions/${name}.ts: no stories found. Export them as: export const Name = { name: "…", play: … }.`);
  return { file, stories };
}

// --------------------------------------------------------------------------------------------------------- write

const pascal = (s) => s.replace(/<[^>]*>/g, (t) => t.slice(1, -1)).replace(/[^A-Za-z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : "")).replace(/^./, (c) => c.toUpperCase()).replace(/^(\d)/, "S$1");
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const q = JSON.stringify;

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

let storyCount = 0, sectionCount = 0, interactionCount = 0, docsCount = 0;
const titles = new Set();
/** Docs page ids by markdown file name ("segmented" -> "components-actions-segmented-control--docs"), so the
    markdown's links to each other (segmented.md) open the right page. */
const pages = {};
for (const ex of examples) {
  const key = `${ex.pkg}/${ex.name}`;
  const doc = docs.get(key) ?? docs.get(ex.name);
  const html = readFileSync(ex.file, "utf8");
  const header = /^\s*<!--([\s\S]*?)-->/.exec(html)?.[1].replace(/\s+/g, " ").trim() ?? "";
  const display = doc?.front.name ?? (header ? nameFromComment(header) : ex.name);
  const title = [...groupOf(ex.pkg, ex.name), display].join("/");
  if (titles.has(title)) problems.push(`${posix(relative(ROOT, ex.file))}: the title "${title}" is used twice.`);
  titles.add(title);
  const base = slug(title);
  const storiesFile = join(OUT, `${base}.stories.ts`);
  const exampleRel = rel(storiesFile, ex.file);
  const meta = { example: posix(relative(ROOT, ex.file)), docs: doc ? posix(relative(ROOT, doc.file)) : null, package: `@blip/${doc?.pkg ?? ex.pkg}`, element: doc?.front.element ?? null, status: doc?.front.status ?? null };

  const exclude = known.filter((k) => k.example === key).map((k) => k.target);
  const sections = WHOLE.has(key) ? [] : sectionsOf(html);
  const names = NAMES[key];
  if (names && names.length !== sections.length) problems.push(`${posix(relative(ROOT, ex.file))}: NAMES in scripts/generate.mjs lists ${names.length} sections; the fragment has ${sections.length}. Update the names.`);
  else if (names) sections.forEach((s, i) => Object.assign(s, { name: names[i], named: true }));
  if (REPORT && sections.length > 1) console.log(`${key}\n${sections.map((s, i) => `  ${i}. ${s.name ?? "?"}  |  ${s.text.slice(0, 110)}`).join("\n")}`);
  const split = sections.length >= 2 && sections.filter((s) => s.named).length >= 2;
  const play = interactionsOf(ex.name);
  const used = new Set(["Gallery"]);
  const unique = (id) => {
    let out = id, n = 2;
    while (used.has(out)) out = `${id}${n++}`;
    used.add(out);
    return out;
  };

  const lines = [
    `// Generated by apps/storybook/scripts/generate.mjs from ${meta.example}${meta.docs ? ` and ${meta.docs}` : ""}. Do not edit:`,
    `// change the example, or src/interactions/${ex.name}.ts, and run the generator (the dev, build and test scripts do).`,
    `import type { Meta, StoryObj } from "@storybook/html-vite";`,
    `import gallery from ${q(`${exampleRel}?raw`)};`,
    `import { example } from "../lib/render";`,
    ...(play ? [`import * as interactions from ${q(rel(storiesFile, play.file).replace(/\.ts$/, ""))};`] : []),
    ``,
    `const meta = {`,
    `  title: ${q(title)},`,
    `  tags: ${q(["blip", ...(meta.element ? ["element"] : [])])},`,
    `  parameters: {`,
    `    blip: ${q(meta)},`,
    `    docs: { source: { code: gallery, language: "html" } },`,
    ...(exclude.length ? [`    a11y: { context: { exclude: ${q(exclude)} } },`] : []),
    `  },`,
    `  render: () => example(gallery),`,
    `} satisfies Meta;`,
    `export default meta;`,
    `type Story = StoryObj<typeof meta>;`,
    ``,
    `/** The whole example: every variant and state, as ${meta.example} draws it. */`,
    `export const Gallery: Story = {};`,
  ];
  storyCount++;
  if (split) {
    sections.forEach((s, i) => {
      const name = s.name ?? `Part ${i + 1}`;
      const id = unique(pascal(name) || `Part${i + 1}`);
      const constant = `SECTION_${i + 1}`;
      lines.push(``, `const ${constant} = ${q(s.html)};`, `/** A section of the example: ${name}. */`, `export const ${id}: Story = {`, `  name: ${q(name)},`, `  tags: ["section"],`, `  parameters: { docs: { source: { code: ${constant} } } },`, `  render: () => example(${constant}),`, `};`);
      storyCount++;
      sectionCount++;
    });
  }
  for (const s of play?.stories ?? []) {
    const id = unique(s.id);
    lines.push(``, `export const ${id}: Story = {`, `  ...interactions.${s.id},`, `  name: ${q(s.name)},`, `  tags: ["interaction"],`, `};`);
    storyCount++;
    interactionCount++;
  }
  writeFileSync(storiesFile, lines.join("\n") + "\n");

  if (doc) {
    pages[`${doc.pkg}/${doc.name}`] = pages[doc.name] = `${base}--docs`;
    const mdx = join(OUT, `${base}.mdx`);
    writeFileSync(mdx, [
      `{/* Generated by apps/storybook/scripts/generate.mjs from ${meta.docs}. Do not edit: change the markdown. */}`,
      `import { Meta, Canvas, Markdown } from "@storybook/addon-docs/blocks";`,
      `import * as Stories from "./${base}.stories";`,
      `import source from ${q(`${rel(mdx, doc.file)}?raw`)};`,
      `import { docParts } from "../lib/docs";`,
      `import { pages } from "./pages";`,
      ``,
      `export const doc = docParts(source, ${q(meta)}, pages);`,
      ``,
      `<Meta of={Stories} />`,
      ``,
      `<Markdown>{doc.intro}</Markdown>`,
      ``,
      `<Canvas of={Stories.Gallery} sourceState="none" />`,
      ``,
      `<Markdown>{doc.body}</Markdown>`,
      ``,
    ].join("\n"));
    docsCount++;
  } else {
    problems.push(`${meta.example}: no docs/${ex.name}.md, so no docs page (the stories are still there).`);
  }
}

writeFileSync(join(OUT, "pages.ts"), `// Generated by apps/storybook/scripts/generate.mjs: docs page ids by markdown file name.\nexport const pages: Record<string, string> = ${JSON.stringify(pages, null, 2)};\n`);

// Interaction modules whose example is gone.
if (existsSync(INTERACTIONS)) {
  for (const f of readdirSync(INTERACTIONS).filter((f) => f.endsWith(".ts"))) {
    if (!examples.some((e) => e.name === f.replace(/\.ts$/, ""))) problems.push(`src/interactions/${f}: no example named "${f.replace(/\.ts$/, "")}".`);
  }
}

console.log(`storybook: ${examples.length} examples -> ${storyCount} stories (${examples.length} galleries, ${sectionCount} sections, ${interactionCount} interactions), ${docsCount} docs pages`);
if (problems.length) console.warn(`  ${problems.length} note${problems.length > 1 ? "s" : ""}:\n    ${problems.join("\n    ")}`);
if (problems.some((p) => /not in any group|used twice|no stories found/.test(p))) process.exit(1);
