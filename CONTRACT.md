# The Blip contract

This is the public API of Blip: what you can build on, and what semantic versioning protects. Everything listed
here changes incompatibly only in a major release, after a deprecation (see the policy below). Everything else is
private and can change in any release.

Every package has its own version. **While a package is 0.x, an incompatible change to its part of the contract is
a minor release**, and the changelog says what changed and what to do; from 1.0 it is a major release. All packages
are 0.x today (0.1.0, and 0.2.0 for `@jaatster/blip-font`).

The rule of thumb: **if it is documented, it is public.** A component's public API is what its `docs/<name>.md`
and the header comment of its stylesheet describe. An element's is its Custom Elements Manifest. A token's is its
entry in the token manifest.

## Tokens and their custom properties

The source of truth is generated with every build and ships with `@jaatster/blip-tokens`:

- **`@jaatster/blip-tokens/manifest.json`**: every token, with its name, its DTCG path, its CSS custom property, its
  type, its description, and whether it changes with the scheme. 290 tokens today.
- **`@jaatster/blip-tokens/tokens.json`**: the resolved values, shared and per scheme.
- **`@jaatster/blip-tokens/tokens.css`**: the custom properties themselves, in `@layer pp.tokens`.
- **`@jaatster/blip-tokens/resolver`** and **`@jaatster/blip-tokens/src/*`**: the DTCG 2025.10 sources and resolver.
- The JS module, the Figma variables (`@jaatster/blip-tokens/figma/variables.json`), and the Kotlin (Compose), Swift
  and Android XML files in `dist/` carry the same names in each platform's case (`--pp-candy-red` is
  `candyRed` in Swift).

| Family | Count | Custom properties | Changes with |
|---|---|---|---|
| Ink and white | 3 | `--pp-ink`, `--pp-ink-soft`, `--pp-white` | |
| Candies | 30 | `--pp-candy-<red, orange, yellow, green, teal, blue, purple, pink, slate, cream>`, each with `-light` and `-shade` | |
| Night surfaces | 5 | `--pp-deep-1` to `--pp-deep-5` | |
| Text tones | 9 | `--pp-tone-accent-day`, `--pp-tone-accent-sunset`, `--pp-tone-accent-night`, `--pp-tone-star`, `--pp-tone-danger-light`… | |
| World | 98 | `--pp-world-<day, sunset, night>-<sky-1…6, cloud-*, mountain-*, snow-*, tree-*, hill-*, grass-*, dirt-*, bird>`, `--pp-world-sky-*`, `--pp-world-flower-1` to `-4` | |
| Scheme roles | 43 | `--pp-bg`, `--pp-surface`, `--pp-surface-raised`, `--pp-surface-sunken`, `--pp-surface-panel`, `--pp-text`, `--pp-text-muted`, `--pp-text-inverse`, `--pp-line`, `--pp-line-soft`, `--pp-outline`, `--pp-drop`, `--pp-focus`, `--pp-focus-edge`, `--pp-<accent, info, success, warning, danger>` each with `-light`, `-shade`, `-text`, `-on`, `--pp-selection-bg`, `--pp-selection-text`, `--pp-scrim`, `--pp-link-visited` | scheme |
| Scene | 21 | `--pp-scene-sky-1` to `-6`, `--pp-scene-cloud-*`, `--pp-scene-mountain-*`, `--pp-scene-hill-*`, `--pp-scene-grass-*`, `--pp-scene-dirt-*`: the world's colours for the current time of day | scheme |
| The pixel | 1 | `--pp-pixel` | pixel |
| Sizes in pixels | 27 | `--pp-space-<0, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32>`, `--pp-radius-0` to `-6`, `--pp-control-<sm, md, lg>`, `--pp-icon-<md, lg>`, `--pp-line-<outline, focus, drop>`, `--pp-target-min` | pixel |
| Breakpoints and layers | 9 | `--pp-breakpoint-<medium, wide>`, `--pp-layer-<raised, sticky, dropdown, overlay, modal, toast, tooltip>` | |
| Motion | 23 | `--pp-duration-*` (15), `--pp-steps-<2, 4, 6, dissolve, scheme>`, `--pp-delay-<hover, leave, toast>` | reduced motion: every duration is 0 ms |
| Type | 21 | `--pp-font-<display, ui, mono>`, `--pp-weight-<regular, medium, bold>`, `--pp-display-scale-1` to `-4`, `--pp-size-<caption, small, body, lead, title>`, `--pp-leading-<tight, normal, display, display-loose>`, `--pp-tracking-<none, label>` | |

**Names are the contract; values are design.** A token's name, its CSS custom property, its type and its meaning
are protected. Its value can change in a minor release when the design improves, and the changelog says so. A value
change that breaks a guarantee this document or DESIGN.md makes (whole pixels, AA contrast for every checked pair,
what a role is for) counts as breaking.

**The JS module** (`@jaatster/blip-tokens`): `cssVar(name)`, `px(name, size?)`, `pixel`, `shared`, `schemes`,
`schemeNames`, and the types `SchemeName`, `PixelSize`, `SharedToken`, `RoleToken`, `TokenName` and `PixelToken`.

## Theme switches

| Attribute or event | Values | |
|---|---|---|
| `data-pp-scheme` | `day`, `sunset`, `night` | On `<html>` or any element: the scheme of everything inside. With none set, the page is Day, or Night when the device is in dark mode. |
| `data-pp-pixel` | `3`, `4` | On `<html>` or any element: the size of one pixel in CSS px. The default is 2, set on `:root`. |
| `data-pp-scheme-fade` | present | Steps the scheme colours from one palette to the next over a minute when the scheme changes. `autoScheme()` sets it. |
| `data-pp-scheme-auto` | present | Set by `autoScheme()` while it follows the clock. Read it; do not set it. |
| `pp-scheme-change` | `detail: { scheme }` | Fired on the target (bubbling) by `autoScheme()` when the time of day changes. |

## Building blocks

`@jaatster/blip-core/core.css` (and `core.min.css`). These are what every component is built from, and you can build
from them too.

| Kind | Public |
|---|---|
| **The candy box** | `.pp-box`. Its tier is `data-variant` (`candy` by default, `soft`, `outline`, `ghost`, `panel`); its colour is `data-tone` (`accent` by default, `info`, `success`, `warning`, `danger`, `neutral`, or a candy: `red`, `orange`, `yellow`, `green`, `teal`, `blue`, `purple`, `pink`, `slate`); its radius is `data-pp-r` or `.pp-r-N` (0 to 8). |
| **The box's custom properties** | Shape: `--pp-r` with `--pp-shape` and `--pp-shape-inner` (set the three together, or use `data-pp-r`); `--pp-shape-0` to `--pp-shape-8` and their `-inner` forms (the names, not their values). Bands and drop: `--pp-band-top`, `--pp-band-bottom`, `--pp-drop-size` (in pixels). Tone: `--pp-tone`, `--pp-tone-light`, `--pp-tone-shade`, `--pp-tone-on`, `--pp-tone-text`. What the tier paints: `--pp-box-outline`, `--pp-box-top`, `--pp-box-fill`, `--pp-box-bottom`, `--pp-box-text`, `--pp-box-glint`, `--pp-box-dither`. The focus ring's colours: `--pp-box-ring`, `--pp-box-ring-edge`. Read-only: `--pp-box-mask-size`, `--pp-box-mask-position`. |
| **States** | The box styles itself from native state and ARIA: `:hover`, `:active`, `:focus-visible`, `:disabled`, `aria-disabled`, `aria-busy`, `aria-pressed`, `aria-selected`, `aria-current`, `aria-expanded`, `aria-checked`, `aria-invalid`, and a checked input inside it. `data-pp-interactive` makes a box that is not a native control lift and press like one; `data-pp-pressed` shows it held down. |
| **Forced states** | `data-pp-state="hover focus active"` (any of the three) forces those looks, for docs, tests and screenshots. Never use it to show real state. |
| **Type** | `.pp-display` with `data-scale` (1 to 4) or `--pp-scale`; `.pp-pop` with `data-pop` (the same text), `data-tone`, `--pp-pop-tint`, `--pp-pop-drop`; `.pp-outline`; `.pp-label`, `.pp-title`, `.pp-lead`, `.pp-body`, `.pp-small`, `.pp-caption`, `.pp-muted`, `.pp-numeric`. |
| **Icons** | `.pp-icon` (12 pixels square), `data-size="lg"` (24). |
| **Motion** | `.pp-pop-in`, `.pp-drop-in` (with `--pp-delay`), `.pp-bump`, `.pp-shake`, `.pp-blink` (with `--pp-blink-count`), `.pp-bob` (with `--pp-bob-count`); `--pp-ease-2`, `--pp-ease-4`, `--pp-ease-6`. |
| **Utilities** | `.pp-sr-only`, `.pp-scrim`, `.pp-dither`, `.pp-pixelated` and `[data-pixelated]` on `img`, `canvas` or `svg`. |
| **Cascade layers** | `pp.reset`, `pp.tokens`, `pp.base`, `pp.core`, `pp.components`, `pp.kits`, `pp.utilities`, in that order (declared by `tokens.css`). Which layer a package's rules are in is public; their order and specificity inside a layer are not. |
| **Fonts** | The family names `"Pixel Bop"` and `"Pixelify Sans"`; Pixel Bop's features `ss02` (Rounded 2x), `ss03` (Rounded 3x) and `locl` (Romanian); the files `@jaatster/blip-font/font.css`, `pixel-bop.woff2`, `pixel-bop.ttf` and `pixelify-sans.woff2`. |

## Components: classes, parts and attributes

The components of `@jaatster/blip-components` and the kits (`@jaatster/blip-game`, `@jaatster/blip-blocks`,
`@jaatster/blip-effects`) follow one naming scheme:

- **The component** is a class, `pp-<component>`, on the element that is the component, next to `pp-box` when it
  is a candy box: `<button class="pp-box pp-button">`.
- **Parts** are classes named `pp-<component>-<part>`: `pp-card-media`, `pp-card-title`, `pp-dialog-header`,
  `pp-dialog-close`, `pp-hero-title`, `pp-window-status`.
- **Options** are data attributes: `data-variant`, `data-tone`, `data-size` (`sm`, `md` by default, `lg`; a few
  components have more), `data-pp-r`, and the component's own (`data-icon-only`, `data-width`, `data-layout`,
  `data-align`, `data-side`, `data-placement`, `data-collapse`…). Booleans are present or absent.
- **State** is native attributes and ARIA (`disabled`, `aria-pressed`, `aria-current="page"`, `aria-invalid`,
  `aria-busy`…), so markup that is correct for assistive technology is also correctly styled.
- **Custom properties** of a component are `--pp-<component>-<thing>`: `--pp-sidebar-width`, `--pp-grid-min`,
  `--pp-card-media-ratio`, `--pp-toast-duration`. Every public custom property that is not a token is listed in
  `@jaatster/blip-stylelint-config/public-properties.json` (119 today, the box's and the type's included).
- **One file per component**: `@jaatster/blip-components/<name>.css` (and `components.css` for all of them),
  `@jaatster/blip-game/<name>.css`, `@jaatster/blip-blocks/<name>.css`, `@jaatster/blip-effects/<name>.css`. The file names are
  public.

Each component's classes, parts, attributes, states and custom properties are listed in the header comment of its
stylesheet and in its docs page (`packages/<package>/docs/<name>.md`, on the docs site under Components). Those
two are the contract for that component.

**For docs, tests and screenshots only**, and public in that they are stable: `data-pp-state`, `data-pp-static`
(a dialog, popover or toaster drawn in the page flow), `data-pp-typed` (a dialogue frozen at N letters) and
`data-frame` (a glint held at one frame).

**Set by elements**, public to read and style, not to set: `data-pp-closing` (a dialog or drawer on its way out),
`data-pp-leaving` (a toast on its way out) and the state attributes an element's docs describe.

**Effects attributes**: `data-pp-burst="<sparkle, coin, star, confetti>"` and `data-pp-burst-count` (a burst on
click), `data-pp-transition` on `<html>` (cross-document view transitions dither between pages), and
`data-pp-transition-run` (set by `transition()` while it runs).

## Elements

Web Components are light DOM: they add behaviour to markup that already renders, and the markup's classes are the
components' own. Each module defines its tag once (loading it twice is harmless). The Custom Elements Manifests are
the contract for them, and the source of the React wrappers' types:
`@jaatster/blip-elements/custom-elements.json`, `@jaatster/blip-game/custom-elements.json`,
`@jaatster/blip-effects/custom-elements.json` and `@jaatster/blip-icons/custom-elements.json` (each package's
`customElements` field points at it).

Conventions, for every element:

- **Tags** are `pp-<name>`. **Events** are `pp-<name>`: they bubble, cross shadow roots (`composed`), carry their
  data in `detail`, and are cancelable when they announce a change that can be refused.
- **Properties mirror their attributes** (`value`, `open`, `selected`…); the table lists only the properties and
  methods that have no attribute.
- **Form-associated** elements (`<pp-combobox>`, `<pp-rating>`, `<pp-segmented>`) take part in forms like native
  controls: name, value, validity, reset and a disabled fieldset.

| Element | Module | Attributes | Other properties and methods | Events |
|---|---|---|---|---|
| `<pp-combobox>` | `@jaatster/blip-elements/combobox` | `open`, `name`, `value`, `empty-text`, `toggle-label` | `form` (read-only), `checkValidity()`, `reportValidity()` | `pp-change` |
| `<pp-command>` | `@jaatster/blip-elements/command` | `shortcut` | `dialog`, `input`, `options`, `open` (read-only), `show()`, `close()` | `pp-select` (cancelable) |
| `<pp-dialog>` | `@jaatster/blip-elements/dialog` | `open`, `light-dismiss` | `dialog`, `returnValue` (read-only), `show()`, `requestClose()`, `close()` | `pp-open`, `pp-before-close` (cancelable), `pp-close` |
| `<pp-drawer>` | `@jaatster/blip-elements/drawer` | `open`, `light-dismiss` | `dialog`, `returnValue` (read-only), `show()`, `requestClose()`, `close()` | `pp-open`, `pp-before-close` (cancelable), `pp-close` |
| `<pp-field>` | `@jaatster/blip-elements/field` | `count-text`, `role`, `data-layout` | | |
| `<pp-file-drop>` | `@jaatster/blip-elements/file-drop` | `remove-label` | `input`, `files` (read-only) | `pp-change`, `pp-reject` |
| `<pp-menu>` | `@jaatster/blip-elements/menu` | `data-align` | `trigger`, `menu`, `items`, `open` (read-only), `show()`, `close()` | `pp-select` (cancelable) |
| `<pp-number>` | `@jaatster/blip-elements/number` | `decrease-label`, `increase-label` | `input` (read-only) | `pp-change` |
| `<pp-rating>` | `@jaatster/blip-elements/rating` | `value`, `max`, `readonly`, `disabled`, `required`, `name`, `required-message`, `star-label`, `data-shape` | `form`, `validity`, `validationMessage` (read-only), `checkValidity()`, `reportValidity()` | `pp-change` |
| `<pp-segmented>` | `@jaatster/blip-elements/segmented` | `value`, `disabled`, `required`, `name`, `required-message`, `data-size`, `data-width`, `data-tone` | `form`, `validity`, `validationMessage`, `items` (read-only), `checkValidity()`, `reportValidity()` | `pp-change` |
| `<pp-table>` | `@jaatster/blip-elements/table` | | `selectedRows` (read-only), `sort()` | `pp-sort` (cancelable), `pp-select` |
| `<pp-tabs>` | `@jaatster/blip-elements/tabs` | `selected`, `activation`, `data-variant`, `data-size` | `list`, `tabs` (read-only) | `pp-change` |
| `<pp-tile-grid>` | `@jaatster/blip-elements/tile-grid` | `selection` | `tiles` (read-only), `select()` | `pp-select` (cancelable) |
| `<pp-toaster>` | `@jaatster/blip-elements/toast` | `data-placement`, `max`, `dismiss-label`, `aria-label` | `add()` | |
| `<pp-tooltip>` | `@jaatster/blip-elements/tooltip` | `for`, `placement` | `show()`, `hide()` | |
| `<pp-choices>` | `@jaatster/blip-game/choices` | | `choices` (read-only), `focus()` | `pp-choice` |
| `<pp-dialogue>` | `@jaatster/blip-game/dialogue` | `voice`, `mood`, `speed`, `typing-label`, `next-label`, `done-label`, `data-font`, `data-pp-typed` | `pages`, `page`, `typing` (read-only), `say()`, `advance()`, `focus()` | `pp-next`, `pp-done` |
| `<pp-counter>` | `@jaatster/blip-game/hud` | `value`, `label`, `pad`, `format`, `low`, `sound`, `quiet` | `format()` | |
| `<pp-hearts>` | `@jaatster/blip-game/hud` | `value`, `max`, `label`, `quiet` | | |
| `<pp-inventory>` | `@jaatster/blip-game/inventory` | | `slots`, `selected` (read-only), `select()` | `pp-select` |
| `<pp-sprite>` | `@jaatster/blip-game/sprites` | `name`, `aria-label`, `data-tone` | | |
| `<pp-drop-text>` | `@jaatster/blip-effects/text` | `data-pop`, `data-scale`, `data-tone` | `text`, `play()` | |
| `<pp-typewriter>` | `@jaatster/blip-effects/text` | `blips`, `caret`, `mood`, `data-scale` | `text`, `play()`, `finish()` | `pp-typewriter-done` |
| `<pp-world>` | `@jaatster/blip-effects/world` | `scheme`, `parallax`, `clouds`, `stars`, `events`, `zoom` | | |
| `<pp-icon>` | `@jaatster/blip-icons/element` | `name`, `label`, `data-size` | | |

The element classes are exported too (`PixelTabs`, `PixelDialog`, `PixelWorld`…), with the types of their event
details, for subclassing and for TypeScript. The DOM an element adds to its markup (its ids, the scroll buttons of
an overflowing tab row, a toast's parts) is described in its docs; anything it adds that the docs do not describe
is private.

## JavaScript APIs

| Package | Public exports |
|---|---|
| `@jaatster/blip-core` | `PixelElement` (the base of every element: `static box`, `static classes`, `signal`, `static define()`, and for subclasses `connected()`, `disconnected()`, `emit()`, `on()`, `flag()`); the services `provide()`, `services` (`now()`, `random()`, `between()`, `sound()`), `seeded()` and the types `Services` and `SoundSink`; motion `reducedMotion()`, `steps()`, `duration()`, `pixel()`; timelines `run()`, `frames()`, `every()` and `Step`; schemes `autoScheme()`, `setScheme()`, `schemeAt()` and `Scheme`; diagnostics `warn()`, `checkName()`; the controllers `rovingFocus()` with `RovingOptions`, `typeahead()` and `dismiss()`. |
| `@jaatster/blip-elements` | One module per element (`@jaatster/blip-elements/<name>`), each defining its tag; the index defines them all. The element classes, `toast()`, and the types `ToastOptions`, `ToastHandle`, `ToastTone`, `CloseDetail`, `CloseReason`, `CommandSelectDetail`, `MenuSelectDetail`, `TabsChangeDetail`, `SortDirection`. |
| `@jaatster/blip-game` | The element classes; `sprite()`, `spriteNames`, `pixels()` (the sprites as SVG strings and pixel maps); `blipRate()`; the types `ChoiceDetail` and `SelectDetail`. |
| `@jaatster/blip-effects` | `burst()` with `BurstKind` and `BurstOptions`; `transition()` with `TransitionKind` (`dissolve`, `dither`, `mosaic`) and `TransitionOptions`; `drawWorld()` and `worldPalette()` with `WorldLayer`, `WorldPalette` and `DrawWorldOptions`; the element classes. |
| `@jaatster/blip-sound` | `enableSound()`, `disableSound()`, `soundOn()`, `rememberSound()`, `play()`, `synth()`, `SOUNDS`, `voiceRate()`, `voiced()`, and the types `SoundName`, `Note` and `Mood`. The sound names (`step`, `look`, `jump`, `coin`, `open`, `back`, `bump`, `blip`, `success`, `error`, `select`) are public. |
| `@jaatster/blip-icons` | `icons` (path data by name), `iconSvg()` with `IconSvgOptions`, the `IconName` type (every icon's name is public), `@jaatster/blip-icons/element` (`<pp-icon>`, `PixelIcon`), `sprite.svg` (symbols `pp-icon-<name>`), `svg/<name>.svg` and `icons.json`. |
| `@jaatster/blip-tokens` | See Tokens above. |
| `@jaatster/blip-react` | Every exported component, from `@jaatster/blip-react`, `/game`, `/blocks`, `/effects` and `/icons` (the list is in [packages/react/README.md](packages/react/README.md)), and its props: the documented attributes as typed props (`variant`, `tone`, `size`, and `radius` for `data-pp-r`), states as their ARIA (`busy` is `aria-busy`, `pressed` is `aria-pressed`), `on<Event>` for each `pp-<event>` with its typed `detail`, and refs to the element or to the native control. `toast()`. React 18.3 and 19. |
| `@jaatster/blip-stylelint-config` | The config, `@jaatster/blip-stylelint-config/plugin`, the rules `blip/no-raw-color` (options `ignoreProperties`, `maskProperties`), `blip/whole-pixels` (`allow`, `ignoreProperties`), `blip/stepped-motion` and `blip/known-tokens` (`allow`), and `public-properties.json`. A rule that starts reporting something it used to allow is an incompatible change. |

The documented entry points are public: each package's `exports` map, the modules and files this document and the
docs name, and the paths those point at in the package (a CDN loads files by path, as `dist/css/tokens.css`). So are
the native token files in `@jaatster/blip-tokens/dist/android` and `dist/ios`. Other files in `dist/`, such as the
`*.bundle.js` builds, are not, even where a wildcard export reaches them.

## Private

These can change in any release, without notice:

- **Custom properties that start with `--_`**, including the box's `--_p`, `--_t` and every `--_pp-*` name.
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
`Blip PP-A001: <message>` and `https://jaatster.com/blip/diagnostics#pp-a001`, once per code and message. Warnings
are on when `globalThis.BLIP_DIAGNOSTICS` is `true`, or on localhost when it is not set; `false` turns them off.
`<pp-icon>` reports an unknown name itself, once per name. The token build prints each problem with its code, the
file, the place in it (a JSON pointer) and the fix, and fails.

The codes are public. Each prefix is a range, numbered in tens by topic:

| Range | Raised by | Covers | Codes today |
|---|---|---|---|
| `PP-T` | The token build | Reading the files and the resolver, token names, types, values (colours, dimensions, durations, whole pixels, font families and weights), aliases, and contrast | `PP-T001` to `PP-T004`, `PP-T010`, `PP-T020` and `PP-T021`, `PP-T030` to `PP-T032`, `PP-T040` to `PP-T045`, `PP-T050` to `PP-T052`, `PP-T060` (a text pair under AA), `PP-T061` (the focus ring under 3:1) |
| `PP-A` | Elements | Accessibility: a missing accessible name, a dialog without a name | `PP-A001`, `PP-A010` |
| `PP-E` | Elements | An element without the native markup it upgrades: a control, a `<dialog>`, a tooltip's trigger | `PP-E001`, `PP-E010`, `PP-E020` |
| `PP-N` | Navigation elements | A navigation element without the parts it wires together | `PP-N001` (tabs without a tab list) |
| `PP-W` | The world backdrop | No world colours: `tokens.css` is not loaded | `PP-W001` |
| `PP-I` | Icons | An icon name that does not exist | `PP-I001` |

Every code, with what it means and how to fix it, is on the [diagnostics page](https://jaatster.com/blip/diagnostics/),
which reads the codes from the source when the site builds.
