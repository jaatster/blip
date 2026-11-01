---
name: Attract
package: "@jaatster/blip-effects"
css: attract.css
element: pp-attract
react: Attract
status: beta
---

# Attract

Attract mode, as arcade games played a demo of themselves while nobody was playing: a short loop built from real
Blip parts, driven by a short script. A pixel pointer hops to a control and presses it, and the real control
responds: a box ticks, a switch flips, a toast drops in. Use it on a marketing page, a feature card or a docs page to
show one interaction.

## Usage

```html
<pp-attract label="Typing a title and saving shows a toast"
            script="move #title; type #title 'Ship it'; move #save; press #save; poster; wait 2s">
  …any Blip markup: a window, a field, a Save button, a toaster…
</pp-attract>
```

```js
import "@jaatster/blip-effects/motion";    // <pp-motion-toggle>: every page with a demo shows it
import "@jaatster/blip-effects/attract";   // defines <pp-attract>
const demo = document.querySelector("pp-attract");
demo.steps = [{ type: "#title", text: "Ship it" }, { press: "#save" }, { poster: true }, { wait: "2s" }];
```

It starts once the page has loaded (so the scripts that answer its clicks are there), its fonts are in and the
elements inside it are defined (a second at most), and plays from that markup.

A demo is motion that runs on, so, like a moving world, it belongs only on a page that shows the
[motion toggle](motion-toggle.md) (WCAG 2.2.2, Pause, Stop, Hide). Pressed, every demo stops within a frame on its
still frame; pressed again, they play on.

### The script

Steps split by `;`. Selectors are matched inside the element.

| Step | | |
|---|---|---|
| `move <selector>` | `move #save` | The pointer hops there in at most six even steps, a frame apart, each on a whole pixel, then rests a beat. |
| `press <selector>` | `press #save` | It goes there first, dips a pixel with the control's pressed look, comes back up and calls the control's own `click()`. |
| `type <selector> '<text>'` | `type #title 'Ship it'` | It goes there first, then puts the text in a character a pop (120 ms), each with an `input` event (a field's value; anything else, its text). Quote with `'` or `"`. |
| `wait <time>` | `wait 2s` | `500ms`, `2s`, `2 beats` (a beat is `--pp-duration-beat`, 400 ms); a bare number is ms. |
| `show <selector>`, `hide <selector>` | `show #done` | Takes `hidden` off, or puts it on. In a demo, `hidden` hides whatever a component's own `display`. |
| `poster` | `press #save; poster` | The still frame is the state here. Without one, the still frame is the end. |

In JavaScript and React, `steps` takes the same steps as objects: the verb holds its selector (`wait` its time, in ms
or as in the script), `type` has its `text`, and `poster: true` marks the still frame, on its own or on a step (the
state once that step is done). A step it cannot read, or whose selector matches nothing, is reported in the console
with its text ([`PP-D010`, `PP-D011`](https://jaatster.com/blip/diagnostics#pp-d010)) and skipped; the rest plays.

### The craft

- **One story.** One thing the product does, shown happening: three to five beats, a few words.
- **Words only where the story is.** The field, the button, the result; the rest is filler (a soft bar, a picture).
  Count the real strings: three to seven.
- **Crop to the action.** The element crops what it holds: frame the part of the screen where it happens, with room
  for the pointer and for what comes up.
- **The result lands, and holds.** End on the payoff and `wait` a couple of seconds; nothing sits still longer than
  that.
- **Pick the still frame.** Most people see only that one: in a thumbnail, with less motion, on paper. Mark the step
  that tells the story on its own with `poster`, never a frame caught mid-change.
- **A clean loop.** Each loop starts from the same markup, after a cut and a beat; let the pointer's first move come
  from where the last one ended. Keep room for what appears, so the demo keeps its size and the page never moves.

## Anatomy

- **The element**: a block that crops what it holds, and the frame for what is fixed in it (a toaster in it brings its
  toasts up in the demo's corner, not the page's; the page's own `toast()` never uses it).
- **The markup inside**: any Blip markup, made `inert`.
- **The pointer** (`.pp-attract-pointer`, added by the element): a 9 x 16 pixel arrow, an ink outline and a white fill,
  or the game kit's 14 x 10 white glove. It goes over everything in the demo.

## Variants

| Attribute | Values | |
|---|---|---|
| `pointer` | `arrow` (default), `glove` | The glove, for game screens and touch demos: its fingertip touches a control's start edge. The arrow's tip goes right of and below a control's middle, off its words. |

## States

| State | Look |
|---|---|
| Playing | The steps in order, then a cut back to the markup, a beat, and again. What the pointer is over has the hover look (`data-pp-state="hover"`); pressed, the active look. |
| Off screen, or in a hidden tab | Nothing plays. It starts from the top when it comes back. |
| Reduced motion, or the motion toggle pressed | The still frame at once, and nothing moves. When that is lifted, it plays from the top. |
| Before it starts | The markup as written, without a pointer. |
| Forced colours | The pointer in the system's text and canvas colours. |
| Print | The frame it is on, without the pointer. |

## Accessibility

- A demo is one picture: the element is `role="img"`, named by `label`, and its markup is `inert`, so nobody tabs into
  it or clicks it, and assistive technology reads the label once and nothing inside.
- Write `label` as one sentence that says what happens: "Typing a title and saving shows a toast". Without one, it
  warns (`PP-D001`).
- It runs on: show `<pp-motion-toggle>` on the page (WCAG 2.2.2). With the device's reduced motion it never moves.
- Never put the only copy of something important in a demo.

## Content

- Real words only on what the story touches, and short: a title, a button, the result.
- Responses that live in the markup: a native control, a Blip element, `show` and `hide`, a click handler. Between
  loops the element undoes every change in it (attributes, text, elements added and removed, fields' values) on the
  same nodes, so listeners and frameworks keep theirs; what a component or an app keeps in memory is not put back.
- Sounds play as they would for real (a toast's chime): keep sound off where demos loop.

## Do and don't

- **Do** show one interaction per demo, in a feature card, beside a feature's words, or on its docs page.
- **Do** show the motion toggle on the page.
- **Do** mark the still frame with `poster` when the end is not the best picture.
- **Don't** put a demo behind reading text, or several moving side by side in one view.
- **Don't** open dialogs, popovers or menus in a demo: they leave the frame for the page's top layer.
- **Don't** ask people to use the demo: link to the real thing.

## API

| | | |
|---|---|---|
| `script` | attribute and property | The steps, as above. |
| `label` | attribute and property | The sentence assistive technology reads (its `aria-label`). |
| `pointer` | attribute and property | `glove`, or left out for the arrow. |
| `steps` | property | The steps it plays, as objects: those set here, else the script's. Setting them plays them from the top; `null` goes back to the script. |
| `AttractStep` | type | One step as an object (`@jaatster/blip-effects/attract`). |
