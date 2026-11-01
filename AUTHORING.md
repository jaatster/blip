# Authoring Blip

How to add to Blip: components, kits, effects, icons, tokens. The button
(`packages/components/src/button.css`, `examples/button.html`, `docs/button.md`) is the reference; read it first.

## The rules

1. **Tokens only.** No raw colours (hex, `rgb()`, named) except `transparent`, `currentColor`, and system colours
   inside `@media (forced-colors: active)`. Sizes are whole pixels: `calc(N * var(--blip-pixel))` or a pixel token
   (`--blip-space-N`, `--blip-radius-N`, `--blip-control-sm|md|lg`, `--blip-icon-md`). Text sizes use `--blip-size-*`; big
   text is Pixel Bop at a whole scale (`.blip-display` with `--blip-scale` or `data-scale`). The only off-grid lengths
   allowed: `1px` borders in forced-colors mode, and Pixelify Sans text.
2. **Every candy thing is a `.blip-box`.** Markup is `class="blip-box blip-<component>"`. Do not redraw outlines, bands,
   drops, focus rings or dither: set the box's variables (`--blip-r` with `--blip-shape` and `--blip-shape-inner`,
   `--blip-band-top`, `--blip-band-bottom`, `--blip-drop-size`, `--blip-box-*`) or use `data-variant` (`candy`, `soft`,
   `outline`, `ghost`, `panel`) and `data-tone`.
3. **One rule per state, from the box.** Hover lifts in the white ring, pressed sits in its drop, selected/current sits in with bands
   swapped, focus is the yellow-and-ink ring, disabled is dithered, busy shows stepped dots, invalid uses the danger
   tone. Don't invent new state looks. Support `data-blip-state="hover focus active"` for forced looks in examples.
4. **Motion snaps.** Only `steps(n, jump-end)` (n = pixels moved, at most 6) or `--blip-ease-2|4|6`. Durations from
   `--blip-duration-*`. Everything stops or goes instant with `prefers-reduced-motion`. No easing curves, no blur, no
   fractional scaling or rotation.
5. **Ink, never black. Yellow means focus.** Warnings are orange. Yellow appears elsewhere only as coins and stars.
6. **Layers.** Core components in `@layer blip.components`; kits (game, blocks, effects) in `@layer blip.kits`.
7. **Native HTML first.** `<button>`, `<input>`, `<select>`, `<dialog>`, `<details>`, the `popover` attribute,
   `<progress>`, `<meter>`, `<table>`. Follow the WAI-ARIA Authoring Practices for roles, states and keyboard.
8. **Web Components only for behaviour.** Light DOM, no shadow DOM, extend `BlipElement` from `@blip/core`
   (it gives `this.signal`, which aborts on disconnect: pass it to every listener, timer and timeline). Tag
   `blip-<name>`; events `blip-<name>` (bubbling, composed). Elements upgrade markup that already renders correctly
   without JavaScript where possible. Replacing a form control? Make it form-associated (`static formAssociated =
   true`, `ElementInternals`). No dependencies except `@blip/core`. Use the shared controllers
   (`rovingFocus`, `typeahead`, `dismiss`) and `run`/`frames` timelines rather than writing your own.
9. **Glyphs inside components** (check marks, chevrons, close crosses, radio dots, arrows) are CSS masks with an
   SVG data URI drawn on whole pixels (12 x 12 grid, or smaller), coloured with `background-color: currentColor`.
   `shape-rendering='crispEdges'` in the SVG. Content icons in markup use `<svg class="blip-icon" viewBox="0 0 12
   12">` from `@blip/icons`.
10. **Budgets.** Each element 3 KB gzipped or less (the build reports it). All component CSS together 34 KB.
11. **Accessible by default.** WCAG 2.2 AA: names, roles, states, focus order, 24 px targets
    (`--blip-target-min`), contrast from the scheme roles (they are checked when the tokens build), forced-colors.

## API conventions

- Variants and options are attributes: `data-variant`, `data-tone`, `data-size` (`sm`, `md` default, `lg`),
  `data-blip-r` for radius. Booleans are present or absent.
- Parts are classes named `blip-<component>-<part>` (`blip-dialog-title`, `blip-card-media`).
- Public custom properties are `--blip-<component>-<thing>`; private ones start with `--_`.
- Element properties mirror attributes. Events carry `detail` and are cancelable when they announce a change that
  can be refused (`blip-before-close`).
- Use ARIA attributes for state wherever ARIA has one (`aria-pressed`, `aria-selected`, `aria-current`,
  `aria-expanded`, `aria-invalid`, `aria-busy`, `aria-disabled`); style from them.

## Files for a component

| File | Holds |
|---|---|
| `packages/<pkg>/src/<name>.css` | Its CSS, with a header comment like the button's: markup, attributes, states. |
| `packages/<pkg>/src/<name>.ts` | Its element, if it has behaviour (`packages/elements` for core components; kits keep theirs). |
| `packages/<pkg>/examples/<name>.html` | An HTML fragment showing every variant and state, with real content. |
| `packages/<pkg>/examples/<name>/NN-title.html` | Optional snippets: small examples, one idea each, to copy (see below). |
| `packages/<pkg>/docs/<name>.md` | Front matter (name, package, css, element, react, status, equivalents), then: usage, anatomy, variants, states, accessibility (keyboard map, ARIA), content, do and don't, API. |

Indexes are generated from the files: no shared list to edit.

### Equivalents

`equivalents:` in the front matter says what other systems call the component. The docs page shows it as "Also
known as" and search finds the component by those names ("Sheet" finds the drawer). Each key is a comma-separated
list; leave out a key, or the whole block, when there is no real equivalent.

```yaml
equivalents:
  shadcn: Sheet, Drawer            # shadcn/ui's component names, as ui.shadcn.com/docs/components lists them
  apg: dialog-modal                # WAI-ARIA APG pattern slugs: www.w3.org/WAI/ARIA/apg/patterns/<slug>/
  html: '<dialog>'                 # the native element or attribute; quote values that start with <
```

### Snippets

The full `examples/<name>.html` is the specimen: the visual tests and the gallery use it, so keep every variant and
state there. Snippets sit beside it in `examples/<name>/`, which the tests and the gallery never read. Name each
`NN-title.html` (`01-tiers.html`, `02-with-an-icon.html`): the number orders them and the rest becomes the title
("With an icon"). Start each with a comment saying what it shows, as the full example does; the page shows it above
the live snippet and its source. Two to four per component: the common case, an interesting variant, a real
composition. Snippets share the page with the full example, so give their ids a prefix of their own (the docs build
fails on an id used twice).

## Checking your work

```sh
node scripts/serve.mjs                       # once: http://localhost:4173 (serves the repo)
node scripts/gallery.mjs                     # after adding files
node scripts/shoot.mjs .tools/shots/me \
  "/specimen/gallery.html?only=button,tabs=day" \
  "/specimen/gallery.html?only=button,tabs&scheme=night=night" --full
node scripts/shoot.mjs .tools/shots/me "/specimen/gallery.html?only=tabs=zoom" --scale 2 --width 800
pnpm --filter @blip/<pkg> build         # builds and reports sizes
pnpm qa tabs                                 # every check of one item, and only its checks
```

Open the PNGs and look: crisp stepped corners, ink outlines, no blurry edges, every state distinct, nothing
overflowing, Day, Sunset and Night all readable.

`pnpm qa <name>` (`scripts/qa.mjs`) finds the item's docs page, stylesheet, element and example by name, says what is
missing (a docs page, an example, a header comment, visual baselines, a unit test of its element, its row in
CONTRACT.md), then runs its checks: stylelint on its CSS, the docs page against the code
(`tests/unit/node/docs-components.test.ts`), its Custom Elements Manifest, its budget lines, the unit tests that
mention it, and the visual tests and accessibility scans of its example in every scheme. It ends with a table and
fails if anything does. `--fast` skips the Playwright runs; `--update-snapshots` writes its visual baselines (look
at every picture before you commit them). It does not build: the Playwright runs and the budgets read `dist`, and
it notes when a package's build is older than its sources.

## Names the box reserves

On a `.blip-box`, `--_p` (one pixel) and `--_t` (the corner tile) are set by the box: read them, never redefine them.
Every other private name of the box starts with `--_blip-`. Your own private names should be specific
(`--_blip-<component>-x`) so they never collide with another component on the same element.
