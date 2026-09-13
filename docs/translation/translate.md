# Stage 2 — Translate

Turn a chapter of `contents/simplified-english/` into Norwegian Bokmål in
`contents/norwegian/`, under the same filename.

## Branch and scope

    git switch -c translate/3-2

Change exactly one file: `contents/norwegian/3-2-connected-society.md`. You may also add
terms to `translation/proposals/3-2.tsv`.

## Before you start

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

Roughly 70–115% of the simplified English.

## Before opening a pull request

```bash
vp run translation:validate
```
