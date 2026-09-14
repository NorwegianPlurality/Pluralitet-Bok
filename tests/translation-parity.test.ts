import { afterEach, describe, expect, test } from 'vitest'
import { chapterRepo, cleanupRepos, errors, NO_HEADING } from './helpers/translation-fixture'

afterEach(cleanupRepos)

/**
 * Citation and figure parity is the one rule that blocks a merge, because a dropped
 * citation is invisible until typesetting. Both stages are checked: a marker lost while
 * simplifying is lost just as permanently as one lost while translating, and stage 1 is
 * where most of the real losses have happened.
 */

describe('translate stage', () => {
  test('accepts a translation that keeps every marker', () => {
    const root = chapterRepo({
      english: '# T\nBody[^Deming] more[^Granovetter]\n![x](figs/one.png)\n',
      norwegian: `${NO_HEADING}\nTekst[^Deming] mer[^Granovetter]\n![x](figs/one.png)\n`,
    })
    expect(errors(root)).toHaveLength(0)
  })

  test('reports a dropped footnote and names it', () => {
    const root = chapterRepo({
      english: '# T\nBody[^Deming] more[^Granovetter]\n',
      norwegian: `${NO_HEADING}\nTekst[^Deming]\n`,
    })
    const found = errors(root)
    expect(found).toHaveLength(1)
    expect(found[0].check).toBe('translate:parity')
    expect(found[0].message).toContain('Granovetter')
    expect(found[0].message).not.toContain('Deming')
  })

  test('catches an inline marker dropped while its definition survives', () => {
    const withBoth = '# T\nBody[^Deming] more[^Granovetter]\n\n[^Deming]: Source A.\n[^Granovetter]: Source B.\n'
    const root = chapterRepo({
      english: withBoth,
      norwegian: `${NO_HEADING}\nTekst[^Deming]\n\n[^Deming]: Source A.\n[^Granovetter]: Source B.\n`,
    })
    const found = errors(root)
    expect(found.some((e) => e.message.includes('marker(s) dropped') && e.message.includes('Granovetter'))).toBe(true)
    expect(found.some((e) => e.message.includes('unreferenced') && e.message.includes('Granovetter'))).toBe(true)
  })

  test('catches a definition dropped from under a surviving marker', () => {
    const withBoth = '# T\nBody[^Deming]\n\n[^Deming]: Source A.\n'
    const root = chapterRepo({
      english: withBoth,
      norwegian: `${NO_HEADING}\nTekst[^Deming]\n`,
    })
    const found = errors(root)
    expect(found.some((e) => e.message.includes('definition(s) dropped') && e.message.includes('Deming'))).toBe(true)
    expect(found.some((e) => e.message.includes('no definition') && e.message.includes('Deming'))).toBe(true)
  })

  test('rejects a citation the stage invented', () => {
    const root = chapterRepo({
      english: '# T\nBody[^Deming]\n\n[^Deming]: Source A.\n',
      norwegian: `${NO_HEADING}\nTekst[^Deming] og[^Oppfunnet]\n\n[^Deming]: Source A.\n`,
    })
    expect(
      errors(root).some((e) => e.message.includes('not present in source') && e.message.includes('Oppfunnet')),
    ).toBe(true)
  })

  test('stays silent about an orphan definition inherited from the source', () => {
    // contents/english really does carry orphans of its own; a contributor cannot fix
    // them here and must not be failed for them.
    const orphaned = '# T\nBody[^Deming]\n\n[^Deming]: Source A.\n[^stray]: Never cited.\n'
    const root = chapterRepo({
      english: orphaned,
      norwegian: `${NO_HEADING}\nTekst[^Deming]\n\n[^Deming]: Source A.\n[^stray]: Never cited.\n`,
    })
    expect(errors(root)).toHaveLength(0)
  })

  test('reports a dropped figure', () => {
    const root = chapterRepo({
      english: '# T\n![x](figs/one.png)\n',
      norwegian: `${NO_HEADING}\ntekst\n`,
    })
    expect(errors(root).some((e) => e.message.includes('one.png'))).toBe(true)
  })
})

describe('simplify stage', () => {
  test('reports a marker dropped while simplifying, against that stage', () => {
    const root = chapterRepo({
      english: '# T\nBody[^Deming] more[^Granovetter]\n',
      simplified: '# T\nBody[^Deming]\n',
    })
    const found = errors(root)
    expect(found).toHaveLength(1)
    expect(found[0].check).toBe('simplify:parity')
    expect(found[0].message).toContain('Granovetter')
  })

  test('reports a figure dropped while simplifying', () => {
    const root = chapterRepo({
      english: '# T\ntext\n![x](figs/one.png)\n',
      simplified: '# T\ntext\n',
    })
    expect(errors(root).some((e) => e.check === 'simplify:parity' && e.message.includes('one.png'))).toBe(true)
  })

  test('attributes a loss to the stage that caused it, not to both', () => {
    // The English keeps both; stage 1 drops one; stage 2 faithfully carries what it was
    // given. Only stage 1 is at fault, and only stage 1 should be told.
    const root = chapterRepo({
      english: '# T\nBody[^Deming] more[^Granovetter]\n',
      simplified: '# T\nBody[^Deming]\n',
      norwegian: `${NO_HEADING}\nTekst[^Deming]\n`,
    })
    const found = errors(root)
    expect(found.every((e) => e.check === 'simplify:parity')).toBe(true)
    expect(found.some((e) => e.check === 'translate:parity')).toBe(false)
  })
})
