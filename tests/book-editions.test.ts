import { describe, expect, test } from 'vitest'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  EDITIONS,
  FORK_EDITIONS,
  UPSTREAM_EDITIONS,
  assembleLocale,
  isEdition,
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
