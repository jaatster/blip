/**
 * Schemes. Day, Sunset and Night are set with data-pp-scheme; Auto follows the clock as the TV does (Day 6:00 to
 * 17:00, Sunset 17:00 to 19:00, Night otherwise) and steps the palette from one to the next over a minute.
 *
 *   const stop = autoScheme();          // on <html>
 *   setScheme("night", someSection);    // just one section
 */
import { services } from "./services.js";
import { every } from "./timeline.js";

export type Scheme = "day" | "sunset" | "night";

export function schemeAt(date: Date): Scheme {
  const h = date.getHours();
  return h >= 6 && h < 17 ? "day" : h >= 17 && h < 19 ? "sunset" : "night";
}

export function setScheme(scheme: Scheme, target: HTMLElement = document.documentElement): void {
  target.dataset.ppScheme = scheme;
}

/** Follows the clock until stopped. The first scheme is set at once; later changes fade in steps. */
export function autoScheme(target: HTMLElement = document.documentElement, options: { fade?: boolean } = {}): () => void {
  const controller = new AbortController();
  const apply = () => {
    const next = schemeAt(services.now());
    if (target.dataset.ppScheme === next) return;
    if (options.fade !== false && target.dataset.ppScheme) target.setAttribute("data-pp-scheme-fade", "");
    setScheme(next, target);
    target.dispatchEvent(new CustomEvent("pp-scheme-change", { detail: { scheme: next }, bubbles: true }));
  };
  apply();
  target.dataset.ppSchemeAuto = "";
  every(60_000, apply, controller.signal);
  return () => {
    controller.abort();
    delete target.dataset.ppSchemeAuto;
    target.removeAttribute("data-pp-scheme-fade");
  };
}
