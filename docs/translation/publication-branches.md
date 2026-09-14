# Publication branches

## Branch roles

| Branch | Role |
| --- | --- |
| `main` | An exact mirror of `upstream/main`. No fork commits ever land here. |
| `norwegian` | The default branch and where all work happens. Carries every content layer. |
| `simplify` | A generated snapshot of the simplified-English edition. Nobody commits to it. |

Per-chapter branches (`simplify/3-2`, `translate/3-2`) branch from `norwegian` and merge
back into it. Stage 1 work does **not** go to the `simplify` branch, despite the name.

## What `simplify` is

The simplified English text is a readable edition in its own right — plainer than the
original, with every argument and citation intact. The branch carries
`contents/english/` and `contents/simplified-english/` plus the tooling, and **not**
`contents/norwegian/`.

That makes it a *publication* branch: generated output, like a `dist` or `gh-pages`
branch, not somewhere people commit. A commit made on it is discarded by the next rebuild,
silently and without a conflict to warn anyone.

## Rebuilding it

From a checkout of `norwegian`:

```bash
vp run translation:rebuild-simplify
```

The script runs entirely in git plumbing against a temporary index, so nothing is checked
out, no branch is switched, and the working tree is never touched — it is safe to run from
a worktree with anything checked out. It refuses to move `simplify` unless the move is a
fast-forward, and refuses to run at all if the source branch has no Norwegian layer or no
overlay, which are the two ways a caller could quietly publish the wrong thing.

Push it with `git push origin simplify`.

### Why rebuild and not merge

`simplify` is an **ancestor** of `norwegian`, so a commit built on top of `norwegian` is a
descendant of `simplify`. Moving the branch is therefore a fast-forward — no force-push,
and no rewritten history for anyone who has cloned it.

A merge would instead drag `contents/norwegian/` along. Deleting it again on every refresh
produces a delete-versus-modify conflict against each subsequent merge, and the conflict
grows with every translated chapter. Rebuilding avoids the problem rather than managing it.

## The overlay

Two files address a reader or an assistant directly, and both are wrong on the publication
branch if carried over unchanged from `norwegian`: `ReadMe.md` is the Norwegian edition's
front page, and `AGENTS.md` tells you to translate into a layer the branch does not have.

They are not fixed by hand on `simplify` — anything committed there is discarded. The
branch's versions live on `norwegian`, under `publication/simplified-english/`, and the
rebuild lifts them to the root and drops the directory itself from the snapshot:

    publication/simplified-english/ReadMe.md   →  ReadMe.md
    publication/simplified-english/AGENTS.md   →  AGENTS.md

So editing the published edition's front page is an ordinary reviewed change on the branch
that is actually worked, and the next rebuild picks it up. `CLAUDE.md`, `.cursor/rules/`,
`.continue/rules/` and `.github/copilot-instructions.md` need no overlay: they are one-line
pointers to `AGENTS.md`, so replacing that file redirects every tool at once.

`ReadMe.md` there is the upstream English ReadMe with one section inserted after the
opening paragraph, and is kept CRLF-for-CRLF with `main:ReadMe.md` so that
`diff <(git show main:ReadMe.md) publication/simplified-english/ReadMe.md` stays a single
insertion and the fork's additions remain visible at a glance.

Add an overlay file by dropping it in that directory; the rebuild needs no change.

## What the tooling already does correctly

`scripts/book/validate-translation.ts` degrades on its own: with no `contents/norwegian/`
directory it runs the simplify-stage checks and skips the translate, glossary and
cross-reference checks entirely. A publication branch needs no separate validator and no
configuration flag. `vp run check` passes on the snapshot as it stands.

One detail to expect: `translation/chapter-titles.tsv` still carries Norwegian titles on
that branch, and `translation/glossary.tsv` Norwegian terms. They stay whole rather than
being forked — a second copy would drift, and the glossary's English side is exactly the
terminology the simplified edition is meant to preserve. Nothing on the branch reads the
Norwegian columns. The overlaid `AGENTS.md` says so, so a reader who opens them has an
answer.

## When to refresh it

Today 8 of 35 chapters are simplified and some are stale against English that moved
underneath them, so the branch mostly publishes absence. That is an argument about when
it is worth *announcing*, not about whether it should exist: keeping the rebuild in one
command is what stops it from rotting between refreshes. Refresh it when a wave of
chapters lands, and before anyone is pointed at it.

## The same pattern for other editions

Any derived edition — a plain-English print run, a single-chapter excerpt, a different
target language — follows the same shape: a generated branch rebuilt from `norwegian` with
the layers it does not need removed and its own overlay applied. `rebuildSimplify` takes
the source and target branch names as arguments for that reason. Keep the rebuild in one
command so the branch is never something anyone is tempted to commit to by hand.
