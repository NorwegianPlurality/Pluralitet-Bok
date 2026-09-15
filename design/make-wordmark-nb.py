#!/usr/bin/env python3
"""Build the Norwegian horizontal lockup from upstream's English one.

The wordmark in logo-dark-h.svg is outlined paths on a pixel grid, not text: unit
u = 3.276, cap height 7u, a constant 14.076 gap between letters, and the nine letters
merged into one path per palette colour. This script takes it apart into letters,
swaps the tail, recolours, and puts it back together — so the colour scheme below is
data you can edit, not geometry you have to redraw.

Everything left of the wordmark — the ⿻ mark and the 數位 calligraphy — is copied
through untouched.

    vp run design:wordmark:nb

PLURALITY and PLURALITET share their first eight letters, so those outlines are
upstream's. The tail changes: the Y is dropped, an E takes its slot, and a second T
closes the word. Upstream's face has no E anywhere, so that glyph is drawn here.

On the colours. Upstream's nine letters are a palindrome — red, orange, green, cyan,
white, cyan, green, orange, red — mirrored about the white A at the centre. Ten letters
have no single centre, so that mirror cannot carry over without inventing a two-letter
centre, and the Norwegian does not try: it runs the same five colours as a plain
repeating cycle, left to right. Ten letters is exactly two turns of a five-colour
palette, so the cycle closes on the final letter instead of being cut off mid-ramp,
and letters one through five still match the English exactly.
"""

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, 'design', 'logo-dark-h.svg')
OUT = os.path.join(ROOT, 'design', 'logo-dark-h-nb.svg')

U = 3.276                      # grid unit
GAP = 14.076                   # gap between letters
TOP, BOTTOM = 11.5328, 34.4648  # cap height, 7u
WORDMARK_LEFT = 175.704        # everything left of this is the mark and the calligraphy

RED, AMBER, GREEN, CYAN, WHITE = '#D64933', '#FBB03B', '#0C7C59', '#0EB1D2', 'white'

# The palette cycling left to right, twice over ten letters.
PALETTE = [RED, AMBER, GREEN, CYAN, WHITE]
COLOURS = [PALETTE[i % len(PALETTE)] for i in range(10)]

# Upstream's letters, keyed by where each starts on the baseline. The Y at 393.131 is
# deliberately absent: PLURALITET does not use it.
LETTERS = ['P', 'L', 'U', 'R', 'A', 'L', 'I', 'T']


def glyph_e(x0: float) -> str:
    """An E, 4u wide, stem 1u, arms at rows 1, 4 and 7, the middle arm 3u.

    Upstream's face has no E in PLURALITY, 數位 or 多元宇宙, so there is nothing to
    copy and this outline is new. The proportions are the L's: same stem, same arm
    depth, same 4u width.
    """
    x = lambda n: round(x0 + n * U, 4)
    y = lambda n: round(TOP + n * U, 4)
    return (f'M{x(0)} {TOP}H{x(4)}V{y(1)}H{x(1)}V{y(3)}H{x(3)}V{y(4)}'
            f'H{x(1)}V{y(6)}H{x(4)}V{BOTTOM}H{x(0)}Z')


def shift_x(d: str, dx: float) -> str:
    """Move a rectilinear subpath sideways. H carries an x, V carries a y, M carries both."""
    tokens = re.findall(r'[MHVZ]|-?\d+\.?\d*', d)
    out, i = '', 0
    while i < len(tokens):
        cmd = tokens[i]
        if cmd == 'M':
            out += f'M{round(float(tokens[i + 1]) + dx, 4)} {tokens[i + 2]}'
            i += 3
        elif cmd == 'H':
            out += f'H{round(float(tokens[i + 1]) + dx, 4)}'
            i += 2
        elif cmd == 'V':
            out += f'V{tokens[i + 1]}'
            i += 2
        else:
            out += cmd
            i += 1
    return out


def subpath_extent(sub: str) -> tuple[float, float]:
    xs = [float(v) for v in re.findall(r'[MH](-?\d+\.?\d*)', sub)]
    return min(xs), max(xs)


def main() -> None:
    source = open(SOURCE, encoding='utf-8').read()
    paths = re.findall(r'<path d="([^"]+)" fill="([^"]+)"/>', source)

    # Split the wordmark's colour-grouped paths back into letters. A letter is a run of
    # subpaths whose x-extents overlap; upstream's letter gap of 14.076 is far wider
    # than any gap inside a glyph, so clustering on that is unambiguous.
    pieces: list[tuple[float, float, str]] = []
    for d, _ in paths:
        if subpath_extent(d)[0] < WORDMARK_LEFT:
            continue                                   # the ⿻ mark and the calligraphy
        for index, part in enumerate(d.split('ZM')):
            sub = ('M' + part if index else part).rstrip('Z') + 'Z'
            lo, hi = subpath_extent(sub)
            pieces.append((lo, hi, sub))
    pieces.sort()

    glyphs: list[tuple[float, float, list[str]]] = []
    for lo, hi, sub in pieces:
        if glyphs and lo < glyphs[-1][1] + GAP / 2:
            left, right, subs = glyphs[-1]
            glyphs[-1] = (left, max(right, hi), subs + [sub])
        else:
            glyphs.append((lo, hi, [sub]))

    ordered = list(zip(LETTERS + ['Y'], glyphs))
    if len(ordered) != 9:
        sys.exit(f'expected 9 letters in {SOURCE}, clustered {len(ordered)}')

    # PLURALITET: upstream's first eight, then a new E, then upstream's T moved along.
    word: list[list[str]] = [subs for _, (_, _, subs) in ordered[:8]]
    cursor = ordered[7][1][1] + GAP                    # right edge of the T, plus the gap
    word.append([glyph_e(cursor) + 'Z'])
    cursor += 4 * U + GAP
    t_left, t_right, t_subs = ordered[7][1]
    word.append([shift_x(sub, cursor - t_left) for sub in t_subs])
    right_edge = cursor + (t_right - t_left)

    if len(word) != len(COLOURS):
        sys.exit(f'{len(word)} letters but {len(COLOURS)} colours')

    # Regroup by colour, the way upstream stores it.
    grouped: dict[str, list[str]] = {}
    for subs, colour in zip(word, COLOURS):
        grouped.setdefault(colour, []).extend(subs)

    kept = [f'<path d="{d}" fill="{f}"/>' for d, f in paths if subpath_extent(d)[0] < WORDMARK_LEFT]
    emitted = [f'<path d="{"".join(subs)}" fill="{colour}"/>' for colour, subs in grouped.items()]

    width = round(right_edge + (410 - 406.235))        # upstream's right margin, preserved
    header = re.search(r'<svg[^>]*>', source).group(0)
    header = re.sub(r'width="[^"]*" height="[^"]*" viewBox="[^"]*"',
                    f'width="{width}" height="51" viewBox="0 0 {width} 51"', header)

    note = (f'<!--\n  Generated by design/make-wordmark-nb.py from logo-dark-h.svg. Do not hand-edit:\n'
            f'  rerun `vp run design:wordmark:nb` instead, and see that script for how the\n'
            f'  letters are taken apart and where the colours come from.\n'
            f'\n  PLURALITET, {len(word)} letters, the {len(PALETTE)}-colour palette cycling left to\n'
            f'  right and closing exactly on the last letter. Lockup width {width}, up from 410.\n-->\n')

    open(OUT, 'w', encoding='utf-8').write(note + header + '\n' + '\n'.join(kept + emitted) + '\n</svg>\n')
    print(f'wrote {os.path.relpath(OUT, ROOT)}  width {width}')
    print('  ' + '  '.join(f'{c}={col}' for c, col in zip('PLURALITET', COLOURS)))


if __name__ == '__main__':
    main()
