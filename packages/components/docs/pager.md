---
name: Pager
package: "@jaatster/blip-components"
css: pager.css
element: chu-pager
react: Pager
status: beta
equivalents:
  shadcn: Carousel
  apg: carousel
---

# Pager

A row of full-width slides you swipe between, one at a time, with pixel dots under them: the steps of a tour, the
worlds of a game, a few featured cards. It is CSS scroll snapping, so it works without a script; `<chu-pager>` keeps
the dots in step, adds previous and next buttons and the arrow keys, and tells screen readers which slide is
showing. It never moves by itself.

Use a pager for a handful of things of the same kind, seen one at a time, where people swipe on a phone. For things
people compare, use a list or a grid; for views of one thing, tabs; for more than about seven, a list.

## Usage

```html
<chu-pager class="chu-pager" aria-label="New worlds">
  <div class="chu-pager-track" tabindex="0">
    <section class="chu-pager-slide" id="world-1" role="group" aria-roledescription="slide" aria-label="1 of 3">…</section>
    <section class="chu-pager-slide" id="world-2" role="group" aria-roledescription="slide" aria-label="2 of 3">…</section>
    <section class="chu-pager-slide" id="world-3" role="group" aria-roledescription="slide" aria-label="3 of 3">…</section>
  </div>
  <div class="chu-pager-dots">
    <a class="chu-pager-dot" href="#world-1" aria-current="true" aria-label="Meadow"></a>
    <a class="chu-pager-dot" href="#world-2" aria-label="Crystal caves"></a>
    <a class="chu-pager-dot" href="#world-3" aria-label="Sky islands"></a>
  </div>
</chu-pager>
```

**Without the script** the track scrolls sideways and snaps to each slide, never past one, and each dot is an in-page
link that brings its slide into view. The first dot stays the current one.

**With `<chu-pager>`** (from `@jaatster/blip-elements/pager.js`):

- the current dot follows the slide as you swipe, and a dot moves to its slide without following the link;
- previous and next buttons go at either end of the dots, dithered at the first and last slide;
- ArrowLeft and ArrowRight (swapped right to left), Home and End move while focus is on a dot, a button or the track;
- moved by a button, a key or a dot, the track steps across in four even jumps (at once with reduced motion);
- the slides out of view are `inert`, so Tab and a screen reader stay on the one showing, and the track is a polite
  live region, so the slide that comes in is read out;
- it fires `chu-page` when another slide is showing.

It adds the roles and labels the markup leaves out, and the dots, if there are none.

**On paper** every slide prints, one under another, and the dots and buttons are left off.

## Anatomy

1. **Track**: `.chu-pager-track`, the scrolling row, with room round the slides for their drops and focus rings.
   `tabindex="0"` lets the keyboard reach it (and scroll it without the script) when a slide has nothing to focus;
   `<chu-pager>` adds it when it is missing. Focused, it takes the square yellow ring.
2. **Slide**: `.chu-pager-slide`, the track's full width. Anything goes in: a card, a picture, a step of a tour.
3. **Dots**: `.chu-pager-dots`, centred under the track.
4. **Dot**: `.chu-pager-dot`, a link to one slide: a four-pixel dot, its corners dropped, in a 12-pixel target. The
   current one (`aria-current="true"`) is a pill ten pixels wide, the accent inside an ink edge.
5. **Buttons**: `.chu-pager-prev` and `.chu-pager-next`, added by `<chu-pager>`: soft, small, square buttons with
   pixel chevrons, at the ends of the dots.

## Variants

None: a pager is one size, the width of its container. Make the slides look different with what they hold (cards in
any tone or tier).

## States

| State | How | Look |
|---|---|---|
| Current dot | `aria-current="true"` (kept in step by `<chu-pager>`) | A wider pill: the accent, its light band on top, inside an ink edge. It reads by its shape as well as its colour. |
| Hover | pointer, on a dot | The dot turns the text colour. |
| Focus | keyboard, on a dot | The square yellow ring with an ink edge, round its 12-pixel target. |
| First or last slide | `aria-disabled="true"` on the button (set by `<chu-pager>`) | The previous or next button is dithered; it stays focusable. |

## Accessibility

Follows the WAI-ARIA Authoring Practices Carousel pattern, with no rotation.

| Key | Does |
|---|---|
| Tab | The track, then what the slide showing holds, then the previous button, the dots and the next button. |
| ArrowRight, ArrowLeft | On a dot, a button or the track: the next or previous slide (swapped right to left). On a dot, focus follows to the new slide's dot. |
| Home, End | The first or last slide. |
| Enter | On a dot or button: goes to its slide. |

- `<chu-pager>` makes itself a region with `aria-roledescription="carousel"`: name it with `aria-label` or
  `aria-labelledby`.
- Each slide is a group with `aria-roledescription="slide"`, labelled "2 of 4" unless it has a label of its own (its
  heading, by `aria-labelledby`). `slide-label` changes the words.
- It never moves by itself, so there is nothing to pause. The track is `aria-live="polite"` throughout.
- Slides out of view are `inert`: their links and buttons are out of the tab order until they show.
- The track is in the tab order (`tabindex="0"`), so a keyboard can reach it even when the slide showing has
  nothing to focus.
- The dots are 24 px targets; the buttons 32 px.
- Panning and pinch zoom work on the track (`touch-action: manipulation`); taps are not delayed.
- Windows high contrast: the dots take the link colour, the current one the highlight.

## Content

- Two to seven slides. Every slide works on its own: someone may never swipe.
- Name each dot by its slide ("Meadow"), or leave it to `<chu-pager>` ("Slide 2").
- Keep the slides about the same height: the track is as tall as the tallest.

## Do and don't

- **Do** put the most important slide first.
- **Do** keep everything a slide offers reachable some other way when it matters (a list of all worlds).
- **Don't** move the slides on a timer.
- **Don't** put a pager inside a pager, or a sideways scroller inside a slide.

## API

### `<chu-pager>`

| Attribute or property | Type | |
|---|---|---|
| `prev-label` | string, `"Previous slide"` | The previous button's name. |
| `next-label` | string, `"Next slide"` | The next button's name. |
| `slide-label` | string, `"{n} of {count}"` | Each slide's name where it has none of its own: `{n}` is its number and `{count}` how many there are. |
| `index` (property) | number | The slide showing. Setting it moves there, in steps (no event). |
| `track` (read only) | `HTMLElement` | The scrolling row. |
| `slides` (read only) | `HTMLElement[]` | The slides, in order. |
| `next()` | method | Moves to the next slide, if there is one. |
| `prev()` | method | Moves to the previous slide, if there is one. |

| Event | Detail | |
|---|---|---|
| `chu-page` | `{ index, slide }` | Another slide is showing: after a swipe, a button, a key or a dot. Bubbles. |

Slides and dots added later (a framework rendering them once data arrives) are wired as they come.
