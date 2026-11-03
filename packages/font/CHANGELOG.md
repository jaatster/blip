# @jaatster/blip-font

## 0.3.0

### Minor Changes

- UI and body text is now set in Pixel Operator, by Jayvee Enaguas (CC0 1.0, public domain), in place of Pixelify Sans, which readers found hard to read at body sizes. Pixel Operator is drawn on a 16-pixel em, so at the 16 px body size each of its pixels is one CSS pixel. It comes in regular and bold (`pixel-operator.woff2`, `pixel-operator-bold.woff2`, about 4 KB each); the medium weight draws as regular, and the hyphen browsers add to break a word draws as its own hyphen. Pixelify Sans stays in the package and draws the letters Pixel Operator does not (Cyrillic, Greek, most of Latin Extended, the minus sign, arrows), sized to Pixel Operator's capitals.

## 0.2.0

First release. Pixel Bop, the pixel display font, with every European capital in Latin, Cyrillic and Greek, and
Pixelify Sans for UI and body text in Latin, Cyrillic and Greek, with their SIL Open Font Licences. Each script is its
own WOFF2 file, so a Latin page loads nothing for the others; Pixel Bop also comes as one TTF. Pixelify Sans is
modified so it reads at text sizes: no ligatures (fi and fl read as "A"); C, G, 5 and c, and every accent, quote,
comma and symbol drawn finer than one of its pixels (@ read as a dot, © as °), redrawn on its pixel grid at every
weight; Cyrillic and Greek corrected and completed. Emoji fall back to the system's, sized to the capitals.

