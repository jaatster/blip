/**
 * Install snippets: one set of packages written for each package manager (npm, pnpm, yarn, bun) and for a CDN, so
 * every install box on the site says the same thing. The reader's choice is kept in localStorage under INSTALL_KEY
 * and every box on the page follows it (public/js/site.js, "install").
 */
import { pkgVersion } from "./data";

export type Manager = "npm" | "pnpm" | "yarn" | "bun" | "cdn";
export const MANAGERS: { id: Manager; label: string }[] = [
  { id: "npm", label: "npm" },
  { id: "pnpm", label: "pnpm" },
  { id: "yarn", label: "yarn" },
  { id: "bun", label: "bun" },
  { id: "cdn", label: "CDN" },
];
export const INSTALL_KEY = "blip-docs:install";

const ADD: Record<Exclude<Manager, "cdn">, string> = { npm: "npm install", pnpm: "pnpm add", yarn: "yarn add", bun: "bun add" };

/** One install command: the packages, by their short names (font, core) or full ones, and an optional comment. */
export interface InstallLine {
  packages: string[];
  comment?: string;
}

const full = (p: string) => (p.startsWith("@") ? p : `@blip/${p}`);

/** The lines for one package manager, their comments lined up after the longest command. */
export function commands(manager: Exclude<Manager, "cdn">, lines: InstallLine[]): string {
  const cmds = lines.map((l) => `${ADD[manager]} ${l.packages.map(full).join(" ")}`);
  const width = Math.max(...cmds.map((c, i) => (lines[i]!.comment ? c.length : 0)));
  return cmds.map((c, i) => (lines[i]!.comment ? `${c.padEnd(width)}   # ${lines[i]!.comment}` : c)).join("\n");
}

export const CDN_BASE = "https://cdn.jsdelivr.net/npm/@blip";
/** A package's file on the CDN, at the version in the repository: cdnUrl("core", "dist/core.min.css"). */
export const cdnUrl = (pkg: string, path: string) => `${CDN_BASE}/${pkg}@${pkgVersion(pkg)}/${path}`;

/** The stylesheets the four core packages need, as <link>s from the CDN. */
export const cdnStylesheets = (): string =>
  [cdnUrl("font", "font.css"), cdnUrl("tokens", "dist/css/tokens.css"), cdnUrl("core", "dist/core.min.css"), cdnUrl("components", "dist/components.min.css")]
    .map((href) => `<link rel="stylesheet" href="${href}">`)
    .join("\n");
