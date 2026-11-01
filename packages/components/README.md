# @jaatster/blip-components

Blip's core components as layered CSS (`@layer chu.components`): actions, forms, navigation, feedback and
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
<button class="chu-box chu-button">Save game</button>
<button class="chu-box chu-button" data-variant="soft" data-tone="danger" data-size="sm">Delete save</button>
```

Every file parses in lightningcss (Vite 8, Next.js 16) and esbuild, but one opt-in file kept out of
`components.css`: `popover-nub.css`, the nub of an open popover, which turns when the popover flips. Its anchored
container queries are more than lightningcss can parse yet, so load it with a `<link>` (from a CDN or your public
folder), not an import; see [the popover's page](./docs/popover.md#the-nub-of-an-open-popover-opt-in).

Every component has a page in [docs/](./docs) (usage, anatomy, variants, states, accessibility, API) and an
example in [examples/](./examples). All of them together are about 26 KB gzipped. MIT
