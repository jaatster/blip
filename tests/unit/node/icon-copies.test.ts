/**
 * Pasted icons stay in step with @blip/icons. Examples, docs, component comments and the React search field draw
 * some icons inline (a 12 x 12 SVG with the path written out); every such path must be the path of a current icon, so
 * redrawing an icon cannot leave an old copy behind. The set is built from source into a temporary copy first.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { iconsCopy, REPO } from "../support/fixtures.ts";

let paths = new Map<string, string>();
let copy: ReturnType<typeof iconsCopy>;
beforeAll(() => {
  copy = iconsCopy();
  const run = copy.build();
  if (run.status !== 0) throw new Error(`the icon build failed:\n${run.stderr}`);
  const { icons } = JSON.parse(readFileSync(join(copy.pkg, "dist/icons.json"), "utf8")) as { icons: { name: string; path: string }[] };
  paths = new Map(icons.map((i) => [i.path, i.name]));
}, 60_000);
afterAll(() => copy?.remove());

const tracked = execFileSync("git", ["ls-files"], { cwd: REPO, encoding: "utf8" })
  .split("\n")
  .filter((f) => /\.(html|md|astro|css|ts|tsx|js|mjs)$/.test(f) && !/(^|\/)dist\//.test(f) && !f.startsWith("tests/"));

describe("inline icons", () => {
  it("every 12 x 12 icon written out in the repository is a current icon", () => {
    const stale: string[] = [];
    let seen = 0;
    for (const file of tracked) {
      const text = readFileSync(join(REPO, file), "utf8");
      for (const m of text.matchAll(/viewBox="0 0 12 12"[^>]*>\s*<path d="([^"]+)"/g)) {
        if (m[1]!.includes("${")) continue; // a template that writes the current path in
        seen++;
        if (!paths.has(m[1]!)) stale.push(`${file}: <path d="${m[1]!.slice(0, 32)}…"> is not the path of any icon. Copy the current one from @blip/icons.`);
      }
    }
    expect(seen).toBeGreaterThan(100);
    expect(stale).toEqual([]);
  });

  it("the React search field's magnifier is the search icon", () => {
    const text = readFileSync(join(REPO, "packages/react/src/components/search.tsx"), "utf8");
    const literal = /const magnifier =\s*((?:"[^"]*"\s*\+?\s*)+);/.exec(text)?.[1] ?? "";
    const path = [...literal.matchAll(/"([^"]*)"/g)].map((m) => m[1]).join("");
    expect(paths.get(path)).toBe("search");
  });
});
