# Blip on phones

Plan for making Blip work properly on phones, then putting it live at jaatster.com/blip. Decided with the
owner on 2026-11-02.

## 1. The docs on a phone (polish, not a rebuild)

The docs already have a phone layout: a menu button, a bottom tab bar and a drawer sidebar. At 390 px, 98 of 99
pages fit without sideways scrolling. To fix:

- **Bottom bar:** inside a section (Button, Tabs, Colour) the section's tab is dithered, so it reads as disabled.
  Give it the "current section" look instead.
- **Wide examples:** some (the button's state grid, tabs) are cut off at the edge of their frame. Make them scroll
  with a visible scroll cue, or stack on a phone.
- **Dialog page:** its diagram is 18 px too wide.
- **Tap targets:** a few unclassed links and the rating stars are under 24 px.
- **Widths:** check every page at 320, 360 and 390 px.

## 2. Every existing component on a phone

Load all 77 component examples at 320 and 390 px and fix anything that scrolls sideways, overlaps or gets cut off.
Components whose layout changes on a phone get 390 px screenshots.

## 3. Nine new pieces

Each one comes with:

- CSS
- an element, where it has behaviour
- the full example and 2 to 4 snippets
- a docs page, with its "also known as" names
- a React wrapper
- a unit test for its element
- screenshots at 1280 and 390 px
- an accessibility scan
- a row in CONTRACT.md

Each must pass `pnpm qa <name>`.

| Piece | How it works |
|---|---|
| **Bottom sheet** | The drawer's bottom side, plus a grab handle. Drag it between snap heights (`data-snap="half full"`) or down to close; on a keyboard, press the handle to change height, and Escape closes it. |
| **Action sheet** | A short column of big buttons rising from the bottom (one can be danger), with Cancel apart from the rest. A modal, so focus stays inside it. |
| **Swipe rows** | `<chu-swipe-row>` on a list row: swipe left or right to reveal actions, and a full swipe runs the first one. The actions are always in the tab order, with a "More" button for mouse and keyboard. |
| **Pull to refresh** | `<chu-refresh>` round a scroller. Pull past the line, a pixel arrow steps into the loader, and the `chu-refresh` event gets a promise to wait on. It's announced politely; pair it with a refresh button. |
| **Phone top bar** | Back button, centred title and up to two actions. Sticky, inside the notch's safe area. `data-large` gives a big title that steps down to the small one as you scroll (CSS only). |
| **Action button** | A candy block floating at the bottom end, above the bottom bar. `<chu-fab>` can fan out into two or three labelled mini buttons (a speed dial). |
| **Pager** | A swipeable row of cards with pixel dots (`scroll-snap`, so it works without JS). `<chu-pager>` keeps the dots in step and adds arrow keys. It never plays by itself. |
| **Wheel picker** | `<chu-wheel>`: one or more snapping wheels with a highlight band. It works in forms like an input, each wheel works with the arrow keys, and there are presets for time and date. |
| **Touch pad** (game kit) | `<chu-touch-pad>`: a pixel D-pad plus A and B, sending arrow keys and the keys you choose to a target, with several fingers at once. It shows only on touch screens unless forced. |

## 4. Live at jaatster.com/blip

- **The site's address:** the docs are served under `/blip` (Astro `base`) and know their full address,
  https://jaatster.com/blip. That covers every path, the link preview and the search index.
- **shadcn registry:** its address becomes `https://jaatster.com/blip/r/{name}.json`.
- **Cloudflare:** a `blip` Worker serves the docs' files on the route `jaatster.com/blip*`, so the existing
  jaatster.com project stays untouched. (Planned as a Pages project behind a proxy Worker; Pages now runs on
  Workers, so one Worker with static files does both. Done 2026-11-02: `scripts/deploy-docs.mjs`.)
- **Check:** every page and asset loads, the link preview and the registry work, and the home page at jaatster.com
  is unchanged.
- **Nothing else goes public:** nothing is pushed to GitHub or published to npm.

## How it's built

Five Opus agents at high effort work in parallel, each owning its own files:

- the two sheets
- swipe rows and pull to refresh
- the top bar, action button and pager
- the wheel picker and the touch pad
- the docs and responsiveness work

Heavy jobs (builds and Playwright) take turns through `scripts/heavy.mjs`. Each agent runs only its own items'
checks. Then I review the screenshots, run one combined pass of the affected suites, commit locally, set up the
`/blip` address and deploy.
