# Norwegian Translation Instructions

This folder contains the Norwegian Bokmål translation of *Plurality: The Future of Collaborative Technology and Democracy*.

## Translation approach

Do NOT produce a literal translation. Follow this two-step process:

### Step 1 — Simplify (branch: `simplify`)

Work on `contents/simplified-english/`, one paragraph at a time.

- Break up long, complex sentences into shorter ones.
- Remove unnecessary hedging and academic filler without losing substance.
- Preserve all arguments, examples, and meaning — do not omit content.
- Output files mirror the English filenames, placed in `contents/simplified-english/`.

### Step 2 — Translate (branch: `norwegian`)

Work on this folder (`contents/norwegian/`), translating from the simplified English, one paragraph at a time.

- Use natural, accessible Norwegian Bokmål. Avoid stiff or bureaucratic phrasing.
- Preserve technical terms (e.g. "plurality", "quadratic voting") where no good Norwegian equivalent exists. On first use, add a brief parenthetical explanation in Norwegian.
- The ⿻ symbol is kept as-is throughout.
- Output filenames follow the same pattern as the English originals, e.g. `1-se-mangfold.md`.

## Workflow

Process one paragraph at a time. Commit after each paragraph or small logical unit so changes are easy to review.
