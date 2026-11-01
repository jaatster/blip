/**
 * Lane 8, motion filmed. Every example with motion on, at 100% and 200%, with Playwright's clock in charge of the
 * page's timers and frames: each CSS animation, transition and animate() is caught as it starts, paused, and stepped
 * through a 60 Hz frame at a time; what script moves (a typewriter, the world, a counter, a toast) is read on every
 * fake frame. Motion comes from loading, from every control forced to hover, active and focus, and from the pointer
 * on one of each kind of control (and every opener: dialogs, drawers, popovers, menus, toasts, tooltips, tabs,
 * disclosures, bursts): hover, press, click, then Escape. Then twelve seconds pass.
 *
 * Every frame: moves land on whole device pixels; scale and rotation are whole (no fractions); no opacity between 0
 * and 1; no blur. Every move goes in at most six steps (the Snap Rule), except a screen transition's frames and the
 * world, which DESIGN.md lets go a whole pixel at a time. Every animation stops within five seconds (six beats), and
 * nothing runs for ever but a loader, a busy control, an indeterminate bar or a skeleton, and ambient motion on a page
 * that shows the motion toggle: pressing it must stop all of that within a frame, and pressing it again bring it
 * back. With reduced motion, nothing animates and nothing moves: every effect arrives at once.
 */
import { expect, test, type Page } from "@playwright/test";
import { examples, id } from "../page/manifest.js";
import { expectNone, triage } from "./lib/known.js";
import { NEVER_STOPS, TOGGLE, act, film, installRecorder, sampleStart, sampleStill, sampleStop, type Filmed } from "./lib/motion.js";
import { fitViewport, open } from "./lib/open.js";

const CONDITIONS = [
  { name: "dpr 1", dpr: 1, reduced: false },
  { name: "dpr 2", dpr: 2, reduced: false },
  { name: "reduced motion", dpr: 1, reduced: true },
] as const;

for (const condition of CONDITIONS) {
  test.describe(condition.name, () => {
    test.use({ deviceScaleFactor: condition.dpr, reducedMotion: condition.reduced ? "reduce" : "no-preference" });
    for (const example of examples) {
      test(`${id(example)} ${condition.name}`, async ({ page }, info) => {
        const { dpr, reduced, name } = condition;
        await installRecorder(page);
        await page.clock.install({ time: new Date("2026-06-21T12:00:00") });
        await open(page, example, { scheme: "day" });
        const { width, height } = await fitViewport(page, 1280);
        expect(await page.evaluate(() => devicePixelRatio), "the device pixel ratio").toBe(dpr);
        await pause(page);

        const failures: string[] = [];
        const names = new Set<string>();
        const moving = new Set<string>();
        /** What runs on (animations and elements that never stop, by where), and where film and judge note it now. */
        const endless = new Set<string>();
        let ranOn = endless;
        const tick = (ms: number) => page.clock.runFor(ms);
        const flush = async (label: string) => {
          const f: Filmed = await film(page, `${name} ${label}`, dpr, reduced);
          f.names.forEach((n) => names.add(n));
          f.endless.forEach((e) => ranOn.add(e));
          failures.push(...f.failures);
        };
        /** Ends a window of the script sampler and keeps what it found. */
        const judge = async (label: string, endlessCheck = false) => {
          const js = await sampleStop(page, `${name} ${label}`, dpr, reduced, endlessCheck);
          js.moving.forEach((m) => moving.add(m));
          js.endless.forEach((e) => ranOn.add(e));
          failures.push(...js.failures);
          return js;
        };

        // Loading (the recorder has read the page from its first moment).
        await tick(1000);
        await flush("load");
        await judge("load");

        // Every control in each forced state, and back.
        for (const state of ["hover", "active", "focus"]) {
          await force(page, state);
          await flush(`forced ${state}`);
          await unforce(page);
          await flush(`forced ${state}, back`);
        }

        // The pointer on one of each kind of control, and every opener: hover, press, click, then close it.
        const targets = await collect(page);
        for (const t of targets) {
          const at = await page.evaluate((i) => {
            const el = document.querySelector(`[data-lanes-t="${i}"]`);
            if (!el || !el.checkVisibility() || el.closest("[inert]") || (el as HTMLButtonElement).disabled) return null;
            const r = el.getBoundingClientRect();
            return r.width && r.height ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : null;
          }, t.i);
          if (!at) continue;
          await sampleStart(page);
          await act(page, () => page.mouse.move(at.x, at.y));
          await tick(450);
          await act(page, () => page.mouse.down());
          await tick(100);
          await act(page, () => page.mouse.up());
          await tick(1000);
          await flush(t.label);
          // Escape for dialogs, popovers and menus; a second click for a disclosure.
          await act(page, () => (t.kind === "summary" ? page.mouse.click(at.x, at.y) : page.keyboard.press("Escape")));
          await tick(500);
          await flush(`${t.label}, closing`);
          await act(page, () => page.mouse.move(width - 2, height - 2));
          await tick(200);
          await flush(`${t.label}, leaving`);
          await act(page, () => shut(page));
          await judge(t.label);
        }

        // Values that elements show with motion (a counter rolls, hearts refill): each custom element's value, changed.
        await sampleStart(page);
        let changed = 0;
        await act(page, async () => (changed = await page.evaluate(() => {
          let n = 0;
          for (const el of document.getElementById("example")!.querySelectorAll("*")) {
            const v = Number(el.getAttribute("value"));
            if (!el.tagName.includes("-") || !el.hasAttribute("value") || !Number.isFinite(v)) continue;
            el.setAttribute("value", String(el.hasAttribute("max") ? Math.max(0, v - 1) : v + 5));
            n++;
          }
          return n;
        })));
        if (changed) {
          await tick(1000);
          await flush("values changed");
        }
        await judge("values changed");

        // The pointer across the page, for what follows it (the world's parallax).
        await sampleStart(page);
        for (const fy of [0.2, 0.5]) for (const fx of [0.05, 0.3, 0.55, 0.8, 0.95]) {
          await act(page, () => page.mouse.move(width * fx, Math.min(height, 720) * fy));
          await tick(150);
        }
        await tick(300);
        await flush("pointer sweep");
        await judge("pointer sweep");

        // Twelve seconds more: what script moves must have stopped by the end (toasts leave, typing ends).
        await sampleStart(page);
        for (let s = 0; s < 12; s++) {
          await tick(1000);
          await flush(`${s + 1} s later`);
        }
        await judge("after 12 s", true);

        // Motion that runs on (the world's drifting clouds, flaring stars and passing birds) passes only on a page that
        // shows the motion toggle. Pressed, it stops all of that within a frame: from a frame after the press, twelve
        // seconds in which none of it changes by itself. Pressed again, it brings it back.
        const at = endless.size && !reduced ? await toggleAt(page) : null;
        if (at) {
          const broken: string[] = [];
          await act(page, () => page.mouse.click(at.x, at.y));
          await tick(17);
          await flush("motion toggle pressed");
          await sampleStart(page);
          for (let s = 0; s < 12; s++) {
            await tick(1000);
            await flush(`motion toggle pressed, ${s + 1} s later`);
          }
          broken.push(...(await sampleStill(page, `${name} motion toggle pressed`, [...endless])));
          const back = (ranOn = new Set<string>());
          await sampleStart(page);
          await act(page, () => page.mouse.click(at.x, at.y));
          for (let s = 0; s < 12; s++) {
            await tick(1000);
            await flush(`motion toggle pressed again, ${s + 1} s later`);
          }
          const again = await judge("motion toggle pressed again");
          const resumed = [...again.moving, ...back].filter((m) => endless.has(m));
          if (!resumed.length) broken.push(`[${name} motion toggle pressed again] nothing that ran on before (${[...endless].slice(0, 3).join(", ")}) moves again within 12 s; DESIGN.md, the Pause Rule: it carries on when the toggle is pressed again`);
          if (broken.length) failures.push(...broken);
          else {
            // Paused at a press and back at the next: what runs on passes here.
            for (let i = failures.length - 1; i >= 0; i--) if (failures[i]!.includes(NEVER_STOPS)) failures.splice(i, 1);
            info.annotations.push({ type: "motion toggle", description: `What ran on (${[...endless].slice(0, 4).join(", ")}) stopped within a frame of pressing ${TOGGLE}, stayed still for 12 s, and moved again when it was pressed again (${[...new Set(resumed)].slice(0, 4).join(", ")}).` });
          }
        }

        info.annotations.push({
          type: "filmed",
          description: `${names.size} kinds of animation (${[...names].slice(0, 12).join(", ")}${names.size > 12 ? ", …" : ""}); ${moving.size} elements moved by script${moving.size ? ` (${[...moving].slice(0, 6).join(", ")})` : ""}; ${targets.length} controls under the pointer`,
        });
        const unknown = triage(info, "motion", id(example), [...new Set(failures)], [name]);
        expectNone(unknown, `${id(example)} ${name}: motion that breaks the rules`);
      });
    }
  });
}

/** One of each kind of interactive element, and every opener (dialogs, popovers, menus, toasts, tooltips, tabs,
    disclosures, bursts, anything with an onclick). Marks each with data-lanes-t. Not the motion toggle: pressing it
    would pause what the rest of the test watches; the toggle check presses it at the end. */
async function collect(page: Page): Promise<{ i: number; label: string; kind: string }[]> {
  return page.evaluate((toggle) => {
    const root = document.getElementById("example")!;
    const out: { i: number; label: string; kind: string }[] = [];
    const kinds = new Set<string>();
    const name = (e: Element) => `${e.tagName.toLowerCase()}${[...e.classList].filter((c) => c.startsWith("chu-") && c !== "chu-box").slice(0, 1).map((c) => `.${c}`).join("")}`;
    const text = (e: Element) => (e.getAttribute("aria-label") ?? e.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 24);
    const add = (el: Element, kind: string) => {
      if (out.length >= 40 || el.hasAttribute("data-lanes-t") || !el.checkVisibility() || el.matches(`:disabled, [aria-disabled='true'], ${toggle}`)) return;
      el.setAttribute("data-lanes-t", String(out.length));
      out.push({ i: out.length, label: `${kind === "control" ? "" : `${kind} `}${name(el)} "${text(el)}"`, kind });
    };
    // Openers and other things that act: every one.
    for (const el of root.querySelectorAll("[command], [popovertarget], chu-menu > button, chu-menu > [aria-haspopup], [onclick], [data-chu-burst]")) add(el, "opener");
    for (const tip of root.querySelectorAll("chu-tooltip[for]")) {
      const trigger = document.getElementById(tip.getAttribute("for")!);
      if (trigger) add(trigger, "tooltip");
    }
    // A disclosure and an unselected tab of each group.
    const groups = new Set<Element>();
    for (const el of root.querySelectorAll("summary")) {
      const g = el.closest("[class*='chu-']") ?? el.parentElement!;
      if (groups.has(g)) continue;
      groups.add(g);
      add(el, "summary");
    }
    for (const list of root.querySelectorAll("[role='tablist']")) {
      const tab = list.querySelector("[role='tab']:not([aria-selected='true'])");
      if (tab) add(tab, "tab");
    }
    // One of each other kind of control.
    for (const el of root.querySelectorAll("button, a[href], [role='button'], [role='menuitem'], [role='option'], [role='switch'], input[type='checkbox'], input[type='radio'], input[type='range'], label.chu-box, [data-chu-interactive]")) {
      const kind = `${name(el)}|${el.getAttribute("role") ?? ""}|${(el as HTMLInputElement).type ?? ""}`;
      if (kinds.has(kind) || el.matches(toggle)) continue;
      kinds.add(kind);
      add(el, "control");
    }
    return out;
  }, TOGGLE);
}

/** The middle of the motion toggle's button, if the page shows one that can be pressed. */
async function toggleAt(page: Page): Promise<{ x: number; y: number } | null> {
  return page.evaluate((toggle) => {
    const b = [...document.querySelectorAll<HTMLButtonElement>(toggle)].find((b) => b.checkVisibility() && !b.disabled && !b.closest("[inert]"));
    const r = b?.getBoundingClientRect();
    return r && r.width && r.height ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : null;
  }, TOGGLE);
}

async function force(page: Page, state: string): Promise<void> {
  await page.evaluate((state) => {
    const selector = ".chu-box:is(button, a[href], summary, label, [role='button'], [role='tab'], [role='menuitem'], [role='option'], [data-chu-interactive]), a[href], button, summary, [role='tab'], [role='menuitem'], [role='option'], .chu-box:has(> :is(input, select, textarea))";
    for (const el of document.getElementById("example")!.querySelectorAll<HTMLElement>(selector)) {
      if (el.matches(":disabled, [aria-disabled='true']")) continue;
      el.dataset.lanesWas = el.getAttribute("data-chu-state") ?? "\u0000";
      el.setAttribute("data-chu-state", `${el.getAttribute("data-chu-state") ?? ""} ${state}`.trim());
    }
  }, state);
}

async function unforce(page: Page): Promise<void> {
  await page.evaluate(() => {
    for (const el of document.querySelectorAll<HTMLElement>("[data-lanes-was]")) {
      if (el.dataset.lanesWas === "\u0000") el.removeAttribute("data-chu-state");
      else el.setAttribute("data-chu-state", el.dataset.lanesWas!);
      delete el.dataset.lanesWas;
    }
  });
}

/** Stops the page's clock (it has run at real speed while the page loaded). The time to stop at must still be ahead
    when the call lands, which a busy machine can miss: read it again and retry. */
async function pause(page: Page): Promise<void> {
  for (let tries = 0; ; tries++) {
    try {
      await page.clock.pauseAt(new Date((await page.evaluate(() => Date.now())) + 50 * 2 ** tries));
      return;
    } catch (e) {
      if (tries >= 6 || !String(e).includes("to the past")) throw e;
    }
  }
}

/** Anything still open after Escape (a dialog that ignores it, a popover that stays): closed, so the next control can
    be reached. */
async function shut(page: Page): Promise<void> {
  await page.evaluate(() => {
    for (const d of document.querySelectorAll<HTMLDialogElement>("dialog[open]:not([data-chu-static])")) d.close();
    for (const p of document.querySelectorAll<HTMLElement>(":popover-open:not([data-chu-static])")) p.hidePopover();
  });
}
