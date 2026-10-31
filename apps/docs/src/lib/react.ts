/** What @jaatster/blip-react exports, read from its source when the site builds, so a page only promises what exists. */
import { exists, read } from "./data";

const ENTRIES: Record<string, string> = { "@jaatster/blip-react": "index.ts", "@jaatster/blip-react/game": "game.ts", "@jaatster/blip-react/blocks": "blocks.ts", "@jaatster/blip-react/effects": "effects.ts", "@jaatster/blip-react/icons": "icons.tsx" };
const BASE = "packages/react/src";

function namesIn(file: string, seen = new Set<string>()): Set<string> {
  const out = new Set<string>();
  if (seen.has(file) || !exists(`${BASE}/${file}`)) return out;
  seen.add(file);
  const src = read(`${BASE}/${file}`);
  const dir = file.includes("/") ? file.slice(0, file.lastIndexOf("/") + 1) : "";
  for (const m of src.matchAll(/export\s+(?:const|function|class)\s+([A-Z]\w*)/g)) out.add(m[1]!);
  for (const m of src.matchAll(/export\s*\{([^}]*)\}/g)) for (const part of m[1]!.split(",")) { const n = part.trim().replace(/^type\s+/, "").split(/\s+as\s+/).pop()!.trim(); if (/^[A-Z]/.test(n) && !part.trim().startsWith("type ")) out.add(n); }
  for (const m of src.matchAll(/export\s*\*\s*from\s*"\.\/([^"]+)"/g)) {
    const rel = (dir + m[1]!).replace(/\.js$/, "");
    const file2 = [".ts", ".tsx"].map((e) => rel + e).find((f) => exists(`${BASE}/${f}`));
    if (file2) for (const n of namesIn(file2, seen)) out.add(n);
  }
  return out;
}

let cache: Map<string, Set<string>> | undefined;
export function reactExports(): Map<string, Set<string>> {
  cache ??= new Map(Object.entries(ENTRIES).map(([entry, file]) => [entry, namesIn(file)]));
  return cache;
}
/** The entry that exports a name, preferring the given one. */
export function reactEntryFor(name: string, preferred: string): string | undefined {
  const all = reactExports();
  if (all.get(preferred)?.has(name)) return preferred;
  for (const [entry, names] of all) if (names.has(name)) return entry;
  return undefined;
}
