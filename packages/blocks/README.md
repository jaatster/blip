# @jaatster/blip-blocks

Website blocks for landing pages: hero, features, pricing, CTA band and footer, on the dithered world or on a soft
panel. CSS in `@layer pp.kits`, built from the core components.

```sh
npm install @jaatster/blip-blocks @jaatster/blip-components
```

## Use

```css
@import "@jaatster/blip-blocks/blocks.css";    /* or one file each: @jaatster/blip-blocks/hero.css */
```

```html
<section class="pp-cta" aria-labelledby="cta-title">
  <pp-world avoid=".pp-cta-title, .pp-cta-text, .pp-cta-actions"></pp-world>   <!-- from @jaatster/blip-effects -->
  <h2 class="pp-cta-title pp-display pp-pop" data-scale="2" data-pop="Ready?" id="cta-title">Ready?</h2>
  …
</section>
```

[Docs](./docs) · [examples](./examples) (including a whole landing page) · MIT
