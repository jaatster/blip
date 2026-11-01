# Conditions

The visual tests shoot every example at rest: 100%, English, one scheme at a time, motion off. Real use breaks where
conditions meet (Night and a disabled dither, selected and focused, a 125% screen, German, right to left, paper,
Windows high contrast, motion that never ends). These lanes put **every example** (and a few fixture pages) under
those conditions and **measure** it, so a new component is covered as soon as it has an example, without a test of
its own. They assert on measurements, not screenshots, so they run the same on macOS and Linux.

| Lane | File | Guards |
|---|---|---|
| Contrast | `contrast.spec.ts` | Every run of text against the pixels under its glyphs (shot with the glyphs and without), by Day, Sunset and Night: at rest, with every control forced to hover, focus, active and visited (`data-blip-state`), and with real keyboard focus on what is selected, current, pressed or checked. 4.5:1, or 3:1 for large text; POP and OUTLINE text against its outline. A progress bar's, meter's or rating's filled part against its empty part: 3:1 in lightness. |
| Seams | `seams.spec.ts` | Each candy box's own pixels on one page switched between device pixel ratios: no blended pixel at 100%, 200% and 300%; no seam (a blend where the box is one colour all round) at 125%, 150% (also at odd positions), 175% and 262.5%. |
| Forced colours | `forced-colours.spec.ts` | Windows high contrast, dark and light: every pressed, selected, current or checked control looks different from the same control off; a busy control looks different from not busy, and shows a cue where it hides its label. |
| Right to left | `rtl.spec.ts` | `dir="rtl"` and `lang="ar"`: no sideways overflow; progress, meters, ratings and sliders fill from the right; a drawer's end is the left edge; every directional glyph the docs place at a start or end turns round; the layout mirrors. |
| Long words | `long-words.spec.ts` | German compounds in every word of six letters or more, at 360 and 320 px, at a default text size of 16, 20 and 24 px: the page gets no wider than the screen, and no text sticks out of its box unless the component cuts it short with an ellipsis. |
| Other scripts | `scripts.spec.ts` | Russian and Greek render in Pixel Bop and Pixelify Sans alone; Vietnamese, Chinese, Japanese, Arabic and Hebrew may take the system font but stay inside their boxes, and no line overlaps the line above (`fixtures/scripts.html`). |
| Print | `print.spec.ts` | A Night page printed with background graphics off: every box keeps its fill and outline (computed, and in the PDF), so does every part that shows a value; it prints Day (the same pixels and PDF colours as the page in Day); the world, the CRT and the scrims stay off; nothing is lost in a scroller. |
| Motion | `motion.spec.ts` | Every animation and scripted move, filmed a frame at a time at 100% and 200%: whole pixels, whole scale and rotation, no opacity between 0 and 1, no blur, six steps at most per move (DESIGN.md's exceptions are listed in the file); everything stops within five seconds except loading indicators, and ambient motion on a page that shows the motion toggle (pressed, it stops all of it within a frame; pressed again, it comes back); with reduced motion nothing moves. |

## Running them

Build the packages first (`pnpm build` at the root): the test page loads their `dist`, and the components' and kits'
stylesheets from `src`.

```sh
pnpm --filter @blip/tests test:conditions                                  # every lane
pnpm --filter @blip/tests test:conditions contrast                         # one lane: its file name
pnpm --filter @blip/tests test:conditions print -g "components/table"      # one example in one lane
```

Each test is one example (fixtures are `conditions/<name>`). A failure lists every problem on its own line, with the
conditions it fails under in brackets: `[night focus] button.blip-tab "Weapons": rgb(26, 21, 48) on #1b1c40, 1.08:1`.
Each test is annotated with what it measured. The lanes use Chromium's DevTools protocol (device pixel ratio, PDFs,
default text size, which font draws a character), so they run in Chromium only.

## Known issues

A failure that is a design decision, or a fix bigger than a test change, goes in `known-issues.ts`: the lane, the
example, a piece of the failure's line, why it is left and where the fix belongs. It then shows as an annotation
instead of failing, and an entry that matches nothing any more is reported as stale. Never let a whole lane or a
whole example through.

## Adding to a lane

A new example is covered as it is. A lane only needs changing for something it cannot find by itself: a new
directional glyph (`GLYPHS` in `rtl.spec.ts`), a new endless loading indicator, a DESIGN.md exception to the motion
rules or script motion made of many moves, each judged on its own (an attract demo's pointer: `lib/motion.ts`), a
new kind of part that shows a value (`print.spec.ts`, `contrast.spec.ts`). To check that a lane still catches what it
guards, plant the problem (put back an old stylesheet with `page.route`, or add a bad rule with `page.addStyleTag`)
and watch it fail.
