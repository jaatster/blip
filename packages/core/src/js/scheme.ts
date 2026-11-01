/**
 * Schemes. Day, Sunset and Night are set with data-pp-scheme; Auto follows the clock as the TV does (Day 6:00 to
 * 17:00, Sunset 17:00 to 19:00, Night otherwise).
 *
 *   const stop = autoScheme();          // on <html>
 *   setScheme("night", someSection);    // just one section
 *
 * When the time of day changes, every colour changes in one step, because no mix of a light and a dark palette keeps
 * all text readable. The step is shown as an ordered dither (a view transition): the new colours take a quarter of the
 * pixels, then half, then three quarters, a frame each, so every pixel is one whole palette or the other, never a
 * mix, and the page stays live. Without view transitions it is instant, as with reduced motion or in a hidden tab.
 */
import { duration } from "./motion.js";
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

/** Runs a change of scheme behind a view transition: the new picture comes in through an ordered dither (base.css). */
function dither(change: () => void): void {
  const root = document.documentElement, done = () => root.removeAttribute("data-pp-scheme-dither");
  root.setAttribute("data-pp-scheme-dither", "");
  const vt = document.startViewTransition(change);
  // A quarter of the pixels, then half (a checkerboard), then three quarters, a frame each; then the new picture whole.
  vt.ready.then(() => root.animate(["conic-gradient(#000 25%,#0000 0)", "repeating-conic-gradient(#000 0 25%,#0000 0 50%)", "conic-gradient(#000 75%,#0000 0)", "none"].map((maskImage) => ({ maskImage })), { duration: 3 * duration("frame", 40), easing: "steps(3)", pseudoElement: "::view-transition-new(root)" }), done);
  vt.finished.then(done, done);
}

/**
 * Follows the clock until stopped. The first scheme is set at once; a later change dithers in (see above), or comes
 * at once with fade: false.
 */
export function autoScheme(target: HTMLElement = document.documentElement, options: { fade?: boolean } = {}): () => void {
  const controller = new AbortController();
  const apply = (first?: boolean) => {
    const next = schemeAt(services.now()), was = target.dataset.ppScheme;
    if (was === next) return;
    const change = () => {
      setScheme(next, target);
      target.dispatchEvent(new CustomEvent("pp-scheme-change", { detail: { scheme: next }, bubbles: true }));
    };
    if (first || !was || options.fade === false) return change();
    // Marks a change of time of day: the world backdrop steps its sky to the new one over a minute.
    target.setAttribute("data-pp-scheme-fade", "");
    // Without view transitions, or while another one runs (a page's own), at once.
    if (!!document.startViewTransition && !document.activeViewTransition) dither(change);
    else change();
  };
  apply(true);
  target.dataset.ppSchemeAuto = "";
  every(60_000, apply, controller.signal);
  return () => {
    controller.abort();
    delete target.dataset.ppSchemeAuto;
    target.removeAttribute("data-pp-scheme-fade");
  };
}
