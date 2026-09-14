import { afterEach, describe, expect, test } from 'vitest'
import {
  chapterRepo,
  cleanupRepos,
  errors,
  NO_HEADING,
  shortSource,
  warns,
} from './helpers/translation-fixture'

afterEach(cleanupRepos)

/**
 * Glossary conformance is advisory. It rests on judgement — English legitimately survives
 * in quotation, citation and proper names — so findings are warnings that prompt a human
 * look rather than errors that block a merge.
 */

const norwegian = (body: string) =>
  chapterRepo({ english: shortSource(), norwegian: `${NO_HEADING}\n${body}\n` })

const glossaryWarns = (root: string) => warns(root).filter((w) => w.check === 'glossary')

describe('glossary conformance', () => {
  test('flags an untranslated term as a warning, never an error', () => {
    const root = norwegian('Folk bruker Social Media hver dag.')
    expect(errors(root)).toHaveLength(0)
    expect(glossaryWarns(root)).not.toHaveLength(0)
  })

  test('ignores a term that differs only in capitalisation', () => {
    const root = norwegian('På mandarin betyr dette noe annet.')
    expect(warns(root).some((w) => w.message.includes('Mandarin'))).toBe(false)
  })

  test('ignores English inside a work title', () => {
    const root = norwegian('Som Zuboff skriver i *The Age of Social Media*, endrer dette seg.')
    expect(glossaryWarns(root)).toHaveLength(0)
  })

  test('ignores English inside a proper name', () => {
    const root = norwegian('Rapporten kom fra National Social Media Association i fjor.')
    expect(glossaryWarns(root)).toHaveLength(0)
  })

  test('flags a gloss term used without its Norwegian rendering', () => {
    const root = norwegian('De brukte Quadratic Voting til å bestemme.')
    expect(warns(root).some((w) => w.message.includes('gloss'))).toBe(true)
  })

  test('accepts a gloss term paired with its Norwegian rendering', () => {
    const root = norwegian('De brukte Kvadratisk Stemmegivning til å bestemme.')
    expect(glossaryWarns(root)).toHaveLength(0)
  })

  test('enforces nothing for a term still marked todo', () => {
    const root = norwegian('Vi fulgte Rough Consensus i prosessen.')
    expect(warns(root).some((w) => w.message.includes('Rough Consensus'))).toBe(false)
  })
})

describe('the proper-name heuristic', () => {
  // A capitalised neighbour is the signal that the term sits inside a larger name. These
  // pin which side of the term the heuristic looks at, because both sides matter and a
  // one-sided implementation would still pass the test above.
  test('ignores a term whose name continues to the right', () => {
    expect(glossaryWarns(norwegian('Han nevnte Social Media Norge i forbifarten.'))).toHaveLength(0)
  })

  test('still flags a term whose neighbours are ordinary words', () => {
    expect(glossaryWarns(norwegian('Derfor er Social Media viktig for oss.'))).not.toHaveLength(0)
  })

  test('still flags a term that opens the line', () => {
    expect(glossaryWarns(norwegian('Social Media endrer alt for oss.'))).not.toHaveLength(0)
  })

  // KNOWN LIMITATION, pinned deliberately rather than left undiscovered.
  //
  // The heuristic reads the adjacent word without regard for sentence boundaries, so a
  // term opening a sentence whose predecessor ended on a capitalised word reads as part
  // of a proper name and is skipped. Norwegian prose ends sentences on proper nouns
  // constantly — Norge, Taiwan, Google — so this is a real miss, not a corner case.
  //
  // This test asserts what the checker does today. When the heuristic learns about
  // sentence boundaries it will fail, which is the point: flip it to `not.toHaveLength(0)`
  // at that moment. Nothing here blocks a merge — the whole check is advisory.
  test('misses a term opening a sentence after a capitalised word', () => {
    expect(glossaryWarns(norwegian('Det gjelder Norge. Social Media dominerer nå.'))).toHaveLength(0)
  })
})

describe('term survival through stage 1', () => {
  // The translator applies the glossary by finding the English term. A term paraphrased
  // out while simplifying takes its settled decision with it, and no Norwegian-side scan
  // can notice, because by then the term is simply not there.
  test('warns when simplifying drops a glossary term', () => {
    const root = chapterRepo({
      english: '# T\n' + 'word '.repeat(300) + '\nDe brukte Quadratic Voting her.\n',
      simplified: '# T\n' + 'word '.repeat(300) + '\nDe stemte på en ny måte.\n',
    })
    expect(
      warns(root).some((w) => w.check === 'simplify:terms' && w.message.includes('Quadratic Voting')),
    ).toBe(true)
  })

  test('stays quiet when the term survives', () => {
    const body = '# T\n' + 'word '.repeat(300) + '\nDe brukte Quadratic Voting her.\n'
    const root = chapterRepo({ english: body, simplified: body })
    expect(warns(root).some((w) => w.check === 'simplify:terms')).toBe(false)
  })

  test('says nothing about a term the English never used', () => {
    const root = chapterRepo({ english: shortSource(), simplified: shortSource() })
    expect(warns(root).some((w) => w.check === 'simplify:terms')).toBe(false)
  })
})
