# Blip: build plan

Blip is a 16-bit pixel-art design system: candy-coloured, ink-outlined controls on a soft dithered world,
one square pixel size everywhere, and motion that snaps. It started as the look of a TV launcher. This plan turns
it into an open-source system for web apps, websites, games and native apps.

Status: **draft, waiting for approval.**

## Decisions so far

| Topic | Decision |
|---|---|
| Home | this repo, a pnpm monorepo in its own git repo |
| Licence | MIT for code and icons; SIL Open Font License for the font |
| Packages | `@jaatster/blip-*` on npm (free today). Nothing is pushed or published without your go |
| Built with | W3C design tokens, plain CSS and dependency-free Web Components, plus typed React wrappers |
| Used for | Web apps, websites, games, and native mobile (through tokens and icons) |
| Pixel | 2 CSS px by default; one setting changes it |
| Schemes | Day, Sunset and Night, plus Auto, which follows the clock with a stepped fade |
| Loudness | Tiered: candy for primary actions, calmer tiers for dense UI |
| Type | **Pixel Bop**, our own pixel display font, extended to every European capital (all-caps by rule), plus Pixelify Sans for UI and body |
| Modular | Core packages plus optional kits; public building blocks; themes as independent switches; add-on packs; a versioned public contract |
| Icons | About 150 original icons, 12 x 12 pixels |
| Effects | World backdrops, transitions, text and sparkle effects, chip sounds; all opt-in |
| Mascot | None. Doodoo stays on the TV |
| Docs | A docs site built in Blip, Storybook, visual and accessibility tests |
| Figma | Variables, styles, icons and components in your Jaatster-Playground page, linked to code |

## Rules the whole system keeps

1. **One pixel.** Every outline, icon, letter, corner and movement is a whole number of pixels (`--blip-pixel`, 2 CSS
   px by default). Nothing is blurred, rotated or scaled by a fraction.
2. **Ink, never black.** The darkest colour is ink `#1A1530`, used for every outline, shadow and piece of dark text.
3. **Candy on pastel.** Saturated, outlined things can be acted on. The world behind them is soft, dithered and
   has no outlines.
4. **Yellow means focus.** Focus is always the yellow ring, and nothing else is yellow. Warnings are orange.
5. **Motion snaps.** Everything moves through 2 to 6 even steps (`steps()`), never along an easing curve.
   Reduced motion makes it instant.
6. **Disabled is dithered.** A disabled control gets a checkerboard dither over it, not a grey wash. *(new)*
7. **Light by construction.** No image files. Components are CSS, art is SVG, and the world is drawn in the
   browser at its own 320-pixel resolution.

## Packages

The core stays small, and everything else is an optional kit. Each package has its own version and one entry point
per component, so an app takes only what it uses.

**Core**

| Package | Contents |
|---|---|
| `@jaatster/blip-tokens` | Source tokens in the W3C 2025.10 format, with a resolver for the theme switches. Exports CSS variables, JS/TS with types, Kotlin (Compose), Swift, Android XML, and Figma variables |
| `@jaatster/blip-core` | The public building blocks: the pixel unit, candy box, focus ring, dither, drop, stepped motion, reset and base styles. Also the shared behaviours (roving focus, typeahead, dismiss, anchoring), the timeline runner, and the swappable clock and random-number services |
| `@jaatster/blip-components` | The core components as layered CSS (`@layer`), as one file or one per component |
| `@jaatster/blip-elements` | Web Components for the core components that need behaviour (tabs, combobox, menu, toasts, command palette and more), with a Custom Elements Manifest |
| `@jaatster/blip-react` | Typed React components for the core and every kit (`@jaatster/blip-react/game` and so on), generated from the manifest where possible |
| `@jaatster/blip-icons` | SVG files, a sprite, JS path data, and icon components |
| `@jaatster/blip-font` | Pixel Bop (WOFF2 and TTF) and a Pixelify Sans subset, with licences |

**Kits**

| Package | Contents |
|---|---|
| `@jaatster/blip-game` | The game UI kit: dialogue box, hearts and health bar, coin and score counter, inventory grid, button prompts, level tile, pause menu, achievement toast |
| `@jaatster/blip-blocks` | Website blocks: hero, feature grid, pricing, CTA band, footer |
| `@jaatster/blip-effects` | World backdrops, transitions, text effects, bursts, CRT filter, and the time-of-day engine |
| `@jaatster/blip-sound` | The chip sounds |

**Tooling:** `@jaatster/blip-stylelint-config`, with lint rules that reject raw colours, off-grid sizes and easing curves.
**Apps:** `docs` (the docs site) and `storybook`.

## Modular by design

- **Layers only build on the layer below:** tokens, then building blocks, then components, then kits and blocks,
  then templates. A new component is put together from the building blocks, so it matches the rest automatically.
- **Themes are independent switches,** each a modifier in the token resolver:
  - scheme: Day, Sunset or Night;
  - pixel size: 2, 3 or 4 px;
  - palette: Candy by default, and eleven presets (`data-blip-palette`, `palettes.css`).

  Contrast and density can be added later. Adding a theme means adding a token file, not changing code.
- **Packs are data, checked against one schema.** World packs (Meadow first), icon packs and palette packs can be
  added by anyone without forking.
- **A public contract, versioned with semver.** It covers token names, CSS custom properties, building-block
  classes, component part names, attributes and events. Everything else is private and can change freely. The
  contract is written down from day one.

## Foundations

- **Grid and space.** Spacing is counted in pixels: 1, 2, 3, 4, 6, 8, 12, 16, 24 and 32, which is 2 to 64 CSS
  px. Layout uses container queries, with compact, medium and wide breakpoints. The pixel can be set per page or
  per section, for example 3 px for a game screen or 4 px for a TV.
- **Colour.** Three layers:
  - *Primitives:* ink, white, ten candies with light and shade, and the world palettes.
  - *Semantic roles per scheme:* surface, raised, sunken, text, muted text, border, focus, accent, and four
    intents (info blue, success green, warning orange, danger red).
  - *Component tokens* on top.

  Every text pair is checked against WCAG 2.2 AA when the tokens build, and a failing pair fails the build.
- **Type.** Display text uses our font at whole-number scales: cap heights of 14, 28, 42 and 56 px at 1x to 4x.
  UI and body text use Pixelify Sans on a size ramp checked for sharpness during the build. Also: casing rules
  and tabular digits.
- **Shape.** The candy box, drawn in CSS at any size: stepped rounded corners (radius 0 to 6 pixels), a
  one-pixel ink outline, a light band, the base colour, a shade band and glints. It comes in four tiers: Candy,
  Soft (pastel fill with an ink outline), Outline and Ghost.
- **Depth.** A one-pixel ink-tinted drop down and to the right. Raised things lift by a pixel. Nothing blurs.
- **Motion.** Frame-based tokens: FRAME 40 ms, NUDGE 80, SLIDE 100, GLIDE 160, FADE 160, and so on.
  Choreographies are stored as data (see "Borrowed from Effect").
- **Sound.** The chip sound set, as tokens.
- **States.** One visual rule per state, across every component:

| State | Look |
|---|---|
| Hover | Lifts one pixel, in the TV's white ring with an ink edge |
| Focus | A 2-pixel yellow ring with an ink edge, following the stepped corners |
| Pressed | Drops one pixel into its shadow |
| Selected or checked | Accent fill with a check or notch |
| Indeterminate | Half-filled |
| Disabled | Checkerboard dither, no lift |
| Loading | Stepped dots replace the label; the size stays the same |
| Invalid or success | Red or green outline, icon and message |
| Read-only | Flat: no bands, no outline |

## Components (about 67)

| Group | Components |
|---|---|
| Actions (6) | Button, icon button, button group, toggle button, segmented control, link |
| Forms (13) | Field (label, help, error), text input, textarea, select, combobox, checkbox, radio group, switch, slider (in steps), number stepper, search, file drop, rating |
| Navigation (10) | App bar, tabs, sidebar, breadcrumbs, pagination, menu, command palette, wizard stepper, bottom bar, skip link |
| Feedback and overlays (11) | Alert, toast, dialog, drawer, popover, tooltip, progress bar (in segments), loader, skeleton, empty state, badge |
| Data (10) | Card, tile, list, table, avatar, tag, keycap, stat, divider, accordion |
| Layout (4) | Stack, cluster, grid, window (a pixel window with a title bar) |
| Website blocks (5) | Hero with world backdrop, feature grid, pricing, CTA band, footer |
| Game UI (8) | Dialogue box, hearts and health bar, coin and score counter, inventory grid, button prompts, level tile, pause menu, achievement toast |

Components are built on native HTML first: real `<button>`, `<input>`, `<dialog>`, `<details>`, the popover
attribute and anchor positioning. Most components are therefore CSS only, and Web Components are used only where
behaviour is needed.

## Icons (about 150)

- **Grid:** 12 x 12 pixels with one-pixel strokes, one colour (`currentColor`), on the same grid as the font.
- **Categories:** arrows and navigation, actions, media, files, communication, people, status, commerce, devices,
  weather and time, and text editing.
- **Game set:** heart, coin, gem, sword, shield, potion, key, chest, trophy and more.
- **Extras:** a few multi-colour candy glyphs, and sprites (coin, sparkle, cloud, star, bird).
- **No brand logos,** because of trademarks.

## Effects (opt-in, no image files)

| Effect | What it does |
|---|---|
| World backdrop | Dithered sky, mountains, hills, grass, drifting clouds, stars, sun and moon, for Day, Sunset and Night, with parallax. Drawn at 320 x 180 and scaled up crisply |
| Transitions | Ink dissolve, dither wipe and mosaic, used for page changes through View Transitions |
| Text | POP letters (outline and drop), letters that drop in, typewriter text, glint sweep |
| Bursts | Sparkle, coin, star and confetti |
| CRT | Scanlines and a soft vignette. Flicker only if you turn it on |
| Sound | step, look, open, back, bump, coin, jump, blip, success, error. Synthesised in the browser, off by default |
| Time of day | The Auto scheme: switches from Day to Sunset to Night by the clock, stepping the palette over a minute |

## Borrowed from Effect

- **Typed contracts.** The tokens generate TS, Swift and Kotlin types. The Custom Elements Manifest generates the
  React types, the Storybook controls and the docs' API tables, so none of them can drift apart.
- **Validated sources, helpful errors.** Every token file and pixel map (icons, font, sprites) is checked against
  a schema at build time. An error names the file, the exact spot and the fix.
- **Motion as data.** Choreographies (a press, a dialog opening, the dissolve) are typed timelines in the tokens,
  like Effect's schedules. One definition drives CSS, JS and native code.
- **Nothing leaks.** Every animation, timer and sound belongs to its element. It stops cleanly when the element
  goes away, the user acts, the tab is hidden, or reduced motion is on.
- **Swappable services.** The clock, the random numbers and the sound output can be replaced, so tests and
  screenshots are repeatable and apps can control them.
- **Diagnostics.** In development, Blip logs warnings with codes and links to the docs: a missing label, an
  off-grid size, an unknown token. Production builds leave them out.

## Quality bar

- **Accessibility:**
  - WCAG 2.2 AA.
  - A keyboard path for everything.
  - Windows high-contrast mode and reduced motion respected.
  - Touch and click targets at least 24 px.
- **Browsers:** Baseline 2024 is the floor. Anchor positioning, the customisable select and cross-document view
  transitions are added where the browser supports them.
- **Size budgets, enforced in CI (gzipped):**
  - all component CSS 30 KB or less;
  - tokens 4 KB or less;
  - each element 3 KB or less;
  - effects 14 KB or less (JS and CSS, including the core code they pull in; 13 KB until the world learned avoid);
  - the display font 15 KB or less.

  No runtime dependencies.
- **Tests:**
  - unit tests for the build tools and the elements;
  - interaction tests in Storybook;
  - screenshot comparisons of every component, in every state and scheme;
  - axe accessibility checks on every story.
- **Release hygiene:** Changesets for versions and changelogs, GitHub Actions CI, CONTRIBUTING and a Code of
  Conduct.

## Docs

- `DESIGN.md` in Google's format (tokens in the front matter, then the eight standard sections), plus
  `PRODUCT.md`.
- A docs site built in Blip, with:
  - getting started;
  - the foundations;
  - every component: demo, anatomy, states, API, accessibility, dos and don'ts;
  - patterns: forms, navigation, feedback, empty/error/loading states, game screens;
  - the effects;
  - a palette maker: make your own palette (the accent, and Night's page, from four levers) and export the tokens;
  - three templates: a dashboard, a landing page and a game menu.

## Figma

- **What goes in your Jaatster-Playground page:**
  - variables: primitives, and semantic colours with Day, Sunset and Night modes;
  - text styles;
  - the icons as components;
  - the core components, with variants and states;
  - a cover specimen.
- **Code Connect** then links each Figma component to its code.
- **The build script lives in the repo,** so anyone can regenerate the library.
- **The Figma tools need one session restart** before they appear here.

## Order and checkpoints

1. **Foundations.** The repo, the tokens and their exports, the pixel shape engine, base styles, the font
   pipeline, and the button finished in every state as the reference component. *You see a specimen page.*
2. **Parallel build.** Icons, the font extension, the components in three batches, and the effects. Each stream
   follows the reference button's conventions. *You see the full specimen.*
3. **Wiring.** React wrappers, the manifest, Storybook, tests, lint rules and size budgets.
4. **Docs site and templates.**
5. **DESIGN.md**, the README and the contributor docs.
6. **An independent design review**, and one round of fixes.
7. **The Figma library** and Code Connect.

## Still open

- **GitHub and npm.** Creating the GitHub repo, pushing and publishing to npm all wait for your go.
