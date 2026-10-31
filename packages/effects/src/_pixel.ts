/**
 * Private helpers shared by the effects: token colours read from CSS, sprites drawn a pixel at a time from rows of
 * characters (as on the TV), timers that stop with a signal, and an overlay above everything.
 */

let probe: CanvasRenderingContext2D | null | undefined;

/** A CSS colour (a token's value) as 0xRRGGBB. Hex is parsed; anything else is resolved by the browser. */
export function rgb(css: string): number {
  const hex = /^\s*#([\da-f]{6})\s*$/i.exec(css);
  if (hex) return parseInt(hex[1]!, 16);
  probe ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!probe || !css.trim()) return 0;
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = "transparent";
  probe.fillStyle = css;
  probe.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0] = probe.getImageData(0, 0, 1, 1).data;
  return (r << 16) | (g << 8) | b;
}

/** 0xRRGGBB packed for a Uint32Array over ImageData (little-endian: alpha, blue, green, red), opaque. */
export const abgr = (c: number): number => (0xff000000 | ((c & 0xff) << 16) | (c & 0xff00) | ((c >> 16) & 0xff)) >>> 0;

/** Token colours, packed, by custom property name, as computed at an element. */
export function tokens(el: Element, names: readonly string[]): number[] {
  const style = getComputedStyle(el);
  return names.map((n) => abgr(rgb(style.getPropertyValue(n))));
}

/** Draws a sprite into a canvas (resizing it): each character in keys takes the matching packed colour; "." is clear. */
export function sprite(canvas: HTMLCanvasElement, rows: readonly string[], keys: string, colours: readonly number[]): HTMLCanvasElement {
  const w = rows[0]!.length, h = rows.length;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(w, h);
  const px = new Uint32Array(img.data.buffer);
  rows.forEach((row, y) => {
    for (let x = 0; x < w; x++) {
      const i = keys.indexOf(row[x]!);
      if (i >= 0) px[y * w + x] = colours[i]!;
    }
  });
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** A canvas scaled up by whole CSS pixels with no smoothing. */
export function pixelCanvas(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.style.cssText = "position:absolute;left:0;top:0;image-rendering:pixelated";
  return c;
}

/** Calls fn after ms, unless the signal aborts first. */
export function later(ms: number, fn: () => void, signal: AbortSignal): void {
  const stop = () => clearTimeout(id);
  const id = setTimeout(() => {
    signal.removeEventListener("abort", stop);
    fn();
  }, ms);
  signal.addEventListener("abort", stop, { once: true });
}

/**
 * A layer over the whole viewport, in the top layer when the browser has popovers, so it also covers modal dialogs.
 * Pointers pass through unless it blocks them. Remove it when done.
 */
export function overlay(block = false): HTMLElement {
  const el = document.createElement("div");
  el.setAttribute("aria-hidden", "true");
  el.style.cssText = `position:fixed;inset:0;width:auto;height:auto;margin:0;padding:0;border:0;background:none;overflow:hidden;z-index:2147483647;pointer-events:${block ? "auto" : "none"}`;
  const top = "showPopover" in el;
  if (top) el.popover = "manual";
  document.body.append(el);
  if (top) el.showPopover();
  return el;
}

/** The TV's sparkle, small then big: light yellow arms, a white centre, no outline (it belongs to the sky). */
export const SPARKLE = [
  [".....", "..S..", ".SWS.", "..S..", "....."],
  ["..S..", "..S..", "SSWSS", "..S..", "..S.."],
] as const;

/** Gives an element properties that mirror its attributes: present-or-absent flags, and strings (null when absent). */
export function mirror(ctor: CustomElementConstructor, flags: readonly string[], strings: readonly string[] = []): void {
  for (const name of flags) {
    Object.defineProperty(ctor.prototype, name, {
      get(this: Element) { return this.hasAttribute(name); },
      set(this: Element, on: unknown) { this.toggleAttribute(name, !!on); },
    });
  }
  for (const name of strings) {
    Object.defineProperty(ctor.prototype, name, {
      get(this: Element) { return this.getAttribute(name); },
      set(this: Element, value: string | null) {
        if (value == null) this.removeAttribute(name);
        else this.setAttribute(name, value);
      },
    });
  }
}
