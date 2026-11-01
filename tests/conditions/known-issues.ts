/**
 * Failures of the condition lanes that are left on purpose: a design decision, or a fix bigger than the lanes' own.
 * Each entry lets the failures of one example in one lane through when a failure line contains `match` (and, with
 * `condition`, only under that condition), so the lane stays green while the problem stays visible: the test lists
 * every one as an annotation, and an entry that no longer matches anything is reported as stale. Never let a whole
 * lane or example through.
 */
export type Lane = "contrast" | "seams" | "forced-colours" | "rtl" | "long-words" | "scripts" | "print" | "motion";

export interface KnownIssue {
  lane: Lane;
  /** The example as package/name ("components/tabs"), or a fixture of this project ("conditions/scripts"). */
  example: string;
  /** Only under this condition: a substring of the condition label ("night", "dpr 1.25", "320px 24px"). */
  condition?: string;
  /** A substring of the failure line: the selector, the text, the property. */
  match: string;
  /** What is wrong, and why it is left. */
  why: string;
  /** Where the fix belongs, and what it is. */
  fix: string;
}

// The long-words lane's causes: what is still left on purpose, or waits on another stream.
const DISPLAY = {
  why: "Owner decision: display type (Pixel Bop) never breaks inside a word or number; on a narrow stage it steps down to a whole scale that fits (stage.css), and titles wrap between words. A compound of 18 to 24 letters is 252 to 336 px even at scale 1, the smallest whole scale (14 px a letter at the default pixel), so in a phone-width stage, panel or footer it is wider than its box. In English everything fits.",
  fix: "Nothing in the CSS while display words stay whole: there is no smaller whole scale. The owner's call: let display text break inside a word as a last resort at scale 1 (overflow-wrap: anywhere on .chu-display[data-scale=\"1\"] and on stepped-down text), or give these examples more room.",
};
const BRAND = {
  why: "Deliberate, documented in app-bar.css: 'The brand gives way first when space runs out', so on a narrow bar the wordmark is clipped (with no ellipsis) to keep the menu button and the actions whole.",
  fix: "Nothing, if clipping is how the brand should give way; otherwise cut it with an ellipsis, or show only the mark sooner (app-bar.css). The owner's call.",
};
const NEVER_SQUEEZED = {
  why: "Deliberate, documented in app-bar.css: a bar that holds more than fits 'runs past the end rather than under the menu button', so the example's link-states bar (which never folds) is wider than a phone, and its links run out of it.",
  fix: "Nothing in the component; the example could put that bar in a scroller (packages/components/examples/app-bar.html).",
};
const OVERHANG = {
  why: "Deliberate: the slot's tag hangs over the slot's corner like a sticker (inventory.css), so it sits a few pixels outside the slot's box.",
  fix: "Nothing; the lane counts a box placed with offsets as in the flow. Remove this entry if it learns to leave such boxes out.",
};
const EXAMPLE_FRAME = {
  why: "The example draws a phone screen as a box of fixed height; at a 24 px default text size its content no longer fits.",
  fix: "Give the example's screen a min-block-size instead of a block-size (packages/components/examples/bottom-bar.html).",
};

export const KNOWN_ISSUES: KnownIssue[] = [
  // ---------------------------------------------------------------- contrast
  // ---------------------------------------------------------------- seams
  // ---------------------------------------------------------------- forced-colours
  // ---------------------------------------------------------------- rtl
  // ---------------------------------------------------------------- long-words
  { lane: "long-words", example: "blocks/landing", match: "the page is wider than the screen", ...DISPLAY },
  { lane: "long-words", example: "components/app-bar", match: "a.chu-app-bar-link in ul.chu-app-bar-links \"", ...NEVER_SQUEEZED },
  { lane: "long-words", example: "components/app-bar", match: "span.chu-display.chu-pop in a.chu-app-bar-brand \"", ...BRAND },
  { lane: "long-words", example: "components/app-bar", match: "the page is wider than the screen", ...NEVER_SQUEEZED },
  { lane: "long-words", example: "components/bottom-bar", match: "falls out of the bottom of div", ...EXAMPLE_FRAME },
  { lane: "long-words", example: "effects/crt", match: "p.chu-display in div \"", ...DISPLAY },
  { lane: "long-words", example: "game/inventory", match: "span.chu-slot-tag in button.chu-slot \"", ...OVERHANG },
  { lane: "long-words", example: "game/level", match: "h3.chu-display.chu-pop in section.chu-stage \"", ...DISPLAY },
  { lane: "long-words", example: "game/pause", match: "h2.chu-pause-title.chu-display in dialog.chu-pause \"", ...DISPLAY },
  { lane: "long-words", example: "game/stage", match: "p.chu-display.chu-pop in section.chu-stage \"", ...DISPLAY },
  // ---------------------------------------------------------------- scripts
  // ---------------------------------------------------------------- print
  // ---------------------------------------------------------------- motion
];
