# @jaatster/blip-effects

Blip's opt-in effects, all drawn in the browser (no image files) and all still with reduced motion: the
dithered world backdrop (sky, mountains, hills, meadow; Day, Sunset, Night and Auto; parallax), screen transitions
(dissolve, dither, mosaic, through View Transitions), drop-in text, the typewriter, the glint, bursts (sparkle,
coin, star, confetti), a CRT filter, and the motion toggle: a page-wide pause for the world's ambient motion,
remembered on the device.

```sh
npm install @jaatster/blip-effects
```

## Use

```js
import "@jaatster/blip-effects/effects.css";
import "@jaatster/blip-effects/motion.js";                // <pp-motion-toggle>, before the world: a remembered pause
import "@jaatster/blip-effects/world.js";                 // <pp-world>
import { transition, burst } from "@jaatster/blip-effects";
await transition(() => showLevel(2), { kind: "dissolve" });
burst(button, { kind: "coin" });
```

```html
<div style="position: relative"><pp-world scheme="auto" parallax></pp-world>…</div>
<!-- A world whose clouds drift, whose stars flare or that has events runs on: show the pause beside it. -->
<div style="position: relative"><pp-world clouds stars events></pp-world>… <pp-motion-toggle></pp-motion-toggle></div>
```

JS and CSS together are under 15 KB gzipped. [Docs](./docs) · [examples](./examples) · MIT
