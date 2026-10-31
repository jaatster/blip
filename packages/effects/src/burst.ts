/**
 * Bursts: little whole-pixel sprites that pop out of something and fall, a frame (40 ms) at a time, then go.
 *
 *   burst(button, { kind: "coin" });                          // the TV's coin pops up out of the block
 *   <button data-pp-burst="confetti" data-pp-burst-count="24">  // the same on click, with no script of your own
 *
 * Kinds: sparkle (the TV's star flare, around the edges), coin (rises and slows, as on the TV), star (bursts out and
 * falls), confetti (candy bits that flutter down). Positions use services.random, so a seed repeats a burst. Drawn on
 * a canvas at pixel resolution in the top layer, removed when done; nothing at all with reduced motion.
 */
import { duration, frames, pixel, reducedMotion, services } from "@jaatster/blip-core";
import { SPARKLE, overlay, pixelCanvas, sprite, tokens } from "./_pixel.js";

export type BurstKind = "sparkle" | "coin" | "star" | "confetti";
export interface BurstOptions {
  kind?: BurstKind;
  /** How many sprites: 6 sparkles, 3 coins, 6 stars, 18 bits of confetti by default. */
  count?: number;
  signal?: AbortSignal;
}

const COIN = [".OOOOOO.", "OYYYYYYO", "OYWYYYYO", "OYWYYDYO", "OYWYYDYO", "OYWYYDYO", "OYYYYDYO", "OYYYYYYO", "OYYYYYYO", ".OOOOOO."];
const STAR = ["....O....", "...OYO...", "OOOOYOOOO", "OYYYWYYYO", ".OYYYYYO.", "..OYYYO..", ".OYYOYYO.", ".OYO.OYO.", ".OO...OO."];
const COUNT = { sparkle: 6, coin: 3, star: 6, confetti: 18 };
const CANDY = ["red", "orange", "green", "teal", "blue", "purple", "pink"];
/** Room round the target, in pixels. */
const M = 40;

interface Bit { x: number; y: number; vx: number; vy: number; at: number; c: number }

/** Pops sprites out of target. Resolves when the last has gone. */
export function burst(target: Element, options: BurstOptions = {}): Promise<void> {
  const { kind = "sparkle", signal } = options;
  if (reducedMotion() || signal?.aborted || !target.isConnected) return Promise.resolve();
  const p = pixel(target), r = target.getBoundingClientRect(), w = Math.ceil(r.width / p), h = Math.ceil(r.height / p);
  const n = Math.max(1, Math.round(options.count ?? COUNT[kind])), rnd = services.between;
  const [ink, white, yellow, light, shade, ...candy] = tokens(target, ["--pp-ink", "--pp-white", "--pp-candy-yellow", "--pp-candy-yellow-light", "--pp-candy-yellow-shade", ...CANDY.map((c) => `--pp-candy-${c}`)]);
  const art = kind === "coin" ? [sprite(document.createElement("canvas"), COIN, "OYWD", [ink!, yellow!, white!, shade!])]
    : kind === "star" ? [sprite(document.createElement("canvas"), STAR, "OYW", [ink!, yellow!, white!])]
    : kind === "sparkle" ? SPARKLE.map((rows) => sprite(document.createElement("canvas"), rows, "SW", [light!, white!])) : [];

  // Where each bit starts (pixels from the target's top-left), how it moves, and when it starts.
  const bits: Bit[] = Array.from({ length: n }, (_, i) => {
    if (kind === "sparkle") return { x: rnd(-3, w + 3), y: rnd(-3, h + 3), vx: 0, vy: 0, at: rnd(0, 6), c: 0 };
    if (kind === "coin") return { x: Math.round(w / 2 + (i - (n - 1) / 2) * 10), y: 0, vx: 0, vy: -6, at: i * 2, c: 0 };
    if (kind === "star") {
      const a = (i / n) * 2 * Math.PI + services.random() * 0.6;
      return { x: Math.round(w / 2), y: Math.round(h / 2), vx: Math.round(Math.cos(a) * 4), vy: Math.round(Math.sin(a) * 4) - 2, at: 0, c: 0 };
    }
    return { x: rnd(0, w), y: 0, vx: rnd(-2, 2), vy: rnd(-7, -4), at: rnd(0, 3), c: candy[i % candy.length]! };
  });
  const life = kind === "confetti" ? 24 : kind === "coin" ? 8 : 12, last = Math.max(...bits.map((b) => b.at)) + life;

  const layer = overlay(), canvas = layer.appendChild(pixelCanvas());
  canvas.width = w + 2 * M;
  canvas.height = h + 2 * M;
  Object.assign(canvas.style, { left: `${Math.round(r.left) - M * p}px`, top: `${Math.round(r.top) - M * p}px`, width: `${canvas.width * p}px`, height: `${canvas.height * p}px` });
  const ctx = canvas.getContext("2d")!, img = ctx.createImageData(canvas.width, canvas.height), px = new Uint32Array(img.data.buffer);
  const dot = (x: number, y: number, c: number) => {
    if (x >= 0 && y >= 0 && x < canvas.width && y < canvas.height) px[y * canvas.width + x] = c;
  };

  const paper = kind === "confetti";
  return frames(last + 1, duration("frame", 40), (f) => {
    if (paper) px.fill(0);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const b of bits) {
      const age = f - b.at;
      if (age < 0 || age >= life) continue;
      if (age) {
        b.x += b.vx;
        b.y += b.vy;
        // Gravity in whole pixels: coins slow to a stop, stars arc over, confetti drifts down no faster than two.
        b.vy = paper ? Math.min(2, b.vy + 1) : kind === "star" ? b.vy + (age % 2) : kind === "coin" ? Math.min(0, b.vy + 1) : b.vy;
        if (paper && age % 4 === 0) b.vx = -Math.sign(b.vx) || 1;
      }
      const x = M + b.x, y = M + b.y;
      if (paper) {
        // A bit of paper turning: two pixels across, then two down.
        dot(x, y, b.c);
        dot((age >> 1) % 2 ? x : x + 1, (age >> 1) % 2 ? y + 1 : y, b.c);
      } else {
        const s = art[kind === "sparkle" && age >= 3 && age < 9 ? 1 : 0]!;
        ctx.drawImage(s, x - (s.width >> 1), y - (s.height >> 1));
      }
    }
    if (paper) ctx.putImageData(img, 0, 0);
  }, { signal }).finally(() => layer.remove());
}

// Declarative bursts: any element with data-pp-burst="<kind>" bursts when clicked.
if (typeof document !== "undefined") {
  document.addEventListener("click", (e) => {
    const el = (e.target as Element | null)?.closest?.("[data-pp-burst]");
    if (!el || el.matches(":disabled, [aria-disabled='true']")) return;
    const kind = el.getAttribute("data-pp-burst") as BurstKind;
    void burst(el, { kind: kind in COUNT ? kind : "sparkle", count: Number(el.getAttribute("data-pp-burst-count")) || undefined });
  });
}
