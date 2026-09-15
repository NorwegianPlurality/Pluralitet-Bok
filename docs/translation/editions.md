# The editions and their branches

This fork produces two editions, and each is published on its own. A human editor reviews
an edition before it is published, so each one needs a branch to be reviewed on, a build to
be reviewed against, and a verification whose result speaks for it alone.

## Branches

| Branch | Edition | Carries |
| --- | --- | --- |
| `main` | — | An exact mirror of `upstream/main`. No fork commit ever lands here. |
| `simplify` | Simplified English (`en-simple`) | `contents/english/`, `contents/simplified-english/`, and the shared tooling. |
| `norwegian` | Norwegian Bokmål (`nb`) | All of the above plus `contents/norwegian/`. |

Both are working branches. Neither is generated, and neither is a snapshot: people commit
to both, and an editor's changes are ordinary reviewed commits like any other.

Per-chapter branches are cut from the branch that owns their stage and merge back into it:

    simplify/3-2     from simplify    edits contents/simplified-english/3-2-connected-society.md
    translate/3-2    from norwegian   edits contents/norwegian/3-2-connected-society.md

## How work flows between them

One direction only:

    upstream/main ──▶ main ──▶ simplify ──▶ norwegian

`norwegian` merges `simplify` to pick up simplified English that is new or has been edited:

```bash
git switch norwegian
git merge simplify
```

**Never merge `norwegian` into `simplify`.** It would carry `contents/norwegian/` onto a
branch whose edition does not have that layer, and removing it again sets up a
delete-versus-modify conflict against every later merge, growing with each translated
chapter.

That one-way flow has a consequence worth stating plainly: **shared changes belong on
`simplify`.** Tooling, tests, registries, CI, the stage documentation and the audience
profile are used by both editions, and a change to any of them made on `norwegian` is
stranded there — `simplify` has no way to receive it. Make it on `simplify`, or on a branch
cut from `simplify`, and merge down.

### Files that are meant to differ

`ReadMe.md` and `AGENTS.md` are per-edition: one is Norwegian and addresses a translator,
the other English and addresses an editor. They would otherwise conflict on every merge,
forever, over a decision nobody needs to make, so `.gitattributes` marks both `merge=ours`
and the merging branch keeps its own copy.

Git has no built-in `ours` driver — `.gitattributes` only names one — so it has to be
enabled once per clone, along with the same setting that `translation/progress.tsv` has
always needed:

```bash
vp run setup:git
```

Without it those entries are silently ignored and the conflicts come back.

## Verifying and building one edition

Each edition has its own tasks, and each exits on its own merits:

```bash
vp run edition:check:en-simple
vp run edition:check:nb
```

Each runs that edition's validation and then assembles its manuscript into
`dist/publication/<edition>/`. The validation is stage-scoped — `en-simple` runs the
simplify-stage checks, `nb` the translate-stage ones — so the Norwegian being mid-flight
cannot fail the simplified English, or the reverse.

`vp run edition:pdf:<edition>` typesets that manuscript, and writes the PDF and EPUB into
the same directory under the edition's own name — `dist/publication/nb/Plurality-norwegian.pdf`.
For one chapter, call the renderer directly:

```bash
bun scripts/book/render-candidate.ts nb --chapters=1
```

which writes `Plurality-norwegian_ch-1.pdf` beside it, leaving the full book alone. That is
what a reviewer is handed: the same chapter in each edition, three files whose names say
which is which. `publication/README.md` has the naming rule and why upstream's own output
is named differently.

In CI these are one matrix job per edition with `fail-fast` off, and each is skipped where
its source layer is absent. That is what lets the same workflow run on both branches:
`simplify` has no `contents/norwegian/`, so the `nb` job reports a skip rather than a
failure.

`vp run check` remains the whole-repository verification — typecheck, tests, and both
stages at once — and is what the `verify` job runs.

## Partial editions

Both fork editions are assembled while they are still being written; a chapter joins as it
is simplified or translated. The assembler treats front matter as optional for them, so an
edition can be built and read long before its last chapter lands.

That tolerance is scoped to these two. Upstream's `en` and `zh-TW` are finished, and for
them a missing front-matter file is a broken checkout, not work outstanding — so it stays
an error, and `vp run book:assemble` still builds exactly upstream's two editions and the
release manifest, untouched by any of this.

## Publishing

Neither fork edition is published anywhere yet, and a release workflow is written but
parked rather than active. `publishing.md` has what exists, what is parked, and the three
decisions still open.

## Adding another edition

Register it in `configs` in `scripts/book/build.ts`, add it to `FORK_EDITIONS`, and add its
`edition:*` tasks and a matrix entry. Its output name and directory follow from `filePrefix`
with no further change. An edition in a language that
`scripts/credits.json` does not carry supplies its own `categoryLabels` there rather than
adding a key to that file, which is upstream's and would conflict on every sync.
