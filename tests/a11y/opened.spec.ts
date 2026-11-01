/**
 * The same scan with each live overlay open, one at a time, since closed overlays are not rendered and so not
 * checked: dialogs and drawers (commandfor), popovers (popovertarget), menus (pp-menu), toasts (the example's buttons)
 * and tooltips (hovering their trigger). Covers what the elements generate, which the static copies cannot. A trigger in
 * an attract demo is inert: what it opens is scanned as the demo's still frame shows it.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test, expect, type Page } from "@playwright/test";
import { examples, id, ROOT } from "../page/manifest.js";
import { openExample, type Scheme } from "../page/open.js";
import type { KnownIssue } from "./known-issues.js";
import { scan, summary, type Violation } from "./scan.js";

interface Opener {
  /** What opens it: a selector for every such trigger in the example. */
  trigger: string;
  how: "click" | "hover";
  /** What is open once it worked. */
  open: string;
}

const OPENERS: Opener[] = [
  { trigger: 'button[command="show-modal"]', how: "click", open: "dialog:modal" },
  { trigger: '[popovertarget]:not([popovertargetaction="hide"])', how: "click", open: "[popover]:popover-open" },
  { trigger: 'pp-menu:not([role="menu"] pp-menu) > :is(button, [aria-haspopup])', how: "click", open: '[role="menu"]:popover-open' },
  { trigger: 'button[onclick*=".add("]', how: "click", open: "pp-toaster .pp-toast" },
  { trigger: "pp-tooltip", how: "hover", open: "pp-tooltip:popover-open" },
];
/** Examples with something to open, found from their markup. */
const OPENS = /command="show-modal"|popovertarget=|<pp-menu[\s>]|\.add\(|<pp-tooltip[\s>]/;
const SCHEMES: Scheme[] = ["day", "night"];

for (const example of examples.filter((e) => OPENS.test(readFileSync(join(ROOT, e.url), "utf8")))) {
  for (const scheme of SCHEMES) {
    test(`${id(example)} ${scheme}, overlays open`, async ({ page }, info) => {
      const used = new Set<KnownIssue>();
      const failures: string[] = [];
      let opened = 0;
      for (const opener of OPENERS) {
        await openExample(page, example, scheme);
        const count = await page.locator(`#example ${opener.trigger}`).count();
        for (let i = 0; i < count; i++) {
          if (i) await openExample(page, example, scheme);
          const label = await act(page, opener, i);
          if (!label) continue;
          opened++;
          const failing: Violation[] = await scan(page, info, id(example), scheme, used);
          if (failing.length) failures.push(summary(`${id(example)} (${scheme}) with ${label} open`, failing));
        }
      }
      info.annotations.push({ type: "overlays scanned", description: String(opened) });
      expect(opened, `${id(example)}: nothing opened`).toBeGreaterThan(0);
      expect(failures.length, failures.join("\n\n")).toBe(0);
    });
  }
}

/** Opens the i-th overlay of a kind; returns a label for it, or null when its trigger is not shown at this width. */
async function act(page: Page, opener: Opener, i: number): Promise<string | null> {
  const trigger = opener.trigger === "pp-tooltip"
    ? page.locator(`#${await page.locator("#example pp-tooltip").nth(i).getAttribute("for")}`)
    : page.locator(`#example ${opener.trigger}`).nth(i);
  if (!(await trigger.isVisible())) return null;
  const label = `${opener.trigger === "pp-tooltip" ? "the tooltip of" : ""} ${(await trigger.getAttribute("aria-label")) ?? (await trigger.innerText()).trim()}`.trim();
  // An attract demo's controls are inert: nobody can open what they open, the demo does, and its still frame shows it.
  if (await trigger.evaluate((el) => !!el.closest("[inert]"))) return (await page.locator(opener.open).first().isVisible()) ? `"${label}" (opened by its demo)` : null;
  if (opener.how === "hover") await trigger.hover();
  else await trigger.click();
  await expect(page.locator(opener.open).first(), `${label} did not open`).toBeVisible({ timeout: 5000 });
  // Toasts are announced a beat later; let the page settle before scanning.
  await page.waitForTimeout(250);
  return `"${label}"`;
}
