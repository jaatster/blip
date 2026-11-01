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

// The seams lane's two faint families (under 1.15:1; real by the box's definition, below what anyone sees).
const CREAM_GLINT = "On a cream box (the neutral tone, keycaps, prompt keys) the top band and the glints are the same white. At 150%, 175% and 262.5% the band's bottom edge and the top edge of the glint just below it each cover part of the screen row they share, so the cream fill shows through there at about a quarter: #fffbf6 in #ffffff, 1.03:1. Proven by making the glints transparent, which leaves no seam. Any two layers that meet edge to edge do this; it only shows where both are the same colour over a different one.";
const CREAM_GLINT_FIX = "packages/core/src/css/box.css (the ::after background): make the glint that sits just below the light band reach one pixel up into it, so the two overlap instead of meeting (no change on cream, where both are white; on other candies that pixel is the band's own colour only if the glint is drawn under the band, so this needs the glints and the top band reordered or the glint's reach set only for cream tones, e.g. a private --_pp-glint-reach the neutral tone and the cream components set). Or accept it as below sight and remove these entries.";
const DITHER_TILES = "The disabled dither is a repeating-conic-gradient tiled every two pixels. At 175% and 262.5% a tile is not a whole number of screen pixels (10.5 at 262.5%), and Chromium draws each tile with soft edges, so where the dither is the same colour as what lies under it a faint grid of tile edges shows (up to 1.13:1). Proven by making the dither transparent, which leaves no seam. It also means the dither is invisible on these boxes at 1x: their disabled look is only the muted label.";
const DITHER_TILES_FIX = "Give these disabled boxes a dither that differs from what lies under it, so the disabled state shows and the tile edges sit inside a pattern: segmented.css, menu.css and command.css set --pp-box-dither to the sunken surface, and the dialogue's ghost choices take the calm tiers' one from packages/core/src/css/box.css. Or draw the dither in box.css as one untiled fill. A design decision for the box and those components.";

// The long-words lane's causes: two design decisions about breaking text, and layouts that do not fit a phone.
const ONE_LINE = {
  why: "Design decision: controls keep their label on one line (white-space: nowrap at a fixed height in button.css, tag.css, keycap.css, choices.css and the bottom bar), with no ellipsis, so a German compound longer than the room the control has runs out of it at 320 or 360 px, or at a 20 or 24 px default text size.",
  fix: "Decide how a control's label gives way, then apply it in those stylesheets: wrap (white-space: normal and overflow-wrap: anywhere, the control growing past its 32, 40 or 48 px), or cut it short with text-overflow: ellipsis, keeping the whole label as the accessible name.",
};
const WORD_BREAK = {
  why: "Design decision: only titles and reading text break a word that does not fit (packages/core/src/css/base.css: hyphens: auto and overflow-wrap: break-word on h1 to h6, p, li, dt, dd and the text classes). Labels, legends, summaries, table cells, tooltips and captions never break one, and break-word does not let a flex or grid item shrink below its longest word, so the compound runs out of its box. Chromium hyphenates German only where it has a dictionary (macOS does, Linux CI does not).",
  fix: "packages/core/src/css/base.css (base and components owners): let UI text break what cannot fit, e.g. overflow-wrap: anywhere on :where(html) (it also lets flex and grid items shrink), keeping hyphens: auto in titles and reading text; then check the layouts that leaned on the old min-content widths.",
};
const DISPLAY = {
  why: "Pixel Bop display text keeps its scale whatever room it has, never breaks inside a number or a word, and here stays on one line, so on a phone a big number (without the words too) or a long title is wider than its box, or is cut off by the stage or block around it.",
  fix: "Step display text down a scale in narrow containers with a container query, as the hero title does, and let titles wrap between words (stat.css, hud.css, pause.css, cta.css, hero.css, stage.css, crt.css).",
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
const RAIL_CHIP = {
  why: "The sidebar rail's name chip (shown on hover and focus) sits beside its item with no collision handling, so when the rail is not at the screen's start edge (the example's third sidebar) or the name is long, the chip runs past the screen and the page scrolls sideways (2 px in English at 360 px).",
  fix: "packages/components/src/sidebar.css: keep the chip on screen (anchor positioning with position-try-fallbacks, or a max-inline-size and wrapping), or document that a rail sits at the start edge.",
};
const TABLE_SCROLL = {
  why: "The compact, empty and loading tables sit in a frame without a .pp-table-scroll, and table headings do not wrap (table.css: white-space: nowrap), so with long words or a larger text size they are wider than a phone and push the page sideways.",
  fix: "Put every table in a .pp-table-scroll in the example (packages/components/examples/table.html), or let .pp-table-frame scroll sideways itself (table.css).",
};
const NARROW = {
  why: "Does not fit a 320 or 360 px screen at a larger text size, in English too: the block keeps its rows or its fixed size instead of reflowing.",
  fix: "Let the block reflow in its stylesheet (wrap its rows; min-inline-size: 0 on its grid and flex items; no fixed block-size).",
};
const EXAMPLE_FRAME = {
  why: "The example draws a phone screen as a box of fixed height; at a 24 px default text size its content no longer fits.",
  fix: "Give the example's screen a min-block-size instead of a block-size (packages/components/examples/bottom-bar.html).",
};
const SPECIMEN = {
  why: "The font example's sample cells have a fixed width and do not wrap, so a sample line runs out of its cell at 360 px with long words, and at a 20 or 24 px default text size in English too. The example, not the font.",
  fix: "Let the specimen's sample cells wrap or scroll (packages/font/examples/font.html).",
};

export const KNOWN_ISSUES: KnownIssue[] = [
  // ---------------------------------------------------------------- contrast
  // ---------------------------------------------------------------- seams
  // Faint join of a white glint and a white top band on cream boxes (keycaps, prompt keys, the neutral tone).
  ...["components/keycap", "components/command", "components/list", "components/menu"].map((example): KnownIssue => ({
    lane: "seams",
    example,
    match: "faint seams in kbd.pp-keycap",
    why: CREAM_GLINT,
    fix: CREAM_GLINT_FIX,
  })),
  ...["game/prompt", "game/pause"].map((example): KnownIssue => ({ lane: "seams", example, match: "faint seams in kbd.pp-prompt-key", why: CREAM_GLINT, fix: CREAM_GLINT_FIX })),
  { lane: "seams", example: "components/badge", match: "faint seams in span.pp-badge [data-tone=neutral]", why: CREAM_GLINT, fix: CREAM_GLINT_FIX },
  { lane: "seams", example: "game/inventory", match: "faint seams in span.pp-slot-tag [data-tone=neutral]", why: CREAM_GLINT, fix: CREAM_GLINT_FIX },
  // Faint grid where the disabled dither's tiles meet, on disabled boxes whose dither matches what lies under it.
  { lane: "seams", example: "components/segmented", match: 'faint seams in button [aria-checked=false disabled] "Off"', why: DITHER_TILES, fix: DITHER_TILES_FIX },
  { lane: "seams", example: "components/command", match: "faint seams in div.pp-command-item [aria-selected=false aria-disabled=true]", why: DITHER_TILES, fix: DITHER_TILES_FIX },
  { lane: "seams", example: "components/menu", match: "faint seams in button.pp-menu-item [aria-disabled=true]", why: DITHER_TILES, fix: DITHER_TILES_FIX },
  { lane: "seams", example: "game/dialogue", match: "faint seams in button.pp-choice [data-variant=ghost aria-disabled=true]", why: DITHER_TILES, fix: DITHER_TILES_FIX },
  // ---------------------------------------------------------------- forced-colours
  // ---------------------------------------------------------------- rtl
  // ---------------------------------------------------------------- long-words
  { lane: "long-words", example: "blocks/cta", match: "a.pp-button in div.pp-cta-actions \"", ...ONE_LINE },
  { lane: "long-words", example: "blocks/cta", match: "h2.pp-cta-title.pp-display in section.pp-cta \"", ...DISPLAY },
  { lane: "long-words", example: "blocks/cta", match: "p.pp-cta-note in section.pp-cta \"", ...WORD_BREAK },
  { lane: "long-words", example: "blocks/cta", match: "p.pp-cta-text in section.pp-cta \"", ...WORD_BREAK },
  { lane: "long-words", example: "blocks/hero", match: "a.pp-button in div.pp-hero-actions \"", ...ONE_LINE },
  { lane: "long-words", example: "blocks/hero", match: "p.pp-hero-lead in div.pp-hero-inner \"", ...WORD_BREAK },
  { lane: "long-words", example: "blocks/hero", match: "p.pp-hero-note in div.pp-hero-inner \"", ...WORD_BREAK },
  { lane: "long-words", example: "blocks/hero", match: "span.pp-pop.pp-drop-in in span.pp-hero-word \"", ...DISPLAY },
  { lane: "long-words", example: "blocks/landing", match: "a.pp-button in div.pp-cta-actions \"", ...ONE_LINE },
  { lane: "long-words", example: "blocks/landing", match: "a.pp-button in div.pp-hero-actions \"", ...ONE_LINE },
  { lane: "long-words", example: "blocks/landing", match: "h2.pp-cta-title.pp-display in section.pp-cta \"", ...DISPLAY },
  { lane: "long-words", example: "blocks/landing", match: "p.pp-cta-text in section.pp-cta \"", ...WORD_BREAK },
  { lane: "long-words", example: "blocks/landing", match: "p.pp-hero-lead in div.pp-hero-inner \"", ...WORD_BREAK },
  { lane: "long-words", example: "blocks/landing", match: "the page is wider than the screen", ...NARROW },
  { lane: "long-words", example: "components/accordion", match: "summary.pp-accordion-summary in details.pp-accordion-item \"", ...WORD_BREAK },
  { lane: "long-words", example: "components/app-bar", match: "a.pp-app-bar-link in ul.pp-app-bar-links \"", ...NEVER_SQUEEZED },
  { lane: "long-words", example: "components/app-bar", match: "a.pp-button in div.pp-app-bar-actions \"", ...ONE_LINE },
  { lane: "long-words", example: "components/app-bar", match: "span.pp-display.pp-pop in a.pp-app-bar-brand \"", ...BRAND },
  { lane: "long-words", example: "components/app-bar", match: "the page is wider than the screen", ...NEVER_SQUEEZED },
  { lane: "long-words", example: "components/bottom-bar", match: "falls out of the bottom of div", ...EXAMPLE_FRAME },
  { lane: "long-words", example: "components/bottom-bar", match: "span.pp-bottom-bar-label in a.pp-bottom-bar-item \"", ...ONE_LINE },
  { lane: "long-words", example: "components/bottom-bar", match: "the page is wider than the screen", ...NARROW },
  { lane: "long-words", example: "components/button", match: "button.pp-button \"", ...ONE_LINE },
  { lane: "long-words", example: "components/card", match: "button.pp-button in footer.pp-card-footer \"", ...ONE_LINE },
  { lane: "long-words", example: "components/card", match: "dd.pp-stat-value.pp-display in div.pp-stat \"", ...DISPLAY },
  { lane: "long-words", example: "components/card", match: "p.pp-card-subtitle in header.pp-card-header \"", ...WORD_BREAK },
  { lane: "long-words", example: "components/cluster", match: "button.pp-button in div.pp-cluster \"", ...ONE_LINE },
  { lane: "long-words", example: "components/cluster", match: "span.pp-label.pp-muted in div.pp-card \"", ...WORD_BREAK },
  { lane: "long-words", example: "components/command", match: "kbd.pp-keycap in span.pp-keys \"", ...ONE_LINE },
  { lane: "long-words", example: "components/dialog", match: "button.pp-button \"", ...ONE_LINE },
  { lane: "long-words", example: "components/dialog", match: "button.pp-button in footer.pp-dialog-footer \"", ...ONE_LINE },
  { lane: "long-words", example: "components/drawer", match: "button.pp-button \"", ...ONE_LINE },
  { lane: "long-words", example: "components/drawer", match: "label.pp-check in div.pp-dialog-body \"", ...WORD_BREAK },
  { lane: "long-words", example: "components/field", match: "button.pp-button in div.pp-button-group \"", ...ONE_LINE },
  { lane: "long-words", example: "components/field", match: "h3.pp-title in form \"", ...WORD_BREAK },
  { lane: "long-words", example: "components/field", match: "label.pp-check in fieldset.pp-field \"", ...WORD_BREAK },
  { lane: "long-words", example: "components/field", match: "label.pp-check in pp-field.pp-field \"", ...WORD_BREAK },
  { lane: "long-words", example: "components/field", match: "label.pp-field-label in div.pp-field \"", ...WORD_BREAK },
  { lane: "long-words", example: "components/field", match: "label.pp-field-label in pp-field.pp-field \"", ...WORD_BREAK },
  { lane: "long-words", example: "components/field", match: "p.pp-check-help in form \"", ...WORD_BREAK },
  { lane: "long-words", example: "components/field", match: "p.pp-field-count in pp-field.pp-field \"", ...WORD_BREAK },
  { lane: "long-words", example: "components/field", match: "p.pp-field-error in div.pp-field \"", ...WORD_BREAK },
  { lane: "long-words", example: "components/field", match: "p.pp-field-error in pp-field.pp-field \"", ...WORD_BREAK },
  { lane: "long-words", example: "components/field", match: "p.pp-field-help in pp-field.pp-field \"", ...WORD_BREAK },
  { lane: "long-words", example: "components/popover", match: "button.pp-button \"", ...ONE_LINE },
  { lane: "long-words", example: "components/popover", match: "button.pp-button in div.pp-popover \"", ...ONE_LINE },
  { lane: "long-words", example: "components/popover", match: "label.pp-check in div.pp-popover \"", ...WORD_BREAK },
  { lane: "long-words", example: "components/sidebar", match: "the page is wider than the screen", ...RAIL_CHIP },
  { lane: "long-words", example: "components/stack", match: "button.pp-button in div.pp-stack \"", ...ONE_LINE },
  { lane: "long-words", example: "components/stack", match: "span.pp-label.pp-muted in div.pp-stack \"", ...WORD_BREAK },
  { lane: "long-words", example: "components/switch", match: "h3.pp-label in section \"", ...WORD_BREAK },
  { lane: "long-words", example: "components/switch", match: "label.pp-check in section \"", ...WORD_BREAK },
  { lane: "long-words", example: "components/switch", match: "p.pp-check-help in section \"", ...WORD_BREAK },
  { lane: "long-words", example: "components/table", match: "caption in table.pp-table \"", ...WORD_BREAK },
  { lane: "long-words", example: "components/table", match: "span.pp-tag in table.pp-table \"", ...ONE_LINE },
  { lane: "long-words", example: "components/table", match: "td in table.pp-table \"", ...WORD_BREAK },
  { lane: "long-words", example: "components/table", match: "td in tr.pp-table-empty \"", ...WORD_BREAK },
  { lane: "long-words", example: "components/table", match: "td in tr.pp-table-loading \"", ...WORD_BREAK },
  { lane: "long-words", example: "components/table", match: "th in table.pp-table \"", ...WORD_BREAK },
  { lane: "long-words", example: "components/table", match: "th.pp-numeric in table.pp-table \"", ...WORD_BREAK },
  { lane: "long-words", example: "components/table", match: "the page is wider than the screen", ...TABLE_SCROLL },
  { lane: "long-words", example: "components/tag", match: "span.pp-tag in div.pp-cluster \"", ...ONE_LINE },
  { lane: "long-words", example: "components/toast", match: "button.pp-button \"", ...ONE_LINE },
  { lane: "long-words", example: "components/tooltip", match: "span.pp-tooltip \"", ...WORD_BREAK },
  { lane: "long-words", example: "components/window", match: "button.pp-button in div.pp-stack \"", ...ONE_LINE },
  { lane: "long-words", example: "components/window", match: "dd.pp-stat-value.pp-display in div.pp-stat \"", ...DISPLAY },
  { lane: "long-words", example: "components/window", match: "span.pp-list-title in div.pp-list-content \"", ...WORD_BREAK },
  { lane: "long-words", example: "effects/burst", match: "button.pp-button \"", ...ONE_LINE },
  { lane: "long-words", example: "effects/crt", match: "p.pp-display in div \"", ...DISPLAY },
  { lane: "long-words", example: "font/font", match: "span \"", ...SPECIMEN },
  { lane: "long-words", example: "game/achievement", match: "p.pp-achievement-label in div.pp-achievement \"", ...WORD_BREAK },
  { lane: "long-words", example: "game/achievement", match: "p.pp-achievement-text in div.pp-achievement \"", ...WORD_BREAK },
  { lane: "long-words", example: "game/choices", match: "button.pp-choice in ul.pp-choices \"", ...ONE_LINE },
  { lane: "long-words", example: "game/choices", match: "h3.pp-display.pp-pop in section.pp-stage \"", ...DISPLAY },
  { lane: "long-words", example: "game/hud", match: "span.pp-counter-value.pp-display in pp-counter.pp-counter \"", ...DISPLAY },
  { lane: "long-words", example: "game/hud", match: "p.pp-display.pp-pop in section.pp-stage \"", ...DISPLAY },
  { lane: "long-words", example: "game/inventory", match: "span.pp-slot-tag in button.pp-slot \"", ...OVERHANG },
  { lane: "long-words", example: "game/level", match: "h3.pp-display.pp-pop in section.pp-stage \"", ...DISPLAY },
  { lane: "long-words", example: "game/pause", match: "button.pp-choice in ul.pp-choices \"", ...ONE_LINE },
  { lane: "long-words", example: "game/pause", match: "h2.pp-pause-title.pp-display in dialog.pp-pause \"", ...DISPLAY },
  { lane: "long-words", example: "game/pause", match: "in p.pp-pause-stats", ...NARROW },
  { lane: "long-words", example: "game/pause", match: "kbd.pp-prompt-key in p.pp-pause-hint.pp-prompt \"", ...NARROW },
  { lane: "long-words", example: "game/pause", match: "p.pp-pause-hint.pp-prompt in dialog.pp-pause \"", ...WORD_BREAK },
  { lane: "long-words", example: "game/sprites", match: "figcaption.pp-caption in figure \"", ...WORD_BREAK },
  { lane: "long-words", example: "game/stage", match: "p.pp-display.pp-pop in section.pp-stage \"", ...DISPLAY },
  { lane: "long-words", example: "icons/icons", match: "button.pp-button in div.pp-example-icons-row \"", ...ONE_LINE },
  { lane: "long-words", example: "icons/icons", match: "span.pp-label.pp-muted in div.pp-example-icons-row \"", ...WORD_BREAK },
  // ---------------------------------------------------------------- scripts
  // ---------------------------------------------------------------- print
  {
    lane: "print",
    example: "components/dialog",
    match: 'div.pp-dialog-body "Crystal Caves, a new": scrolls on paper',
    why: "A dialog's body scrolls when it is taller than the room the dialog has (dialog.css: the dialog's max-block-size, here held to 220 px by the example's inline style), and paper cannot scroll, so an open dialog prints only the part of its body in view. How an open dialog prints is a design decision: grown to its whole text over the page, or not at all.",
    fix: "packages/components/src/dialog.css: e.g. @media print { .pp-dialog { max-block-size: none; } .pp-dialog-body { overflow: visible; } } so the body prints whole (an inline max-block-size, as in this example, still holds it), or leave open dialogs off paper. The owner's call.",
  },
  {
    lane: "print",
    example: "components/tabs",
    match: 'div.pp-tabs-list "World 1 World 2 Worl": scrolls on paper',
    why: "A tab row too long for its container scrolls sideways behind its scroll buttons (tabs.css, 'when the row overflows'), and paper cannot scroll, so the tabs out of view never print. A tab row on paper is a design question for every tier (candy, soft, outline, underline).",
    fix: "packages/components/src/tabs.css: e.g. @media print { .pp-tabs > .pp-tabs-list { overflow: visible; flex-wrap: wrap; } .pp-tabs > .pp-tabs-scroll { display: none; } }, after checking how a wrapped row looks in each tier. The owner's call.",
  },
  // ---------------------------------------------------------------- motion
  {
    lane: "motion",
    example: "effects/world",
    condition: "dpr",
    match: "pp-world-things > canvas (script): never stops",
    why: "The world's opt-in ambient motion never ends: with clouds, its twelve clouds drift a whole pixel every 250 ms and wrap round for ever; with stars, a star flares every 0.6 to 1.5 s at night; with events, a flock of birds crosses by day (or a star shoots at night) every one to two minutes. DESIGN.md describes all three without an end, while it says anything that blinks or bobs stops after six beats, and WCAG 2.2.2 (Pause, Stop, Hide) asks for a way to pause, stop or hide moving content that starts by itself and lasts more than five seconds next to other content. Every move lands on whole pixels; only the endlessness is in question. A design decision, so left to the owner.",
    fix: "packages/effects/src/world.ts and DESIGN.md (World backdrop): either stop the drift, the flares and the events after a set time (or after six beats of each), or give <pp-world> a documented pause (a paused attribute and property) and tell pages that turn on clouds, stars or events to offer a pause control. Then remove this entry.",
  },
];
