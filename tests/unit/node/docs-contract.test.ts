/**
 * CONTRACT.md against the code: its table of elements is exactly what scripts/contract-elements.mjs writes from the
 * Custom Elements Manifests (when it fails, run `pnpm cem`, then `node scripts/contract-elements.mjs`), and its
 * token counts are the manifest's, family by family (when they fail, correct the table under "Tokens").
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { REPO, node, tokensCopy } from "../support/fixtures.ts";
// @ts-ignore: a plain Node script, without types
import { compare, rows } from "../../../scripts/contract-elements.mjs";

describe("elements in CONTRACT.md", () => {
  it("lists every element the manifests define", () => {
    const listed = (rows(REPO) as string[][]).map((r) => r[0]);
    expect(listed.length).toBeGreaterThan(20);
    for (const tag of ["<blip-dialog>", "<blip-tabs>", "<blip-world>", "<blip-icon>"]) expect(listed).toContain(`\`${tag}\``);
  });

  it("is the table the script writes from the manifests", () => {
    expect((compare(REPO) as { upToDate: boolean }).upToDate, "CONTRACT.md's elements table is stale: run node scripts/contract-elements.mjs").toBe(true);
    const run = node(join(REPO, "scripts/contract-elements.mjs"), ["--check"], REPO);
    expect(run.stderr).toBe("");
    expect(run.status).toBe(0);
  });
});

describe("tokens in CONTRACT.md", () => {
  // The token families as CONTRACT.md groups them, by name (the manifest says which change with the scheme).
  type Token = { name: string; scheme: boolean };
  const family = (t: Token): string => {
    if (["ink", "ink-soft", "white"].includes(t.name)) return "Ink and white";
    if (t.name.startsWith("palette-")) return "Palettes";
    if (t.name.startsWith("candy-")) return "Candies";
    if (t.name.startsWith("deep-")) return "Night surfaces";
    if (t.name.startsWith("tone-")) return "Text tones";
    if (t.name.startsWith("world-")) return "World";
    if (t.name.startsWith("scene-")) return "Scene";
    if (t.name === "pixel") return "The pixel";
    if (t.scheme) return "Scheme roles";
    if (/^(space-|radius-|control-|icon-|line-(outline|focus|drop)$|target-)/.test(t.name)) return "Sizes in pixels";
    if (/^(breakpoint|layer)-/.test(t.name)) return "Breakpoints and layers";
    if (/^(duration|steps|delay)-/.test(t.name)) return "Motion";
    if (/^(font|weight|display-scale|size|leading|tracking)-/.test(t.name)) return "Type";
    return `no family: ${t.name}`;
  };
  // The manifest, built from the token sources into a throwaway copy (no package's dist is touched or needed).
  let manifest: Token[] = [];
  let copy: ReturnType<typeof tokensCopy>;
  beforeAll(() => {
    copy = tokensCopy();
    const run = copy.build();
    if (run.status !== 0) throw new Error(`the token build failed:\n${run.stderr}`);
    manifest = JSON.parse(readFileSync(join(copy.dir, "dist/json/manifest.json"), "utf8")) as Token[];
  }, 60_000);
  afterAll(() => copy?.remove());
  const contract = readFileSync(join(REPO, "CONTRACT.md"), "utf8");

  it("counts every token, and each family, as the manifest does", () => {
    expect(contract).toContain(`${manifest.length} tokens today`);
    const counts = new Map<string, number>();
    for (const t of manifest) counts.set(family(t), (counts.get(family(t)) ?? 0) + 1);
    expect([...counts.keys()].filter((k) => k.startsWith("no family")), "tokens CONTRACT.md has no family for").toEqual([]);
    const listed = new Map([...contract.matchAll(/^\| ([A-Z][^|]+?) \| (\d+) \|/gm)].map((m) => [m[1]!, Number(m[2])]));
    for (const [name, n] of counts) expect(listed.get(name), `the ${name} row of CONTRACT.md's token table`).toBe(n);
  });
});
