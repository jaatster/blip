/**
 * @blip/react shakes: every component is a pure call, so a bundler keeps only what a page imports. Bundled
 * from the sources with esbuild (React and the other Blip packages left out), a page with just a Button carries
 * no other component, and a page with Tabs carries the tabs' parts and loads only the tabs element.
 */
import { describe, expect, it } from "vitest";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL("../../../packages/react/src/", import.meta.url));

async function page(code: string): Promise<string> {
  const r = await build({
    stdin: { contents: code, resolveDir: SRC, loader: "tsx" },
    bundle: true,
    format: "esm",
    write: false,
    logLevel: "silent",
    external: ["react", "react/*", "react-dom", "@blip/*"],
  });
  return r.outputFiles[0]!.text;
}
/** The blip-* names a bundle carries, less the box's own (blip-box, and blip-r from data-blip-r) and event names. */
const SHARED = new Set(["blip-box", "blip-r", "blip-change"]);
const classes = (js: string) => [...new Set(js.match(/blip-[a-z-]+/g) ?? [])].filter((c) => !SHARED.has(c)).sort();

describe("@blip/react tree-shaking", () => {
  it("a page with just a Button carries the button and nothing else", async () => {
    const js = await page(`import { Button } from "./index.ts"; console.log(Button);`);
    expect(classes(js)).toEqual(["blip-button"]);
    expect(js).not.toContain("@blip/elements");
  });

  it("a page with Tabs carries the tabs' parts and loads only the tabs element", async () => {
    const js = await page(`import { Tabs, TabList, Tab, TabPanel } from "./index.ts"; console.log(Tabs, TabList, Tab, TabPanel);`);
    expect(classes(js)).toEqual(["blip-tab", "blip-tabs", "blip-tabs-list", "blip-tabs-panel"]);
    expect(js.match(/@blip\/elements\/[a-z-]+/g)).toEqual(["@blip/elements/tabs"]);
  });

  it("a page with one game wrapper and one icon carries only those", async () => {
    const js = await page(`import { Counter } from "./game.ts"; import { Icon } from "./icons.tsx"; console.log(Counter, Icon);`);
    expect(js.match(/@blip\/game\/[a-z-]+/g)).toEqual(["@blip/game/hud"]);
    expect(js).not.toMatch(/blip-(dialogue|inventory|choices|achievement|level)/);
  });
});
