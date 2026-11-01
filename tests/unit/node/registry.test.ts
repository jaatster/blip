/**
 * The shadcn/ui registry (scripts/registry.mjs), run as the docs build runs it: every item matches shadcn's schema,
 * names files that exist, and depends on exactly what its files import; the docs list the items it builds; and it
 * refuses a tree that would ship a broken item. Reads the tokens' manifest from packages/tokens/dist (build first).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cpSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { REPO, tempDir } from "../support/fixtures.ts";
// @ts-ignore: a plain Node script, without types
import { build, ITEMS, NAMESPACE, problems, schemas, specifiers, THEME, validate, write } from "../../../scripts/registry.mjs";
import { shadcnItems } from "../../../apps/docs/src/lib/shadcn.ts";

type Item = { name: string; type: string; dependencies?: string[]; registryDependencies?: string[]; files?: { path: string; type: string; target?: string; content?: string }[]; css?: Record<string, unknown>; cssVars?: Record<string, Record<string, string>> };
const version = (pkg: string): string => JSON.parse(readFileSync(join(REPO, "packages", pkg, "package.json"), "utf8")).version;
const bare = (dep: string) => dep.replace(/(?<=.)@[^@/]*$/, "");

let out: { dir: string; remove: () => void };
let built: { registry: { items: Item[] }; items: Map<string, Item> };
const written = (name: string): Item => JSON.parse(readFileSync(join(out.dir, `${name}.json`), "utf8"));

beforeAll(() => {
  out = tempDir("registry");
  built = build();
  write(built, out.dir);
});
afterAll(() => out.remove());

describe("the registry scripts/registry.mjs writes", () => {
  it("is registry.json and one file per item, the setup, the theme, the helpers and every page in ITEMS", () => {
    const names = ["setup", "theme", "utils", ...ITEMS];
    expect(readdirSync(out.dir).sort()).toEqual(["registry.json", ...names.map((n) => `${n}.json`)].sort());
    expect(built.registry.items.map((i) => i.name)).toEqual(names);
  });

  it("matches shadcn's registry.json and registry-item.json schemas, item by item", () => {
    expect(problems(built)).toEqual([]);
    const { item, registry } = schemas();
    const refs = { "https://ui.shadcn.com/schema/registry-item.json": item };
    expect(validate(registry, JSON.parse(readFileSync(join(out.dir, "registry.json"), "utf8")), { refs })).toEqual([]);
    for (const name of built.items.keys()) expect(validate(item, written(name), { refs }), `${name}.json`).toEqual([]);
  });

  it("validates for real: the checker refuses what the schema forbids", () => {
    const { item } = schemas();
    expect(validate(item, { name: "x", type: "registry:widget" })).not.toEqual([]);
    expect(validate(item, { name: "x", type: "registry:ui", font: { family: "Pixelify Sans" } })).not.toEqual([]);
    expect(validate(item, { name: "x", type: "registry:file", files: [{ path: "a.ts", type: "registry:file" }] })).not.toEqual([]);
    expect(validate(item, { type: "registry:ui" })).not.toEqual([]);
  });

  it("keeps file content out of registry.json, as the shadcn directory asks, and in each item", () => {
    for (const i of built.registry.items) for (const f of i.files ?? []) expect(f.content, `${i.name}: ${f.path}`).toBeUndefined();
    for (const [name, i] of built.items) for (const f of i.files ?? []) expect(f.content, `${name}: ${f.path}`).toBeTruthy();
  });

  it("names files that exist, and installs components beside shadcn's own, in components/blip", () => {
    for (const [name, i] of built.items) {
      for (const f of i.files ?? []) {
        expect(existsSync(join(REPO, f.path)), `${name}: ${f.path}`).toBe(true);
        expect(f.target, `${name}: ${f.path}`).toMatch(i.type === "registry:ui" ? new RegExp(`^@components/blip/${name}\\.tsx$`) : /^@lib\/blip\/[\w-]+\.tsx?$/);
      }
    }
  });

  it("depends on exactly what each file imports: Blip's packages at their versions, the helpers, other items", () => {
    for (const [name, i] of built.items) {
      if (!i.files) continue;
      const deps = new Set<string>();
      const items = new Set<string>(i.type === "registry:ui" ? [`${NAMESPACE}/setup`] : []);
      for (const f of i.files) {
        for (const spec of specifiers(f.content!) as string[]) {
          if (spec === "react" || spec.startsWith("react/")) continue;
          if (spec.startsWith("@/lib/blip/")) items.add(`${NAMESPACE}/utils`);
          else if (spec.startsWith("@/components/blip/")) items.add(`${NAMESPACE}/${spec.split("/").pop()}`);
          else if (spec.startsWith("@blip/")) deps.add(spec.split("/").slice(0, 2).join("/"));
          else if (i.type === "registry:lib" && /^\.\/[\w-]+$/.test(spec)) expect(i.files.some((g) => g.path.match(/([\w-]+)\.tsx?$/)![1] === spec.slice(2)), `${name}: ${spec}`).toBe(true);
          else throw new Error(`${name}: ${f.path} imports "${spec}", which an installed file cannot resolve`);
        }
      }
      if (name === "utils") items.delete(`${NAMESPACE}/utils`);
      expect(new Set((i.dependencies ?? []).map(bare)), `${name}: dependencies`).toEqual(deps);
      expect(new Set(i.registryDependencies ?? []), `${name}: registryDependencies`).toEqual(items);
      for (const d of i.dependencies ?? []) expect(d, name).toBe(`${bare(d)}@^${version(bare(d).replace("@blip/", ""))}`);
      for (const r of i.registryDependencies ?? []) expect(built.items.has(r.replace(`${NAMESPACE}/`, "")), `${name} needs ${r}`).toBe(true);
    }
  });

  it("the element-backed components take their behaviour from @blip/react; the CSS-only ones need nothing but the setup", () => {
    for (const name of ["dialog", "tabs", "field"]) expect(built.items.get(name)!.dependencies, name).toEqual([`@blip/react@^${version("react")}`]);
    for (const name of ["button", "card", "badge", "tag", "alert"]) expect(built.items.get(name)!.dependencies, name).toBeUndefined();
    expect(built.items.get("dialog")!.files![0]!.content).toContain('export { Dialog, type DialogProps } from "@blip/react";');
  });

  it("the setup brings the CSS packages at their versions, imported under Tailwind's utilities", () => {
    const setup = built.items.get("setup")!;
    expect(setup.dependencies).toEqual(["font", "tokens", "core", "components"].map((p) => `@blip/${p}@^${version(p)}`));
    const imports = Object.keys(setup.css!);
    expect(imports.length).toBeGreaterThan(3);
    for (const line of imports) expect(line).toMatch(/^@import "@blip\/[\w-]+\/[\w-]+\.css" layer\(components\)$/);
    expect(imports[0]).toContain("@blip/font/");
  });

  it("the theme maps every shadcn variable onto a Blip role by reference, the same in light, dark and a scheme set on part of a page", () => {
    const theme = built.items.get("theme")!;
    expect(theme.type).toBe("registry:theme");
    const roles = Object.fromEntries(Object.entries(THEME as Record<string, string>).map(([k, r]) => [k, `var(--blip-${r})`]));
    expect(theme.cssVars!.light).toEqual({ ...roles, radius: "0rem" });
    expect(theme.cssVars!.dark).toEqual(roles);
    const scoped = (theme.css!["@layer base"] as Record<string, Record<string, string>>)["[data-blip-scheme], [data-blip-palette]"]!;
    expect(scoped).toEqual(Object.fromEntries(Object.entries(roles).map(([k, v]) => [`--${k}`, v])));
    for (const v of ["background", "foreground", "primary", "border", "ring", "radius"]) expect(theme.cssVars!.light, v).toHaveProperty(v);
  });

  it("ships no Tailwind classes in Blip's files: every class an installed file writes is Blip's own", () => {
    for (const [name, i] of built.items) {
      for (const f of i.files ?? []) {
        for (const m of f.content!.matchAll(/className=\{?(?:cx\()?"([^"]*)"/g)) {
          for (const cls of m[1]!.split(/\s+/).filter(Boolean)) expect(cls, `${name}: ${f.path}`).toMatch(/^blip-/);
        }
      }
    }
  });
});

describe("the docs", () => {
  it("list exactly the registry's items, each component with its page and the command that adds it", () => {
    const listed = shadcnItems();
    expect(listed.map((i) => i.name)).toEqual(built.registry.items.map((i) => i.name));
    for (const i of listed) {
      expect(i.command).toBe(`npx shadcn@latest add ${NAMESPACE}/${i.name}`);
      if (i.type === "registry:ui") {
        expect(i.doc?.slug, i.name).toBe(i.name);
        expect(i.files).toEqual([`components/blip/${i.name}.tsx`]);
      } else expect(i.doc, i.name).toBeUndefined();
    }
  });
});

describe("a tree the registry refuses", () => {
  /** The parts of the repository the generator reads, copied. */
  function tree(): { dir: string; remove: () => void } {
    const t = tempDir("registry-tree");
    for (const part of ["scripts/shadcn", "packages/react/src", "packages/tokens/dist/json/manifest.json", "packages/core/src/css"]) cpSync(join(REPO, part), join(t.dir, part), { recursive: true });
    for (const pkg of readdirSync(join(REPO, "packages"))) {
      if (existsSync(join(REPO, "packages", pkg, "package.json"))) cpSync(join(REPO, "packages", pkg, "package.json"), join(t.dir, "packages", pkg, "package.json"));
      if (existsSync(join(REPO, "packages", pkg, "docs"))) cpSync(join(REPO, "packages", pkg, "docs"), join(t.dir, "packages", pkg, "docs"), { recursive: true });
    }
    return t;
  }

  it("builds the same registry from the copy as from the repository", () => {
    const t = tree();
    try {
      expect(JSON.stringify(build({ root: t.dir }).registry)).toBe(JSON.stringify(built.registry));
    } finally {
      t.remove();
    }
  });

  it("an import of a component that has no item", () => {
    const t = tree();
    try {
      const file = join(t.dir, "packages/react/src/components/card.tsx");
      writeFileSync(file, `import { Tile } from "./tile.js";\n${readFileSync(file, "utf8")}`);
      expect(() => build({ root: t.dir })).toThrow(/imports \.\/tile\.js, which has no item: add "tile" to ITEMS/);
    } finally {
      t.remove();
    }
  });

  it("an import of a package that is not Blip's", () => {
    const t = tree();
    try {
      const file = join(t.dir, "packages/react/src/components/badge.tsx");
      writeFileSync(file, `import { clsx } from "clsx";\n${readFileSync(file, "utf8")}`);
      expect(() => build({ root: t.dir })).toThrow(/imports "clsx"/);
    } finally {
      t.remove();
    }
  });

  it("a page in ITEMS with no React file of its own", () => {
    const t = tree();
    try {
      rmSync(join(t.dir, "packages/react/src/components/tabs.tsx"));
      expect(() => build({ root: t.dir })).toThrow(/tabs has no React file of its own/);
    } finally {
      t.remove();
    }
  });

  it("a theme role the tokens no longer have", () => {
    const t = tree();
    try {
      const file = join(t.dir, "packages/tokens/dist/json/manifest.json");
      writeFileSync(file, JSON.stringify(JSON.parse(readFileSync(file, "utf8")).filter((e: { cssVar: string }) => e.cssVar !== "--blip-selection-bg")));
      expect(() => build({ root: t.dir })).toThrow(/--blip-selection-bg/);
    } finally {
      t.remove();
    }
  });
});
