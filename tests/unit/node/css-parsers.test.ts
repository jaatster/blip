/**
 * Every stylesheet the packages ship parses in the CSS tools that apps build it with: lightningcss (Vite 8's
 * minifier, and Next.js 16's Turbopack, in dev too) and esbuild's minifier (Vite before 8, and many other bundlers),
 * each aimed at the browsers those tools build for by default. A parse error there fails an adopter's build, as
 * select::picker(select):popover-open and @container anchored() once did. Reads packages/<package>/dist, so build
 * the packages first.
 *
 * Opt-in files that lightningcss cannot parse yet, by design, are listed in OPT_IN with the construct to blame. They
 * must parse in esbuild, and in lightningcss once that construct is taken out, so nothing else can hide in them.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { transform } from "lightningcss";
import { transformSync } from "esbuild";
import { REPO } from "../support/fixtures.ts";

/** Opt-in stylesheets, never part of a bundle, and the at-rule lightningcss cannot parse in them. */
const OPT_IN: Record<string, string> = {
  "packages/components/dist/popover-nub.css": "@container anchored(",
  "packages/components/dist/popover-nub.min.css": "@container anchored(",
};

// The browsers Vite 8 ("baseline-widely-available") and Next.js 16 build for by default.
const v = (major: number, minor = 0) => (major << 16) | (minor << 8);
const LIGHTNINGCSS_TARGETS = { chrome: v(111), edge: v(111), firefox: v(111), safari: v(16, 4), ios_saf: v(16, 4) };
const ESBUILD_TARGET = ["chrome111", "edge111", "firefox111", "safari16.4", "ios16.4"];

const PACKAGES = join(REPO, "packages");
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".css") ? [p] : [];
  });
/** Each package's shipped CSS: everything in dist, and any stylesheet at the package's root (font.css). */
const shipped = new Map(
  readdirSync(PACKAGES)
    .filter((p) => existsSync(join(PACKAGES, p, "package.json")))
    .map((p) => {
      const dist = join(PACKAGES, p, "dist");
      const root = readdirSync(join(PACKAGES, p)).filter((f) => f.endsWith(".css")).map((f) => join(PACKAGES, p, f));
      return [p, [...(existsSync(dist) ? walk(dist) : []), ...root].map((f) => relative(REPO, f)).sort()] as const;
    })
    .filter(([, files]) => files.length),
);

/** lightningcss's complaint about some CSS, or null when it parses (warnings count: they mean a dropped rule). */
function lightningcss(file: string, code: string): string | null {
  try {
    const r = transform({ filename: file, code: Buffer.from(code), minify: true, targets: LIGHTNINGCSS_TARGETS });
    return r.warnings.length ? r.warnings.map((w) => `${file}:${w.loc.line}:${w.loc.column} ${w.message}`).join("\n") : null;
  } catch (e) {
    const { message, loc } = e as { message: string; loc?: { line: number; column: number } };
    return `${file}${loc ? `:${loc.line}:${loc.column}` : ""} ${message}`;
  }
}

/** esbuild's complaint, or null. */
function esbuild(file: string, code: string): string | null {
  try {
    const r = transformSync(code, { loader: "css", minify: true, target: ESBUILD_TARGET, sourcefile: file, logLevel: "silent" });
    return r.warnings.length ? r.warnings.map((w) => `${file}:${w.location?.line}:${w.location?.column} ${w.text}`).join("\n") : null;
  } catch (e) {
    const { errors = [] } = e as { errors?: { text: string; location?: { line: number; column: number } | null }[] };
    return errors.map((w) => `${file}:${w.location?.line}:${w.location?.column} ${w.text}`).join("\n") || `${file} ${String(e)}`;
  }
}

/** The CSS with every block that starts with `at` (an at-rule's prelude) taken out, braces counted outside strings. */
function without(css: string, at: string): string {
  let out = "";
  let i = 0;
  for (let start = css.indexOf(at); start >= 0; start = css.indexOf(at, i)) {
    out += css.slice(i, start);
    let depth = 0;
    let j = css.indexOf("{", start);
    if (j < 0) j = css.length;
    for (; j < css.length; j++) {
      const c = css[j];
      if (c === '"' || c === "'") {
        const end = css.indexOf(c, j + 1);
        j = end < 0 ? css.length : end;
      } else if (c === "{") depth++;
      else if (c === "}" && --depth === 0) break;
    }
    i = j + 1;
  }
  return out + css.slice(i);
}

describe("shipped CSS parses in lightningcss and esbuild", () => {
  it("finds the built stylesheets", () => {
    const all = [...shipped.values()].flat();
    for (const f of ["packages/tokens/dist/css/tokens.css", "packages/core/dist/core.min.css", "packages/components/dist/components.min.css"]) {
      expect(all, `${f} is missing. Build the packages first: pnpm -r --filter "./packages/**" run build`).toContain(f);
    }
    for (const f of Object.keys(OPT_IN)) expect(all, `${f} is listed as opt-in but was not built`).toContain(f);
  });

  for (const [pkg, files] of shipped) {
    it(`@jaatster/blip-${pkg} parses in lightningcss`, () => {
      const failed = files.filter((f) => !(f in OPT_IN)).map((f) => lightningcss(f, readFileSync(join(REPO, f), "utf8")));
      expect(failed.filter(Boolean)).toEqual([]);
    });
    it(`@jaatster/blip-${pkg} parses in esbuild`, () => {
      const failed = files.map((f) => esbuild(f, readFileSync(join(REPO, f), "utf8")));
      expect(failed.filter(Boolean)).toEqual([]);
    });
  }

  it("opt-in files fail lightningcss only on their own construct, and no bundle carries it", () => {
    for (const [file, at] of Object.entries(OPT_IN)) {
      const css = readFileSync(join(REPO, file), "utf8");
      expect(css, `${file} no longer has ${at}: take it out of OPT_IN`).toContain(at);
      expect(lightningcss(file, without(css, at)), `${file} with its ${at} blocks taken out`).toBeNull();
    }
    const constructs = [...new Set(Object.values(OPT_IN))];
    for (const f of [...shipped.values()].flat().filter((f) => !(f in OPT_IN))) {
      const css = readFileSync(join(REPO, f), "utf8");
      for (const at of constructs) expect(css.includes(at), `${f} carries ${at}, which belongs in an opt-in file`).toBe(false);
    }
  });

  it("the check catches what once broke adopters' builds", () => {
    expect(lightningcss("picker.css", ".blip-select > select::picker(select):popover-open { color: red }")).toMatch(/pseudo/i);
    expect(lightningcss("anchored.css", "@container anchored(fallback: flip-block) { .a { color: red } }")).not.toBeNull();
    expect(lightningcss("open.css", ".blip-select > select:open::picker(select) { color: red }")).toBeNull();
    expect(esbuild("broken.css", ".a { color: red")).not.toBeNull();
  });
});
