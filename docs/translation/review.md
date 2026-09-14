# Reviewing a chapter

The checker has already run in CI. It covers what can be checked mechanically, so a review
spends its attention on what cannot.

## The checker covers

Footnote and figure parity, cross-chapter link targets and title agreement, filename
pairing, length bands, glossary term survival through stage 1, and glossary conformance in
the Norwegian (the last two as warnings).

Note what the length band now means. Neither stage compresses: both adapt the text to the
same reader, so the bands sit around parity. A chapter well below the band lost a passage;
a chapter well above it may have started adding material of its own.

## A reviewer covers

- **Did simplification lose an argument?** Compare against `contents/english/`. A missing
  clause reads fine and is invisible to the checker.
- **Did simplification actually reach the reader?** This is the question the stage exists
  for, and no check can ask it. Is every unfamiliar person placed in a line (R4)? Does each
  technical term arrive after the phenomenon it names, not before (R1)? A chapter can pass
  every mechanical check and still be written for the reader the original had.
- **Did it add rather than adapt?** Writing out an assumption is the job. A new fact, a new
  example, or a Norwegian parallel in the chapter text is not (R9).
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
