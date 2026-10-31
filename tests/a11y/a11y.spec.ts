/**
 * axe on every example, in Day and Night, against WCAG 2.2 AA (and every level below it). A violation fails the test
 * with a summary per rule: impact, what it checks, each node's selector and axe's explanation. Problems that belong to
 * a component and are tracked in known-issues.ts are listed as annotations instead.
 */
import { test, expect } from "@playwright/test";
import { examples, id } from "../page/manifest.js";
import { openExample, type Scheme } from "../page/open.js";
import { KNOWN_ISSUES, type KnownIssue } from "./known-issues.js";
import { scan, summary } from "./scan.js";

const SCHEMES: Scheme[] = ["day", "night"];

for (const example of examples) {
  for (const scheme of SCHEMES) {
    test(`${id(example)} ${scheme}`, async ({ page }, info) => {
      await openExample(page, example, scheme);
      const used = new Set<KnownIssue>();
      const failing = await scan(page, info, id(example), scheme, used);
      for (const k of KNOWN_ISSUES.filter((k) => k.example === id(example) && (!k.schemes || (k.schemes as string[]).includes(scheme)))) {
        if (!used.has(k)) info.annotations.push({ type: "stale known issue", description: `${k.rule} at "${k.target}" no longer happens in ${id(example)} (${scheme}): remove it from known-issues.ts.` });
      }
      if (failing.length) await info.attach("axe-violations.json", { body: JSON.stringify(failing, null, 2), contentType: "application/json" });
      expect(failing.length, summary(`${id(example)} (${scheme})`, failing)).toBe(0);
    });
  }
}
