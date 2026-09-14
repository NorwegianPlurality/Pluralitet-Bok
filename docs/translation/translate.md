# Stage 2 — Translate

Turn a chapter of `contents/simplified-english/` into Norwegian Bokmål in
`contents/norwegian/`, under the same filename.

## Branch and scope

    git switch -c translate/3-2

Change exactly one file: `contents/norwegian/3-2-connected-society.md`. You may also add
terms to `translation/proposals/3-2.tsv`.

## Before you start

Read [`audience.md`](audience.md) once, and your chapter's note under
`audience/`. The reader is the same one stage 1 wrote for — the same
demographic, now in her own country. Stage 1 adapted the text to her education and her
vocabulary; this stage adapts it to her language, and explains the terms that have no
Norwegian equivalent at all. Rules R2, R3, R5, R6, R8 and R9 are the ones that bite here.

Read the chapter's row in `translation/chapter-titles.tsv` — the Norwegian `#` heading must
be exactly the `no_title` registered there. Other chapters link to yours using that title,
sometimes before your chapter exists.

## Terminology

`translation/glossary.tsv` decides terms. The `policy` column means:

| policy | what to do |
| --- | --- |
| `translate` | use the Norwegian in `no_term` |
| `keep` | leave the English as written |
| `gloss` | keep the English and add the Norwegian in parentheses at first use in the chapter |
| `todo` | not yet decided — choose something sensible and propose it |

A term the glossary lacks goes in `translation/proposals/<chapter-id>.tsv`, not into
`glossary.tsv`. One proposals file per chapter is what keeps parallel branches from
conflicting.

## Register

Natural Bokmål that a Norwegian reader would recognise as written by a person. Not stiff,
not bureaucratic, not word-for-word from the English.

The rule that costs the most here is R2: do not borrow from Norwegian administrative
language. *Forvaltning*, *vedtak*, *hjemmel*, *rettssubjekt*, *medvirkning*, *høring* and
*tilsyn* each mean something exact in Norwegian public administration. Using one where the
original used an everyday word makes a claim about Norwegian law that the original does not
make — and this reader knows Norwegian law well enough to read it that way.

English stays in place where it is doing work: quotations, titles of English-language works
(*The Age of Surveillance Capitalism*), proper names, and the metalinguistic use of a word
(«plural»). `⿻` is always the symbol.

## Structural rules

- Every footnote marker survives. Footnote definitions stay in English.
- Every figure survives; translate its `alt` text, never its path.
- Cross-chapter links keep their URL. Where the English used the target chapter's title,
  use that chapter's registered Norwegian title. Where the English used prose ("a later
  chapter"), translate the prose.

## Expected length

Roughly the same as the simplified English — the checker expects 80–120%.

Bokmål compounds where English uses two words, so a faithful translation tends to land a
little under its source; glossing a term that has no Norwegian equivalent pushes back the
other way. Neither stage is a compression stage. Well under 80% means a passage went
missing.

## Before opening a pull request

```bash
vp run translation:validate
```
