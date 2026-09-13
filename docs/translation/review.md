# Reviewing a chapter

The checker has already run in CI. It covers what can be checked mechanically, so a review
spends its attention on what cannot.

## The checker covers

Footnote and figure parity, cross-chapter link targets and title agreement, filename
pairing, length bands, and glossary conformance (as warnings).

## A reviewer covers

- **Did simplification lose an argument?** Compare against `contents/english/`. A missing
  clause reads fine and is invisible to the checker.
- **Does the Norwegian sound written rather than translated?** Read a few paragraphs aloud.
- **Are glossary warnings right or wrong?** Each one is a judgement call the checker
  deliberately refused to make. English inside a quotation or a proper name is correct;
  English in running prose usually is not.
- **Do proposed terms belong in the glossary?** Check `translation/proposals/` on the branch.

## Merging a wave

After a batch of chapters lands:

```bash
vp run translation:progress   # regenerate translation/progress.tsv
vp run translation:next       # see what is now unblocked
```

Fold `translation/proposals/*.tsv` into `translation/glossary.tsv`, clear the proposal
files, and commit that as its own maintainer change.
