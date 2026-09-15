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

## What is still undecided

These are the reasons it is parked rather than active. Each changes what the
file should say:

1. **When is an edition worth publishing?** Both fork editions are partial and
   are assembled that way on purpose. A release today would publish mostly
   absence. `vp run translation:progress` reports where each stage stands; no
   threshold has been agreed, and it may be editorial judgment rather than a
   number.

2. **Which edition does a tag mean?** A dispatch picks one from a menu. A pushed
   `no-v0.1` tag carries no edition, and the draft assumes Norwegian. If the
   simplified English is ever published too, tags need to say which — `nb-v0.1`
   and `simple-v0.1`, or one release carrying both.

3. **Does an edition need its own front matter first?** A release is the book,
   not a manuscript: a title page, a translator's colophon and a note that the
   text is in progress are the editor's to write. The draft publishes whatever
   the assembler produces, which today has no such apparatus.

An earlier note, `publication-branches.md`, proposed turning `simplify` into a
generated publication branch. It was removed in `d1f420a` because `2a48f1f`
settled the opposite: `simplify` is a real working branch that people commit to,
carrying the simplified English edition. Recover it with
`git show c7381fc:docs/translation/publication-branches.md` if the reasoning is
ever wanted; it does not describe how the repository works now.

## Related

- `editions.md` — the editions, their branches, and how to build one
- `../../publication/README.md` — what the rendered files are called, and why
