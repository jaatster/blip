# @jaatster/blip-game

The Blip game UI kit: the RPG dialogue box with typed pages and a chip voice, choices, hearts, coin and score
counters, HUD bars, an inventory grid, button prompts, level tiles, a pause menu, achievement toasts, a stage, and
whole-pixel sprites (`sprite()` and `<chu-sprite>`). CSS in `@layer chu.kits`, elements for the parts with
behaviour.

```sh
npm install @jaatster/blip-game @jaatster/blip-components
```

## Use

```css
@import "@jaatster/blip-game/game.css";        /* or one file each: @jaatster/blip-game/hud.css */
```

```js
import "@jaatster/blip-game/hud.js";           // chu-counter, chu-hearts
import { sprite } from "@jaatster/blip-game/sprites";
```

```html
<chu-counter value="42" pad="3" label="Coins" sound="coin"><chu-sprite name="coin"></chu-sprite></chu-counter>
```

[Docs](./docs) · [examples](./examples) · elements in `custom-elements.json` · MIT
