import { describe, expect, it } from 'vitest'
import {
  OMITTED,
  OVERLAY_DIR,
  parseTree,
  publicationTree,
  type TreeEntry,
} from '../scripts/translation/rebuild-simplify'

/**
 * The publication branch's tree mapping. The rebuild's git plumbing is not worth
 * simulating, but the mapping is: it decides what a published edition contains, and its
 * failure mode is silent — a Norwegian chapter or a Norwegian front page shipped in an
 * English edition looks like nothing at all until someone reads the branch.
 */

const entry = (path: string, oid = 'a'.repeat(40)): TreeEntry => ({
  mode: '100644',
  type: 'blob',
  oid,
  path,
})

const paths = (entries: TreeEntry[]): string[] => entries.map((e) => e.path)

describe('publication tree mapping', () => {
  const source = [
    entry('ReadMe.md', 'b'.repeat(40)),
    entry('AGENTS.md', 'c'.repeat(40)),
    entry('CLAUDE.md'),
    entry('contents/english/3-1.md'),
    entry('contents/simplified-english/3-1.md'),
    entry('contents/norwegian/3-1.md'),
    entry('translation/glossary.tsv'),
    entry(`${OVERLAY_DIR}/ReadMe.md`, 'd'.repeat(40)),
    entry(`${OVERLAY_DIR}/AGENTS.md`, 'e'.repeat(40)),
  ]

  it('drops the Norwegian layer', () => {
    expect(paths(publicationTree(source))).not.toContain('contents/norwegian/3-1.md')
  })

  it('keeps the English and simplified-English layers', () => {
    const out = paths(publicationTree(source))
    expect(out).toContain('contents/english/3-1.md')
    expect(out).toContain('contents/simplified-english/3-1.md')
  })

  it('keeps the shared registries and the tooling pointers', () => {
    const out = paths(publicationTree(source))
    expect(out).toContain('translation/glossary.tsv')
    expect(out).toContain('CLAUDE.md')
  })

  it('replaces root files with their overlay versions rather than adding them', () => {
    const out = publicationTree(source)
    expect(out.filter((e) => e.path === 'ReadMe.md')).toHaveLength(1)
    expect(out.find((e) => e.path === 'ReadMe.md')?.oid).toBe('d'.repeat(40))
    expect(out.find((e) => e.path === 'AGENTS.md')?.oid).toBe('e'.repeat(40))
  })

  it('does not leave the overlay directory in the snapshot', () => {
    // Left behind, it would be a second copy of the front page on the published branch,
    // and the obvious place for someone to edit it — on the branch that gets discarded.
    expect(paths(publicationTree(source)).some((p) => p.startsWith(`${OVERLAY_DIR}/`))).toBe(false)
  })

  it('is stable when it runs against its own output', () => {
    // A rebuild is run repeatedly. Mapping an already-mapped tree must not resurrect or
    // drop anything, or a second refresh would differ from the first.
    const once = publicationTree(source)
    expect(paths(publicationTree(once))).toEqual(paths(once))
  })

  it('does not drop paths that merely share a prefix with an omitted directory', () => {
    const out = paths(publicationTree([entry('contents/norwegian-notes/a.md'), ...source]))
    expect(out).toContain('contents/norwegian-notes/a.md')
  })

  it('omits the overlay directory as well as the Norwegian layer', () => {
    expect(OMITTED).toContain('contents/norwegian')
    expect(OMITTED).toContain(OVERLAY_DIR)
  })
})

describe('tree parsing', () => {
  it('reads NUL-delimited ls-tree output', () => {
    const oid = 'f'.repeat(40)
    const out = parseTree(`100644 blob ${oid}\tReadMe.md\x00100644 blob ${oid}\tAGENTS.md\x00`)
    expect(paths(out)).toEqual(['ReadMe.md', 'AGENTS.md'])
    expect(out[0]).toMatchObject({ mode: '100644', type: 'blob', oid })
  })

  it('survives a path containing a space', () => {
    // contents/english carries filenames with spaces; a newline-split parser would
    // still pass every other test here and corrupt exactly those entries.
    const out = parseTree(`100644 blob ${'0'.repeat(40)}\tcontents/english/a b.md\x00`)
    expect(paths(out)).toEqual(['contents/english/a b.md'])
  })
})
