/** Motion helpers. Blip's motion snaps through whole steps and stops for prefers-reduced-motion. */

const query = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : undefined;

/** True when the person has asked for less motion. Effects must check this and skip or freeze. */
export const reducedMotion = (): boolean => query?.matches ?? false;

/** CSS steps() easing for n even steps. */
export const steps = (n: number): string => `steps(${Math.max(1, Math.round(n))}, jump-end)`;

/** Reads a duration token in ms from CSS (0 when reduced motion is on), with a fallback. */
export function duration(name: string, fallback: number, el: Element = document.documentElement): number {
  const raw = getComputedStyle(el).getPropertyValue(`--pp-duration-${name}`).trim();
  const ms = raw.endsWith("ms") ? parseFloat(raw) : raw.endsWith("s") ? parseFloat(raw) * 1000 : NaN;
  return Number.isFinite(ms) ? ms : reducedMotion() ? 0 : fallback;
}

/** The Blip pixel in CSS px at an element. */
export function pixel(el: Element = document.documentElement): number {
  return parseFloat(getComputedStyle(el).getPropertyValue("--pp-pixel")) || 2;
}
