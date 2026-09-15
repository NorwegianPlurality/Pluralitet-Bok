# Publishing an edition

> **Not set up, and deliberately so.** No edition of this fork is published
> anywhere today. This note records what exists, what is parked, and the
> decisions still to be made.

Upstream publishes on every push to `main`: one rolling `latest` tag whose four
assets are overwritten each time, feeding plurality.net. That model suits a
finished book. It does not suit a translation under review — an English typo fix
landing upstream would republish the Norwegian mid-sentence — so this fork's
release path has to be its own, and is not simply upstream's job with the owner
check flipped.

Upstream's release, Pages deploy and webhook jobs in `.github/workflows/main.yml`
stay gated on `github.repository_owner == 'pluralitybook'`. This fork runs
verification and builds only, and can deploy nothing.

## What is parked

`drafts/norwegian-release.yml` is a complete, unactivated release workflow. It
lives outside `.github/workflows/`, so GitHub cannot see it and nothing runs.

```bash
cp docs/translation/drafts/norwegian-release.yml .github/workflows/
```

It builds one fork edition with `edition:check:*` and `edition:pdf:*` — the
fork's own Vivliostyle path, no Docker — and publishes
`dist/publication/<edition>/` as a GitHub Release under a version tag. It is
triggered by hand or by a `no-v*` tag, never by a branch push, and each version
is published once rather than rewriting a rolling tag. Its header comments
explain each choice.

Its shape has been checked but it has never run. Treat the first dispatch as a
dry run: it has a `publish` checkbox that builds and validates without releasing
anything.

## What is settled, and what is left

`releases.md` settles what a version number means, and with it two of the three
questions that kept this parked:

1. **When is an edition worth publishing?** Settled: as soon as it builds and
   checks clean. A `0.x` release is a machine draft and promises nothing about
   completeness, so releasing a partial edition is the point rather than a
   problem. The chapter count belongs in the release notes.
   `vp run translation:progress` reports where each stage stands.

2. **Which edition does a tag mean?** Settled: the tag carries the edition id the
   tooling already uses — `nb-v0.1`, `en-simple-v0.1`. The draft's `no-v*`
   trigger and its `EDITION=nb` fallback for a pushed tag have to be updated to
   match before it is activated.

3. **Does an edition need its own front matter first?** Partly, and this is the
   one still open. A `0.x` release must carry a line saying it is an unreviewed
   machine translation, in the edition's own language, and no edition's front
   matter has one. The title page, translator's colophon and the rest of the
   apparatus are a `1.0` gate rather than a blocker for the first release.

What is left before the workflow moves into `.github/workflows/` is therefore
buildable rather than editorial: the provenance line, and the tag prefixes.

An earlier note, `publication-branches.md`, proposed turning `simplify` into a
generated publication branch. It was removed in `d1f420a` because `2a48f1f`
settled the opposite: `simplify` is a real working branch that people commit to,
carrying the simplified English edition. Recover it with
`git show c7381fc:docs/translation/publication-branches.md` if the reasoning is
ever wanted; it does not describe how the repository works now.

## Related

- `editions.md` — the editions, their branches, and how to build one
- `releases.md` — what a version number promises, and the three release paradigms
- `../../publication/README.md` — what the rendered files are called, and why
