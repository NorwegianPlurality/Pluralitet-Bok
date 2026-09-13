import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

export type Stage = 'simplify' | 'translate'

/** Source layer each stage reads from, and the layer it writes. */
export const STAGE_LAYERS: Record<Stage, { from: string; to: string }> = {
  simplify: { from: 'english', to: 'simplified-english' },
  translate: { from: 'simplified-english', to: 'norwegian' },
}

export interface ChapterTitle {
  chapterId: string
  file: string
  enTitle: string
  noTitle: string
  status: 'translated' | 'claimed' | 'proposed' | 'pending'
}

export interface GlossaryEntry {
  enTerm: string
  noTerm: string
  policy: 'translate' | 'keep' | 'gloss' | 'todo'
  family: string
  firstUse: string
  note: string
}

export interface ProgressRow {
  chapterId: string
  file: string
  simplifyStatus: string
  simplifySrc: string
  translateStatus: string
  translateSrc: string
  owner: string
}

/**
 * Reads a tab-separated registry. Fields are never quoted: the data is prose that
 * may contain quotes and commas, so a TSV with a hard "no tabs in values" rule
 * stays diffable in a pull request without an escaping layer.
 */
export function readTsv(path: string): string[][] {
  const text = readFileSync(path, 'utf8')
  return text
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => line.split('\t'))
    .slice(1)
}

export function readChapterTitles(root: string): ChapterTitle[] {
  return readTsv(join(root, 'translation', 'chapter-titles.tsv')).map((r) => ({
    chapterId: r[0],
    file: r[1],
    enTitle: r[2] ?? '',
    noTitle: r[3] ?? '',
    status: (r[4] ?? 'pending') as ChapterTitle['status'],
  }))
}

export function readGlossary(root: string): GlossaryEntry[] {
  return readTsv(join(root, 'translation', 'glossary.tsv')).map((r) => ({
    enTerm: r[0],
    noTerm: r[1] ?? '',
    policy: (r[2] ?? 'todo') as GlossaryEntry['policy'],
    family: r[3] ?? '',
    firstUse: r[4] ?? '',
    note: r[5] ?? '',
  }))
}

export function readProgress(root: string): ProgressRow[] {
  const path = join(root, 'translation', 'progress.tsv')
  if (!existsSync(path)) return []
  return readTsv(path).map((r) => ({
    chapterId: r[0],
    file: r[1],
    simplifyStatus: r[2] ?? 'todo',
    simplifySrc: r[3] ?? '',
    translateStatus: r[4] ?? 'todo',
    translateSrc: r[5] ?? '',
    owner: r[6] ?? '',
  }))
}

/**
 * Glossary terms proposed by in-flight chapter work. One file per chapter so that
 * parallel branches never touch the same path; a maintainer folds them into
 * glossary.tsv between waves.
 */
export function readProposals(root: string): GlossaryEntry[] {
  const dir = join(root, 'translation', 'proposals')
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.tsv'))
    .flatMap((f) =>
      readTsv(join(dir, f)).map((r) => ({
        enTerm: r[0],
        noTerm: r[1] ?? '',
        policy: (r[2] ?? 'todo') as GlossaryEntry['policy'],
        family: r[3] ?? '',
        firstUse: r[4] ?? '',
        note: r[5] ?? '',
      })),
    )
}

export function chapterFiles(root: string, layer: string): string[] {
  const dir = join(root, 'contents', layer)
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md') && f !== 'CLAUDE.md' && f !== 'AGENTS.md')
    .sort()
}
