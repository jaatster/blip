/**
 * blip-tokens (packages/tokens/scripts/cli.mjs), run from a copy of the package on themes written the way the
 * docs' theme builder exports them: a resolver whose scheme contexts list Blip's scheme file and the theme's
 * own, pointing into node_modules/@jaatster/blip-tokens. The theme passes Blip's own checks or the build stops.
 */
import { afterEach, describe, expect, it } from "vitest";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { node, tempDir, tokensCopy } from "../support/fixtures.ts";

type Accent = { base: string; light: string; shade: string; text: string; on: string };
const SCHEMES = ["day", "sunset", "night"] as const;
const color = (hex: string) => ({ $value: { colorSpace: "srgb", components: [1, 3, 5].map((i) => Math.round((parseInt(hex.slice(i, i + 2), 16) / 255) * 1000) / 1000), hex } });

/** Writes a theme as the builder exports it: three token files and a resolver (here in a folder of its own). */
function theme(dir: string, accents: Record<(typeof SCHEMES)[number], Accent>): string {
  for (const s of SCHEMES) {
    const a = accents[s];
    writeFileSync(join(dir, `my-theme.${s}.tokens.json`), JSON.stringify({
      $schema: "https://www.designtokens.org/schemas/2025.10/format.json",
      $description: `My theme: the ${s} accent. Add after Blip's own ${s} file in the resolver.`,
      $type: "color",
      accent: { base: color(a.base), light: color(a.light), shade: color(a.shade), text: color(a.text), on: color(a.on) },
      selection: { bg: color(a.light) },
    }, null, 2));
  }
  mkdirSync(join(dir, "theme"), { recursive: true });
  const resolver = join(dir, "theme/my-theme.resolver.json");
  const ctx = (s: string) => [{ $ref: `node_modules/@jaatster/blip-tokens/src/schemes/${s}.tokens.json` }, { $ref: `../my-theme.${s}.tokens.json` }];
  writeFileSync(resolver, JSON.stringify({
    $schema: "https://www.designtokens.org/schemas/2025.10/resolver.json",
    name: "My Blip theme",
    version: "2025.10",
    modifiers: {
      scheme: { contexts: Object.fromEntries(SCHEMES.map((s) => [s, ctx(s)])), default: "day" },
      pixel: { contexts: Object.fromEntries(["2", "3", "4"].map((p) => [p, [{ $ref: `node_modules/@jaatster/blip-tokens/src/pixel/${p}.tokens.json` }]])), default: "2" },
    },
  }, null, 2));
  return resolver;
}
// A teal brand that passes, and the dark navy the builder exported with a white label on its pale light band.
const TEAL = {
  day: { base: "#16A99C", light: "#6FFFF2", shade: "#128E83", text: "#107E74", on: "#1A1530" },
  sunset: { base: "#FF5FA2", light: "#FF9CC6", shade: "#E03A82", text: "#B0245F", on: "#1A1530" },
  night: { base: "#2FD3C5", light: "#7EFFF4", shade: "#27B1A5", text: "#2FD3C5", on: "#1A1530" },
};
const NAVY: Accent = { base: "#0B1F4D", light: "#719CFF", shade: "#091A41", text: "#0B1F4D", on: "#FFFFFF" };

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach((f) => f()));
function setup(accents: Record<(typeof SCHEMES)[number], Accent>) {
  const pkg = tokensCopy();
  const project = tempDir("theme");
  cleanup.push(pkg.remove, project.remove);
  const resolver = theme(project.dir, accents);
  const cli = (...args: string[]) => node(join(pkg.dir, "scripts/cli.mjs"), args, project.dir);
  return { project: project.dir, resolver, cli };
}

describe("blip-tokens", () => {
  it("builds a theme's tokens.css through the same checks, beside the resolver by default", () => {
    const { project, cli } = setup(TEAL);
    const run = cli("theme/my-theme.resolver.json");
    expect(run.stderr).toBe("");
    expect(run.status).toBe(0);
    expect(run.stdout).toMatch(/Contrast: \d+ pairs pass in 3 schemes/);
    const css = readFileSync(join(project, "theme/my-theme.css"), "utf8");
    // The theme's accent in each scheme; everything else is Blip's, so the file replaces tokens.css.
    expect(css).toMatch(/:root, \[data-pp-scheme="day"\] \{[^}]*--pp-accent: #16A99C;/);
    expect(css).toMatch(/\[data-pp-scheme="sunset"\] \{[^}]*--pp-accent: #FF5FA2;/);
    expect(css).toMatch(/\[data-pp-scheme="night"\] \{[^}]*--pp-accent: #2FD3C5;[^}]*--pp-selection-bg: #7EFFF4;/);
    expect(css).toContain("@layer pp.reset, pp.tokens, pp.base, pp.core, pp.components, pp.kits, pp.utilities;");
    expect(css).toContain("--pp-candy-red: #FF3D4F;");
    expect(css).toContain("--pp-disabled-dither:");
  });

  it("writes where --out says, and nothing with --check", () => {
    const { project, cli } = setup(TEAL);
    expect(cli("theme/my-theme.resolver.json", "--check").status).toBe(0);
    expect(existsSync(join(project, "theme/my-theme.css"))).toBe(false);
    expect(cli("--out", "styles/tokens.css", "theme/my-theme.resolver.json").status).toBe(0);
    expect(readFileSync(join(project, "styles/tokens.css"), "utf8")).toContain("--pp-accent: #16A99C;");
  });

  it("stops on a theme that fails a check, naming the theme's file, the token, the pair and the ratio", () => {
    const { project, cli } = setup({ ...TEAL, day: NAVY });
    const run = cli("theme/my-theme.resolver.json");
    expect(run.status).toBe(1);
    expect(run.stderr).toContain("PP-T060  my-theme.day.tokens.json at /accent/on");
    expect(run.stderr).toMatch(/day: accent\.on #FFFFFF on accent\.light #719CFF is 2\.66:1; it needs 4\.5:1\./);
    // A white label would vanish into the light dither of a disabled button, too.
    expect(run.stderr).toMatch(/day: accent\.on #FFFFFF on disabled\.dither #F4F7FF is 1\.07:1/);
    expect(run.stderr).toMatch(/Fix: \S/);
    expect(run.stderr).not.toMatch(/(sunset|night): /);
    expect(existsSync(join(project, "theme/my-theme.css"))).toBe(false);
  });

  it("checks the focus ring against a theme's page", () => {
    const { project, cli } = setup(TEAL);
    const day = join(project, "my-theme.day.tokens.json");
    const j = JSON.parse(readFileSync(day, "utf8"));
    j.bg = color("#FFCC33");
    j.focus = { edge: color("#FFCC33") };
    writeFileSync(day, JSON.stringify(j));
    const run = cli("theme/my-theme.resolver.json", "--check");
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/PP-T061  my-theme\.day\.tokens\.json at \/(bg|focus)\n    day: the focus ring is 1\.00:1 against the page\./);
  });

  it("explains what it needs", () => {
    const { cli } = setup(TEAL);
    const none = cli();
    expect(none.status).toBe(1);
    expect(none.stderr).toContain("blip-tokens: Name the theme's resolver");
    expect(none.stderr).toContain("Usage: blip-tokens <theme.resolver.json>");
    expect(cli("--wat", "theme/my-theme.resolver.json").stderr).toContain('Unknown option "--wat".');
    expect(cli("--help").status).toBe(0);
    const missing = cli("nope.resolver.json");
    expect(missing.status).toBe(1);
    expect(missing.stderr).toContain("PP-T001  nope.resolver.json");
  });
});
