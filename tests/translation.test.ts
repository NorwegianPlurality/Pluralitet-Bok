import { describe, expect, test } from 'vitest'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { validateTranslation, proseOnly } from '../scripts/book/validate-translation'

const TITLES = [
  'chapter_id\tfile\ten_title\tno_title\tstatus',
  '3-1\t3-1-test.md\tLiving in a ⿻ World\tÅ leve i en ⿻ verden\ttranslated',
  '5-4\t5-4-other.md\tAugmented Deliberation\tUtvidet deliberasjon\tproposed',
].join('\n')

const GLOSSARY = [
  'en_term\tno_term\tpolicy\tfamily\tfirst_use\tnote',
  'Social Media\tsosiale medier\ttranslate\ttech\t\t',
  'Mandarin\tmandarin\ttranslate\tlanguage\t\t',
  'Quadratic Voting\tKvadratisk Stemmegivning\tgloss\tmechanism\t\t',
  'Rough Consensus\t\ttodo\tpractice\t\t',
].join('\n')

function repo(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'plurality-translation-'))
  mkdirSync(join(root, 'translation'), { recursive: true })
  for (const layer of ['english', 'simplified-english', 'norwegian']) {
    mkdirSync(join(root, 'contents', layer), { recursive: true })
  }
  writeFileSync(join(root, 'translation', 'chapter-titles.tsv'), TITLES)
  writeFileSync(join(root, 'translation', 'glossary.tsv'), GLOSSARY)
  for (const [path, body] of Object.entries(files)) {
    writeFileSync(join(root, path), body)
  }
  return root
}

const errors = (root: string) => validateTranslation(root).filter((i) => i.level === 'error')
const warns = (root: string) => validateTranslation(root).filter((i) => i.level === 'warn')

describe('footnote and figure parity', () => {
  test('accepts a translation that keeps every marker', () => {
    const root = repo({
      'contents/english/3-1-test.md': '# T\nBody[^a] more[^b]\n![x](figs/one.png)\n',
      'contents/simplified-english/3-1-test.md': '# T\nBody[^a] more[^b]\n![x](figs/one.png)\n',
      'contents/norwegian/3-1-test.md': '# Å leve i en ⿻ verden\nTekst[^a] mer[^b]\n![x](figs/one.png)\n',
    })
    expect(errors(root)).toHaveLength(0)
  })

  test('reports a dropped footnote and names it', () => {
    const root = repo({
      'contents/english/3-1-test.md': '# T\nBody[^a] more[^b]\n',
      'contents/simplified-english/3-1-test.md': '# T\nBody[^a] more[^b]\n',
      'contents/norwegian/3-1-test.md': '# Å leve i en ⿻ verden\nTekst[^a]\n',
    })
    const found = errors(root)
    expect(found).toHaveLength(1)
    expect(found[0].check).toBe('translate:parity')
    expect(found[0].message).toContain('b')
  })

  test('catches an inline marker dropped while its definition survives', () => {
    const withBoth = '# T\nBody[^a] more[^b]\n\n[^a]: Source A.\n[^b]: Source B.\n'
    const root = repo({
      'contents/english/3-1-test.md': withBoth,
      'contents/simplified-english/3-1-test.md': withBoth,
      'contents/norwegian/3-1-test.md': '# Å leve i en ⿻ verden\nTekst[^a]\n\n[^a]: Source A.\n[^b]: Source B.\n',
    })
    const found = errors(root)
    expect(found.some((e) => e.message.includes('marker(s) dropped') && e.message.includes('b'))).toBe(true)
    expect(found.some((e) => e.message.includes('unreferenced') && e.message.includes('b'))).toBe(true)
  })

  test('stays silent about an orphan definition inherited from the source', () => {
    // contents/english really does carry orphans of its own; a contributor cannot fix
    // them here and must not be failed for them.
    const orphaned = '# T\nBody[^a]\n\n[^a]: Source A.\n[^stray]: Never cited.\n'
    const root = repo({
      'contents/english/3-1-test.md': orphaned,
      'contents/simplified-english/3-1-test.md': orphaned,
      'contents/norwegian/3-1-test.md': '# Å leve i en ⿻ verden\nTekst[^a]\n\n[^a]: Source A.\n[^stray]: Never cited.\n',
    })
    expect(errors(root)).toHaveLength(0)
  })

  test('reports a dropped figure', () => {
    const root = repo({
      'contents/english/3-1-test.md': '# T\n![x](figs/one.png)\n',
      'contents/simplified-english/3-1-test.md': '# T\n![x](figs/one.png)\n',
      'contents/norwegian/3-1-test.md': '# Å leve i en ⿻ verden\ntekst\n',
    })
    expect(errors(root).some((e) => e.message.includes('one.png'))).toBe(true)
  })
})

describe('cross-chapter links', () => {
  const withLink = (noText: string) => ({
    'contents/english/3-1-test.md':
      '# T\nSee [Augmented Deliberation](https://www.plurality.net/v/chapters/5-4/eng/?mode=dark).\n',
    'contents/simplified-english/3-1-test.md':
      '# T\nSee [Augmented Deliberation](https://www.plurality.net/v/chapters/5-4/eng/?mode=dark).\n',
    'contents/norwegian/3-1-test.md': `# Å leve i en ⿻ verden\nSe [${noText}](https://www.plurality.net/v/chapters/5-4/eng/?mode=dark).\n`,
  })

  test('accepts the registered Norwegian title', () => {
    expect(errors(repo(withLink('Utvidet deliberasjon')))).toHaveLength(0)
  })

  test('rejects a title that departs from the registry', () => {
    const found = errors(repo(withLink('Forsterket drøfting')))
    expect(found).toHaveLength(1)
    expect(found[0].check).toBe('xref:title')
  })

  test('leaves prose link text alone', () => {
    const root = repo({
      'contents/english/3-1-test.md':
        '# T\nSee a [later chapter](https://www.plurality.net/v/chapters/5-4/eng/?mode=dark).\n',
      'contents/simplified-english/3-1-test.md':
        '# T\nSee a [later chapter](https://www.plurality.net/v/chapters/5-4/eng/?mode=dark).\n',
      'contents/norwegian/3-1-test.md':
        '# Å leve i en ⿻ verden\nSe et [senere kapittel](https://www.plurality.net/v/chapters/5-4/eng/?mode=dark).\n',
    })
    expect(errors(root)).toHaveLength(0)
  })

  test('rejects a link to a chapter that does not exist', () => {
    const root = repo({
      'contents/english/3-1-test.md': '# T\ntext\n',
      'contents/simplified-english/3-1-test.md': '# T\ntext\n',
      'contents/norwegian/3-1-test.md':
        '# Å leve i en ⿻ verden\nSe [noe](https://www.plurality.net/v/chapters/9-9/eng/?mode=dark).\n',
    })
    expect(errors(root).some((e) => e.check === 'xref:target')).toBe(true)
  })
})

describe('glossary conformance', () => {
  const norwegian = (body: string) => {
    const src = '# T\n' + 'word '.repeat(300) + '\n'
    return repo({
      'contents/english/3-1-test.md': src,
      'contents/simplified-english/3-1-test.md': src,
      'contents/norwegian/3-1-test.md': `# Å leve i en ⿻ verden\n${body}\n`,
    })
  }

  test('flags an untranslated term as a warning, never an error', () => {
    const root = norwegian('Folk bruker Social Media hver dag.')
    expect(errors(root)).toHaveLength(0)
    expect(warns(root).some((w) => w.check === 'glossary')).toBe(true)
  })

  test('ignores a term that differs only in capitalisation', () => {
    const root = norwegian('På mandarin betyr dette noe annet.')
    expect(warns(root).some((w) => w.message.includes('Mandarin'))).toBe(false)
  })

  test('ignores English inside a work title', () => {
    const root = norwegian('Som Zuboff skriver i *The Age of Social Media*, endrer dette seg.')
    expect(warns(root).some((w) => w.check === 'glossary')).toBe(false)
  })

  test('ignores English inside a proper name', () => {
    const root = norwegian('Rapporten kom fra National Social Media Association i fjor.')
    expect(warns(root).some((w) => w.check === 'glossary')).toBe(false)
  })

  test('flags a gloss term used without its Norwegian rendering', () => {
    const root = norwegian('De brukte Quadratic Voting til å bestemme.')
    expect(warns(root).some((w) => w.message.includes('gloss'))).toBe(true)
  })

  test('accepts a gloss term paired with its Norwegian rendering', () => {
    const root = norwegian('De brukte Kvadratisk Stemmegivning til å bestemme.')
    expect(warns(root).some((w) => w.check === 'glossary')).toBe(false)
  })

  test('enforces nothing for a term still marked todo', () => {
    const root = norwegian('Vi fulgte Rough Consensus i prosessen.')
    expect(warns(root).some((w) => w.message.includes('Rough Consensus'))).toBe(false)
  })
})

describe('length band', () => {
  test('warns when a translation loses a large share of the text', () => {
    const src = '# T\n' + 'word '.repeat(1000) + '\n'
    const root = repo({
      'contents/english/3-1-test.md': src,
      'contents/simplified-english/3-1-test.md': src,
      'contents/norwegian/3-1-test.md': '# Å leve i en ⿻ verden\n' + 'ord '.repeat(300) + '\n',
    })
    expect(warns(root).some((w) => w.check === 'translate:length')).toBe(true)
  })

  // Simplifying is adapting to a reader, not compressing for one. A chapter that comes
  // out of stage 1 at roughly its source length has done nothing wrong, and the checker
  // that said otherwise would push contributors to cut content to satisfy it.
  test('accepts a simplification that stays as long as its source', () => {
    const src = '# T\n' + 'word '.repeat(1000) + '\n'
    const root = repo({
      'contents/english/3-1-test.md': src,
      'contents/simplified-english/3-1-test.md': '# T\n' + 'word '.repeat(1000) + '\n',
    })
    expect(warns(root).some((w) => w.check === 'simplify:length')).toBe(false)
  })

  test('warns when a simplification cuts a third of the text away', () => {
    const src = '# T\n' + 'word '.repeat(1000) + '\n'
    const root = repo({
      'contents/english/3-1-test.md': src,
      'contents/simplified-english/3-1-test.md': '# T\n' + 'word '.repeat(650) + '\n',
    })
    expect(warns(root).some((w) => w.check === 'simplify:length')).toBe(true)
  })
})

describe('pairing', () => {
  test('rejects an output file with no English counterpart', () => {
    const root = repo({
      'contents/english/3-1-test.md': '# T\ntext\n',
      'contents/simplified-english/3-1-test.md': '# T\ntext\n',
      'contents/norwegian/3-1-feil-navn.md': '# Feil\ntekst\n',
    })
    expect(errors(root).some((e) => e.check.endsWith('pairing'))).toBe(true)
  })
})

describe('proseOnly', () => {
  test('drops footnote definitions, links, emphasis and quotations', () => {
    const out = proseOnly(
      ['Se [Democracy in America](https://x.test) her.', '*The Age of Surveillance Capitalism*', '«plural»', '[^a]: Author, Title (2020).'].join('\n'),
    )
    expect(out).not.toContain('Democracy in America')
    expect(out).not.toContain('Surveillance Capitalism')
    expect(out).not.toContain('plural')
    expect(out).not.toContain('Author')
    expect(out).toContain('Se')
  })
})
