import { describe, expect, test } from 'vitest'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  EDITIONS,
  FORK_EDITIONS,
  UPSTREAM_EDITIONS,
  assembleLocale,
  editionMetadata,
  editionOutput,
  isEdition,
  parseChapters,
  type Locale,
} from '../scripts/book/build'

/**
 * The fork's editions assemble on their own, while they are still partial.
 *
 * Both of them are published separately and reviewed by a human before they are, so each
 * has to be buildable before the other is finished — and before either is finished at all.
 * An assembler that needs a complete edition is an assembler no editor can review against
 * until the last chapter lands.
 */

const credits = {
  i18n: { en: { categories: { Writing: 'Writing' } }, zh: { categories: { Writing: '寫作' } } },
  categories: [{ name: 'Writing', contributors: [{ name: 'Alice', pt: 2 }] }],
}

function editionRoot(directory: string, files: Record<string, string> = {}): string {
  const root = mkdtempSync(join(tmpdir(), 'plurality-edition-'))
  const source = join(root, 'contents', directory)
  mkdirSync(source, { recursive: true })
  for (const [name, body] of Object.entries(files)) writeFileSync(join(source, name), body)
  return root
}

const assemble = (root: string, edition: Locale) => assembleLocale(root, edition, '2024-01-02', credits)

describe('edition registry', () => {
  test('carries upstream and fork editions separately', () => {
    // `all` builds only the upstream pair, so the release manifest cannot pick up a
    // half-translated book. The split is what keeps that true.
    expect(UPSTREAM_EDITIONS).toEqual(['en', 'zh-TW'])
    expect(FORK_EDITIONS).toEqual(['en-simple', 'nb'])
    expect(EDITIONS).toHaveLength(4)
  })

  test('recognises every edition and nothing else', () => {
    for (const edition of EDITIONS) expect(isEdition(edition)).toBe(true)
    expect(isEdition('norwegian')).toBe(false)
    expect(isEdition('all')).toBe(false)
  })
})

describe('partial editions', () => {
  test('assembles with no endorsements file', () => {
    // No fork edition has one: 0-0 is upstream front matter that neither stage produces.
    const root = editionRoot('simplified-english', { '2-1-test.md': '# Chapter\nBody\n' })
    expect(() => assemble(root, 'en-simple')).not.toThrow()
    expect(assemble(root, 'en-simple').markdown).toContain('Body')
  })

  test('assembles from a single chapter', () => {
    const root = editionRoot('norwegian', { '3-1-test.md': '# Kapittel\nTekst\n' })
    expect(assemble(root, 'nb').markdown).toContain('Tekst')
  })

  test('emits a section heading only for sections that have a chapter', () => {
    const root = editionRoot('norwegian', { '3-1-test.md': '# Kapittel\nTekst\n' })
    const { markdown } = assemble(root, 'nb')
    expect(markdown).toContain('# Del 3: Pluralitet')
    expect(markdown).not.toContain('# Del 4: Frihet')
  })

  test('a complete edition still requires its endorsements file', () => {
    // The tolerance is scoped to partial editions on purpose. Upstream's books are
    // finished, so a missing front-matter file there is a broken checkout, and publishing
    // one without its endorsements must stay impossible.
    const root = editionRoot('english', { '2-1-test.md': '# Chapter\nBody\n' })
    expect(() => assemble(root, 'en')).toThrow(/0-0-endorsements\.md/)
  })

  test('still fails when the edition directory is absent entirely', () => {
    // Missing chapters are expected; a missing layer is a broken checkout, and silently
    // assembling an empty book out of it would publish a blank edition.
    const root = mkdtempSync(join(tmpdir(), 'plurality-edition-'))
    expect(() => assemble(root, 'nb')).toThrow(/contents\/norwegian/)
  })
})

describe('edition identity', () => {
  test('the Norwegian edition carries its own title and language', () => {
    const root = editionRoot('norwegian', { '3-1-test.md': '# Kapittel\nTekst\n' })
    const { markdown } = assemble(root, 'nb')
    expect(markdown).toContain('title: Pluralitet')
    expect(markdown).toContain('lang: nb')
  })

  test('the Norwegian edition translates the credit category labels', () => {
    // credits.json is upstream's and carries en and zh only. The override lives in the
    // edition config so syncing that file from upstream never conflicts.
    const root = editionRoot('norwegian', { '3-1-test.md': '# Kapittel\nTekst\n' })
    expect(assemble(root, 'nb').markdown).toContain('Skriving')
  })

  test('the simplified English keeps the original title and language', () => {
    // Same book in plainer English, not a different one.
    const root = editionRoot('simplified-english', { '2-1-test.md': '# Chapter\nBody\n' })
    const { markdown } = assemble(root, 'en-simple')
    expect(markdown).toContain('title: Plurality')
    expect(markdown).toContain('lang: en')
  })

  test('each edition reads its own directory', () => {
    const root = editionRoot('simplified-english', { '2-1-test.md': '# Chapter\nPlainer\n' })
    mkdirSync(join(root, 'contents', 'norwegian'), { recursive: true })
    writeFileSync(join(root, 'contents', 'norwegian', '2-1-test.md'), '# Kapittel\nNorsk\n')

    expect(assemble(root, 'en-simple').markdown).toContain('Plainer')
    expect(assemble(root, 'en-simple').markdown).not.toContain('Norsk')
    expect(assemble(root, 'nb').markdown).toContain('Norsk')
    expect(assemble(root, 'nb').markdown).not.toContain('Plainer')
  })

  test('writes each edition under its own file name', () => {
    const root = editionRoot('simplified-english', { '2-1-test.md': '# Chapter\nBody\n' })
    mkdirSync(join(root, 'contents', 'norwegian'), { recursive: true })
    writeFileSync(join(root, 'contents', 'norwegian', '2-1-test.md'), '# Kapittel\nTekst\n')
    // Distinct prefixes matter once both land in dist/publication for review.
    expect(assemble(root, 'en-simple').markdown).not.toEqual(assemble(root, 'nb').markdown)
  })
})

describe('chapter excerpts', () => {
  const both = () => {
    const root = editionRoot('simplified-english', {
      '1-preface.md': '# Preface\nOpening\n',
      '3-1-living.md': '# Living\nLater\n',
    })
    writeFileSync(join(root, 'contents', 'simplified-english', '0-1-authors.md'), '# Authors\nFront matter\n')
    return root
  }

  test('keeps only the requested chapter', () => {
    // What a reviewer signs off on is one chapter in all three editions side by side, and
    // a pipeline that can only emit the whole book cannot produce that until the whole
    // book exists.
    const { markdown } = assembleLocale(both(), 'en-simple', '2024-01-02', credits, { chapters: ['1'] })
    expect(markdown).toContain('Opening')
    expect(markdown).not.toContain('Later')
  })

  test('matches a chapter id without matching a longer one', () => {
    const root = editionRoot('simplified-english', {
      '1-preface.md': '# Preface\nOpening\n',
      '10-other.md': '# Other\nUnrelated\n',
    })
    const { markdown } = assembleLocale(root, 'en-simple', '2024-01-02', credits, { chapters: ['1'] })
    expect(markdown).toContain('Opening')
    expect(markdown).not.toContain('Unrelated')
  })

  test('drops the front matter and the credit ledger', () => {
    // They belong to the book, not the chapter, and would dwarf it in the reviewer's hands.
    const { markdown } = assembleLocale(both(), 'en-simple', '2024-01-02', credits, { chapters: ['1'] })
    expect(markdown).not.toContain('Front matter')
    expect(markdown).not.toContain('Alice')
  })

  test('keeps the front matter when no chapter is named', () => {
    const { markdown } = assembleLocale(both(), 'en-simple', '2024-01-02', credits)
    expect(markdown).toContain('Front matter')
    expect(markdown).toContain('Alice')
  })

  test('refuses a chapter the edition does not have', () => {
    // Silence here would hand the reviewer a PDF containing only a title page.
    expect(() => assembleLocale(both(), 'en-simple', '2024-01-02', credits, { chapters: ['7-0'] })).toThrow(/7-0/)
  })

  test('takes several chapters at once', () => {
    const { markdown } = assembleLocale(both(), 'en-simple', '2024-01-02', credits, { chapters: ['1', '3-1'] })
    expect(markdown).toContain('Opening')
    expect(markdown).toContain('Later')
  })
})

describe('chapter argument parsing', () => {
  test('reads --chapters and --chapter alike', () => {
    expect(parseChapters(['en-simple', 'out', '--chapters=1,2-0'])).toEqual(['1', '2-0'])
    expect(parseChapters(['--chapter=1'])).toEqual(['1'])
  })

  test('is undefined when absent, and rejects an empty list', () => {
    expect(parseChapters(['en-simple', 'out'])).toBeUndefined()
    expect(() => parseChapters(['--chapters='])).toThrow(/at least one/)
  })
})

describe('edition metadata for the renderer', () => {
  test('reads each edition’s own document fields', () => {
    // Parsed from the metadata block rather than duplicated, so the PDF and the manuscript
    // cannot disagree about which edition they are.
    expect(editionMetadata('nb')).toMatchObject({ title: 'Pluralitet', language: 'nb' })
    expect(editionMetadata('en-simple')).toMatchObject({ title: 'Plurality', language: 'en' })
    expect(editionMetadata('zh-TW').language).toBe('zh-TW')
  })
})

describe('where a render is written', () => {
  test('upstream’s finished editions keep upstream’s names', () => {
    // manifest.json, validate-candidate.ts and upstream's release workflow all resolve
    // these exact paths. Renaming them is a change to upstream's interface, not ours.
    expect(editionOutput('en')).toEqual({ dir: 'candidate', stem: 'vivliostyle-en-candidate' })
    expect(editionOutput('zh-TW')).toEqual({ dir: 'candidate', stem: 'vivliostyle-zh-TW-candidate' })
  })

  test('the fork’s editions are named after the edition, not the renderer', () => {
    // Vivliostyle is not a candidate for these two — it is the only renderer they have,
    // so "candidate" would describe a choice that was never offered.
    expect(editionOutput('nb')).toEqual({ dir: 'nb', stem: 'Plurality-norwegian' })
    expect(editionOutput('en-simple')).toEqual({ dir: 'en-simple', stem: 'Plurality-simplified-english' })
  })

  test('an excerpt says which chapter it holds, in every edition', () => {
    // A reviewer is handed one chapter in three editions at once; the three filenames are
    // the only thing telling them apart on disk.
    expect(editionOutput('nb', ['1'])).toEqual({ dir: 'nb', stem: 'Plurality-norwegian_ch-1' })
    expect(editionOutput('en-simple', ['1'])).toEqual({ dir: 'en-simple', stem: 'Plurality-simplified-english_ch-1' })
    expect(editionOutput('en', ['1'])).toEqual({ dir: 'en', stem: 'Plurality-english_ch-1' })
  })

  test('an excerpt never overwrites the edition’s full book', () => {
    for (const edition of EDITIONS) {
      const book = editionOutput(edition)
      const excerpt = editionOutput(edition, ['1'])
      expect(`${excerpt.dir}/${excerpt.stem}`).not.toEqual(`${book.dir}/${book.stem}`)
    }
  })

  test('a multi-chapter excerpt names every chapter it holds', () => {
    expect(editionOutput('nb', ['1', '2-0']).stem).toBe('Plurality-norwegian_ch-1_2-0')
  })

  test('every edition lands somewhere distinct', () => {
    const paths = EDITIONS.map((e) => { const o = editionOutput(e); return `${o.dir}/${o.stem}` })
    expect(new Set(paths).size).toBe(EDITIONS.length)
  })

  test('each fork edition is written beside its own manuscript', () => {
    // edition:assemble:* writes dist/publication/<edition>/, and CI uploads that directory
    // as the edition's artifact. Rendering into it means the PDF ships with the manuscript
    // for free rather than needing its own upload.
    for (const edition of FORK_EDITIONS) expect(editionOutput(edition).dir).toBe(edition)
  })
})
