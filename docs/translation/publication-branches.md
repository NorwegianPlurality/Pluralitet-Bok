# Publication branches

> **Not set up yet, and deliberately so.** This is a design note for later, not a
> description of how the repository works today. Nothing here has been implemented.

## Branch roles today

| Branch | Role |
| --- | --- |
| `main` | An exact mirror of `upstream/main`. No fork commits ever land here. |
| `norwegian` | The default branch and where all work happens. Carries every content layer. |
| `simplify` | Currently an ancestor of `norwegian`, left over from the original two-branch split. Not a working branch. |

Per-chapter branches (`simplify/3-2`, `translate/3-2`) branch from `norwegian` and merge
back into it. Stage 1 work does **not** go to the `simplify` branch.

## What `simplify` could become

The simplified English text is a readable edition in its own right — plainer than the
original, with every argument and citation intact. Publishing it would mean a branch
carrying `contents/english/` and `contents/simplified-english/` plus the tooling, but
**not** `contents/norwegian/`.

That is a *publication* branch: generated output, like a `dist` or `gh-pages` branch, not
somewhere people commit.

## When it is worth establishing

Not before most chapters are simplified. Today 8 of 35 are done and 4 of those are stale
against English that moved underneath them; a publication branch now would mostly publish
absence. Sensible triggers:

- most chapters at stage 1, with `vp run translation:validate` reporting no errors, and
- someone actually asking to read or print the simplified edition.

## How to establish it, when the time comes

The useful property is that `simplify` is an **ancestor** of `norwegian`, so a commit built
on top of `norwegian` is a descendant of `simplify`. Moving the branch forward is therefore
a fast-forward — no force-push, and no rewritten history for anyone who has cloned it.

```bash
git switch --detach norwegian
git rm -r --cached -q contents/norwegian
git commit -q -m "Publication snapshot of the simplified English edition"
git branch -f simplify HEAD
git switch norwegian
```

Repeat exactly that to refresh it. Each refresh is `norwegian` plus one removal commit, so
the branch never diverges and never needs reconciling.

### Why not merge `norwegian` into `simplify`

A merge drags `contents/norwegian/` along. Deleting it again on every refresh produces a
delete-versus-modify conflict against each subsequent merge, and the conflict grows with
every translated chapter. Rebuilding from `norwegian` avoids the problem rather than
managing it.

## What the tooling already does correctly

`scripts/book/validate-translation.ts` degrades on its own: with no `contents/norwegian/`
directory it runs the simplify-stage checks and skips the translate, glossary and
cross-reference checks entirely. A publication branch needs no separate validator and no
configuration flag.

Two details to expect:

- `translation/chapter-titles.tsv` still carries Norwegian titles on that branch. Harmless —
  nothing reads `no_title` when there is no Norwegian layer — but it will look odd to a
  reader who opens it.
- CI already builds on `simplify` pushes. The publication jobs stay gated on `main` plus the
  upstream repository owner, so a fork push runs verification and builds only.

## The same pattern for other editions

Any derived edition — a plain-English print run, a single-chapter excerpt, a different
target language — follows the same shape: a generated branch rebuilt from `norwegian` with
the layers it does not need removed. Keep the rebuild in one command so the branch is never
something anyone is tempted to commit to by hand.
