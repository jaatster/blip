---
name: Footer
package: "@blip/blocks"
css: footer.css
element: null
react: Footer
status: beta
---

# Footer

The ground the page stands on: a grass edge with blades poking up, then the brand, link columns, a newsletter
sign-up and the legal line, on the sunken surface so every colour is a checked scheme role.

## Usage

```html
<footer class="blip-footer">
  <div class="blip-footer-inner">
    <div class="blip-footer-brand">
      <p class="blip-display blip-pop" data-scale="2" data-tone="pink" data-pop="Sherbit">Sherbit</p>
      <p class="blip-small">Tiny games about big skies.</p>
    </div>
    <nav class="blip-footer-nav" aria-label="More from Sherbit Games">
      <div class="blip-footer-col">
        <h2 class="blip-footer-heading">Studio</h2>
        <ul role="list"><li><a href="#about">About us</a></li><li><a href="#jobs">Jobs</a></li></ul>
      </div>
    </nav>
    <form class="blip-footer-signup" action="/subscribe" method="post" aria-labelledby="letter">
      <h2 class="blip-footer-heading" id="letter">The Sherbit letter</h2>
      <p>One email when something ships.</p>
      <div class="blip-footer-row">
        <label class="blip-sr-only" for="email">Email address</label>
        <span class="blip-box blip-footer-field" data-variant="outline"><input id="email" type="email" name="email" autocomplete="email" required></span>
        <button class="blip-box blip-button" type="submit">Subscribe</button>
      </div>
    </form>
  </div>
  <div class="blip-footer-legal">
    <p>© 2026 Sherbit Games.</p>
    <ul role="list"><li><a href="#privacy">Privacy</a></li><li><a href="#terms">Terms</a></li></ul>
  </div>
</footer>
```

## Anatomy

1. **Edge** (the footer's `::before` and `::after`): blades of grass above the top, grass, a lip, dirt with pebbles,
   and a dithered row down into the footer.
2. **Inner** (`.blip-footer-inner`): brand, links and sign-up side by side from 1024 px wide; stacked below.
3. **Columns** (`.blip-footer-col`): a heading and a list of links.
4. **Field** (`.blip-footer-field`): an outline candy box around a text input.
5. **Legal** (`.blip-footer-legal`): small print and policy links over a soft line.

## States

| Part | State | Look |
|---|---|---|
| Field | focus | The yellow ring round the box (the input itself draws none). |
| Field | wrong after typing (`:user-invalid`) | The danger outline; the browser explains why. |
| Column link | hover | The accent text colour and an underline. |

## Accessibility

- A `<footer>` landmark with a named `<nav>`; headings in the columns.
- The email field has a real label (visually hidden here because the heading says it), `type="email"` and
  `autocomplete="email"`.
- Legal links keep their underline; column links show it on hover (they sit in a list of links).
- The ground's edge is the world's: it is left out in Windows high contrast and on paper.

## Content

Three columns of four links or fewer. The sign-up promise in one line, and keep it.

## Do and don't

- **Do** say who made the site and how to reach them.
- **Don't** repeat the whole navigation; link the few things people look for at the bottom.

## API

| Custom property | Default | |
|---|---|---|
| `--blip-footer-edge` | 14 | The ground edge's depth, in pixels. |
