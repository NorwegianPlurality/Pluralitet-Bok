# Term proposals

A chapter in progress that needs a term not yet in `../glossary.tsv` adds it here, in a
file named after the chapter id — `5-4.tsv` for chapter 5-4. One file per chapter means
parallel branches never write the same path, so these never conflict on merge.

Same columns as the glossary, no header:

    en_term<TAB>no_term<TAB>policy<TAB>family<TAB>first_use<TAB>note

`policy` is `translate`, `keep` or `gloss`. Use `todo` with an empty `no_term` to flag a
term you could not settle.

Between waves a maintainer folds these into `../glossary.tsv` and clears the files. Do not
edit `glossary.tsv` from a chapter branch.
