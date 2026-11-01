/**
 * The shadcn/ui registry, as the docs show it: built by scripts/registry.mjs, the same function prepare.mjs writes
 * public/r/ with, so the list on the start page and the install line on a component page are the items served.
 */
// @ts-ignore: a plain Node script, without types
import { build, HOMEPAGE, NAMESPACE, THEME, TAILWIND } from "../../../../scripts/registry.mjs";
import { componentDocs, ROOT, type Doc } from "./data";

export interface ShadcnItem {
  name: string;
  type: string;
  title: string;
  description: string;
  /** npx shadcn@latest add @jaatster/blip-<name> */
  command: string;
  /** The component page it installs, for the ui items. */
  doc?: Doc;
  /** The files it writes into the app, through its components.json aliases (components/blip/button.tsx). */
  files: string[];
}

export const REGISTRY_URL: string = `${HOMEPAGE}/r/{name}.json`;
export const SHADCN_NAMESPACE: string = NAMESPACE;
/** shadcn's variable -> the Blip role it reads, and the Tailwind theme variables the theme sets. */
export const THEME_MAP: Record<string, string> = THEME;
export const THEME_TAILWIND: Record<string, string> = TAILWIND;
export const addCommand = (...names: string[]) => `npx shadcn@latest add ${names.map((n) => `${NAMESPACE}/${n}`).join(" ")}`;

let cache: ShadcnItem[] | undefined;
/** Every item, in the registry's order: setup, theme, utils, then the components. */
export function shadcnItems(root: string = ROOT): ShadcnItem[] {
  if (cache && root === ROOT) return cache;
  const docs = componentDocs();
  const items: ShadcnItem[] = [...build({ root }).items.values()].map((item: any) => {
    const file = item.type === "registry:ui" ? item.files?.[0] : undefined;
    const doc = file ? docs.find((d) => d.slug === item.name) : undefined;
    if (file && !doc) throw new Error(`docs: the shadcn item ${item.name} has no component page`);
    const files = (item.files ?? []).map((f: any) => String(f.target).replace(/^@(components|lib|ui|hooks)\//, "$1/"));
    return { name: item.name, type: item.type, title: item.title, description: item.description, command: addCommand(item.name), doc, files };
  });
  if (root === ROOT) cache = items;
  return items;
}

/** The item that installs a component page, if it has one. */
export const shadcnItemFor = (doc: Doc): ShadcnItem | undefined => shadcnItems().find((i) => i.doc?.slug === doc.slug);

/** The lines the setup item adds to the app's Tailwind CSS file, after `@import "tailwindcss"`. */
export const setupImports = (root: string = ROOT): string[] => Object.keys(build({ root }).items.get("setup").css);
