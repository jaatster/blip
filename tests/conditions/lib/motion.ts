/**
 * Motion, filmed: what runs in the page for the motion lane.
 *
 * - A recorder, registered before Playwright's clock, keeps the native requestAnimationFrame and looks at
 *   document.getAnimations() every real frame: each animation it has not seen (CSS animations and transitions,
 *   pseudo-elements and view transitions included, and element.animate()) is noted and paused at once, so even an
 *   80 ms pop-in waits to be filmed.
 * - film() steps each noted animation through its active duration (one iteration of an endless one) a 60 Hz frame at
 *   a time and reads its target's computed motion: translate, transform, scale, rotate, opacity, filters, offsets,
 *   background and mask positions, and an element's box. Then it lets the animation finish (or play on), so whatever
 *   waits for its end goes on.
 * - A sampler reads every element the DOM changes, after each change and at the page's (fake) time, for motion driven
 *   by script (a typewriter, the world's clouds and stars, a counter rolling, a toast leaving). It has no frame loop
 *   of its own: a requestAnimationFrame loop would make the fake clock yield a real tick every frame. Started a frame
 *   after the motion toggle is pressed, it judges the stillness that must follow (sampleStill).
 *
 * All return failures as lines, worded for the report: what moved, the rule it broke and the DESIGN.md rule.
 */
import type { Page } from "@playwright/test";

/** Loading indicators, which run until the work is done: DESIGN.md's loader ("a ring of eight pixel dots whose lit arc
    steps one dot a frame") and busy dots ("steps in three dots, one, two, three"), an indeterminate bar (progress.css:
    "two lit blocks in every six march along a block a step"), a skeleton (skeleton.css: the sweep comes "every four
    beats") and a table's loading row (table.css: "the box's busy rhythm"). Nothing else may run for ever. */
export const ENDLESS = ".chu-loader, progress:indeterminate, .chu-skeleton, [aria-busy='true'], .chu-table-loading";
/** Motion that DESIGN.md lets take more than six steps, a whole pixel at a time: screen changes ("an ink dissolve
    (nine frames of 30 ms to cover the screen, nine to clear it), an ordered dither, or a mosaic") and the world
    ("Clouds can drift right a whole pixel at a time ... now and then birds cross or a star shoots"). */
export const ANY_STEPS = "chu-world, .chu-world";
/** Script motion made of many moves, each judged on its own: an attract demo (docs/attract.md) plays its script again
    and again, its pointer hopping from control to control ("in at most six even steps") and pressing them. A move is
    a run of changes with no rest longer than two frames (80 ms) between them; each goes in at most six steps (the
    Snap Rule). */
export const MOVES = "chu-attract";
/** Clocks, which keep stepping with reduced motion because they tell the time (docs/toast.md: "With reduced motion
    they appear and go at once; the timer still steps (it is a clock, not motion)"). */
export const CLOCKS = ".chu-toast-timer";
/** The motion toggle's button (docs/motion-toggle.md): motion that runs on (the world's drifting clouds, flaring stars
    and passing birds) is allowed only on a page that shows it, and pressing it must stop all of that within a frame
    (DESIGN.md, the Pause Rule: "everything that moves on its own stops within a frame, where it is"). */
export const TOGGLE = "chu-motion-toggle button";
/** What every line about motion that never stops says, so the toggle check can find them. */
export const NEVER_STOPS = ": never stops";

export interface Filmed {
  /** Animations filmed, by name and where. */
  names: string[];
  failures: string[];
  /** Animations that never stop (not loaders), by where and name. */
  endless: string[];
}

export interface Sampled {
  /** Elements that script moved or changed over time. */
  moving: string[];
  failures: string[];
  /** Elements that script still moved at the end (with `endless`). */
  endless: string[];
}

/** Registers the recorder and the sampler. Call before page.clock.install() and before the page loads. */
export async function installRecorder(page: Page): Promise<void> {
  await page.addInitScript(recorder, { endless: ENDLESS, anySteps: ANY_STEPS, clocks: CLOCKS, moves: MOVES });
}

export const film = (page: Page, label: string, dpr: number, reduced: boolean): Promise<Filmed> =>
  page.evaluate(([label, dpr, reduced]) => (window as unknown as Lanes).__lanes.film(label, dpr, reduced), [label, dpr, reduced] as const);

/** Does something as the person (pointer, keys, a value): the changes it causes at once are theirs, not motion. */
export async function act(page: Page, action: () => Promise<unknown>): Promise<void> {
  await page.evaluate(() => (window as unknown as Lanes).__lanes.acting++);
  try {
    await action();
  } finally {
    await page.evaluate(() => (window as unknown as Lanes).__lanes.acting--);
  }
}

export const sampleStart = (page: Page): Promise<void> => page.evaluate(() => (window as unknown as Lanes).__lanes.sampleStart());

export const sampleStop = (page: Page, label: string, dpr: number, reduced: boolean, endless: boolean): Promise<Sampled> =>
  page.evaluate(([label, dpr, reduced, endless]) => (window as unknown as Lanes).__lanes.sampleStop(label, dpr, reduced, endless), [label, dpr, reduced, endless] as const);

/** Ends a window of the sampler opened a frame after the motion toggle was pressed: what ran on before (`endless`, as
    film and sampleStop described it) must not change at all, nothing else may move, and no animation may run on. */
export const sampleStill = (page: Page, label: string, endless: string[]): Promise<string[]> =>
  page.evaluate(([label, endless]) => (window as unknown as Lanes).__lanes.sampleStill(label, endless), [label, endless] as const);

interface Lanes {
  __lanes: {
    acting: number;
    film(label: string, dpr: number, reduced: boolean): Filmed;
    sampleStart(): void;
    sampleStop(label: string, dpr: number, reduced: boolean, endless: boolean): Sampled;
    sampleStill(label: string, endless: string[]): string[];
  };
}

/* The page side. Self-contained: it is serialised into the page. */
export function recorder({ endless, anySteps, clocks, moves: many }: { endless: string; anySteps: string; clocks: string; moves: string }): void {
  if (window.top !== window) return;
  const nativeFrame = window.requestAnimationFrame.bind(window);
  const found: Animation[] = [];
  const seen = new WeakSet<Animation>();
  const filmed = new WeakSet<Animation>();
  const discover = () => {
    try {
      for (const a of document.getAnimations()) {
        if (seen.has(a)) continue;
        seen.add(a);
        found.push(a);
        try { a.pause(); } catch { /* an animation that cannot pause is filmed as it is */ }
      }
    } catch { /* the document is going away */ }
  };
  const poll = () => {
    discover();
    nativeFrame(poll);
  };
  nativeFrame(poll);

  // Clicking a link or submitting a form must not leave the example.
  addEventListener("click", (e) => { if ((e.target as Element | null)?.closest?.("a[href]")) e.preventDefault(); }, true);
  addEventListener("submit", (e) => { if ((e.target as HTMLFormElement).method !== "dialog") e.preventDefault(); }, true);

  const nearly = (v: number, by = 0.02) => Math.abs(v - Math.round(v)) <= by;
  const px = (s: string) => [...s.matchAll(/(-?[\d.]+(?:e-?\d+)?)px/g)].map((m) => parseFloat(m[1]!));
  const describe = (el: Element, pseudo: string | null) => {
    const own = (e: Element) => `${e.tagName.toLowerCase()}${[...e.classList].filter((c) => c.startsWith("chu-") && c !== "chu-box").slice(0, 2).map((c) => `.${c}`).join("")}`;
    const parts = [own(el)];
    for (let a = el.parentElement; a && a.id !== "example" && parts.length < 3; a = a.parentElement) {
      if ([...a.classList].some((c) => c.startsWith("chu-") && c !== "chu-box") || a.tagName.includes("-")) parts.unshift(own(a));
    }
    return parts.join(" > ") + (pseudo ?? "");
  };

  // translate keeps its percentages (and round()) when computed: a hidden probe of the same size, translated the same
  // way, says where it lands.
  let probe: HTMLElement | undefined;
  const resolve = (tr: string, w: number, h: number): number[] => {
    if (tr === "none") return [0, 0];
    const plain = tr.trim().split(/\s+/);
    if (plain.every((v) => /^-?[\d.]+(e-?\d+)?px$/.test(v))) return [parseFloat(plain[0]!), parseFloat(plain[1] ?? "0")];
    if (!probe) {
      probe = document.createElement("div");
      probe.style.cssText = "position: fixed; left: 0; top: 0; margin: 0; padding: 0; border: 0; box-sizing: border-box; visibility: hidden; pointer-events: none; contain: strict;";
      document.documentElement.append(probe);
    }
    Object.assign(probe.style, { width: `${w}px`, height: `${h}px`, translate: tr });
    const r = probe.getBoundingClientRect();
    return [r.x, r.y];
  };

  interface Look { tx: number[]; tr: string; tf: string; sc: string; ro: string; op: string; fl: string; bf: string; off: number[]; bg: string; mk: string; cp: string; box: number[] | null; w: number; h: number; vis: string }
  const look = (el: Element, pseudo: string | null): Look => {
    const cs = getComputedStyle(el, pseudo);
    const r = pseudo ? null : el.getBoundingClientRect();
    const w = r ? r.width : parseFloat(cs.width) || 0, h = r ? r.height : parseFloat(cs.height) || 0;
    // translate's percentages are of the box itself (its size without the transform: offsetWidth for an element).
    const tx = resolve(cs.translate, pseudo ? w : (el as HTMLElement).offsetWidth ?? w, pseudo ? h : (el as HTMLElement).offsetHeight ?? h);
    return {
      tx, tr: cs.translate, tf: cs.transform, sc: cs.scale, ro: cs.rotate, op: cs.opacity, fl: cs.filter, bf: cs.backdropFilter,
      // left and top: right and bottom resolve from the size, so a bar that shrinks would seem to move.
      off: ["left", "top"].map((p) => parseFloat(cs.getPropertyValue(p))).map((v) => (Number.isFinite(v) ? v : 0)),
      bg: cs.backgroundPosition, mk: cs.maskPosition, cp: cs.clipPath, box: r ? [r.x, r.y, r.width, r.height] : null, w, h,
      vis: `${cs.display}|${cs.visibility}`,
    };
  };
  /** What breaks the rules in one frame, against the first frame: [the rule, how it is broken here]. */
  const wrong = (l: Look, first: Look, dpr: number): [string, string][] => {
    const out: [string, string][] = [];
    if (l.vis.startsWith("none") || l.vis.endsWith("hidden")) return out;
    const op = parseFloat(l.op);
    if (op > 0.001 && op < 0.999) out.push(["see-through (opacity between 0 and 1; DESIGN.md: see-through is a dither, never a wash)", `opacity ${l.op}`]);
    for (const [name, f] of [["filter", l.fl], ["backdrop-filter", l.bf]] as const) {
      const blur = f.match(/blur\(([\d.]+)px\)/);
      if (blur && parseFloat(blur[1]!) > 0) out.push([`blurred (DESIGN.md: nothing blurs)`, `${name}: ${f}`]);
    }
    const off = (vs: number[]) => vs.map((v) => +(v * dpr).toFixed(2)).join(", ");
    if (l.tx.some((v) => !nearly(v * dpr))) out.push(["off the pixel grid (moves land on whole device pixels)", `translate ${l.tr} = ${off(l.tx)} device px`]);
    const m = l.tf.match(/^matrix(3d)?\(([^)]+)\)$/);
    if (m) {
      const v = m[2]!.split(",").map(Number);
      const [a, b, c, d, e, f] = m[1] ? [v[0]!, v[1]!, v[4]!, v[5]!, v[12]!, v[13]!] : v;
      if (![a, b, c, d].every((k) => nearly(k!, 0.001))) out.push(["scaled or rotated by a fraction (DESIGN.md: never rotate, scale or move anything by a fraction of a pixel)", `transform ${l.tf}`]);
      if (![e, f].every((k) => nearly(k! * dpr))) out.push(["off the pixel grid (moves land on whole device pixels)", `transform ${l.tf} moves ${off([e!, f!])} device px`]);
    }
    if (l.sc !== "none" && !l.sc.split(" ").every((k) => nearly(parseFloat(k), 0.001))) out.push(["scaled or rotated by a fraction (DESIGN.md: never rotate, scale or move anything by a fraction of a pixel)", `scale ${l.sc}`]);
    if (l.ro !== "none" && !nearly(parseFloat(l.ro.split(" ").at(-1)!) / 90, 0.001)) out.push(["scaled or rotated by a fraction (DESIGN.md: never rotate, scale or move anything by a fraction of a pixel)", `rotate ${l.ro}`]);
    if (l.off.some((v, i) => !nearly((v - first.off[i]!) * dpr))) out.push(["off the pixel grid (moves land on whole device pixels)", `left and top ${l.off.join(", ")}, moved ${off(l.off.map((v, i) => v - first.off[i]!))} device px`]);
    if (l.box && first.box && [0, 1].some((i) => !nearly((l.box![i]! - first.box![i]!) * dpr))) out.push(["off the pixel grid (moves land on whole device pixels)", `its box moved ${off([0, 1].map((i) => l.box![i]! - first.box![i]!))} device px`]);
    for (const [name, s] of [["background-position", l.bg], ["mask-position", l.mk], ["clip-path", l.cp]] as const) if (px(s).some((v) => !nearly(v * dpr))) out.push(["off the pixel grid (moves land on whole device pixels)", `${name} ${s}`]);
    return out;
  };
  /** A box that changes size in an animation grows or shrinks by whole device pixels too (a growing edge is an edge). */
  const resized = (l: Look, first: Look, dpr: number): [string, string][] =>
    l.box && first.box && [2, 3].some((i) => !nearly((l.box![i]! - first.box![i]!) * dpr)) && !(l.vis.startsWith("none") || l.vis.endsWith("hidden"))
      ? [["off the pixel grid (moves land on whole device pixels)", `its box changed size by ${[2, 3].map((i) => +((l.box![i]! - first.box![i]!) * dpr).toFixed(2)).join(", ")} device px`]]
      : [];
  /** Collects the broken rules of many frames: per rule, the first frame that breaks it and how many do. */
  const tally = () => {
    const seen = new Map<string, { first: string; n: number }>();
    return {
      add(found: [string, string][], when: string) {
        for (const [rule, how] of found) {
          const t = seen.get(rule);
          if (t) t.n++;
          else seen.set(rule, { first: `${how} ${when}`, n: 1 });
        }
      },
      lines: () => [...seen].map(([rule, { first, n }]) => `${rule}: ${first}${n > 1 ? `, and ${n - 1} more frame${n > 2 ? "s" : ""}` : ""}`),
    };
  };
  /** Whether the thing itself moved between two frames: its translate, its transform's move, its left and top, or its
      box shifting without changing size. (A bar that shrinks, or a background or mask position moving inside it, is
      checked for whole pixels, but is not the thing moving: a countdown bar steps down, it does not travel.) */
  const moved = (a: Look, b: Look) => {
    const tf = (l: Look) => (l.tf.startsWith("matrix") ? l.tf.split(",").slice(-2).join(",") : "");
    if (a.tx.join() !== b.tx.join() || tf(a) !== tf(b) || a.off.join() !== b.off.join()) return true;
    if (!a.box || !b.box) return false;
    const same = (i: number) => Math.abs(a.box![i]! - b.box![i]!) < 0.01;
    return same(2) && same(3) && !(same(0) && same(1));
  };
  const place = (l: Look) => `${l.tx.join(",")}|${l.tf}|${l.off.join(",")}|${l.box ? l.box.map((v) => v.toFixed(2)).join(",") : ""}`;

  const L = {
    /** Above 0 while the test acts (moves the pointer, presses a key, sets a value): the changes that follow are the
        person's doing, not motion. */
    acting: 0,

    /** Films every animation the recorder has noted and not yet filmed. */
    film(label: string, dpr: number, reduced: boolean) {
      const names: string[] = [];
      const failures: string[] = [];
      const endlessly: string[] = [];
      // getAnimations() brings styles up to date, so what a change has just started is there too.
      discover();
      for (const a of found) {
        if (filmed.has(a)) continue;
        filmed.add(a);
        const effect = a.effect as KeyframeEffect | null;
        const el = effect?.target;
        if (!effect || !el || !el.isConnected) continue;
        const pseudo = effect.pseudoElement ?? null;
        const cssName = (a as CSSAnimation).animationName ?? ((a as CSSTransition).transitionProperty ? `transition of ${(a as CSSTransition).transitionProperty}` : `animate()${a.id ? ` ${a.id}` : ""}`);
        const who = `${describe(el, pseudo)} ${cssName}`;
        const timing = effect.getTiming(), computed = effect.getComputedTiming();
        const easing = [timing.easing, ...new Set(effect.getKeyframes().map((k) => k.easing))].filter((e) => e && e !== "linear").join(", ") || "linear";
        names.push(`${cssName}${pseudo ?? ""}`);
        const scrolled = a.timeline && !(a.timeline instanceof DocumentTimeline);
        const duration = typeof timing.duration === "number" ? timing.duration : 0;
        const active = Number(computed.activeDuration ?? 0);
        const iterations = timing.iterations ?? 1;
        const endlessOK = !!el.closest(endless);
        const anyOK = !!el.closest(anySteps) || !!pseudo?.startsWith("::view-transition");
        const lines = new Set<string>();
        if (reduced && !scrolled) {
          if (active > 0 && !el.closest(clocks)) lines.add(`animates under reduced motion: ${Math.round(duration)} ms x ${iterations} (${easing}); DESIGN.md: with reduced motion every duration is 0 ms and every effect arrives at once`);
        } else if (!scrolled) {
          if (iterations === Infinity && duration > 0 && !endlessOK) {
            lines.add(`never stops (${Math.round(duration)} ms, iterations infinite); DESIGN.md: anything that blinks or bobs stops after six beats, under five seconds; only loaders, and ambient motion beside the motion toggle, run on`);
            endlessly.push(who);
          }
          if (iterations !== Infinity && Number(computed.endTime) > 5001) lines.add(`runs ${Math.round(Number(computed.endTime))} ms; DESIGN.md: anything that blinks or bobs stops after six beats, under five seconds`);
          // The frames: the active phase, one iteration of an endless one, a 60 Hz frame apart.
          const from = Math.max(0, timing.delay ?? 0);
          const to = iterations === Infinity ? from + duration : Math.max(from, Number(computed.endTime) - (timing.endDelay ?? 0));
          const step = Math.max(1000 / 60, (to - from) / 400);
          let first: Look | undefined, before: Look | undefined, moves = 0;
          const broken = tally();
          for (let t = from; t < to; t += step) {
            a.currentTime = t;
            const l = look(el, pseudo);
            first ??= l;
            broken.add([...wrong(l, first, dpr), ...resized(l, first, dpr)], `at ${Math.round(t)} ms`);
            if (before && moved(before, l)) moves++;
            before = l;
          }
          for (const line of broken.lines()) lines.add(`${line} (${easing})`);
          const each = moves / (iterations === Infinity ? 1 : Math.max(1, Math.ceil(iterations)));
          if (each > 6 && !anyOK) lines.add(`moves in ${Math.round(each)} steps an iteration (${easing}); DESIGN.md, the Snap Rule: movement goes through 2 to 6 even steps, never along a curve`);
        } else {
          // Scroll-driven: it moves only as its scroller scrolls. Every place along the way is still a whole pixel.
          let first: Look | undefined;
          const broken = tally();
          for (let p = 0; p <= 100; p += 2) {
            try { a.currentTime = CSS.percent(p) as unknown as number; } catch { break; }
            const l = look(el, pseudo);
            first ??= l;
            broken.add(wrong(l, first, dpr), `at ${p}% of its scroll`);
          }
          for (const line of broken.lines()) lines.add(`${line} (scroll-driven, ${easing})`);
        }
        for (const why of lines) failures.push(`[${label}] ${who}: ${why}`);
        try {
          if (iterations === Infinity || scrolled) a.play();
          else a.finish();
        } catch { /* already gone */ }
      }
      return { names, failures, endless: endlessly };
    },

    sampling: null as null | { observer: MutationObserver; take: (r: MutationRecord[]) => void; start: number; t0: number | undefined; tracks: Map<Element, { t: number; key: string; look: Look; text: string; own: boolean }[]>; seen: Map<Element, { who: string; anyOK: boolean; endlessOK: boolean; manyOK: boolean }> },

    /** Starts reading what the DOM changes: after every change (every fake timer or frame that changes something),
        at the page's own (fake) time. */
    sampleStart() {
      const take = (records: MutationRecord[]) => {
        if (L.sampling !== s) return;
        // Timed on the page's clock (Playwright's, once it is installed): from the first change seen.
        s.t0 ??= performance.now();
        const t = performance.now() - s.t0;
        const changed = new Set<Element>();
        for (const r of records) {
          if (r.type === "attributes" && /^data-lanes/.test(r.attributeName ?? "")) continue;
          const el = r.type === "characterData" ? r.target.parentElement : (r.target as Element);
          if (el?.nodeType === 1) changed.add(el);
          if (r.type === "childList") for (const n of r.addedNodes) if (n.nodeType === 1) changed.add(n as Element);
        }
        for (const el of changed) {
          if (!el.isConnected || el === probe || el.closest("head, script, style, template")) continue;
          const l = look(el, null);
          const text = el.childElementCount ? "" : (el.textContent ?? "").slice(0, 200);
          const key = `${place(l)}|${l.tr}|${l.tf}|${l.op}|${l.fl}|${l.bg}|${l.mk}|${l.vis}|${text}|${(el as HTMLElement).hidden}`;
          const track = s.tracks.get(el) ?? [];
          if (track.at(-1)?.key === key) continue;
          track.push({ t, key, look: l, text, own: L.acting === 0 });
          s.tracks.set(el, track);
          // Where it is, while it is there: a shooting star is judged after it has gone.
          if (!s.seen.has(el)) s.seen.set(el, { who: describe(el, null), anyOK: !!el.closest(anySteps), endlessOK: !!el.closest(endless), manyOK: !!el.closest(many) });
        }
      };
      const observer = new MutationObserver(take);
      const s: NonNullable<typeof L.sampling> = (L.sampling = { observer, take, start: performance.now(), t0: undefined, tracks: new Map(), seen: new Map() });
      observer.observe(document, { subtree: true, attributes: true, childList: true, characterData: true });
    },

    /** Stops the sampler and judges what changed: moves on whole pixels, no washes or blur, at most six steps a move
        (the world excepted), nothing at all with reduced motion, and (with `endless`) nothing still moving at the end. */
    sampleStop(label: string, dpr: number, reduced: boolean, endlessCheck: boolean) {
      const s = L.sampling!;
      s.take(s.observer.takeRecords());
      L.sampling = null;
      s.observer.disconnect();
      const end = performance.now() - (s.t0 ?? performance.now());
      const moving: string[] = [];
      const endlessly = new Set<string>();
      const failures = new Set<string>();
      for (const [el, track] of s.tracks) {
        // Motion: three or more changes of the page's own (not the person's: a click, a key) within a second. A single
        // change of state (a tooltip showing, a toast leaving) is not motion.
        const own = track.filter((c) => c.own);
        let busy = false;
        for (let i = 2; i < own.length; i++) if (own[i]!.t - own[i - 2]!.t <= 1000) busy = true;
        if (!busy) continue;
        const { who, anyOK, endlessOK, manyOK } = s.seen.get(el)!;
        moving.push(who);
        if (reduced) {
          failures.add(`[${label}] ${who}: changes ${own.length} times by itself (script) under reduced motion; DESIGN.md: with reduced motion every effect arrives at once`);
          continue;
        }
        const first = track[0]!.look;
        // Steps in one move: all of them, or (for what makes many moves) the most in a run with no rest over 80 ms.
        let moves = 0, run = 0, last = -Infinity;
        const broken = tally();
        for (let i = 0; i < track.length; i++) {
          broken.add(wrong(track[i]!.look, first, dpr), `at ${Math.round(track[i]!.t)} ms`);
          if (!i || !moved(track[i - 1]!.look, track[i]!.look)) continue;
          if (!manyOK || track[i]!.t - last <= 80) run++;
          else run = 1;
          last = track[i]!.t;
          moves = Math.max(moves, run);
        }
        for (const line of broken.lines()) failures.add(`[${label}] ${who} (script): ${line}`);
        if (moves > 6 && !anyOK) failures.add(`[${label}] ${who} (script): moves in ${moves} steps${manyOK ? " in one move" : ""}; DESIGN.md, the Snap Rule: movement goes through 2 to 6 even steps`);
        if (endlessCheck && !endlessOK && track.at(-1)!.t > end - 3000) {
          failures.add(`[${label}] ${who} (script): never stops: ${track.length} changes in ${Math.round(end / 1000)} s, the last ${Math.round((end - track.at(-1)!.t) / 1000 * 10) / 10} s before the end; DESIGN.md: anything that blinks or bobs stops after six beats, under five seconds; only loaders, and ambient motion beside the motion toggle, run on`);
          endlessly.add(who);
        }
      }
      return { moving, failures: [...failures], endless: [...endlessly] };
    },

    /** Stops a sampler started a frame after the motion toggle was pressed, and judges the stillness since: an element
        like one that ran on before (`endless`: the same description) must not change by itself at all, no other may
        move (three changes within a second), and no animation may still run on but a loader's or a clock's. */
    sampleStill(label: string, endlessly: string[]) {
      const s = L.sampling!;
      s.take(s.observer.takeRecords());
      L.sampling = null;
      s.observer.disconnect();
      const before = new Set(endlessly);
      const failures = new Set<string>();
      const why = "DESIGN.md, the Pause Rule: everything that moves on its own stops within a frame, where it is";
      for (const [el, track] of s.tracks) {
        const own = track.filter((c) => c.own);
        if (!own.length) continue;
        const { who, endlessOK } = s.seen.get(el)!;
        let busy = false;
        for (let i = 2; i < own.length; i++) if (own[i]!.t - own[i - 2]!.t <= 1000) busy = true;
        if (before.has(who) || (busy && !endlessOK)) failures.add(`[${label}] ${who} (script): still moves after the motion toggle was pressed: ${own.length} change${own.length > 1 ? "s" : ""}, the first ${Math.round(own[0]!.t + (s.t0 ?? s.start) - s.start)} ms into the window that starts a frame after the press; ${why}`);
      }
      for (const a of document.getAnimations()) {
        const effect = a.effect as KeyframeEffect | null;
        const el = effect?.target;
        if (!effect || !el || el.closest(endless) || el.closest(clocks) || effect.getComputedTiming().iterations !== Infinity) continue;
        if (a.playState === "running" || a.playState === "paused") failures.add(`[${label}] ${describe(el, effect.pseudoElement ?? null)} ${(a as CSSAnimation).animationName ?? "animate()"}: still animates after the motion toggle was pressed (iterations infinite); ${why}`);
      }
      return [...failures];
    },
  };
  (window as unknown as { __lanes: typeof L }).__lanes = L;
  // From the first moment: what script moves while the page loads (a dialogue typing its first page) is read too.
  L.sampleStart();
}
