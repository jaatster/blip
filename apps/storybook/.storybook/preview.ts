/**
 * The preview: Blip loaded as an app would load it (font, tokens, core, every component and kit stylesheet,
 * every element), the toolbar switches (scheme, pixel, reduced motion), and the swappable services seeded so every
 * story draws the same each time.
 */
import "./motion"; // first: it wraps matchMedia before @jaatster/blip-core asks it about reduced motion
import "@jaatster/blip-font/font.css";
import "@jaatster/blip-tokens/tokens.css";
import "@jaatster/blip-core/core.css";
import "@jaatster/blip-components/components.css";
import "@jaatster/blip-game/game.css";
import "@jaatster/blip-blocks/blocks.css";
import "@jaatster/blip-effects/effects.css";
import "./preview.css";

import * as core from "@jaatster/blip-core";
import "@jaatster/blip-elements";
import "@jaatster/blip-game";
import * as effects from "@jaatster/blip-effects";
import "@jaatster/blip-icons/element";
import * as sound from "@jaatster/blip-sound";

import type { Decorator, Preview } from "@storybook/html-vite";
import { setReducedMotion } from "./motion";
import { blip } from "./theme";

/** The seed every story starts from, and the moment tests freeze the clock at (a summer noon: Day). */
export const SEED = 42;
export const FROZEN = "2026-06-21T12:00:00";
const testing = import.meta.env.MODE === "test";

/**
 * Some examples' buttons load a package in their onclick (`import('@jaatster/blip-effects')`), as a page with an import
 * map would. Give this page the same bare names, pointing at the copies loaded here, so there is one of each.
 */
(globalThis as { __blip?: Record<string, object> }).__blip = { "@jaatster/blip-core": core, "@jaatster/blip-effects": effects, "@jaatster/blip-sound": sound };
{
  const imports: Record<string, string> = {};
  for (const [name, mod] of Object.entries({ "@jaatster/blip-core": core, "@jaatster/blip-effects": effects, "@jaatster/blip-sound": sound })) {
    const body = Object.keys(mod).map((k) => (k === "default" ? "export default m.default;" : `export const ${k} = m[${JSON.stringify(k)}];`));
    imports[name] = URL.createObjectURL(new Blob([`const m = globalThis.__blip[${JSON.stringify(name)}];\n${body.join("\n")}\n`], { type: "text/javascript" }));
  }
  const map = Object.assign(document.createElement("script"), { type: "importmap", textContent: JSON.stringify({ imports }) });
  document.head.append(map);
}

let stopAuto: (() => void) | undefined;
let restore: (() => void) | undefined;

/** Applies the toolbar's switches to the page, and seeds the services afresh for every story. */
const withBlip: Decorator = (story, { globals }) => {
  const root = document.documentElement;
  stopAuto?.();
  stopAuto = undefined;
  const scheme = String(globals.scheme ?? "day");
  if (scheme === "auto") {
    delete root.dataset.chuScheme;
    stopAuto = core.autoScheme(root, { fade: false });
  } else root.dataset.chuScheme = scheme;
  const pixel = String(globals.pixel ?? "2");
  if (pixel === "2") delete root.dataset.chuPixel;
  else root.dataset.chuPixel = pixel;
  setReducedMotion(globals.motion === "reduce");
  restore?.();
  restore = core.provide({ seed: SEED, ...(testing ? { clock: () => new Date(FROZEN) } : {}) });
  return story();
};

const preview: Preview = {
  decorators: [withBlip],
  globalTypes: {
    scheme: {
      description: "Scheme: the time of day",
      toolbar: {
        title: "Scheme",
        icon: "sun",
        items: [
          { value: "day", title: "Day", icon: "sun" },
          { value: "sunset", title: "Sunset", icon: "mirror" },
          { value: "night", title: "Night", icon: "moon" },
          { value: "auto", title: "Auto (follows the clock)", icon: "time" },
        ],
        dynamicTitle: true,
      },
    },
    pixel: {
      description: "The pixel: CSS px per Blip pixel",
      toolbar: {
        title: "Pixel",
        icon: "grid",
        // Numbers, as Storybook reads `globals=pixel:3` from the URL.
        items: [2, 3, 4].map((n) => ({ value: n as unknown as string, title: `Pixel ${n}` })),
        dynamicTitle: true,
      },
    },
    motion: {
      description: "Motion: full, or as with prefers-reduced-motion",
      toolbar: {
        title: "Motion",
        icon: "play",
        items: [
          { value: "full", title: "Full motion", icon: "play" },
          { value: "reduce", title: "Reduced motion", icon: "stop" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { scheme: "day", pixel: 2, motion: "full" },
  parameters: {
    layout: "padded",
    docs: { theme: blip, codePanel: true },
    a11y: {
      // Axe on every story, to WCAG 2.2 AA; a violation fails the story's test.
      test: "error",
      options: { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } },
    },
    options: {
      storySort: {
        order: [
          "Introduction",
          "Foundations",
          ["Colour", "Type", "Space and shape", "Box", "Motion"],
          "Components",
          ["Actions", "Forms", "Navigation", "Feedback", "Data", "Layout"],
          "Game",
          "Blocks",
          "Effects",
          "Icons",
          "Font",
        ],
      },
    },
  },
};

export default preview;
