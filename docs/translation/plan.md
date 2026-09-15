# Plan: carry chapter 1 through the whole pipeline

> **Status:** steps 1–2 partly done. This is the working plan for the next session; update
> it as steps land rather than keeping the state anywhere else.

The scope is deliberately **one chapter, end to end**, rather than the whole book. Chapter
`1` — `1-preface.md`, *Seeing Plural* / *Se mangfold* — goes through every stage, so the
pipeline is proven on something reviewable before ~122,000 words go through it. The full
book is the same steps repeated, and `vp run translation:next` is the queue.

Run the steps **in order**. Each depends on the one before it.

## 1. Sync upstream ✅

`main`, `simplify` and `norwegian` all contain `upstream/main` (`8615885`). Re-check with:

```bash
git fetch upstream && git merge-base --is-ancestor upstream/main norwegian && echo current
```

## 2. Simplify chapter 1 — on `simplify`

`contents/simplified-english/1-preface.md` already exists and is not marked stale. Reread
it against `contents/english/1-preface.md` and against the audience profile before
declaring it done; it was written before the profile existed.

Front matter `0-0` and `0-3` are done (see below for the rule that governed `0-0`).

## 3. Verify the simplified English

```bash
vp run check
vp run edition:check:en-simple
```

Both must report 0 errors. The 13 standing warnings are length-band and glossary-term
warnings on chapters 2-0 through 3-1; they predate this work and are not chapter 1's.

## 4. Translate chapter 1 — on `norwegian`

```bash
git switch norwegian && git merge simplify
```

`contents/norwegian/1-preface.md` exists. Same instruction as step 2: reread it against the
simplified English and the glossary rather than assuming it is finished.

## 5. Verify the Norwegian edition

```bash
vp run check
vp run edition:check:nb
```

## 6. Editor's note on the audience adaptations

For publication alongside the editions, not internal docs. What the simplify stage changed
and what it deliberately did not; how R1–R9 from `audience.md` were applied to this
chapter; which terms were glossed, kept in English, or translated, and why. The rule in
"Real names and titles" below belongs in it.

## 7. PDFs for all three documents

Working today, verified on chapter 1:

```bash
BOOK_DATE=$(git log -1 --format=%cs) bun scripts/book/render-candidate.ts en        --chapters=1
BOOK_DATE=$(git log -1 --format=%cs) bun scripts/book/render-candidate.ts en-simple --chapters=1
BOOK_DATE=$(git log -1 --format=%cs) bun scripts/book/render-candidate.ts nb        --chapters=1   # needs the norwegian branch
```

Each writes a PDF and an EPUB to `dist/publication/candidate/vivliostyle-<edition>-ch1-candidate.*`.
Drop `--chapters` for the whole edition, or use `vp run edition:pdf:en-simple` / `edition:pdf:nb`.

`nb` only builds on `norwegian`, which is the only branch carrying `contents/norwegian/`.
So the three-way comparison is produced on `norwegian`, after step 4's merge.

**Toolchain:** the Vivliostyle path is the one that works here — `vivliostyle` is in
`node_modules` and 302 Noto fonts are installed. The legacy path (`book:legacy:*`) needs
Docker, pandoc and xelatex, none of which are present, so do not reach for it.

## 8. The `humorous` branch

```bash
git switch -c humorous norwegian
```

Rework the Norwegian chapter 1 with humour in the vein of Dan Davies' *The Unaccountability
Machine*: dry, deadpan, digressive asides, systems-theory wit aimed at institutions and
incentive structures rather than at people. Every argument, example, name, number, citation
and figure stays. The humour is in register and aside, not in cutting or inventing content,
and `vp run edition:check:nb` still has to pass.

## Standing rules discovered while doing this

### Real names and titles

**Do not simplify a real person's name or title, and never rewrite a quotation attributed
to one.** Rewriting a quote in plainer English does not adapt it — it puts words in the
speaker's mouth. `0-0-endorsements.md` is 2,200 words of attributed quotation and is
preserved byte for byte at the simplify stage; only the attribution lines, which are the
book's own prose, were touched, and only to drop endowed-chair ornament ("Elizabeth and
James Killian Professor of Economics at MIT" → "Professor of Economics at MIT").

Titles **may be translated** into Norwegian as far as the language allows — *Professor of
Economics* → *professor i økonomi*. What must not happen is R6: mapping a foreign office
onto the nearest domestic one. A US *congressman* is not a *stortingsrepresentant*; a
*Secretary of State* is not an *utenriksminister*. Where no faithful Norwegian rendering
exists, keep the original.

R4 wants a role at first mention for anyone the reader will not recognise. The source
usually supplies one. Where it does not — Manda Scott, credited with a bare name — leave it
for the editor rather than guessing a credential and attributing the wrong one to a real
person.

### Where work goes

`simplify` and `norwegian` are both working branches, one per edition, and work flows one
way: `simplify` → `norwegian`, never back. Anything both editions share — tooling, tests,
registries, CI, docs including this file — belongs on `simplify`. See
`docs/translation/editions.md`.

Run `vp run setup:git` once per clone or the `merge=ours` attributes on `ReadMe.md` and
`AGENTS.md` are silently ignored and every merge conflicts on them.
