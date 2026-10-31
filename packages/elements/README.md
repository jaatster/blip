# @jaatster/blip-elements

Light-DOM Web Components that add behaviour to Blip's markup: `pp-combobox`, `pp-command`, `pp-dialog`,
`pp-drawer`, `pp-field`, `pp-file-drop`, `pp-menu`, `pp-number`, `pp-rating`, `pp-segmented`,
`pp-table`, `pp-tabs`, `pp-tile-grid`, `pp-toaster` (with `toast()`) and `pp-tooltip`. No shadow DOM: the
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
<pp-tabs class="pp-tabs">
  <div class="pp-tabs-list" role="tablist" aria-label="Settings">…</div>
  <div class="pp-tabs-panel" role="tabpanel">…</div>
</pp-tabs>
```

Events are `pp-*` (bubbling, composed). The API of every element is in `custom-elements.json` (the Custom
Elements Manifest) and on each component's page in [@jaatster/blip-components/docs](../components/docs). MIT
