/**
 * Anatomy figures for the component pages: the real component, drawn at a big pixel (the largest whole number of CSS
 * pixels, 3 to 6, that fits the column; 2 on a phone when 3 does not), with numbered tags pointing at its parts along pixel leader lines. The
 * numbers are those of the page's anatomy list (docs/<name>.md), so every numeral points at something.
 *
 * A page opts in with a spec here. A page without one shows its anatomy as a plain list, with no numerals.
 *
 * A spec is laid out in the figure's own pixels: a canvas w x h, the component's markup placed at (x, y), and for
 * each part the pixel it points at and the side of the canvas its tag stands on. Tags stand in a row along the top or
 * the bottom (straight down or up to their pixel) or a column at either side (straight across).
 */
import { iconPath } from "./data";
import { esc } from "./html";

type Side = "top" | "bottom" | "left" | "right";
interface Part {
  /** The number in the anatomy list. */
  n: number;
  /** The figure pixel it points at. */
  at: [number, number];
  side: Side;
}
interface Spec {
  /** What the figure shows, for screen readers. */
  label: string;
  /** The canvas, in figure pixels. */
  w: number;
  h: number;
  /** Where the component's top-left corner sits. */
  x: number;
  y: number;
  html: string;
  parts: Part[];
}

const icon = (name: string) => `<svg class="blip-icon" viewBox="0 0 12 12" aria-hidden="true"><path d="${iconPath(name)}"/></svg>`;

/** Where the tags stand: rows and columns this far in from the canvas's edges. */
const EDGE = 5;

const SPECS: Record<string, Spec> = {
  // A medium button, 56 x 20 pixels at (20, 16): radius 4, bands of 4, glints at (2..4, 2..3), its drop one pixel down
  // and right. Its icon and label are centred: the icon at about x 12 to 24, the label from about 27.
  button: {
    label: "A button drawn big, its parts numbered: 1 the outline, 2 the light band, 3 the base, 4 the shade band, 5 the glints, 6 the drop, 7 the label, 8 the icon.",
    w: 96,
    h: 52,
    x: 20,
    y: 16,
    html: `<span class="blip-box blip-button" style="inline-size:calc(56 * var(--blip-pixel))">${icon("play")}Play</span>`,
    parts: [
      { n: 1, at: [40, 16], side: "top" },
      { n: 2, at: [66, 18], side: "top" },
      { n: 3, at: [71, 26], side: "right" },
      { n: 4, at: [42, 34], side: "bottom" },
      { n: 5, at: [23, 18], side: "top" },
      { n: 6, at: [26, 36], side: "bottom" },
      { n: 7, at: [58, 28], side: "bottom" },
      { n: 8, at: [37, 26], side: "left" },
    ],
  },
  // A small alert dialog, 88 x 76 pixels, on its scrim (ten pixels of it showing round the dialog): the scrim from
  // (12, 12) to (120, 108), the dialog from (22, 22); its title bar to row 47, body to 72, footer to 93. The places
  // below were measured from the drawn figure.
  dialog: {
    label: "A dialog drawn big on its scrim, its parts numbered: 1 the panel, 2 the title bar, 3 the title, 4 the sign, 5 the close button, 6 the body, 7 the footer, 8 the scrim.",
    w: 132,
    h: 120,
    x: 12,
    y: 12,
    html: `<div class="blip-scrim docs-fig-scrim"><dialog class="blip-box blip-dialog" data-tone="danger" open data-blip-static style="inline-size: calc(88 * var(--blip-pixel))">
  <header class="blip-dialog-header"><span class="blip-dialog-icon" aria-hidden="true"></span><p class="blip-dialog-title">Quit?</p><button class="blip-box blip-button blip-dialog-close" type="button" data-variant="ghost" data-size="sm" data-icon-only tabindex="-1"><span class="blip-icon" data-glyph="close" aria-hidden="true"></span></button></header>
  <div class="blip-dialog-body"><p>Lose 3 stars?</p></div>
  <footer class="blip-dialog-footer"><button class="blip-box blip-button" type="button" data-size="sm" data-variant="soft" data-tone="neutral" tabindex="-1">Stay</button><button class="blip-box blip-button" type="button" data-size="sm" data-tone="danger" tabindex="-1">Quit</button></footer>
</dialog></div>`,
    parts: [
      { n: 1, at: [22, 60], side: "left" },
      { n: 2, at: [84, 34], side: "top" },
      { n: 3, at: [53, 29], side: "top" },
      { n: 4, at: [34, 30], side: "top" },
      { n: 5, at: [97, 30], side: "top" },
      { n: 6, at: [105, 60], side: "right" },
      { n: 7, at: [106, 82], side: "right" },
      { n: 8, at: [17, 102], side: "bottom" },
    ],
  },
};

/** The figure for a component page, as HTML, or null when the page has none. */
export function anatomyFigure(slug: string): string | null {
  const spec = SPECS[slug];
  if (!spec) return null;
  const { w, h, x, y } = spec;
  const marks = spec.parts.map(({ n, at: [ax, ay], side }) => {
    // The tag's centre, in figure pixels: on its row or column, in line with the pixel it points at.
    const [tx, ty] = side === "top" ? [ax, EDGE] : side === "bottom" ? [ax, h - 1 - EDGE] : side === "left" ? [EDGE, ay] : [w - 1 - EDGE, ay];
    return `<span class="docs-fig-lead" data-side="${side}" style="--ax:${ax};--ay:${ay};--tx:${tx};--ty:${ty}"></span><span class="blip-box blip-tag docs-fig-tag" data-size="sm" style="--tx:${tx};--ty:${ty}">${n}</span>`;
  });
  return `<figure class="docs-fig" role="img" aria-label="${esc(spec.label)}"><div class="docs-fig-canvas" style="--w:${w};--h:${h}"><div class="docs-fig-subject" data-blip-pixel="figure" inert style="--x:${x};--y:${y}">${spec.html}</div>${marks.join("")}</div></figure>`;
}
