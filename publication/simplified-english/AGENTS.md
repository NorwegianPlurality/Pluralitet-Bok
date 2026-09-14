# Working on the simplified-English edition

**Not on this branch.** `simplify` is generated.

It is a publication branch — a snapshot of the simplified-English edition, rebuilt from
the `norwegian` branch with the Norwegian layer removed, in the same sense that a `dist`
or `gh-pages` branch is output rather than a place people commit. Any commit made here is
discarded by the next rebuild, silently and without a conflict to warn you.

This file is the whole of the guidance for this branch. `CLAUDE.md`, `.cursor/rules/`,
`.continue/rules/` and `.github/copilot-instructions.md` are one-line pointers to it, so
every tool lands here and gets the same answer.

## Where the work is

All of it happens on `norwegian`, which carries this layer and the Norwegian translation
made from it:

```bash
git switch norwegian
```

The instructions there are the single source of truth for both stages, including stage 1 —
the simplify stage that produces `contents/simplified-english/`. Stage 1 work does **not**
come to this branch; it goes to a `simplify/<chapter-id>` branch cut from `norwegian` and
merges back into it.

## What is on this branch, and why it looks the way it does

The tooling, tests, registries and stage documentation are carried over whole, so the
snapshot can be verified on its own:

```bash
vp run check
```

`scripts/book/validate-translation.ts` needs no flag to run here. With no
`contents/norwegian/` directory it runs the simplify-stage checks — footnote and figure
parity against `contents/english/`, the length band, glossary term survival — and skips
the translate, glossary-conformance and cross-reference checks, which have no output layer
to read.

Two things will look out of place, and both are deliberate:

- `translation/chapter-titles.tsv` carries a Norwegian title for every chapter, and
  `translation/glossary.tsv` a Norwegian term for many. They are shared registries, kept
  whole rather than forked, and nothing on this branch reads the Norwegian columns.
- `docs/translation/translate.md` and the Norwegian half of `docs/translation/review.md`
  describe a stage whose output is not here. They are kept because the simplified English
  is written to be translated from, and a contributor needs to see what the next stage
  will ask of it.

## Rebuilding

From a checkout of `norwegian`, with a clean working tree:

```bash
vp run translation:rebuild-simplify
```

That is the only supported way this branch changes.
