/**
 * Timelines: motion as data. A timeline is a list of steps at times in ms; running it calls each step on time and
 * stops cleanly when its signal aborts (the element went away, the person acted). With reduced motion the steps
 * run at once, in order, so the end state is the same.
 *
 *   await run([{ at: 0, do: () => jump(16) }, { at: 30, do: () => jump(32) }], { signal });
 */
import { reducedMotion } from "./motion.js";

export interface Step {
  /** When, in ms from the start. */
  at: number;
  do: () => void;
}

export function run(timeline: readonly Step[], options: { signal?: AbortSignal; instant?: boolean } = {}): Promise<void> {
  const { signal } = options;
  const sorted = [...timeline].sort((a, b) => a.at - b.at);
  if (signal?.aborted) return Promise.resolve();
  if (options.instant ?? reducedMotion()) {
    for (const s of sorted) s.do();
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const stop = () => {
      timers.forEach(clearTimeout);
      resolve();
    };
    signal?.addEventListener("abort", stop, { once: true });
    sorted.forEach((s, i) =>
      timers.push(
        setTimeout(() => {
          s.do();
          if (i === sorted.length - 1) {
            signal?.removeEventListener("abort", stop);
            resolve();
          }
        }, s.at),
      ),
    );
    if (!sorted.length) resolve();
  });
}

/** n frames, every ms apart: frames(4, 40, (i) => ...) */
export function frames(n: number, every: number, each: (i: number) => void, options: { signal?: AbortSignal } = {}): Promise<void> {
  return run(Array.from({ length: n }, (_, i) => ({ at: i * every, do: () => each(i) })), options);
}

/** Calls fn every ms until the signal aborts. Skips while the page is hidden. */
export function every(ms: number, fn: () => void, signal?: AbortSignal): void {
  const id = setInterval(() => {
    if (typeof document === "undefined" || !document.hidden) fn();
  }, ms);
  signal?.addEventListener("abort", () => clearInterval(id), { once: true });
}
