# Authoring Blip

How to add to Blip: components, kits, effects, icons, tokens. The button
(`packages/components/src/button.css`, `examples/button.html`, `docs/button.md`) is the reference; read it first.

## The rules

1. **Tokens only.** No raw colours (hex, `rgb()`, named) except `transparent`, `currentColor`, and system colours
   inside `@media (forced-colors: active)`. Sizes are whole pixels: `calc(N * var(--pp-pixel))` or a pixel token
   (`--pp-space-N`, `--pp-radius-N`, `--pp-control-sm|md|lg`, `--pp-icon-md`). Text sizes use `--pp-size-*`; big
   text is Pixel Bop at a whole scale (`.pp-display` with `--pp-scale` or `data-scale`). The only off-grid lengths
   allowed: `1px` borders in forced-colors mode, and Pixelify Sans text.
2. **Every candy thing is a `.pp-box`.** Markup is `class="pp-box pp-<component>"`. Do not redraw outlines, bands,
   drops, focus rings or dither: set the box's variables (`--pp-r` with `--pp-shape` and `--pp-shape-inner`,
   `--pp-band-top`, `--pp-band-bottom`, `--pp-drop-size`, `--pp-box-*`) or use `data-variant` (`candy`, `soft`,
   `outline`, `ghost`, `panel`) and `data-tone`.
3. **One rule per state, from the box.** Hover lifts, pressed sits in its drop, selected/current sits in with bands
   swapped, focus is the yellow-and-ink ring, disabled is dithered, busy shows stepped dots, invalid uses the danger
   tone. Don't invent new state looks. Support `data-pp-state="hover focus active"` for forced looks in examples.
4. **Motion snaps.** Only `steps(n, jump-end)` (n = pixels moved, at most 6) or `--pp-ease-2|4|6`. Durations from
   `--pp-duration-*`. Everything stops or goes instant with `prefers-reduced-motion`. No easing curves, no blur, no
   fractional scaling or rotation.
5. **Ink, never black. Yellow means focus.** Warnings are orange. Yellow appears elsewhere only as coins and stars.
6. **Layers.** Core components in `@layer pp.components`; kits (game, blocks, effects) in `@layer pp.kits`.
7. **Native HTML first.** `<button>`, `<input>`, `<select>`, `<dialog>`, `<details>`, the `popover` attribute,
   `<progress>`, `<meter>`, `<table>`. Follow the WAI-ARIA Authoring Practices for roles, states and keyboard.
8. **Web Components only for behaviour.** Light DOM, no shadow DOM, extend `PixelElement` from `@jaatster/blip-core`
   (it gives `this.signal`, which aborts on disconnect: pass it to every listener, timer and timeline). Tag
   `pp-<name>`; events `pp-<name>` (bubbling, composed). Elements upgrade markup that already renders correctly
   without JavaScript where possible. Replacing a form control? Make it form-associated (`static formAssociated =
   true`, `ElementInternals`). No dependencies except `@jaatster/blip-core`. Use the shared controllers
   (`rovingFocus`, `typeahead`, `dismiss`) and `run`/`frames` timelines rather than writing your own.
9. **Glyphs inside components** (check marks, chevrons, close crosses, radio dots, arrows) are CSS masks with an
   SVG data URI drawn on whole pixels (12 x 12 grid, or smaller), coloured with `background-color: currentColor`.
   `shape-rendering='crispEdges'` in the SVG. Content icons in markup use `<svg class="pp-icon" viewBox="0 0 12
   12">` from `@jaatster/blip-icons`.
10. **Budgets.** Each element 3 KB gzipped or less (the build reports it). All component CSS together 30 KB.
11. **Accessible by default.** WCAG 2.2 AA: names, roles, states, focus order, 24 px targets
    (`--pp-target-min`), contrast from the scheme roles (they are checked when the tokens build), forced-colors.

## API conventions

- Variants and options are attributes: `data-variant`, `data-tone`, `data-size` (`sm`, `md` default, `lg`),
  `data-pp-r` for radius. Booleans are present or absent.
- Parts are classes named `pp-<component>-<part>` (`pp-dialog-title`, `pp-card-media`).
- Public custom properties are `--pp-<component>-<thing>`; private ones start with `--_`.
- Element properties mirror attributes. Events carry `detail` and are cancelable when they announce a change that
  can be refused (`pp-before-close`).
- Use ARIA attributes for state wherever ARIA has one (`aria-pressed`, `aria-selected`, `aria-current`,
  `aria-expanded`, `aria-invalid`, `aria-busy`, `aria-disabled`); style from them.

## Files for a component

| File | Holds |
|---|---|
| `packages/<pkg>/src/<name>.css` | Its CSS, with a header comment like the button's: markup, attributes, states. |
| `packages/<pkg>/src/<name>.ts` | Its element, if it has behaviour (`packages/elements` for core components; kits keep theirs). |
| `packages/<pkg>/examples/<name>.html` | An HTML fragment showing every variant and state, with real content. |
| `packages/<pkg>/docs/<name>.md` | Front matter (name, package, css, element, react, status), then: usage, anatomy, variants, states, accessibility (keyboard map, ARIA), content, do and don't, API. |

Indexes are generated from the files: no shared list to edit.

## Checking your work

```sh
node scripts/serve.mjs                       # once: http://localhost:4173 (serves the repo)
node scripts/gallery.mjs                     # after adding files
node scripts/shoot.mjs .tools/shots/me \
  "/specimen/gallery.html?only=button,tabs=day" \
  "/specimen/gallery.html?only=button,tabs&scheme=night=night" --full
node scripts/shoot.mjs .tools/shots/me "/specimen/gallery.html?only=tabs=zoom" --scale 2 --width 800
pnpm --filter @jaatster/blip-<pkg> build         # builds and reports sizes
```

Open the PNGs and look: crisp stepped corners, ink outlines, no blurry edges, every state distinct, nothing
overflowing, Day, Sunset and Night all readable.

## Names the box reserves

On a `.pp-box`, `--_p` (one pixel) and `--_t` (the corner tile) are set by the box: read them, never redefine them.
Every other private name of the box starts with `--_pp-`. Your own private names should be specific
(`--_pp-<component>-x`) so they never collide with another component on the same element.
