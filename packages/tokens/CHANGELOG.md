# @jaatster/blip-tokens

## 0.1.0

First release. Design tokens in the W3C DTCG 2025.10 format with a resolver for scheme (Day, Sunset, Night), and pixel size; CSS variables, JS and TypeScript, Kotlin (Compose), Swift, Android XML and Figma variables; every text pair checked against WCAG 2.2 AA at build time.

- `--pp-disabled-dither` and `--pp-disabled-dither-cream`: the checkerboard over a disabled candy, light in every scheme (the page colour by Day and Sunset, Starlight at Night) so its label reads; the build checks every candy label on it.
- Printed pages take the Day colours, whatever the scheme on screen.
- `tokens.json` and the JS module give sizes in CSS px: the type sizes, rem in `tokens.css`, at the browser's default 16 px.
- `blip-tokens` builds a theme's `tokens.css` (the token files and resolver the theme builder exports) through the same checks, and stops with the code, file, token and fix of anything that fails.
