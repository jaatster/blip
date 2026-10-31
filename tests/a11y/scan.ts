/** The axe scan both specs share: WCAG 2.2 AA tags, scoped to the example, known component issues let through. */
import AxeBuilder from "@axe-core/playwright";
import type { Page, TestInfo } from "@playwright/test";
import { KNOWN_ISSUES, type KnownIssue } from "./known-issues.js";

export type Violation = Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"][number];

export const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** Runs axe on #example and returns the violations that are not known component issues (each of those becomes an
    annotation). `used` collects the known issues that matched. */
export async function scan(page: Page, info: TestInfo, example: string, scheme: string, used: Set<KnownIssue>): Promise<Violation[]> {
  const results = await new AxeBuilder({ page }).include("#example").withTags(TAGS).analyze();
  const known = KNOWN_ISSUES.filter((k) => k.example === example && (!k.schemes || (k.schemes as string[]).includes(scheme)));
  const failing: Violation[] = [];
  for (const v of results.violations) {
    const nodes = v.nodes.filter((n) => {
      const target = n.target.join(" ");
      const k = known.find((k) => k.rule === v.id && target.includes(k.target));
      if (!k) return true;
      used.add(k);
      info.annotations.push({ type: "known a11y issue", description: `${v.id} at ${target}: ${k.why} Fix in ${k.component}: ${k.fix}` });
      return false;
    });
    if (nodes.length) failing.push({ ...v, nodes });
  }
  return failing;
}

/** One block per rule: impact, rule, what it checks, the docs; then each node and axe's account of it. */
export function summary(title: string, violations: Violation[]): string {
  const nodes = violations.reduce((n, v) => n + v.nodes.length, 0);
  const lines = [`${title}: ${violations.length} accessibility rule${violations.length === 1 ? "" : "s"} failed on ${nodes} node${nodes === 1 ? "" : "s"}.`];
  for (const v of violations) {
    lines.push("", `[${v.impact ?? "?"}] ${v.id}: ${v.help}`, `  ${v.helpUrl}`);
    for (const n of v.nodes.slice(0, 12)) {
      lines.push(`  - ${n.target.join(" ")}`);
      for (const why of (n.failureSummary ?? "").split("\n").map((s) => s.trim()).filter(Boolean)) lines.push(`      ${why}`);
    }
    if (v.nodes.length > 12) lines.push(`  ... and ${v.nodes.length - 12} more`);
  }
  return lines.join("\n");
}
