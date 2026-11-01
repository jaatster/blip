/**
 * CONTRACT.md's table of diagnostic codes against the source (scripts/diagnostics.mjs): every code a package raises
 * is listed, nothing is listed that is no longer raised, and the table is exactly what the script writes. When a
 * test here fails, run `node scripts/diagnostics.mjs` and commit CONTRACT.md.
 */
import { describe, expect, it } from "vitest";
import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { REPO, node, tempDir } from "../support/fixtures.ts";
// @ts-ignore: a plain Node script, without types
import { codesIn, compare, runs, scan, table } from "../../../scripts/diagnostics.mjs";

type Occurrence = { file: string; line: number; message: string; fix?: string };
const SCRIPT = join(REPO, "scripts/diagnostics.mjs");

describe("diagnostic codes in CONTRACT.md", () => {
  const result = compare(REPO) as { codes: Map<string, Occurrence[]>; missing: string[]; stale: string[]; upToDate: boolean };

  it("finds the codes the packages raise", () => {
    // The three the audit found missing from the old, hand-written table, and a build code.
    for (const code of ["PP-C001", "PP-M001", "PP-W002", "PP-T060"]) expect(result.codes.has(code), code).toBe(true);
    for (const [code, occ] of result.codes) for (const o of occ) expect(o.message, `${code} at ${o.file}:${o.line}`).toBeTruthy();
  });

  it("lists every code raised in the source", () => {
    expect(result.missing, "codes raised but not in CONTRACT.md: run node scripts/diagnostics.mjs").toEqual([]);
  });

  it("lists no code that nothing raises", () => {
    expect(result.stale, "codes in CONTRACT.md that nothing raises").toEqual([]);
  });

  it("is the table the script writes", () => {
    expect(result.upToDate, "CONTRACT.md's table is stale: run node scripts/diagnostics.mjs").toBe(true);
    const run = node(SCRIPT, ["--check"], REPO);
    expect(run.stderr).toBe("");
    expect(run.status).toBe(0);
  });
});

describe("the diagnostics script", () => {
  it("writes runs of consecutive codes and reads them back", () => {
    const codes = ["PP-T001", "PP-T002", "PP-T003", "PP-T010", "PP-T020", "PP-T021"];
    const text = runs(codes);
    expect(text).toBe("`PP-T001` to `PP-T003`, `PP-T010`, `PP-T020` and `PP-T021`");
    expect([...codesIn(`| x | ${text} |`)].sort()).toEqual(codes);
  });

  it("ignores codes that are only mentioned in comments", () => {
    const { dir, remove } = tempDir("diagnostics");
    try {
      mkdirSync(join(dir, "packages/demo/src"), { recursive: true });
      writeFileSync(
        join(dir, "packages/demo/src/demo.ts"),
        [
          '/** warn("PP-X001", "only an example") */',
          "// PP-X002 is retired",
          'export class Demo extends HTMLElement { connectedCallback() { warn("PP-X003", "<pp-demo> needs a list.", this); } }',
          'PixelElement.define("pp-demo", Demo);',
        ].join("\n"),
      );
      const codes = scan(dir) as Map<string, Occurrence[]>;
      expect([...codes.keys()]).toEqual(["PP-X003"]);
      expect(codes.get("PP-X003")![0]).toMatchObject({ file: "packages/demo/src/demo.ts", line: 3, message: "<pp-demo> needs a list." });
      // A prefix with no range written for it stops the table, naming the code and the file.
      expect(() => table(codes, dir)).toThrow(/PP-X003 \(packages\/demo\/src\/demo\.ts:3\) starts a new range, PP-X/);
    } finally {
      remove();
    }
  });

  it("fails --check when a code in the source is missing from the table", () => {
    const { dir, remove } = tempDir("diagnostics");
    try {
      // The packages' sources and build scripts (all the scan reads) and CONTRACT.md, with one code taken out of
      // the table.
      for (const pkg of readdirSync(join(REPO, "packages"))) {
        for (const sub of ["src", "scripts"]) {
          const from = join(REPO, "packages", pkg, sub);
          if (existsSync(from)) cpSync(from, join(dir, "packages", pkg, sub), { recursive: true });
        }
      }
      mkdirSync(join(dir, "scripts"));
      cpSync(SCRIPT, join(dir, "scripts/diagnostics.mjs"));
      const contract = (compare(REPO) as { contract: string }).contract;
      writeFileSync(join(dir, "CONTRACT.md"), contract.replace("`PP-C001`", "`PP-C002`"));
      const run = node(join(dir, "scripts/diagnostics.mjs"), ["--check"], dir);
      expect(run.status).toBe(1);
      expect(run.stderr).toMatch(/PP-C001 is raised in packages\/elements\/src\/command\.ts:\d+ but CONTRACT\.md does not list it/);
      expect(run.stderr).toMatch(/CONTRACT\.md lists PP-C002, which nothing raises/);
    } finally {
      remove();
    }
  }, 60_000);
});
