# @blip/sound

Blip's chip sounds (step, look, open, back, bump, coin, jump, blip, success, error, select), synthesised with
Web Audio: no audio files. Off until the person turns them on; components play them through the sound service.

```sh
npm install @blip/sound
```

## Use

```js
import { enableSound, play, rememberSound } from "@blip/sound";
toggle.addEventListener("click", () => enableSound());   // after a user gesture
play("coin");
```

`rememberSound()` keeps the choice between visits. About 1.6 KB gzipped. [Docs](./docs/sound.md) · MIT
