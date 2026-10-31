/**
 * Transitions for a change of screen (PixelDissolve.java, the TV spec §6):
 *
 *   dissolve  the TV's: a grid of ink cells fills the screen in random order, nine frames 30 ms apart, then clears
 *   dither    the same through the 4 x 4 Bayer matrix: the screen fills with ordered ink, then clears
 *   mosaic    the screen breaks into ever bigger whole-pixel blocks, changes, and comes back into focus
 *
 *   await transition(() => showLevel(2), { kind: "dissolve" });
 *
 * With the View Transitions API the old and new screens are snapshots, masked or filtered frame by frame on their
 * pseudo-elements (the dither is transitions.css's, the same as between pages). Without it, ink covers the screen
 * from an overlay while it changes (a mosaic dissolves instead). With reduced motion, or in a hidden tab, the change is
 * instant. A signal stops the effect early; the update always runs once.
 */
import { duration, frames, pixel, reducedMotion, services } from "@jaatster/blip-core";
import { abgr, overlay, rgb } from "./_pixel.js";

export type TransitionKind = "dissolve" | "dither" | "mosaic";
export interface TransitionOptions {
  kind?: TransitionKind;
  signal?: AbortSignal;
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** Mosaic block sizes, in pixels. */
const MOSAIC = [2, 3, 4, 6, 8, 12];
let current = 0;
/** The run that put data-pp-transition on <html> for a dither, if one did (the page may have it already). */
let ditherBy = "";

/** Runs update behind a transition. Resolves when the new screen is fully shown; rejects if update throws. */
export async function transition(update: () => void | Promise<void>, options: TransitionOptions = {}): Promise<void> {
  const { signal } = options, views = !!document.startViewTransition;
  if (signal?.aborted || reducedMotion() || document.hidden) return update();
  // Without view transitions there are no snapshots to pixelate: a mosaic dissolves instead.
  const kind = options.kind === "mosaic" && !views ? "dissolve" : options.kind ?? "dissolve";
  const root = document.documentElement, run = String(++current), p = pixel(), mosaic = kind === "mosaic", dither = kind === "dither";
  const n = mosaic ? MOSAIC.length : dither ? 8 : 9, frame = mosaic ? duration("frame", 40) : duration("dissolve-frame", 30);
  const filters = mosaic ? blocks(MOSAIC.map((m) => m * p)) : [];
  const mine = () => root.dataset.ppTransitionRun === run;

  // The cells: about 64 across for the dissolve (the TV's grid), two pixels for the dither. Each cell's place in the
  // order it changes is a fraction: random for the dissolve (a new order to cover and to clear), Bayer for the dither.
  // With view transitions only the dissolve needs them (the dither is CSS, the mosaic filters).
  const size = (dither ? 2 : Math.max(1, Math.round(innerWidth / 64 / p))) * p, cellular = !views || kind === "dissolve";
  const cols = cellular ? Math.ceil(innerWidth / size) : 1, rows = cellular ? Math.ceil(innerHeight / size) : 1, count = cols * rows;
  const order = () => {
    const v = new Float32Array(count);
    if (dither) v.forEach((_, i) => (v[i] = BAYER[((Math.trunc(i / cols) & 3) << 2) | (i % cols & 3)]! / 16));
    else {
      const o = Array.from({ length: count }, (_, i) => i);
      for (let i = count - 1; i > 0; i--) {
        const j = services.between(0, i);
        [o[i], o[j]] = [o[j]!, o[i]!];
      }
      o.forEach((c, k) => (v[c] = k / count));
    }
    return v;
  };
  const cover = cellular ? order() : new Float32Array(), clear = dither || !cellular ? cover : order();
  // One canvas of cells: each frame's mask with view transitions, the ink itself without.
  const canvas = Object.assign(document.createElement("canvas"), { width: cols, height: rows });
  const ctx = canvas.getContext("2d")!, img = ctx.createImageData(cols, rows), px = new Uint32Array(img.data.buffer);
  const cells = (v: Float32Array, show: (x: number) => boolean, colour = 0xff000000) => {
    v.forEach((x, i) => (px[i] = show(x) ? colour : 0));
    ctx.putImageData(img, 0, 0);
  };
  const at = (f: number) => (f + 1) / n;

  if (views) {
    const half = (f: number) => f / (2 * n), maskSize = `${cols * size}px ${rows * size}px`;
    const mask = (v: Float32Array, show: (x: number) => boolean) => (cells(v, show), `url(${canvas.toDataURL()})`);
    let old: Keyframe[] = [], now: Keyframe[] = [];
    if (dither) {
      // Any run still marked is being skipped by this one; its marker would switch the CSS dither off.
      delete root.dataset.ppTransitionRun;
      if (!root.hasAttribute("data-pp-transition") || ditherBy) {
        root.setAttribute("data-pp-transition", "");
        ditherBy = run;
      }
    } else {
      root.dataset.ppTransitionRun = run;
      if (mosaic) {
        old = [...filters.map((filter, f) => ({ offset: half(f), filter, opacity: 1 })), { offset: 0.5, filter: filters[n - 1], opacity: 0 }];
        now = [{ offset: 0, filter: filters[n - 1], opacity: 0 }, ...filters.map((_, f) => ({ offset: 0.5 + half(f), filter: filters[n - 1 - f], opacity: 1 })), { offset: 1, filter: "none", opacity: 1 }];
      } else {
        // The old screen shows where the ink has not reached yet, the new one where it has cleared.
        const covers = Array.from({ length: n - 1 }, (_, f) => mask(cover, (x) => x >= at(f)));
        old = [...covers.map((maskImage, f) => ({ offset: half(f), maskImage, opacity: 1 })), { offset: half(n - 1), maskImage: covers.at(-1), opacity: 0 }];
        now = [{ offset: 0, maskImage: "none", opacity: 0 }, ...Array.from({ length: n - 1 }, (_, f) => ({ offset: 0.5 + half(f), maskImage: mask(clear, (x) => x < at(f)), opacity: 1 })), { offset: 0.5 + half(n - 1), maskImage: "none", opacity: 1 }];
        for (const k of [...old, ...now]) k.maskSize = maskSize;
      }
      old.push({ ...old.at(-1), offset: 1 });
      now.push({ ...now.at(-1), offset: 1 });
    }
    const vt = document.startViewTransition(update), skip = () => vt.skipTransition(), running: Animation[] = [];
    signal?.addEventListener("abort", skip, { once: true });
    vt.ready.then(() => {
      for (const [which, keyframes] of [["old", old], ["new", now]] as const) {
        if (keyframes.length) running.push(root.animate(keyframes.map((k) => ({ ...k, easing: "step-end" })), { duration: 2 * n * frame, fill: "forwards", pseudoElement: `::view-transition-${which}(root)` }));
      }
    }, () => {});
    vt.updateCallbackDone.catch(() => {});
    try {
      await vt.finished;
    } finally {
      // Nothing of this run may touch a later view transition.
      running.forEach((a) => a.cancel());
      signal?.removeEventListener("abort", skip);
      if (ditherBy === run) {
        root.removeAttribute("data-pp-transition");
        ditherBy = "";
      }
      if (mine()) delete root.dataset.ppTransitionRun;
    }
    return;
  }

  // No view transitions: ink over the whole screen from an overlay while it changes. The ink takes the pointer, so
  // nothing hidden under it can be pressed.
  const layer = overlay(true), opts = { signal }, ink = abgr(rgb(getComputedStyle(root).getPropertyValue("--pp-ink")));
  canvas.style.cssText = `image-rendering:pixelated;width:${cols * size}px;height:${rows * size}px`;
  layer.append(canvas);
  try {
    await frames(n, frame, (f) => cells(cover, (x) => x < at(f), ink), opts);
    await update();
    await frames(n + 1, frame, (f) => cells(clear, (x) => x >= f / n, ink), opts);
  } finally {
    layer.remove();
  }
}

/**
 * SVG mosaic filters for block sizes in CSS pixels: one sample from each block, grown to fill it. They live on <html>,
 * outside <body>, so an update that replaces the body keeps them.
 */
function blocks(sizes: number[]): string[] {
  let svg = document.getElementById("pp-mosaic") as Element | null;
  if (!svg) {
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = "pp-mosaic";
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("style", "position:absolute;width:0;height:0");
    document.documentElement.append(svg);
  }
  const host = svg;
  return sizes.map((b) => {
    const id = `pp-mosaic-${b}`;
    if (!document.getElementById(id)) {
      // An even block takes a 2 x 2 sample from its middle, an odd one a single pixel; dilating it fills the block.
      const odd = b % 2, at = odd ? (b - 1) / 2 : b / 2 - 1;
      host.insertAdjacentHTML("beforeend", `<filter id="${id}" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB"><feFlood x="${at}" y="${at}" width="${2 - odd}" height="${2 - odd}"/><feComposite width="${b}" height="${b}"/><feTile result="t"/><feComposite in="SourceGraphic" in2="t" operator="in"/><feMorphology operator="dilate" radius="${at}"/></filter>`);
    }
    return `url(#${id})`;
  });
}
