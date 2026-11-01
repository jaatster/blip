# The Blip contract

This is the public API of Blip: what you can build on, and what semantic versioning protects. Everything listed
here changes incompatibly only in a major release, after a deprecation (see the policy below), except the parts of
a component that is still in beta (see "Stable and beta"). Everything else is private and can change in any release.

Every package has its own version. **While a package is 0.x, an incompatible change to its part of the contract is
a minor release**, and the changelog says what changed and what to do; from 1.0 it is a major release. All packages
are 0.x today (0.1.0, and 0.2.0 for `@jaatster/blip-font`).

The rule of thumb: **if it is documented, it is public.** A component's public API is what its `docs/<name>.md`
and the header comment of its stylesheet describe. An element's is its Custom Elements Manifest. A token's is its
entry in the token manifest.

## Stable and beta

Every page in a package's `docs/` (each component, kit part and effect, and the font, the icons and sound) has a
`status` in its front matter, shown on its page of the docs site:

- **Stable**: its public API is covered by this contract in full. It changes incompatibly only in a major release
  (a minor while its package is 0.x), and only after the deprecation below.
- **Beta**: finished, tested and accessible like the rest, but its API is still settling. Its classes, parts,
  attributes, events, element properties and React props can change in any minor release, without a deprecation
  first; the changelog says what changed and what to do. Patch releases never change it. The rules DESIGN.md makes
  (whole pixels, AA contrast for every checked pair, one look per state) hold for a beta part as for a stable one,
  and a change that breaks them is a bug.

A beta part becomes stable in a minor release, and the changelog says so. Nothing goes from stable back to beta.
What this contract lists without a docs page of its own (the tokens, the theme switches, the building blocks, the
cascade layers, the JavaScript APIs and the diagnostic codes) is stable.

## Tokens and their custom properties

The source of truth is generated with every build and ships with `@jaatster/blip-tokens`:

- **`@jaatster/blip-tokens/manifest.json`**: every token, with its name, its DTCG path, its CSS custom property, its
  type, its description, whether it changes with the scheme, and whether a palette sets it. 327 tokens today.
- **`@jaatster/blip-tokens/tokens.json`**: the resolved values, shared and per scheme: sizes in CSS px, and the type
  sizes in px at the browser's default text size of 16 px. `palette` names the default palette and `palettes` holds
  each preset: its `name`, `description` and `credit`, what it sets (`shared`), and every scheme's roles in it
  (`schemes`).
- **`@jaatster/blip-tokens/tokens.css`**: the custom properties themselves, in `@layer chu.tokens`. The type sizes are in
  rem, so text follows the browser's default size; everything counted in pixels does not.
- **`@jaatster/blip-tokens/palettes.css`**: the presets, opt in, in `@layer chu.tokens`: each sets what it changes on
  `[data-chu-palette="<name>"]` (see Theme switches). The preset names are public.
- **The `blip-tokens` command**: `npx blip-tokens <theme.resolver.json> [--out <file.css>] [--check]`
  builds a theme's `tokens.css` (a resolver that lists Blip's files and the theme's own, as the docs' theme
  builder exports: a `palette` context of its own, or a scheme's roles) through the same checks as Blip's own,
  in every palette and scheme the resolver has, and writes nothing when one fails. Its name, argument and options
  are public, and so are the codes it reports.
- **`@jaatster/blip-tokens/resolver`** and **`@jaatster/blip-tokens/src/*`**: the DTCG 2025.10 sources and resolver.
- The JS module, the Figma variables (`@jaatster/blip-tokens/figma/variables.json`), and the Kotlin (Compose), Swift
  and Android XML files in `dist/` carry the same names in each platform's case (`--chu-candy-red` is
  `candyRed` in Swift).

| Family | Count | Custom properties | Changes with |
|---|---|---|---|
| Ink and white | 3 | `--chu-ink`, `--chu-ink-soft`, `--chu-white` | scheme: `--chu-ink` is the palette's ink at Night |
| Candies | 30 | `--chu-candy-<red, orange, yellow, green, teal, blue, purple, pink, slate, cream>`, each with `-light` and `-shade` | |
| Night surfaces | 5 | `--chu-deep-1` to `--chu-deep-5` | |
| Text tones | 9 | `--chu-tone-accent-day`, `--chu-tone-accent-sunset`, `--chu-tone-accent-night`, `--chu-tone-star`, `--chu-tone-danger-light`… | |
| World | 98 | `--chu-world-<day, sunset, night>-<sky-1…6, cloud-*, mountain-*, snow-*, tree-*, hill-*, grass-*, dirt-*, bird>`, `--chu-world-sky-*`, `--chu-world-flower-1` to `-4` | palette: `--chu-world-night-*` |
| Palettes | 33 | `--chu-palette-<day, sunset, night>-accent` and `-warning`, each with `-light`, `-shade`, `-text`; `--chu-palette-night-<bg, surface, surface-raised, surface-sunken, text, text-muted, line, line-soft, ink>`: what a palette sets, which the scheme roles read | palette |
| Scheme roles | 45 | `--chu-bg`, `--chu-surface`, `--chu-surface-raised`, `--chu-surface-sunken`, `--chu-surface-panel`, `--chu-text`, `--chu-text-muted`, `--chu-text-inverse`, `--chu-line`, `--chu-line-soft`, `--chu-outline`, `--chu-drop`, `--chu-focus`, `--chu-focus-edge`, `--chu-<accent, info, success, warning, danger>` each with `-light`, `-shade`, `-text`, `-on`, `--chu-selection-bg`, `--chu-selection-text`, `--chu-scrim`, `--chu-link-visited`, `--chu-disabled-dither`, `--chu-disabled-dither-cream` | scheme |
| Scene | 21 | `--chu-scene-sky-1` to `-6`, `--chu-scene-cloud-*`, `--chu-scene-mountain-*`, `--chu-scene-hill-*`, `--chu-scene-grass-*`, `--chu-scene-dirt-*`: the world's colours for the current time of day | scheme |
| The pixel | 1 | `--chu-pixel` | pixel |
| Sizes in pixels | 29 | `--chu-space-<0, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32>`, `--chu-radius-0` to `-8`, `--chu-control-<sm, md, lg>`, `--chu-icon-<md, lg>`, `--chu-line-<outline, focus, drop>`, `--chu-target-min` | pixel |
| Breakpoints and layers | 9 | `--chu-breakpoint-<medium, wide>`, `--chu-layer-<raised, sticky, dropdown, overlay, modal, toast, tooltip>` | |
| Motion | 23 | `--chu-duration-*` (15), `--chu-steps-<2, 4, 6, dissolve, scheme>`, `--chu-delay-<hover, leave, toast>` | reduced motion: every duration is 0 ms |
| Type | 21 | `--chu-font-<display, ui, mono>`, `--chu-weight-<regular, medium, bold>`, `--chu-display-scale-1` to `-4`, `--chu-size-<caption, small, body, lead, title>`, `--chu-leading-<tight, normal, display, display-loose>`, `--chu-tracking-<none, label>` | the browser's default text size: `--chu-size-*` (rem) |

**Names are the contract; values are design.** A token's name, its CSS custom property, its type and its meaning
are protected. Its value can change in a minor release when the design improves, and the changelog says so. A value
change that breaks a guarantee this document or DESIGN.md makes (whole pixels, AA contrast for every checked pair,
what a role is for) counts as breaking.

**The JS module** (`@jaatster/blip-tokens`): `cssVar(name)`, `px(name, size?)`, `pixel`, `shared`, `schemes`,
`schemeNames`, `palettes`, `paletteNames`, and the types `SchemeName`, `PaletteName`, `PresetName`, `Palette`,
`PixelSize`, `SharedToken`, `RoleToken`, `TokenName` and `PixelToken`. The Kotlin and Swift files carry the presets
as `Palettes.<Name>.<Scheme>`, and the Figma variables as a `Palette` collection with a mode for each.

**Palettes are a value, not a name.** A preset's colours can change in a minor release like any token's value, as
long as every pair still passes AA; its name (`data-chu-palette="nord"`) is protected. A palette set on an element
other than `<html>` takes effect where that element also sets `data-chu-scheme`, because the scheme's roles are
worked out where the scheme is set.

## Theme switches

| Attribute or event | Values | |
|---|---|---|
| `data-chu-scheme` | `day`, `sunset`, `night` | On `<html>` or any element: the scheme of everything inside. With none set, the page is Day, or Night when the device is in dark mode. |
| `data-chu-motion` | `reduce` | On `<html>`: the person asked for less motion on this page, beside `prefers-reduced-motion`; `reducedMotion()` is true with either. Set and cleared by `<chu-motion-toggle>`, remembered in localStorage under `blip:motion`. |
| `data-chu-pixel` | `3`, `4` | On `<html>` or any element: the size of one pixel in CSS px. The default is 2, set on `:root`. |
| `data-chu-palette` | `grape`, `ember`, `azure`, `mint`, `bubblegum`, `dracula`, `nord`, `catppuccin`, `gruvbox`, `tokyo-night`, `rose-pine` | On `<html>`, or on an element with its own `data-chu-scheme`, with `@jaatster/blip-tokens/palettes.css` loaded: the accent of every scheme and Night's page, ink and sky. With none set, the palette is Candy. `<chu-world>` repaints when it changes. |
| `data-chu-scheme-fade` | present | Set on its target by `autoScheme()` once the time of day has changed (not with `fade: false`). While it is on `<html>`, the world backdrop steps its sky to a new scheme over a minute; every other colour changes in one step (see `data-chu-scheme-dither`). |
| `data-chu-scheme-dither` | present | Set on `<html>` by `autoScheme()` while a change of time of day dithers in (a view transition of three frames). Read it; do not set it. |
| `data-chu-scheme-auto` | present | Set by `autoScheme()` while it follows the clock. Read it; do not set it. |
| `chu-scheme-change` | `detail: { scheme }` | Fired on the target (bubbling) by `autoScheme()` when the time of day changes. |

## Building blocks

`@jaatster/blip-core/core.css` (and `core.min.css`), and `@jaatster/blip-core/layers.css` (the cascade-layer order, for a
page that also uses Tailwind or layered CSS of its own). These are what every component is built from, and you can
build from them too. Every size in them is counted in pixels except the type sizes, which follow the browser's
default text size.

| Kind | Public |
|---|---|
| **The candy box** | `.chu-box`. Its tier is `data-variant` (`candy` by default, `soft`, `outline`, `ghost`, `panel`); its colour is `data-tone` (`accent` by default, `info`, `success`, `warning`, `danger`, `neutral`, or a candy: `red`, `orange`, `yellow`, `green`, `teal`, `blue`, `purple`, `pink`, `slate`); its radius is `data-chu-r` or `.chu-r-N` (0 to 8). |
| **The box's custom properties** | Shape: `--chu-r` with `--chu-shape` and `--chu-shape-inner` (set the three together, or use `data-chu-r`); `--chu-shape-0` to `--chu-shape-8` and their `-inner` forms (the names, not their values). Bands and drop: `--chu-band-top`, `--chu-band-bottom`, `--chu-drop-size` (in pixels). Tone: `--chu-tone`, `--chu-tone-light`, `--chu-tone-shade`, `--chu-tone-on`, `--chu-tone-text`. What the tier paints: `--chu-box-outline`, `--chu-box-top`, `--chu-box-fill`, `--chu-box-bottom`, `--chu-box-text`, `--chu-box-glint`, `--chu-box-dither`. The focus ring's colours: `--chu-box-ring`, `--chu-box-ring-edge`. Read-only: `--chu-box-mask-size`, `--chu-box-mask-position`. |
| **States** | The box styles itself from native state and ARIA: `:hover`, `:active`, `:focus-visible`, `:disabled`, `aria-disabled`, `aria-busy`, `aria-pressed`, `aria-selected`, `aria-current`, `aria-expanded`, `aria-checked`, `aria-invalid`, and a checked input inside it. `data-chu-interactive` makes a box that is not a native control lift and press like one; `data-chu-pressed` shows it held down. |
| **Forced states** | `data-chu-state="hover focus active"` (any of the three) forces those looks, for docs, tests and screenshots. Never use it to show real state. |
| **Type** | `.chu-display` with `data-scale` (1 to 4) or `--chu-scale`; `.chu-pop` with `data-pop` (the same text), `data-tone`, `--chu-pop-tint`, `--chu-pop-drop`; `.chu-outline`; `.chu-label`, `.chu-title`, `.chu-lead`, `.chu-body`, `.chu-small`, `.chu-caption`, `.chu-muted`, `.chu-numeric`. |
| **Icons** | `.chu-icon` (12 pixels square), `data-size="lg"` (24). |
| **Motion** | `.chu-pop-in`, `.chu-drop-in` (with `--chu-delay`), `.chu-bump`, `.chu-shake`, `.chu-blink` (with `--chu-blink-count`), `.chu-bob` (with `--chu-bob-count`); `--chu-ease-2`, `--chu-ease-4`, `--chu-ease-6`. |
| **Utilities** | `.chu-sr-only`, `.chu-scrim`, `.chu-dither`, `.chu-pixelated` and `[data-pixelated]` on `img`, `canvas` or `svg`. |
| **Cascade layers** | `chu.reset`, `chu.tokens`, `chu.base`, `chu.core`, `chu.components`, `chu.kits`, `chu.utilities`, in that order (declared by `tokens.css`). Which layer a package's rules are in is public; their order and specificity inside a layer are not. `@jaatster/blip-core/layers.css`, imported first, declares `properties, theme, base, chu, components, utilities` and then the `chu.*` order, so all of Blip comes after Tailwind CSS v4's `properties`, `theme` and reset (`base`) and before its `components` and `utilities`; the order it declares is public. |
| **Fonts** | The family names `"Pixel Bop"`, `"Pixelify Sans"` and `"Blip Fallback"`; Pixel Bop's features `ss02` (Rounded 2x), `ss03` (Rounded 3x) and `locl` (Romanian); the files `@jaatster/blip-font/font.css`, `pixel-bop.woff2`, `pixel-bop-cyrillic.woff2`, `pixel-bop-greek.woff2`, `pixel-bop.ttf`, `pixelify-sans.woff2`, `pixelify-sans-cyrillic.woff2` and `pixelify-sans-greek.woff2`. |

## Components: classes, parts and attributes

The components of `@jaatster/blip-components` and the kits (`@jaatster/blip-game`, `@jaatster/blip-blocks`,
`@jaatster/blip-effects`) follow one naming scheme:

- **The component** is a class, `chu-<component>`, on the element that is the component, next to `chu-box` when it
  is a candy box: `<button class="chu-box chu-button">`.
- **Parts** are classes named `chu-<component>-<part>`: `chu-card-media`, `chu-card-title`, `chu-dialog-header`,
  `chu-dialog-close`, `chu-hero-title`, `chu-window-status`.
- **Options** are data attributes: `data-variant`, `data-tone`, `data-size` (`sm`, `md` by default, `lg`; a few
  components have more), `data-chu-r`, and the component's own (`data-icon-only`, `data-width`, `data-layout`,
  `data-align`, `data-side`, `data-fit`, `data-collapse`…). Booleans are present or absent.
- **State** is native attributes and ARIA (`disabled`, `aria-pressed`, `aria-current="page"`, `aria-invalid`,
  `aria-busy`…), so markup that is correct for assistive technology is also correctly styled.
- **Custom properties** of a component are `--chu-<component>-<thing>`: `--chu-sidebar-width`, `--chu-grid-min`,
  `--chu-card-media-ratio`, `--chu-card-art-width` and `--chu-card-art-height` (a card picture with
  `data-fit="pixels"`), `--chu-toast-duration`, `--chu-fab-offset`. Every public custom property that is not a token is listed in
  `@jaatster/blip-stylelint-config/public-properties.json`, the box's and the type's included.
- **One file per component**: `@jaatster/blip-components/<name>.css` (and `components.css` for all of them),
  `@jaatster/blip-game/<name>.css`, `@jaatster/blip-blocks/<name>.css`, `@jaatster/blip-effects/<name>.css`. One file is
  opt-in and not in `components.css`: `@jaatster/blip-components/popover-nub.css` (and `popover-nub.min.css`), the nub
  of an open popover, loaded with a `<link>` after the components because its anchored container queries are more
  than Vite 8's and Next.js 16's CSS tools parse. The file names are public.

Each component's classes, parts, attributes, states and custom properties are listed in the header comment of its
stylesheet and in its docs page (`packages/<package>/docs/<name>.md`, on the docs site under Components). Those
two are the contract for that component.

**For docs, tests and screenshots only**, and public in that they are stable: `data-chu-state`, `data-chu-static`
(a dialog, popover or toaster drawn in the page flow), `data-chu-typed` (a dialogue frozen at N letters) and
`data-frame` (a glint held at one frame).

**Set by elements**, public to read and style, not to set: `data-chu-closing` (a dialog or drawer on its way out),
`data-chu-leaving` (a toast on its way out) and the state attributes an element's docs describe.

**Effects attributes**: `data-chu-burst="<sparkle, coin, star, confetti>"` and `data-chu-burst-count` (a burst on
click), `data-chu-transition` on `<html>` (cross-document view transitions dither between pages), and
`data-chu-transition-run` (set by `transition()` while it runs).

## Elements

Web Components are light DOM: they add behaviour to markup that already renders, and the markup's classes are the
components' own. Each module defines its tag once (loading it twice is harmless). The Custom Elements Manifests are
the contract for them, and the source of the React wrappers' types:
`@jaatster/blip-elements/custom-elements.json`, `@jaatster/blip-game/custom-elements.json`,
`@jaatster/blip-effects/custom-elements.json` and `@jaatster/blip-icons/custom-elements.json` (each package's
`customElements` field points at it).

Conventions, for every element:

- **Tags** are `chu-<name>`. **Events** are `chu-<name>`: they bubble, cross shadow roots (`composed`), carry their
  data in `detail`, and are cancelable when they announce a change that can be refused.
- **Properties mirror their attributes** (`value`, `open`, `max`…); the table lists only the properties and
  methods that have no attribute.
- **Form-associated** elements (`<chu-combobox>`, `<chu-rating>`, `<chu-segmented>`, `<chu-wheel>`) take part in forms like native
  controls: name, value, validity, reset and a disabled fieldset.

<!-- elements: written by scripts/contract-elements.mjs from the Custom Elements Manifests. Run it after pnpm cem. -->
| Element | Module | Attributes | Other properties and methods | Events |
|---|---|---|---|---|
| `<chu-action-sheet>` | `@jaatster/blip-elements/action-sheet` | `open`, `light-dismiss` | `dialog`, `returnValue` (read-only), `show()`, `requestClose()`, `close()` | `chu-open`, `chu-before-close` (cancelable), `chu-close` |
| `<chu-combobox>` | `@jaatster/blip-elements/combobox` | `open`, `name`, `value`, `empty-text`, `toggle-label` | `form` (read-only), `checkValidity()`, `reportValidity()` | `chu-change`, `chu-open`, `chu-close` |
| `<chu-command>` | `@jaatster/blip-elements/command` | `open`, `shortcut` | `dialog`, `input`, `options` (read-only), `show()`, `close()` | `chu-action` (cancelable), `chu-open`, `chu-close` |
| `<chu-dialog>` | `@jaatster/blip-elements/dialog` | `open`, `light-dismiss` | `dialog`, `returnValue` (read-only), `show()`, `requestClose()`, `close()` | `chu-open`, `chu-before-close` (cancelable), `chu-close` |
| `<chu-drawer>` | `@jaatster/blip-elements/drawer` | `open`, `light-dismiss` | `dialog`, `returnValue` (read-only), `show()`, `requestClose()`, `close()` | `chu-open`, `chu-before-close` (cancelable), `chu-close` |
| `<chu-fab>` | `@jaatster/blip-elements/fab` | `open`, `data-position` | `trigger`, `menu`, `items` (read-only), `show()`, `close()` | `chu-action` (cancelable), `chu-open`, `chu-close` |
| `<chu-field>` | `@jaatster/blip-elements/field` | `count-text`, `role`, `data-layout` | | |
| `<chu-file-drop>` | `@jaatster/blip-elements/file-drop` | `remove-label` | `input`, `files` (read-only) | `chu-change`, `chu-reject` |
| `<chu-menu>` | `@jaatster/blip-elements/menu` | `open`, `data-align` | `trigger`, `menu`, `items` (read-only), `show()`, `close()` | `chu-action` (cancelable), `chu-open`, `chu-close` |
| `<chu-number>` | `@jaatster/blip-elements/number` | `decrease-label`, `increase-label` | `input` (read-only) | `chu-change` |
| `<chu-pager>` | `@jaatster/blip-elements/pager` | `prev-label`, `next-label`, `slide-label` | `index`, `track`, `slides` (read-only), `next()`, `prev()` | `chu-page` |
| `<chu-rating>` | `@jaatster/blip-elements/rating` | `value`, `max`, `readonly`, `disabled`, `required`, `name`, `required-message`, `star-label`, `data-shape` | `form`, `validity`, `validationMessage` (read-only), `checkValidity()`, `reportValidity()` | `chu-change` |
| `<chu-refresh>` | `@jaatster/blip-elements/refresh` | `pull-label`, `release-label`, `refreshing-label`, `done-label` | `refreshing`, `scroller` (read-only), `refresh()` | `chu-refresh` (cancelable) |
| `<chu-segmented>` | `@jaatster/blip-elements/segmented` | `value`, `disabled`, `required`, `name`, `required-message`, `data-size`, `data-width`, `data-tone` | `form`, `validity`, `validationMessage`, `items` (read-only), `checkValidity()`, `reportValidity()` | `chu-change` |
| `<chu-sheet>` | `@jaatster/blip-elements/sheet` | `open`, `light-dismiss` | `snap`, `snaps`, `dialog`, `returnValue` (read-only), `show()`, `requestClose()`, `close()` | `chu-change`, `chu-open`, `chu-before-close` (cancelable), `chu-close` |
| `<chu-swipe-row>` | `@jaatster/blip-elements/swipe-row` | `open` | `show()`, `close()` | `chu-open`, `chu-close`, `chu-swipe` (cancelable) |
| `<chu-table>` | `@jaatster/blip-elements/table` | | `selectedRows` (read-only), `sort()` | `chu-sort` (cancelable), `chu-select` |
| `<chu-tabs>` | `@jaatster/blip-elements/tabs` | `value`, `activation`, `data-variant`, `data-size` | `selectedIndex`, `list`, `tabs` (read-only) | `chu-change` |
| `<chu-tile-grid>` | `@jaatster/blip-elements/tile-grid` | `selection` | `tiles` (read-only), `select()` | `chu-select` (cancelable) |
| `<chu-toaster>` | `@jaatster/blip-elements/toast` | `data-side`, `data-align`, `max`, `dismiss-label`, `aria-label` | `add()` | |
| `<chu-tooltip>` | `@jaatster/blip-elements/tooltip` | `open`, `for`, `data-side` | `show()`, `close()` | `chu-open`, `chu-close` |
| `<chu-wheel>` | `@jaatster/blip-elements/wheel` | `value`, `disabled`, `name`, `data-type`, `data-size`, `data-width`, `data-tone`, `hours`, `minute-step`, `min`, `max` | `form` (read-only) | `chu-change` |
| `<chu-choices>` | `@jaatster/blip-game/choices` | | `choices` (read-only), `focus()` | `chu-action` |
| `<chu-counter>` | `@jaatster/blip-game/hud` | `value`, `label`, `pad`, `format`, `low`, `sound`, `quiet` | `format()` | |
| `<chu-dialogue>` | `@jaatster/blip-game/dialogue` | `voice`, `mood`, `speed`, `typing-label`, `next-label`, `done-label`, `data-font`, `data-chu-typed` | `pages`, `page`, `typing` (read-only), `say()`, `advance()`, `focus()` | `chu-next`, `chu-done` |
| `<chu-hearts>` | `@jaatster/blip-game/hud` | `value`, `max`, `label`, `quiet` | | |
| `<chu-inventory>` | `@jaatster/blip-game/inventory` | | `slots`, `selected` (read-only), `select()` | `chu-select` |
| `<chu-sprite>` | `@jaatster/blip-game/sprites` | `name`, `aria-label`, `data-tone` | | |
| `<chu-touch-pad>` | `@jaatster/blip-game/touch-pad` | `for`, `data-a`, `data-b`, `data-start`, `data-show`, `data-position`, `haptics` | | |
| `<chu-attract>` | `@jaatster/blip-effects/attract` | `script`, `label`, `pointer` | `steps` | |
| `<chu-drop-text>` | `@jaatster/blip-effects/text` | `data-pop`, `data-scale`, `data-tone` | `text`, `play()` | |
| `<chu-motion-toggle>` | `@jaatster/blip-effects/motion` | `label` | | |
| `<chu-typewriter>` | `@jaatster/blip-effects/text` | `blips`, `caret`, `mood`, `data-scale` | `text`, `play()`, `finish()` | `chu-typewriter-done` |
| `<chu-world>` | `@jaatster/blip-effects/world` | `scheme`, `parallax`, `clouds`, `stars`, `events`, `zoom`, `avoid` | | |
| `<chu-icon>` | `@jaatster/blip-icons/element` | `name`, `label`, `data-size` | | |
<!-- /elements -->

The element classes are exported too (`BlipTabs`, `BlipDialog`, `BlipWorld`…), with the types of their event
details, for subclassing and for TypeScript. The DOM an element adds to its markup (its ids, the scroll buttons of
an overflowing tab row, a toast's parts) is described in its docs; anything it adds that the docs do not describe
is private.

## JavaScript APIs

| Package | Public exports |
|---|---|
| `@jaatster/blip-core` | `BlipElement` (the base of every element: `static box`, `static classes`, `signal`, `static define()`, and for subclasses `connected()`, `disconnected()`, `emit()`, `on()`, `flag()`); the services `provide()`, `services` (`now()`, `random()`, `between()`, `sound()`), `seeded()` and the types `Services` and `SoundSink`; motion `reducedMotion()`, `steps()`, `duration()`, `pixel()`; timelines `run()`, `frames()`, `every()` and `Step`; schemes `autoScheme()`, `setScheme()`, `schemeAt()` and `Scheme`; diagnostics `warn()`, `checkName()`; the controllers `rovingFocus()` with `RovingOptions`, `typeahead()` and `dismiss()`. |
| `@jaatster/blip-elements` | One module per element (`@jaatster/blip-elements/<name>`), each defining its tag; the index defines them all. The element classes, `toast()`, and the types `ActionDetail`, `CloseDetail`, `CloseReason`, `PageDetail`, `RefreshDetail`, `SheetChangeDetail`, `SortDirection`, `SwipeDetail`, `SwipeSide`, `TabsChangeDetail`, `ToastHandle`, `ToastOptions`, `ToastTone`. |
| `@jaatster/blip-game` | The element classes; `sprite()`, `spriteNames`, `pixels()` (the sprites as SVG strings and pixel maps); `blipRate()`; the types `ChoiceDetail` and `SelectDetail`. |
| `@jaatster/blip-effects` | `burst()` with `BurstKind` and `BurstOptions`; `transition()` with `TransitionKind` (`dissolve`, `dither`, `mosaic`) and `TransitionOptions`; `drawWorld()` and `worldPalette()` with `WorldLayer`, `WorldPalette`, `WorldBox` and `DrawWorldOptions`; `AttractStep`; the element classes. |
| `@jaatster/blip-sound` | `enableSound()`, `disableSound()`, `soundOn()`, `rememberSound()`, `play()`, `synth()`, `SOUNDS`, `voiceRate()`, `voiced()`, and the types `SoundName`, `Note` and `Mood`. The sound names (`step`, `look`, `jump`, `coin`, `open`, `back`, `bump`, `blip`, `success`, `error`, `select`) are public. |
| `@jaatster/blip-icons` | `icons` (path data by name), `iconSvg()` with `IconSvgOptions`, the `IconName` type (every icon's name is public), `@jaatster/blip-icons/element` (`<chu-icon>`, `BlipIcon`), `sprite.svg` (symbols `chu-icon-<name>`), `svg/<name>.svg` and `icons.json`. |
| `@jaatster/blip-tokens` | See Tokens above. |
| `@jaatster/blip-react` | Every exported component, from `@jaatster/blip-react`, `/game`, `/blocks`, `/effects` and `/icons` (the list is in [packages/react/README.md](packages/react/README.md)), and its props: the documented attributes as typed props (`variant`, `tone`, `size`, and `radius` for `data-chu-r`), states as their ARIA (`busy` is `aria-busy`, `pressed` is `aria-pressed`), `on<Event>` for each `chu-<event>` with its typed `detail`, and refs to the element or to the native control. `toast()`. React 18.3 and 19. |
| `@jaatster/blip-stylelint-config` | The config, `@jaatster/blip-stylelint-config/plugin`, the rules `blip/no-raw-color` (options `ignoreProperties`, `maskProperties`), `blip/whole-pixels` (`allow`, `ignoreProperties`), `blip/stepped-motion` and `blip/known-tokens` (`allow`), and `public-properties.json`. A rule that starts reporting something it used to allow is an incompatible change. |

The documented entry points are public: each package's `exports` map, the modules and files this document and the
docs name, and the paths those point at in the package (a CDN loads files by path, as `dist/css/tokens.css`). So are
the native token files in `@jaatster/blip-tokens/dist/android` and `dist/ios`. Other files in `dist/`, such as the
`*.bundle.js` builds, are not, even where a wildcard export reaches them.

## Private

These can change in any release, without notice:

- **Custom properties that start with `--_`**, including the box's `--_p`, `--_t` and every `--_chu-*` name.
- **Files and modules that start with `_`**: `_control.css`, `_choice.css`, `_feedback.css`, `_world.css`,
  `_overlay.ts`, `_pixel.ts`, `_pixels.ts`, and anything they export that a public module does not re-export (the
  `Overlay` base class included).
- **Anything not documented**: a class, part, attribute or custom property that is in the CSS but not in the
  component's header comment or docs page; DOM an element adds that its docs do not describe.
- **How things are drawn**: the values of the shape masks, the order of rules inside a layer, specificity,
  `@keyframes` names, and visual details the docs do not state (where a glint falls, the pixels of a glyph). The
  rules in DESIGN.md are not details: breaking one is breaking the contract.
- **The wording of messages**: diagnostic codes are public, their text is not.
- **Everything that is not a package**: the docs site and its `docs-*` classes, Storybook, the specimen, the tests,
  `scripts/` and the build tools' internals.

## Deprecation policy

1. **Deprecate before removing.** A public name that is going away is first marked deprecated, in its docs and in
   the changelog, with its replacement. Where the platform allows, the old name keeps working as an alias of the
   new one: a custom property that reads the new one, a selector that matches both, an export under both names.
2. **Then wait a release.** A deprecated name is removed no earlier than the next major release from 1.0 (the next
   minor while the package is 0.x), and never in the release that deprecates it.
3. **Say how to move.** The changelog entry for the removal says what to change, and a changeset of the right size
   goes with it.
4. **Diagnostic codes are never reused.** A code that is retired stays retired; a renamed one is listed in the
   changelog.

Security fixes are the exception: they may change behaviour in a patch release when keeping it would leave people
exposed (see [SECURITY.md](SECURITY.md)).

## Diagnostics

Blip explains problems with a code and a link. In the browser, `warn()` from `@jaatster/blip-core` logs
`Blip CHU-A001: <message>` and `https://jaatster.com/blip/diagnostics/#chu-a001`, once per code and message. Warnings
are on when `globalThis.BLIP_DIAGNOSTICS` is `true`, or on localhost when it is not set; `false` turns them off.
`<chu-icon>` reports an unknown name itself, once per name. The token build prints each problem with its code, the
file, the place in it (a JSON pointer) and the fix, and fails.

The codes are public. Each prefix is a range, numbered in tens by topic:

<!-- diagnostics: written by scripts/diagnostics.mjs from the source. Run it after adding or retiring a code. -->
| Range | Raised by | Covers | Codes today |
|---|---|---|---|
| `CHU-T` | The token build and `blip-tokens` | Reading the token files and the resolver (`CHU-T003` also: a resolver with no `scheme` or `pixel` modifier; `CHU-T005` a palette that sets a token the default palette does not have), token names, types, values (colours, dimensions, durations, whole pixels, font families and weights), aliases, and contrast, in every scheme of every palette: `CHU-T060` a text pair under AA, labels on a disabled control's dither included; `CHU-T061` the focus ring under 3:1; `CHU-T062` a candy's label, and white on slate's ink dither | `CHU-T001` to `CHU-T005`, `CHU-T010`, `CHU-T020` and `CHU-T021`, `CHU-T030` to `CHU-T032`, `CHU-T040` to `CHU-T045`, `CHU-T050` to `CHU-T052`, `CHU-T060` to `CHU-T062` |
| `CHU-A` | `checkName()` in `@jaatster/blip-core`, `<chu-pager>`, `<chu-rating>`, `<chu-segmented>`, `<chu-action-sheet>`, `<chu-dialog>`, `<chu-drawer>`, `<chu-sheet>` | Accessibility: a control or a dialog without an accessible name | `CHU-A001`, `CHU-A010` |
| `CHU-E` | `<chu-combobox>`, `<chu-file-drop>`, `<chu-number>`, `<chu-action-sheet>`, `<chu-dialog>`, `<chu-drawer>`, `<chu-sheet>`, `<chu-tooltip>` | An element without the native markup it upgrades: a control, a `<dialog>`, a tooltip's trigger | `CHU-E001`, `CHU-E010`, `CHU-E020` |
| `CHU-N` | `<chu-tabs>`, `<chu-pager>` | A navigation element without the parts it wires together | `CHU-N001` and `CHU-N002` |
| `CHU-M` | `<chu-fab>`, `<chu-menu>` | A menu without its button or its list | `CHU-M001` |
| `CHU-C` | `<chu-command>` | A command palette without its `<dialog>`, input or list | `CHU-C001` |
| `CHU-W` | `<chu-world>` | The world backdrop: no world colours (`tokens.css` is not loaded), an `avoid` that is not a selector list | `CHU-W001` and `CHU-W002` |
| `CHU-D` | `<chu-attract>` | An attract demo: no `label`, a step it cannot read, a step whose selector matches nothing in it | `CHU-D001`, `CHU-D010` and `CHU-D011` |
| `CHU-I` | `<chu-icon>` | An icon name that does not exist | `CHU-I001` |
<!-- /diagnostics -->

Every code, with what it means and how to fix it, is on the [diagnostics page](https://jaatster.com/blip/diagnostics/),
which reads the codes from the source when the site builds.
