# @blip/effects

Blip's opt-in effects, all drawn in the browser (no image files) and all still with reduced motion: the
dithered world backdrop (sky, mountains, hills, meadow; Day, Sunset, Night and Auto; parallax), screen transitions
(dissolve, dither, mosaic, through View Transitions), drop-in text, the typewriter, the glint, bursts (sparkle,
coin, star, confetti), a CRT filter, attract mode (a short demo of real markup, played by a pixel pointer from a
script), and the motion toggle: a page-wide pause for the world's ambient motion and every demo, remembered on the
device.

```sh
npm install @blip/effects
```

## Use

```js
import "@blip/effects/effects.css";
import "@blip/effects/motion.js";                // <blip-motion-toggle>, before the world: a remembered pause
import "@blip/effects/world.js";                 // <blip-world>
import { transition, burst } from "@blip/effects";
await transition(() => showLevel(2), { kind: "dissolve" });
burst(button, { kind: "coin" });
```

```html
<div style="position: relative"><blip-world scheme="auto" parallax></blip-world>…</div>
<!-- A world whose clouds drift, whose stars flare or that has events runs on: show the pause beside it. -->
<div style="position: relative"><blip-world clouds stars events></blip-world>… <blip-motion-toggle></blip-motion-toggle></div>
<!-- A demo runs on too: import "@blip/effects/attract.js", and show the pause on its page. -->
<blip-attract label="Pressing Save shows a toast" script="move #save; press #save; poster; wait 2s">…</blip-attract>
```

JS and CSS together are under 17 KB gzipped. [Docs](./docs) · [examples](./examples) · MIT
