# Stage 1 — Simplify

Turn a chapter of `contents/english/` into shorter, plainer English in
`contents/simplified-english/`, under the same filename.

## Branch and scope

    git switch -c simplify/3-2

Change exactly one file: `contents/simplified-english/3-2-connected-society.md`.

## What to do

Work paragraph by paragraph, in order. Keep one source paragraph as one output paragraph —
the two stages stay alignable that way, and a reviewer can diff them side by side.

- Break long sentences into shorter ones.
- Replace academic register with plain words where the plain word means the same thing.
- Cut hedging that carries no content ("it is perhaps worth noting that").

## What not to do

- Do not summarise. Every argument, example, name, number and citation stays.
- Do not drop a footnote marker. `[^Deming]` must appear in the output exactly as in the
  source. Footnote definitions at the bottom stay in English, unchanged.
- Do not drop or rename a figure. `figs/…` paths are untouched; `alt` text stays English at
  this stage.
- Do not rewrite cross-chapter links.

## Expected length

Roughly 55–95% of the source. Below that, content was lost rather than tightened — the
checker warns, and a reviewer will ask.

## Before opening a pull request

```bash
vp run translation:validate
```
