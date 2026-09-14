import { execFileSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { readChapterTitles, STAGE_LAYERS, type Stage } from './registry'

/**
 * progress.tsv is derived, never hand-edited. Contributors working in parallel would
 * otherwise all touch the same rows and conflict on every merge; regenerating from git
 * makes the file a report rather than a shared mutable input.
 */

const git = (root: string, args: string[]): string => {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}

const blobOf = (root: string, path: string): string =>
  existsSync(join(root, path)) ? git(root, ['hash-object', path]) : ''

/**
 * The blob a stage actually derived from: the source as it stood when the output was
 * last committed. Resolved by date across all refs, because a stage's output and its
 * source may have been committed on different branches before being merged.
 */
function sourceAsDerived(root: string, sourcePath: string, outputPath: string): string {
  const outCommit = git(root, ['log', '--follow', '--format=%H', '-1', '--', outputPath])
  if (!outCommit) return ''
  const when = git(root, ['log', '-1', '--format=%cI', outCommit])
  if (!when) return ''
  const srcCommit = git(root, ['rev-list', '-1', `--before=${when}`, '--all', '--', sourcePath])
  if (!srcCommit) return ''
  return git(root, ['rev-parse', '--verify', '--quiet', `${srcCommit}:${sourcePath}`])
}

export interface StageState {
  status: 'todo' | 'done'
  derivedFrom: string
  current: string
  stale: boolean
}

export function stageState(root: string, stage: Stage, file: string): StageState {
  const { from, to } = STAGE_LAYERS[stage]
  const outputPath = `contents/${to}/${file}`
  const sourcePath = `contents/${from}/${file}`
  if (!existsSync(join(root, outputPath))) {
    return { status: 'todo', derivedFrom: '', current: blobOf(root, sourcePath), stale: false }
  }
  const derivedFrom = sourceAsDerived(root, sourcePath, outputPath)
  const current = blobOf(root, sourcePath)
  return {
    status: 'done',
    derivedFrom,
    current,
    stale: Boolean(derivedFrom) && Boolean(current) && derivedFrom !== current,
  }
}

export function buildProgress(root: string): string {
  const rows = [['chapter_id', 'file', 'simplify', 'simplify_src', 'translate', 'translate_src'].join('\t')]
  for (const t of readChapterTitles(root)) {
    const s = stageState(root, 'simplify', t.file)
    const x = stageState(root, 'translate', t.file)
    rows.push(
      [
        t.chapterId,
        t.file,
        s.stale ? 'stale' : s.status,
        s.derivedFrom,
        x.stale ? 'stale' : x.status,
        x.derivedFrom,
      ].join('\t'),
    )
  }
  return rows.join('\n') + '\n'
}

if (import.meta.main) {
  const root = process.argv[2] ?? process.cwd()
  const out = buildProgress(root)
  writeFileSync(join(root, 'translation', 'progress.tsv'), out)
  const lines = out.split('\n').slice(1).filter(Boolean)
  const stale = lines.filter((l) => l.split('\t').includes('stale'))
  console.log(`progress.tsv refreshed: ${lines.length} chapters, ${stale.length} stale`)
  for (const l of stale) {
    const f = l.split('\t')
    console.log(`  stale  ${f[1]}  (simplify=${f[2]}, translate=${f[4]})`)
  }
}
