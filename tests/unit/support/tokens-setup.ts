/**
 * Global setup for the browser tests: builds the tokens from their sources in a temporary folder and hands the CSS
 * to the tests (`inject("tokensCss")`), so tests that read colours or durations from CSS never depend on a stale or
 * missing packages/tokens/dist.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { TestProject } from "vitest/node";
import { tokensCopy } from "./fixtures.ts";

export default function setup(project: TestProject): void {
  const tokens = tokensCopy();
  try {
    const run = tokens.build();
    if (run.status !== 0) throw new Error(`The tokens did not build:\n${run.stderr || run.stdout}`);
    project.provide("tokensCss", readFileSync(join(tokens.dir, "dist/css/tokens.css"), "utf8"));
  } finally {
    tokens.remove();
  }
}

declare module "vitest" {
  export interface ProvidedContext {
    tokensCss: string;
  }
}
