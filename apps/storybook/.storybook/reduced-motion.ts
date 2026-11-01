/**
 * The "Reduced motion" toolbar switch. A page cannot turn on prefers-reduced-motion for itself, so Storybook copies
 * every `@media (prefers-reduced-motion: reduce)` block of Blip's CSS into a container style query that the
 * switch turns on (`--blip-motion: reduce` on <html>), and wraps every `no-preference` block so the switch turns it off.
 * Rules for :root inside those blocks (the duration tokens) are copied for `:root[data-blip-reduce-motion]`, because
 * the root has no container to query. Script reads the same switch through motion.ts.
 */
import type { Plugin } from "vite";

const QUERY = /@media\s*\(\s*prefers-reduced-motion\s*:\s*(reduce|no-preference)\s*\)\s*\{/g;
const SWITCH = "--blip-motion: reduce";
export const ROOT_FLAG = "data-blip-reduce-motion";

/** The index of the brace that closes the one at `open`, skipping strings and comments. */
function closing(css: string, open: number): number {
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    const c = css[i];
    if (c === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      i = end < 0 ? css.length : end + 1;
    } else if (c === '"' || c === "'") {
      for (i++; i < css.length && css[i] !== c; i++) if (css[i] === "\\") i++;
    } else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return i;
  }
  throw new Error("reduced-motion: unbalanced braces in a prefers-reduced-motion block");
}

/** The top-level rules of a block body whose selector is :root, copied for the flagged root. */
function rootRules(body: string): string {
  let out = "";
  let i = 0;
  while (i < body.length) {
    const open = body.indexOf("{", i);
    if (open < 0) break;
    const close = closing(body, open);
    const selector = body.slice(i, open).replace(/\/\*[\s\S]*?\*\//g, "").trim();
    if (selector === ":root") out += `\n:root[${ROOT_FLAG}] ${body.slice(open, close + 1)}`;
    i = close + 1;
  }
  return out;
}

/** Mirrors the reduced-motion blocks of a stylesheet so the toolbar switch can turn them on and off. */
export function mirrorReducedMotion(css: string): string {
  let out = "";
  let from = 0;
  for (let m = QUERY.exec(css); m; m = QUERY.exec(css)) {
    const open = m.index + m[0].length - 1;
    const close = closing(css, open);
    const body = css.slice(open + 1, close);
    if (m[1] === "reduce") out += `${css.slice(from, close + 1)}\n@container style(${SWITCH}) {${body}}${rootRules(body)}`;
    else out += `${css.slice(from, open + 1)}@container not style(${SWITCH}) {${body}}}`;
    from = close + 1;
    QUERY.lastIndex = from;
  }
  QUERY.lastIndex = 0;
  return out + css.slice(from);
}

/** A Vite plugin applying mirrorReducedMotion to Blip's stylesheets (anything under packages/). */
export function reducedMotionSwitch(): Plugin {
  return {
    name: "blip:reduced-motion-switch",
    enforce: "pre",
    transform(code, id) {
      const file = id.split("?")[0]!;
      if (!file.endsWith(".css") || !/[\\/]packages[\\/]/.test(file) || !code.includes("prefers-reduced-motion")) return null;
      return { code: mirrorReducedMotion(code), map: null };
    },
  };
}
