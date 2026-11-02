/**
 * The kit's art for games drawn in a <canvas>. spriteCanvas() paints a sprite, or a pixel map of your own in the
 * sprites' language (rows split by "/", one character per pixel, the ink outline added round the fill), into a small
 * canvas in the token colours at an element, so the art follows the scheme and the palette.
 *
 *   const coin = spriteCanvas("coin");
 *   const frog = spriteCanvas({ map: ".ll./lwol/lccl/.ss.", tone: "green" }, { flip: true });
 *   ctx.drawImage(coin, x, y);              // whole pixels, on a canvas scaled up with image-rendering: pixelated
 *
 * Make them once and keep them: they read the tokens when made. Make them again when the scheme or the palette
 * changes (data-blip-scheme or data-blip-palette on <html>).
 */
import { colour, outline, pixels, toneOf } from "./_pixels.js";

export { outline } from "./_pixels.js";

/** A pixel map of your own: rows split by "/", in the sprites' colour keys; tone colours its l, c and s pixels. */
export interface PixelArt {
  map: string;
  tone?: string;
}

export interface SpriteCanvasOptions {
  /** Recolours the art's l, c and s pixels: any candy, "neutral" or "accent". */
  tone?: string;
  /** Faces the other way. */
  flip?: boolean;
  /** Where to read the tokens: an element inside a scheme or palette of its own (the document by default). */
  from?: Element;
}

/**
 * A sprite ("coin", "heart", "sword"…) or your own pixel map, painted at one canvas pixel per art pixel in the token
 * colours at `from`. Undefined for an unknown sprite name.
 */
export function spriteCanvas(art: string | PixelArt, options: SpriteCanvasOptions = {}): HTMLCanvasElement | undefined {
  const named = typeof art === "string";
  const rows = named ? pixels(art) : outline(art.map);
  if (!rows?.length) return undefined;
  const tone = options.tone ?? (named ? toneOf(art) : art.tone) ?? "accent";
  // A hidden probe inside `from` resolves each colour, var() fallbacks and all, as the page would.
  const probe = (options.from ?? document.body ?? document.documentElement).appendChild(document.createElement("i"));
  probe.hidden = true;
  const style = getComputedStyle(probe), seen = new Map<string, string>();
  const ink = (key: string) => {
    let c = seen.get(key);
    if (c === undefined) {
      probe.style.color = colour(key, tone);
      seen.set(key, (c = style.color));
    }
    return c;
  };
  const w = Math.max(...rows.map((r) => r.length)), canvas = Object.assign(document.createElement("canvas"), { width: w, height: rows.length });
  const ctx = canvas.getContext("2d")!;
  rows.forEach((row, y) => {
    for (let x = 0; x < w; ) {
      const ch = row[x]!;
      let n = 1;
      while (row[x + n] === ch) n++;
      if (ch !== ".") {
        ctx.fillStyle = ink(ch);
        ctx.fillRect(options.flip ? w - x - n : x, y, n, 1);
      }
      x += n;
    }
  });
  probe.remove();
  return canvas;
}
