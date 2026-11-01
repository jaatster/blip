#!/usr/bin/env node
/**
 * The real-stack check: Blip as an adopter gets it, in the setups real teams use. It packs every publishable
 * package with pnpm pack, makes each app in tests/real-stack/<app> in a folder of its own outside the repository,
 * installs the tarballs and the framework from npm, runs the framework's own production build and dev server, and
 * opens each in Playwright's Chromium for the checks in tests/real-stack/smoke.mjs.
 *
 *   pnpm build                                     first: it packs packages/<name>/dist as they are
 *   node scripts/real-stack.mjs                    every app
 *   node scripts/real-stack.mjs next vue           some of them
 *   node scripts/real-stack.mjs react --no-dev     production builds only
 *
 *   --dir <folder>   where the tarballs and the apps go (PP_STACK_DIR; default <tmp>/pp-stack). Each app keeps its
 *                    node_modules there between runs, so a second run installs only Blip again.
 *   --clean          install everything afresh.
 *   --jobs <n>       apps at once (PP_STACK_JOBS; default 2, or 1 on a machine with fewer than 4 cores).
 *   --no-dev         skip the dev servers.
 *   --headed         show the browser.
 *
 * The apps follow the README and the start page to the letter: the same installs, imports and snippets. Their
 * package.json files name Blip's packages with "*", and this script points each one, and every package they
 * depend on (npm overrides), at its tarball. Each app has its own port, 4611 to 4616. Its commands and server output
 * go to <dir>/<app>/real-stack.log, a picture of the page for each check that fails to <dir>/<app>/<run>/, and the
 * results to <dir>/results.json. Exits 1 if anything fails. Needs npm, network access to its registry, and Linux or
 * macOS (servers are stopped by process group, found with ps).
 */
import { execFileSync, spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, openSync, closeSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync, appendFileSync } from "node:fs";
import { availableParallelism, tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { createConnection } from "node:net";
import { gzipSync } from "node:zlib";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STACK = join(ROOT, "tests/real-stack");

const { values: opts, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    dir: { type: "string" },
    clean: { type: "boolean", default: false },
    jobs: { type: "string" },
    "no-dev": { type: "boolean", default: false },
    headed: { type: "boolean", default: false },
  },
});
const WORK = opts.dir ?? process.env.PP_STACK_DIR ?? join(tmpdir(), "pp-stack");
const JOBS = Number(opts.jobs ?? process.env.PP_STACK_JOBS ?? (availableParallelism() >= 4 ? 2 : 1));

/** A production build served by the framework's own preview server, and the dev server. */
const vite = [{ name: "build", build: "build", serve: "preview" }, { name: "dev", serve: "dev" }];
/**
 * The apps. Each run builds (an npm script) and serves (another), and the smoke checks open its pages. Checks are
 * named in tests/real-stack/smoke.mjs; `versions` are the packages whose versions the summary reports.
 */
const APPS = {
  react: {
    port: 4611, shared: true, runs: vite, shake: true,
    pages: [{ path: "/", checks: ["look", "tabs", "toast", "dialog", "late-tabs", "combobox", "field", "kits"] }],
    versions: ["react", "vite", "@vitejs/plugin-react", "typescript"],
  },
  vue: {
    port: 4612, runs: vite,
    pages: [
      { path: "/", checks: ["look", "tabs", "dialog", "late-tabs", "combobox", "field"] },
      { path: "/lazy.html?bind=docs", checks: ["lazy-dialog"] },
      { path: "/lazy.html?bind=plain", checks: ["lazy-dialog"] },
    ],
    versions: ["vue", "vite", "@vitejs/plugin-vue"],
  },
  svelte: {
    port: 4613, runs: vite,
    pages: [
      { path: "/", checks: ["look", "tabs", "dialog", "late-tabs", "combobox", "field"] },
      { path: "/lazy.html?bind=docs", checks: ["lazy-dialog"] },
      { path: "/lazy.html?bind=plain", checks: ["lazy-dialog"] },
    ],
    versions: ["svelte", "vite", "@sveltejs/vite-plugin-svelte"],
  },
  next: {
    port: 4614, shared: true,
    runs: [
      { name: "turbopack build", build: "build", serve: "start" },
      { name: "turbopack dev", serve: "dev" },
      { name: "webpack build", build: "build:webpack", serve: "start" },
      { name: "webpack dev", serve: "dev:webpack" },
    ],
    pages: [{ path: "/", checks: ["look", "tabs", "toast", "dialog", "late-tabs", "combobox", "field", "kits"] }],
    versions: ["next", "react", "typescript"],
  },
  tailwind: {
    port: 4615, shared: true, runs: vite,
    pages: [
      { path: "/", checks: ["look", "tabs", "dialog", "late-tabs", "combobox", "field", "tailwind"] },
      { path: "/reversed.html", checks: ["look", "tailwind"] },
      { path: "/own.html", checks: ["reset"] },
    ],
    versions: ["tailwindcss", "@tailwindcss/vite", "react", "vite"],
  },
  astro: {
    port: 4616, runs: vite,
    pages: [{ path: "/", checks: ["look", "tabs", "dialog", "late-tabs", "combobox", "field"] }],
    versions: ["astro", "vite"],
  },
};

const chosen = positionals.length ? positionals : Object.keys(APPS);
for (const name of chosen) if (!APPS[name]) fail(`unknown app "${name}": the apps are ${Object.keys(APPS).join(", ")}`);

// ---------------------------------------------------------------------------------------------------------------
// Small helpers.

function fail(message) {
  console.error(`real-stack: ${message}`);
  process.exit(1);
}
const seconds = (ms) => `${(ms / 1000).toFixed(1)} s`;
const bytes = (n) => `${n.toLocaleString("en-GB")} B`;
const read = (file) => readFileSync(file, "utf8");
const readJson = (file) => JSON.parse(read(file));
const pad = (s, n) => String(s).padEnd(n);

/**
 * The environment for every command: no npm or pnpm settings inherited from whatever started this script, no
 * telemetry, no colour. Astro moves `astro dev` and `astro preview` into a background process of their own when it
 * finds an AI agent's variables (CLAUDECODE, AI_AGENT…); its BACKGROUND variables keep them in the foreground, as in
 * a terminal or CI.
 */
const ENV = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(npm|pnpm)_/i.test(k)));
Object.assign(ENV, {
  NEXT_TELEMETRY_DISABLED: "1", ASTRO_TELEMETRY_DISABLED: "1", BROWSERSLIST_IGNORE_OLD_DATA: "1", NO_UPDATE_NOTIFIER: "1", NO_COLOR: "1",
  ASTRO_DEV_BACKGROUND: "1", ASTRO_PREVIEW_BACKGROUND: "1",
});

/**
 * Runs a command to the end, its output appended to `log`. Resolves with its stdout (and stderr, with `both`) when it
 * exits 0; rejects with the last lines of its output otherwise, or when it runs past `timeout`.
 */
function run(cmd, args, { cwd, log, env = {}, timeout = 10 * 60_000, both = false }) {
  appendFileSync(log, `\n$ ${[cmd, ...args].join(" ")}   (in ${cwd})\n`);
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, env: { ...ENV, ...env }, stdio: ["ignore", "pipe", "pipe"], detached: true });
    let out = "";
    let all = "";
    child.stdout.on("data", (d) => { out += d; all += d; appendFileSync(log, d); });
    child.stderr.on("data", (d) => { all += d; appendFileSync(log, d); });
    const timer = setTimeout(() => {
      kill(child);
      reject(new Error(`${cmd} ${args.join(" ")} took longer than ${seconds(timeout)}\n${tail(all)}`));
    }, timeout);
    child.on("error", (e) => { clearTimeout(timer); reject(e); });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(both ? all : out);
      else reject(new Error(`${cmd} ${args.join(" ")} exited with ${code}\n${tail(all)}`));
    });
  });
}
const tail = (text, n = 30) => text.trim().split("\n").slice(-n).map((l) => `    ${l}`).join("\n");

/** Kills a command and everything it started: its process group, and any process under it that left the group. */
function kill(child, signal = "SIGTERM", pids = descendants(child.pid)) {
  for (const pid of [-child.pid, ...pids]) {
    try {
      process.kill(pid, signal);
    } catch {
      // Gone already.
    }
  }
}

/** The processes under a process, from ps (the same on Linux and macOS). */
function descendants(root) {
  const under = new Map();
  try {
    for (const line of execFileSync("ps", ["-A", "-o", "pid=,ppid="], { encoding: "utf8" }).trim().split("\n")) {
      const [pid, ppid] = line.trim().split(/\s+/).map(Number);
      under.set(ppid, [...(under.get(ppid) ?? []), pid]);
    }
  } catch {
    return [];
  }
  const all = [];
  const walk = (pid) => {
    for (const p of under.get(pid) ?? []) {
      all.push(p);
      walk(p);
    }
  };
  walk(root);
  return all;
}

/** Starts a server on a port; `stop()` ends it and everything it started, and waits until the port is free. */
function start(cmd, args, { cwd, log, port }) {
  appendFileSync(log, `\n$ ${[cmd, ...args].join(" ")}   (in ${cwd})\n`);
  const fd = openSync(log, "a");
  const child = spawn(cmd, args, { cwd, env: ENV, stdio: ["ignore", fd, fd], detached: true });
  closeSync(fd);
  let exited = null;
  const done = new Promise((resolve) => child.on("exit", (code, signal) => resolve((exited = code ?? signal))));
  return {
    exited: () => exited,
    async stop() {
      const pids = descendants(child.pid);
      kill(child, "SIGTERM", pids);
      const late = setTimeout(() => kill(child, "SIGKILL", pids), 5000);
      await done;
      for (let i = 0; i < 50 && (await listening(port)); i++) await new Promise((r) => setTimeout(r, 200));
      clearTimeout(late);
      if (await listening(port)) throw new Error(`${cmd} ${args.join(" ")} left something listening on port ${port}`);
    },
  };
}

/** Is something listening on the port (on IPv4 or IPv6)? */
const listening = (port) =>
  Promise.all(["127.0.0.1", "::1"].map((host) => new Promise((resolve) => {
    const socket = createConnection({ port, host });
    socket.once("connect", () => { socket.destroy(); resolve(true); });
    socket.once("error", () => resolve(false));
  }))).then((r) => r.some(Boolean));

/** Waits until the server answers at the url (a dev server's first answer can take a while: it compiles then). */
async function ready(url, server, log, timeout = 120_000) {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    if (server.exited() !== null) throw new Error(`the server stopped (${server.exited()}) before it answered\n${tail(read(log))}`);
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(60_000) });
      if (r.status < 500) return;
    } catch {
      // Not yet.
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`nothing answered at ${url} within ${seconds(timeout)}\n${tail(read(log))}`);
}

// ---------------------------------------------------------------------------------------------------------------
// 1. Pack every publishable package.

/** Every file under a folder (node_modules left out), with its size and time: to see what packing changed. */
function snapshot(dir, into = new Map()) {
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    if (f.name === "node_modules") continue;
    const p = join(dir, f.name);
    if (f.isDirectory()) snapshot(p, into);
    else {
      const s = statSync(p);
      into.set(p, `${s.size}:${s.mtimeMs}`);
    }
  }
  return into;
}
const newest = (dir) => (existsSync(dir) ? Math.max(0, ...[...snapshot(dir).values()].map((v) => Number(v.split(":")[1]))) : 0);

/** Every target an exports map names (conditions followed), as paths in the package. */
const targets = (exp) => (typeof exp === "string" ? [exp] : exp && typeof exp === "object" ? Object.values(exp).flatMap(targets) : []);

async function pack() {
  const t0 = Date.now();
  const dir = join(WORK, "packs");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const log = join(WORK, "pack.log");
  writeFileSync(log, "");
  const names = readdirSync(join(ROOT, "packages")).filter((p) => existsSync(join(ROOT, "packages", p, "package.json")));
  const manifests = names.map((p) => ({ dir: join(ROOT, "packages", p), pkg: readJson(join(ROOT, "packages", p, "package.json")) })).filter((m) => !m.pkg.private);
  const notes = [];
  for (const { dir: pdir, pkg } of manifests) {
    // Scripts pnpm pack would run: none today. One that builds would pack something other than what you built.
    const life = ["prepack", "prepare", "postpack"].filter((s) => pkg.scripts?.[s]);
    if (life.length) notes.push(`${pkg.name} runs ${life.map((s) => `${s} (${pkg.scripts[s]})`).join(", ")} when packed`);
    if (pkg.files?.includes("dist") && !existsSync(join(pdir, "dist"))) fail(`${pkg.name} has no dist: run pnpm build first`);
    if (existsSync(join(pdir, "src")) && existsSync(join(pdir, "dist")) && newest(join(pdir, "src")) > newest(join(pdir, "dist")) + 1000) {
      notes.push(`${pkg.name}: src is newer than dist (pnpm build packs what you changed)`);
    }
  }
  const before = snapshot(join(ROOT, "packages"));
  const packs = {};
  await Promise.all(manifests.map(async ({ dir: pdir, pkg }) => {
    const out = await run("pnpm", ["pack", "--pack-destination", dir, "--json"], { cwd: pdir, log, timeout: 120_000 });
    const info = JSON.parse(out.slice(out.indexOf("{")));
    packs[pkg.name] = { version: pkg.version, file: info.filename, files: new Set(info.files.map((f) => f.path)) };
  }));
  // Nothing in the packages may change while they are packed.
  const after = snapshot(join(ROOT, "packages"));
  const changed = [...after].filter(([f, v]) => before.get(f) !== v).map(([f]) => relative(ROOT, f));
  const removed = [...before.keys()].filter((f) => !after.has(f)).map((f) => relative(ROOT, f));
  if (changed.length || removed.length) {
    fail(`pnpm pack changed the packages (a prepack or prepare script rebuilt them?):\n  ${[...changed, ...removed].slice(0, 20).join("\n  ")}`);
  }
  // Every file the exports maps name is in its tarball.
  const missing = [];
  for (const { pkg } of manifests) {
    const files = packs[pkg.name].files;
    for (const target of new Set(targets(pkg.exports ?? {}))) {
      const path = target.replace(/^\.\//, "");
      if (!path.includes("*") ? !files.has(path) : ![...files].some((f) => new RegExp(`^${path.split("*").map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".+")}$`).test(f))) {
        missing.push(`${pkg.name}: ${target}`);
      }
    }
  }
  if (missing.length) fail(`exports name files that are not in the tarballs:\n  ${missing.join("\n  ")}`);
  console.log(`Packed ${manifests.length} packages in ${seconds(Date.now() - t0)}: nothing rebuilt, every export in its tarball.`);
  for (const n of notes) console.log(`  note: ${n}`);
  return packs;
}

// ---------------------------------------------------------------------------------------------------------------
// 2. Make, install, build, serve and check each app.

/** Makes the app's folder from its template: everything replaced but node_modules, Blip from the tarballs. */
async function prepare(name, app, packs, log) {
  const dir = join(WORK, name);
  mkdirSync(dir, { recursive: true });
  // The last run's install stays (unless --clean), so the frameworks stay as they were installed.
  const keep = opts.clean ? [] : ["node_modules", "package-lock.json"];
  for (const f of readdirSync(dir)) if (!keep.includes(f)) rmSync(join(dir, f), { recursive: true, force: true });
  // Blip is installed afresh every time, and the bundlers' caches of it go too.
  for (const f of ["@blip", ".vite", ".cache", ".astro", ".package-lock.json"]) rmSync(join(dir, "node_modules", f), { recursive: true, force: true });
  const lock = join(dir, "package-lock.json");
  if (existsSync(lock)) {
    const locked = readJson(lock);
    for (const k of Object.keys(locked.packages ?? {})) if (/(^|\/)node_modules\/@blip\//.test(k)) delete locked.packages[k];
    writeFileSync(lock, JSON.stringify(locked, null, 2));
  }
  writeFileSync(log, `real-stack: ${name}, ${new Date().toISOString()}\n`);
  cpSync(join(STACK, name), dir, { recursive: true });
  if (app.shared) cpSync(join(STACK, "shared"), join(dir, "shared"), { recursive: true });
  const file = join(dir, "package.json");
  const pkg = readJson(file);
  for (const field of ["dependencies", "devDependencies"]) {
    for (const dep of Object.keys(pkg[field] ?? {})) {
      if (!dep.startsWith("@jaatster/blip-")) continue;
      if (!packs[dep]) throw new Error(`${name} depends on ${dep}, which is not a package here`);
      pkg[field][dep] = `file:${packs[dep].file}`;
    }
  }
  pkg.overrides = Object.fromEntries(Object.entries(packs).map(([dep, p]) => [dep, `file:${p.file}`]));
  writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
  await run("npm", ["install", "--no-audit", "--no-fund", "--loglevel=error"], { cwd: dir, log, timeout: 10 * 60_000 });
  return dir;
}

/** The installed version of each package the summary reports. */
const versions = (dir, names) =>
  names.map((n) => {
    const f = join(dir, "node_modules", n, "package.json");
    return `${n} ${existsSync(f) ? readJson(f).version : "?"}`;
  });

/** React tree-shaking: the JavaScript a page loads before it renders, for React alone, with Button, and with Tabs. */
async function shake(dir, log) {
  const pages = {};
  for (const page of ["plain", "button", "tabs"]) {
    await run(join(dir, "node_modules/.bin/vite"), ["build", "--config", "vite.shake.config.ts"], { cwd: dir, log, env: { SHAKE: page } });
    const out = join(dir, "dist-shake", page);
    const html = read(join(out, `${page}.html`));
    const eager = [...html.matchAll(/<script[^>]*\ssrc="([^"]+\.js)"|<link[^>]*rel="modulepreload"[^>]*href="([^"]+)"/g)].map((m) => (m[1] ?? m[2]).replace(/^\//, ""));
    const assets = readdirSync(join(out, "assets")).filter((f) => f.endsWith(".js")).map((f) => `assets/${f}`);
    const gz = (f) => gzipSync(readFileSync(join(out, f)), { level: 9 }).length;
    const all = assets.map((f) => read(join(out, f))).join("\n");
    pages[page] = {
      eager: eager.reduce((n, f) => n + gz(f), 0),
      lazy: assets.filter((f) => !eager.includes(f)).reduce((n, f) => n + gz(f), 0),
      // Each element module ends PixelElement.define("pp-name", Class); minifiers may quote it with backticks.
      elements: [...new Set([...all.matchAll(/\.define\(\s*["'`](pp-[a-z-]+)["'`]/g)].map((m) => m[1]))].sort(),
    };
  }
  const button = pages.button.eager - pages.plain.eager;
  const tabs = pages.tabs.eager - pages.plain.eager;
  const problems = [];
  if (button >= 1024) problems.push(`Button adds ${bytes(button)} gzipped to the page (budget: under 1,024 B)`);
  if (tabs >= 2560) problems.push(`Tabs adds ${bytes(tabs)} gzipped to the page (budget: under 2,560 B)`);
  if (pages.button.elements.length) problems.push(`a page with only Button defines ${pages.button.elements.join(", ")}`);
  if (pages.tabs.elements.join() !== "pp-tabs") problems.push(`a page with only Tabs defines ${pages.tabs.elements.join(", ") || "no element"}, not just pp-tabs`);
  const summary = `Button +${bytes(button)}, Tabs +${bytes(tabs)} (and ${bytes(pages.tabs.lazy)} for pp-tabs when it mounts) over React alone, gzipped`;
  return { ok: !problems.length, summary, problems, pages, button, tabs };
}

async function check(name, browser, smoke, packs) {
  const app = APPS[name];
  const log = join(WORK, name, "real-stack.log");
  mkdirSync(join(WORK, name), { recursive: true });
  const result = { app: name, runs: [], versions: [], problems: [] };
  const say = (line) => console.log(`${pad(name, 9)} ${line}`);
  let dir;
  try {
    const t0 = Date.now();
    dir = await prepare(name, app, packs, log);
    result.versions = versions(dir, app.versions);
    say(`installed in ${seconds(Date.now() - t0)}: ${result.versions.join(", ")}`);
  } catch (e) {
    result.problems.push(`install: ${e.message}`);
    say(`install FAILED\n${e.message}`);
    return result;
  }
  const url = `http://localhost:${app.port}`;
  for (const r of app.runs) {
    if (opts["no-dev"] && !r.build) continue;
    const entry = { run: r.name, steps: [], checks: [] };
    result.runs.push(entry);
    const failed = (step, e) => {
      entry.steps.push({ step, ok: false, error: e.message });
      result.problems.push(`${r.name}: ${step}: ${e.message}`);
      say(`${r.name}: ${step} FAILED\n${e.message}`);
    };
    if (r.build) {
      const t0 = Date.now();
      try {
        // A warning from a build is a rule dropped or a module skipped, as the minifiers once did with Blip's CSS.
        const out = await run("npm", ["run", r.build], { cwd: dir, log, both: true });
        const warnings = out.split("\n").filter((l) => /\bwarn(ings?)?\b|\u26a0/i.test(l));
        if (warnings.length) throw new Error(`the build warned:\n${warnings.slice(0, 10).map((l) => `    ${l.trim()}`).join("\n")}`);
        entry.steps.push({ step: "build", ok: true, ms: Date.now() - t0 });
      } catch (e) {
        failed("build", e);
        continue;
      }
    }
    if (await listening(app.port)) {
      failed("serve", new Error(`port ${app.port} is already in use: stop whatever is on it`));
      continue;
    }
    const t1 = Date.now();
    const server = start("npm", ["run", r.serve], { cwd: dir, log, port: app.port });
    try {
      await ready(`${url}${app.pages[0].path}`, server, log);
      const served = Date.now() - t1;
      const t2 = Date.now();
      const checks = await smoke.run(browser, url, app.pages, { shots: join(WORK, name, r.name.replace(/\W+/g, "-")), dev: !r.build });
      entry.checks = checks;
      const bad = checks.filter((c) => !c.ok);
      for (const c of bad) result.problems.push(`${r.name}: ${c.page} ${c.check}: ${c.error}`);
      const what = r.build ? `built in ${seconds(entry.steps[0].ms)}, ` : `served in ${seconds(served)}, `;
      say(`${r.name}: ${what}${checks.length - bad.length}/${checks.length} checks passed in ${seconds(Date.now() - t2)}`);
      for (const c of bad) say(`  FAIL ${c.page} ${c.check}: ${c.error}`);
    } catch (e) {
      failed("serve", e);
    } finally {
      await server.stop().catch((e) => failed("stop", e));
    }
    if (r.build && app.shake) {
      try {
        const s = await shake(dir, log);
        result.shake = s;
        for (const p of s.problems) result.problems.push(`tree-shaking: ${p}`);
        say(`tree-shaking: ${s.summary}${s.ok ? "" : `\n  FAIL ${s.problems.join("\n  FAIL ")}`}`);
      } catch (e) {
        result.problems.push(`tree-shaking: ${e.message}`);
        say(`tree-shaking FAILED\n${e.message}`);
      }
    }
  }
  return result;
}

// ---------------------------------------------------------------------------------------------------------------

const t0 = Date.now();
mkdirSync(WORK, { recursive: true });
console.log(`Blip real-stack check: ${chosen.join(", ")}, in ${WORK}, ${JOBS} at a time.`);
const packs = await pack();
const smoke = await import("../tests/real-stack/smoke.mjs");
const browser = await smoke.launch({ headless: !opts.headed });
const results = [];
const queue = [...chosen];
await Promise.all(Array.from({ length: Math.min(JOBS, queue.length) }, async () => {
  for (let name; (name = queue.shift()); ) results.push(await check(name, browser, smoke, packs));
}));
await browser.close();

results.sort((a, b) => chosen.indexOf(a.app) - chosen.indexOf(b.app));
writeFileSync(join(WORK, "results.json"), `${JSON.stringify({ ms: Date.now() - t0, results }, null, 2)}\n`);
const problems = results.flatMap((r) => r.problems.map((p) => `${r.app}: ${p}`));
console.log(`\n${problems.length ? `${problems.length} problem${problems.length > 1 ? "s" : ""}` : "Every app passed"} in ${seconds(Date.now() - t0)}.`);
for (const r of results) {
  const runs = r.runs.map((x) => `${x.run} ${x.steps.every((s) => s.ok) && x.checks.length && x.checks.every((c) => c.ok) ? "pass" : "FAIL"}`);
  console.log(`  ${pad(r.app, 9)} ${runs.join(", ") || "FAIL"}${r.shake ? `; tree-shaking ${r.shake.ok ? "pass" : "FAIL"}` : ""}`);
}
if (problems.length) {
  console.log(`\n  ${problems.join("\n  ").split("\n").slice(0, 80).join("\n  ")}`);
  console.log(`\nLogs: ${WORK}/<app>/real-stack.log`);
  process.exit(1);
}
