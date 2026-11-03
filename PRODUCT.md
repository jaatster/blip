# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

Web first (CSS, Web Components, React). Android and iOS through exported tokens and icons; no native component
code yet.

## Stack

A pnpm monorepo. Design tokens in the W3C DTCG 2025.10 format with a resolver document; plain layered CSS;
dependency-free Web Components in TypeScript; typed React wrappers. Build tools are plain Node scripts with as few
dependencies as possible. Chosen by the owner: "Tokens + CSS + Web Components, plus React".

## Users

- Developers and designers building web apps and dashboards, websites and landing pages, games and game UIs,
  and native mobile apps, who want a complete, playful pixel-art system rather than a retro costume over a generic
  kit.
- AI coding agents generating screens in the system, through DESIGN.md, the token types and the Custom Elements
  Manifest.

## Product Purpose

Blip is an open-source design system: a 16-bit pixel-art look (candy-coloured, ink-outlined controls on a
soft dithered world, one square pixel size everywhere, motion that snaps) packaged as tokens, components, icons, a
font and effects. Success: someone can build a whole product in it without inventing a single off-system colour,
size or motion, and it stays light enough for a 1 GB TV.

## Positioning

It began as the shipped look of a real Android TV launcher's Home screen and screensaver, where every rule (the
pixel grid, ink outlines, stepped motion, the candy box, the dithered world) was tested on hardware. Other pixel
kits restyle generic components with a pixel font; Blip is one coherent world with its own font (Pixel Bop),
its own icons on the same grid, and a world backdrop that follows the time of day.

## Operating Context

- Used in browsers (Baseline 2024 and later, with progressive enhancement), in React apps, in games, and on TVs.
- Consumed as npm packages under `@jaatster/blip-*`, by people and by AI agents.
- Designers use it in Figma through exported variables, icons and components.

## Capabilities and Constraints

- Core packages plus optional kits (game, blocks, effects, sound). Themes are independent switches: scheme (Day,
  Sunset, Night, Auto), pixel size (2 px default), palette (Candy, and eleven presets).
- No runtime dependencies. No image files: components are CSS, art is SVG, worlds are drawn at runtime.
- Size budgets enforced in CI.
- Licences: MIT for code and icons; SIL Open Font License for Pixel Bop and Pixelify Sans; Pixel Operator is CC0 1.0.
- Nothing is pushed to GitHub or published to npm without the owner's go-ahead.

## Brand Commitments

- The name is **Blip**: the tiny pop of a 16-bit sound and a dot of light on a screen. Its pixel
  display font is **Pixel Bop**. UI and body text use **Pixel Operator** (CC0), with **Pixelify Sans** (OFL) for the
  letters it lacks.
- No mascot in the universal system.
- The incumbent rules from the TV are binding: every pixel the same size, ink never black, candy on pastel, motion
  snaps, yellow means focus.

## Evidence on Hand

- The TV implementation and its spec, in the TV project outside this repo:
  `launcher/app/src/main/java/com/gathin/tvhome/Pixel*.java`.
- No users, testimonials or adoption numbers yet; none may be invented.

## Product Principles

1. One coherent world, not a kit of retro costumes.
2. Light by construction: every byte is earned.
3. Accessible by default: WCAG 2.2 AA, keyboard, high-contrast mode, reduced motion.
4. Modular and typed: install only what you use; contracts are explicit and versioned.
5. Playful, never in the way: delight is opt-in and never blocks a task.

## Accessibility & Inclusion

WCAG 2.2 AA as the floor. Every text pair is contrast-checked when the tokens build. Windows forced-colors mode,
prefers-reduced-motion and keyboard-only use are first-class.
