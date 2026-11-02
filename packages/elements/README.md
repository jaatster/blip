# @jaatster/blip-elements

Light-DOM Web Components that add behaviour to Blip's markup: `blip-combobox`, `blip-command`, `blip-dialog`,
`blip-drawer`, `blip-field`, `blip-file-drop`, `blip-menu`, `blip-number`, `blip-rating`, `blip-segmented`,
`blip-table`, `blip-tabs`, `blip-tile-grid`, `blip-toaster` (with `toast()`) and `blip-tooltip`. No shadow DOM: the
component CSS styles them, and the markup already works before they upgrade. Each is 3 KB gzipped or less.

```sh
npm install @jaatster/blip-elements @jaatster/blip-components
```

## Use

```js
import "@jaatster/blip-elements/tabs.js";        // one element (or "@jaatster/blip-elements" for all)
import { toast } from "@jaatster/blip-elements/toast";
toast({ title: "Saved", tone: "success" });
```

```html
<blip-tabs class="blip-tabs">
  <div class="blip-tabs-list" role="tablist" aria-label="Settings">…</div>
  <div class="blip-tabs-panel" role="tabpanel">…</div>
</blip-tabs>
```

## With a framework (Vue, Svelte, Angular, plain React)

**Define the elements before you mount.** Import the element modules first, then mount your app:

```js
import "@jaatster/blip-elements/dialog.js";
import "@jaatster/blip-elements/tabs.js";
createApp(App).mount("#app"); // Vue: it now sets properties (dialog.open = false), not attributes
```

A framework that meets an element it doesn't know yet sets attributes, and writes `false` as the text `"false"`. The
elements read a boolean attribute written `"false"` as off and take it off, so a lazily defined dialog with
`open="false"` stays closed, but defining them first keeps everything a property from the start.

**Content rendered later is wired as it comes.** Tabs and panels that arrive with their data, options a search
fills in as you type, an error the server sends back, a trigger rendered after its tooltip: each element watches
what is inside it and wires what arrives, as it arrives. Your own error text and `aria-invalid` are yours: a field
links them and reads them out, and never takes them away.

## One shape for one idea

| Idea | Everywhere |
|---|---|
| It opens and closes | An `open` attribute and property that reflects it, `show()` and `close()`, and the events `blip-open` and `blip-close` (dialog, drawer, menu, command palette, tooltip; the combobox's list) |
| A value changed | `blip-change`, with the new `value` in `detail` (tabs, segmented, rating, combobox, number; a file drop's `files`) |
| An item was chosen to run | `blip-action`, with `{ item, value }` (menu and command palette, cancelable; the game kit's choices add `index` and `label`) |
| The selection changed | `blip-select` (table rows, tiles) |
| Where it goes | `data-side` and `data-align` (`start`, `center`, `end`), as each needs them: a tooltip's side (`top`, `bottom`, `left`, `right`), a toaster's side (`bottom`, `top`) and align, a menu's align, a popover's both, a drawer's side (`end`, `start` or `bottom`, following the text) |
| An item's value | its `data-value`, else its `value`, else its label |
| Sizes | `data-size`: `sm`, `md` (default), `lg` |

`toast()` returns `{ close(), closed }` at once; `close()` works straight away. `@jaatster/blip-react` returns the same.

Events are `blip-*` (bubbling, composed). The API of every element is in `custom-elements.json` (the Custom
Elements Manifest) and on each component's page in [@jaatster/blip-components/docs](../components/docs). MIT
