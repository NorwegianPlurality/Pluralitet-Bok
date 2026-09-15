#!/usr/bin/env python3
"""Build the Norwegian front cover from upstream's English one.

Upstream ships its covers as flattened rasters with no embedded fonts and no source
file, so a Norwegian cover cannot be "re-exported" — it has to be rebuilt. This script
rebuilds it the conservative way: everything that is upstream's artwork is copied out
of `scripts/cover-image.png` pixel-for-pixel, and only what is actually language is
re-set.

    copied verbatim   the ⿻ mark with 數位 inside it, and the small ⿻ in the byline
    redrawn           the wordmark, PLURALITY → PLURALITET, from design/logo-dark-h-nb.svg
    re-typeset        the subtitle and the byline, in Norwegian

Layout — page size, the mark's box, the wordmark's cap height, every baseline and the
line pitch — is measured off the English cover rather than chosen, so the two editions
stack as one series. The one place the Norwegian departs is the wordmark's width: it
keeps the English cap height, and PLURALITET is one letter longer than PLURALITY, so
it runs wider and the side margins come in from 1011px to about 820px.

Type: upstream's geometric sans is not embedded anywhere in the repository and could
not be identified, so it is substituted. URW Gothic Book is the closest match among
the fonts that ship with a standard Linux text stack — same geometric skeleton, near-
circular O, pointed N — fitted here by cap height rather than by nominal point size.
Per-letter widths agree with upstream's to within about 4%. If the real face is ever
identified, change FONT and nothing else here needs to move.

    vp run design:cover:nb

Requires inkscape (to render the wordmark) and Pillow. Writes scripts/cover-image.nb.png
at 5100×6600 and scripts/cover-image.nb.pdf, matching upstream's pair for `en`.
"""

import os
import re
import subprocess
import sys
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE_COVER = os.path.join(ROOT, 'scripts', 'cover-image.png')
WORDMARK_SVG = os.path.join(ROOT, 'design', 'logo-dark-h-nb.svg')
OUT_PNG = os.path.join(ROOT, 'scripts', 'cover-image.nb.png')
OUT_PDF = os.path.join(ROOT, 'scripts', 'cover-image.nb.pdf')
WORK = os.path.join(ROOT, 'dist', 'design')

FONT = '/usr/share/fonts/opentype/urw-base35/URWGothic-Book.otf'

PAGE = (5100, 6600)
BACKGROUND = (34, 34, 34)
INK = (255, 255, 255)

# Boxes measured off scripts/cover-image.png. Left/top inclusive, right/bottom exclusive.
MARK_BOX = (1850, 618, 3234, 2007)          # the ⿻ mark with 數位 inside it
BYLINE_MARK_BOX = (2050, 5897, 2196, 6042)  # the small ⿻ in "& ⿻ COMMUNITY"
WORDMARK_TOP, WORDMARK_HEIGHT = 2596, 304   # cap box of PLURALITY

SUBTITLE_CAP = 138                           # flat-cap height, "T" of "THE"
SUBTITLE_TOPS = (3528, 3784, 4040)           # cap tops, pitch 256
SUBTITLE = ('FREMTIDEN TIL', 'SAMARBEIDSTEKNOLOGI', 'OG DEMOKRATI')

BYLINE_CAP = 122                             # flat-cap height, "E" of "E. GLEN"
BYLINE_BASELINES = (5796, 6033)              # pitch 237
BYLINE_1 = 'E. GLEN WEYL, AUDREY TANG'
# The second line is text, then upstream's ⿻ glyph, then text. `None` is the glyph, and
# the numbers are the gaps around it: 45px matches the English cover's "& ⿻ COMMUNITY",
# and the hyphen closes up against the mark because ⿻-fellesskapet is one compound word.
BYLINE_2 = ('OG', 45, None, 0, '-FELLESSKAPET')

# The wordmark's cap box inside design/logo-dark-h-nb.svg, in that file's own units.
# Everything left of x=175.704 is the mark and the 數位 calligraphy, which the cover
# draws separately and at a different size.
WORDMARK_VIEW = (175.704, 11.5328, 436.691, 34.4648)


def fitted_font(cap_height: int) -> ImageFont.FreeTypeFont:
    """The font size whose flat-cap height is `cap_height` pixels.

    Fitted by rendering rather than read off the font's metrics, because the cover was
    measured the same way — ink, not nominal size — and the two have to agree.
    """
    if not os.path.exists(FONT):
        sys.exit(f'{FONT} not found. On Debian/Ubuntu: apt install fonts-urw-base35')
    for size in range(100, 400):
        font = ImageFont.truetype(FONT, size)
        probe = Image.new('L', (600, 600), 0)
        ImageDraw.Draw(probe).text((100, 100), 'T', 255, font=font)
        box = probe.getbbox()
        if box and box[3] - box[1] >= cap_height:
            return font
    sys.exit(f'no size of {FONT} reaches a cap height of {cap_height}px')


def render_text(text: str, font: ImageFont.FreeTypeFont) -> Image.Image:
    """`text` as a tight white-on-transparent image, trimmed to its ink."""
    canvas = Image.new('RGBA', (9000, 900), (0, 0, 0, 0))
    ImageDraw.Draw(canvas).text((200, 200), text, INK + (255,), font=font)
    return canvas.crop(canvas.getbbox())


def render_wordmark(width: int, height: int) -> Image.Image:
    """PLURALITET, rendered from the SVG at the size the cover needs.

    The SVG holds the whole horizontal lockup, so it is first narrowed to the wordmark's
    own cap box — the cover draws the ⿻ mark itself, much larger and further up.
    """
    svg = open(WORDMARK_SVG, encoding='utf-8').read()
    x0, y0, x1, y1 = WORDMARK_VIEW
    svg = re.sub(
        r'width="[^"]*" height="[^"]*" viewBox="[^"]*"',
        f'width="{x1 - x0}" height="{y1 - y0}" viewBox="{x0} {y0} {x1 - x0} {y1 - y0}"',
        svg, count=1)
    os.makedirs(WORK, exist_ok=True)
    cropped = os.path.join(WORK, 'wordmark-nb.svg')
    rendered = os.path.join(WORK, 'wordmark-nb.png')
    open(cropped, 'w', encoding='utf-8').write(svg)
    subprocess.run(['inkscape', cropped, '-o', rendered, '-w', str(width), '-h', str(height)],
                   check=True, capture_output=True)
    return Image.open(rendered).convert('RGBA')


def main() -> None:
    source = Image.open(SOURCE_COVER).convert('RGB')
    if source.size != PAGE:
        sys.exit(f'{SOURCE_COVER} is {source.size}, expected {PAGE} — the measured boxes no longer apply')

    cover = Image.new('RGB', PAGE, BACKGROUND)

    # Upstream's artwork, copied rather than redrawn.
    cover.paste(source.crop(MARK_BOX), (MARK_BOX[0], MARK_BOX[1]))

    # The wordmark keeps the English cap height, so it runs wider by one letter.
    scale = WORDMARK_HEIGHT / (WORDMARK_VIEW[3] - WORDMARK_VIEW[1])
    wordmark = render_wordmark(round((WORDMARK_VIEW[2] - WORDMARK_VIEW[0]) * scale), WORDMARK_HEIGHT)
    cover.paste(wordmark, ((PAGE[0] - wordmark.size[0]) // 2, WORDMARK_TOP), wordmark)

    subtitle_font = fitted_font(SUBTITLE_CAP)
    for line, top in zip(SUBTITLE, SUBTITLE_TOPS):
        ink = render_text(line, subtitle_font)
        cover.paste(ink, ((PAGE[0] - ink.size[0]) // 2, top), ink)

    byline_font = fitted_font(BYLINE_CAP)
    first = render_text(BYLINE_1, byline_font)
    cover.paste(first, ((PAGE[0] - first.size[0]) // 2, BYLINE_BASELINES[0] - BYLINE_CAP), first)

    # The ⿻ glyph is taller than the caps and sits slightly low; both offsets are the
    # English cover's, so the mark lands on the line exactly where upstream puts it.
    mark = source.crop(BYLINE_MARK_BOX)
    mark_top = BYLINE_BASELINES[1] + (BYLINE_MARK_BOX[1] - BYLINE_BASELINES[1])
    pieces = [part if isinstance(part, int)
              else mark if part is None
              else render_text(part, byline_font)
              for part in BYLINE_2]
    total = sum(p if isinstance(p, int) else p.size[0] for p in pieces)
    x = (PAGE[0] - total) // 2
    for piece, part in zip(pieces, BYLINE_2):
        if isinstance(piece, int):
            x += piece
            continue
        cover.paste(piece, (x, mark_top if part is None else BYLINE_BASELINES[1] - BYLINE_CAP),
                    piece if piece.mode == 'RGBA' else None)
        x += piece.size[0]

    cover.save(OUT_PNG)
    cover.save(OUT_PDF, 'PDF', resolution=600.0)
    print(f'wrote {os.path.relpath(OUT_PNG, ROOT)} and {os.path.relpath(OUT_PDF, ROOT)}')


if __name__ == '__main__':
    main()
