# Rendered output

This directory holds the Vivliostyle theme (`book.css`) and the build config
(`vivliostyle.config.mjs`) the renderer is invoked with. The books themselves are
written to `dist/publication/`, which is not checked in.

Which editions exist, which branch carries each, and how to build one is
`docs/translation/editions.md`. This note is only about the files that come out
the other end, and why they are not all named the same way.

## Where a render lands

```
dist/publication/
├── manifest.json                                   release metadata, upstream's
├── en/
│   ├── Plurality-english.md                        assembled manuscript
│   └── Plurality-english_ch-1.pdf                  one chapter, for review
├── en-simple/
│   ├── Plurality-simplified-english.md
│   ├── Plurality-simplified-english.pdf            the edition's own book
│   └── Plurality-simplified-english_ch-1.pdf       one chapter, for review
├── nb/
│   ├── Plurality-norwegian.md
│   ├── Plurality-norwegian.pdf
│   └── Plurality-norwegian_ch-1.pdf
├── legacy/
│   ├── Plurality-english.pdf                       upstream's release assets
│   └── Plurality-traditional-mandarin.pdf
└── candidate/
    ├── vivliostyle-en-candidate.pdf                upstream's renderer trial
    └── vivliostyle-zh-TW-candidate.pdf
```

Every PDF has an EPUB beside it, built in the same pass and omitted above.

## Why two naming schemes

`legacy/` and `candidate/` are upstream's, and they are two *renderers* rather
than two editions — the same book, typeset twice:

- **`legacy/`** is the pandoc → XeTeX → pdftk pipeline that has shipped since
  February 2024, run inside the `audreyt/pandoc-plurality-book` image. These
  four files are upstream's release assets, and their names have been public
  download links for that long.
- **`candidate/`** is Vivliostyle, being evaluated as a replacement. "Candidate"
  is the release-engineering sense: a proposed successor that has not been
  promoted. `validate-candidate.ts` fails the build if a candidate path ever
  equals a legacy path, so the unpromoted renderer's output cannot be released
  by mistake.

None of that describes this fork's editions. Vivliostyle is not a candidate for
`en-simple` or `nb` — it is the only renderer they have, because the legacy path
needs Docker, pandoc and xelatex. Calling their output "candidate" would name a
choice that was never offered, and `vivliostyle-nb-ch1-candidate.pdf` spends
three of its four words on the renderer while burying the two facts a reviewer
needs: which edition, and which chapter.

So the fork's books, and every chapter excerpt in any edition, are named after
the edition and written beside its manuscript:

    Plurality-norwegian_ch-1.pdf     in  dist/publication/nb/

Excerpts follow the same rule for upstream's editions too. An excerpt is this
fork's own invention — upstream has no name for one — and a reviewer holding
chapter 1 in three editions at once needs the three files to be tellable apart.
Only upstream's *full-book* renders keep upstream's names, because
`manifest.json`, `validate-candidate.ts` and upstream's release workflow all
resolve those paths exactly.

The rule is `editionOutput()` in `scripts/book/build.ts`, which is the one place
it is decided; `vivliostyle.config.mjs` is handed the result rather than
recomputing it. A new fork edition registered per `docs/translation/editions.md`
inherits the naming with no change here.

## Before renaming upstream's outputs

They are load-bearing in five files that must agree, and CI fails if they drift:
`scripts/book/manifest.ts` (the paths written into `manifest.json`),
`scripts/book/build.ts` (`filePrefix`, which must match `manuscriptPath`),
`scripts/book/render-legacy.ts`, `publication/vivliostyle.config.mjs` and
`.github/workflows/main.yml` — both its release `artifacts:` list and the
`EXPECTED_NAMES` assertion. `tests/book-build.test.ts` pins them throughout.
`scripts/make-book.pl` and `scripts/make-book-zh-tw.pl` are the pre-TypeScript
manual scripts; nothing invokes them, but they write the same names.

Two traps if you do: GitHub Releases rewrites spaces in asset names to dots, so
`Plurality by A. Tang et al.pdf` is served as `Plurality.by.A..Tang.et.al.pdf`;
and `manifest.json` is itself a release asset, so the paths inside it are part
of the public interface. The book's credited author order is E. Glen Weyl,
Audrey Tang and ⿻ Community.
