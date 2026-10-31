/**
 * @jaatster/blip-icons' build (packages/icons/scripts/build.mjs), run on temporary copies: every pixel map is checked and
 * each mistake is reported at its file and line with a fix, all at once; a clean set traces into whole-pixel paths.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { iconsCopy, type Run } from "../support/fixtures.ts";

const BLANK = "............";
/** A 12 x 12 map from rows; missing rows are blank. */
const map = (...rows: string[]) => rows.concat(Array(Math.max(0, 12 - rows.length)).fill(BLANK)).join("\n");
const icon = (header: string, ...rows: string[]) => `${header}\n${map(...rows)}\n`;
const DOT = ["....XX......", "....XX......"].map((r, i) => (i ? r : BLANK));

/** Builds a temporary package with only these .icons files. */
function buildWith(sources: Record<string, string>): Run & { wrote: boolean } {
  const copy = iconsCopy({ sources });
  try {
    const run = copy.build();
    return { ...run, wrote: existsSync(join(copy.pkg, "dist")) };
  } finally {
    copy.remove();
  }
}

describe("icons build: pixel map errors", () => {
  it("a row that is not 12 wide: names the file, the line and how many to remove", () => {
    const run = buildWith({ "shapes.icons": icon("@ wide tags: test", BLANK, "..XXXXXXXX...") });
    expect(run.status).toBe(1);
    expect(run.stderr).toContain(`src/shapes.icons:3: row 2 of "wide" is 13 wide. Every row is exactly 12 ('X' or '.'): remove 1.`);
    expect(run.wrote).toBe(false);
  });

  it("a character that is not X or a dot: names the line and the column", () => {
    const run = buildWith({ "shapes.icons": icon("@ smudge tags: test", BLANK, "...XXoX.....") });
    expect(run.status).toBe(1);
    expect(run.stderr).toContain(`src/shapes.icons:3:6: "o" in "smudge" (row 2). Use 'X' for a pixel and '.' for empty.`);
  });

  it("an icon without tags", () => {
    const run = buildWith({ "shapes.icons": icon("@ lonely", ...DOT) });
    expect(run.status).toBe(1);
    expect(run.stderr).toContain(`src/shapes.icons:1: "lonely" has no tags. Add a few words people would search for: '@ lonely tags: word, word'.`);
  });

  it("a name drawn twice, even in different files, points at the first", () => {
    const run = buildWith({ "aa.icons": icon("@ twin tags: test", ...DOT), "bb.icons": `# second copy\n${icon("@ twin tags: test", ...DOT)}` });
    expect(run.status).toBe(1);
    expect(run.stderr).toContain(`src/bb.icons:2: "twin" is already drawn at src/aa.icons:1. Names are unique across all files: rename one.`);
  });

  it("a name that is not kebab-case suggests one", () => {
    const run = buildWith({ "shapes.icons": icon("@ HappyFace tags: test", ...DOT) });
    expect(run.status).toBe(1);
    expect(run.stderr).toContain(`src/shapes.icons:1: "HappyFace" is not a kebab-case name (lower-case letters and digits, single hyphens). Try "happy-face".`);
  });

  it("thirteen rows", () => {
    const run = buildWith({ "shapes.icons": `@ tall tags: test\n${[...DOT, ...Array(11).fill(BLANK)].join("\n")}\n` });
    expect(run.status).toBe(1);
    expect(run.stderr).toContain(`src/shapes.icons:14: "tall" has more than 12 rows. An icon is exactly 12 x 12: remove a row, or start a new icon with a header.`);
  });

  it("eleven rows, the block ended by a blank line", () => {
    const run = buildWith({ "shapes.icons": `@ short tags: test\n${[...DOT, ...Array(9).fill(BLANK)].join("\n")}\n\n@ next tags: test\n${map(...DOT)}\n` });
    expect(run.status).toBe(1);
    expect(run.stderr).toContain(`src/shapes.icons:1: "short" has 11 rows; its block ends at line 13.`);
  });

  it("an icon with no pixels", () => {
    const run = buildWith({ "shapes.icons": icon("@ ghost tags: test") });
    expect(run.status).toBe(1);
    expect(run.stderr).toContain(`src/shapes.icons:1: "ghost" has no pixels. Draw it with 'X'.`);
  });

  it("a tag listed twice, and a tag that is not lower-case words", () => {
    const run = buildWith({ "shapes.icons": icon("@ tagged tags: heart, Love, heart", ...DOT) });
    expect(run.status).toBe(1);
    expect(run.stderr).toContain(`src/shapes.icons:1: the tag "Love" of "tagged" should be lower-case words, e.g. "love".`);
    expect(run.stderr).toContain(`src/shapes.icons:1: "tagged" lists the tag "heart" twice. Remove one.`);
  });

  it("rows before any header, and a header without a name", () => {
    const run = buildWith({ "shapes.icons": `${BLANK}\n..XX........\n\n@\n` });
    expect(run.status).toBe(1);
    expect(run.stderr).toContain(`src/shapes.icons:2: expected an icon header ('@ <name> tags: word, word') or a '#' comment, found "..XX........".`);
    expect(run.stderr).toContain(`src/shapes.icons:4: a header is '@ <kebab-name> tags: word, word' (or '@ <kebab-name> thin tags: …' for an icon allowed one-pixel lines), e.g. '@ heart tags: love, like, favourite'.`);
  });

  it("a category file that is not kebab-case", () => {
    const run = buildWith({ "Game_Items.icons": icon("@ coin tags: money", ...DOT) });
    expect(run.status).toBe(1);
    expect(run.stderr).toContain(`src/Game_Items.icons: a category file is named in kebab-case, e.g. "game-items.icons".`);
  });

  it("a one-pixel line: names the line, the column and the two ways out", () => {
    const run = buildWith({ "shapes.icons": icon("@ stick tags: test", BLANK, BLANK, "..XXXXXX....") });
    expect(run.status).toBe(1);
    expect(run.stderr).toContain(`src/shapes.icons:4:3: "stick" has a one-pixel flat line, 6 pixels long, from row 3, column 3. Every line is two pixels thick: thicken it, or cut it out of a solid shape. If it has to stay thin, say so in the header: '@ stick thin tags: …'.`);
  });

  it("a staircase of single pixels is one diagonal line, reported once", () => {
    const run = buildWith({ "shapes.icons": icon("@ stairs tags: test", BLANK, ".X..........", "..X.........", "...X........") });
    expect(run.status).toBe(1);
    expect(run.stderr.match(/"stairs"/g)).toHaveLength(1);
    expect(run.stderr).toContain(`src/shapes.icons:3:2: "stairs" has a one-pixel diagonal line, 3 pixels long, from row 2, column 2.`);
  });

  it("a lone pixel", () => {
    const run = buildWith({ "shapes.icons": icon("@ dust tags: test", BLANK, "....XX......", "....XX......", BLANK, "........X...") });
    expect(run.status).toBe(1);
    expect(run.stderr).toContain(`src/shapes.icons:6:9: "dust" has a lone pixel at row 5, column 9: it touches no other pixel on a side, so it reads as dust. Join it to a neighbour or remove it.`);
  });

  it("two-pixel lines, two-pixel diagonals and one-pixel gaps pass; 'thin' lets a one-pixel line through", () => {
    const chevron = icon("@ chevron tags: test", BLANK, BLANK, BLANK, ".XX......XX.", "..XX....XX..", "...XX..XX...", "....XXXX....", ".....XX.....");
    const slotted = icon("@ slotted tags: test", BLANK, "..XXXXXXXX..", "..XX.XX.XX..", "..XX.XX.XX..", "..XXXXXXXX..");
    const stick = icon("@ stick thin tags: test", BLANK, BLANK, "..XXXXXX....");
    // Only the pixel-map checks: the build goes on to draw its examples page, which needs the real set.
    expect(buildWith({ "shapes.icons": [chevron, slotted, stick].join("\n") }).stderr).not.toMatch(/in the pixel maps/);
  });

  it("lists every problem at once, in file order, and exits 1 without writing anything", () => {
    const run = buildWith({
      "aa.icons": icon("@ first tags: test", BLANK, "..XXX........"),
      "bb.icons": [icon("@ second tags: test", BLANK, "..XXXXXXXXXXXX"), icon("@ Third tags: test", ...DOT)].join("\n"),
    });
    expect(run.status).toBe(1);
    expect(run.wrote).toBe(false);
    expect(run.stderr).toMatch(/^@blip\/icons: 3 problems in the pixel maps:/);
    const lines = run.stderr.split("\n").filter((l) => l.startsWith("  src/"));
    expect(lines.map((l) => l.trim().split(":").slice(0, 2).join(":"))).toEqual(["src/aa.icons:3", "src/bb.icons:3", "src/bb.icons:15"]);
  });
});

describe("icons build: a clean build of the real set plus two test icons", () => {
  let copy: ReturnType<typeof iconsCopy>;
  let run: Run;
  beforeAll(() => {
    copy = iconsCopy({
      extra: {
        "zz-test.icons": [
          icon("@ test-ring thin tags: circle, hole", BLANK, BLANK, "...XXXXXX...", "..XX....XX..", "..X......X..", "..X......X..", "..X......X..", "..X......X..", "..XX....XX..", "...XXXXXX..."),
          icon("@ test-steps thin tags: diagonal, corner", BLANK, ".X..........", "..X.........", "...X........", "....X.......", ".....X......", "......X.....", ".......X....", "........X...", ".........X..", "..........X."),
        ].join("\n"),
      },
    });
    run = copy.build();
  }, 60_000);
  afterAll(() => copy.remove());

  it("succeeds and writes every output", () => {
    expect(run.stderr.replace(/^ {2}\d+ warnings?:[\s\S]*$/m, "").trim()).toBe("");
    expect(run.status).toBe(0);
    for (const file of ["index.js", "index.d.ts", "icons.json", "sprite.svg", "element.js", "element.d.ts"]) expect(existsSync(join(copy.pkg, "dist", file)), file).toBe(true);
    expect(existsSync(join(copy.pkg, "examples/icons.html"))).toBe(true);
  });

  it("traces a shape with a hole into one path of whole-pixel moves", () => {
    const { icons } = JSON.parse(readFileSync(join(copy.pkg, "dist/icons.json"), "utf8"));
    const ring = icons.find((i: { name: string }) => i.name === "test-ring");
    expect(ring).toMatchObject({ category: "zz-test", tags: ["circle", "hole"] });
    // The outline clockwise, then the hole anticlockwise (relative move): it fills the same with nonzero or evenodd.
    expect(ring.path).toBe("M3 2h6v1h1v6H9v1H3V9H2V3h1zm1 1v1H3v4h1v1h4V8h1V4H8V3z");
    expect(ring.path).not.toMatch(/\d\.\d/);
  });

  it("walks a one-pixel diagonal as one outline, not a run of squares", () => {
    const { icons } = JSON.parse(readFileSync(join(copy.pkg, "dist/icons.json"), "utf8"));
    const steps = icons.find((i: { name: string }) => i.name === "test-steps").path as string;
    expect(steps.match(/[Mm]/g)).toHaveLength(1);
    expect(steps).toBe("M1 1h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1h1v1h-1v-1H9V9H8V8H7V7H6V6H5V5H4V4H3V3H2V2H1z");
  });

  it("writes one SVG per icon, a sprite symbol for each, and names that match", async () => {
    const { icons } = JSON.parse(readFileSync(join(copy.pkg, "dist/icons.json"), "utf8")) as { icons: { name: string; path: string }[] };
    const svgs = readdirSync(join(copy.pkg, "dist/svg")).map((f) => f.replace(/\.svg$/, "")).sort();
    expect(svgs).toEqual(icons.map((i) => i.name).sort());
    const sprite = readFileSync(join(copy.pkg, "dist/sprite.svg"), "utf8");
    for (const i of icons) expect(sprite).toContain(`<symbol id="pp-icon-${i.name}" viewBox="0 0 12 12"`);
    const ring = readFileSync(join(copy.pkg, "dist/svg/test-ring.svg"), "utf8");
    expect(ring).toContain('viewBox="0 0 12 12"');
    expect(ring).toContain('shape-rendering="crispEdges"');

    const js = await import(pathToFileURL(join(copy.pkg, "dist/index.js")).href);
    expect(Object.keys(js.icons).sort()).toEqual(icons.map((i) => i.name).sort());
    expect(js.icons["test-ring"]).toBe(icons.find((i) => i.name === "test-ring")!.path);
    expect(js.iconSvg("test-ring")).toContain('aria-hidden="true"');
    expect(js.iconSvg("test-ring", { label: "Ring & hole", size: "lg" })).toMatch(/data-size="lg".*width="48".*role="img" aria-label="Ring &#38; hole"/);
    expect(() => js.iconSvg("no-such-icon")).toThrow(RangeError);

    const dts = readFileSync(join(copy.pkg, "dist/index.d.ts"), "utf8");
    const names = [...(/export type IconName =([^;]+);/.exec(dts)?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((m) => m[1]).sort();
    expect(names).toEqual(icons.map((i) => i.name).sort());
  });
});
