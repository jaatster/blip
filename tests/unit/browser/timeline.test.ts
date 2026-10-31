/**
 * Timelines (`run`, `frames`, `every`): motion as data. Steps run on time and in order, stop cleanly when their signal
 * aborts, and with reduced motion all run at once so the end state is the same.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { commands } from "vitest/browser";
import { every, frames, reducedMotion, run, type Step } from "@jaatster/blip-core";

/** A timeline that writes each step's name into log when it runs. */
const timeline = (log: string[], ...steps: [at: number, name: string][]): Step[] => steps.map(([at, name]) => ({ at, do: () => log.push(name) }));
/** Whether a promise has settled, without waiting for it. */
const settled = async (p: Promise<unknown>) => {
  let done = false;
  void p.then(() => (done = true));
  await Promise.resolve();
  await Promise.resolve();
  return done;
};

describe("run, with motion", () => {
  beforeEach(() => void vi.useFakeTimers());
  afterEach(() => void vi.useRealTimers());

  it("runs each step at its time, in time order whatever the order given", async () => {
    const log: string[] = [];
    const done = run(timeline(log, [30, "c"], [0, "a"], [10, "b"]));
    expect(log).toEqual([]);
    vi.advanceTimersByTime(0);
    expect(log).toEqual(["a"]);
    vi.advanceTimersByTime(9);
    expect(log).toEqual(["a"]);
    vi.advanceTimersByTime(1);
    expect(log).toEqual(["a", "b"]);
    expect(await settled(done)).toBe(false);
    vi.advanceTimersByTime(20);
    expect(log).toEqual(["a", "b", "c"]);
    expect(await settled(done)).toBe(true);
  });

  it("keeps the given order for steps at the same time", () => {
    const log: string[] = [];
    void run(timeline(log, [20, "x"], [20, "y"], [20, "z"]));
    vi.advanceTimersByTime(20);
    expect(log).toEqual(["x", "y", "z"]);
  });

  it("stops when its signal aborts: later steps never run, and it settles", async () => {
    const log: string[] = [];
    const stop = new AbortController();
    const done = run(timeline(log, [0, "a"], [50, "b"], [100, "c"]), { signal: stop.signal });
    vi.advanceTimersByTime(60);
    expect(log).toEqual(["a", "b"]);
    stop.abort();
    expect(await settled(done)).toBe(true);
    vi.advanceTimersByTime(500);
    expect(log).toEqual(["a", "b"]);
  });

  it("does nothing with a signal that has already aborted", async () => {
    const log: string[] = [];
    const done = run(timeline(log, [0, "a"], [10, "b"]), { signal: AbortSignal.abort() });
    expect(await settled(done)).toBe(true);
    vi.advanceTimersByTime(100);
    expect(log).toEqual([]);
  });

  it("settles at once for an empty timeline", async () => {
    expect(await settled(run([]))).toBe(true);
  });

  it("runs every step at once, in order, with instant", async () => {
    const log: string[] = [];
    const done = run(timeline(log, [300, "c"], [0, "a"], [100, "b"]), { instant: true });
    expect(log).toEqual(["a", "b", "c"]);
    expect(await settled(done)).toBe(true);
  });
});

describe("run, with reduced motion", () => {
  afterEach(async () => {
    await commands.emulateMedia("no-preference");
  });

  it("runs every step at once and in order, so the end state is the same", async () => {
    await commands.emulateMedia("reduce");
    await expect.poll(reducedMotion).toBe(true);
    const log: string[] = [];
    const done = run(timeline(log, [400, "land"], [0, "jump"], [200, "peak"]));
    expect(log).toEqual(["jump", "peak", "land"]);
    expect(await settled(done)).toBe(true);
  });

  it("still animates when the timeline asks for it (instant: false)", async () => {
    await commands.emulateMedia("reduce");
    await expect.poll(reducedMotion).toBe(true);
    vi.useFakeTimers();
    try {
      const log: string[] = [];
      void run(timeline(log, [0, "a"], [100, "b"]), { instant: false });
      vi.advanceTimersByTime(0);
      expect(log).toEqual(["a"]);
      vi.advanceTimersByTime(100);
      expect(log).toEqual(["a", "b"]);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("frames", () => {
  beforeEach(() => void vi.useFakeTimers());
  afterEach(() => void vi.useRealTimers());

  it("calls each frame n times, every ms apart, with its index", async () => {
    const seen: [number, number][] = [];
    const t0 = Date.now();
    const done = frames(4, 40, (i) => seen.push([i, Date.now() - t0]));
    vi.advanceTimersByTime(200);
    expect(seen).toEqual([[0, 0], [1, 40], [2, 80], [3, 120]]);
    expect(await settled(done)).toBe(true);
  });

  it("stops with its signal", () => {
    const seen: number[] = [];
    const stop = new AbortController();
    void frames(6, 40, (i) => seen.push(i), { signal: stop.signal });
    vi.advanceTimersByTime(85);
    stop.abort();
    vi.advanceTimersByTime(400);
    expect(seen).toEqual([0, 1, 2]);
  });
});

describe("every", () => {
  beforeEach(() => void vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    delete (document as { hidden?: boolean }).hidden;
  });

  it("repeats until its signal aborts", () => {
    const tick = vi.fn();
    const stop = new AbortController();
    every(100, tick, stop.signal);
    vi.advanceTimersByTime(350);
    expect(tick).toHaveBeenCalledTimes(3);
    stop.abort();
    vi.advanceTimersByTime(1000);
    expect(tick).toHaveBeenCalledTimes(3);
  });

  it("skips its calls while the page is hidden", () => {
    const tick = vi.fn();
    const stop = new AbortController();
    every(100, tick, stop.signal);
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    vi.advanceTimersByTime(300);
    expect(tick).not.toHaveBeenCalled();
    delete (document as { hidden?: boolean }).hidden;
    vi.advanceTimersByTime(100);
    expect(tick).toHaveBeenCalledTimes(1);
    stop.abort();
  });
});
