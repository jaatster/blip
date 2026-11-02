#!/usr/bin/env node
/**
 * The checks a commit passes before it goes to main, run on this machine rather than in GitHub Actions.
 *
 *   pnpm verify                 the build, manifests, CSS lint, budgets, the lint rules, the React wrappers (types,
 *                               React 18 and 19), unit, visual and condition tests, Storybook and the docs site
 *   pnpm verify --real-stack    and the real-stack check (scripts/real-stack.mjs), which needs npm: run it before a
 *                               release
 *
 * The steps run one after another and stop at the first that fails. Each one's output goes to
 * .tools/verify/<step>.log, and a failing step's last lines are printed. Then the build must not have changed a
 * committed file. When everything passes on a clean working tree, the commit's tree goes into .git/blip-verified, and
 * .githooks/pre-push lets main take a commit only when its tree is there (git push --no-verify skips the hook). The
 * whole run holds scripts/heavy.mjs's lock, so other heavy jobs in this checkout wait for it.
 */
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { heavy } from "./heavy.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const USAGE = "usage: pnpm verify [--real-stack]";
const args = process.argv.slice(2).filter((a) => a !== "--");
const unknown = args.filter((a) => a !== "--real-stack");
if (unknown.length) {
  console.error(`verify: unknown option ${unknown.join(", ")}\n${USAGE}`);
  process.exit(2);
}

const STEPS = [
  ["build", "pnpm build"],
  ["manifests", "pnpm cem:check"],
  ["css-lint", "pnpm lint:css"],
  ["budgets", "pnpm budgets"],
  ["lint-rules", "pnpm --filter @jaatster/blip-stylelint-config test"],
  ["react-types", "pnpm --filter @jaatster/blip-react typecheck"],
  ["react", "pnpm --filter @jaatster/blip-react test"],
  ["unit", "pnpm --filter @jaatster/blip-tests test"],
  ["visual", "pnpm --filter @jaatster/blip-tests test:visual"],
  ["conditions", "pnpm --filter @jaatster/blip-tests test:conditions"],
  ["storybook", "pnpm --filter @jaatster/blip-storybook build"],
  ["docs", "pnpm --filter @jaatster/blip-docs build"],
  ...(args.includes("--real-stack") ? [["real-stack", "node scripts/real-stack.mjs"]] : []),
];

const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8" }).replace(/\n$/, "");
const LOGS = join(ROOT, ".tools/verify");
const STAMP = join(ROOT, git("rev-parse", "--git-path", "blip-verified"));
const sec = (ms) => (ms < 60_000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`);

/** Runs one step through the shell, its output into its log. */
function run(name, command, env) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(command, { cwd: ROOT, shell: true, stdio: ["ignore", "pipe", "pipe"], env });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    const done = (code) => {
      const log = join(LOGS, `${name}.log`);
      writeFileSync(log, out);
      resolve({ code, out, log, ms: Date.now() - started });
    };
    child.on("error", (e) => {
      out += String(e);
      done(1);
    });
    child.on("close", (code) => done(code ?? 1));
  });
}

const release = await heavy("pnpm verify");
const env = { ...process.env, FORCE_COLOR: "0" };
mkdirSync(LOGS, { recursive: true });
const tree = git("rev-parse", "HEAD^{tree}");
const before = git("status", "--porcelain");
const started = Date.now();
console.log(`verify ${git("log", "-1", "--format=%h %s")}${before ? " (with uncommitted changes)" : ""}\n`);

let failed = null;
for (const [name, command] of STEPS) {
  const r = await run(name, command, env);
  console.log(`${name.padEnd(12)} ${r.code ? "FAILED" : "ok    "} ${sec(r.ms).padStart(7)}`);
  if (r.code) {
    const tail = r.out.split("\n").map((l) => l.trimEnd()).filter(Boolean).slice(-40);
    console.log(`\n${tail.map((l) => `  ${l}`).join("\n")}\n\n  ${command}: the whole output is in ${relative(ROOT, r.log)}`);
    failed = name;
    break;
  }
}

// The build regenerates manifests, public-properties.json, the gallery, the React wrappers and more: a change to
// any committed file means it was not committed.
const after = git("status", "--porcelain");
if (!failed && after !== before) {
  const was = new Set(before.split("\n"));
  const changed = after.split("\n").filter((l) => l && !was.has(l));
  console.log(`\nThe build changed files that are committed. Commit what it regenerated:\n${changed.map((l) => `  ${l}`).join("\n")}`);
  failed = "generated files";
}
release();

const total = sec(Date.now() - started);
if (failed) {
  console.log(`\nverify: failed at ${failed}, in ${total}.`);
  process.exit(1);
}
if (before || git("rev-parse", "HEAD^{tree}") !== tree) {
  console.log(`\nverify: every step passed in ${total}, but the working tree had changes, so nothing is recorded. Commit, then run it again to push.`);
  process.exit(0);
}
const kept = existsSync(STAMP) ? readFileSync(STAMP, "utf8").split("\n").filter(Boolean) : [];
writeFileSync(STAMP, `${[...kept.filter((t) => t !== tree), tree].slice(-50).join("\n")}\n`);
console.log(`\nverify: every step passed in ${total}. ${git("log", "-1", "--format=%h")} can go to main.`);
