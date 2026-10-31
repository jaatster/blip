---
name: Sound
package: "@jaatster/blip-sound"
css: null
element: null
react: null
status: beta
---

# Sound

The TV's chip sounds, made in the browser with Web Audio: soft triangle waves (the blip voice is a pulse), a 6 ms
fade-in, a cosine fade-out over each note's second half, and a gentle low-pass at about 2 kHz, rendered once into
audio buffers. No audio files; about 1.5 KB.

## Usage

```js
import { enableSound, disableSound, play, rememberSound } from "@jaatster/blip-sound";

soundButton.onclick = async () => {
  await enableSound({ volume: 0.8 });   // from a press: browsers start audio only then
  play("open");
};
play("coin");                           // anywhere, once on; silent when off
```

`enableSound()` registers the sounds as Blip's sound sink, so everything that plays through
`services.sound()` from `@jaatster/blip-core` (the typewriter's blips, elements' sounds) is heard. `disableSound()` turns
it off and puts back whatever sink was there before.

Sound is off until the app turns it on, and never depends on `prefers-reduced-motion`. Remembering the person's
choice is opt-in: call `rememberSound()` once at start-up. It stores on or off in `localStorage` from then on, and if
sound was on last time, turns it on again at the person's next click, key or touch.

## Sounds

| Name | Notes | Use |
|---|---|---|
| `step` | 440 then 587 Hz | Moving to the next item |
| `look` | 392 sliding to 523 Hz | Up to another area |
| `jump` | 220 sliding to 440 Hz | A jump, a launch |
| `coin` | 784 then 1047 Hz | A reward, a bump from below |
| `open` | 523 then 784 Hz | Opening a menu, a dialog, a page |
| `back` | 440 then 330 Hz | Closing, going back |
| `bump` | 110 sliding to 70 Hz | An edge, nothing there, a failure |
| `blip` | 470 sliding to 540 Hz, a pulse, 45 ms | A character's voice, a letter at a time |
| `success` | 523, 659, 784, then 1047 Hz | Something done |
| `error` | 294 then 220 sliding to 175 Hz | Something went wrong |
| `select` | 659 then 880 Hz | Choosing an option, ticking a box |

The first eight are the TV's, sample for sample; the last three are made the same way. `SOUNDS` holds every note.

## The voice

```js
import { voiceRate } from "@jaatster/blip-sound";
play("blip", { rate: voiceRate("A", "happy") });
```

`voiceRate(letter, mood)` is the blip's playback rate for a letter: each letter has its own small step, so a word
always sounds the same; vowels sit a step up; `happy` is higher and `sleepy` lower. Play a blip for every other
voiced letter (letters and digits) as text types.

## Accessibility

- Off until the person turns it on. Offer a visible sound toggle with `aria-pressed`.
- Sound only for an action the person took, or a character talking; never on a timer or on page load.
- Never carry meaning by sound alone.

## API

| | |
|---|---|
| `enableSound({ volume })` | Turns sound on (call from a press or a key). Resolves `true` when audio runs. `volume` 0 to 1. |
| `disableSound()` | Turns sound off. |
| `soundOn()` | Whether sound is on. |
| `rememberSound(key = "blip:sound")` | Opts in to remembering the choice; returns `"on"`, `"off"` or `null` from last time. |
| `play(name, { rate, volume })` | Plays a sound if sound is on. `rate` 0.5 to 2 (an octave each way), `volume` 0 to 1. At most four at once. |
| `voiceRate(char, mood)`, `voiced(char)` | The voice's pitch, and whether a letter is voiced. |
| `SOUNDS`, `synth(notes)` | The notes, and their samples at 22 050 Hz. |
