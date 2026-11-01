/**
 * Failures the lanes find that are design decisions or bigger than a quick fix, written down in known-issues.ts so
 * the lane stays green while the problem stays visible: each matching failure becomes an annotation on the test, and
 * an entry that no longer matches anything is reported as stale so it can be removed.
 */
import { expect, type TestInfo } from "@playwright/test";
import { KNOWN_ISSUES, type KnownIssue, type Lane } from "../known-issues.js";

export type { Lane };

/**
 * Splits a test's failures (one line each, starting with its condition in brackets: "[night hover] …") into known
 * ones, which are annotated, and the rest, which fail the test. `ran` lists the conditions the test covered, so an
 * entry for one of them that matched nothing is reported as stale.
 */
export function triage(info: TestInfo, lane: Lane, example: string, failures: string[], ran: string[]): string[] {
  const entries = KNOWN_ISSUES.filter((k) => k.lane === lane && k.example === example);
  const used = new Set<KnownIssue>();
  const unknown: string[] = [];
  for (const line of failures) {
    const k = entries.find((k) => line.includes(k.match) && (!k.condition || conditionOf(line).includes(k.condition)));
    if (!k) {
      unknown.push(line);
      continue;
    }
    used.add(k);
    info.annotations.push({ type: `known ${lane} issue`, description: `${line}\n  Why: ${k.why}\n  Fix: ${k.fix}` });
  }
  for (const k of entries) {
    if (used.has(k)) continue;
    if (k.condition && !ran.some((c) => c.includes(k.condition!))) continue;
    info.annotations.push({ type: "stale known issue", description: `${lane}: "${k.match}"${k.condition ? ` (${k.condition})` : ""} no longer fails in ${example}: remove it from known-issues.ts.` });
  }
  return unknown;
}

const conditionOf = (line: string) => line.match(/^\[([^\]]*)\]/)?.[1] ?? "";

/** Fails the test with every unknown failure listed, at most `max` of them. */
export function expectNone(unknown: string[], title: string, max = 40): void {
  const shown = unknown.slice(0, max).join("\n");
  const more = unknown.length > max ? `\n… and ${unknown.length - max} more` : "";
  expect(unknown.length, `${title}: ${unknown.length} failure${unknown.length === 1 ? "" : "s"}\n${shown}${more}`).toBe(0);
}
