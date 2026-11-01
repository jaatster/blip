/** Reading the kits' stylesheets for the effects, blocks and game CSS tests. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { REPO } from "./fixtures.ts";

/** A package's stylesheet (packages/<pkg>/src/<file>) without its comments. */
export const css = (pkg: string, file: string): string => readFileSync(join(REPO, "packages", pkg, "src", file), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/** Everything inside the @media blocks whose query mentions `query` ("print"). */
export function media(text: string, query: string): string {
  let out = "";
  for (const m of text.matchAll(/@media([^{]*)\{/g)) {
    if (!m[1]!.includes(query)) continue;
    let depth = 1, i = m.index! + m[0].length;
    const start = i;
    while (depth && i < text.length) depth += text[i] === "{" ? 1 : text[i] === "}" ? -1 : 0, i++;
    out += text.slice(start, i - 1);
  }
  return out;
}
