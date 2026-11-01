/**
 * Motion helpers. Blip's motion snaps through whole steps and stops when the person asks for less: on their
 * device (prefers-reduced-motion), or on the page (data-chu-motion="reduce" on <html>, which <chu-motion-toggle> sets).
 */

const query = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : undefined;

/** True when the person has asked for less motion, on their device or on the page. Effects must check this and skip
    or freeze, and what moves on its own must stop at once when it turns true (watch <html>'s data-chu-motion). */
export const reducedMotion = (): boolean => !!query?.matches || globalThis.document?.documentElement.dataset.chuMotion == "reduce";

/** CSS steps() easing for n even steps. */
export const steps = (n: number): string => `steps(${Math.max(1, Math.round(n))}, jump-end)`;

/** Reads a duration token in ms from CSS (0 when reduced motion is on), with a fallback. */
export function duration(name: string, fallback: number, el: Element = document.documentElement): number {
  const raw = getComputedStyle(el).getPropertyValue(`--chu-duration-${name}`).trim();
  const ms = raw.endsWith("ms") ? parseFloat(raw) : raw.endsWith("s") ? parseFloat(raw) * 1000 : NaN;
  return Number.isFinite(ms) ? ms : reducedMotion() ? 0 : fallback;
}

/** The Blip pixel in CSS px at an element. */
export function pixel(el: Element = document.documentElement): number {
  return parseFloat(getComputedStyle(el).getPropertyValue("--chu-pixel")) || 2;
}
