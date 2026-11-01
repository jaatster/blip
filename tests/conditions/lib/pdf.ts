/**
 * The colours a PDF paints, read without a renderer: fill and stroke colours in its content streams (rg, RG, sc,
 * scn), the stops of its gradients (/C0 and /C1 of each shading function) and the pixels of its RGB images (Chromium
 * draws some masked or filtered boxes as images). Enough to tell whether a box's fill and outline reached the paper.
 */
import { inflateSync } from "node:zlib";

/** Every colour the PDF paints, as 0xRRGGBB, with how often it occurs. */
export function pdfColours(pdf: Buffer): Map<number, number> {
  const text = pdf.toString("latin1");
  const out = new Map<number, number>();
  const add = (r: number, g: number, b: number, n = 1) => {
    const c = (Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255);
    out.set(c, (out.get(c) ?? 0) + n);
  };
  // Gradient stops, in the (uncompressed) object dictionaries.
  for (const m of text.matchAll(/\/C[01]\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]/g)) add(+m[1]!, +m[2]!, +m[3]!);
  // Streams: content (operators) or images (pixels).
  const start = /stream\r?\n/g;
  for (let m = start.exec(text); m; m = start.exec(text)) {
    const from = m.index + m[0].length;
    const to = text.indexOf("endstream", from);
    if (to < 0) break;
    const dict = text.slice(text.lastIndexOf("<<", m.index), m.index);
    let data: Buffer;
    try {
      data = /\/FlateDecode/.test(dict) ? inflateSync(pdf.subarray(from, to)) : pdf.subarray(from, to);
    } catch {
      continue;
    }
    if (/\/Subtype\s*\/Image/.test(dict)) {
      if (!/\/ColorSpace\s*\/DeviceRGB/.test(dict) || !/\/BitsPerComponent\s+8/.test(dict)) continue;
      const w = Number(dict.match(/\/Width\s+(\d+)/)?.[1] ?? 0);
      const predictor = Number(dict.match(/\/Predictor\s+(\d+)/)?.[1] ?? 1);
      for (const [c, n] of imageColours(data, w, predictor)) out.set(c, (out.get(c) ?? 0) + n);
      continue;
    }
    const content = data.toString("latin1");
    for (const op of content.matchAll(/(?:^|\s)([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+(?:rg|RG|sc|SC|scn|SCN)\b/g)) add(+op[1]!, +op[2]!, +op[3]!);
    start.lastIndex = to;
  }
  return out;
}

/** The colours of an 8-bit RGB image, raw or with PNG predictors (one filter byte a row). */
function imageColours(data: Buffer, width: number, predictor: number): Map<number, number> {
  const out = new Map<number, number>();
  if (!width) return out;
  const stride = width * 3;
  if (predictor < 10) {
    for (let i = 0; i + 2 < data.length; i += 3) {
      const c = (data[i]! << 16) | (data[i + 1]! << 8) | data[i + 2]!;
      out.set(c, (out.get(c) ?? 0) + 1);
    }
    return out;
  }
  let prev = new Uint8Array(stride), cur = new Uint8Array(stride);
  for (let p = 0; p + stride < data.length; ) {
    const filter = data[p++]!;
    for (let x = 0; x < stride; x++) {
      const a = x >= 3 ? cur[x - 3]! : 0, b = prev[x]!, c = x >= 3 ? prev[x - 3]! : 0;
      let v = data[p++]!;
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[x] = v & 255;
    }
    for (let x = 0; x < stride; x += 3) {
      const c = (cur[x]! << 16) | (cur[x + 1]! << 8) | cur[x + 2]!;
      out.set(c, (out.get(c) ?? 0) + 1);
    }
    [prev, cur] = [cur, prev];
  }
  return out;
}

/** Whether the PDF paints a colour, within `tolerance` per channel (PDFs store colours as decimals). */
export function paints(colours: Map<number, number>, c: number, tolerance = 2): boolean {
  if (colours.has(c)) return true;
  for (const k of colours.keys()) {
    if (Math.abs(((k >> 16) & 255) - ((c >> 16) & 255)) <= tolerance && Math.abs(((k >> 8) & 255) - ((c >> 8) & 255)) <= tolerance && Math.abs((k & 255) - (c & 255)) <= tolerance) return true;
  }
  return false;
}
