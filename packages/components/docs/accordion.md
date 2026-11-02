---
name: Accordion
package: "@jaatster/blip-components"
css: accordion.css
element: null
react: Accordion
status: stable
equivalents:
  shadcn: Accordion
  apg: accordion
  html: '<details>'
---

# Accordion

A stack of questions or sections that open one at a time, built on `<details>`. Each summary is a full-width box
button with a pixel chevron that steps round, one frame at a time, when it opens. The same `name` on every
`<details>` keeps only one open: the browser's own exclusive accordion. No script.

## Usage

```html
<div class="blip-accordion">
  <details class="blip-accordion-item" name="faq" open>
    <summary class="blip-box blip-accordion-summary">Can I play offline?<span class="blip-accordion-chevron"></span></summary>
    <div class="blip-box blip-accordion-panel"><p>Yes. Everything runs on your device.</p></div>
  </details>
  <details class="blip-accordion-item" name="faq">
    <summary class="blip-box blip-accordion-summary">How do I save my game?<span class="blip-accordion-chevron"></span></summary>
    <div class="blip-box blip-accordion-panel"><p>The game saves at every checkpoint flag.</p></div>
  </details>
</div>
```

## Anatomy

1. **Item**: a `<details>` (`.blip-accordion-item`).
2. **Summary**: `.blip-box.blip-accordion-summary`, a full-width box button: white with a sunken shade band.
3. **Chevron**: `.blip-accordion-chevron`, an empty span: pointing along the line when closed (right, or left right to
   left), down when open, through one in-between frame (two frames, 80 ms).
4. **Panel**: `.blip-accordion-panel`, the answer. Plain text under its question, or with `.blip-box` a cream box tucked
   under it. It pops in a pixel as it opens.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `name` (on `<details>`) | any shared name | Only one item open at a time. Leave it off to let several open. |
| `data-variant` (summary) | `panel`, white (default), `soft`, `candy`, `outline`, `ghost` | White for FAQs; soft or candy (with `data-tone`) for a short menu; outline and ghost for dense settings. |
| `data-tone` (summary) | any tone or candy | With soft or candy. |
| `.blip-box` (panel) | | The answer in a cream box. |

## States

| State | How | Look |
|---|---|---|
| Hover | pointer | Lifts one pixel in a white ring (outline and ghost: sunken fill). |
| Focus | keyboard | The yellow ring. |
| Pressed | `:active` | Sits in its drop. |
| Open | `open` | The chevron steps to point down; the panel shows. |

## Accessibility

- `<summary>` is a button the browser names from its text and gives an expanded state; Enter and Space toggle it.
  Nothing to add.
- The chevron is drawn, never read: leave the span empty.
- Put a real heading before the accordion for the page's outline; don't put headings inside summaries (some screen
  readers drop them).
- With `name`, opening one item closes the open one; focus stays where it is.
- Find-in-page opens a closed item that holds the match.
- Reduced motion: the chevron and the panel snap open. Windows high contrast: a system border and a system-coloured
  chevron.

## Content

- Summaries are the questions people ask, in their words. One line.
- Answers short; link out for more.

## Do and don't

- **Do** use an exclusive accordion for a FAQ, so the page stays short.
- **Don't** hide the one thing everyone needs inside a closed item.
- **Don't** nest accordions.

## API

| Class or attribute | |
|---|---|
| `.blip-accordion`, `.blip-accordion-item`, `.blip-accordion-summary`, `.blip-accordion-chevron`, `.blip-accordion-panel` | Parts. |

| Custom property | Default | |
|---|---|---|
| `--blip-r` with `--blip-shape`, `--blip-shape-inner` | 3 | Corner radius of the summary and the boxed panel. |
| `--blip-band-top`, `--blip-band-bottom` | 2, 3 | The summary's bands. |
