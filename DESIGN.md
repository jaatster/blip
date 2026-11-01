---
name: Blip
description: A 16-bit pixel-art design system. Candy-coloured, ink-outlined controls on a soft dithered world, one square pixel everywhere, and motion that snaps.
colors:
  # The format requires a primary. It is the accent role (--chu-accent): Blue Raspberry by Day.
  primary: "#33A3FF"
  # Primitives: ink, white and the ten candies, each a base, a light (top band) and a shade (bottom band).
  ink: "#1A1530"
  soft-ink: "#4A4470"
  glint-white: "#FFFFFF"
  gumball-red: "#FF3D4F"
  gumball-red-light: "#FF7A85"
  gumball-red-shade: "#D11F35"
  sherbet-orange: "#FF7A1A"
  sherbet-orange-light: "#FFAA6B"
  sherbet-orange-shade: "#D95A0A"
  lemon-drop: "#FFCC33"
  lemon-drop-light: "#FFE680"
  lemon-drop-shade: "#E6A100"
  sour-apple: "#4CD964"
  sour-apple-light: "#8CF09A"
  sour-apple-shade: "#2FAE46"
  spearmint: "#2FD3C5"
  spearmint-light: "#7BE8DE"
  spearmint-shade: "#16A99C"
  blue-raspberry: "#33A3FF"
  blue-raspberry-light: "#7FC8FF"
  blue-raspberry-shade: "#1478D6"
  grape-soda: "#9166FF"
  grape-soda-light: "#B48CFF"
  grape-soda-shade: "#6A3AD6"
  bubblegum: "#FF5FA2"
  bubblegum-light: "#FF9CC6"
  bubblegum-shade: "#E03A82"
  liquorice: "#4A4562"
  liquorice-light: "#726C8E"
  liquorice-shade: "#332F48"
  marshmallow: "#FFF8EE"
  marshmallow-light: "#FFFFFF"
  marshmallow-shade: "#EFE3D2"
  # Day-scheme roles. Each key is the CSS custom property --chu-<key>. Sunset and Night are in the Colors section.
  bg: "#F4F7FF"
  surface: "#FFFFFF"
  surface-raised: "#FFFFFF"
  surface-sunken: "#E0E8FF"
  surface-panel: "#FFF8EE"
  text: "#1A1530"
  text-muted: "#4A4470"
  line: "#1A1530"
  line-soft: "#B9B6EA"
  focus: "#FFCC33"
  accent: "#33A3FF"
  accent-light: "#7FC8FF"
  accent-shade: "#1478D6"
  accent-text: "#1660B8"
  info: "#33A3FF"
  info-text: "#1660B8"
  success: "#4CD964"
  success-text: "#1E7A33"
  warning: "#FF7A1A"
  warning-text: "#A8460A"
  danger: "#FF3D4F"
  danger-text: "#B31529"
typography:
  # Pixel Bop, at whole scales only: font-size = 10 x pixel x scale (here at the default 2 px pixel).
  display:
    fontFamily: "Pixel Bop, Pixelify Sans, system-ui, sans-serif"
    fontSize: "80px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0px"
    fontFeature: '"ss02"'
  display-sm:
    fontFamily: "Pixel Bop, Pixelify Sans, system-ui, sans-serif"
    fontSize: "60px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0px"
    fontFeature: '"ss03"'
  headline:
    fontFamily: "Pixel Bop, Pixelify Sans, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0px"
    fontFeature: '"ss02"'
  headline-sm:
    fontFamily: "Pixel Bop, Pixelify Sans, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0px"
    fontFeature: "normal"
  # Pixelify Sans, at five sizes (in rem; px here at the browser's default 16 px): the one thing allowed off the grid.
  title:
    fontFamily: "Pixelify Sans, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.15
  lead:
    fontFamily: "Pixelify Sans, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Pixelify Sans, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Pixelify Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "Pixelify Sans, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  label-lg:
    fontFamily: "Pixelify Sans, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.5px"
  label:
    fontFamily: "Pixelify Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.5px"
  label-sm:
    fontFamily: "Pixelify Sans, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.5px"
rounded:
  # Stepped corners: radius N is a staircase N pixels deep, never a CSS border-radius. Values at the 2 px pixel.
  radius-0: "0px"
  radius-1: "2px"
  radius-2: "4px"
  radius-3: "6px"
  radius-4: "8px"
  radius-5: "10px"
  radius-6: "12px"
spacing:
  # Everything is counted in pixels (--chu-pixel). Values at the default 2 px pixel; they grow with data-chu-pixel.
  pixel: "2px"
  space-0: "0px"
  space-1: "2px"
  space-2: "4px"
  space-3: "6px"
  space-4: "8px"
  space-6: "12px"
  space-8: "16px"
  space-12: "24px"
  space-16: "32px"
  space-24: "48px"
  space-32: "64px"
  control-sm: "32px"
  control-md: "40px"
  control-lg: "48px"
  target-min: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.radius-4}"
    padding: "0 16px"
    height: "{spacing.control-md}"
  button-primary-sm:
    typography: "{typography.label-sm}"
    rounded: "{rounded.radius-3}"
    padding: "0 12px"
    height: "{spacing.control-sm}"
  button-primary-lg:
    typography: "{typography.label-lg}"
    rounded: "{rounded.radius-5}"
    padding: "0 20px"
    height: "{spacing.control-lg}"
  button-icon:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.ink}"
    rounded: "{rounded.radius-4}"
    padding: "0px"
    size: "{spacing.control-md}"
  button-soft:
    backgroundColor: "{colors.accent-light}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.radius-4}"
    padding: "0 16px"
    height: "{spacing.control-md}"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.radius-4}"
    padding: "0 16px"
    height: "{spacing.control-md}"
  button-outline-hover:
    backgroundColor: "{colors.surface-sunken}"
  button-outline-on:
    backgroundColor: "{colors.accent-light}"
    textColor: "{colors.ink}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.radius-4}"
    padding: "0 16px"
    height: "{spacing.control-md}"
  button-ghost-hover:
    backgroundColor: "{colors.surface-sunken}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.radius-4}"
    padding: "0 16px"
    height: "{spacing.control-md}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.radius-4}"
    padding: "0 10px"
    height: "{spacing.control-md}"
  input-readonly:
    backgroundColor: "{colors.surface-sunken}"
  tag:
    backgroundColor: "{colors.accent-light}"
    textColor: "{colors.ink}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.radius-5}"
    padding: "0 12px"
    height: "28px"
  tag-candy:
    backgroundColor: "{colors.accent}"
  chip-filter:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.radius-5}"
    padding: "0 12px"
    height: "28px"
  chip-filter-on:
    backgroundColor: "{colors.accent-light}"
    textColor: "{colors.ink}"
  card:
    backgroundColor: "{colors.surface-panel}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.radius-4}"
    padding: "{spacing.space-8}"
  card-panel:
    backgroundColor: "{colors.surface}"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.radius-3}"
    padding: "0 8px"
    height: "{spacing.control-sm}"
  nav-item-hover:
    backgroundColor: "{colors.surface-sunken}"
  nav-item-current:
    backgroundColor: "{colors.accent-light}"
    textColor: "{colors.ink}"
  tooltip:
    backgroundColor: "{colors.text}"
    textColor: "{colors.glint-white}"
    rounded: "{rounded.radius-2}"
    padding: "4px 8px 6px"
  tile:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.glint-white}"
    rounded: "{rounded.radius-3}"
    size: "56px"
  window:
    backgroundColor: "{colors.surface-panel}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.radius-4}"
  dialog:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.radius-4}"
    width: "448px"
  dialogue-box:
    backgroundColor: "{colors.marshmallow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.radius-4}"
    padding: "22px 24px 24px 16px"
---

# Design System: Blip

## Overview

**Creative North Star: "The Candy Box in a Meadow That Keeps Time"**

Blip is a 16-bit world you can build products in. Everything you can act on is the same candy box: a
saturated fill in three flat tones (a light band on top, the base, a shade band below), a one-pixel ink outline
with stepped corners, a few white glints, and a one-pixel ink drop. Behind the candy lies the meadow: a soft,
dithered, outline-free pastel landscape whose sky follows the clock, from Day through Sunset to Night. The
difference between the two is the whole interface. Candy means "press me"; pastel means "this is the world".

The look is the SNES and Mega Drive era with modern pastel colours: one square pixel size everywhere (2 CSS px by
default), two or three tones per colour, hard ink outlines, dithered gradients, and motion that moves a whole pixel
at a time in a few even steps. It is chunky and tactile rather than dense: controls are 32, 40 or 48 px tall,
every target is at least 24 px, and big words are a pixel display face over a readable pixel sans. Calmer tiers
(soft, outline, ghost) let dashboards and forms stay quiet, so a screen is never a wall of candy.

It is one coherent world, not a retro costume over a generic kit: no smooth radii, no blur, no glow, no
see-through washes, no easing curves, no black, no smooth 32-bit shading, no image files and no mascot. It began
as the shipped look of an Android TV launcher, where every rule was tested on a box with 1 GB of memory, and it
stays that light.

**The Light-by-Construction Rule.** No image files. Components are CSS, art is SVG drawn on the pixel grid, and
the world is drawn in the browser a pixel at a time, at its own resolution (the TV's picture is 320 x 180 world
pixels). Every byte is earned, and the budgets fail the build when one is not (all component CSS 34 KB gzipped,
each element 3 KB).

**Key Characteristics:**

- One square pixel (`--chu-pixel`, 2 CSS px by default; 3 or 4 for games and TVs) measures every outline, corner,
  gap, icon, letter and move.
- Ink (#1A1530), a deep violet, instead of black, for every outline, drop and piece of dark text; at Night the
  palette's own ink, darker than its page.
- Ten three-tone candies for what you can act on; soft, dithered pastels for the world behind it.
- Depth from a one-pixel drop, a one-pixel lift and sitting in when pressed; nothing blurs.
- Yellow is focus and nothing else.
- Pixel Bop at whole scales for big words; Pixelify Sans for UI and body text.
- Motion in two to six even steps, instant with reduced motion.
- Three schemes, Day, Sunset and Night, and Auto, which follows the clock; and palettes, which set the accent of
  each and Night's page.

## Colors

Ink, white and ten candies of three tones each, standing in front of the pastel palettes of a world that changes
with the time of day.

Components never use the candies directly: they use the scheme roles (`--chu-surface`, `--chu-text`, `--chu-accent`,
`--chu-danger-text`…), so one screen works in Day, Sunset and Night. The front matter holds the primitives and the
Day roles; a role's key is its custom property without the `--chu-` prefix (`primary`, which the format requires, is
`--chu-accent`).

Every candy is three flat tones, never a gradient: the **base**, a **light** band for the top (the base at about
0.65 of its saturation, full brightness) and a **shade** band for the bottom (the base at about 0.84 of its
brightness). Every text pair the scheme roles make (text and muted text on every surface, each intent's text on the
page and surfaces, labels on the accent and intent candies and on the dither over a disabled one, links, outlines,
selection) is checked against WCAG 2.2 AA in all three schemes when the tokens build (4.5:1 for text, 3:1 for
outlines), and a failing pair fails the build. The other candies' labels pass too; Liquorice's white label on its
light band is the closest, at 4.94:1.
When the person asks for more contrast (`prefers-contrast: more`), soft lines take the line colour, muted text the
text colour, and the ink edge of the focus ring is two pixels.

### Primary

- **Blue Raspberry** (#33A3FF; light #7FC8FF, shade #1478D6; `--chu-candy-blue`): the Day accent (`--chu-accent`)
  and the info intent in every scheme. The candy of the one main action, of what is selected or current, and of
  progress. It is too light for text, so accent text by Day is **Deep Raspberry** (#1660B8, `--chu-accent-text`).
- **Bubblegum** (#FF5FA2; light #FF9CC6, shade #E03A82; `--chu-candy-pink`): the Sunset accent. Accent text at
  Sunset is **Deep Bubblegum** (#B0245F).
- **Sky Soda** (#00C2FA; light #91DDFF, shade #0096C3): the Night accent, a sky blue made for the charcoal night
  (`--chu-palette-night-accent`). Accent text at Night is **Sky Glow** (#7ED8FF).
- **Grape Soda** (#9166FF; light #B48CFF, shade #6A3AD6; `--chu-candy-purple`): the TV's Night accent, lifted from
  its #8F5CFF so that ink labels on it pass AA; now the Grape palette's, with **Lilac Starlight** (#C9B3FF) as its
  text at Night.

### Secondary

The four intents. Each has its candy for fills, and a text tone that passes AA on the scheme's surfaces.

- **Sour Apple** (#4CD964; light #8CF09A, shade #2FAE46; `--chu-success`): success. Text #1E7A33, and #8CF09A
  at Night.
- **Sherbet Orange** (#FF7A1A; light #FFAA6B, shade #D95A0A; `--chu-warning`): warning. Orange, because yellow
  is taken by focus. Text #A8460A, and #FFAA6B at Night.
- **Gumball Red** (#FF3D4F; light #FF7A85, shade #D11F35; `--chu-danger`): danger: destructive actions, errors,
  invalid fields. Text #B31529, and #FF9EA6 at Night.
- **Info** is Blue Raspberry in every scheme. Text #1660B8, and #7FC8FF at Night.

### Tertiary

- **Lemon Drop** (#FFCC33; light #FFE680, shade #E6A100; `--chu-focus`): the focus ring, and nothing else in an
  interface. The game kit's coins and stars are the one exception, because they are game objects.
- **Spearmint** (#2FD3C5; light #7BE8DE, shade #16A99C; `--chu-candy-teal`): a candy for games, decoration and
  data series. Never an intent.
- **Liquorice** (#4A4562; light #726C8E, shade #332F48; `--chu-candy-slate`): a dark candy for things whose own
  colour is black. The one candy with white labels. Not an accent.

### Neutral

- **Ink** (#1A1530; `--chu-ink`): the darkest colour. Every outline (`--chu-outline`) and drop (`--chu-drop`), the
  focus ring's edge, the dialog scrim, labels on every candy but Liquorice, and dark text (`--chu-text` by Day and
  at Sunset). At Night `--chu-ink` is the palette's ink, **Charcoal Ink** (#0D0D0D) by default, so outlines and
  drops stay darker than the page.
- **Soft Ink** (#4A4470; `--chu-ink-soft`): muted text by Day and at Sunset (`--chu-text-muted`).
- **Glint White** (#FFFFFF; `--chu-white`): glints, POP letters, the Day surfaces (`--chu-surface`,
  `--chu-surface-raised`) and labels on Liquorice.
- **Marshmallow** (#FFF8EE; light #FFFFFF, shade #EFE3D2; `--chu-candy-cream`): cream panels that hold text
  (`--chu-surface-panel` by Day and at Sunset): cards, windows, menus, the dialogue box. As the `neutral` tone it is
  the quiet secondary button. Not an accent.
- **Cloud** (#F4F7FF; `--chu-bg`): the Day page, taken from the cloud in the Day sky.
- **Cloud Shade** (#E0E8FF; `--chu-surface-sunken`): wells, tracks and table stripes, and the hover fill of the
  outline and ghost tiers.
- **Lilac Mountain** (#B9B6EA; `--chu-line-soft`): dividers and decoration only. An outline that must be seen is
  `--chu-line` (Ink by Day).

### Sunset and Night

`data-chu-scheme="day"`, `"sunset"` or `"night"` sets a scheme on the page or on any part of it. With none set, the
page follows the device: Day, or Night in dark mode. Auto follows the clock as the TV did (Day from 6:00 to 17:00,
Sunset until 19:00, Night after). When the time of day changes, every colour changes in one step, because no mix of
a light and a dark palette keeps all text readable: the new palette comes in through an ordered dither, a quarter of
the pixels, then half, then three quarters, a frame each, so every pixel shows one whole palette and no text ever
sits on colours half way between two. Only the world backdrop behind the interface takes its time: its sky steps to
the new one over the next minute, as the TV's did.

**Sunset** keeps Day's ink text and cream panels and warms everything else: the page is **Sunset Cloud** (#FFE7EF),
surfaces are **Sunset Blush** (#FFF6F8), wells #F2C4D8, soft lines #BCAADF, and the accent turns Bubblegum.

**Night** turns the page charcoal and the text to starlight: the page is **Charcoal** (#171717), surfaces and
panels #202020, raised surfaces #2A2A2A, wells #0E0E0E; text is **Starlight** (#F3F3F3) and muted text #BEBEBE;
the outlines of calm controls are #9E9E9E and soft lines #343434; ink is **Charcoal Ink** (#0D0D0D); the accent
turns Sky Soda. These are the default palette's: a palette (below) sets Night's page, text, lines, ink and accent,
and the accent of Day and Sunset. The candies, their ink outlines and their ink labels never change: the candy is
the constant, the world is what changes. So a soft or
candy box stays light in every scheme, and what sits on it (text, links, fields, calm buttons, menus) takes the light
roles: ink text and lines, white surfaces, and the box's own colours for wells and dividers.

| Role (`--chu-…`) | Day | Sunset | Night |
|---|---|---|---|
| `bg` | #F4F7FF | #FFE7EF | #171717 |
| `surface` | #FFFFFF | #FFF6F8 | #202020 |
| `surface-raised` | #FFFFFF | #FFF6F8 | #2A2A2A |
| `surface-sunken` | #E0E8FF | #F2C4D8 | #0E0E0E |
| `surface-panel` | #FFF8EE | #FFF8EE | #202020 |
| `text` | #1A1530 | #1A1530 | #F3F3F3 |
| `text-muted` | #4A4470 | #4A4470 | #BEBEBE |
| `line` | #1A1530 | #1A1530 | #9E9E9E |
| `line-soft` | #B9B6EA | #BCAADF | #343434 |
| `accent` (light, shade) | #33A3FF (#7FC8FF, #1478D6) | #FF5FA2 (#FF9CC6, #E03A82) | #00C2FA (#91DDFF, #0096C3) |
| `accent-text` | #1660B8 | #B0245F | #7ED8FF |
| `info-text` | #1660B8 | #1660B8 | #7FC8FF |
| `success-text` | #1E7A33 | #1E7A33 | #8CF09A |
| `warning-text` | #A8460A | #A8460A | #FFAA6B |
| `danger-text` | #B31529 | #B31529 | #FF9EA6 |
| `selection-bg` | #7FC8FF | #FF9CC6 | #91DDFF |
| `link-visited` | #6A3AD6 | #6A3AD6 | #FF9CC6 |
| `disabled-dither` | #F4F7FF | #FFE7EF | #F3F3F3 |
| `disabled-dither-cream` | #B9B6EA | #BCAADF | #BEBEBE |
| `ink` | #1A1530 | #1A1530 | #0D0D0D |

The same in every scheme: `outline`, `drop`, `focus-edge`, `scrim`, `selection-text` and every intent's `-on`
(labels on candy) are Ink (the palette's at Night); `focus` is Lemon Drop; the intents' candies and their light and
shade bands do not change (a palette may move the warning, below). `text-inverse` is white by Day and at Sunset,
and Ink at Night.

### The world

The backdrop has a palette of its own for each time of day: 28 colours each (six sky stops, clouds, mountains,
snow, trees, hills, grass, dirt and birds), and shared colours for the sun (#FFF0C2), the moon (#FFF4D6), the stars
(#F3EFFF, #FFE9B8) and the flowers. The Day sky runs from #9FC2FF at the top to #FFE5D6 at the horizon, Sunset from
#8E8FD8 to #FFD3A8, Night from #1B1F20 to #2B4E5E: a charcoal sky that glows faintly in the accent at the horizon.
They are the `--chu-world-*` tokens; a scene drawn in CSS reads the current time of day's through `--chu-scene-*`.
Night's are the palette's, so each palette has a night sky of its own. The world never uses candy and never has
outlines.

### Palettes

A palette is the accent of each time of day and Night's page: its surfaces, text, lines, ink, accent and sky. One
attribute switches it, `data-chu-palette`, on `<html>` (or on an element that sets its own `data-chu-scheme`), with
`@jaatster/blip-tokens/palettes.css` loaded. With none set the palette is **Candy**, Blip's own: Blue Raspberry by
Day, Bubblegum at Sunset, and Sky Soda on charcoal at Night. The candies, the intents and the world of Day and Sunset
are the same in every palette.

| Palette | `data-chu-palette` | Accent | Night's page | After |
|---|---|---|---|---|
| Candy | (none) | Blue, pink, sky blue | Charcoal #171717 | |
| Grape | `grape` | #9166FF | Indigo #22244F | The TV's own Night |
| Ember | `ember` | #F99549 | Charcoal #1E1E1E | |
| Azure | `azure` | #6EB6FF | Blue dusk #141F2B | |
| Mint | `mint` | #2CCE99 | Green ash #19201D | |
| Bubblegum | `bubblegum` | #F387C7 | Pink dusk #281921 | |
| Dracula | `dracula` | #BD93F9 | #282A36 | Dracula by Zeno Rocha (MIT) |
| Nord | `nord` | #88C0D0 | #2E3440 | Nord by Arctic Ice Studio (MIT) |
| Catppuccin | `catppuccin` | #CBA6F7 | #1E1E2E | Catppuccin Mocha (MIT) |
| Gruvbox | `gruvbox` | #83A598 | #2B2724 | Gruvbox by Pavel Pertsev (MIT) |
| Tokyo Night | `tokyo-night` | #7AA2F7 | #1A1B26 | Tokyo Night by enkia (MIT) |
| Rosé Pine | `rose-pine` | #EBBCBA | #191724 | Rosé Pine (MIT) |

Every preset sets one accent for all three times of day; only Candy has one of its own for each. The well-known ones start from their
theme's accent, page and text colours and keep Blip's rules: ink outlines and drops, candy labels in ink, every
text pair at AA. An accent within 15 degrees of the warning's orange moves the warning to amber (#F7AE0C in Ember),
so a main button never reads as a warning; never to yellow, which is focus.

A palette is made from four levers: the accent's hue and strength, and Night's tint (how much of the accent the
dark page takes, from a neutral charcoal) and lightness. Every text colour is then nudged until it passes AA. The
[palette maker](https://jaatster.com/blip/theme/) turns the same levers and exports a palette as a token file, which
`blip-tokens` checks like Blip's own. The token build checks every pair in every palette and scheme, and
fails on one under AA.

### Named Rules

**The Ink Rule.** Nothing is black. The darkest colour is Ink (#1A1530), a deep violet, and every outline, drop,
scrim and piece of dark text uses it, so even the shadows belong to the palette. At Night the ink is the palette's
own, a step darker than its page (Charcoal Ink, #0D0D0D, by default), so outlines and drops still read on a dark
page; it is never pure black.

**The Candy-on-Pastel Rule.** Saturated, outlined colour means "you can act on this". The world behind it is soft,
dithered and has no outlines, so what you can press is never in doubt. Candy never sits on candy, and the world
never wears candy.

**The Yellow Rule.** Yellow means focus. The focus ring is the only yellow in an interface (coins and stars in a
game are the exception), so it can never be mistaken for decoration. Warnings are orange.

## Typography

**Display Font:** Pixel Bop (with Pixelify Sans, Blip Fallback, system-ui, sans-serif)
**Body Font:** Pixelify Sans (with Blip Fallback, system-ui, sans-serif)
**Label/Mono Font:** labels are Pixelify Sans bold in capitals; code alone uses ui-monospace, SFMono-Regular, Menlo,
Consolas, monospace (`--chu-font-mono`)

**Character:** Pixel Bop is Blip's own face: bold pixel capitals on a 7-pixel grid with 2-pixel vertical
strokes, so a word reads across a room, and tabular figures, so a clock never shifts. Pixelify Sans is the
readable pixel sans beside it, for everything below a heading, with every glyph on its own pixel grid and no
ligatures. Both draw Latin, Cyrillic and Greek; other scripts take the system font, and emoji the system's, sized to
the capitals. Both are under the SIL Open Font License.

### Hierarchy

- **Display** (Pixel Bop 400, 80px at scale 4, line-height 1.2, `ss02`): hero titles on wide screens, splash words,
  big scores. The hero title is scale 2 in a container under 600 px, 3 from 600 px and 4 from 1024 px.
- **Display small** (Pixel Bop 400, 60px at scale 3, line-height 1.2, `ss03`): hero titles on medium screens, the
  pause screen's title, a feature's one big number.
- **Headline** (Pixel Bop 400, 40px at scale 2, line-height 1.2, `ss02`): page titles and the big numbers of stats.
  Scale 2 is the default of the display style.
- **Headline small** (Pixel Bop 400, 20px at scale 1, line-height 1.2, square pixels): dialog and window titles,
  the dialogue box's name tab, a brand on a narrow bar.
- **Title** (Pixelify Sans 700, 22px, line-height 1.15): section titles in UI and the titles of large cards. At
  22 px Pixelify's own pixels land on the 2 px grid.
- **Lead** (Pixelify Sans 400, 18px, line-height 1.5): an introduction under a title; in bold, a card's title; at
  500, the dialogue box's text; large inputs.
- **Body** (Pixelify Sans 400, 16px, line-height 1.5): body text, inputs, cards, dialogs. Blocks keep copy to
  between 44 and 60 characters a line (the hero's lead 46ch, the call-to-action band 52ch, the features lead 60ch).
- **Body small** (Pixelify Sans 400, 14px, line-height 1.5): secondary text, sidebars, table cells; in bold and
  sentence case, a field's label.
- **Caption** (Pixelify Sans 400, 12px, line-height 1.5, muted): captions and metadata.
- **Label** (Pixelify Sans 700, 14px, line-height 1, 0.5px tracking, capitals): buttons, tabs, the app bar's
  links, small headings. Small buttons and tags use 12px; large buttons 16px.

Big text has two outlined styles, drawn with text shadows in whole pixels. **POP** is white letters with a
one-pixel ink outline and a drop one pixel down and right that hugs the outline in the tone's shade; with
`data-pop` repeating the text, the bottom two rows of every letter take the tone's light colour. It reads on every
sky. **OUTLINE** is one colour (usually white) with a thin ink outline and no drop, for small text that can land on
any part of a picture.

### Named Rules

**The Whole-Scale Rule.** Pixel Bop is set only at font-size = 10 x pixel x scale, with scale 1 to 4, so every
letter pixel is a Blip pixel and capitals are 7 x pixel x scale tall (14, 28, 42 and 56 px at the 2 px pixel).
Between whole scales its pixels fall between screen pixels and blur or wobble. Scales 2 and 4 round their corners
with `ss02` (EPX), scale 3 with `ss03` (AdvMAME3x), so each rounding step is a whole pixel (two at scale 4).

**The Small-Text Exception.** Pixelify Sans is the one thing allowed off the grid, at five sizes (12, 14, 16, 18
and 22 px at the browser's default text size), because a 7-pixel capital is too small to read at body sizes. Its
sizes do not grow with the pixel, so text stays readable when the pixel is 3 or 4. They are in rem, so they grow
with a larger default text size the person sets (20 px makes body text 20 px), and never fall below these; what is
counted in pixels keeps its size. Ligatures are off, because in a pixel font fi and fl merge into a glyph that
reads as another letter, and in titles and reading text a long word hyphenates in the page's language (set `lang`)
rather than run out of its box.

**The Natural-Case Rule.** Write labels and headings in sentence case and let the CSS set the capitals. Pixel Bop
has no lower case, and screen readers, search and copying need the real one.

## Layout

The pixel is the unit of layout. `--chu-pixel` is 2 CSS px by default, and every length in Blip is a whole
number of it: a spacing step, a radius, a control height, or `calc(N * var(--chu-pixel))`. **The pixel switch**,
`data-chu-pixel="3"` or `"4"` on the page or on one section, makes everything inside it chunkier and still crisp (3 px
for a game screen, 4 px for a TV): spacing, radii, controls, icons, Pixel Bop and the world all grow; Pixelify Sans
keeps its size. Sizes in the front matter are given at the default 2 px pixel.

**Spacing** is eleven steps counted in pixels: 0, 1, 2, 3, 4, 6, 8, 12, 16, 24 and 32 (0 to 64 CSS px at the
default pixel). Steps 1 to 4 are for the inside of controls and tight groups, 6 and 8 for the parts of a card and
the items of a list, 12 to 32 for sections. Three layout primitives carry the rhythm and have no colour of their
own: a **stack** (one under another, 16 px apart by default), a **cluster** (a wrapping row, 8 px apart; with its
switch, items share a row while it is at least 320 px wide and stack one per line below that) and a **grid** (as
many equal columns as fit, each at least 192 px, 16 px apart).

**Sizes** are pixels too: controls are 16, 20 or 24 pixels high (32, 40 or 48 px), icons 12 pixels (24 px) or 24
(48 px), and no target is smaller than 12 pixels (24 px, WCAG 2.5.8). Candy components keep one pixel of margin on
their right and below, so a drop never touches a neighbour.

**Container queries, not the window.** There are three widths: compact (under 600 px), medium (from 600 px) and wide
(from 1024 px). `--chu-breakpoint-medium` and `--chu-breakpoint-wide` are for page shells; components answer to their
own container. The hero's title steps from scale 2 to 3 to 4 at 600 and 1024 px of its container. The app bar folds
its links behind a menu button under 64rem of its own width (37.5rem with `data-collapse="medium"`: 1024 and 600 px at
the default text size, sooner when the text is bigger). In an app shell
(a container named `chu-shell`) the sidebar becomes a rail of icons under 1024 px and steps aside under 600 px, where
the bottom bar takes over. Vertical tabs become a row again under 480 px, and a horizontal card puts its picture
above the text once both no longer fit side by side.

### Named Rules

**The One Pixel Rule.** Every outline, corner step, gap, icon, letter and movement is a whole number of one square
pixel. Nothing is blurred, rotated or scaled by a fraction. What a screen shows depends on its ratio of screen pixels
to CSS pixels. At 100%, 200% and 300% every pixel lands on whole screen pixels: exact, and no two differ in size. At
125%, 150%, 175% or 262.5% a pixel is a fraction of screen pixels wide, so where two colours meet (a box's outer
edge, the edge of a band) the browser blends the screen pixel between them, a limit no CSS can lift; where a box is
one colour nothing blends, because its layers overlap instead of meeting at seams. At 150% a box that starts on an
even CSS pixel is exact. The only lengths off the grid are Pixelify Sans text and the 1px system borders of Windows
high-contrast mode.

**The Container Rule.** Components answer to their container, not to the window, so the same card, grid or app bar
lays itself out in a sidebar, a dialog or a whole page.

## Elevation & Depth

Flat, with one light at the top left. There is no ambient shadow and no blur: depth is a one-pixel ink drop down and
to the right, and things move up off it or down into it. Every component uses the same three heights, so depth
always means the same thing. A box at rest stands on its drop; on hover it lifts one pixel and its drop grows one
pixel, so the shadow stays where it was, and the TV's ring goes round it (white, with an ink edge); pressed, it sits down into its drop and the drop disappears; selected or
on, it stays sat in, its bands swap (shade on top, light below) and its face drops a pixel inside the outline,
leaving an ink shadow along the top and left: the 16-bit pushed-in look, which reads without colour. A selected tile
is the one exception: it lifts two pixels, as the TV's app blocks did.

### Shadow Vocabulary

- **Flat** (drop 0): the calm tiers (outline, ghost), wells, rows of a list or menu, segmented rails.
- **Control** (drop 1, `--chu-drop-size: 1`): buttons, tags, cards, tiles, keycaps. The default.
- **Floating** (drop 2): dialogs, drawers, popovers and toasts.
- **The drop itself** (colour `--chu-drop`, Ink): drawn by the candy box's masks, not by `box-shadow`. It is the
  outline's own stepped shape again, offset by the drop size (one pixel, 2 CSS px) down and to the right, so it
  follows every corner.
- **The focus ring** (`--chu-focus` one pixel outside the shape, `--chu-focus-edge` one pixel beyond): drawn by
  dilating the box's shape with zero-blur `drop-shadow()` filters, so it follows the stepped corners. Anything that
  is not a box gets the square ring: `outline: var(--chu-pixel) solid var(--chu-focus); box-shadow: 0 0 0 calc(2 *
  var(--chu-pixel)) var(--chu-focus-edge)`.
- **The scrim** (`--chu-scrim`, Ink): behind a modal dialog or drawer, ink on every other pixel.
- **Stacking** (the `--chu-layer-*` tokens): raised 1, sticky 100, dropdown 200, overlay 300, modal 400, toast 500,
  tooltip 600.

### Named Rules

**The One Light Rule.** One light, top left. Things cast a one-pixel ink drop down and to the right, raised things
lift a pixel off it, and pressed and chosen things sit down into it. Nothing blurs and nothing glows.

**The Dither Rule.** See-through is a dither, never a wash. The scrim behind a dialog is ink on every other pixel, a
disabled control is covered by a checkerboard of a light colour (`--chu-disabled-dither`: the page colour by Day and
Sunset, the night text at Night) so its label still reads, a skeleton fills in with a dither, and the sky's gradient is
ordered by a 4 x 4 Bayer matrix. What is behind stays legible as a shape, and colours never mix. A disabled control
always shows its dither (a segment, bare on its sunken rail, becomes a dithered well in a soft outline), drawn
unsmoothed, so at 125% to 262.5% its squares stay crisp.

## Shapes

One shape does almost everything: the candy box, drawn in CSS at any size. From the outside in it is:

1. **A one-pixel ink outline** with stepped corners. Radius N is a staircase N pixels deep, generated so that a box
   of any width and height has the TV's corners; each edge is snapped to whole pixels from the box's top-left.
2. **A light band** along the top (2 pixels by default, 4 on a button).
3. **The base** colour in the middle.
4. **A shade band** along the bottom (2 pixels by default, 4 on a button).
5. **Glints**: three white pixels at the top left and one at the top right, set in from the corners by 0.7 of the
   radius (at least 2 pixels).
6. **The drop**: the outline's shape again, one pixel down and to the right (see Elevation & Depth).

The box comes in tiers, loud to quiet: **candy** (all of the above), **soft** (the tone's light as the fill and its
base as the bottom band, no glints), **outline** (a line outline round the surface, no bands, no drop), **ghost**
(nothing until it is hovered or focused) and **panel** (the surface inside an ink outline, with a drop: cards,
windows, menus). Corners per component: buttons and inputs radius 3, 4 and 5 for small, medium and large; tags 4, 5
and 6; cards 3, 4 and 5; tiles 2, 3 and 4; dialogs and windows 4; the app bar's and sidebar's items 3; a window's
controls 2; a drawer 0, flush with the screen's edge. At small sizes a large radius reads as a pixel circle: that is
how the radio button is round.

Title bars are the box's own top band grown tall, so they follow the corners: a window's bar is 16 pixels, a
dialog's sits in the tone's light. Popovers and tooltips point at their trigger with a pixel nub. Glyphs inside
components (checks, chevrons, crosses, radio dots) are drawn on whole pixels and coloured with the text. Icons are
drawn on a 12 x 12 grid like the item icons of a 16-bit game: solid silhouettes with their details cut out, every line
at least two pixels thick, diagonals too, and no lone pixels, so they read at 24 px; round objects drop their corner
pixels, like the candy box. Pictures in cards sit in a one-pixel ink frame and are
never smoothed.

### Named Rules

**The Candy Box Rule.** Everything you can act on is one shape, the candy box, at a different size, radius, tier
and tone. A component never draws its own outline, drop, focus ring or dither: it sets the box's variables, so it
matches every other component without trying.

**The Stepped Corner Rule.** Corners are staircases of whole pixels, never a smooth curve: radius 0 to 6 pixels from
the tokens (the box also draws 7 and 8). A CSS `border-radius` anywhere breaks the world.

## Components

Tactile, chunky, pressable. Every control is a candy box on a native element (a real `<button>`, `<input>`,
`<dialog>`, `<details>` or popover), so it works before any script runs; Web Components add behaviour only where it
is needed (tabs, menus, comboboxes, toasts), and wire what a framework renders later as it arrives. Tiers go loud to
quiet, tones go by meaning, sizes come in three heights (`sm`, `md`, `lg`) wherever there is a size.

### The candy box

The one building block (its anatomy is under Shapes). A component is the box plus a class
(`class="chu-box chu-button"`) that sets the box's variables: its radius, its band heights in pixels, its drop, and
which colours its tier paints. Its tier comes from `data-variant` (candy, soft, outline, ghost, panel), its colour
from `data-tone` (accent, info, success, warning, danger, neutral, or a candy by name), and its states from native
attributes and ARIA. Because every component is the same box, a new one matches the rest without trying. In
Windows high contrast it keeps a real border, on is the system highlight and busy keeps its dots; printed, it keeps
its colours (Day's, whatever the screen shows) even with the browser's background graphics off, and scrims are left
off.

### Buttons

- **Shape:** stepped corners of radius 4 (8px) at the default 40 px height; radius 3 at 32 px (small) and 5 at
  48 px (large). Icon-only buttons are square and need a name.
- **Primary (candy):** the accent's base with a 4-pixel light band and a 4-pixel shade band, glints, an ink
  outline and a one-pixel drop; an ink label in Pixelify Sans bold 14px, capitals, 0.5px tracking; padding 0 16px
  (12px small with a 12px label, 20px large with a 16px label); a 24 px icon before or after the label.
- **Hover / Focus:** hover lifts one pixel (the drop grows to keep the shadow in place) inside the TV's white ring
  with its ink edge; keyboard focus draws the yellow ring instead; pressed sits in its drop; on (`aria-pressed="true"`) sits in with the bands
  swapped and an ink shadow inside its top and left; disabled is dithered with a light colour and loses its drop;
  busy (`aria-busy="true"`) hides the label, keeps its width, and steps in three dots, one, two, three.
- **Secondary / Ghost / Tertiary:** soft (the tone's light fill, its base as the bottom band) for the second action;
  outline (a line outline round the surface, no drop; hover fills it with the sunken surface) and ghost (bare until
  hovered or focused) for toolbars, tables and forms. Tones: `accent` by default; `info`, `success`, `warning` and
  `danger` by meaning; `neutral` (Marshmallow) for a quiet Cancel; the raw candies for games and decoration.

### Chips

- **Style:** the TV's pill. A tag is soft by default (the tone's light fill, its base as a bottom band, an ink
  outline, a one-pixel drop), radius 5, 28 px high (24 small, 32 large), Pixelify Sans bold 12px in capitals.
- **State:** a tag labels (a rarity, a status). A removable tag carries its own 24 px cross button, named for what
  it removes. A filter chip is a toggle in the outline tier: on (`aria-pressed="true"`) it sits in, filled with the
  accent's light and outlined in ink. A tag you act on can be candy.

### Cards / Containers

- **Corner Style:** radius 4 (8px); 3 when small, 5 when large.
- **Background:** a cream panel by default (`--chu-surface-panel`: Marshmallow by Day and at Sunset, #2C2F66 at
  Night); the panel tier is the plain surface; soft and candy tiers tint the whole card, light in every scheme, and
  what sits on them takes the light roles; a tone on a cream card paints a 3-pixel strip of its light colour along
  the top, following the corners.
- **Shadow Strategy:** the one-pixel ink drop of a control (see Elevation & Depth). A card that is a link lifts
  on hover.
- **Border:** the one-pixel ink outline with stepped corners.
- **Internal Padding:** 16px (8 pixels), with 12px between its parts; 12px when small, 24px when large.
- Pictures sit in a one-pixel ink frame and are never smoothed. A horizontal card puts its picture beside the text
  while both fit. Never put a card inside a card.
- A container you read is never a slab of candy, however much it should stand out: the featured pricing plan is a
  raised panel (a two-pixel drop) with a band of its tone along the top, its ribbon in its candy and the row's one
  candy button; a call to action in a box is soft. Candy stays on what you press.

### Data

Calm by design, so candy stays for what you act on. Tables and lists are white panels with soft, whole-pixel row
lines (or zebra rows in the sunken surface); rows you can press are ghost boxes; a selected row takes the accent's
light. On a phone a table can stack (`data-stack`): each row becomes a block, its heading first, then each cell as a
label and its value. A stat is a label, a Pixel Bop POP number and a pixel arrow in the colour of what the move means,
with a mark that says it in shape too (the success sign's check for good news, the danger sign's exclamation mark for
bad), after words that say both. An avatar is
a picture drawn pixelated in a candy box, or initials in Pixel Bop at scale 1. A badge is a small candy box with a
count, a word or nothing (a dot). A keycap is a cream candy box with a thicker shade band, so it stands up off the
page. An accordion is a stack of native `<details>` whose chevron steps round a frame at a time. A divider is a
line of whole pixels: solid, dashed or dithered.

### Inputs / Fields

- **Style:** the calm box, because a native input cannot wear the candy: a line outline (Ink by Day), the surface
  as fill, a one-pixel sunken inset along the top, no drop. Radius 4 at 40 px high (3 at 32 px, 5 at 48 px), 16px
  text (18px large), 10px padding.
- **Focus:** the box draws the yellow ring round the whole field while the input inside has keyboard focus.
- **Error / Disabled:** invalid (`aria-invalid="true"`, or `:user-invalid` once the person has tried) outlines the
  field in the danger text colour with the danger light as the inset, and the field's message carries a pixel sign
  and words. A valid field can take the success tone the same way. Read-only is flat (the sunken fill, no outline,
  no bands); disabled is dithered, with a soft outline and muted text.
- Checkboxes (22 px square; 18 and 26) are the calm well when off, candy with an ink check when on and candy with an
  ink bar when mixed. Radios are the same box with a radius that reads as a pixel circle and an ink dot. A switch is a
  cream candy knob that hops along a candy track two pixels a step. A slider is a chunky groove with a cream knob.

### Navigation

- **Style:** the app bar is a panel along the top: the brand in Pixel Bop POP (scale 2, scale 1 under 400 px), then
  ghost links 32 px high in Pixelify Sans bold 14px capitals, then actions at the end. The sidebar is 240 px of
  ghost items in 14px (medium weight, bold when current) under small muted headings in capitals.
- **States:** hover fills a link with the sunken surface and shows its outline; the current page
  (`aria-current="page"`) sits in as an accent-light chip with an ink outline; focus is the yellow ring.
- **Tabs:** candy tabs rest in cream and the selected one takes the accent and sits in; soft and outline tiers for
  calmer screens; the underline variant marks the selected tab with a stepped bar. A row too long for its box
  scrolls on screen and prints wrapped, every tab in sight. A menu is a cream panel whose item under the keyboard
  gets the yellow focus row.
- **Mobile treatment:** the app bar folds its links behind a menu button into a popover; the sidebar becomes a rail
  and then steps aside under 600 px of the shell, where a bottom bar of three to five destinations (icon over label,
  set tight so five fit across a 320 px phone, the current one sitting in) takes over.

### Feedback and overlays

- **Dialog:** a raised panel, radius 4, 448 px wide (320 and 640 for small and large), with a two-pixel drop, a
  title bar in the tone's light under an ink rule, and a Pixel Bop title at scale 1. It stands over the dithered
  ink scrim and pops in one pixel low for a frame. Its body scrolls when it must: while more lies below, an ink
  rule runs over the footer and the text dithers out above it in three hard steps (never a wash), and a pixel
  scrollbar stands beside it. Any scroller that hides more to one side says so the same way. Paper cannot scroll,
  so an open dialog prints its whole body, grown over the page.
- **Toast:** floats in a corner with a two-pixel drop and a stepped countdown bar; it stays 5 seconds, pauses while
  pointed at or focused, and an error stays until dismissed. **Alert:** soft tone fill, ink outline, the tone's
  colour as a lip along the bottom, and a pixel sign that differs in shape as well as colour.
- **Tooltip:** the inverse of the page (Ink with white text by Day, Starlight with ink text at Night), 12px, radius
  2, with a pixel nub; it shows after 400 ms on hover and at once on keyboard focus.
- **Progress:** a row of candy blocks with one-pixel gaps in an ink-outlined well (filling a whole block at a time
  where the browser can read the value in CSS); empty blocks are dark, as in the game's HUD (Liquorice's shade by
  Day and at Sunset, the palette's page at Night), so full and empty differ in lightness by 3:1 or more, not only in
  hue. A rating's empty stars likewise lose their ink outline. A loader is a ring of eight pixel dots whose lit arc
  steps one dot a frame; a skeleton fills in with a dither, never a shimmer.

### Tile

The TV's app block: a 56 px (28 pixels) candy square with stepped radius 3, a 6-pixel light band and a 5-pixel
shade band, and a white glyph with a one-pixel ink outline, one pixel above the middle; its label sits below in 12px
bold capitals. Selected, it lifts two pixels inside a ring (one pixel of white with an ink edge), a 10-pixel arrow
bobs above it for six beats, and a glint (a white band two pixels wide) sweeps across it once, in five frames. With
keyboard focus the ring and the arrow turn yellow. Tiles sit in a grid that the arrow keys move through: a
launcher, an inventory, a level select. Small and large tiles are 40 and 72 px.

### Window

A pixel window for game menus and retro dashboards: a cream panel (radius 4) whose top band is grown into a
16-pixel title bar in the tone's light, under a one-pixel ink rule, with a Pixel Bop POP title at scale 1 and 24 px
candy controls (cream, and red to close). An optional status bar is the shade band grown into a sunken strip. The
bars are the box's own bands, so they follow its stepped corners. It does not drag.

### Dialogue box

The game kit's RPG text box, the TV's speech bubble grown into a component: a Marshmallow candy panel (radius 4,
3-pixel bands) that stays a light island in every scheme, with the speaker's name on a small candy tab riding the
top edge in Pixel Bop at scale 1 (a tone per speaker), a framed 72 px portrait, and Pixelify Sans 18px text at
weight 500. Each page types itself in a letter every 50 ms, holding 260 ms after `.` `!` or `?` and 130 ms after a
comma, with an optional chip voice. A blinking ▼ button shows the rest, turns the page, or continues; the box is as
tall as its fullest page, so it never jumps.

### World backdrop

The meadow itself, from the effects kit: five layers back to front (a sky of six stops dithered with a 4 x 4 Bayer
matrix, with the sun, the moon and stars; snowy peaks; hills with trees; near hills; grass and dirt), drawn in the
browser at the page's pixel and redrawn only when its size, its screen or its time of day changes. On a 125% or
175% screen a world pixel is the nearest whole number of device pixels, so the picture stays crisp and even. At 320
x 180 world pixels it is the TV's picture, pixel for pixel; a wider world carries the landscape on to the sides. It
follows the page's scheme, or the clock on its own. Clouds can drift right a whole pixel at a time, layers slide 0
to 4 pixels against the pointer in two steps (each on a whole pixel, even when the next move cuts a slide short),
stars flare at night, and now and then birds cross or a star shoots; that motion runs on, so it keeps to where it adds
to the look and comes with the motion toggle (the Pause Rule). With reduced motion it is a still, correct frame, and
when the device or the page asks for less motion it stops at once, where it is. It is decoration: hidden from
assistive technology, in high-contrast mode and on paper. Big text on it is
POP, small text OUTLINE or a one-pixel halo in the page colour; anything else needs a panel. The words on it are
named in its `avoid`, and the sun, the moon and shooting stars keep clear of them: the nearest clear place in their
lane of the sky, in whole pixels, worked out again whenever the words or the world resize; with no clear sky at all
they stay out of sight. Stars and clouds that would sit behind the words are left out (no star lands between words
or under letters), and a drifting cloud passes behind them out of sight. Nothing in the sky sits behind text.

### States and motion

Every state has one look, drawn by the box: learn them once on a button and you can read them on a tab, a checkbox
or a field. Durations are frame tokens: a frame 40 ms, a nudge 80, a slide 100, a pop 120, a glide or a fade 160,
the idle beat 400. A menu, popover, toast or bubble pops in (one pixel low for a frame, then in place); a title's
letters drop in (two pixels high for a frame, then landed, 30 ms apart); a coin block bumps (up 6 pixels, then 3,
then down); a wrong answer shakes (two pixels each way, then one). Anything that blinks or bobs stops after six
beats, under five seconds; only loaders, and ambient motion beside the motion toggle, run on. Screen changes use
an ink dissolve (nine frames of 30 ms to cover the screen, nine to
clear it), an ordered dither, or a mosaic of 2 to 12 pixel blocks, never a cross-fade. A change of time of day is
an ordered dither straight from one palette to the next, in three frames.

**The One-Look Rule.** Every state has one look, drawn by the candy box: hover lifts one pixel in the white ring, pressed sits in its
drop, selected sits in with its bands swapped and an ink shadow inside its top and left, focus is the yellow ring,
disabled is dithered, busy is three stepped dots, invalid is the danger tone. No component invents its own.

**The One Candy Rule.** One candy button per view is the main action. Secondary actions are soft; toolbars, tables
and forms use outline and ghost, so the candy keeps its meaning.

**The Snap Rule.** Nothing eases. Movement goes through 2 to 6 even steps (`steps(n, jump-end)`), a whole pixel at a
time, on 40 ms frames, never along a curve; a one-pixel move is a single step. With reduced motion every duration
is 0 ms and every effect arrives at once.

**The Pause Rule.** Ambient motion, the world's drifting clouds, flaring stars and passing birds, runs on, so it goes
only where it adds to the look: a hero, a title or attract screen, a call to action, a game's stage. Never behind
reading text, forms or dashboards. A page that has it shows the motion toggle (`<chu-motion-toggle>`), which sets
`data-chu-motion="reduce"` on `<html>`: everything that moves on its own stops within a frame, where it is, and carries
on when the toggle is pressed again. The choice is remembered, and it adds to the device's reduced motion, never
overrides it.

## Do's and Don'ts

### Do:

- **Do** build every pressable thing from the candy box on native HTML (`<button class="chu-box chu-button">`),
  choosing its tier with `data-variant` and its colour with `data-tone`.
- **Do** colour with the scheme roles (`--chu-surface`, `--chu-text`, `--chu-accent`, `--chu-danger-text`…), so one
  screen works in Day, Sunset and Night.
- **Do** keep one candy button per view for the main action; use soft for the second action and outline or ghost
  in toolbars, tables and forms.
- **Do** measure in whole pixels: `--chu-space-N` (0 to 32), `--chu-radius-N` (0 to 6), `--chu-control-sm|md|lg`
  (32, 40, 48 px) or `calc(N * var(--chu-pixel))`.
- **Do** set big words in Pixel Bop with `.chu-display` and `data-scale` 1 to 4; use POP for titles over the world
  and OUTLINE for small text over a picture.
- **Do** write labels and headings in sentence case and let the CSS set the capitals.
- **Do** move in `steps(n, jump-end)` with n of 6 or fewer, time it with the duration tokens (40 ms frame, 80 ms
  nudge, 160 ms glide), and stop it under `prefers-reduced-motion`.
- **Do** show a disabled control with the dither, keeping its colour, so people can still tell what it would do.
- **Do** keep one pixel of room right of and below every candy box for its drop.
- **Do** name icon-only buttons for their action ("Delete save", not "Trash").

### Don't:

- **Don't** use black, grey or translucent `rgba()` shadows: Ink (#1A1530) is the darkest colour, and depth is the
  one-pixel ink drop.
- **Don't** make anything yellow but the focus ring, coins and stars; warnings are Sherbet Orange (#FF7A1A).
- **Don't** put a candy button on a candy background, or an outline on the world: candy stands on pastel.
- **Don't** use `border-radius`, blur, glows, soft shadows, smooth gradients or see-through washes: corners step,
  drops are one pixel, gradients are dithered.
- **Don't** use `ease`, `linear` or `cubic-bezier()` timing, or rotate, scale or move anything by a fraction of a
  pixel.
- **Don't** set Pixel Bop between whole scales, letter-space it except in whole pixels, or use it for body text,
  inputs or long labels.
- **Don't** draw a component's own outline, drop, focus ring or disabled look; set the box's variables instead.
- **Don't** invent a new look for a state: no greyed-out controls, no coloured glow for focus, no spinner that
  changes a button's size.
- **Don't** put a card inside a card.
- **Don't** ship image files for UI or art: icons are 12 x 12 SVG, sprites are SVG on the grid, and the world is
  drawn in the browser.
- **Don't** add a mascot or brand logos: the universal system has neither.
