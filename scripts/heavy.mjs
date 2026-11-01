#!/usr/bin/env node
/**
 * One heavy job at a time in this checkout: the visual, accessibility and condition runs, the real-stack check and
 * the docs build. When several agents (or people) work in one checkout, their heavy jobs queue here instead of
 * starting five Chromiums and three builds at once.
 *
 *   node scripts/heavy.mjs <command> [args…]          runs the command once no other heavy job is running here
 *   node scripts/heavy.mjs "<a command line>" [args…]  the same through the shell, for `a && b` (args are quoted)
 *
 * The lock is a directory in the system's temporary folder, named from this checkout's path (another checkout or
 * worktree has its own), holding owner.json: the pid, the job and when it started. mkdir is atomic, so two jobs never
 * both get it. A lock is stale, and taken over, when its pid is dead or it is older than PP_HEAVY_MAX_MINUTES (60).
 * While another job holds it, this prints "waiting for <job> (pid N)…" once (again if the holder changes) and polls.
 *
 * With nothing else running the command starts at once and nothing is printed: the same output, the same exit code
 * (or signal). The lock goes when the command ends, when this is interrupted (Ctrl+C reaches the command too; SIGTERM
 * and SIGHUP are passed on to it) and on exit. A heavy job started inside one (PP_HEAVY_HELD is set) runs at once, so
 * nesting never deadlocks.
 *
 * Also importable: `await heavy("qa tabs")` waits for the lock and returns the function that releases it.
 */
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = realpathSync(join(dirname(fileURLToPath(import.meta.url)), ".."));
/** The lock: one per checkout. */
export const LOCK = join(tmpdir(), `blip-heavy-${createHash("sha256").update(ROOT).digest("hex").slice(0, 12)}`);
const OWNER = join(LOCK, "owner.json");
const MAX_AGE = Number(process.env.PP_HEAVY_MAX_MINUTES || 60) * 60_000;
/** How long a lock may stay without its owner.json (it is written straight after the mkdir) before it is stale. */
const MAKING = 10_000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === "EPERM";
  }
};

/** Who holds the lock, or null when nobody does. A lock without its owner.json yet is a job starting. */
function holder() {
  try {
    return JSON.parse(readFileSync(OWNER, "utf8"));
  } catch {
    try {
      return { pid: 0, job: "a job starting", started: statSync(LOCK).mtimeMs };
    } catch {
      return null;
    }
  }
}

/** Why a holder's lock is stale, or "" when it is live. */
function stale(h) {
  const age = Date.now() - h.started;
  if (!h.pid) return age > MAKING ? "it was never finished" : "";
  if (!alive(h.pid)) return "its process has gone";
  return age > MAX_AGE ? `it is ${Math.round(age / 60_000)} minutes old` : "";
}

/**
 * Waits for the lock and takes it; returns the function that gives it back. It is also given back on exit and, unless
 * `signals` is false (the command line below waits for its command instead), on SIGINT, SIGTERM and SIGHUP.
 */
export async function heavy(job, { signals = true } = {}) {
  if (process.env.PP_HEAVY_HELD) return () => {};
  let said = "";
  for (;;) {
    try {
      mkdirSync(LOCK);
      const tmp = join(LOCK, `owner.${process.pid}.tmp`);
      writeFileSync(tmp, `${JSON.stringify({ pid: process.pid, job, started: Date.now(), checkout: ROOT })}\n`);
      renameSync(tmp, OWNER);
      break;
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
    }
    const h = holder();
    if (!h) continue;
    const why = stale(h);
    if (why) {
      // Move it aside first: a rename either happens once or fails, so two waiters never both clear it.
      const again = holder();
      if (again?.pid === h.pid && again.started === h.started) {
        const aside = `${LOCK}.stale-${process.pid}-${Date.now()}`;
        try {
          renameSync(LOCK, aside);
          rmSync(aside, { recursive: true, force: true });
          console.error(`heavy: took over the lock of ${h.job} (pid ${h.pid}): ${why}.`);
        } catch {}
      }
      continue;
    }
    if (!h.pid) {
      // Its owner is writing owner.json: look again in a moment.
      await sleep(50);
      continue;
    }
    const line = `waiting for ${h.job} (pid ${h.pid})…`;
    if (line !== said) console.error(`heavy: ${line}`);
    said = line;
    await sleep(400 + Math.random() * 300);
  }
  process.env.PP_HEAVY_HELD = "1";
  let held = true;
  const release = () => {
    if (!held) return;
    held = false;
    delete process.env.PP_HEAVY_HELD;
    try {
      if (holder()?.pid === process.pid) rmSync(LOCK, { recursive: true, force: true });
    } catch {}
  };
  process.once("exit", release);
  if (signals) {
    for (const s of ["SIGINT", "SIGTERM", "SIGHUP"]) {
      process.once(s, () => {
        release();
        if (!process.listenerCount(s)) process.kill(process.pid, s);
      });
    }
  }
  return release;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (args[0] === "--") args.shift();
  if (!args.length) {
    console.error("usage: node scripts/heavy.mjs <command> [args…]");
    process.exit(2);
  }
  // pnpm names the script it runs: "@jaatster/blip-tests test:visual" says more than "playwright test --project=visual".
  const event = process.env.npm_lifecycle_event;
  const command = args.join(" ");
  const job = event ? `${process.env.npm_package_name ?? "pnpm"} ${event}` : command.length > 80 ? `${command.slice(0, 79)}…` : command;

  let child = null;
  const SIGNALS = { SIGINT: 2, SIGTERM: 15, SIGHUP: 1 };
  const onSignal = (signal) => {
    // Waiting, nothing is held: stop as the command would have. Running, the command decides: Ctrl+C already reached
    // it (the terminal signals the whole group), and a SIGTERM or SIGHUP sent to this process alone is passed on.
    if (!child) process.exit(128 + SIGNALS[signal]);
    if (signal !== "SIGINT") child.kill(signal);
  };
  for (const s of Object.keys(SIGNALS)) process.on(s, onSignal);

  const release = await heavy(job, { signals: false });
  const quote = (a) => (process.platform === "win32" ? `"${a.replace(/"/g, '""')}"` : `'${a.replace(/'/g, "'\\''")}'`);
  const line = args[0].includes(" ") ? [args[0], ...args.slice(1).map(quote)].join(" ") : null;
  child = line
    ? spawn(line, { stdio: "inherit", shell: true })
    : spawn(args[0], args.slice(1), { stdio: "inherit", shell: process.platform === "win32" });
  child.on("error", (e) => {
    release();
    console.error(`heavy: could not start ${args[0]}: ${e.message}`);
    process.exit(127);
  });
  child.on("exit", (code, signal) => {
    release();
    if (signal) {
      // End the way the command ended, so whatever started this sees the same signal.
      for (const s of Object.keys(SIGNALS)) process.removeAllListeners(s);
      process.exitCode = 1;
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 1);
  });
}
