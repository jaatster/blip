# Contributing to Blip

Thank you for helping. Blip is one world with strict rules, so a contribution is mostly a matter of following
them: [AUTHORING.md](AUTHORING.md) says how to build things, [DESIGN.md](DESIGN.md) says what they must look like
and why, and [CONTRACT.md](CONTRACT.md) says what users depend on. Read AUTHORING.md before you write CSS.

By taking part you agree to the [Code of Conduct](CODE_OF_CONDUCT.md). Report security problems privately, as
[SECURITY.md](SECURITY.md) describes, not in issues.

For anything large (a new kit, a new token family, a change to the candy box, anything that breaks the public
contract) open an issue first, so the design can be agreed before the work.

## Set up

You need:

- **Node 22.11 or later** (CI uses Node 26).
- **pnpm 10.11.0**, the version in `package.json`'s `packageManager`. `corepack enable` gives you the right one.
- **Python 3** for the font build (CI uses 3.14), with fontTools and Brotli in a virtual environment at
  `.tools/venv`, where the font package looks for them.
- **Playwright's Chromium** for the tests and screenshots.

```sh
pnpm install
python3 -m venv .tools/venv && .tools/venv/bin/pip install fonttools==4.68.0 brotli==1.2.1
pnpm --filter @jaatster/blip-tests exec playwright install chromium
pnpm build
```

`.tools/` is ignored by git: it holds the virtual environment, screenshots and other scratch work.

## Where things are

| Path | Holds |
|---|---|
| `packages/tokens` | The DTCG token sources (`src/`), the resolver, and the build that validates them and writes every output. |
| `packages/core` | The building blocks: the candy box (`src/css/box.css`), type, motion, base styles; `BlipElement` and the shared behaviours. |
| `packages/components` | The core components: `src/<name>.css`, `examples/<name>.html`, `docs/<name>.md`. |
| `packages/elements` | The Web Components for core components: `src/<name>.ts`, and `custom-elements.json`. |
| `packages/game`, `blocks`, `effects`, `sound` | The kits, laid out like the components; kits keep their own elements. |
| `packages/icons`, `packages/font` | Pixel maps (`src/*.icons`, `src/pixel-bop.glyphs`) and the builds that turn them into SVG and fonts. |
| `packages/react` | The React wrappers: generated for elements, written by hand for CSS components. |
| `packages/stylelint-config` | The lint rules and the list of public custom properties. |
| `apps/docs`, `apps/storybook` | The docs site and Storybook, both generated from the packages' files. |
| `tests` | Unit tests (Vitest), visual tests and accessibility scans (Playwright). |
| `scripts` | The shared build tools, the static server, the gallery and the screenshot tool. |
| `specimen` | The specimen and the gallery page every example is checked on. |

## Commands

| Command | What it does |
|---|---|
| `pnpm build` | Builds every package and reports sizes. |
| `pnpm --filter @jaatster/blip-<package> build` | Builds one package. |
| `pnpm build:tokens` | Builds the tokens only. `pnpm --filter @jaatster/blip-tokens check` validates them and checks contrast without writing. |
| `node scripts/serve.mjs [path] [--port 4173]` | Serves the repository root at http://localhost:4173, so pages can load `packages/*/dist`. `pnpm specimen` opens the specimen. |
| `node scripts/gallery.mjs` | Rewrites `specimen/gallery.json` after you add a stylesheet, module or example. The gallery is `/specimen/gallery.html?only=button,tabs&scheme=night`. |
| `pnpm shoot` | Draws the social card, `specimen/press.html` (`?scheme=night`, `?palette=grape`), at 1200 x 630 in Playwright's Chromium, with the tests' frozen clock and seed and reduced motion, and saves it as `apps/docs/public/og.png` and `og-night.png`. The same build gives the same bytes. It uses the server on port 4173 if that serves this checkout, and starts its own otherwise (`CHU_SHOOT_PORT`, 4181). |
| `node scripts/shoot.mjs <dir> "<path>=<name>" … [--width 1280] [--height 900] [--full] [--scale 1]` | Screenshots pages of the running server, with reduced motion. It uses Chrome if it is installed (`CHU_BROWSER` picks another channel), Playwright's Chromium otherwise. |
| `pnpm test` | Unit tests: build tools and pure functions in Node, everything that needs a DOM in Chromium. |
| `pnpm test:visual` | Every example in Day, Sunset and Night at 1280 px (and the responsive ones at 390 px), compared pixel for pixel with the baselines. |
| `pnpm --filter @jaatster/blip-tests test:visual:update` | Writes new baselines. Look at every changed picture before you commit it. |
| `pnpm --filter @jaatster/blip-tests test:a11y` | axe, WCAG 2.2 AA, on every example in Day and Night. |
| `pnpm test:react` | The React wrappers in jsdom, under React 19 and React 18. |
| `pnpm --filter @jaatster/blip-storybook dev` | Storybook at http://localhost:6006. `build` writes `storybook-static`; `test` runs every story as a test, with axe, in Day and in Night. |
| `pnpm --filter @jaatster/blip-docs dev` | The docs site, locally. `build` writes the static site; `preview` serves the build. |
| `pnpm cem` | Writes the Custom Elements Manifests from the elements' JSDoc. `pnpm cem:check` fails if one is out of date. Then run `node scripts/contract-elements.mjs`, which writes CONTRACT.md's table of elements from them. |
| `node scripts/diagnostics.mjs` | Writes CONTRACT.md's table of diagnostic codes from the source; `--check` fails if it is out of date. |
| `pnpm lint:css` | Regenerates the list of public custom properties, then lints every package's CSS with Blip's rules. |
| `pnpm --filter @jaatster/blip-stylelint-config test` | Tests the lint rules themselves. |
| `pnpm budgets` | Checks the size budgets after a build; fails if anything is over. |
| `pnpm check` | `cem:check`, `lint:css`, `budgets` and the React type check together. |
| `pnpm qa <name> [--fast] [--update-snapshots]` | Every check of one component or kit part, and only its checks (`scripts/qa.mjs`): what is missing (docs page, example, header comment, baselines, a unit test of its element, its CONTRACT.md row), stylelint on its CSS, its docs page against the code, its manifest, its budget lines, the unit tests that mention it, and the visual tests and accessibility scans of its example. `--fast` skips the Playwright runs. |
| `node scripts/heavy.mjs <command> [args…]` | Runs a heavy job once no other is running in this checkout, printing "waiting for <job> (pid N)…" while it queues. `test:visual`, `test:a11y`, `test:conditions`, `test:real-stack`, the docs build and `pnpm qa`'s Playwright runs go through it, so agents sharing a checkout take turns. |
| `pnpm changeset` | Records a change for the changelog and the next version. |

The test server uses port 4180 (`CHU_TEST_PORT` to change it) and Vitest's browser mode port 63410, so they run
beside the dev server and Storybook.

Visual baselines are per platform, because fonts rasterise differently: they live in
`tests/visual/__screenshots__/<platform>`. CI runs on Linux, and its baselines come from the "Visual baselines"
workflow: run it by hand, download the `linux-baselines` artifact, look at every picture, and commit them under
`tests/visual/__screenshots__/linux`.

## Adding things

AUTHORING.md has the rules for all of these. The steps:

### A component

1. Read the reference: the button's CSS, example and docs (`packages/components/src/button.css`,
   `examples/button.html`, `docs/button.md`).
2. Write `src/<name>.css` in the right package (`@layer chu.components` for core components, `@layer chu.kits` for
   kits), with a header comment like the button's: markup, attributes, states. Build it from the candy box:
   set the box's variables and `data-variant` / `data-tone`; never draw your own outline, drop, focus ring or dither.
3. Write `examples/<name>.html`: every variant and state, with real content. Use `data-chu-state="hover focus
   active"` to show forced states.
4. Write `docs/<name>.md`: front matter (name, package, css, element, react, status), then usage, anatomy,
   variants, states, accessibility (keyboard map, ARIA), content, do and don't, API.
5. If it needs behaviour, add `packages/elements/src/<name>.ts` (a kit keeps its own): light DOM, extends
   `BlipElement`, tag and events `chu-<name>`, every listener and timer on `this.signal`, JSDoc for the manifest.
   Run `pnpm cem`.
6. React: element wrappers are generated from the manifests by `pnpm --filter @jaatster/blip-react build`. For a CSS
   component, add its component and its parts by hand in a file of its own, named like its docs page:
   `packages/react/src/components/<name>.tsx` (kits: `components/game/`, `components/blocks/`), exported from the
   package's entry. One file per page is what the shadcn registry installs (`scripts/registry.mjs`).
7. Run `node scripts/gallery.mjs`, then look at it in all three schemes, and zoomed (AUTHORING.md, "Checking your
   work"): crisp stepped corners, ink outlines, no blur, every state distinct, nothing overflowing.
8. Add its name to its group in `apps/docs/src/lib/data.ts` (it is listed under "More" otherwise). If it changes
   at phone width, add it to `RESPONSIVE` in `tests/page/manifest.ts`.
9. Run `pnpm qa <name>`: it says what is still missing and runs only this component's checks. A new example is a
   new visual test and a new accessibility scan, so it needs baselines: `pnpm qa <name> --update-snapshots`, then
   look at every picture. Before the pull request, run the checks below.

The docs site, Storybook and the tests find the new files on their own: there is no shared list to edit.

### An icon

Draw it in `packages/icons/src/<category>.icons`: a header (`@ name tags: word, word`) and exactly 12 rows of 12
characters, `X` for a pixel and `.` for empty. Follow the twelve drawing rules in
[packages/icons/docs/icons.md](packages/icons/docs/icons.md): one-pixel outlines, two-pixel lone marks, even
diagonals, the set's circles, no brands and no words. Then run `pnpm --filter @jaatster/blip-icons build`, which checks
the map, traces it and proves the path covers exactly the pixels you drew, and look at it in the gallery
(`?only=icons`).

### A glyph for Pixel Bop

Draw it in `packages/font/src/pixel-bop.glyphs` on the 7-row grid: 2-pixel vertical strokes, 1-pixel horizontal
ones, most letters 6 wide. Compose accented letters from their marks rather than drawing them. Then run
`pnpm --filter @jaatster/blip-font build` (it needs the Python environment above), which checks every block, writes the
TTF and WOFF2, and fails if the WOFF2 goes over 15 KB. Look at it at scales 1 to 4 (`?only=font`), because the
rounded sets at 2, 3 and 4 are generated. The details are in
[packages/font/docs/font.md](packages/font/docs/font.md), "Drawing a new glyph".

### A token

Edit the sources in `packages/tokens/src/` (W3C DTCG 2025.10). Colours are `{ colorSpace: "srgb", components,
hex }`; sizes in pixels are number tokens with `"$extensions": { "blip": { "unit": "pixel" } }` and must be
whole numbers. A scheme role goes in all three files in `src/schemes/`. Run `pnpm build:tokens`: it validates every
file (each problem names the file, the place and the fix, with a `CHU-T` code), checks every text pair against
WCAG 2.2 AA in every scheme, and writes the CSS, JSON, JS and TypeScript, native and Figma outputs. A new or renamed
token changes the public contract: add a changeset, and run `pnpm lint:css` so the lint rules know about it.

### A palette or a world pack

Packs as data are planned, not built: there is no pack schema or loader yet, so talk to us in an issue first.
What works today:

- **A palette** (an accent for each time of day): the docs site's palette maker (`/theme/`) works out the light
  and shade bands, nudges a colour until its ink labels pass AA (or holds the export back when you keep it exact),
  warns when the accent looks like an intent or like the focus yellow, and exports DTCG token files for Day, Sunset
  and Night, a resolver that loads them after Blip's own, and the same as CSS to load after `tokens.css`.
  `npx blip-tokens my-theme.resolver.json` builds those token files into a `tokens.css` through the same checks
  as Blip's own. The builder's page also says how to set the six roles by hand. A `palette` modifier in `blip.resolver.json` is the plan;
  the token build handles only `scheme` and `pixel` today.
- **A world palette**: `<chu-world>` paints with the `--chu-world-*` tokens (28 colours for each time of day, and the
  shared sky colours), so overriding them repaints the backdrop without any code.
- **A new landscape** is code today (`packages/effects/src/world.ts`), not data.

### A diagnostic

Development warnings go through `warn(code, message, element)` from `@jaatster/blip-core`. Pick a code in the right
range (CONTRACT.md lists them), never reuse one for a different problem, and add a note for it in
`apps/docs/src/lib/diagnostics-notes.ts`; the diagnostics page lists every code it finds in the source. Then run
`node scripts/diagnostics.mjs`, which writes CONTRACT.md's table of codes from the source (`pnpm test` fails until
the table matches; a new prefix needs a line in the script's `RANGES`).

## Before you open a pull request

Run what CI runs (`.github/workflows/ci.yml`), and the accessibility scan, which CI does not run yet:

```sh
pnpm build
pnpm check                                  # manifests, CSS lint, budgets, React types
pnpm --filter @jaatster/blip-stylelint-config test
pnpm test:react
pnpm test
pnpm test:visual
pnpm --filter @jaatster/blip-tests test:a11y
pnpm --filter @jaatster/blip-storybook build
pnpm --filter @jaatster/blip-docs build
git status                                  # commit everything the build regenerated
```

CI fails if the build changes any committed file, so commit what it regenerates: manifests, `public-properties.json`,
`specimen/gallery.json`, the React wrappers, generated indexes and font pages.

### Review checklist

Reviewers check, and authors check first:

- [ ] **Tokens only.** No raw colours; sizes are whole pixels (`--chu-space-N`, `--chu-radius-N`,
      `calc(N * var(--chu-pixel))`); text sizes are `--chu-size-*`; Pixel Bop only at whole scales.
- [ ] **The candy box.** Every candy thing is a `.chu-box`; the component sets the box's variables and draws no
      outline, drop, focus ring or dither of its own.
- [ ] **One look per state.** Hover lifts, pressed sits in, selected sits in with bands swapped, focus is the yellow
      ring, disabled is dithered, busy is the stepped dots, invalid is the danger tone. `data-chu-state` shows them.
- [ ] **Motion snaps.** `steps()` only, at most 6 steps, durations from tokens, and everything stops or goes
      instant with `prefers-reduced-motion`.
- [ ] **Native HTML first**, following the WAI-ARIA Authoring Practices: names, roles, states, keyboard map, focus
      order, 24 px targets, Windows high-contrast mode.
- [ ] **Elements** are light DOM, extend `BlipElement`, clean up through `this.signal`, upgrade markup that already
      works, emit bubbling `chu-<name>` events, and stay within 3 KB gzipped.
- [ ] **Readable in all three schemes**, at the 2, 3 and 4 px pixel, and in the zoomed screenshot.
- [ ] **Docs and example** are complete, and the docs say what is new.
- [ ] **The public contract** (CONTRACT.md) is unchanged, or the change is deliberate, documented and has a
      changeset of the right size.
- [ ] **Budgets, manifests, lint and tests** pass, and generated files are committed.

## Changesets and releases

Every package has its own version. When a change should reach users, add a changeset with it:

```sh
pnpm changeset      # pick the packages, the bump (patch, minor, major) and write one line for the changelog
```

A change that breaks the public contract is a major bump; while a package is 0.x, use minor for it. A change to a
beta part's API is a minor too (CONTRACT.md, "Stable and beta"), and its line says what to do. Fixes are patches,
and new public API is a minor. Changes that users cannot see (tests, docs tooling) need no changeset.

Releases run from `main` (`.github/workflows/release.yml`): pending changesets become a "Version packages" pull
request (`pnpm version-packages`: new versions, changelogs and an updated lockfile). Merging it publishes every
version that is not on npm yet (`pnpm release`: build, budgets, `changeset publish`) with npm provenance, and only
when the repository has an `NPM_TOKEN` secret; without one, the version pull requests still work and nothing is
published. The first release publishes every package at its current version (0.1.0, and 0.2.0 for
`@jaatster/blip-font`), as `.changeset/first-release.md` records. Nothing is published without the owner's go-ahead.

## The real-stack check

The other tests use tools the repository picked. `scripts/real-stack.mjs` checks Blip the way an adopter gets
it: it packs every package with `pnpm pack`, installs the tarballs and a framework from npm into small apps that
follow the README and the start page to the letter (`tests/real-stack/`: React with Vite, Vue, Svelte, Next.js
with Turbopack and with webpack, React with Tailwind CSS, and Astro), runs each framework's production build and
dev server, and opens every app in Chromium. In each, the fonts load and a button is a candy box; a dialog opens
and closes from the app's state; tabs, combobox options and a field's error that arrive after load are wired; with
Vue and Svelte, a dialog defined after mounting stays closed; with Tailwind, its utilities win and a button keeps
every pixel; with React, a page with only `Button` or only `Tabs` stays small. A console error, a failed request or
a build warning fails it too. CI runs it on every pull request.

```sh
pnpm build                        # it packs packages/*/dist as they are
pnpm test:real-stack              # every app: a few minutes the first time, under a minute after that
pnpm test:real-stack next         # one app: react, vue, svelte, next, tailwind or astro
```

It needs network access to npm. The apps are made in `chu-stack` in the system's temporary folder (`--dir` picks
another) and keep their installs there between runs (`--clean` starts again); `--no-dev` skips the dev servers.
Each app's commands and server output are in `<app>/real-stack.log`, with a picture of the page for each check that
fails. To look at an app yourself after a run, `cd` into its folder and `npm run dev`. The apps use ports 4611 to
4616.
