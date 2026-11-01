// Searching the docs, for the search palette (site.js) and the A to Z page. Every word typed must be found in an
// item's title, its synonyms (words people use that the docs don't), its keywords or one of its sections (the
// page's headings); a section that holds them all is the place to open. A word that is nowhere in the index is
// tried with a typo fixed: one letter wrong, missing, extra or swapped (two in words of eight letters or more).
// A word in the title counts most, then a synonym, a section, a keyword; the best matches come first, and a title
// that is the whole query (or the query with a typo, or in the other spelling: "color" is Colour) first of all.
// US and UK spellings find each other: "color" finds Colour, "grey" finds gray.

const norm = (s) => String(s ?? "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

/** A text's words, lower case, and the parts of its hyphenated words ("file-drop": "file", "drop"). */
function fields(text) {
  const whole = [], parts = [];
  for (const w of norm(text).split(/[^a-z0-9-]+/)) {
    if (!w) continue;
    whole.push(w);
    if (w.includes("-")) for (const p of w.split("-")) if (p) parts.push(p);
  }
  return { whole, parts };
}

/** The words typed, as they were typed ("--blip-accent" stays one word). */
export const queryWords = (query) => norm(query).split(/[^a-z0-9-]+/).filter(Boolean);

/** Letters to change, add, remove or swap to turn a into b: past max, max + 1. */
export function distance(a, b, max = 2) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2 = null, prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let low = i;
    for (let j = 1; j <= b.length; j++) {
      let d = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d = Math.min(d, prev2[j - 2] + 1);
      row.push(d);
      low = Math.min(low, d);
    }
    if (low > max) return max + 1;
    prev2 = prev;
    prev = row;
  }
  return prev[b.length];
}
const typos = (q) => (q.length >= 8 ? 2 : q.length >= 5 ? 1 : 0);

// The same word in US and UK spelling, as [US, UK] stems: a word holding one is tried with the other too.
const SPELLINGS = [
  ["color", "colour"], ["gray", "grey"], ["center", "centre"], ["behavior", "behaviour"], ["favorite", "favourite"],
  ["honor", "honour"], ["license", "licence"], ["catalog", "catalogue"], ["artifact", "artefact"],
  ["labeled", "labelled"], ["labeling", "labelling"], ["canceled", "cancelled"], ["canceling", "cancelling"],
  ["modeling", "modelling"], ["customiz", "customis"], ["organiz", "organis"], ["optimiz", "optimis"],
  ["initializ", "initialis"], ["normaliz", "normalis"], ["synthesiz", "synthesis"], ["recogniz", "recognis"],
  ["minimiz", "minimis"], ["maximiz", "maximis"], ["visualiz", "visualis"], ["localiz", "localis"],
  ["personaliz", "personalis"], ["serializ", "serialis"], ["analyz", "analys"],
];
/** Typed words and their other spellings ("color": "color", "colour"; "gray colour": also "grey colour", "gray color"). */
export function spellings(q) {
  let uk = q, us = q;
  for (const [a, b] of SPELLINGS) {
    // "color" is inside "colour": a stem that starts the other one is only swapped where it doesn't go on to be it.
    const rest = b.startsWith(a) ? b.slice(a.length) : "";
    uk = uk.replaceAll(rest ? new RegExp(`${a}(?!${rest})`, "g") : a, b);
    us = us.replaceAll(b, a);
  }
  return [...new Set([q, uk, us])];
}

// What a typed word is worth where it is found: [the word, the start of one, inside one, a typo away].
const TITLE = [10, 7, 4, 3], SYNONYM = [9, 6, 0, 2], SECTION = [6, 4, 2, 1.5], KEYWORD = [5, 3, 1.5, 1];

function best(q, list, w, fuzzy) {
  let s = 0;
  for (const x of list) {
    if (x === q) return w[0];
    if (x.startsWith(q)) s = Math.max(s, w[1]);
    else if (x.includes(q)) s = Math.max(s, w[2]);
    else if (fuzzy && w[3] > s && distance(q, x, typos(q)) <= typos(q)) s = w[3];
  }
  return s;
}
/** A typed word (with its other spellings) in a field: its whole words, or (for six tenths) the parts of hyphenated
 * ones. */
const score = (qv, f, w, fuzzy) => Math.max(...qv.map((q) => Math.max(best(q, f.whole, w, fuzzy), 0.6 * best(q, f.parts, w, fuzzy))));

/** An index item ({ title, url, hint, keywords, synonyms, sections }) ready to search. */
export function prepare(item) {
  return {
    item,
    title: fields(item.title),
    synonyms: fields(item.synonyms),
    keywords: fields(item.keywords),
    sections: (item.sections ?? []).map(([id, text, extra]) => ({ id, text, text_: fields(text), extra: fields(extra) })),
  };
}
const sectionScore = (q, s, fuzzy) => Math.max(score(q, s.text_, SECTION, fuzzy), score(q, s.extra, SYNONYM, fuzzy));

/**
 * What a title that is (nearly) the whole query adds: the query itself, in either spelling, 10; with a typo
 * ("buton": Button, not Action button), 8; the start of the title ("butt": Button, then Button group), 2 to 4, more
 * the more of the title it is.
 */
function titleBonus(p, whole) {
  const title = p.title.whole.join(" ");
  if (!title) return 0;
  let bonus = 0;
  for (const q of whole) {
    if (q === title) return 10;
    const t = typos(q);
    if (t && distance(q, title, t) <= t) bonus = Math.max(bonus, 8);
    else if (q.length >= 3 && title.startsWith(q)) bonus = Math.max(bonus, 2 + (2 * q.length) / title.length);
  }
  return bonus;
}

/**
 * Searches prepared items: Map(prepared item -> { score, section }) of those that match, where section is the
 * heading ({ id, text }) that holds every word the title does not, or null.
 */
export function search(query, prepared) {
  const qs = queryWords(query).map(spellings);
  const out = new Map();
  if (!qs.length) return out;
  // A typo is only guessed at for a word that nothing in the index has.
  const anywhere = (q) => prepared.some((p) => score(q, p.title, TITLE) || score(q, p.synonyms, SYNONYM) || score(q, p.keywords, KEYWORD) || p.sections.some((s) => sectionScore(q, s)));
  const fuzzy = qs.map((q) => typos(q[0]) > 0 && !anywhere(q));
  // The query as a whole, in each spelling, to hold against whole titles.
  const whole = [...new Set(spellings(queryWords(query).join(" ")))];
  for (const p of prepared) {
    const title = qs.map((q, i) => score(q, p.title, TITLE, fuzzy[i]));
    const page = qs.map((q, i) => Math.max(title[i], score(q, p.synonyms, SYNONYM, fuzzy[i]), score(q, p.keywords, KEYWORD, fuzzy[i])));
    const sections = p.sections.map((s) => qs.map((q, i) => sectionScore(q, s, fuzzy[i])));
    const found = qs.map((_, i) => Math.max(page[i], ...sections.map((s) => s[i])));
    if (found.some((v) => !v)) continue;
    // The section to open: one that holds every word the title does not, and says it at least as well as the page.
    let section = null, top = 0;
    sections.forEach((s, k) => {
      if (!s.every((v, i) => v > 0 || title[i] > 0)) return;
      const sum = s.reduce((a, b) => a + b, 0);
      if (sum > top && s.some((v, i) => v > 0 && v >= page[i])) (top = sum), (section = p.sections[k]);
    });
    out.set(p, { score: found.reduce((a, b) => a + b, 0) + titleBonus(p, whole), section: section && { id: section.id, text: section.text } });
  }
  return out;
}
