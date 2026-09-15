import { defineConfig } from 'vite-plus'

export default defineConfig({
  run: {
    // Task outputs depend on env vars (BOOK_DATE, OUTPUT_ROOT, SOURCE_REVISION, ...) that
    // aren't tracked as cache inputs, so caching is disabled to preserve the plain
    // "always execute" semantics the previous package.json scripts had.
    cache: false,
    tasks: {
      typecheck: { command: 'tsc --noEmit' },
      test: { command: 'vitest run' },
      check: { command: ['tsc --noEmit', 'vitest run', 'bun scripts/book/validate-translation.ts'] },
      'docs:dev': { command: 'vitepress dev docs' },
      'docs:build': { command: 'vitepress build docs' },
      'docs:preview': { command: 'vitepress preview docs' },
      // Git has no built-in `ours` driver; .gitattributes only names it. Without this the
      // merge=ours entries there are silently ignored and the conflicts come back.
      'setup:git': { command: 'git config merge.ours.driver true' },

      // The Norwegian cover is generated, not hand-drawn. The wordmark step takes
      // upstream's PLURALITY apart into letters and reassembles it as PLURALITET, so the
      // colour scheme is data in that script rather than geometry to redraw; the cover
      // step copies upstream's ⿻ mark pixel-for-pixel and re-sets only the wordmark,
      // subtitle and byline. Run the wordmark first — the cover reads its output.
      'design:wordmark:nb': { command: 'python3 design/make-wordmark-nb.py' },
      'design:cover:nb': { command: ['vp run design:wordmark:nb', 'python3 design/make-cover-nb.py'] },

      'translation:validate': { command: 'bun scripts/book/validate-translation.ts' },
      'translation:progress': { command: 'bun scripts/translation/refresh-progress.ts' },
      'translation:next': { command: 'bun scripts/translation/next-tasks.ts' },

      // One edition at a time. Each is reviewed and published on its own, so each needs a
      // verification whose exit code speaks for it alone: `edition:check:en-simple` stays
      // green while the Norwegian is mid-translation, and the reverse.
      'edition:validate:en-simple': { command: 'bun scripts/book/validate-translation.ts --stage=simplify' },
      'edition:validate:nb': { command: 'bun scripts/book/validate-translation.ts --stage=translate' },
      'edition:assemble:en-simple': { command: 'bun scripts/book/build.ts en-simple dist/publication/en-simple' },
      'edition:assemble:nb': { command: 'bun scripts/book/build.ts nb dist/publication/nb' },
      // Whole-edition PDF + EPUB via Vivliostyle. For one chapter, call the renderer
      // directly: `bun scripts/book/render-candidate.ts en-simple --chapters=1`.
      'edition:pdf:en-simple': { command: 'bun scripts/book/render-candidate.ts en-simple' },
      'edition:pdf:nb': { command: 'bun scripts/book/render-candidate.ts nb' },
      'edition:check:en-simple': { command: ['vp run edition:validate:en-simple', 'vp run edition:assemble:en-simple'] },
      'edition:check:nb': { command: ['vp run edition:validate:nb', 'vp run edition:assemble:nb'] },
      'book:assemble': { command: 'bun scripts/book/build.ts all dist/publication' },
      'book:manifest': { command: 'bun scripts/book/manifest.ts dist/publication' },
      'book:candidate:prepare': { command: 'bun scripts/book/prepare-vivliostyle.ts' },
      'book:candidate:en': { command: 'bun scripts/book/render-candidate.ts en' },
      'book:candidate:zh-TW': { command: 'bun scripts/book/render-candidate.ts zh-TW' },
      'book:candidate:all': { command: 'bun scripts/book/render-candidate.ts all' },
      'book:candidate:validate': { command: 'bun scripts/book/validate-candidate.ts dist/publication' },
      'book:legacy:en': { command: 'bun scripts/book/render-legacy.ts en' },
      'book:legacy:zh-TW': { command: 'bun scripts/book/render-legacy.ts zh-TW' },
      'book:legacy:all': { command: 'bun scripts/book/render-legacy.ts all' },
      'book:legacy:validate': { command: 'bun scripts/book/validate-legacy.ts dist/publication' },
    },
  },
})
