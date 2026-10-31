/** Helpers the Blip rules share. */
import valueParser from "postcss-value-parser";

export const DOCS = "https://github.com/jaatster/blip/blob/main/packages/stylelint-config/README.md";
export const docs = (rule) => `${DOCS}#${rule.replace("/", "")}`;

/** Is the node inside @media (forced-colors: active)? */
export function inForcedColors(node) {
  for (let p = node.parent; p; p = p.parent) {
    if (p.type === "atrule" && p.name.toLowerCase() === "media" && /forced-colors\s*:\s*active/i.test(p.params)) return true;
  }
  return false;
}

/** Where a declaration's value starts, as an index into the declaration's text. */
export function valueIndex(decl) {
  const between = decl.raws.between ?? ":";
  return decl.prop.length + between.length;
}

/** Does a string or RegExp-like option ("/^--pp-/i") match the text? */
export function matches(patterns = [], text) {
  return patterns.some((p) => {
    if (p instanceof RegExp) return p.test(text);
    const m = /^\/(.+)\/([a-z]*)$/.exec(p);
    return m ? new RegExp(m[1], m[2]).test(text) : p === text;
  });
}

export const isStringOrRegExp = (v) => typeof v === "string" || v instanceof RegExp;

/** The custom properties a value reads with var(). */
export function varsIn(value) {
  const out = [];
  valueParser(value).walk((n) => {
    if (n.type === "function" && n.value.toLowerCase() === "var" && n.nodes[0]?.type === "word") out.push(n.nodes[0].value);
  });
  return out;
}

/** Splits parsed nodes on top-level commas. */
export function layers(nodes) {
  const out = [[]];
  for (const n of nodes) {
    if (n.type === "div" && n.value === ",") out.push([]);
    else out.at(-1).push(n);
  }
  return out;
}

/** Levenshtein distance, for "did you mean". */
export function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

/** Up to three known names closest to a typo; among names that differ only in a number, the nearest numbers. */
export function nearest(name, known) {
  const split = (s) => /^(.*?)(\d+)?$/.exec(s);
  const [, stem, n] = split(name);
  const scored = [];
  for (const k of known) {
    const d = distance(name, k);
    if (d > Math.max(2, Math.floor(name.length / 4))) continue;
    const [, kStem, m] = split(k);
    const gap = n !== undefined && m !== undefined && kStem === stem ? Math.abs(Number(n) - Number(m)) : Infinity;
    scored.push([d, gap, k]);
  }
  return scored.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2].localeCompare(b[2])).slice(0, 3).map(([, , k]) => k);
}

export { valueParser };
