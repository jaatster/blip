/**
 * What each diagnostic code means, in words, for the diagnostics page. The codes themselves (and where they are
 * raised, with their messages) are read from the source at build time; a code with no note here still appears.
 * Fixes are HTML.
 */
export interface Note {
  title: string;
  why?: string;
  fix?: string;
  /** The same code is raised for different problems in different places. */
  shared?: boolean;
}

export const NOTES: Record<string, Note> = {
  "PP-A001": {
    title: "An element has no accessible name",
    why: "A screen reader announces a control by its name. An element with no text, aria-label or aria-labelledby is announced as just its role (\"group\", \"slider\"), which says nothing about what it is for.",
    fix: 'Add <code class="docs-inline-code">aria-label</code> naming what it is for ("Difficulty", "Rate this level"), or <code class="docs-inline-code">aria-labelledby</code> pointing at a visible label.',
  },
  "PP-A010": {
    title: "A dialog has no name",
    why: "When a dialog opens, a screen reader says its name first. Without one, the person hears only \"dialog\".",
    fix: 'Point <code class="docs-inline-code">aria-labelledby</code> at the dialog\'s title, or give it <code class="docs-inline-code">aria-label</code>.',
  },
  "PP-C001": {
    title: "A command palette is missing its parts",
    why: "<pp-command> works on markup that is already there: a <dialog>, a text input and a [role=listbox] of options. Without them it does nothing.",
    fix: 'Start from the markup on the <a href="/components/command/">command palette</a> page.',
  },
  "PP-E001": {
    title: "An element is missing what it needs",
    why: "Elements add behaviour to markup that already works, so each needs its native part inside: <pp-combobox> an <input>, <pp-number> an <input type=number>, <pp-file-drop> an <input type=file>.",
    fix: 'Put the native control inside the element (see its page).',
  },
  "PP-E010": {
    title: "A dialog or drawer element has no <dialog>",
    why: "<pp-dialog> and <pp-drawer> wrap a native <dialog>, which gives focus trapping, Escape and the top layer for free.",
    fix: 'Put a <code class="docs-inline-code">&lt;dialog&gt;</code> inside the element.',
  },
  "PP-E020": {
    title: "A tooltip cannot find its trigger",
    why: "A tooltip describes one control, and needs to know which, to show on its hover and focus and to describe it to screen readers.",
    fix: 'Give <code class="docs-inline-code">&lt;pp-tooltip&gt;</code> a <code class="docs-inline-code">for</code> attribute with the trigger\'s id, or put it right after the trigger.',
  },
  "PP-I001": {
    title: "An icon name does not exist",
    why: "<pp-icon> draws nothing for a name it does not know, so a typo leaves an empty space.",
    fix: 'Use a name from <a href="/foundations/icons/">the icon browser</a> or <code class="docs-inline-code">@jaatster/blip-icons/icons.json</code>.',
  },
  "PP-M001": {
    title: "A menu is missing its button or list",
    why: "<pp-menu> wires a button to a [role=menu] list: it opens the list, moves focus through it and gives focus back.",
    fix: 'Put a <code class="docs-inline-code">&lt;button&gt;</code> and a <code class="docs-inline-code">[role="menu"]</code> list inside, as on the <a href="/components/menu/">menu</a> page.',
  },
  "PP-N001": {
    title: "Tabs have no tab list",
    why: "<pp-tabs> wires a [role=tablist] to its panels: it moves focus along the tabs and shows the chosen panel. Without a tab list it has nothing to wire.",
    fix: 'Put a <code class="docs-inline-code">[role="tablist"]</code> inside <code class="docs-inline-code">&lt;pp-tabs&gt;</code>, as on the <a href="/components/tabs/">tabs</a> page.',
  },
  "PP-T001": {
    title: "A token file could not be read",
    why: "A file named in the resolver is missing or is not valid JSON, so the token build cannot go on.",
    fix: 'Check the file exists and parses.',
  },
  "PP-T060": {
    title: "A text pair fails WCAG AA",
    why: "Every text pair a component can show is checked in every scheme when the tokens build. This one is under 4.5:1 (or 3:1 for outlines), so some text would be hard to read.",
  },
  "PP-T061": {
    title: "The focus ring does not stand out from the page",
    why: "The yellow ring or its ink edge must reach 3:1 against the page, so focus is visible on every scheme.",
  },
  "PP-W001": {
    title: "The page has no world colours",
    why: "<pp-world> paints its sky and hills from the world colours in @jaatster/blip-tokens/tokens.css. Without them there is nothing to draw with.",
    fix: 'Load <code class="docs-inline-code">tokens.css</code> before anything that draws.',
  },
  "PP-W002": {
    title: "A world's avoid is not a selector list",
    why: "<pp-world avoid> names what its sun, moon and shooting stars keep clear of, as a CSS selector list. One the browser cannot read matches nothing, so the moon may sit behind your words.",
    fix: 'Write it as for <code class="docs-inline-code">querySelectorAll</code>: <code class="docs-inline-code">avoid=".pp-hero-title, .pp-hero-lead"</code>.',
  },
};
