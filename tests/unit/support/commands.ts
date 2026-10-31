/**
 * Browser commands: run on the Node side with Playwright's page, called from tests through
 * `import { commands } from "vitest/browser"`.
 */
import type { BrowserCommand } from "vitest/node";

/** Emulates the reduced-motion media feature, as a person's system setting would. */
export const emulateMedia: BrowserCommand<[reducedMotion: "reduce" | "no-preference"]> = async (ctx, reducedMotion) => {
  if (!("page" in ctx)) throw new Error("emulateMedia needs the Playwright provider.");
  await ctx.page.emulateMedia({ reducedMotion });
};

declare module "vitest/browser" {
  interface BrowserCommands {
    emulateMedia: (reducedMotion: "reduce" | "no-preference") => Promise<void>;
  }
}
