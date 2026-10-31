/**
 * Lets the "Reduced motion" toolbar switch reach Blip's script: @jaatster/blip-core asks
 * matchMedia("(prefers-reduced-motion: reduce)") once and reads `.matches` whenever it needs to know, so this wraps
 * that one query to answer true while the switch is on. It must load before @jaatster/blip-core (preview.ts imports it
 * first) and imports nothing from Blip itself.
 */
const QUERY = /prefers-reduced-motion\s*:\s*reduce/;
const FLAG = "data-pp-reduce-motion";
let forced = false;

if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
  const native = window.matchMedia.bind(window);
  window.matchMedia = (query: string): MediaQueryList => {
    const list = native(query);
    if (!QUERY.test(query)) return list;
    return new Proxy(list, {
      get(target, key) {
        if (key === "matches") return forced || target.matches;
        const value = Reflect.get(target, key, target);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
  };
}

/** Turns the switch on or off: CSS (see reduced-motion.ts) and script follow it. */
export function setReducedMotion(on: boolean): void {
  forced = on;
  const root = document.documentElement;
  root.toggleAttribute(FLAG, on);
  if (on) root.style.setProperty("--pp-motion", "reduce");
  else root.style.removeProperty("--pp-motion");
}
