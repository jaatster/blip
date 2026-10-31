/**
 * Accessibility problems that live in a component (its CSS or element), not in an example, and are not fixed yet.
 * Each entry lets exactly one rule on matching nodes of one example through, so the scan stays green while the
 * problem stays visible: the test lists every allowed node as an annotation, and an entry that no longer matches
 * anything is reported so it can be removed. Never allow a whole rule.
 */
export interface KnownIssue {
  /** The example, as package/name: "components/tabs". */
  example: string;
  /** The axe rule id. */
  rule: string;
  /** A substring of the node's axe target selector. */
  target: string;
  /** Only in these schemes (default: all). */
  schemes?: ("day" | "night")[];
  /** The component the fix belongs in, as package/file. */
  component: string;
  /** What is wrong, precisely. */
  why: string;
  /** How to fix it. */
  fix: string;
}

export const KNOWN_ISSUES: KnownIssue[] = [];
