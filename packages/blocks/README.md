# @jaatster/blip-blocks

Website blocks for landing pages: hero, features, pricing, CTA band and footer, on the dithered world or on a soft
panel. CSS in `@layer chu.kits`, built from the core components.

```sh
npm install @jaatster/blip-blocks @jaatster/blip-components
```

## Use

```css
@import "@jaatster/blip-blocks/blocks.css";    /* or one file each: @jaatster/blip-blocks/hero.css */
```

```html
<section class="chu-cta" aria-labelledby="cta-title">
  <chu-world avoid=".chu-cta-title, .chu-cta-text, .chu-cta-actions"></chu-world>   <!-- from @jaatster/blip-effects -->
  <h2 class="chu-cta-title chu-display chu-pop" data-scale="2" data-pop="Ready?" id="cta-title">Ready?</h2>
  …
</section>
```

[Docs](./docs) · [examples](./examples) (including a whole landing page) · MIT
