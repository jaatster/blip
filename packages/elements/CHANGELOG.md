# @jaatster/blip-elements

## 0.1.0

First release. Light-DOM Web Components for the components that need behaviour: combobox, command palette, dialog, drawer, field, file drop, menu, number stepper, rating, segmented control, table, tabs, tile grid, toaster and tooltip, with a Custom Elements Manifest.

- They work with what a framework renders later: tabs, options, errors, rows, tiles and triggers are wired as they arrive, and a field leaves your own errors and `aria-invalid` to you.
- A boolean attribute written `"false"` (as Vue and Svelte write it before an element is defined) is off.
- One API shape for one idea: `open`, `show()`, `close()`, `pp-open` and `pp-close` wherever something opens; `pp-change` with a `value` (tabs too); `pp-action` when an item is chosen to run (menu, command palette) and `pp-select` when a selection changes (table, tile grid); `data-side` and `data-align` for placement; `toast()` returns `{ close(), closed }` at once.
