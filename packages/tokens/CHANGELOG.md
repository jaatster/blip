# @blip/tokens

## 0.1.0

First release. Design tokens in the W3C DTCG 2025.10 format with a resolver for scheme (Day, Sunset, Night), and pixel size; CSS variables, JS and TypeScript, Kotlin (Compose), Swift, Android XML and Figma variables; every text pair checked against WCAG 2.2 AA at build time.

- Renamed from Blip: the package is `@jaatster/blip-tokens` (was `@jaatster/blip-tokens`); custom properties are `--chu-*` and switches `data-chu-*` (was `pp-`), the DTCG extension is `$extensions.blip`, the resolver `blip.resolver.json`, the CLI `blip-tokens`, the Kotlin `blip.tokens.BlipTokens`, the Swift `BlipTokens` and the Android files `blip_colors.xml` and `blip_dimens.xml`.
- Renamed from Blip: the package is `@blip/tokens` (was `@jaatster/blip-tokens`); custom properties are `--blip-*` and switches `data-blip-*` (was `chu-`), the DTCG extension is `$extensions.blip`, the resolver `blip.resolver.json`, the CLI `blip-tokens`, the Kotlin `blip.tokens.BlipTokens`, the Swift `BlipTokens` and the Android files `blip_colors.xml` and `blip_dimens.xml` (each was `blip`).
- `--blip-disabled-dither` and `--blip-disabled-dither-cream`: the checkerboard over a disabled candy, light in every scheme (the page colour by Day and Sunset, Starlight at Night) so its label reads; the build checks every candy label on it.
- Printed pages take the Day colours, whatever the scheme on screen.
- `tokens.json` and the JS module give sizes in CSS px: the type sizes, rem in `tokens.css`, at the browser's default 16 px.
- `blip-tokens` builds a theme's `tokens.css` (the token files and resolver the theme builder exports) through the same checks, and stops with the code, file, token and fix of anything that fails.
- Palettes: a third switch, `data-blip-palette`, sets the accent of every scheme and Night's page, text, lines, ink and sky. Candy is the default: blue by Day, pink at Sunset, and a new Night, sky blue (#00C2FA) on charcoal (#171717) with a charcoal ink (#0D0D0D). Eleven presets in `palettes.css`: Grape (the TV's purple Night, as it was), Ember, Azure, Mint, Bubblegum, and Blip takes on Dracula, Nord, Catppuccin, Gruvbox, Tokyo Night and Rosé Pine. The `--blip-palette-*` tokens are what a palette sets, and the scheme roles read them; an accent close to the warning's orange moves the warning to amber.
- `--blip-ink` is a scheme role: the palette's own ink at Night, darker than its page, never black.
- Contrast is checked in every scheme of every palette, and `BLIP-T005` stops a palette that sets a token the default palette does not have. `tokens.json` and the JS module carry the presets (`palettes`, `paletteNames`), Kotlin and Swift a `Palettes` object, and the Figma variables a `Palette` collection with a mode for each.
- `scripts/palettes.mjs` writes the presets from their recipes, with the maths the theme builder shares (`scripts/palette.mjs`).
