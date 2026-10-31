#!/usr/bin/env python3
"""Builds Pixel Bop, Blip's pixel display font, from src/pixel-bop.glyphs into TTF and WOFF2.

Metrics: 1000 units per em and one pixel = 100 units, so 1 em is 10 pixels and caps are 7 pixels tall. In CSS,
font-size = 10 x pixel x scale puts every font pixel on the Blip grid. Ascent 900 and descent 300 make the
content area 12 pixels: line-height 1.2 has no half-leading, so the baseline lands on a whole pixel.

Each glyph's outline is traced from its pixels (one closed contour per edge loop, holes included), so there are no
seams between pixels at any size.

Usage: .tools/venv/bin/python -I packages/font/scripts/build.py
"""
import os
import sys

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SRC = os.path.join(ROOT, "src", "pixel-bop.glyphs")
DIST = os.path.join(ROOT, "dist")
UNIT = 100
UPM = 1000
ASCENT, DESCENT = 900, 300
FAMILY = "Pixel Bop"
VERSION = "0.1.0"


class GlyphError(Exception):
    pass


def parse(path):
    """Reads the glyph file into {char: (rows, top)} with errors that name the line and the fix."""
    glyphs = {}
    current = None
    with open(path, encoding="utf-8") as f:
        for n, raw in enumerate(f, 1):
            line = raw.rstrip("\n")
            if not line or line.startswith("#"):
                current = None if not line else current
                continue
            if line.startswith("@ "):
                parts = line[2:].split()
                key = parts[0]
                ch = chr(int(key[2:], 16)) if key.startswith("U+") else key
                if len(ch) != 1:
                    raise GlyphError(f"{path}:{n}: '{key}' is not one character. Fix: write it as U+XXXX.")
                if ch in glyphs:
                    raise GlyphError(f"{path}:{n}: '{ch}' is drawn twice. Fix: delete one of the blocks.")
                top = 7
                for p in parts[1:]:
                    if p.startswith("top="):
                        top = int(p[4:])
                current = ch
                glyphs[ch] = ([], top, n)
                continue
            if current is None:
                raise GlyphError(f"{path}:{n}: a row outside a glyph block. Fix: start the block with '@ <char>'.")
            if set(line) - set("X."):
                raise GlyphError(f"{path}:{n}: row '{line}' may only use X and '.'.")
            rows = glyphs[current][0]
            if rows and len(line) != len(rows[0]):
                raise GlyphError(f"{path}:{n}: row is {len(line)} wide; the glyph's first row is {len(rows[0])}. Fix: make every row of '{current}' the same width.")
            rows.append(line)
    for ch, (rows, top, n) in glyphs.items():
        if not rows:
            raise GlyphError(f"{path}:{n}: '{ch}' has no rows.")
    return glyphs


def outline(rows, top):
    """Traces the pixel union into closed contours, clockwise around ink (TrueType's direction), in font units."""
    h, w = len(rows), len(rows[0])
    on = lambda c, r: 0 <= r < h and 0 <= c < w and rows[r][c] == "X"
    # Grid points (x, y) with y counted up from the baseline. Edges keep ink on their right.
    edges = {}
    add = lambda a, b: edges.setdefault(a, []).append(b)
    for r in range(h):
        for c in range(w):
            if not on(c, r):
                continue
            x0, x1, y1 = c, c + 1, top - r
            y0 = y1 - 1
            if not on(c, r - 1):
                add((x0, y1), (x1, y1))  # top edge, going right
            if not on(c + 1, r):
                add((x1, y1), (x1, y0))  # right edge, going down
            if not on(c, r + 1):
                add((x1, y0), (x0, y0))  # bottom edge, going left
            if not on(c - 1, r):
                add((x0, y0), (x0, y1))  # left edge, going up

    def take(at, came_from):
        """Where two pixels touch only at a corner, two edges leave one point: turn right, so they stay apart."""
        outs = edges[at]
        if len(outs) > 1 and came_from is not None:
            dx, dy = at[0] - came_from[0], at[1] - came_from[1]
            right = (dy, -dx)
            outs.sort(key=lambda b: 0 if (b[0] - at[0], b[1] - at[1]) == right else 1)
        b = outs.pop(0)
        if not outs:
            del edges[at]
        return b

    contours = []
    while edges:
        start = next(iter(edges))
        loop = [start]
        prev, cur = start, take(start, None)
        while cur != start:
            loop.append(cur)
            prev, cur = cur, take(cur, prev)
        # Drop points in the middle of straight runs.
        pts = []
        for i, p in enumerate(loop):
            a, b = loop[i - 1], loop[(i + 1) % len(loop)]
            if (a[0] == p[0] == b[0]) or (a[1] == p[1] == b[1]):
                continue
            pts.append((p[0] * UNIT, p[1] * UNIT))
        contours.append(pts)
    return contours


def glyph_name(ch):
    return {" ": "space"}.get(ch, f"uni{ord(ch):04X}")


def build():
    try:
        glyphs = parse(SRC)
    except GlyphError as e:
        sys.exit(f"Pixel Bop: {e}")

    order = [".notdef"] + [glyph_name(ch) for ch in glyphs]
    cmap, advances, outlines = {}, {}, {}

    # .notdef: a hollow box, cap height.
    pen = TTGlyphPen(None)
    for x0, y0, x1, y1, d in ((0, 0, 500, 700, 1), (100, 100, 400, 600, -1)):
        pts = [(x0, y0), (x0, y1), (x1, y1), (x1, y0)]
        if d < 0:
            pts.reverse()
        pen.moveTo(pts[0])
        for p in pts[1:]:
            pen.lineTo(p)
        pen.closePath()
    outlines[".notdef"] = pen.glyph()
    advances[".notdef"] = (600, 0)

    for ch, (rows, top, _) in glyphs.items():
        name = glyph_name(ch)
        pen = TTGlyphPen(None)
        if ch != " ":
            for pts in outline(rows, top):
                pen.moveTo(pts[0])
                for p in pts[1:]:
                    pen.lineTo(p)
                pen.closePath()
        outlines[name] = pen.glyph()
        advances[name] = ((len(rows[0]) + 1) * UNIT, 0)
        cmap[ord(ch)] = name
        # Capitals only: lower case draws with the capitals.
        if ch.isalpha() and ch.upper() == ch and ch.lower() != ch:
            cmap[ord(ch.lower())] = name

    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(outlines)
    fb.setupHorizontalMetrics(advances)
    fb.setupHorizontalHeader(ascent=ASCENT, descent=-DESCENT, lineGap=0)
    fb.setupNameTable({
        "familyName": FAMILY,
        "styleName": "Regular",
        "uniqueFontIdentifier": f"{FAMILY} Regular {VERSION}",
        "fullName": f"{FAMILY} Regular",
        "psName": "PixelBop-Regular",
        "version": f"Version {VERSION}",
        "copyright": "Copyright 2026 The Blip authors",
        "licenseDescription": "This Font Software is licensed under the SIL Open Font License, Version 1.1.",
        "licenseInfoURL": "https://openfontlicense.org",
    })
    fb.setupOS2(
        sTypoAscender=ASCENT, sTypoDescender=-DESCENT, sTypoLineGap=0,
        usWinAscent=ASCENT + 200, usWinDescent=DESCENT,
        sCapHeight=700, sxHeight=700, fsSelection=0x40 | 0x80,  # REGULAR | USE_TYPO_METRICS
        achVendID="PXPP", usWeightClass=400,
    )
    fb.setupPost()
    fb.setupHead(unitsPerEm=UPM, fontRevision=float(VERSION.rsplit(".", 1)[0]))

    os.makedirs(DIST, exist_ok=True)
    ttf = os.path.join(DIST, "pixel-bop.ttf")
    fb.save(ttf)
    fb.font.flavor = "woff2"
    woff2 = os.path.join(DIST, "pixel-bop.woff2")
    fb.font.save(woff2)
    print(f"Pixel Bop: {len(glyphs)} glyphs -> {os.path.relpath(ttf)} ({os.path.getsize(ttf)} B), "
          f"{os.path.relpath(woff2)} ({os.path.getsize(woff2)} B)")


if __name__ == "__main__":
    build()
