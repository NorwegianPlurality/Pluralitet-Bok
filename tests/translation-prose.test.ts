import { describe, expect, test } from 'vitest'
import { formatIssues, proseOnly, type Issue } from '../scripts/book/validate-translation'

/**
 * `proseOnly` strips every region where English survives on purpose, so the glossary scan
 * sees only running Norwegian. Each rule below corresponds to a false positive found on a
 * committed chapter, so each gets its own test: when one rule regresses, the failure
 * should name which.
 */

describe('proseOnly', () => {
  test('drops footnote definitions', () => {
    expect(proseOnly('Tekst her.\n[^a]: Author, Title (2020).')).not.toContain('Author')
  })

  test('drops link text carrying an English work title', () => {
    const out = proseOnly('Se [Democracy in America](https://x.test) her.')
    expect(out).not.toContain('Democracy in America')
    expect(out).toContain('Se')
  })

  test('drops emphasis spans, both asterisk and underscore', () => {
    expect(proseOnly('*The Age of Surveillance Capitalism*')).not.toContain('Surveillance')
    expect(proseOnly('_The Age of Surveillance Capitalism_')).not.toContain('Surveillance')
  })

  test('drops metalinguistic quotation in guillemets and in quotes', () => {
    expect(proseOnly('Ordet «plural» betyr noe eget.')).not.toContain('plural')
    expect(proseOnly('Ordet "plural" betyr noe eget.')).not.toContain('plural')
  })

  test('drops HTML markup, not just the quoted part of it', () => {
    // The ⿻ symbol ships as <span aria-label="Plurality">⿻</span>. The quoted value would
    // fall to the quotation rule anyway; what only the markup rule removes is the tag and
    // the attribute name around it, so assert on those or this test proves nothing.
    const out = proseOnly('Tegnet <span aria-label="Plurality">⿻</span> står alene.')
    expect(out).not.toContain('Plurality')
    expect(out).not.toContain('aria-label')
    expect(out).not.toContain('span')
    expect(out).toContain('Tegnet')
  })

  test('drops code spans', () => {
    expect(proseOnly('Kjør `vp run translation:validate` først.')).not.toContain('translation')
  })

  test('drops bare URLs', () => {
    expect(proseOnly('Se https://example.test/social-media for mer.')).not.toContain('example.test')
  })

  test('leaves ordinary Norwegian prose intact', () => {
    const line = 'Folk bruker sosiale medier hver dag.'
    expect(proseOnly(line)).toContain(line)
  })
})

describe('formatIssues', () => {
  const issue = (over: Partial<Issue> = {}): Issue => ({
    level: 'error',
    chapter: '3-1-test.md',
    check: 'translate:parity',
    message: 'something went wrong',
    ...over,
  })

  test('reports a clean run in one line', () => {
    expect(formatIssues([])).toBe('translation: all checks passed')
  })

  test('puts errors above warnings', () => {
    const out = formatIssues([issue({ level: 'warn', check: 'glossary' }), issue()])
    expect(out.indexOf('ERROR')).toBeLessThan(out.indexOf('warn'))
  })

  test('counts each level in the summary', () => {
    const out = formatIssues([issue(), issue(), issue({ level: 'warn' })])
    expect(out).toContain('2 error(s), 1 warning(s)')
  })

  test('names the chapter and the check on every line', () => {
    const out = formatIssues([issue()])
    expect(out).toContain('3-1-test.md')
    expect(out).toContain('[translate:parity]')
    expect(out).toContain('something went wrong')
  })
})
