---
"@jaatster/blip-font": minor
"@jaatster/blip-tokens": minor
---

UI and body text is now set in Pixel Operator, by Jayvee Enaguas (CC0 1.0, public domain), in place of Pixelify Sans,
which readers found hard to read at body sizes. Pixel Operator is drawn on a 16-pixel em, so at the 16 px body size
each of its pixels is one CSS pixel. It comes in regular and bold (`pixel-operator.woff2`, `pixel-operator-bold.woff2`,
about 4 KB each); the medium weight draws as regular. `--blip-font-ui` is now "Pixel Operator", "Pixelify Sans",
"Blip Fallback", system-ui, sans-serif: Pixelify Sans stays in the package and draws the letters Pixel Operator does
not (Cyrillic, Greek, most of Latin Extended, the minus sign, arrows), so those letters still draw in a pixel face,
sized to Pixel Operator's capitals. To keep Pixelify
Sans for all UI text, set `--blip-font-ui: "Pixelify Sans", "Blip Fallback", system-ui, sans-serif`.
