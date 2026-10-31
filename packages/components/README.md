# @jaatster/blip-components

Blip's core components as layered CSS (`@layer pp.components`): actions, forms, navigation, feedback and
overlays, data and layout. Native HTML first; the components that need behaviour get it from
[@jaatster/blip-elements](../elements).

```sh
npm install @jaatster/blip-components @jaatster/blip-core @jaatster/blip-tokens
```

## Use

```css
@import "@jaatster/blip-tokens/tokens.css";
@import "@jaatster/blip-core/core.css";
@import "@jaatster/blip-components/components.css";   /* or one file each: @jaatster/blip-components/button.css */
```

```html
<button class="pp-box pp-button">Save game</button>
<button class="pp-box pp-button" data-variant="soft" data-tone="danger" data-size="sm">Delete save</button>
```

Every component has a page in [docs/](./docs) (usage, anatomy, variants, states, accessibility, API) and an
example in [examples/](./examples). All of them together are about 24 KB gzipped. MIT
