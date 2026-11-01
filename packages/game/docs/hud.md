---
name: HUD
package: "@jaatster/blip-game"
css: hud.css
element: chu-counter, chu-hearts
react: Hud
status: beta
---

# HUD

The heads-up display over a game: hearts, segmented health and mana bars, coin and score counters, and a timer.
Numbers are Pixel Bop's tabular digits in POP (white, an ink outline, a drop in the tone's shade), so they read on any
part of the world, day or night, and never shift as they change.

## Usage

```html
<div class="chu-hud">
  <div class="chu-hud-group">
    <chu-hearts value="3.5" max="5" label="Health"></chu-hearts>
    <div class="chu-hud-stat">
      <span class="chu-hud-label chu-display chu-pop" data-scale="1" aria-hidden="true">MP</span>
      <div class="chu-box chu-hud-bar" data-tone="blue" role="meter" aria-label="Magic"
           aria-valuemin="0" aria-valuemax="8" aria-valuenow="5"
           style="--chu-hud-value: 5; --chu-hud-max: 8; --chu-hud-segments: 8">
        <span class="chu-hud-bar-fill"></span>
      </div>
    </div>
  </div>
  <div class="chu-hud-group">
    <chu-counter value="42" pad="3" label="Coins" sound="coin"><chu-sprite name="coin"></chu-sprite></chu-counter>
    <chu-counter value="12450" pad="7" label="Score">
      <span class="chu-hud-label chu-display chu-pop" data-scale="1" aria-hidden="true">Score</span>
    </chu-counter>
    <chu-counter value="165" format="time" low="30" label="Time" quiet><chu-sprite name="clock"></chu-sprite></chu-counter>
  </div>
</div>
```

```js
import "@jaatster/blip-game/hud";
import "@jaatster/blip-game/sprites";

coins.value += 10;                 // counts up a whole step a frame; the coin bumps; the coin sound plays
hearts.value -= 0.5;               // the hearts shake
bar.style.setProperty("--chu-hud-value", 4);
bar.ariaValueNow = "4";            // keep the meter's value in step with the drawing
```

## Anatomy

1. **HUD** (`.chu-hud`): rows that wrap. The last group keeps to the far side, even on a row of its own.
2. **Group** (`.chu-hud-group`) and **stat** (`.chu-hud-stat`): things that stay together; a label beside its value.
3. **Hearts** (`chu-hearts`): full, half and empty heart sprites, a pixel apart.
4. **Bar** (`.chu-hud-bar`): a slate track in a candy box (radius 1), segments five pixels wide with ink between, each
   with a light top row, a glint and a shade row.
5. **Counter** (`chu-counter`): an icon or label, then the digits.

## Variants

| Part | Attribute | Values |
|---|---|---|
| Bar | `data-tone` | `success` (default), any tone: `blue` for mana, `danger` when low. |
| Bar | `--chu-hud-value`, `--chu-hud-max`, `--chu-hud-segments` | The value of the max, drawn in whole segments (default 10), rounded down. |
| Counter | `pad` | Zero-pads to this many digits: `042`. |
| Counter | `format="time"` | The value in seconds, shown as `m:ss`. |
| Counter | `low` | At or under this value the digits turn red (`data-low`). |
| Counter | `sound` | A chip sound to play on a gain: `coin`. |
| Counter | `quiet` | Never announced: for a ticking timer or a busy score. |
| Hearts | `value`, `max` | Halves count: 3.5 of 5 is three full, a half, one empty. |

## States

| State | Look |
|---|---|
| Counting | The number steps to its new value a whole step a frame, never more than fifteen frames. |
| Gain | The counter's icon bumps (up 6, 3, then down); its sound plays. |
| Damage | The hearts shake, a pixel each way. |
| Low | `data-low` on a counter, `data-tone="danger"` on a bar: red. |
| Reduced motion | Counters jump to the value; nothing bumps or shakes. |

## Accessibility

- Each counter and the hearts keep a polite live region that speaks only once the value has settled for a second:
  "Coins 52", "Health 2.5/5". A run of twenty coins is one announcement. Use `quiet` for values that change every
  second; announce what matters (time running out) in your own words.
- Bars are `role="meter"` with a name and `aria-valuenow`; keep it equal to `--chu-hud-value`.
- Sprites are pictures with no name of their own here: the live text says what they show. Visible labels like "Score"
  are `aria-hidden` when `label` says the same.
- Colour never carries meaning alone: a low bar is shorter as well as red.
- A bar's fill prints, though browsers leave backgrounds off paper.

## Content

Labels are one short word in capitals (HP, MP, Score). Pad scores to a fixed width so the HUD never jiggles.

## Do and don't

- **Do** keep the HUD to the top edge, out of the play.
- **Don't** announce every change; let the counters settle.
- **Don't** use yellow for anything but coins and stars.

## API

| Element | Members | |
|---|---|---|
| `chu-counter` | `value`, `label`, `format(n)` | `format` returns the value as shown. |
| `chu-hearts` | `value`, `max`, `label` | |

| Custom property | Default | |
|---|---|---|
| `--chu-hud-value`, `--chu-hud-max` | 0, 10 | A bar's value and maximum. |
| `--chu-hud-segments` | 10 | How many segments a bar has. |
