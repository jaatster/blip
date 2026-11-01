/**
 * Screenshots as pixels: a small decoder for Playwright's PNGs (8-bit RGB or RGBA, not interlaced) into RGB, and
 * helpers to read them. No image library: the tests run on a plain Playwright install.
 */
import { inflateSync } from "node:zlib";

export interface Image {
  width: number;
  height: number;
  /** RGB, row by row. */
  data: Uint8Array;
}

export function decode(png: Buffer): Image {
  let pos = 8;
  let width = 0;
  let height = 0;
  let channels = 4;
  const idat: Buffer[] = [];
  while (pos < png.length) {
    const len = png.readUInt32BE(pos);
    const type = png.toString("ascii", pos + 4, pos + 8);
    const data = png.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (data[8] !== 8 || data[12] !== 0) throw new Error("Only 8-bit, non-interlaced PNGs");
      channels = data[9] === 6 ? 4 : data[9] === 2 ? 3 : 0;
      if (!channels) throw new Error(`Unsupported PNG colour type ${data[9]}`);
    } else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = new Uint8Array(width * height * 3);
  let prev = new Uint8Array(stride);
  let cur = new Uint8Array(stride);
  let p = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[p++]!;
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels]! : 0;
      const b = prev[x]!;
      let v = raw[p++]!;
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const c = x >= channels ? prev[x - channels]! : 0;
        const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[x] = v & 255;
    }
    const row = y * width * 3;
    for (let x = 0, i = 0; x < width; x++, i += channels) {
      out[row + x * 3] = cur[i]!;
      out[row + x * 3 + 1] = cur[i + 1]!;
      out[row + x * 3 + 2] = cur[i + 2]!;
    }
    [prev, cur] = [cur, prev];
  }
  return { width, height, data: out };
}

/** The colour at (x, y) as one number, 0xRRGGBB. */
export const at = (img: Image, x: number, y: number): number => {
  const i = (y * img.width + x) * 3;
  return (img.data[i]! << 16) | (img.data[i + 1]! << 8) | img.data[i + 2]!;
};

export const hex = (c: number): string => `#${c.toString(16).padStart(6, "0")}`;
export const rgbOf = (c: number): [number, number, number] => [(c >> 16) & 255, (c >> 8) & 255, c & 255];

/** The sum of the channel differences between two colours. */
export const distance = (a: number, b: number): number =>
  Math.abs(((a >> 16) & 255) - ((b >> 16) & 255)) + Math.abs(((a >> 8) & 255) - ((b >> 8) & 255)) + Math.abs((a & 255) - (b & 255));

/** The most common colour in a rectangle (device pixels, clamped to the image). */
export function mode(img: Image, x0: number, y0: number, x1: number, y1: number): number | undefined {
  const count = new Map<number, number>();
  for (let y = Math.max(0, Math.floor(y0)); y < Math.min(img.height, Math.ceil(y1)); y++) {
    for (let x = Math.max(0, Math.floor(x0)); x < Math.min(img.width, Math.ceil(x1)); x++) {
      const c = at(img, x, y);
      count.set(c, (count.get(c) ?? 0) + 1);
    }
  }
  let best: number | undefined;
  let n = 0;
  for (const [c, k] of count) if (k > n) [best, n] = [c, k];
  return best;
}
