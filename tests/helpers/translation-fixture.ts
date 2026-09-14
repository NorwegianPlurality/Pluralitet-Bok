import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { validateTranslation, type Issue } from '../../scripts/book/validate-translation'

/**
 * Shared fixtures for the translation checker's tests. The suite is split by concern —
 * parity, cross-references, glossary, structure, prose — and every file builds its
 * throwaway repository through the helpers here, so a change to the on-disk layout is a
 * change in one place rather than in twenty inline literals.
 */

export const FILE = '3-1-test.md'
export const NO_HEADING = '# Å leve i en ⿻ verden'

export const TITLES = [
  'chapter_id\tfile\ten_title\tno_title\tstatus',
  '3-1\t3-1-test.md\tLiving in a ⿻ World\tÅ leve i en ⿻ verden\ttranslated',
  '5-4\t5-4-other.md\tAugmented Deliberation\tUtvidet deliberasjon\tproposed',
].join('\n')

export const GLOSSARY = [
  'en_term\tno_term\tpolicy\tfamily\tfirst_use\tnote',
  'Social Media\tsosiale medier\ttranslate\ttech\t\t',
  'Mandarin\tmandarin\ttranslate\tlanguage\t\t',
  'Quadratic Voting\tKvadratisk Stemmegivning\tgloss\tmechanism\t\t',
  'Rough Consensus\t\ttodo\tpractice\t\t',
].join('\n')

const created: string[] = []

/** Registered as `afterEach(cleanupRepos)` by each test file. */
export function cleanupRepos(): void {
  while (created.length > 0) {
    rmSync(created.pop()!, { recursive: true, force: true })
  }
}

export interface RepoOptions {
  titles?: string
  glossary?: string
}

/** Writes an arbitrary set of paths into a fresh temporary repository root. */
export function repo(files: Record<string, string>, options: RepoOptions = {}): string {
  const root = mkdtempSync(join(tmpdir(), 'plurality-translation-'))
  created.push(root)
  mkdirSync(join(root, 'translation'), { recursive: true })
  for (const layer of ['english', 'simplified-english', 'norwegian']) {
    mkdirSync(join(root, 'contents', layer), { recursive: true })
  }
  writeFileSync(join(root, 'translation', 'chapter-titles.tsv'), options.titles ?? TITLES)
  writeFileSync(join(root, 'translation', 'glossary.tsv'), options.glossary ?? GLOSSARY)
  for (const [path, body] of Object.entries(files)) {
    writeFileSync(join(root, path), body)
  }
  return root
}

export interface Layers {
  english: string
  /** Defaults to `english`, so a test aimed at stage 2 states two layers, not three. */
  simplified?: string
  /** Omitted when the test is aimed at stage 1 only. */
  norwegian?: string
}

/** Builds the one test chapter across the three layers. */
export function chapterRepo(layers: Layers, options: RepoOptions = {}): string {
  const files: Record<string, string> = {
    [`contents/english/${FILE}`]: layers.english,
    [`contents/simplified-english/${FILE}`]: layers.simplified ?? layers.english,
  }
  if (layers.norwegian !== undefined) {
    files[`contents/norwegian/${FILE}`] = layers.norwegian
  }
  return repo(files, options)
}

/** Source long enough to be meaningful, short enough to stay under the length-band gate. */
export const shortSource = (): string => '# T\n' + 'word '.repeat(300) + '\n'

/** Source above the 500-word gate, so the length bands actually apply. */
export const bandedSource = (words = 1000): string => '# T\n' + 'word '.repeat(words) + '\n'

export const errors = (root: string): Issue[] =>
  validateTranslation(root).filter((i) => i.level === 'error')

export const warns = (root: string): Issue[] =>
  validateTranslation(root).filter((i) => i.level === 'warn')
