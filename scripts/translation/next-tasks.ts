import { readChapterTitles, STAGE_LAYERS, type Stage } from './registry'
import { stageState } from './refresh-progress'

/**
 * Emits the set of chapter/stage jobs that can start right now.
 *
 * The dependency graph is deliberately shallow so the book can be worked in parallel:
 * every simplify job depends only on contents/english, so all 36 are independent and
 * can run at once; each translate job depends on its own simplify output and nothing
 * else. There is no chapter-to-chapter dependency, because the shared decisions that
 * would create one — Norwegian chapter titles and settled terminology — are resolved
 * up front in chapter-titles.tsv and glossary.tsv.
 */

export interface Job {
  stage: Stage
  chapterId: string
  file: string
  branch: string
  reason: 'not-started' | 'source-changed'
}

export function readyJobs(root: string): Job[] {
  const jobs: Job[] = []
  for (const t of readChapterTitles(root)) {
    const simplify = stageState(root, 'simplify', t.file)
    const translate = stageState(root, 'translate', t.file)

    if (simplify.status === 'todo' || simplify.stale) {
      jobs.push({
        stage: 'simplify',
        chapterId: t.chapterId,
        file: t.file,
        branch: `simplify/${t.chapterId}`,
        reason: simplify.status === 'todo' ? 'not-started' : 'source-changed',
      })
      // Translating from a source that is about to be rewritten wastes the work.
      continue
    }
    if (translate.status === 'todo' || translate.stale) {
      jobs.push({
        stage: 'translate',
        chapterId: t.chapterId,
        file: t.file,
        branch: `translate/${t.chapterId}`,
        reason: translate.status === 'todo' ? 'not-started' : 'source-changed',
      })
    }
  }
  return jobs
}

if (import.meta.main) {
  const root = process.argv[2] ?? process.cwd()
  const json = process.argv.includes('--json')
  const jobs = readyJobs(root)

  if (json) {
    console.log(JSON.stringify(jobs, null, 2))
  } else {
    const simplify = jobs.filter((j) => j.stage === 'simplify')
    const translate = jobs.filter((j) => j.stage === 'translate')
    console.log(`${jobs.length} job(s) ready to run in parallel\n`)
    for (const [label, set] of [
      ['simplify', simplify],
      ['translate', translate],
    ] as const) {
      if (set.length === 0) continue
      console.log(`${label} (${set.length}):`)
      for (const j of set) console.log(`  ${j.chapterId.padEnd(5)} ${j.file}  [${j.reason}]`)
      console.log('')
    }
  }
}
