/**
 * @jaatster/blip-react shakes: every component is a pure call, so a bundler keeps only what a page imports. Bundled
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
    external: ["react", "react/*", "react-dom", "@jaatster/blip-*"],
  });
  return r.outputFiles[0]!.text;
}
/** The chu-* names a bundle carries, less the box's own (chu-box, and chu-r from data-chu-r) and event names. */
const SHARED = new Set(["chu-box", "chu-r", "chu-change"]);
const classes = (js: string) => [...new Set(js.match(/chu-[a-z-]+/g) ?? [])].filter((c) => !SHARED.has(c)).sort();

describe("@jaatster/blip-react tree-shaking", () => {
  it("a page with just a Button carries the button and nothing else", async () => {
    const js = await page(`import { Button } from "./index.ts"; console.log(Button);`);
    expect(classes(js)).toEqual(["chu-button"]);
    expect(js).not.toContain("@jaatster/blip-elements");
  });

  it("a page with Tabs carries the tabs' parts and loads only the tabs element", async () => {
    const js = await page(`import { Tabs, TabList, Tab, TabPanel } from "./index.ts"; console.log(Tabs, TabList, Tab, TabPanel);`);
    expect(classes(js)).toEqual(["chu-tab", "chu-tabs", "chu-tabs-list", "chu-tabs-panel"]);
    expect(js.match(/@blip\/elements\/[a-z-]+/g)).toEqual(["@jaatster/blip-elements/tabs"]);
  });

  it("a page with one game wrapper and one icon carries only those", async () => {
    const js = await page(`import { Counter } from "./game.ts"; import { Icon } from "./icons.tsx"; console.log(Counter, Icon);`);
    expect(js.match(/@blip\/game\/[a-z-]+/g)).toEqual(["@jaatster/blip-game/hud"]);
    expect(js).not.toMatch(/chu-(dialogue|inventory|choices|achievement|level)/);
  });
});
