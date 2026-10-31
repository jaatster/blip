---
name: Accordion
package: "@jaatster/blip-components"
css: accordion.css
element: null
react: Accordion
status: stable
---

# Accordion

A stack of questions or sections that open one at a time, built on `<details>`. Each summary is a full-width box
button with a pixel chevron that steps round, one frame at a time, when it opens. The same `name` on every
`<details>` keeps only one open: the browser's own exclusive accordion. No script.

## Usage

```html
<div class="pp-accordion">
  <details class="pp-accordion-item" name="faq" open>
    <summary class="pp-box pp-accordion-summary">Can I play offline?<span class="pp-accordion-chevron"></span></summary>
    <div class="pp-box pp-accordion-panel"><p>Yes. Everything runs on your device.</p></div>
  </details>
  <details class="pp-accordion-item" name="faq">
    <summary class="pp-box pp-accordion-summary">How do I save my game?<span class="pp-accordion-chevron"></span></summary>
    <div class="pp-box pp-accordion-panel"><p>The game saves at every checkpoint flag.</p></div>
  </details>
</div>
```

## Anatomy

1. **Item**: a `<details>` (`.pp-accordion-item`).
2. **Summary**: `.pp-box.pp-accordion-summary`, a full-width box button: white with a sunken shade band.
3. **Chevron**: `.pp-accordion-chevron`, an empty span: right when closed, down when open, through one in-between
   frame (two frames, 80 ms).
4. **Panel**: `.pp-accordion-panel`, the answer. Plain text under its question, or with `.pp-box` a cream box tucked
   under it. It pops in a pixel as it opens.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `name` (on `<details>`) | any shared name | Only one item open at a time. Leave it off to let several open. |
| `data-variant` (summary) | `panel`, white (default), `soft`, `candy`, `outline`, `ghost` | White for FAQs; soft or candy (with `data-tone`) for a short menu; outline and ghost for dense settings. |
| `data-tone` (summary) | any tone or candy | With soft or candy. |
| `.pp-box` (panel) | | The answer in a cream box. |

## States

| State | How | Look |
|---|---|---|
| Hover | pointer | Lifts one pixel. |
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
| `.pp-accordion`, `.pp-accordion-item`, `.pp-accordion-summary`, `.pp-accordion-chevron`, `.pp-accordion-panel` | Parts. |

| Custom property | Default | |
|---|---|---|
| `--pp-r` with `--pp-shape`, `--pp-shape-inner` | 3 | Corner radius of the summary and the boxed panel. |
| `--pp-band-top`, `--pp-band-bottom` | 2, 3 | The summary's bands. |
