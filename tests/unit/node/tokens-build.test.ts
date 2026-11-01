/**
 * @jaatster/blip-tokens' build (packages/tokens/scripts/build.mjs), run on temporary copies of its sources: the resolver,
 * the outputs and their names, and the errors it stops on (each with a code, the file, the spot and a fix).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { editJson, node, tokensCopy, type Run } from "../support/fixtures.ts";

type Copy = ReturnType<typeof tokensCopy>;
const read = (copy: Copy, file: string) => readFileSync(join(copy.dir, "dist", file), "utf8");
const json = (copy: Copy, file: string) => JSON.parse(read(copy, file));
/** The quoted names in `export type Name = "a" | "b";` of a .d.ts. */
const union = (dts: string, name: string) => [...(new RegExp(`export type ${name} = ([^;]+);`).exec(dts)?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((m) => m[1]);
const srgb = (hex: string) => ({ colorSpace: "srgb", components: [1, 3, 5].map((i) => Math.round((parseInt(hex.slice(i, i + 2), 16) / 255) * 10000) / 10000), hex });

interface ManifestEntry {
  name: string;
  path: string;
  cssVar: string;
  type: string;
  unit?: string;
  scheme: boolean;
}

describe("tokens build: a clean build", () => {
  let copy: Copy;
  let run: Run;
  let manifest: ManifestEntry[];
  let css: string;
  beforeAll(() => {
    copy = tokensCopy();
    run = copy.build();
    manifest = json(copy, "json/manifest.json");
    css = read(copy, "css/tokens.css");
  });
  afterAll(() => copy.remove());

  it("succeeds and reports the contrast check", () => {
    expect(run.stderr).toBe("");
    expect(run.status).toBe(0);
    expect(run.stdout).toMatch(/Contrast: \d+ pairs pass in 3 schemes/);
  });

  it("writes every output", () => {
    const outputs = [
      "css/tokens.css",
      "css/palettes.css",
      "json/tokens.json",
      "json/manifest.json",
      "js/index.js",
      "js/index.d.ts",
      "android/BlipTokens.kt",
      "android/res/values/blip_colors.xml",
      "android/res/values/blip_dimens.xml",
      "android/res/values-night/blip_colors.xml",
      "ios/BlipTokens.swift",
      "figma/variables.json",
    ];
    for (const file of outputs) expect(existsSync(join(copy.dir, "dist", file)), file).toBe(true);
  });

  it("declares every token of the manifest in tokens.css", () => {
    const missing = manifest.filter((t) => !css.includes(`${t.cssVar}:`)).map((t) => t.cssVar);
    expect(missing).toEqual([]);
  });

  it("only points var() at custom properties it declares", () => {
    const declared = new Set([...css.matchAll(/(--pp-[\w-]+):/g)].map((m) => m[1]));
    const used = new Set([...css.matchAll(/var\((--pp-[\w-]+)\)/g)].map((m) => m[1]));
    expect([...used].filter((name) => !declared.has(name))).toEqual([]);
  });

  it("names the same tokens in the manifest, the JSON and the JS module", async () => {
    const tokens = json(copy, "json/tokens.json");
    const roles = manifest.filter((t) => t.scheme).map((t) => t.name).sort();
    const shared = manifest.filter((t) => !t.scheme && t.name !== "pixel").map((t) => t.name).sort();
    expect(Object.keys(tokens.shared).sort()).toEqual(shared);
    for (const scheme of ["day", "sunset", "night"]) expect(Object.keys(tokens.schemes[scheme]).sort(), scheme).toEqual(roles);
    for (const t of manifest) expect(t.cssVar).toBe(`--pp-${t.name}`);

    const js = await import(pathToFileURL(join(copy.dir, "dist/js/index.js")).href);
    expect(js.shared).toEqual(tokens.shared);
    expect(js.schemes).toEqual(tokens.schemes);
    expect(js.pixel).toEqual(tokens.pixel);
    expect(js.schemeNames).toEqual(["day", "sunset", "night"]);
    expect(js.cssVar("surface-raised")).toBe("var(--pp-surface-raised)");
    expect(js.px("space-4")).toBe(8);
    expect(js.px("space-4", 3)).toBe(12);
  });

  it("types the JS module with the same names", async () => {
    const dts = read(copy, "js/index.d.ts");
    const js = await import(pathToFileURL(join(copy.dir, "dist/js/index.js")).href);
    expect(union(dts, "SchemeName")).toEqual(js.schemeNames);
    expect(union(dts, "SharedToken").sort()).toEqual(Object.keys(js.shared).sort());
    expect(union(dts, "RoleToken").sort()).toEqual(Object.keys(js.schemes.day).sort());
    expect(union(dts, "PixelToken").sort()).toEqual(manifest.filter((t) => t.unit === "pixel").map((t) => t.name).sort());
    expect(/export type PixelSize = ([^;]+);/.exec(dts)?.[1]).toBe("2 | 3 | 4");
  });

  it("exports every scheme to Android, iOS and Figma", () => {
    const roles = manifest.filter((t) => t.scheme && t.type === "color");
    const day = read(copy, "android/res/values/blip_colors.xml");
    const night = read(copy, "android/res/values-night/blip_colors.xml");
    for (const t of roles) {
      const name = `pp_${t.name.replaceAll("-", "_")}`;
      expect(day, name).toContain(`<color name="${name}">`);
      expect(night, name).toContain(`<color name="${name}">`);
    }
    expect(read(copy, "android/BlipTokens.kt")).toMatch(/val Day = Scheme\([\s\S]*val Sunset = Scheme\([\s\S]*val Night = Scheme\(/);
    expect(read(copy, "ios/BlipTokens.swift")).toMatch(/static let day = Scheme\([\s\S]*static let sunset = Scheme\([\s\S]*static let night = Scheme\(/);

    const figma = json(copy, "figma/variables.json");
    expect(figma.collections.map((c: { name: string }) => c.name)).toEqual(["Primitives", "Palette", "Scheme", "Size"]);
    const [primitives, palette, scheme, size] = figma.collections;
    expect(scheme.modes).toEqual(["Day", "Sunset", "Night"]);
    expect(scheme.variables).toHaveLength(roles.length);
    for (const v of scheme.variables) expect(Object.keys(v.values), v.name).toEqual(["Day", "Sunset", "Night"]);
    expect(size.modes).toEqual(["2px", "3px", "4px"]);
    // The palettes are modes of their own collection, which the schemes alias into; the primitives stay single.
    expect(palette.modes[0]).toBe("Candy");
    expect(palette.modes).toHaveLength(12);
    for (const v of palette.variables) expect(Object.keys(v.values), v.name).toEqual(palette.modes);
    const names = (c: { variables: { name: string }[] }) => c.variables.map((v) => v.name);
    expect(names(palette)).toContain("palette/night/bg");
    expect(names(primitives)).not.toContain("palette/night/bg");
    const nightBg = scheme.variables.find((v: { name: string }) => v.name === "bg").values.Night;
    expect(nightBg).toEqual({ alias: "palette/night/bg", collection: "Palette" });
    const outline = scheme.variables.find((v: { name: string }) => v.name === "outline").values.Night;
    expect(outline).toEqual({ alias: "ink/base", collection: "Scheme" });
  });
});

describe("tokens build: the resolver", () => {
  let copy: Copy;
  beforeAll(() => {
    copy = tokensCopy();
    expect(copy.build().status).toBe(0);
  });
  afterAll(() => copy.remove());

  it("resolves each scheme context on its own", () => {
    const { schemes } = json(copy, "json/tokens.json");
    const css = read(copy, "css/tokens.css");
    expect(new Set([schemes.day.bg, schemes.sunset.bg, schemes.night.bg]).size).toBe(3);
    // Day is the default: on :root and on its attribute. Night also answers the device's dark mode.
    expect(css).toMatch(/:root, \[data-pp-scheme="day"\] \{[^}]*--pp-scheme: day;/);
    expect(css).toMatch(/\[data-pp-scheme="night"\] \{[^}]*--pp-scheme: night;/);
    expect(css).toMatch(/@media screen and \(prefers-color-scheme: dark\) \{\s*:root:not\(\[data-pp-scheme\]\) \{/);
  });

  it("prints in Day: the other schemes and the dark mode are for screens", () => {
    const css = read(copy, "css/tokens.css");
    expect(css).toMatch(/\n  :root, \[data-pp-scheme="day"\] \{/);
    for (const scheme of ["sunset", "night"]) expect(css).toContain(`@media screen { [data-pp-scheme="${scheme}"] {`);
    expect(css).not.toMatch(/\n  \[data-pp-scheme="(sunset|night)"\]/);
  });

  it("gives sizes in px in tokens.json: the type sizes, rem in CSS, at the 16 px default", () => {
    const { shared } = json(copy, "json/tokens.json");
    const css = read(copy, "css/tokens.css");
    expect([shared["size-caption"], shared["size-body"], shared["size-title"]]).toEqual([12, 16, 22]);
    expect(css).toContain("--pp-size-body: 1rem;");
    expect(shared["breakpoint-medium"]).toBe(600);
  });

  it("registers no scheme colours: a change of scheme is a dither, not a fade", () => {
    expect(read(copy, "css/tokens.css")).not.toContain("@property");
  });

  it("has a light disabled dither in every scheme: the page by Day and Sunset", () => {
    const { schemes } = json(copy, "json/tokens.json");
    for (const scheme of ["day", "sunset"]) expect(schemes[scheme]["disabled-dither"], scheme).toBe(schemes[scheme].bg);
    expect(schemes.night["disabled-dither"]).not.toBe(schemes.night.bg);
    expect(schemes.night["disabled-dither"]).toBe(schemes.night.text);
    for (const scheme of ["day", "sunset", "night"]) expect(schemes[scheme]["disabled-dither-cream"], scheme).toMatch(/^#[0-9A-F]{6}$/);
  });

  it("takes the pixel size from the pixel context", () => {
    const css = read(copy, "css/tokens.css");
    expect(json(copy, "json/tokens.json").pixel).toEqual({ 2: 2, 3: 3, 4: 4 });
    expect(css).toContain("--pp-pixel: 2px;");
    expect(css).toContain('[data-pp-pixel="3"] { --pp-pixel: 3px; }');
    expect(css).toContain('[data-pp-pixel="4"] { --pp-pixel: 4px; }');
    // Sizes counted in pixels follow the pixel wherever it changes.
    expect(css).toMatch(/:root, \[data-pp-pixel\] \{[^}]*--pp-space-4: calc\(4 \* var\(--pp-pixel\)\);/);
  });

  it("zeroes every duration under reduced motion", () => {
    const css = read(copy, "css/tokens.css");
    const block = /@media \(prefers-reduced-motion: reduce\) \{\s*:root \{([^}]*)\}/.exec(css)?.[1] ?? "";
    const durations = json(copy, "json/manifest.json").filter((t: ManifestEntry) => t.type === "duration" && t.path.startsWith("duration."));
    expect(durations.length).toBeGreaterThan(3);
    for (const t of durations) expect(block, t.cssVar).toContain(`${t.cssVar}: 0ms;`);
  });

  it("lets a later source win: a scheme overrides the foundation", () => {
    const planted = tokensCopy();
    try {
      editJson(join(planted.dir, "src/primitives/color.tokens.json"), (j) => (j.probe = { $value: srgb("#336699") }));
      editJson(join(planted.dir, "src/schemes/night.tokens.json"), (j) => (j.probe = { $value: srgb("#CC3300") }));
      expect(planted.build().status).toBe(0);
      const { schemes } = json(planted, "json/tokens.json");
      expect(schemes.day.probe).toBe("#336699");
      expect(schemes.sunset.probe).toBe("#336699");
      expect(schemes.night.probe).toBe("#CC3300");
    } finally {
      planted.remove();
    }
  });

  it("only checks with --check: nothing is written", () => {
    const check = tokensCopy();
    try {
      const run = check.build("--check");
      expect(run.status).toBe(0);
      expect(run.stdout).toMatch(/Contrast: \d+ pairs pass/);
      expect(existsSync(join(check.dir, "dist"))).toBe(false);
    } finally {
      check.remove();
    }
  });
});

describe("tokens build: errors stop the build", () => {
  const DAY = "src/schemes/day.tokens.json";
  const COLOR = "src/primitives/color.tokens.json";
  const cases: { name: string; file: string; change?: (j: any) => void; raw?: string; code: string; spot: string; says: RegExp }[] = [
    { name: "an alias to a token that does not exist", file: DAY, change: (j) => (j.bg.$value = "{world.day.nope}"), code: "PP-T051", spot: `${DAY} at /bg`, says: /"bg" points at "\{world\.day\.nope\}", which does not exist/ },
    { name: "an alias cycle", file: DAY, change: (j) => ((j.bg.$value = "{surface.base}"), (j.surface.base.$value = "{bg}")), code: "PP-T050", spot: `${DAY} at /bg`, says: /Alias cycle: bg -> surface\.base -> bg/ },
    { name: "an alias to a token of another type", file: DAY, change: (j) => (j.bg.$value = "{space.4}"), code: "PP-T052", spot: `${DAY} at /bg`, says: /"bg" is a color but points at a number/ },
    { name: "a colour in the wrong form", file: COLOR, change: (j) => (j.white.$value = "#FFFFFF"), code: "PP-T030", spot: `${COLOR} at /white`, says: /A colour must be \{ colorSpace: "srgb"/ },
    { name: "a hex that is not 6 digits", file: COLOR, change: (j) => (j.white.$value.hex = "#FFF"), code: "PP-T031", spot: `${COLOR} at /white`, says: /"#FFF" is not a 6-digit hex colour/ },
    { name: "a hex that disagrees with its components", file: COLOR, change: (j) => (j.white.$value.hex = "#FF0000"), code: "PP-T032", spot: `${COLOR} at /white`, says: /hex #FF0000 and components \[1,1,1\] disagree/ },
    { name: "an unknown $type", file: COLOR, change: (j) => (j.white.$type = "colour"), code: "PP-T021", spot: `${COLOR} at /white`, says: /Unknown \$type "colour"/ },
    { name: "a size off the pixel grid", file: "src/primitives/size.tokens.json", change: (j) => (j.space["3"].$value = 2.5), code: "PP-T043", spot: "src/primitives/size.tokens.json at /space/3", says: /2\.5 pixels is off the grid/ },
    { name: "a name with a dot", file: COLOR, change: (j) => (j["bad.name"] = { $value: srgb("#336699") }), code: "PP-T010", spot: COLOR, says: /"bad\.name" is not a valid token name/ },
    { name: "a source that is not JSON", file: COLOR, raw: "{ not json", code: "PP-T001", spot: COLOR, says: /Could not read JSON/ },
  ];

  it.each(cases)("$code: $name", ({ file, change, raw, code, spot, says }) => {
    const copy = tokensCopy();
    try {
      if (raw !== undefined) writeFileSync(join(copy.dir, file), raw);
      else editJson(join(copy.dir, file), change!);
      const run = copy.build();
      expect(run.status).toBe(1);
      expect(run.stderr).toContain(`${code}  ${spot}`);
      expect(run.stderr).toMatch(says);
      expect(run.stderr).toMatch(/Fix: \S/);
      // A failed build leaves no half-written dist behind.
      expect(existsSync(join(copy.dir, "dist"))).toBe(false);
    } finally {
      copy.remove();
    }
  });

  it("PP-T002: a resolver of another version", () => {
    const copy = tokensCopy();
    try {
      editJson(join(copy.dir, "blip.resolver.json"), (j) => (j.version = "2024.1"));
      const run = copy.build("--check");
      expect(run.status).toBe(1);
      expect(run.stderr).toContain("PP-T002  blip.resolver.json at /version");
      expect(run.stderr).toContain('Set "version": "2025.10".');
    } finally {
      copy.remove();
    }
  });

  it("PP-T004: a modifier whose default is not one of its contexts", () => {
    const copy = tokensCopy();
    try {
      editJson(join(copy.dir, "blip.resolver.json"), (j) => (j.modifiers.scheme.default = "dusk"));
      const run = copy.build("--check");
      expect(run.status).toBe(1);
      expect(run.stderr).toContain("PP-T004  blip.resolver.json at /modifiers/scheme/default");
      expect(run.stderr).toContain("Use one of: day, sunset, night.");
    } finally {
      copy.remove();
    }
  });

  it("lists every problem at once", () => {
    const copy = tokensCopy();
    try {
      editJson(join(copy.dir, COLOR), (j) => ((j.white.$value.hex = "#FFF"), (j.ink.base.$type = "colour")));
      const run = copy.build("--check");
      expect(run.status).toBe(1);
      expect(run.stderr).toMatch(/Blip tokens: \d+ problems/);
      expect(run.stderr).toContain("PP-T031");
      expect(run.stderr).toContain("PP-T021");
    } finally {
      copy.remove();
    }
  });
});

describe("tokens build: the contrast gate", () => {
  it("PP-T060: fails on a text pair below WCAG AA, naming the scheme, the pair and the ratio", () => {
    const copy = tokensCopy();
    try {
      // Muted text as light as the page: unreadable.
      editJson(join(copy.dir, "src/schemes/day.tokens.json"), (j) => (j.text.muted.$value = "{white}"));
      const run = copy.build("--check");
      expect(run.status).toBe(1);
      expect(run.stderr).toContain("PP-T060  src/schemes/day.tokens.json at /text/muted");
      expect(run.stderr).toMatch(/day: text\.muted #FFFFFF on surface\.base #FFFFFF is 1\.00:1; it needs 4\.5:1\./);
      expect(run.stderr).toContain("WCAG 2.2 AA");
      // Only day changed: the other schemes still pass.
      expect(run.stderr).not.toMatch(/(sunset|night): text\.muted/);
    } finally {
      copy.remove();
    }
  });

  it("PP-T060: holds candy labels to 4.5:1 too", () => {
    const copy = tokensCopy();
    try {
      editJson(join(copy.dir, "src/schemes/night.tokens.json"), (j) => (j.danger.on.$value = "{candy.red.base}"));
      const run = copy.build("--check");
      expect(run.status).toBe(1);
      expect(run.stderr).toMatch(/night: danger\.on #[0-9A-F]{6} on danger\.base #[0-9A-F]{6} is 1\.00:1; it needs 4\.5:1\./);
    } finally {
      copy.remove();
    }
  });

  it("PP-T060: holds a candy's label to 4.5:1 on the dither over it when disabled", () => {
    const copy = tokensCopy();
    try {
      // The page colour at Night as the dither: the ink label all but vanishes.
      editJson(join(copy.dir, "src/schemes/night.tokens.json"), (j) => (j.disabled.dither.$value = "{palette.night.bg}"));
      const run = copy.build("--check");
      expect(run.status).toBe(1);
      expect(run.stderr).toContain("PP-T060  src/schemes/night.tokens.json at /disabled/dither");
      expect(run.stderr).toMatch(/night: ink\.base #0D0D0D on disabled\.dither #171717 is 1\.08:1; it needs 4\.5:1\./);
      expect(run.stderr).toMatch(/night: accent\.on #0D0D0D on disabled\.dither #171717 is 1\.08:1/);
      // Every palette's Night fails the same way, each named; Day and Sunset are untouched.
      expect(run.stderr).toMatch(/night \(grape\): ink\.base #1A1530 on disabled\.dither #22244F is 1\.20:1/);
      expect(run.stderr).not.toMatch(/(day|sunset)( \([a-z-]+\))?: /);
    } finally {
      copy.remove();
    }
  });

  it("PP-T060: holds the neutral (cream) label to 4.5:1 on cream's own dither", () => {
    const copy = tokensCopy();
    try {
      editJson(join(copy.dir, "src/schemes/night.tokens.json"), (j) => (j.disabled["dither-cream"].$value = "{world.night.sky.2}"));
      const run = copy.build("--check");
      expect(run.status).toBe(1);
      expect(run.stderr).toContain("PP-T060  src/schemes/night.tokens.json at /disabled/dither-cream");
      expect(run.stderr).toMatch(/night: ink\.base #0D0D0D on disabled\.dither-cream #222628 is 1\.27:1/);
    } finally {
      copy.remove();
    }
  });

  it("PP-T061: fails when neither the yellow ring nor its ink edge stands out from the page", () => {
    const copy = tokensCopy();
    try {
      editJson(join(copy.dir, "src/schemes/day.tokens.json"), (j) => ((j.focus.base.$value = "{world.day.cloud.body}"), (j.focus.edge.$value = "{world.day.cloud.body}")));
      const run = copy.build("--check");
      expect(run.status).toBe(1);
      expect(run.stderr).toContain("PP-T061  src/schemes/day.tokens.json at /focus");
      expect(run.stderr).toMatch(/day: the focus ring is 1\.00:1 against the page\./);
    } finally {
      copy.remove();
    }
  });
});

describe("tokens build: palettes", () => {
  let copy: Copy;
  let tokens: any;
  let css: string;
  let palettes: string;
  beforeAll(() => {
    copy = tokensCopy();
    expect(copy.build().status).toBe(0);
    tokens = json(copy, "json/tokens.json");
    css = read(copy, "css/tokens.css");
    palettes = read(copy, "css/palettes.css");
  });
  afterAll(() => copy.remove());

  it("defaults to Candy: Day and Sunset keep their candies, Night is sky blue on charcoal with its own ink", () => {
    expect(tokens.palette).toBe("candy");
    const { day, sunset, night } = tokens.schemes;
    expect([day.accent, sunset.accent]).toEqual([tokens.shared["candy-blue"], tokens.shared["candy-pink"]]);
    expect([night.bg, night.surface, night.accent, night.ink]).toEqual(["#171717", "#202020", "#00C2FA", "#0D0D0D"]);
    // Ink is a role: the violet by Day and Sunset, the palette's at Night, and every outline follows it.
    expect([day.ink, sunset.ink]).toEqual(["#1A1530", "#1A1530"]);
    expect(night.outline).toBe(night.ink);
    expect(tokens.shared.ink).toBeUndefined();
    expect(css).toMatch(/\[data-pp-scheme="night"\] \{[^}]*--pp-ink: var\(--pp-palette-night-ink\);/);
  });

  it("puts each preset in palettes.css on its attribute, setting only custom properties tokens.css has", () => {
    const presets = Object.keys(tokens.palettes);
    expect(presets).toEqual(["grape", "ember", "azure", "mint", "bubblegum", "dracula", "nord", "catppuccin", "gruvbox", "tokyo-night", "rose-pine"]);
    const declared = new Set([...css.matchAll(/(--pp-[\w-]+):/g)].map((m) => m[1]));
    for (const p of presets) {
      const block = new RegExp(`:root\\[data-pp-palette="${p}"\\], \\[data-pp-palette="${p}"\\] \\{([^}]*)\\}`).exec(palettes)?.[1] ?? "";
      const names = [...block.matchAll(/(--pp-[\w-]+):/g)].map((m) => m[1]);
      expect(names.length, p).toBeGreaterThan(20);
      expect(names.filter((n) => !declared.has(n) || !/^--pp-(palette|world-night)-/.test(n)), p).toEqual([]);
    }
    // The schemes read the palette, so a preset recolours them where they are declared.
    expect(css).toMatch(/\[data-pp-scheme="night"\] \{[^}]*--pp-bg: var\(--pp-palette-night-bg\);/);
    expect(css).toMatch(/:root, \[data-pp-scheme="day"\] \{[^}]*--pp-accent: var\(--pp-palette-day-accent\);/);
  });

  it("resolves every scheme in every preset, in the JSON and the JS module", async () => {
    const js = await import(pathToFileURL(join(copy.dir, "dist/js/index.js")).href);
    expect(js.palettes).toEqual(tokens.palettes);
    expect(js.paletteNames[0]).toBe("candy");
    expect(js.paletteNames.slice(1)).toEqual(Object.keys(tokens.palettes));
    const roles = Object.keys(tokens.schemes.day).sort();
    for (const [p, palette] of Object.entries<any>(tokens.palettes)) {
      expect(palette.name, p).toMatch(/\S/);
      for (const scheme of ["day", "sunset", "night"]) expect(Object.keys(palette.schemes[scheme]).sort(), `${p} ${scheme}`).toEqual(roles);
    }
    expect(tokens.palettes.dracula.credit).toMatch(/Dracula/);
    const dts = read(copy, "js/index.d.ts");
    expect(union(dts, "PaletteName")).toEqual(js.paletteNames);
  });

  it("keeps the TV's own Night as Grape, exactly", () => {
    const grape = tokens.palettes.grape.schemes.night;
    expect([grape.bg, grape.surface, grape.accent, grape.ink, grape.text]).toEqual(["#22244F", "#2C2F66", "#9166FF", "#1A1530", "#F3EFFF"]);
    expect(tokens.palettes.grape.shared["world-night-sky-1"]).toBe("#3A3E7C");
  });

  it("moves the warning to amber where the accent is orange (Ember), and only there", () => {
    const ember = tokens.palettes.ember.schemes;
    for (const scheme of ["day", "sunset", "night"]) {
      expect(ember[scheme].warning, scheme).not.toBe(tokens.shared["candy-orange"]);
      expect(tokens.palettes.azure.schemes[scheme].warning, scheme).toBe(tokens.shared["candy-orange"]);
    }
  });

  it("falls back to Candy for what a preset leaves out", () => {
    const planted = tokensCopy();
    try {
      editJson(join(planted.dir, "src/palettes/mint.tokens.json"), (j) => delete j.world);
      expect(planted.build().status).toBe(0);
      const built = json(planted, "json/tokens.json");
      expect(built.palettes.mint.schemes.night["scene-sky-1"]).toBe(built.schemes.night["scene-sky-1"]);
      expect(read(planted, "css/palettes.css")).not.toMatch(/\[data-pp-palette="mint"\] \{[^}]*--pp-world-night/);
    } finally {
      planted.remove();
    }
  });

  it("PP-T060: checks a preset's contrast in every scheme, pointing at the preset's own file", () => {
    const planted = tokensCopy();
    try {
      editJson(join(planted.dir, "src/palettes/ember.tokens.json"), (j) => (j.palette.night.text.muted.$value = srgb("#555555")));
      const run = planted.build("--check");
      expect(run.status).toBe(1);
      expect(run.stderr).toContain("PP-T060  src/palettes/ember.tokens.json at /palette/night/text/muted");
      expect(run.stderr).toMatch(/night \(ember\): text\.muted #555555 on bg #1E1E1E is 2\.24:1; it needs 4\.5:1\./);
      expect(run.stderr).not.toMatch(/^ {4}(day|sunset|night)( \((?!ember)[a-z-]+\))?: /m);
    } finally {
      planted.remove();
    }
  });

  it("PP-T005: a preset that sets a token the default palette does not have", () => {
    const planted = tokensCopy();
    try {
      editJson(join(planted.dir, "src/palettes/ember.tokens.json"), (j) => (j.palette.night.glow = { $value: srgb("#FF9900") }));
      const run = planted.build("--check");
      expect(run.status).toBe(1);
      expect(run.stderr).toContain("PP-T005  src/palettes/ember.tokens.json at /palette/night/glow");
      expect(run.stderr).toContain('Palette "ember" sets "palette.night.glow", which the default palette does not have.');
      expect(run.stderr).toMatch(/Fix: \S/);
    } finally {
      planted.remove();
    }
  });

  it("writes the presets from their recipes as they are checked in (the generator is reproducible)", () => {
    const planted = tokensCopy();
    try {
      const before = readFileSync(join(planted.dir, "src/palettes/azure.tokens.json"), "utf8");
      const run = node(join(planted.dir, "scripts/palettes.mjs"), [], planted.dir);
      expect(run.status, run.stderr).toBe(0);
      expect(readFileSync(join(planted.dir, "src/palettes/azure.tokens.json"), "utf8")).toBe(before);
    } finally {
      planted.remove();
    }
  });
});
