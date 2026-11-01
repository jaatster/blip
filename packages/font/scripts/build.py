#!/usr/bin/env python3
"""Builds the two faces of @jaatster/blip-font.

1. Pixel Bop, Blip's pixel display font: src/pixel-bop.glyphs -> dist/pixel-bop.ttf (every script) and one WOFF2
   per script: dist/pixel-bop.woff2 (Latin), pixel-bop-cyrillic.woff2 and pixel-bop-greek.woff2.
2. Pixelify Sans, for UI and body text: the variable font (weights 400 to 700) with its ligatures left out and its
   glyphs finer than a pixel redrawn on its grid (patch_pixelify and src/pixelify-sans.glyphs), checked so neither
   can come back (check_pixelify), -> dist/pixelify-sans.woff2 (Latin), pixelify-sans-cyrillic.woff2 and -greek.woff2.
It also writes the glyph table in examples/font.html, the character list in docs/font.md and the @font-face rules in
font.css, so they always match the fonts.

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
        .tools/venv/bin/python -I packages/font/scripts/build.py --check FONT...   (checks Pixelify Sans files only)
Environment:
  SOURCE_DATE_EPOCH   the timestamp written into both fonts (default 2026-01-01), so builds are reproducible
  PIXELIFY_SANS       the Pixelify Sans source (default vendor/PixelifySans[wght].ttf, the unmodified Google Fonts file)
"""
import copy
import html
import io
import json
import math
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
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont, newTable
from fontTools.ttLib.tables._g_l_y_f import GlyphCoordinates
from fontTools.ttLib.tables.TupleVariation import TupleVariation
from fontTools.ttLib.woff2 import WOFF2FlavorData
from fontTools.varLib.hvar import add_HVAR

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
REPO = os.path.abspath(os.path.join(ROOT, "..", ".."))
SRC = os.path.join(ROOT, "src", "pixel-bop.glyphs")
DIST = os.path.join(ROOT, "dist")
EXAMPLE = os.path.join(ROOT, "examples", "font.html")
DOC = os.path.join(ROOT, "docs", "font.md")
CSS = os.path.join(ROOT, "font.css")

PX = 120                          # units per pixel
UPM = 10 * PX                     # 1 em = 10 pixels
CAP, ASCENT, DESCENT = 7, 9, 3    # in pixels
TOP_LIMIT, BOTTOM_LIMIT = 11, -3  # ink stays between these, in pixels from the baseline
STANDALONE = 7                    # a combining mark on its own sits over the letter before it: one advance back
FAMILY, PS_NAME, VENDOR = "Pixel Bop", "PixelBop-Regular", "PXPP"
AUTHORS = "The Blip authors"
DEFAULT_EPOCH = 1767225600        # 2026-01-01T00:00:00Z
WOFF2_BUDGET = 15 * 1024          # each WOFF2 file
# The web fonts, one per script: Latin for every page, Cyrillic and Greek only where text uses them.
BOP_FACES = (("pixel-bop.woff2", "Latin", ("latin",)), ("pixel-bop-cyrillic.woff2", "Cyrillic", ("cyrillic",)),
             ("pixel-bop-greek.woff2", "Greek", ("greek",)))
SETS = (("ss02", 2, "Rounded 2x"), ("ss03", 3, "Rounded 3x"))
MARK_KINDS = ("above", "below", "hook", "ogonek")
SAMPLE = "PIXEL BOP: THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG. 0123456789"
NAME_RE = r"[A-Za-z][A-Za-z0-9._]{0,62}"

PIXELIFY_SRC = os.environ.get("PIXELIFY_SANS") or os.path.join(ROOT, "vendor", "PixelifySans[wght].ttf")
PIXELIFY_GLYPHS = os.path.join(ROOT, "src", "pixelify-sans.glyphs")
# Three files. Latin is for every page; Cyrillic and Greek download only where a page uses them (font.css gives each
# the unicode-range of what it draws).
PIXELIFY_FACES = (
    ("pixelify-sans.woff2", "Latin", [
        (0x20, 0x7E), (0xA0, 0xFF), (0x100, 0x17F),   # Latin, Latin-1, Latin Extended-A
        (0x218, 0x21B), (0x1E9E, 0x1E9E),             # Romanian S and T with comma below, capital sharp s: as Pixel Bop
        (0x2C6, 0x2DD),                               # spacing accents (combining ones: see PIXELIFY_FEATURES)
        (0x2000, 0x206F), (0x20AC, 0x20AC), (0x2122, 0x2122), (0x2212, 0x2212),  # punctuation, €, ™, the minus sign
    ]),
    ("pixelify-sans-cyrillic.woff2", "Cyrillic", [(0x400, 0x45F), (0x490, 0x491), (0x2116, 0x2116)]),
    ("pixelify-sans-greek.woff2", "Greek", [(0x370, 0x3FF)]),
)
# OpenType features kept: composition, local forms and kerning. Not kept: the ligatures (liga drew fi and fl as "A";
# dlig), what nothing in Blip asks for (frac, ordn, sups, subs, sinf, case, aalt), and accent placement (mark,
# mkmk): the combining accents are not characters of the files, so a letter typed with one (e + U+0301) draws as the
# composed letter (é), and a letter the font does not draw goes to the next font whole instead of being pieced
# together from parts (Vietnamese ế, whose two accents would pile up into one blob).
PIXELIFY_FEATURES = ["ccmp", "locl", "kern"]
# What the version string says changed (the OFL asks a modified font to say so).
PIXELIFY_CHANGES = ("no ligatures; C, G, 5, c and every accent, quote, comma and symbol finer than a pixel redrawn on "
                    "the pixel grid; Cyrillic and Greek corrected and completed")


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


def _loops(cells, join=False):
    """The outline of the union of cells as closed loops of corner points, in cells, clockwise around ink (TrueType's
    direction). Where two cells touch only at a corner, two edges leave one point: the loop turns right and keeps the
    cells apart, or with join turns left and runs through the corner twice, joining them (as Pixelify Sans joins its
    diagonal steps)."""
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
        outs = edges[at]
        if len(outs) > 1:
            dx, dy = at[0] - came_from[0], at[1] - came_from[1]
            turn = (-dy, dx) if join else (dy, -dx)
            outs.sort(key=lambda b: 0 if (b[0] - at[0], b[1] - at[1]) == turn else 1)
        b = outs.pop(0)
        if not outs:
            del edges[at]
        return b

    loops = []
    while edges:
        start = min(edges)
        first = edges[start].pop(0)
        if not edges[start]:
            del edges[start]
        loop, prev, cur = [start], start, first
        while cur != start:
            loop.append(cur)
            prev, cur = cur, take(cur, prev)
        n = len(loop)  # drop the middle of straight runs
        loops.append([p for i, p in enumerate(loop)
                      if not (loop[i - 1][0] == p[0] == loop[(i + 1) % n][0] or loop[i - 1][1] == p[1] == loop[(i + 1) % n][1])])
    return loops


def trace(cells, unit, dx=0):
    """Traces the union of cells into closed contours, clockwise around ink, in font units."""
    return [[(x * unit + dx, y * unit) for x, y in loop] for loop in _loops(cells)]


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


def _script(cp):
    """Which of the web fonts a character goes in."""
    return "greek" if 0x370 <= cp <= 0x3FF else "cyrillic" if 0x400 <= cp <= 0x52F else "latin"


def _version():
    with open(os.path.join(ROOT, "package.json"), encoding="utf-8") as f:
        return json.load(f)["version"]


def _epoch():
    """Seconds since 1904 (the font clock) for SOURCE_DATE_EPOCH, or 2026-01-01."""
    v = os.environ.get("SOURCE_DATE_EPOCH", "")
    return (int(v) if v.isdigit() else DEFAULT_EPOCH) - epoch_diff


def character_map(glyphs):
    """Characters to glyph names. Capitals only: every lower-case letter draws with its capital, and Greek drops the
    tonos, as Greek set in capitals does (ά and Ά draw as Α; ΐ as Ϊ)."""
    # The combining accents are parts of letters, not characters of their own: a letter typed with one (e + U+0301)
    # still draws as the composed letter (É), but one Pixel Bop does not draw cannot be pieced together from a letter
    # and its accents. It goes to the next font whole, instead of stacking two accents into the line above (Ế).
    cmap = {ord(g.char): (g.alias or g).name for g in glyphs if g.char is not None and unicodedata.category(g.char) != "Mn"}
    for cp in list(range(0x20, 0x250)) + list(range(0x370, 0x530)) + list(range(0x1E00, 0x1F00)):
        c = chr(cp)
        if cp in cmap or not unicodedata.category(c).startswith("L"):
            continue
        up = c.upper()
        if 0x370 <= cp < 0x400:
            up = unicodedata.normalize("NFC", unicodedata.normalize("NFD", up).replace("́", ""))
        if len(up) == 1 and up != c and ord(up) in cmap:
            cmap[cp] = cmap[ord(up)]
    for cp in (0x386, 0x388, 0x389, 0x38A, 0x38C, 0x38E, 0x38F):  # the capitals with tonos
        plain = unicodedata.normalize("NFD", chr(cp))[0]
        if cp not in cmap and ord(plain) in cmap:
            cmap[cp] = cmap[ord(plain)]
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
    fea = ["languagesystem DFLT dflt;", "languagesystem latn dflt;", "languagesystem latn ROM;", "languagesystem latn MOL;",
           "languagesystem cyrl dflt;", "languagesystem grek dflt;", ""]
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
    fb.font["meta"].data = {"dlng": "Latn, Cyrl, Grek", "slng": "Latn, Cyrl, Grek"}
    addOpenTypeFeaturesFromString(fb.font, _features(real, glyphs))
    fb.font["OS/2"].usMaxContext = maxCtxFont(fb.font)

    os.makedirs(DIST, exist_ok=True)
    ttf = os.path.join(DIST, "pixel-bop.ttf")
    fb.save(ttf)
    # The web fonts: one file per script, so a page downloads only the scripts it shows (font.css gives each its
    # unicode-range). They leave the glyph names out (browsers never read them; the TTF keeps them for design tools)
    # and let WOFF2 rebuild the side bearings from the outlines.
    opts = subset.Options()
    opts.layout_features, opts.name_IDs, opts.name_languages = ["*"], ["*"], ["*"]
    opts.notdef_outline, opts.recalc_timestamp, opts.glyph_names = True, False, False
    opts.drop_tables = opts.drop_tables + ["meta"]   # the languages it supports, for design tools: the TTF keeps it
    lines, over = [], []
    for file, label, scripts in BOP_FACES:
        face = TTFont(ttf, recalcTimestamp=False)
        sub = subset.Subsetter(opts)
        sub.populate(unicodes=[cp for cp in cmap if _script(cp) in scripts])
        sub.subset(face)
        face["post"].formatType = 3.0
        face.flavor = "woff2"
        face.flavorData = WOFF2FlavorData(transformedTables={"glyf", "loca", "hmtx"})
        out = os.path.join(DIST, file)
        face.save(out)
        size = os.path.getsize(out)
        lines.append(f"  {os.path.relpath(out, REPO):30} {size:>6} B  {label}, {len(face.getBestCmap())} characters")
        if size > WOFF2_BUDGET:
            over.append(f"Pixel Bop: {file} is {size} B, over the {WOFF2_BUDGET} B budget. Fix: draw fewer glyphs, or "
                        "compose more of them.")

    drawn = sum(1 for g in real if g.placed is None)
    print(f"Pixel Bop {version}: {len(cmap)} characters, {len(real)} glyphs ({drawn} drawn, {len(real) - drawn} composed), "
          f"each also in {' and '.join(tag for tag, _, _ in SETS)}: {len(order)} glyphs, {composites} of them composites\n"
          f"  {os.path.relpath(ttf, REPO):30} {os.path.getsize(ttf):>6} B  every script, for design tools\n" + "\n".join(lines) +
          f"\n  (each WOFF2 within {WOFF2_BUDGET} B)")
    if over:
        sys.exit("\n".join(over))
    return cmap


# ---------------------------------------------------------------------------------------------------------------
# The glyph table (examples/font.html) and the character list (docs/font.md)

GROUPS = (
    ("Capitals", lambda c, cat: cat == "Lu" and c.isascii()),
    ("Cyrillic", lambda c, cat: cat.startswith("L") and 0x400 <= ord(c) <= 0x52F),
    ("Greek", lambda c, cat: cat.startswith("L") and 0x370 <= ord(c) <= 0x3FF),
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
        lines.append(f"- **Combining accents** ({marks}) are parts, not characters: a letter typed with one (decomposed) draws as "
                     "the composed letter.")
        _between(DOC, "<!-- charset: written by scripts/build.py -->", "<!-- /charset -->", "\n".join(lines) + "\n")


# ---------------------------------------------------------------------------------------------------------------
# font.css: one @font-face per file


def _unicode_range(cps):
    """Code points as a CSS unicode-range: runs of consecutive characters become U+XXXX-YYYY."""
    runs = []
    for cp in sorted(cps):
        if runs and cp == runs[-1][1] + 1:
            runs[-1][1] = cp
        else:
            runs.append([cp, cp])
    return [f"U+{a:04X}" if a == b else f"U+{a:04X}-{b:04X}" for a, b in runs]


def write_css():
    """The @font-face rules in font.css, one per file, each with the unicode-range of exactly the characters the file
    draws: a page downloads only the files its text needs, and a character a face does not draw goes to the next font
    in the stack instead of being pieced together from parts (a Vietnamese capital with two accents would otherwise
    be drawn as one accent stacked on another, rising into the line above)."""
    blocks = []
    for family, weight, file in [("Pixel Bop", "400", f) for f, _, _ in BOP_FACES] + [("Pixelify Sans", "400 700", f) for f, _, _ in PIXELIFY_FACES]:
        path = os.path.join(DIST, file)
        if not os.path.exists(path):
            sys.exit(f"font.css: {os.path.relpath(path, REPO)} is missing. Fix: build the fonts first.")
        lines, cur = [], "  unicode-range:"
        for r in _unicode_range(cp for cp in TTFont(path).getBestCmap() if cp >= 0x20):
            if len(cur) + len(r) + 2 > 118:
                lines.append(cur)
                cur = "   "
            cur += f" {r},"
        lines.append(cur[:-1] + ";")
        blocks.append("@font-face {\n" f'  font-family: "{family}";\n  src: url("./dist/{file}") format("woff2");\n'
                      f"  font-weight: {weight};\n  font-style: normal;\n  font-display: swap;\n" + "\n".join(lines) + "\n}\n")
    _between(CSS, "/* faces: written by scripts/build.py */", "/* /faces */", "\n".join(blocks))


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
    and G the same way. In the all-caps labels of Blip, CODE reads as OODE; at bold, lower-case c closes too
    (abcde reads as abode). These are redrawn here from the font's own parts, point for point with their weight deltas,
    so they stay open at every weight: C is E without its middle bar, G takes E's upper terminal, and c keeps its
    one-row opening at bold. Accented C, G and c are composites, so they follow. (5, drawn like an S, is redrawn on the
    grid with the other glyphs in src/pixelify-sans.glyphs.)
    """
    glyf, gvar = font["glyf"], font["gvar"]
    E, E_d, axes = _pixelify_masters(font, "E")
    G, G_d, _ = _pixelify_masters(font, "G")
    c, c_d, _ = _pixelify_masters(font, "c")
    n = lambda pts: len(pts) - 4  # outline points, without the four phantom points
    expect = {"E": (E, 24, (161, 359)), "G": (G, 26, (525, 350)), "c": (c, 20, (525, 260))}
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

    # Check the result at both ends of the weight axis: the openings are open.
    for name, empty, ink in (("C", (474, 300), (110, 300)), ("G", (474, 380), (110, 300)), ("c", (474, 220), (110, 220))):
        pts, deltas = redraw[name]
        bold = [(x + dx, y + dy) for (x, y), (dx, dy) in zip(pts, deltas)]
        for label, outline in (("regular", pts), ("bold", bold)):
            if _pixelify_inside(outline, *empty) or not _pixelify_inside(outline, *ink):
                raise GlyphError(f"Pixelify Sans: the patched '{name}' is not right at {label}. Check patch_pixelify.")


# ---------------------------------------------------------------------------------------------------------------
# Pixelify Sans: glyphs drawn on its own grid (src/pixelify-sans.glyphs)


@dataclass
class Redraw:
    key: str                       # its character, or a glyph name
    line: int
    char: str | None = None
    rows: list = field(default_factory=list)
    base: int = 0                  # the row its bottom row sits on: 0 sits on the baseline, -1 is the row below it
    left: int = 0                  # the column its first column sits on: 0 starts after the left side bearing
    lift: int = 0                  # units to raise it by (the period and its family sit 12 units above the rows)
    mark: str | None = None        # a mark: above, below, ogonek (from a letter's last column) or beside
    lean: str = "left"
    parts: list | None = None      # a composition: [(token, (columns, rows) or None)]


def read_redraws(path):
    """Reads src/pixelify-sans.glyphs (the format is at the top of the file), with errors that name the line and the fix."""
    out, seen, cur = [], {}, None
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
            r = Redraw(key=char if char is not None else name, line=n, char=char)
            if r.key in seen:
                _fail(path, n, f"'{tok}' is listed twice (first at line {seen[r.key].line}).", "delete one of the blocks.")
            seen[r.key] = r
            cur = None
            if rest == "=" or rest.startswith("= "):
                r.parts = []
                for t in rest[1:].split():
                    pm = re.fullmatch(r"(.+?)(?:\((-?\d+),(-?\d+)\))?", t)
                    r.parts.append((pm.group(1), (int(pm.group(2)), int(pm.group(3))) if pm.group(2) is not None else None))
                if not r.parts:
                    _fail(path, n, f"'{tok}' is composed of nothing.", "list its parts after '=': '@ Ѐ = Е U+0300'.")
            else:
                for a in rest.split():
                    k, _, v = a.partition("=")
                    if k in ("base", "left", "lift") and re.fullmatch(r"-?\d+", v):
                        setattr(r, k, int(v))
                    elif k == "mark" and v in ("above", "below", "ogonek", "beside"):
                        r.mark = v
                    elif k == "lean" and v in ("left", "right"):
                        r.lean = v
                    else:
                        _fail(path, n, f"'{a}' is not a setting.",
                              "use base=N, left=N, lift=N, mark=above|below|ogonek|beside or lean=left|right.")
                cur = r
            out.append(r)
            continue
        if cur is None:
            _fail(path, n, "a row outside a glyph block.",
                  "start the block with '@ <char>', and keep its rows together, without blank lines.")
        if set(line) - set("X."):
            _fail(path, n, f"row '{line}' may only use 'X' (a pixel) and '.' (empty).", "replace the other characters.")
        if cur.rows and len(line) != len(cur.rows[0]):
            _fail(path, n, f"row is {len(line)} wide; the first row of '{cur.key}' is {len(cur.rows[0])}.",
                  f"make every row of '{cur.key}' the same width.")
        cur.rows.append(line)
    for r in out:
        if r.parts is None and "X" not in "".join(r.rows):
            _fail(path, r.line, f"'{r.key}' has no pixels.", "draw it below its header: 'X' for a pixel, '.' for empty.")
    return out


# Where Pixelify Sans's own letters put their edges (read from E, H, O, z and the rest): a left edge (ink to its
# right) on each column line, and a bottom edge (ink above) on each row line. A right edge sits 10 units right of its
# line and a top edge 10 above (9 on row lines 0 and 4), so a stroke is about 100 units on a 91-unit grid. Column
# line 0 is the left side bearing; row line 0 is the baseline's (letters overshoot it to -12). At the heaviest weight
# each edge moves a fixed amount: strokes thicken by about 28 units across and 41 down, and the grid tightens.
PIXELIFY_COLUMNS = (-122, -31, 60, 151, 241, 333, 423, 515, 606, 696, 787, 878, 969, 1060)  # column lines -2 to 11
PIXELIFY_ROWS = (-284, -193, -103, -12, 78, 169, 260, 350, 440, 530, 621, 711, 802, 892, 983)  # row lines -3 to 11
PIXELIFY_SIDE_BEARING = 61         # after a letter's last column
PIXELIFY_LIFT = 181                # a mark over a capital or a tall letter sits two rows higher than over the x-height
PIXELIFY_MIN_STROKE = 90           # units: one Pixelify pixel is 1000 / 11, so no stroke may be thinner


def _pixelify_x(i, right):
    """The x of a left edge (ink to its right) or a right edge (ink to its left) on column line i, and its bold delta."""
    if not -2 <= i < len(PIXELIFY_COLUMNS) - 2:
        raise GlyphError(f"column line {i} is off Pixelify Sans's grid (-2 to {len(PIXELIFY_COLUMNS) - 3}).")
    x = PIXELIFY_COLUMNS[i + 2] + (10 if right else 0)
    return x, (math.ceil(29.5 - 2.5 * i) if right else math.floor(1 - 2.5 * i))


def _pixelify_y(j, top):
    """The y of a bottom edge (ink above) or a top edge (ink below) on row line j, and its bold delta."""
    if not -3 <= j < len(PIXELIFY_ROWS) - 3:
        raise GlyphError(f"row line {j} is off Pixelify Sans's grid (-3 to {len(PIXELIFY_ROWS) - 4}).")
    y = PIXELIFY_ROWS[j + 3] + ((9 if j in (0, 4) else 10) if top else 0)
    return y, (42 - 5 * j if top else 1 - 5 * j)


def _cells(r):
    """A drawing's pixels as (column, row) on the grid."""
    h = len(r.rows)
    return {(r.left + c, r.base + h - 1 - i) for i, row in enumerate(r.rows) for c, ch in enumerate(row) if ch == "X"}


def _pixelify_contours(cells, lift=0):
    """Pixels on Pixelify Sans's grid -> contours of ((x, y), (bold dx, bold dy)): each corner takes the x of its
    vertical edge and the y of its horizontal edge where the font's letters have them, so a drawn glyph meets its
    neighbours exactly at every weight. Diagonal steps join at their corners, as the font's own do."""
    out = []
    for loop in _loops(cells, join=True):
        # A hole one pixel across (the ring, the eye of @, °) keeps its size at bold, as the patched c keeps its
        # opening: its edges move with the grid instead of growing into it. (A hole runs anticlockwise.)
        area = sum(p[0] * q[1] - q[0] * p[1] for p, q in zip(loop, loop[1:] + loop[:1]))
        small = area > 0 and min(max(p[i] for p in loop) - min(p[i] for p in loop) for i in (0, 1)) == 1
        pts = []
        for k, p in enumerate(loop):
            a, b = loop[k - 1], loop[(k + 1) % len(loop)]
            v0, v1 = (a, p) if a[0] == p[0] else (p, b)   # the vertical edge at this corner, in travel order
            h0, h1 = (a, p) if a[1] == p[1] else (p, b)   # and the horizontal one
            x, dx = _pixelify_x(p[0], right=v1[1] < v0[1])  # going down: ink on its left
            y, dy = _pixelify_y(p[1], top=h1[0] > h0[0])    # going right: ink below
            if small:
                dx, dy = _pixelify_x(p[0], False)[1], _pixelify_y(p[1], False)[1]
            pts.append(((x, y + lift), (dx, dy)))
        out.append(pts)
    return out


class _Pixelify:
    """Edits a Pixelify Sans font: glyphs drawn on its grid, composites placed on it, characters mapped."""

    def __init__(self, font, path):
        self.font, self.path = font, path
        self.glyf, self.gvar, self.hmtx = font["glyf"], font["gvar"], font["hmtx"]
        self.axes = self.gvar.variations["E"][0].axes
        self.marks = {}       # redrawn marks: name -> (kind, anchor column)
        gpos = font["GPOS"].table
        self.mark_lookup = next(lk.SubTable[0] for lk in gpos.LookupList.Lookup if lk.LookupType == 4)

    def cmap(self):
        return self.font.getBestCmap()

    def name_of(self, tok, line):
        """A token's glyph: a character through the cmap, or a glyph name."""
        if len(tok) == 1 or re.fullmatch(r"U\+[0-9A-Fa-f]{4,6}", tok):
            cp = ord(tok) if len(tok) == 1 else int(tok[2:], 16)
            name = self.cmap().get(cp)
            if name is None:
                _fail(self.path, line, f"'{tok}' is not in Pixelify Sans.", "draw it, or compose it, before it is used.")
            return name
        if tok not in self.glyf.glyphs:
            _fail(self.path, line, f"'{tok}' is not a glyph of Pixelify Sans.", "check the glyph name.")
        return tok

    def target(self, r):
        """The glyph a block replaces, or a new one: a glyph that other characters share is never changed in place."""
        if r.char is None:
            return r.key
        cp, cmap = ord(r.char), self.cmap()
        name = cmap.get(cp)
        if name is not None and sum(1 for n in cmap.values() if n == name) == 1:
            return name
        new = agl.UV2AGL.get(cp) or f"uni{cp:04X}"
        while new in self.glyf.glyphs:
            new += ".pp"
        return new

    def map(self, cp, name):
        for t in self.font["cmap"].tables:
            if t.isUnicode() and (t.format != 4 or cp <= 0xFFFF):
                t.cmap[cp] = name

    def add(self, name, glyph, advance, deltas, mark=False):
        new = name not in self.glyf.glyphs
        self.glyf[name] = glyph
        if new:
            self.font.setGlyphOrder(self.glyf.glyphOrder)
            classes = self.font["GDEF"].table.GlyphClassDef.classDefs
            classes[name] = 3 if mark else 1
        glyph.recalcBounds(self.glyf)
        self.hmtx[name] = (advance, getattr(glyph, "xMin", 0))
        self.gvar.variations[name] = [TupleVariation(self.axes, deltas)]

    def bounds(self, name, bold=False):
        pen = BoundsPen(self.font.getGlyphSet(location={"wght": 700} if bold else None))
        self.font.getGlyphSet(location={"wght": 700} if bold else None)[name].draw(pen)
        return pen.bounds

    def advance_delta(self, name):
        tv = self.gvar.variations.get(name)
        ph = tv[0].coordinates[-4:] if tv else [None] * 4
        return ((ph[1] or (0, 0))[0] - (ph[0] or (0, 0))[0])

    # -- drawing --

    def draw(self, r):
        cells = _cells(r)
        contours = _pixelify_contours(cells, r.lift)
        glyph = _simple([[p for p, _ in c] for c in contours])
        width = max(c for c, _ in cells) + 1
        if r.mark:
            advance, adv_delta = 0, 0
        else:
            x, adv_delta = _pixelify_x(width, right=True)
            advance = x + PIXELIFY_SIDE_BEARING
        name = self.target(r)
        self.add(name, glyph, advance, [d for c in contours for _, d in c] + [(0, 0), (adv_delta, 0), (0, 0), (0, 0)],
                 mark=bool(r.mark))
        if r.char is not None:
            self.map(ord(r.char), name)
        if r.mark:
            first, w = min(c for c, _ in cells), width - min(c for c, _ in cells)
            if r.mark == "ogonek":   # it hangs from the letter by the pixel in its top row
                anchor = max(c for c, y in cells if y == max(yy for _, yy in cells))
            elif r.mark == "beside":
                anchor = first
            else:
                anchor = first + (w - 1) // 2 + (1 if w % 2 == 0 and r.lean == "left" else 0)
            self.marks[name] = (r.mark, anchor)
        return name

    # -- placing marks on letters --

    def columns(self, base):
        """A letter's grid: how far it is moved from the font's (v starts 10 units early), how many columns it spans,
        and how tall it is."""
        xmin, _, xmax, ymax = self.bounds(base)
        return xmin - PIXELIFY_COLUMNS[2], max(1, round((xmax - xmin - 10) / 90.8)), ymax

    def middle(self, base, kind):
        """The column a mark centres on: the letter's own anchor where the font has one, else its middle (the left
        one of two); an ogonek hangs from the last column."""
        shift, count, _ = self.columns(base)
        st = self.mark_lookup
        if base in st.BaseCoverage.glyphs:
            cls = {"above": 0, "beside": 1, "below": 2, "ogonek": 3}[kind]
            anchor = st.BaseArray.BaseRecord[st.BaseCoverage.glyphs.index(base)].BaseAnchor[cls]
            if anchor is not None:
                return round((anchor.XCoordinate - shift - 110.5) / 90.8), shift
        return (count - 1 if kind == "ogonek" else (count - 1) // 2), shift

    def offset(self, base, mark, column, shift, lifted):
        """Where a mark goes so that its anchor column sits on the letter's column (or, for a mark the font drew, its
        middle on that column's middle), and how that moves at bold."""
        if mark in self.marks:
            a = self.marks[mark][1]
            dx = shift + _pixelify_x(column, False)[0] - _pixelify_x(a, False)[0]
            bold = _pixelify_x(column, False)[1] - _pixelify_x(a, False)[1]
        else:
            (x0, _, x1, _), (b0, _, b1, _) = self.bounds(mark), self.bounds(mark, bold=True)
            centre = (_pixelify_x(column, False)[0] + _pixelify_x(column + 1, True)[0]) / 2
            centre_bold = (sum(_pixelify_x(column, False)) + sum(_pixelify_x(column + 1, True))) / 2
            dx = round(shift + centre - (x0 + x1) / 2)
            bold = round(centre_bold - centre - ((b0 + b1) - (x0 + x1)) / 2)
        return (dx, PIXELIFY_LIFT if lifted else 0), (bold, -10 if lifted else 0)

    def kind(self, mark):
        if mark in self.marks:
            return self.marks[mark][0]
        st = self.mark_lookup
        if mark in st.MarkCoverage.glyphs:
            cls = st.MarkArray.MarkRecord[st.MarkCoverage.glyphs.index(mark)].Class
            return ("above", "beside", "below", "ogonek")[cls]
        return None

    def compose(self, r):
        parts = [(self.name_of(t, r.line), off) for t, off in r.parts]
        name = self.target(r)
        if any(p == name for p, _ in parts):
            _fail(self.path, r.line, f"'{r.key}' is composed of itself.", "compose it from other glyphs.")
        if len(parts) == 1 and parts[0][1] is None:   # another name for a glyph
            if r.char is None:
                _fail(self.path, r.line, f"'{r.key}' is one part, so it names a glyph, but '{r.key}' is not a character.",
                      "write the character (or U+XXXX) before '='.")
            self.map(ord(r.char), parts[0][0])
            return
        base = parts[0][0] if self.kind(parts[0][0]) is None else None
        comps, deltas = [], []
        for p, off in parts:
            if off is not None:   # placed by hand, in whole columns and rows
                comps.append((p, _pixelify_x(off[0], False)[0] - PIXELIFY_COLUMNS[2], PIXELIFY_ROWS[off[1] + 3] - PIXELIFY_ROWS[3]))
                deltas.append((_pixelify_x(off[0], False)[1] - _pixelify_x(0, False)[1], 5 * -off[1]))
            elif p == base or base is None:
                comps.append((p, 0, 0))
                deltas.append((0, 0))
            else:
                kind = self.kind(p)
                column, shift = self.middle(base, kind)
                (dx, dy), d = self.offset(base, p, column, shift, kind == "above" and self.columns(base)[2] > 500)
                comps.append((p, dx, dy))
                deltas.append(d)
        glyph = _composite(comps, self.glyf.glyphOrder)
        if base is not None and all(off is None for _, off in parts[1:]):
            glyph.components[0].flags = 0x204   # the letter's metrics (ROUND_XY_TO_GRID | USE_MY_METRICS)
            advance, adv_delta = self.hmtx[base][0], self.advance_delta(base)
        else:   # parts placed by hand: as wide as the ink, with the letters' side bearing
            glyph.recalcBounds(self.glyf)
            line = min(range(-2, len(PIXELIFY_COLUMNS) - 2), key=lambda i: abs(_pixelify_x(i, True)[0] - glyph.xMax))
            x, adv_delta = _pixelify_x(line, True)
            advance = x + PIXELIFY_SIDE_BEARING
        self.add(name, glyph, advance, deltas + [(0, 0), (adv_delta, 0), (0, 0), (0, 0)])
        if r.char is not None:
            self.map(ord(r.char), name)

    def replace_marks(self):
        """Every composite the font already has that uses a redrawn mark: the mark moves onto the letter's grid."""
        old = getattr(self, "old_centres", {})
        for name in list(self.glyf.glyphOrder):
            g = self.glyf[name]
            if not g.isComposite() or not any(c.glyphName in self.marks for c in g.components):
                continue
            tv = self.gvar.variations.get(name)
            deltas = list(tv[0].coordinates) if tv else [(0, 0)] * (len(g.components) + 4)
            base = g.components[0].glyphName if g.components[0].glyphName not in self.marks and self.kind(g.components[0].glyphName) is None else None
            for i, c in enumerate(g.components):
                if c.glyphName not in self.marks:
                    continue
                kind = self.marks[c.glyphName][0]
                if base is None:   # a spacing accent: the mark on its own, in place
                    column, shift, lifted = round((c.x + old[c.glyphName] - 110.5) / 90.8), 0, c.y > 90
                else:
                    shift = self.columns(base)[0]
                    column = round((c.x + old[c.glyphName] - shift - 110.5) / 90.8)
                    lifted = kind in ("above", "beside") and c.y > 90
                    if kind == "beside":   # one empty column after the stem it stands beside
                        column = self.last_column(base, c.glyphName) + 2
                (c.x, c.y), deltas[i] = self.offset(base, c.glyphName, column, shift, lifted)
            if tv:
                tv[0].coordinates = [d if d is not None else (0, 0) for d in deltas]
            g.recalcBounds(self.glyf)
            if base is not None and g.xMax + PIXELIFY_SIDE_BEARING > self.hmtx[name][0]:   # room for a mark beside it
                self.hmtx[name] = (g.xMax + PIXELIFY_SIDE_BEARING, g.xMin)
                if tv:
                    line = min(range(-2, len(PIXELIFY_COLUMNS) - 2), key=lambda i: abs(_pixelify_x(i, True)[0] - g.xMax))
                    tv[0].coordinates[-3] = (_pixelify_x(line, True)[1], 0)

    def last_column(self, base, mark):
        """The letter's last inked column (in its own grid) beside where a mark is drawn."""
        shift = self.columns(base)[0]
        polys = _ink(self.font.getGlyphSet(), base)
        ys = [(_pixelify_y(j, False)[0] + _pixelify_y(j + 1, True)[0]) / 2 for j in range(-3, 11)]
        _, m0, _, m1 = self.bounds(mark)
        ends = [e for y in ys if m0 <= y <= m1 for _, e in _runs(polys, True, y)]
        return round((max(ends) - shift - PIXELIFY_COLUMNS[2] - 10) / 90.8) - 1 if ends else 0


def redraw_pixelify(font, path=None):
    """Draws, composes and maps the glyphs listed in src/pixelify-sans.glyphs, then moves every existing accent that
    uses a redrawn mark onto its letter's grid, and rebuilds the advance-width variations to match."""
    path = path or PIXELIFY_GLYPHS
    entries = read_redraws(path)
    px = _Pixelify(font, path)
    # Where each mark's ink was centred before, to keep the side of the letter the font put it on.
    px.old_centres = {}
    for r in entries:
        if r.parts is None and r.mark:
            name = px.target(r)
            if name in px.glyf.glyphs and px.glyf[name].numberOfContours:
                b = px.bounds(name)
                px.old_centres[name] = (b[0] + b[2]) / 2
    for r in entries:
        if r.parts is None:
            try:
                px.draw(r)
            except GlyphError as e:
                _fail(path, r.line, f"'{r.key}': {e}", "move it onto the grid.")
    for name, (kind, a) in px.marks.items():
        px.old_centres.setdefault(name, (_pixelify_x(a, False)[0] + _pixelify_x(a + 1, True)[0]) / 2)
    px.replace_marks()
    for r in entries:
        if r.parts is not None:
            px.compose(r)
    font.setGlyphOrder(px.glyf.glyphOrder)
    add_HVAR(font)
    return px


# ---------------------------------------------------------------------------------------------------------------
# Pixelify Sans: the checks every file must pass


def _lookups_from(table, tags):
    """Every lookup a set of features reaches, through contextual lookups and extensions too: {index: feature}."""
    if table is None or not table.FeatureList:
        return {}

    def called(obj, out):   # the lookups a contextual subtable calls, in whichever format it is
        if isinstance(obj, list):
            for x in obj:
                called(x, out)
        elif hasattr(obj, "__dict__"):
            if hasattr(obj, "SequenceIndex") and hasattr(obj, "LookupListIndex"):
                out.append(obj.LookupListIndex)
            for v in vars(obj).values():
                called(v, out)
        return out

    todo = [(i, fr.FeatureTag) for fr in table.FeatureList.FeatureRecord if fr.FeatureTag in tags
            for i in fr.Feature.LookupListIndex]
    seen = {}
    while todo:
        i, tag = todo.pop()
        if i not in seen:
            seen[i] = tag
            todo += [(j, tag) for st in table.LookupList.Lookup[i].SubTable for j in called(st, [])]
    return seen


def _ink(glyphset, name):
    """A glyph's outline, components resolved, as closed polygons of (x, y)."""
    pen = DecomposingRecordingPen(glyphset)
    glyphset[name].draw(pen)
    out, cur = [], None
    for op, args in pen.value:
        if op == "moveTo":
            cur = [args[0]]
            out.append(cur)
        elif op in ("lineTo", "qCurveTo", "curveTo"):
            cur.extend(args)
    return [[(float(x), float(y)) for x, y in p] for p in out if len(p) > 2]


def _winding(polys, px, py):
    w = 0
    for poly in polys:
        for (x1, y1), (x2, y2) in zip(poly, poly[1:] + poly[:1]):
            side = (x2 - x1) * (py - y1) - (px - x1) * (y2 - y1)
            if y1 <= py < y2 and side > 0:
                w += 1
            elif y2 <= py < y1 and side < 0:
                w -= 1
    return w


def _runs(polys, horizontal, at):
    """The ink along one line (nonzero rule): its runs as (start, end)."""
    a, o = (1, 0) if horizontal else (0, 1)
    cross = []
    for poly in polys:
        for p, q in zip(poly, poly[1:] + poly[:1]):
            if (p[a] <= at < q[a]) or (q[a] <= at < p[a]):
                t = (at - p[a]) / (q[a] - p[a])
                cross.append((p[o] + t * (q[o] - p[o]), 1 if q[a] > p[a] else -1))
    out, w, start = [], 0, None
    for pos, d in sorted(cross):
        if w == 0:
            start = pos
        w += d
        if w == 0 and (not out or start > out[-1][1] + 1e-6):
            out.append((start, pos))
        elif w == 0:
            out[-1] = (out[-1][0], pos)
    return out


def thinnest_stroke(polys):
    """How wide the outline's thinnest stroke is, in units. Every horizontal and vertical line through the ink is cut
    into runs; a pixel outline changes only at its corners, so one line through each band between two corners measures
    it exactly. A slanted edge is measured square to itself instead, from three points along it."""
    best = math.inf
    for horizontal in (True, False):
        k = 1 if horizontal else 0
        cs = sorted({p[k] for poly in polys for p in poly})
        for lo, hi in zip(cs, cs[1:]):
            for s, e in _runs(polys, horizontal, (lo + hi) / 2):
                best = min(best, e - s)
    for poly in polys:
        for (x1, y1), (x2, y2) in zip(poly, poly[1:] + poly[:1]):
            if x1 == x2 or y1 == y2:
                continue
            length = math.hypot(x2 - x1, y2 - y1)
            nx, ny = (y2 - y1) / length, (x1 - x2) / length   # into the ink: clockwise outlines have ink on the right
            for t in (1 / 3, 1 / 2, 2 / 3):
                ox, oy = x1 + (x2 - x1) * t + nx * 1e-3, y1 + (y2 - y1) * t + ny * 1e-3
                hits = []
                for qpoly in polys:
                    for (a1, b1), (a2, b2) in zip(qpoly, qpoly[1:] + qpoly[:1]):
                        den = nx * (b2 - b1) - ny * (a2 - a1)
                        if abs(den) < 1e-12:
                            continue
                        d = ((a1 - ox) * (b2 - b1) - (b1 - oy) * (a2 - a1)) / den
                        u = ((a1 - ox) * ny - (b1 - oy) * nx) / den
                        if d > 1e-6 and -1e-9 <= u <= 1 + 1e-9:
                            hits.append(d)
                for d in sorted(hits):
                    if _winding(polys, ox + nx * (d + 0.01), oy + ny * (d + 0.01)) == 0:
                        best = min(best, d)
                        break
    return best


# The features a browser applies to Latin, Cyrillic and Greek text without being asked.
DEFAULT_FEATURES = ("ccmp", "locl", "rlig", "rclt", "calt", "clig", "liga", "rvrn")
# Glyphs allowed a stroke thinner than one pixel, and why. Keep it empty if at all possible.
THIN_ALLOWED = {}


def check_pixelify(font, label):
    """What is wrong with a Pixelify Sans file, as messages: a ligature a browser applies by default (Pixelify's fi
    and fl read as "A"), or a stroke thinner than one of the font's pixels, at regular or bold (a line that fine draws
    as a grey smudge at text sizes: its @ read as a dot and © as °)."""
    problems = []
    cmap = font.getBestCmap() or {}
    chars = {}
    for cp, n in cmap.items():
        chars.setdefault(n, chr(cp))
    gsub = font["GSUB"].table if "GSUB" in font else None
    for i, tag in sorted(_lookups_from(gsub, DEFAULT_FEATURES).items()):
        lk = gsub.LookupList.Lookup[i]
        for st in lk.SubTable:
            st = getattr(st, "ExtSubTable", st)
            if getattr(st, "LookupType", lk.LookupType) == 4:
                runs = ["".join(chars.get(g, f"[{g}]") for g in [first, *lig.Component]) for first, ligs in sorted(st.ligatures.items()) for lig in ligs]
                problems.append(f"{label}: '{tag}' draws {', '.join(runs[:4])}{' …' if len(runs) > 4 else ''} as one glyph each, "
                                "and browsers apply it by default. Fix: leave the feature out (PIXELIFY_FEATURES in scripts/build.py).")
    locations = [("regular", None)] + ([("bold", {"wght": 700})] if "fvar" in font else [])
    for weight, location in locations:
        gs = font.getGlyphSet(location=location)
        for name in font.getGlyphOrder():
            if name == ".notdef" or name in THIN_ALLOWED:
                continue
            polys = _ink(gs, name)
            if polys:
                w = thinnest_stroke(polys)
                if w < PIXELIFY_MIN_STROKE:
                    shown = f"'{chars[name]}' ({name})" if name in chars else f"'{name}'"
                    problems.append(f"{label}: {shown} has a stroke {w:.0f} units wide at {weight}, thinner than one of the "
                                    f"font's pixels ({PIXELIFY_MIN_STROKE}). Fix: draw it on the grid in src/pixelify-sans.glyphs.")
    return problems


# ---------------------------------------------------------------------------------------------------------------
# Pixelify Sans: the build


def build_pixelify():
    outs = [os.path.join(DIST, f) for f, _, _ in PIXELIFY_FACES]
    if not os.path.exists(PIXELIFY_SRC):
        msg = (f"Pixelify Sans: the source font is missing ({PIXELIFY_SRC}). Fix: download PixelifySans[wght].ttf from "
               "https://github.com/google/fonts/tree/main/ofl/pixelifysans and set PIXELIFY_SANS to its path.")
        if not all(os.path.exists(o) for o in outs):
            sys.exit(msg)
        print(msg + " Kept the existing files.")
        return
    font = TTFont(PIXELIFY_SRC, recalcTimestamp=False)
    try:
        patch_pixelify(font)
        redraw_pixelify(font)
    except GlyphError as e:
        sys.exit(f"Pixelify Sans: {e}")
    for record in font["name"].names:
        if record.nameID == 5:
            record.string = f"{record.toUnicode()}; Blip: {PIXELIFY_CHANGES}"
    patched = io.BytesIO()
    font.save(patched)

    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = PIXELIFY_FEATURES
    opts.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
    opts.notdef_outline = True
    opts.recalc_timestamp = False
    problems, report = [], []
    for (file, label, ranges), out in zip(PIXELIFY_FACES, outs):
        face = TTFont(io.BytesIO(patched.getvalue()), recalcTimestamp=False)
        sub = subset.Subsetter(opts)
        sub.populate(unicodes=[cp for a, b in ranges for cp in range(a, b + 1)])
        sub.subset(face)
        face["head"].created = face["head"].modified = _epoch()
        subset.save_font(face, out, opts)
        problems += check_pixelify(TTFont(out), f"Pixelify Sans {label} ({file})")
        report.append(f"  {os.path.relpath(out, REPO):38} {os.path.getsize(out):>6} B  {label}, {len(face.getBestCmap())} characters")
    axes = ", ".join(f"{a.axisTag} {a.minValue:g} to {a.maxValue:g}" for a in font["fvar"].axes)
    print(f"Pixelify Sans: {axes}, no default ligatures, no stroke under {PIXELIFY_MIN_STROKE} units\n" + "\n".join(report))
    if problems:
        sys.exit("\n".join(problems))


def main():
    if sys.argv[1:2] == ["--check"]:
        problems = [p for path in sys.argv[2:] for p in check_pixelify(TTFont(path), os.path.basename(path))]
        print("\n".join(problems) if problems else f"{len(sys.argv) - 2} file(s): no default ligatures, no thin strokes.")
        sys.exit(1 if problems else 0)
    try:
        glyphs = load(SRC)
    except GlyphError as e:
        sys.exit(f"Pixel Bop: {e}")
    build_pixel_bop(glyphs)
    write_tables(glyphs)
    build_pixelify()
    write_css()


if __name__ == "__main__":
    main()
