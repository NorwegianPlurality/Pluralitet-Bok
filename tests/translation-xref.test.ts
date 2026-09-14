import { afterEach, describe, expect, test } from 'vitest'
import { chapterRepo, cleanupRepos, errors, NO_HEADING } from './helpers/translation-fixture'

afterEach(cleanupRepos)

const LINK = 'https://www.plurality.net/v/chapters/5-4/eng/?mode=dark'

/**
 * Cross-chapter links are checked in two ways: the target must be a chapter that exists,
 * and where the English linked using a chapter's actual title, the Norwegian must use that
 * chapter's registered title — so that a chapter translated months apart from the one
 * linking to it still agrees with it.
 */

describe('cross-chapter links', () => {
  const withLink = (noText: string) =>
    chapterRepo({
      english: `# T\nSee [Augmented Deliberation](${LINK}).\n`,
      norwegian: `${NO_HEADING}\nSe [${noText}](${LINK}).\n`,
    })

  test('accepts the registered Norwegian title', () => {
    expect(errors(withLink('Utvidet deliberasjon'))).toHaveLength(0)
  })

  test('rejects a title that departs from the registry', () => {
    const found = errors(withLink('Forsterket drøfting'))
    expect(found).toHaveLength(1)
    expect(found[0].check).toBe('xref:title')
  })

  test('names both the text it found and the title it expected', () => {
    const found = errors(withLink('Forsterket drøfting'))
    expect(found[0].message).toContain('Forsterket drøfting')
    expect(found[0].message).toContain('Utvidet deliberasjon')
  })

  test('leaves prose link text alone', () => {
    const root = chapterRepo({
      english: `# T\nSee a [later chapter](${LINK}).\n`,
      norwegian: `${NO_HEADING}\nSe et [senere kapittel](${LINK}).\n`,
    })
    expect(errors(root)).toHaveLength(0)
  })

  test('rejects a link to a chapter that does not exist', () => {
    const root = chapterRepo({
      english: '# T\ntext\n',
      norwegian: `${NO_HEADING}\nSe [noe](https://www.plurality.net/v/chapters/9-9/eng/?mode=dark).\n`,
    })
    expect(errors(root).some((e) => e.check === 'xref:target')).toBe(true)
  })

  test('reports a repeated bad link once, not once per occurrence', () => {
    // A chapter commonly links the same target several times; one wrong decision should
    // produce one finding, or the report drowns the other checks.
    const root = chapterRepo({
      english: `# T\nSee [Augmented Deliberation](${LINK}).\nAnd again [Augmented Deliberation](${LINK}).\n`,
      norwegian: `${NO_HEADING}\nSe [Forsterket drøfting](${LINK}).\nOg igjen [Forsterket drøfting](${LINK}).\n`,
    })
    expect(errors(root).filter((e) => e.check === 'xref:title')).toHaveLength(1)
  })

  test('reports a repeated unknown target once', () => {
    const bad = 'https://www.plurality.net/v/chapters/9-9/eng/?mode=dark'
    const root = chapterRepo({
      english: '# T\ntext\n',
      norwegian: `${NO_HEADING}\nSe [en](${bad}) og [to](${bad}).\n`,
    })
    expect(errors(root).filter((e) => e.check === 'xref:target')).toHaveLength(1)
  })

  test('says nothing about title text for a chapter with no registered title', () => {
    // 5-4 has no Norwegian title yet: the registry has nothing to check the link against,
    // and guessing would be worse than staying quiet. The missing title is reported once,
    // against the registry, not once per chapter that happens to link there.
    const titles = [
      'chapter_id\tfile\ten_title\tno_title\tstatus',
      '3-1\t3-1-test.md\tLiving in a ⿻ World\tÅ leve i en ⿻ verden\ttranslated',
      '5-4\t5-4-other.md\tAugmented Deliberation\t\tpending',
    ].join('\n')
    const root = chapterRepo(
      {
        english: `# T\nSee [Augmented Deliberation](${LINK}).\n`,
        norwegian: `${NO_HEADING}\nSe [hva som helst](${LINK}).\n`,
      },
      { titles },
    )
    expect(errors(root).some((e) => e.check === 'xref:title')).toBe(false)
  })
})
