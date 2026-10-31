#!/usr/bin/env python3
"""Builds the two faces of @jaatster/blip-font.

1. Pixel Bop, Blip's pixel display font: src/pixel-bop.glyphs -> dist/pixel-bop.ttf and dist/pixel-bop.woff2.
2. Pixelify Sans, for UI and body text: a subset of the variable font (weights 400 to 700) -> dist/pixelify-sans.woff2,
   with C, G and 5 redrawn so they cannot be read as O, O and S (see patch_pixelify).
It also writes the glyph table in examples/font.html and the character list in docs/font.md, so they always match.

Pixel Bop's metrics: 1200 units per em and one pixel = 120 units, so 1 em is 10 pixels and capitals are 7 pixels
tall. In CSS, font-size = 10 x pixel x scale puts every font pixel on the Blip grid. Ascent 9 pixels and descent
3 make the content area 12 pixels: line-height 1.2 has no half-leading, so the baseline lands on a whole pixel.

Every glyph comes three times, at the same metrics:
  - the pixels themselves (the default), for scale 1;
  - ss02 "Rounded 2x": the pixels enlarged with EPX, drawn in half pixels (60 units), for scales 2 and 4;
  - ss03 "Rounded 3x": the pixels enlarged with AdvMAME3x, drawn in thirds (40 units), for scale 3.
EPX and AdvMAME3x round diagonals and corners, as on the TV launcher, and each glyph is enlarged on its own, so
neighbours never smear into each other. 120 divides by 2 and by 3, so every outline point is a whole unit.

Outlines are traced from the pixels (one closed contour per edge loop, holes included), so there are no seams
between pixels at any size. Accented letters are composed from a base and a mark (see the top of the glyph file).
When the parts do not touch, at that enlargement too, the glyph is a TrueType composite that points at them, which
keeps the font small; when they touch (a cedilla, an ogonek) they are merged into one outline.

Usage:  pnpm --filter @jaatster/blip-font build
   or:  .tools/venv/bin/python -I packages/font/scripts/build.py
Environment:
  SOURCE_DATE_EPOCH   the timestamp written into both fonts (default 2026-01-01), so builds are reproducible
  PIXELIFY_SANS       the Pixelify Sans source (default vendor/PixelifySans[wght].ttf, the unmodified Google Fonts file)
"""
import copy
import html
import json
import os
import re
import sys
import unicodedata
from dataclasses import dataclass, field

from fontTools import agl, subset
from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
from fontTools.fontBuilder import FontBuilder
from fontTools.misc.timeTools import epoch_diff
from fontTools.otlLib.maxContextCalc import maxCtxFont
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont, newTable
from fontTools.ttLib.tables._g_l_y_f import GlyphCoordinates
from fontTools.ttLib.tables.TupleVariation import TupleVariation
from fontTools.ttLib.woff2 import WOFF2FlavorData

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
REPO = os.path.abspath(os.path.join(ROOT, "..", ".."))
SRC = os.path.join(ROOT, "src", "pixel-bop.glyphs")
DIST = os.path.join(ROOT, "dist")
EXAMPLE = os.path.join(ROOT, "examples", "font.html")
DOC = os.path.join(ROOT, "docs", "font.md")

PX = 120                          # units per pixel
UPM = 10 * PX                     # 1 em = 10 pixels
CAP, ASCENT, DESCENT = 7, 9, 3    # in pixels
TOP_LIMIT, BOTTOM_LIMIT = 11, -3  # ink stays between these, in pixels from the baseline
STANDALONE = 7                    # a combining mark on its own sits over the letter before it: one advance back
FAMILY, PS_NAME, VENDOR = "Pixel Bop", "PixelBop-Regular", "PXPP"
AUTHORS = "The Blip authors"
DEFAULT_EPOCH = 1767225600        # 2026-01-01T00:00:00Z
WOFF2_BUDGET = 15 * 1024
SETS = (("ss02", 2, "Rounded 2x"), ("ss03", 3, "Rounded 3x"))
MARK_KINDS = ("above", "below", "hook", "ogonek")
SAMPLE = "PIXEL BOP: THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG. 0123456789"
NAME_RE = r"[A-Za-z][A-Za-z0-9._]{0,62}"

PIXELIFY_SRC = os.environ.get("PIXELIFY_SANS") or os.path.join(ROOT, "vendor", "PixelifySans[wght].ttf")
PIXELIFY_UNICODES = [
    (0x20, 0x7E), (0xA0, 0xFF), (0x100, 0x17F),  # Latin, Latin-1, Latin Extended-A
    (0x2000, 0x206F),                            # General Punctuation
    (0x20AC, 0x20AC), (0x2122, 0x2122), (0x2190, 0x2193),  # euro, trademark, arrows (Pixelify has no arrows yet)
    (0x218, 0x21B), (0x1E9E, 0x1E9E),            # Romanian S and T with comma below, capital sharp s: as Pixel Bop
]


class GlyphError(Exception):
    pass


@dataclass
class Glyph:
    key: str                       # its character, or its name if it has no character
    line: int
    char: str | None = None
    ref: str | None = None         # name=: another name that compositions can use
    rows: list = field(default_factory=list)
    top: int = CAP
    mark: str | None = None
    lean: str = "left"
    axis: float | None = None
    thin: bool = False
    parts: list | None = None      # a composition: [(token, (dx, dy) or None, line)]
    # Worked out by load():
    name: str = ""                 # production glyph name
    pixels: frozenset = frozenset()  # {(x, y)}: y is the pixel's bottom edge, counted up from the baseline
    width: int = 0
    advance: int = 0
    origin: int = 0                # where the outline starts: a combining mark on its own sits one letter back
    placed: list | None = None     # a composition: [(Glyph, dx, dy)]
    alias: "Glyph | None" = None   # a composition of one part: the same glyph under another character


# ---------------------------------------------------------------------------------------------------------------
# Reading the glyph file


def _show(g):
    """A glyph as messages print it: marks, spaces and controls by code point."""
    c = g.char
    if c is None:
        return g.key
    return f"U+{ord(c):04X}" if unicodedata.category(c)[0] in "MZC" else c


def _fail(path, n, msg, fix):
    raise GlyphError(f"{os.path.relpath(path)}:{n}: {msg} Fix: {fix}")


def _key(path, n, tok):
    """'A' -> ('A', None); 'U+00C0' -> ('À', None); 'dieresis.narrow' -> (None, 'dieresis.narrow')."""
    if len(tok) == 1:
        return tok, None
    m = re.fullmatch(r"U\+([0-9A-Fa-f]{4,6})", tok)
    if m:
        cp = int(m.group(1), 16)
        if cp > 0x10FFFF or 0xD800 <= cp <= 0xDFFF:
            _fail(path, n, f"{tok} is not a character.", "use a code point from U+0000 to U+10FFFF, not a surrogate.")
        return chr(cp), None
    if re.fullmatch(NAME_RE, tok):
        return None, tok
    _fail(path, n, f"'{tok}' is not one character, U+XXXX or a glyph name ({len(tok)} characters).",
          "write a character that is hard to type, or a letter followed by a combining mark, as U+XXXX; a name "
          "starts with a letter and uses letters, digits, '.' and '_'.")


def parse(path):
    """Reads the glyph file into Glyphs (and their names), with errors that name the file, the line and the fix."""
    glyphs, seen = [], {}
    cur = None
    with open(path, encoding="utf-8") as f:
        lines = f.read().split("\n")
    for n, raw in enumerate(lines, 1):
        line = raw.rstrip()
        if not line:
            cur = None
            continue
        if line.startswith("#"):
            continue
        if line.startswith("@"):
            m = re.fullmatch(r"@ (\S+)(?: +(.*))?", line)
            if not m:
                _fail(path, n, f"'{line}' is not a glyph header.",
                      "write '@ <char>' with the rows below it, or '@ <char> = <parts>' (see the top of the file).")
            tok, rest = m.group(1), (m.group(2) or "").strip()
            char, name = _key(path, n, tok)
            g = Glyph(key=char if char is not None else name, line=n, char=char)
            if g.key in seen:
                _fail(path, n, f"'{tok}' is defined twice (first at line {seen[g.key].line}).", "delete one of the blocks.")
            if rest == "=" or rest.startswith("= "):
                g.parts = []
                for t in rest[1:].split():
                    pm = re.fullmatch(r"(.+?)(?:\((-?\d+),(-?\d+)\))?", t)
                    off = (int(pm.group(2)), int(pm.group(3))) if pm.group(2) is not None else None
                    g.parts.append((pm.group(1), off, n))
                if not g.parts:
                    _fail(path, n, f"'{tok}' is composed of nothing.", "list its parts after '=': '@ À = A grave'.")
                cur = None
            else:
                for a in rest.split():
                    k, _, v = a.partition("=")
                    if a == "thin":
                        g.thin = True
                    elif k == "top" and re.fullmatch(r"-?\d+", v):
                        g.top = int(v)
                    elif k == "mark" and v in MARK_KINDS:
                        g.mark = v
                    elif k == "lean" and v in ("left", "right"):
                        g.lean = v
                    elif k == "axis" and re.fullmatch(r"\d+(\.5)?", v):
                        g.axis = float(v)
                    elif k == "name" and re.fullmatch(NAME_RE, v):
                        g.ref = v
                    else:
                        _fail(path, n, f"'{a}' is not a glyph setting.",
                              "use top=N, mark=above|below|hook|ogonek, lean=left|right, axis=N or N.5, name=<name>, thin.")
                cur = g
            seen[g.key] = g
            if g.ref:
                if g.ref in seen:
                    _fail(path, n, f"the name '{g.ref}' is already used (line {seen[g.ref].line}).", "pick another name.")
                seen[g.ref] = g
            glyphs.append(g)
            continue
        if cur is None:
            _fail(path, n, "a row outside a glyph block.",
                  "start the block with '@ <char>', and keep its rows together, without blank lines.")
        if set(line) - set("X."):
            _fail(path, n, f"row '{line}' may only use 'X' (a pixel) and '.' (empty).", "replace the other characters.")
        if cur.rows and len(line) != len(cur.rows[0]):
            _fail(path, n, f"row is {len(line)} wide; the first row of '{_show(cur)}' is {len(cur.rows[0])}.",
                  f"make every row of '{_show(cur)}' the same width.")
        cur.rows.append(line)
    return glyphs, seen


# ---------------------------------------------------------------------------------------------------------------
# Composition


def place_mark(mark, base, bx, by):
    """Where a mark goes on a base placed at (bx, by): above it with a one-pixel gap, below it with a gap, hanging
    from its bottom (hook: the cedilla), or hanging from its bottom-right stroke (ogonek)."""
    ys = [y for _, y in base.pixels] or [0]
    top, bottom = max(ys) + 1, min(ys)
    dy = top - CAP if mark.mark == "above" else bottom
    if mark.mark == "ogonek":
        dx = max([x for x, y in base.pixels if y == bottom] or [base.width - 1]) - mark.width + 1
    else:
        x = (base.axis if base.axis is not None else base.width / 2) - mark.width / 2
        if x != int(x):  # half a pixel off centre: go the way the mark leans
            x += -0.5 if mark.lean == "left" else 0.5
        dx = int(x)
    return bx + dx, by + dy


def _touching(placed):
    """True when two parts overlap or share an edge: then they are merged into one outline."""
    owner = {}
    for i, (p, dx, dy) in enumerate(placed):
        cells = [(x + dx, y + dy) for x, y in p.pixels]
        for x, y in cells:
            for q in ((x, y), (x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if owner.get(q, i) != i:
                    return True
        for c in cells:
            owner[c] = i
    return False


def _production_name(g):
    if g.char is None:
        return g.key
    cp = ord(g.char)
    return agl.UV2AGL.get(cp) or (f"uni{cp:04X}" if cp <= 0xFFFF else f"u{cp:05X}")


def _check_strokes(path, g):
    """Every vertical stroke is two pixels wide: a column of three or more lone pixels is a slip."""
    for c in range(g.width):
        run = 0
        for r, row in enumerate(g.rows):
            lone = row[c] == "X" and (c == 0 or row[c - 1] == ".") and (c == g.width - 1 or row[c + 1] == ".")
            run = run + 1 if lone else 0
            if run == 3:
                _fail(path, g.line + r - 1, f"'{_show(g)}' has a vertical stroke one pixel wide (column {c + 1}).",
                      "draw vertical strokes two pixels wide, or add 'thin' to the header of a small form.")


def load(path=SRC):
    """Parses, checks and composes the glyph file. Returns the glyphs in file order."""
    glyphs, refs = parse(path)
    by_key = {g.key: g for g in glyphs}

    def lookup(tok, n):
        if tok in refs:
            return refs[tok]
        m = re.fullmatch(r"U\+([0-9A-Fa-f]{4,6})", tok)
        if m and chr(int(m.group(1), 16)) in by_key:
            return by_key[chr(int(m.group(1), 16))]
        _fail(path, n, f"'{tok}' is not a glyph in this file.", "draw it first, or check its character or name=.")

    names = set()
    six = Glyph(key="", line=0, width=6, pixels=frozenset((x, y) for x in range(6) for y in range(CAP)))
    for g in glyphs:
        g.name = _production_name(g)
        if g.name in names:
            _fail(path, g.line, f"the glyph name '{g.name}' is used twice.", "rename the glyph.")
        names.add(g.name)
        if g.parts is not None:
            continue
        if not g.rows:
            _fail(path, g.line, f"'{_show(g)}' has no rows.", "draw it below its header: 'X' for a pixel, '.' for empty.")
        g.width = len(g.rows[0])
        g.pixels = frozenset((c, g.top - 1 - r) for r, row in enumerate(g.rows) for c, ch in enumerate(row) if ch == "X")
        g.advance = 0 if g.mark else g.width + 1
        if g.mark:
            if not g.pixels:
                _fail(path, g.line, f"the mark '{_show(g)}' has no pixels.", "draw it.")
            g.origin = place_mark(g, six, 0, 0)[0] - STANDALONE
        elif not g.thin:
            _check_strokes(path, g)

    for g in glyphs:
        if g.parts is None:
            continue
        parts = [(lookup(t, n), off, n) for t, off, n in g.parts]
        if len(parts) == 1 and parts[0][1] is None and not parts[0][0].mark:
            g.alias = parts[0][0]
            continue
        placed, base, pen = [], None, 0
        for p, off, n in parts:
            if p.parts is not None:
                _fail(path, n, f"'{_show(p)}' is composed itself, so it cannot be a part of '{_show(g)}'.",
                      "compose from drawn glyphs.")
            if off is not None:
                dx, dy = off
            elif p.mark:
                if base is None:
                    _fail(path, n, f"the mark '{_show(p)}' in '{_show(g)}' has no letter before it.",
                          "put the letter first: '@ À = A grave'.")
                dx, dy = place_mark(p, *base)
            else:
                dx, dy = pen, 0
            if not p.mark:
                base, pen = (p, dx, dy), dx + p.advance
            placed.append((p, dx, dy))
        g.placed = placed
        g.pixels = frozenset((x + dx, y + dy) for p, dx, dy in placed for x, y in p.pixels)
        letters = [(p, dx) for p, dx, _ in placed if not p.mark]
        g.advance = max(dx + p.advance for p, dx in letters) if letters else max(dx + p.width for p, dx, _ in placed) + 1
        g.width = g.advance - 1

    for g in glyphs:  # an alias of an alias is an alias of the glyph at the end of the chain
        seen = [g]
        while g.alias is not None and g.alias.alias is not None:
            if g.alias in seen:
                _fail(path, g.line, f"'{_show(g)}' is an alias of itself, through {', '.join(_show(a) for a in seen[1:])}.",
                      "point one of them at a drawn or composed glyph.")
            seen.append(g.alias)
            g.alias = g.alias.alias

    for g in glyphs:
        if g.alias is None and g.pixels:
            ys = [y for _, y in g.pixels]
            if max(ys) + 1 > TOP_LIMIT or min(ys) < BOTTOM_LIMIT:
                _fail(path, g.line, f"'{_show(g)}' reaches from {min(ys)} to {max(ys) + 1} pixels from the baseline; ink "
                      f"must stay between {BOTTOM_LIMIT} and {TOP_LIMIT}.", "move it with top=N, or make it shorter.")
    return glyphs


# ---------------------------------------------------------------------------------------------------------------
# Enlarging (ported from the TV launcher's PixelFont.java) and tracing


def epx(m):
    """EPX: each pixel becomes 2 x 2, with a corner filled where two neighbours agree, rounding diagonals."""
    h, w = len(m), len(m[0])
    at = lambda x, y: 0 <= y < h and 0 <= x < w and m[y][x]
    o = [[False] * (2 * w) for _ in range(2 * h)]
    for y in range(h):
        for x in range(w):
            p, a, b, c, d = m[y][x], at(x, y - 1), at(x + 1, y), at(x - 1, y), at(x, y + 1)
            o[2 * y][2 * x] = a if c == a and c != d and a != b else p
            o[2 * y][2 * x + 1] = b if a == b and a != c and b != d else p
            o[2 * y + 1][2 * x] = c if d == c and d != b and c != a else p
            o[2 * y + 1][2 * x + 1] = d if b == d and b != a and d != c else p
    return o


def advmame3(m):
    """AdvMAME3x: each pixel becomes 3 x 3, the same idea as EPX at three times."""
    h, w = len(m), len(m[0])
    at = lambda x, y: 0 <= y < h and 0 <= x < w and m[y][x]
    o = [[False] * (3 * w) for _ in range(3 * h)]
    for y in range(h):
        for x in range(w):
            a, b, c = at(x - 1, y - 1), at(x, y - 1), at(x + 1, y - 1)
            d, e, f = at(x - 1, y), m[y][x], at(x + 1, y)
            g, hh, i = at(x - 1, y + 1), at(x, y + 1), at(x + 1, y + 1)
            r = [e] * 9
            r[0] = d if d == b and d != hh and b != f else e
            r[1] = b if (d == b and d != hh and b != f and e != c) or (b == f and b != d and f != hh and e != a) else e
            r[2] = f if b == f and b != d and f != hh else e
            r[3] = d if (d == b and d != hh and b != f and e != g) or (d == hh and d != b and hh != f and e != a) else e
            r[5] = f if (b == f and b != d and f != hh and e != i) or (hh == f and d != hh and b != f and e != c) else e
            r[6] = d if d == hh and d != b and hh != f else e
            r[7] = hh if (d == hh and d != b and hh != f and e != i) or (hh == f and d != hh and b != f and e != g) else e
            r[8] = f if hh == f and d != hh and b != f else e
            for k in range(9):
                o[3 * y + k // 3][3 * x + k % 3] = r[k]
    return o


def enlarge(pixels, k):
    """Pixels enlarged k times (1; 2 with EPX; 3 with AdvMAME3x) as cells of 1/k pixel, y counted up. Pixels outside
    the glyph's box never change, so the box can be cropped to the ink."""
    if k == 1 or not pixels:
        return set(pixels)
    xs, ys = [x for x, _ in pixels], [y for _, y in pixels]
    x0, y1 = min(xs), max(ys)
    m = [[(x0 + c, y1 - r) in pixels for c in range(max(xs) - x0 + 1)] for r in range(y1 - min(ys) + 1)]
    o = epx(m) if k == 2 else advmame3(m)
    return {(x0 * k + c, (y1 + 1) * k - 1 - r) for r, row in enumerate(o) for c, v in enumerate(row) if v}


def trace(cells, unit, dx=0):
    """Traces the union of cells into closed contours, clockwise around ink (TrueType's direction), in font units."""
    edges = {}
    add = lambda a, b: edges.setdefault(a, []).append(b)
    for x, y in sorted(cells):
        if (x, y + 1) not in cells:
            add((x, y + 1), (x + 1, y + 1))  # top edge, going right
        if (x + 1, y) not in cells:
            add((x + 1, y + 1), (x + 1, y))  # right edge, going down
        if (x, y - 1) not in cells:
            add((x + 1, y), (x, y))  # bottom edge, going left
        if (x - 1, y) not in cells:
            add((x, y), (x, y + 1))  # left edge, going up

    def take(at, came_from):
        """Where two cells touch only at a corner, two edges leave one point: turn right, so they stay apart."""
        outs = edges[at]
        if len(outs) > 1:
            right = (at[1] - came_from[1], came_from[0] - at[0])
            outs.sort(key=lambda b: 0 if (b[0] - at[0], b[1] - at[1]) == right else 1)
        b = outs.pop(0)
        if not outs:
            del edges[at]
        return b

    contours = []
    while edges:
        start = min(edges)
        first = edges[start].pop(0)
        if not edges[start]:
            del edges[start]
        loop, prev, cur = [start], start, first
        while cur != start:
            loop.append(cur)
            prev, cur = cur, take(cur, prev)
        pts = []
        for i, p in enumerate(loop):
            a, b = loop[i - 1], loop[(i + 1) % len(loop)]
            if not ((a[0] == p[0] == b[0]) or (a[1] == p[1] == b[1])):  # drop the middle of straight runs
                pts.append((p[0] * unit + dx, p[1] * unit))
        contours.append(pts)
    return contours


def _simple(contours):
    pen = TTGlyphPen(None)
    for pts in contours:
        pen.moveTo(pts[0])
        for p in pts[1:]:
            pen.lineTo(p)
        pen.closePath()
    return pen.glyph()


def _composite(components, names):
    pen = TTGlyphPen(names)
    for name, dx, dy in components:
        pen.addComponent(name, (1, 0, 0, 1, dx, dy))
    return pen.glyph()


def outline(g, k, names):
    """The glyph's outline at enlargement k: traced from its pixels, or a composite of its parts when they stay apart
    (once each part is enlarged on its own, the parts must add up to the whole enlarged)."""
    suffix = "" if k == 1 else next("." + tag for tag, kk, _ in SETS if kk == k)
    whole = enlarge(g.pixels, k)
    if g.placed is not None:
        if k == 1:
            apart = not _touching(g.placed)
        else:
            apart = set().union(*({(x + dx * k, y + dy * k) for x, y in enlarge(p.pixels, k)} for p, dx, dy in g.placed)) == whole
        if apart:
            return _composite([(p.name + suffix, (dx - p.origin) * PX, dy * PX) for p, dx, dy in g.placed], names), True
    return _simple(trace(whole, PX // k, g.origin * PX)), False


# ---------------------------------------------------------------------------------------------------------------
# Pixel Bop


def _version():
    with open(os.path.join(ROOT, "package.json"), encoding="utf-8") as f:
        return json.load(f)["version"]


def _epoch():
    """Seconds since 1904 (the font clock) for SOURCE_DATE_EPOCH, or 2026-01-01."""
    v = os.environ.get("SOURCE_DATE_EPOCH", "")
    return (int(v) if v.isdigit() else DEFAULT_EPOCH) - epoch_diff


def character_map(glyphs):
    """Characters to glyph names. Capitals only: every lower-case letter draws with its capital."""
    cmap = {ord(g.char): (g.alias or g).name for g in glyphs if g.char is not None}
    for cp in list(range(0x20, 0x250)) + list(range(0x1E00, 0x1F00)):
        c = chr(cp)
        if cp not in cmap and unicodedata.category(c).startswith("L") and len(c.upper()) == 1 and c.upper() != c:
            if ord(c.upper()) in cmap:
                cmap[cp] = cmap[ord(c.upper())]
    return cmap


def _notdef():
    pen = TTGlyphPen(None)
    for x0, y0, x1, y1, clockwise in ((0, 0, 5, 7, True), (1, 1, 4, 6, False)):  # a hollow box, cap height
        pts = [(x0 * PX, y0 * PX), (x0 * PX, y1 * PX), (x1 * PX, y1 * PX), (x1 * PX, y0 * PX)]
        pts = pts if clockwise else pts[::-1]
        pen.moveTo(pts[0])
        for p in pts[1:]:
            pen.lineTo(p)
        pen.closePath()
    return pen.glyph()


def _features(real, glyphs):
    names = lambda gs, s="": " ".join(g.name + s for g in gs)
    marks, bases = [g for g in real if g.mark], [g for g in real if not g.mark]
    by_char = {g.char: (g.alias or g) for g in glyphs if g.char}
    fea = ["languagesystem DFLT dflt;", "languagesystem latn dflt;", "languagesystem latn ROM;", "languagesystem latn MOL;", ""]
    # Romanian and Moldovan write S and T with a comma below, even in text typed with the cedilla characters.
    pairs = [(by_char[a], by_char[b]) for a, b in (("Ş", "Ș"), ("Ţ", "Ț")) if a in by_char and b in by_char]
    if pairs:
        fea += ["lookup comma_below {"] + [f"  sub {a.name} by {b.name};" for a, b in pairs] + ["} comma_below;", ""]
        fea += ["feature locl {", "  script latn;", "  language ROM exclude_dflt;", "  lookup comma_below;",
                "  language MOL exclude_dflt;", "  lookup comma_below;", "} locl;", ""]
    for tag, _, label in SETS:
        fea += [f"feature {tag} {{", f'  featureNames {{ name "{label}"; }};',
                f"  sub [{names(real)}] by [{names(real, '.' + tag)}];", f"}} {tag};", ""]
    every = lambda gs: " ".join([names(gs)] + [names(gs, "." + tag) for tag, _, _ in SETS])
    fea += ["table GDEF {", f"  GlyphClassDef [{every(bases)}], , [{every(marks)}], ;", "} GDEF;"]
    return "\n".join(fea)


def build_pixel_bop(glyphs):
    version = _version()
    real = [g for g in glyphs if g.alias is None]
    order = [".notdef"] + [g.name for g in real] + [f"{g.name}.{tag}" for tag, _, _ in SETS for g in real]
    known = set(order)
    outlines, advances = {".notdef": _notdef()}, {".notdef": 6 * PX}
    composites = 0
    for k, suffix in [(1, "")] + [(k, "." + tag) for tag, k, _ in SETS]:
        for g in real:
            outlines[g.name + suffix], linked = outline(g, k, known)
            advances[g.name + suffix] = g.advance * PX
            composites += linked

    cmap = character_map(glyphs)
    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(outlines)
    glyf = fb.font["glyf"]
    fb.setupHorizontalMetrics({n: (advances[n], glyf[n].xMin if glyf[n].numberOfContours else 0) for n in order})
    fb.setupHorizontalHeader(ascent=ASCENT * PX, descent=-DESCENT * PX, lineGap=0)
    stamp = _epoch()
    fb.setupHead(unitsPerEm=UPM, fontRevision=float(".".join(version.split(".")[:2])), created=stamp, modified=stamp,
                 lowestRecPPEM=10)
    fb.font.recalcTimestamp = False
    fb.setupNameTable({
        "copyright": f'Copyright 2026 {AUTHORS}, with Reserved Font Name "{FAMILY}".',
        "familyName": FAMILY,
        "styleName": "Regular",
        "uniqueFontIdentifier": f"{version};{VENDOR};{PS_NAME}",
        "fullName": f"{FAMILY} Regular",
        "version": f"Version {version}",
        "psName": PS_NAME,
        "manufacturer": AUTHORS,
        "designer": AUTHORS,
        "description": "Blip's pixel display font: bold capitals on a 7-pixel grid, with rounded enlargements "
                       "for 2x and 3x (stylistic sets ss02 and ss03).",
        "licenseDescription": "This Font Software is licensed under the SIL Open Font License, Version 1.1. "
                              "This license is available with a FAQ at: https://openfontlicense.org",
        "licenseInfoURL": "https://openfontlicense.org",
        "sampleText": SAMPLE,
    })
    inked = [g for g in glyf.glyphs.values() if g.numberOfContours]
    fb.setupOS2(
        version=4, achVendID=VENDOR, usWeightClass=400, usWidthClass=5, fsType=0,
        fsSelection=0x40 | 0x80,  # REGULAR | USE_TYPO_METRICS
        sTypoAscender=ASCENT * PX, sTypoDescender=-DESCENT * PX, sTypoLineGap=0,
        usWinAscent=max([g.yMax for g in inked] + [ASCENT * PX]), usWinDescent=-min([g.yMin for g in inked] + [-DESCENT * PX]),
        sxHeight=CAP * PX, sCapHeight=CAP * PX, usDefaultChar=0, usBreakChar=0x20,
        ySubscriptXSize=7 * PX, ySubscriptYSize=7 * PX, ySubscriptYOffset=2 * PX,
        ySuperscriptXSize=7 * PX, ySuperscriptYSize=7 * PX, ySuperscriptYOffset=4 * PX,
        yStrikeoutSize=PX, yStrikeoutPosition=3 * PX,
    )
    fb.setupPost(keepGlyphNames=True, underlinePosition=-PX, underlineThickness=PX)
    fb.font["OS/2"].recalcUnicodeRanges(fb.font)
    fb.font["OS/2"].recalcCodePageRanges(fb.font)
    # Pixels are squares with straight edges, so smoothing can only blur an edge: where the system asks the font
    # (Windows GDI and DirectWrite), draw it without smoothing at every size.
    fb.font["gasp"] = newTable("gasp")
    fb.font["gasp"].version, fb.font["gasp"].gaspRange = 1, {0xFFFF: 0x0000}
    fb.font["meta"] = newTable("meta")
    fb.font["meta"].data = {"dlng": "Latn", "slng": "Latn"}
    addOpenTypeFeaturesFromString(fb.font, _features(real, glyphs))
    fb.font["OS/2"].usMaxContext = maxCtxFont(fb.font)

    os.makedirs(DIST, exist_ok=True)
    ttf = os.path.join(DIST, "pixel-bop.ttf")
    fb.save(ttf)
    # The web font leaves the glyph names out (browsers never read them; the TTF keeps them for design tools) and lets
    # WOFF2 rebuild the side bearings from the outlines.
    font = TTFont(ttf, recalcTimestamp=False)
    font["post"].formatType = 3.0
    font.flavor = "woff2"
    font.flavorData = WOFF2FlavorData(transformedTables={"glyf", "loca", "hmtx"})
    woff2 = os.path.join(DIST, "pixel-bop.woff2")
    font.save(woff2)

    size = os.path.getsize(woff2)
    drawn = sum(1 for g in real if g.placed is None)
    print(f"Pixel Bop {version}: {len(cmap)} characters, {len(real)} glyphs ({drawn} drawn, {len(real) - drawn} composed), "
          f"each also in {' and '.join(tag for tag, _, _ in SETS)}: {len(order)} glyphs, {composites} of them composites\n"
          f"  {os.path.relpath(ttf, REPO)}   {os.path.getsize(ttf):>6} B\n"
          f"  {os.path.relpath(woff2, REPO)} {size:>6} B  (budget {WOFF2_BUDGET} B)")
    if size > WOFF2_BUDGET:
        sys.exit(f"Pixel Bop: the WOFF2 is {size} B, over the {WOFF2_BUDGET} B budget. Fix: draw fewer glyphs, or "
                 "compose more of them.")
    return cmap


# ---------------------------------------------------------------------------------------------------------------
# The glyph table (examples/font.html) and the character list (docs/font.md)

GROUPS = (
    ("Capitals", lambda c, cat: cat == "Lu" and c.isascii()),
    ("Accented and other letters", lambda c, cat: cat == "Lu" or (cat == "Ll" and c != "\u00b5")),
    ("Figures", lambda c, cat: cat in ("Nd", "No")),
    ("Punctuation", lambda c, cat: cat.startswith("P")),
    ("Symbols", lambda c, cat: cat in ("Sm", "Sc", "So", "Ll", "Lo")),
    ("Spacing accents", lambda c, cat: cat in ("Sk", "Lm")),
)


TABLE = ("display:grid;grid-template-columns:max-content minmax(0,1fr);gap:calc(4*var(--pp-pixel)) calc(8*var(--pp-pixel));"
         "align-items:baseline;margin:0")
TABLE_CELL = "margin:0;text-transform:none;letter-spacing:calc(3*var(--pp-pixel));word-break:break-all"


def _groups(glyphs):
    """The characters with a glyph of their own, in groups. Combining marks, spaces and the second names of a glyph
    (soft hyphen, the other hyphens and dashes) are left out; a second name that is its own letter (Đ) stays."""
    shown = set()
    for g in glyphs:
        cat = unicodedata.category(g.char) if g.char else ""
        if g.char and ((g.alias is None and cat not in ("Mn", "Zs")) or (g.alias is not None and cat in ("Lu", "Sm", "Ps"))):
            shown.add(g.char)
    out = []
    for label, test in GROUPS:
        members = sorted(c for c in shown if test(c, unicodedata.category(c)))
        shown -= set(members)
        out.append((label, members))
    if shown:
        out.append(("Other", sorted(shown)))
    return out


def _between(path, start, end, body):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    i, j = text.find(start), text.find(end)
    if i < 0 or j < i:
        sys.exit(f"Pixel Bop: {os.path.relpath(path, REPO)} has lost its '{start}' and '{end}' markers. Fix: put them back.")
    new = text[: i + len(start)] + "\n" + body + text[j:]
    if new != text:
        with open(path, "w", encoding="utf-8") as f:
            f.write(new)


def write_tables(glyphs):
    groups = _groups(glyphs)
    if os.path.exists(EXAMPLE):
        rows = []
        for label, chars in groups:
            cells = "".join(f'<span title="U+{ord(c):04X} {html.escape(unicodedata.name(c, "").title())}">{html.escape(c)}</span>'
                            for c in chars)
            # As typed (no upper-casing, which would turn the micro sign into a Greek capital), with room to point at.
            rows.append(f'  <dt class="pp-label pp-muted">{label} ({len(chars)})</dt>\n'
                        f'  <dd class="pp-display" data-scale="1" style="{TABLE_CELL}">{cells}</dd>')
        _between(EXAMPLE, "<!-- glyph-table: written by scripts/build.py -->", "<!-- /glyph-table -->",
                 f'<dl style="{TABLE}">\n' + "\n".join(rows) + "\n</dl>\n")
    if os.path.exists(DOC):
        marks = " ".join(f"U+{ord(g.char):04X}" for g in glyphs if g.char and unicodedata.category(g.char) == "Mn")
        lines = [f"- **{label}** ({len(chars)}): {' '.join('`` ` ``' if c == '`' else f'`{c}`' for c in chars)}" for label, chars in groups]
        lines.append(f"- **Combining accents**: {marks}. Text typed with them (decomposed) draws as the composed letter.")
        _between(DOC, "<!-- charset: written by scripts/build.py -->", "<!-- /charset -->", "\n".join(lines) + "\n")


# ---------------------------------------------------------------------------------------------------------------
# Pixelify Sans


def _pixelify_masters(font, name):
    """A simple glyph's points and its full deltas at the heaviest weight (phantom points included, none inferred)."""
    glyf = font["glyf"]
    tvs = font["gvar"].variations.get(name, [])
    if glyf[name].isComposite() or glyf[name].numberOfContours != 1 or len(tvs) != 1:
        raise GlyphError(f"Pixelify Sans: '{name}' is no longer one outline with one weight master. The C/G/5 patch "
                         "was written for Pixelify Sans 1.000: check the new outlines and update patch_pixelify.")
    coords, ctrl = glyf._getCoordinatesAndControls(name, font["hmtx"].metrics, None)
    tv = copy.deepcopy(tvs[0])
    tv.calcInferredDeltas(coords, ctrl.endPts)
    return [tuple(p) for p in coords], [(round(dx), round(dy)) for dx, dy in tv.coordinates], tv.axes


def _pixelify_inside(points, x, y):
    """Even-odd point-in-polygon for one closed outline."""
    inside = False
    for (x1, y1), (x2, y2) in zip(points, points[1:] + points[:1]):
        if (y1 > y) != (y2 > y) and x < x1 + (y - y1) * (x2 - x1) / (y2 - y1):
            inside = not inside
    return inside


def patch_pixelify(font):
    """
    Pixelify Sans draws C as an O with a slit on its right that is narrower than one of its pixels and closes at bold,
    G the same way, and 5 like an S. In the all-caps labels of Blip, CODE reads as OODE and 500 as S00; at bold,
    lower-case c closes too (abcde reads as abode). These are redrawn here from the font's own parts, point for point
    with their weight deltas, so they stay open at every weight: C is E without its middle bar, G takes E's upper
    terminal, 5 is S with a square top-left corner, no top-right terminal, and the stem running down into a flat
    middle bar, and c keeps its one-row opening at bold. Accented C, G and c are composites, so they follow. The OFL allows the change (Pixelify Sans reserves no font name); OFL-PixelifySans.txt says what changed.
    """
    glyf, gvar = font["glyf"], font["gvar"]
    E, E_d, axes = _pixelify_masters(font, "E")
    G, G_d, _ = _pixelify_masters(font, "G")
    S, S_d, _ = _pixelify_masters(font, "S")
    c, c_d, _ = _pixelify_masters(font, "c")
    n = lambda pts: len(pts) - 4  # outline points, without the four phantom points
    expect = {"E": (E, 24, (161, 359)), "G": (G, 26, (525, 350)), "S": (S, 28, (525, 440)), "c": (c, 20, (525, 260))}
    for name, (pts, count, probe) in expect.items():
        if n(pts) != count or probe not in pts:
            raise GlyphError(f"Pixelify Sans: '{name}' does not have the outline patch_pixelify expects. Check it.")

    # C: E's outline without its middle bar (E's points 13 to 16).
    keep = [i for i in range(n(E)) if not 13 <= i <= 16]
    redraw = {"C": ([E[i] for i in keep], [E_d[i] for i in keep] + E_d[n(E):])}
    # G: its upper terminal ends where E's does, a whole pixel above the spur.
    g_pts, g_d = list(G), list(G_d)
    for i, j in ((9, 9), (10, 10)):
        g_pts[i], g_d[i] = (G[i][0], E[j][1]), (G_d[i][0], E_d[j][1])
    redraw["G"] = (g_pts[:n(G)], g_d)
    # 5: from S. Square top-left, no top-right terminal, the stem straight down to the bottom of the middle bar.
    f_pts, f_d = list(S), list(S_d)
    for i, point, delta in (
        (8, (60, 260), (1, -14)),     # the middle bar runs to the left edge
        (9, (60, 305), (1, -16)),     # on the left edge
        (11, (60, 631), (1, 7)),      # square top-left corner
        (12, (100, 631), (0, 7)),     # on the top edge
        (17, (525, 530), (17, -29)),  # the top bar ends square: no terminal below it
        (18, (480, 530), (4, -29)),   # on the underside of the top bar
    ):
        f_pts[i], f_d[i] = point, delta
    redraw["five"] = (f_pts[:n(S)], f_d)
    # c: its terminals no longer grow into the opening at bold (points 9 and 10 end the upper one, 15 and 16 the lower).
    c_d = list(c_d)
    for i in (9, 10, 15, 16):
        c_d[i] = (c_d[i][0], 0)
    redraw["c"] = (c[:n(c)], c_d)

    for name, (pts, deltas) in redraw.items():
        g = glyf[name]
        g.coordinates = GlyphCoordinates(pts)
        g.endPtsOfContours = [len(pts) - 1]
        g.flags = bytearray([1] * len(pts))  # all on-curve: pixel outlines are straight lines
        g.numberOfContours = 1
        g.recalcBounds(glyf)
        gvar.variations[name] = [TupleVariation(axes, deltas)]

    # Check the result at both ends of the weight axis: the openings are open, and 5 has its stem.
    for name, empty, ink in (("C", (474, 300), (110, 300)), ("G", (474, 380), (110, 300)), ("five", (474, 480), (110, 300)),
                             ("c", (474, 220), (110, 220))):
        pts, deltas = redraw[name]
        bold = [(x + dx, y + dy) for (x, y), (dx, dy) in zip(pts, deltas)]
        for label, outline in (("regular", pts), ("bold", bold)):
            if _pixelify_inside(outline, *empty) or not _pixelify_inside(outline, *ink):
                raise GlyphError(f"Pixelify Sans: the patched '{name}' is not right at {label}. Check patch_pixelify.")


def build_pixelify():
    out = os.path.join(DIST, "pixelify-sans.woff2")
    if not os.path.exists(PIXELIFY_SRC):
        msg = (f"Pixelify Sans: the source font is missing ({PIXELIFY_SRC}). Fix: download PixelifySans[wght].ttf from "
               "https://github.com/google/fonts/tree/main/ofl/pixelifysans and set PIXELIFY_SANS to its path.")
        if not os.path.exists(out):
            sys.exit(msg)
        print(msg + f" Kept the existing {os.path.relpath(out, REPO)}.")
        return
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]
    opts.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
    opts.notdef_outline = True
    opts.recalc_timestamp = False
    font = subset.load_font(PIXELIFY_SRC, opts)
    try:
        patch_pixelify(font)
    except GlyphError as e:
        sys.exit(str(e))
    for record in font["name"].names:
        if record.nameID == 5:
            record.string = f"{record.toUnicode()}; Blip: C, G, 5 and c redrawn"
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=[cp for a, b in PIXELIFY_UNICODES for cp in range(a, b + 1)])
    sub.subset(font)
    font["head"].created = font["head"].modified = _epoch()
    subset.save_font(font, out, opts)
    axes = ", ".join(f"{a.axisTag} {a.minValue:g} to {a.maxValue:g}" for a in font["fvar"].axes) if "fvar" in font else "static"
    print(f"Pixelify Sans: {len(font.getBestCmap())} characters, {axes}\n  {os.path.relpath(out, REPO)} {os.path.getsize(out):>6} B")


def main():
    try:
        glyphs = load(SRC)
    except GlyphError as e:
        sys.exit(f"Pixel Bop: {e}")
    build_pixel_bop(glyphs)
    write_tables(glyphs)
    build_pixelify()


if __name__ == "__main__":
    main()
