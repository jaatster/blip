# @jaatster/blip-elements

## 0.1.1

### Patch Changes

- Updated dependencies
  - @jaatster/blip-tokens@0.1.1
  - @jaatster/blip-core@0.1.1

## 0.1.0

First release. Light-DOM Web Components for the components that need behaviour: combobox, command palette, dialog, drawer, field, file drop, menu, number stepper, rating, segmented control, table, tabs, tile grid, toaster and tooltip, with a Custom Elements Manifest.

- `<blip-swipe-row>` (beta): swipe a list row aside to show its actions, hold it open past half, run the first with a full swipe (cancelable `blip-swipe`); one open row a list, the axis locked so the page still scrolls, every action in the tab order. `<blip-refresh>` (beta): pull to refresh on touch, `blip-refresh` with `detail.waitUntil(promise)`, `refresh()` for a Refresh button, announced politely.
- `<blip-wheel>` (beta, form-associated): wheel pickers for a time or a date in the page's language (`data-type`), or one wheel per `<select>` inside; each wheel a spin button (arrow keys, Page Up and Down, Home, End), turned by a drag, a flick, the mouse wheel or the keys, settling on a row in steps.
- `<blip-sheet>` (beta): a bottom sheet with heights to snap to (`data-snap="half full"`), a handle that steps through them, and dragging in whole pixels from the handle, the title bar or the top of the body; a drag or flick down closes it (`reason: "drag"`), `blip-change` when it settles at another height. `<blip-action-sheet>` (beta): the dialog's modal behaviour, with the choice as `returnValue` and `blip-close`'s `detail.returnValue`, empty when dismissed. `CloseReason` gains `"drag"`.
- `<blip-fab>` (beta): the action button's speed dial as a menu button (`aria-expanded`, focus into the stack and back, the arrow keys along it, Escape, Tab and a press outside close it; cancelable `blip-action`, `blip-open`, `blip-close`). `<blip-pager>` (beta): a carousel that never moves by itself; slides named "2 of 4" and inert out of view, a polite live track, previous and next buttons, the arrow keys, Home and End, the current dot kept in step as you swipe, stepped moves, and `blip-page`.
- `<blip-tooltip>`: one that stands beside its trigger, with room on neither side (a phone), shows above it, or below when there is more room there.
- Renamed from Blip: the package is `@jaatster/blip-elements` (was `@jaatster/blip-elements`); the elements are `<chu-*>` with `Blip*` classes (was `<pp-*>` and `Pixel*`), and events, attributes and custom properties start `chu-`.
- Renamed from Blip: the package is `@jaatster/blip-elements` (was `@jaatster/blip-elements`); the elements are `<blip-*>` with `Blip*` classes (was `<chu-*>` and `Blip*`), and events, attributes and custom properties start `blip-`.
- They work with what a framework renders later: tabs, options, errors, rows, tiles and triggers are wired as they arrive, and a field leaves your own errors and `aria-invalid` to you.
- A boolean attribute written `"false"` (as Vue and Svelte write it before an element is defined) is off.
- One API shape for one idea: `open`, `show()`, `close()`, `blip-open` and `blip-close` wherever something opens; `blip-change` with a `value` (tabs too); `blip-action` when an item is chosen to run (menu, command palette) and `blip-select` when a selection changes (table, tile grid); `data-side` and `data-align` for placement; `toast()` returns `{ close(), closed }` at once.
