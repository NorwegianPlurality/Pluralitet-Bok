# Releases: three paradigms

A version number on a translated book has one job: tell the reader what has been done to
the text in their hands. Not how much of it exists — the assembler already publishes
partial editions, and a reader can count chapters. What a reader cannot see, and cannot
find out any other way, is **whether a human has read this**. A fluent machine translation
and an edited one look exactly alike on the page. The number is the only signal, so the
number is about provenance and nothing else.

This fork answers that question three different ways over its life, and each answer gets
its own kind of version:

| Series | Who made the text | What the number promises | How the series ends |
| --- | --- | --- | --- |
| `0.x` | AI at both stages, checker-clean, no human read-through | Nothing about quality. Only: this is a machine draft, and here is how much of it exists. | `0.9.0` — all 35 chapters through both stages |
| `1.x` | AI drafts, the editor reads and revises every chapter | A named person has read every sentence and stands behind it | When review stops being one person's job |
| rolling | Several contributors, continuously, tracking upstream | This is the state of the book on this date | It doesn't |

The move from `1.x` to rolling is not a quality step. It is the same promise, kept a
different way: **review moves from release time to merge time.** In `1.x` a release is
what a human has read. In rolling, nothing is merged that a human has not read, so every
build is publishable and the release stops being a gate at all.

This note says what the numbers mean. `publishing.md` says how a release is actually
built and why nothing is published yet.

## `0.x` — the machine draft

Both stages are done by an AI assistant, following `AGENTS.md`. The checker passes. Nobody
has read the chapter end to end against the original.

**What a chapter needs to be in a `0.x` release**

- `vp run edition:check:<edition>` reports 0 errors for the edition as a whole
- the chapter is `done` — not `stale` — in `translation/progress.tsv`
- terms it needed are in `translation/glossary.tsv`, not left sitting in `proposals/`

That list is deliberately short, and it settles the first question `publishing.md` leaves
open: there is no chapter-count threshold. A partial edition is what `0.x` is for. An
edition that builds and checks clean can be released with whatever chapters exist, because
the number promises nothing about completeness and the release notes carry the count.

**Numbering.** `0.MINOR.PATCH`. A minor bump is a wave: chapters that were not in the last
release are in this one. A patch is a fix to something already released — a dropped
footnote, a build regression, a glossary term folded in and applied — with no new chapters.
The chapter count belongs in the release notes, not in the number; there is no useful
mapping from 35 chapters onto nine minor versions, and inventing one only invites the
reader to read the number as progress toward quality, which is exactly what it is not.

`0.9.0` is reserved and means one specific thing: **feature complete, unreviewed.** All 35
chapters have been through both stages, both edition checks are clean, no row in
`progress.tsv` is `stale`, and no proposal is unfolded. It is the gate into `1.x` work, and
it is the only `0.x` number with a definition.

**Labelling is not optional.** Every `0.x` artifact — the PDF, the EPUB, the release
notes — says on its front matter that it is an unreviewed machine translation, in the
edition's own language. A `0.x` build is for reading and for finding defects. It is not
something to quote, cite, print, or hand to someone who will assume a person wrote it.

That is the one piece of front matter a `0.x` release cannot ship without, and it answers
the third question in `publishing.md`: the title page, colophon and editor's apparatus are
a `1.0` gate, not a `0.x` one. The provenance line is not apparatus, it is the label on the
bottle.

**Upstream.** Sync freely. An upstream edit marks chapters `stale`, and re-running the
stages on them is just another wave; nothing is lost, because nothing was invested in the
prose by hand.

## `1.x` — the edited edition

The editor — the role in `AGENTS.md` — reads every chapter against
`docs/translation/review.md`, revises it, and signs off. The chapters were drafted by an
AI; the book is the editor's.

**`1.0.0` requires all of:**

- every chapter reviewed and signed off, and none of those reviews stale
- the apparatus written: preface, glossary, translator's notes (`O.a.`), and the editor's
  note on the audience adaptations (step 6 of `docs/translation/plan.md`)
- `vp run check` and both `edition:check:*` tasks clean
- the register in `docs/translation/audience.md` reconciled with what the book actually
  does, since a full read-through is where R1–R9 get tested for the first time

**Review is one act covering both layers.** A chapter is reviewed when its simplified
English *and* its Norwegian have been read. They cannot be separated: only the simplify
stage may explain a term or place a person (R1, R4), so a defect the editor notices while
reading the Norwegian is usually a stage-1 defect, and its fix belongs on `simplify` and
flows down. That is why the two editions' numbers advance together in practice even though
they are tagged separately — see `editions.md` for why separately.

**Tracking it.** `translation/progress.tsv` has a column per stage; `1.x` needs a third,
`review`, with the same shape as the others — `todo` / `done` / `stale`, plus the source
revision the review was done against. Without it there is no way to answer "is this
releasable" except by remembering, and no way to notice that an upstream sync has quietly
invalidated a sign-off. It does not exist yet; see *Not built yet* below.

**Numbering.** `1.MINOR.PATCH`. A minor is a substantive editorial pass — an upstream sync
folded in and re-reviewed, a revision of the register applied across the book, a rewritten
apparatus. A patch is a correction that does not change what the book says: typos,
citations, a figure path, a build fix.

**Upstream during `1.x`.** A sync moves reviewed chapters to `stale`, and that is the point
of tracking it: an upstream edit means the editor's sign-off no longer covers the text.
A `1.MINOR.0` release is how a sync lands, and it lists which chapters were re-reviewed. A
release may ship with stale rows outstanding, but then it says so, by chapter, in its
notes. What it must never do is carry a stale chapter silently — that would make `1.x`
mean less than it says.

## Rolling

**The entry condition is people, not a date.** Rolling starts when at least two people can
approve a chapter pull request, so that no merge waits on one person. Until then, "rolling"
would only mean the editor merging their own work continuously, which is `1.x` with the
gate removed and the promise quietly dropped.

What changes:

- Semver retires. Each green build of an edition branch is publishable, the way upstream
  publishes from `main`.
- Identity comes from date and revision — both already in `manifest.json` — rather than
  from a number. A moving book still needs fixed points to cite, so dated snapshot tags
  continue, as upstream's do.
- Upstream syncs become routine merges rather than release events.

What does not change:

- Every chapter is still reviewed by someone other than its author before it merges. The
  `1.0` promise holds; only its enforcement point moves.
- The register profile, the checker, one chapter per branch per stage, and the one-way flow
  `simplify` → `norwegian` all stand. Rolling is a change to how the book is published, not
  to how it is written.

Note what rolling does *not* inherit from upstream: upstream overwrites one `latest` tag on
every push to `main`, and `publishing.md` explains why that model does not suit a
translation under review. Rolling here means publishable-on-merge with dated snapshots,
not a tag that silently rewrites itself mid-sentence.

## Tags

Fork tags are prefixed with their edition and never look like upstream's:

    nb-v0.3.0            a 0.x or 1.x release of the Norwegian edition
    en-simple-v0.3.0     the same for the simplified English
    nb-20260401          a rolling snapshot, for citation
    nb-latest            the rolling head

`main` mirrors `upstream/main` and carries upstream's tags — bare dates (`20240201`) and
`latest`. Those belong to upstream and this fork never creates, moves, or reuses one. Fork
tags are cut on `simplify` and `norwegian`, which are the branches that carry the editions.

The prefix is the edition id the tooling already uses — `nb` and `en-simple`, the same
strings as `vp run edition:check:nb` and `dist/publication/en-simple/` — so a tag, a task
and a directory never disagree about which edition is meant. That settles the second open
question in `publishing.md`, and it means the parked workflow's `no-v*` trigger has to
become `nb-v*` and `en-simple-v*` before it is activated.

Each edition is numbered on its own, for the same reason each is verified and built on its
own: an editor signs off on one edition, and a version that meant "the worse of the two"
would tell the reader nothing about the book they are holding.

## Not built yet

Documenting the paradigms does not implement them. What the repository still needs, in the
order it will need it:

- **A provenance banner.** A per-edition front-matter line stating review status, in the
  edition's language, rendered into the PDF and EPUB. Needed before the first `0.x` release,
  because an unlabelled machine translation is the failure mode this whole scheme exists to
  prevent.
- **`BOOK_VERSION`.** Alongside `BOOK_DATE`, threaded through `scripts/book/build.ts` and
  `manifest.ts` into the metadata, so an artifact says which release it is.
- **A `review` column** in `translation/progress.tsv`, written by
  `vp run translation:progress` and understood by `vp run translation:next`. Needed before
  `1.0`, not before `0.9`.
- **The parked release workflow, activated.** `drafts/norwegian-release.yml` already builds
  and publishes one fork edition; it needs the tag prefixes above and the provenance banner
  before it is copied into `.github/workflows/`. `publishing.md` has the detail.

## Where we are

Nothing has been released. The working branches carry 8 of 35 chapters in Norwegian, with
several of their simplified-English sources marked stale. This is `0.x` territory and will
be for a while; `vp run translation:progress` and `vp run translation:next` are the current
state, and `plan.md` is the immediate plan inside it.

## Related

- `editions.md` — the editions, their branches, and how to build one
- `publishing.md` — what a release is made of, and the workflow that is parked
- `plan.md` — the working plan for the chapter currently going through the pipeline
