# Stage 1 — Simplify

Turn a chapter of `contents/english/` into English written for this edition's reader, in
`contents/simplified-english/`, under the same filename.

## Who you are writing for

Read [`audience.md`](audience.md) once, and your chapter's note under
`audience/` before you start. The short version: a 45-year-old with a master's
degree in a social science, fluent in institutions and powerless with notation. No maths
since upper secondary, no code ever, no proofs. She reads to use what she reads, and she
can tell when she is being talked down to — it is her profession to tell.

The reader is the same at both stages. She is a demographic, not a language. This stage
adapts the text to her education, her vocabulary and her field of experience; stage 2
adapts it to her language. The profile is in Norwegian and so are the chapter notes,
because they were written for stage 2 — read them for what they say about the reader and
about the chapter, and leave the Norwegian wording to the translator.

## Branch and scope

    git switch -c simplify/3-2

Change exactly one file: `contents/simplified-english/3-2-connected-society.md`.

## What to do

Work paragraph by paragraph, in order. Keep one source paragraph as one output paragraph —
the two stages stay alignable that way, and a reviewer can diff them side by side.

- **Break long sentences into shorter ones.** One idea per paragraph (R7).
- **Plain words where the plain word means the same thing.** Academic register goes;
  technical vocabulary that a serious newspaper already uses stays (R3). Simplify toward
  everyday English, never toward another profession's vocabulary.
- **Explain the phenomenon before you name it** (R1). «The whole becomes more than the sum
  of its parts — what economists call supermodularity», never the reverse. The name stays,
  so the reader can look it up and a specialist still recognises it.
- **Place every person in one line** (R4). She knows Arendt. She does not know Licklider,
  Engelbart, Simmel, Harberger or Vickrey, and should not have to pretend. "The American
  philosopher John Dewey (1859–1952)" costs four words and saves a paragraph.
- **Cut hedging that carries no content** ("it is perhaps worth noting that").

R1 and R4 are this stage's job and no other stage can do them. A translation branch may not
add content, so a term left unexplained here is never explained.

## What not to do

- **Do not summarise.** Every argument, example, name, number and citation stays. Cutting
  applies to hedging and repetition, never to content.
- **Do not add content.** Writing out what the source assumed is adaptation; adding a fact
  the source does not have is editing, and it belongs to the editor. Norwegian anchoring —
  the commons, BankID, NORSAR — never goes in a chapter (R9).
- **Do not drop a footnote marker.** `[^Deming]` must appear in the output exactly as in
  the source. Footnote definitions at the bottom stay in English, unchanged.
- **Do not paraphrase a glossary term out of existence.** `translation/glossary.tsv` is
  keyed on English terms, and the translator applies it by finding them. If `supermodularity`
  disappears from your output, its Norwegian decision never fires and nothing warns you.
- **Do not drop or rename a figure.** `figs/…` paths are untouched; `alt` text stays English
  at this stage.
- **Do not rewrite cross-chapter links.**
- **Do not soften the argument.** A chapter written from American premises keeps them.

## Expected length

Roughly the same as the source — the checker expects 85–120%.

This stage is not a compression stage. Hedging and academic filler come out, explanation
and placement go in, and the two roughly cancel. A chapter that lands at 70% has lost
content rather than gained a reader; a chapter well above 120% has probably started
explaining things the source did not claim.

## Before opening a pull request

```bash
vp run translation:validate
```
