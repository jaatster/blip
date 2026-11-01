/**
 * @jaatster/blip-font's build (packages/font/scripts/build.py), run on temporary copies with the repository's font tools
 * (.tools/venv, which CI sets up): the guard that fails the build when Pixelify Sans keeps a ligature a browser applies
 * by default (its fi and fl read as "A") or a stroke thinner than one of its pixels (its @ read as a dot, © as °), at
 * regular or bold; and font.css, which must name exactly the characters each file draws.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { REPO, tempDir, type Run } from "../support/fixtures.ts";

const PYTHON = join(REPO, ".tools/venv/bin/python");
const FONT = join(REPO, "packages/font");
const UPSTREAM = join(FONT, "vendor/PixelifySans[wght].ttf");
const PIXELIFY = ["pixelify-sans.woff2", "pixelify-sans-cyrillic.woff2", "pixelify-sans-greek.woff2"];

function python(args: string[], cwd: string): Run {
  if (!existsSync(PYTHON)) {
    throw new Error(`${PYTHON} is missing. Fix: python3 -m venv .tools/venv && .tools/venv/bin/pip install fonttools==4.68.0 brotli==1.2.1 (as CI does).`);
  }
  const r = spawnSync(PYTHON, ["-I", ...args], { cwd, encoding: "utf8" });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

/** A copy of the font package (no dist), optionally with its build script or Pixelify drawings changed. */
function fontCopy(change: { script?: (s: string) => string; glyphs?: (s: string) => string } = {}) {
  const { dir, remove } = tempDir("font");
  for (const part of ["scripts", "src", "vendor", "docs", "examples", "package.json", "font.css"]) {
    cpSync(join(FONT, part), join(dir, part), { recursive: true });
  }
  const edit = (file: string, fn?: (s: string) => string) => fn && writeFileSync(file, fn(readFileSync(file, "utf8")));
  edit(join(dir, "scripts/build.py"), change.script);
  edit(join(dir, "src/pixelify-sans.glyphs"), change.glyphs);
  return {
    dir,
    remove,
    build: () => python([join(dir, "scripts/build.py")], dir),
    check: (files: string[]) => python([join(dir, "scripts/build.py"), "--check", ...files], dir),
  };
}

/** The characters a font file maps, as code points. */
function charactersOf(file: string): number[] {
  const r = python(["-c", "import sys, json; from fontTools.ttLib import TTFont; print(json.dumps(sorted(TTFont(sys.argv[1]).getBestCmap())))", file], REPO);
  return JSON.parse(r.stdout);
}

/** A CSS unicode-range as code points. */
function rangeOf(range: string): number[] {
  return range.split(",").flatMap((part) => {
    const [a, b = a] = part.trim().replace(/^U\+/i, "").split("-");
    const lo = parseInt(a, 16), hi = parseInt(b, 16);
    return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  });
}

describe("font build: the Pixelify Sans guard", () => {
  it("the upstream font fails it: the fi and fl ligatures, and the hairline @ and ©", () => {
    const { dir, remove } = tempDir("font-check");
    try {
      const run = python([join(FONT, "scripts/build.py"), "--check", UPSTREAM], dir);
      expect(run.status).toBe(1);
      expect(run.stdout).toContain("PixelifySans[wght].ttf: 'liga' draws ffi, ffl, ff, fi … as one glyph each, and browsers apply it by default. Fix: leave the feature out (PIXELIFY_FEATURES in scripts/build.py).");
      expect(run.stdout).toContain("'@' (at) has a stroke 47 units wide at regular, thinner than one of the font's pixels (90). Fix: draw it on the grid in src/pixelify-sans.glyphs.");
      expect(run.stdout).toContain("'©' (copyright) has a stroke 26 units wide at regular");
      expect(run.stdout).toContain("'@' (at) has a stroke 37 units wide at bold");
    } finally {
      remove();
    }
  });

  describe("a fresh build", () => {
    let copy: ReturnType<typeof fontCopy>;
    let run: Run;
    beforeAll(() => {
      copy = fontCopy();
      run = copy.build();
    });
    afterAll(() => copy.remove());

    it("passes it, and says so", () => {
      expect(run.stderr).toBe("");
      expect(run.status).toBe(0);
      expect(run.stdout).toContain("Pixelify Sans: wght 400 to 700, no default ligatures, no stroke under 90 units");
      const check = copy.check(PIXELIFY.map((f) => join(copy.dir, "dist", f)));
      expect(check.status).toBe(0);
      expect(check.stdout.trim()).toBe("3 file(s): no default ligatures, no thin strokes.");
    });

    it("font.css names exactly the characters each of the six files draws", () => {
      const css = readFileSync(join(copy.dir, "font.css"), "utf8");
      const faces = [...css.matchAll(/url\("\.\/dist\/([\w-]+\.woff2)"\)[^}]*?unicode-range:([^;]+);/g)];
      expect(faces.map((m) => m[1]).sort()).toEqual(
        ["pixel-bop.woff2", "pixel-bop-cyrillic.woff2", "pixel-bop-greek.woff2", ...PIXELIFY].sort(),
      );
      for (const [, file, range] of faces) {
        const drawn = charactersOf(join(copy.dir, "dist", file)).filter((cp) => cp >= 0x20);
        expect(rangeOf(range), file).toEqual(drawn);
      }
    });

    it("Latin pages load nothing for Cyrillic or Greek: each script is its own file", () => {
      for (const [file, inside] of [
        ["pixel-bop.woff2", (cp: number) => cp < 0x370 || cp > 0x52f],
        ["pixelify-sans.woff2", (cp: number) => cp < 0x370 || cp > 0x52f],
        ["pixel-bop-cyrillic.woff2", (cp: number) => cp >= 0x400 && cp <= 0x52f],
        ["pixelify-sans-cyrillic.woff2", (cp: number) => (cp >= 0x400 && cp <= 0x52f) || cp === 0x2116],
        ["pixel-bop-greek.woff2", (cp: number) => cp >= 0x370 && cp <= 0x3ff],
        ["pixelify-sans-greek.woff2", (cp: number) => cp >= 0x370 && cp <= 0x3ff],
      ] as const) {
        const outside = charactersOf(join(copy.dir, "dist", file)).filter((cp) => cp >= 0x20 && !inside(cp));
        expect(outside, file).toEqual([]);
      }
    });

    it("draws the letters the upstream font leaves out: Cyrillic О, П and І, Greek ς, Δ and Ω", () => {
      const cyrillic = charactersOf(join(copy.dir, "dist", "pixelify-sans-cyrillic.woff2"));
      const greek = charactersOf(join(copy.dir, "dist", "pixelify-sans-greek.woff2"));
      for (const ch of "ОПІ") expect(cyrillic, ch).toContain(ch.codePointAt(0));
      for (const ch of "ςΔΩ") expect(greek, ch).toContain(ch.codePointAt(0));
    });
  });

  it("fails the build when a glyph is left as the upstream font drew it", () => {
    const copy = fontCopy({ glyphs: (s) => s.replace(/\n@ @\n(?:[X.]+\n)+/, "\n") });
    try {
      const run = copy.build();
      expect(run.status).toBe(1);
      expect(run.stderr).toContain("Pixelify Sans Latin (pixelify-sans.woff2): '@' (at) has a stroke 47 units wide at regular, thinner than one of the font's pixels (90). Fix: draw it on the grid in src/pixelify-sans.glyphs.");
    } finally {
      copy.remove();
    }
  });

  it("fails the build when the ligatures are kept", () => {
    const copy = fontCopy({ script: (s) => s.replace('PIXELIFY_FEATURES = ["ccmp"', 'PIXELIFY_FEATURES = ["liga", "ccmp"') });
    try {
      const run = copy.build();
      expect(run.status).toBe(1);
      expect(run.stderr).toContain("Pixelify Sans Latin (pixelify-sans.woff2): 'liga' draws ffi, ffl, ff, fi … as one glyph each");
    } finally {
      copy.remove();
    }
  });
});
