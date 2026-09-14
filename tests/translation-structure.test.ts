import { afterEach, describe, expect, test } from 'vitest'
import {
  bandedSource,
  chapterRepo,
  cleanupRepos,
  errors,
  FILE,
  NO_HEADING,
  repo,
  shortSource,
  warns,
} from './helpers/translation-fixture'

afterEach(cleanupRepos)

const lengthWarns = (root: string, stage: string) =>
  warns(root).filter((w) => w.check === `${stage}:length`)

/**
 * Neither stage is a compression stage, so the bands sit around parity. The lower bound
 * catches a stage that quietly dropped a passage; the upper bound catches one that
 * started adding material of its own. Both bounds are checked for both stages, because a
 * band with an untested side is a band with one real edge.
 */

describe('length band, translate', () => {
  test('warns when a translation loses a large share of the text', () => {
    const root = chapterRepo({
      english: bandedSource(),
      norwegian: `${NO_HEADING}\n` + 'ord '.repeat(300) + '\n',
    })
    expect(lengthWarns(root, 'translate')).not.toHaveLength(0)
    expect(lengthWarns(root, 'translate')[0].message).toContain('below')
  })

  test('warns when a translation grows well past its source', () => {
    const root = chapterRepo({
      english: bandedSource(),
      norwegian: `${NO_HEADING}\n` + 'ord '.repeat(1500) + '\n',
    })
    expect(lengthWarns(root, 'translate')).not.toHaveLength(0)
    expect(lengthWarns(root, 'translate')[0].message).toContain('above')
  })

  test('accepts the mild shortening Bokmål compounding produces', () => {
    const root = chapterRepo({
      english: bandedSource(),
      norwegian: `${NO_HEADING}\n` + 'ord '.repeat(900) + '\n',
    })
    expect(lengthWarns(root, 'translate')).toHaveLength(0)
  })
})

describe('length band, simplify', () => {
  // Simplifying is adapting to a reader, not compressing for one. A chapter that comes
  // out of stage 1 at roughly its source length has done nothing wrong, and the checker
  // that said otherwise would push contributors to cut content to satisfy it.
  test('accepts a simplification that stays as long as its source', () => {
    const root = chapterRepo({ english: bandedSource(), simplified: bandedSource() })
    expect(lengthWarns(root, 'simplify')).toHaveLength(0)
  })

  test('warns when a simplification cuts a third of the text away', () => {
    const root = chapterRepo({ english: bandedSource(), simplified: bandedSource(650) })
    expect(lengthWarns(root, 'simplify')).not.toHaveLength(0)
    expect(lengthWarns(root, 'simplify')[0].message).toContain('below')
  })

  test('warns when a simplification pads the chapter out', () => {
    const root = chapterRepo({ english: bandedSource(), simplified: bandedSource(1500) })
    expect(lengthWarns(root, 'simplify')[0].message).toContain('above')
  })
})

describe('the short-chapter gate', () => {
  // Endorsements, the preface, the credits: chapters of a few hundred words where a word
  // ratio says nothing. The gate is why they do not warn, and it is load-bearing — lower
  // it and the short front matter starts failing its own contributors.
  test('says nothing about a short chapter however far the ratio moves', () => {
    const root = chapterRepo({
      english: shortSource(),
      norwegian: `${NO_HEADING}\nBare noen få ord her.\n`,
    })
    expect(lengthWarns(root, 'translate')).toHaveLength(0)
  })

  test('applies the band once the source is long enough', () => {
    const root = chapterRepo({
      english: bandedSource(600),
      norwegian: `${NO_HEADING}\nBare noen få ord her.\n`,
    })
    expect(lengthWarns(root, 'translate')).not.toHaveLength(0)
  })
})

describe('pairing', () => {
  test('rejects an output file with no English counterpart', () => {
    const root = repo({
      [`contents/english/${FILE}`]: '# T\ntext\n',
      [`contents/simplified-english/${FILE}`]: '# T\ntext\n',
      'contents/norwegian/3-1-feil-navn.md': '# Feil\ntekst\n',
    })
    expect(errors(root).some((e) => e.check.endsWith('pairing'))).toBe(true)
  })

  test('rejects a translation whose stage-1 source was never written', () => {
    // Translating straight from the English skips the stage the pipeline exists for, and
    // leaves nothing for the parity check to compare against.
    const root = repo({
      [`contents/english/${FILE}`]: '# T\ntext\n',
      [`contents/norwegian/${FILE}`]: `${NO_HEADING}\ntekst\n`,
    })
    const found = errors(root).filter((e) => e.check === 'translate:pairing')
    expect(found).toHaveLength(1)
    expect(found[0].message).toContain('simplified-english')
  })
})

describe('registry', () => {
  test('reports a chapter with no Norwegian title registered', () => {
    const titles = [
      'chapter_id\tfile\ten_title\tno_title\tstatus',
      '3-1\t3-1-test.md\tLiving in a ⿻ World\tÅ leve i en ⿻ verden\ttranslated',
      '5-4\t5-4-other.md\tAugmented Deliberation\t\tpending',
    ].join('\n')
    const root = chapterRepo({ english: '# T\ntext\n' }, { titles })
    const found = errors(root).filter((e) => e.check === 'registry')
    expect(found).toHaveLength(1)
    expect(found[0].chapter).toBe('5-4-other.md')
  })

  test('stays quiet when every chapter has a title', () => {
    const root = chapterRepo({ english: '# T\ntext\n' })
    expect(errors(root).some((e) => e.check === 'registry')).toBe(false)
  })
})
