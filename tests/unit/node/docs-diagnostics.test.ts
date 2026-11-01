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
    // The three the audit found missing from the old, hand-written table, and two build codes (a palette's, a pair's).
    for (const code of ["CHU-C001", "CHU-M001", "CHU-W002", "CHU-T005", "CHU-T060"]) expect(result.codes.has(code), code).toBe(true);
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
    const codes = ["CHU-T001", "CHU-T002", "CHU-T003", "CHU-T010", "CHU-T020", "CHU-T021"];
    const text = runs(codes);
    expect(text).toBe("`CHU-T001` to `CHU-T003`, `CHU-T010`, `CHU-T020` and `CHU-T021`");
    expect([...codesIn(`| x | ${text} |`)].sort()).toEqual(codes);
  });

  it("ignores codes that are only mentioned in comments", () => {
    const { dir, remove } = tempDir("diagnostics");
    try {
      mkdirSync(join(dir, "packages/demo/src"), { recursive: true });
      writeFileSync(
        join(dir, "packages/demo/src/demo.ts"),
        [
          '/** warn("CHU-X001", "only an example") */',
          "// CHU-X002 is retired",
          'export class Demo extends HTMLElement { connectedCallback() { warn("CHU-X003", "<chu-demo> needs a list.", this); } }',
          'BlipElement.define("chu-demo", Demo);',
        ].join("\n"),
      );
      const codes = scan(dir) as Map<string, Occurrence[]>;
      expect([...codes.keys()]).toEqual(["CHU-X003"]);
      expect(codes.get("CHU-X003")![0]).toMatchObject({ file: "packages/demo/src/demo.ts", line: 3, message: "<chu-demo> needs a list." });
      // A prefix with no range written for it stops the table, naming the code and the file.
      expect(() => table(codes, dir)).toThrow(/CHU-X003 \(packages\/demo\/src\/demo\.ts:3\) starts a new range, CHU-X/);
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
      writeFileSync(join(dir, "CONTRACT.md"), contract.replace("`CHU-C001`", "`CHU-C002`"));
      const run = node(join(dir, "scripts/diagnostics.mjs"), ["--check"], dir);
      expect(run.status).toBe(1);
      expect(run.stderr).toMatch(/CHU-C001 is raised in packages\/elements\/src\/command\.ts:\d+ but CONTRACT\.md does not list it/);
      expect(run.stderr).toMatch(/CONTRACT\.md lists CHU-C002, which nothing raises/);
    } finally {
      remove();
    }
  }, 60_000);
});
