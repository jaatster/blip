# @jaatster/blip-game

The Blip game UI kit: the RPG dialogue box with typed pages and a chip voice, choices, hearts, coin and score
counters, HUD bars, an inventory grid, button prompts, level tiles, a pause menu, achievement toasts, a stage, and
whole-pixel sprites (`sprite()` and `<pp-sprite>`). CSS in `@layer pp.kits`, elements for the parts with
behaviour.

```sh
npm install @jaatster/blip-game @jaatster/blip-components
```

## Use

```css
@import "@jaatster/blip-game/game.css";        /* or one file each: @jaatster/blip-game/hud.css */
```

```js
import "@jaatster/blip-game/hud.js";           // pp-counter, pp-hearts
import { sprite } from "@jaatster/blip-game/sprites";
```

```html
<pp-counter value="42" pad="3" label="Coins" sound="coin"><pp-sprite name="coin"></pp-sprite></pp-counter>
```

[Docs](./docs) · [examples](./examples) · elements in `custom-elements.json` · MIT
