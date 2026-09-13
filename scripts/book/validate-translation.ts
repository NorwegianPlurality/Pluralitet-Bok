import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  chapterFiles,
  readChapterTitles,
  readGlossary,

  STAGE_LAYERS,
  type GlossaryEntry,
  type Stage,
} from '../translation/registry'

export interface Issue {
  level: 'error' | 'warn'
  chapter: string
  check: string
  message: string
}

/** Word-count bands per stage, set from the ratios observed across completed chapters. */
const RATIO_BANDS: Record<Stage, { min: number; max: number }> = {
  simplify: { min: 0.55, max: 0.95 },
  translate: { min: 0.7, max: 1.15 },
}

/**
 * Inline citation markers, excluding definition lines. The two must be counted
 * separately: `[^x]` matches both the marker in the prose and the `[^x]:` that opens
 * the definition, so a single set would hide the loss of an inline marker whose
 * definition survives — silently unlinking the citation.
 */
const footnoteRefs = (md: string): Set<string> =>
  new Set(
    Array.from(md.matchAll(/\[\^([^\]]+)\](?!:)/g), (m) => m[1]),
  )

const footnoteDefs = (md: string): Set<string> =>
  new Set(
    md
      .split('\n')
      .map((line) => /^\[\^([^\]]+)\]:/.exec(line))
      .filter((m): m is RegExpExecArray => m !== null)
      .map((m) => m[1]),
  )

const figureRefs = (md: string): Set<string> =>
  new Set(Array.from(md.matchAll(/figs\/([A-Za-z0-9._-]+)/g), (m) => m[1]))

const crossRefs = (md: string): Array<{ target: string; text: string }> =>
  Array.from(
    md.matchAll(/\[([^\]]+)\]\(https:\/\/www\.plurality\.net\/v\/chapters\/(\d+-\d+)\/[^)]*\)/g),
    (m) => ({ target: m[2], text: m[1] }),
  )

const wordCount = (md: string): number => md.split(/\s+/).filter(Boolean).length

/**
 * Strips every region where English survives on purpose, so the glossary scan sees
 * only running Norwegian prose. Each removal below corresponds to a real false
 * positive found on the committed chapters:
 *   - footnote definitions are bibliographic and stay in the source language
 *   - link text carries English work titles ("Democracy in America")
 *   - emphasis spans carry the same (*The Age of Surveillance Capitalism*)
 *   - guillemets and quotes carry metalinguistic quotation («plural»)
 *   - HTML attributes, code spans and URLs are not prose at all
 */
export function proseOnly(md: string): string {
  return md
    .split('\n')
    .filter((line) => !/^\[\^[^\]]+\]:/.test(line))
    .join('\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\*[^*\n]+\*/g, ' ')
    .replace(/_[^_\n]+_/g, ' ')
    .replace(/«[^»\n]*»/g, ' ')
    .replace(/[“"][^“”"\n]*[”"]/g, ' ')
}

const titleLike = (a: string, b: string): boolean => {
  const norm = (s: string) => s.replace(/["'“”„]/g, '').replace(/\s+/g, ' ').trim().toLowerCase()
  return norm(a) === norm(b)
}

function checkParity(chapter: string, stage: Stage, src: string, out: string): Issue[] {
  const issues: Issue[] = []
  const label = `${stage}:parity`

  for (const [kind, pick] of [
    ['marker', footnoteRefs],
    ['definition', footnoteDefs],
  ] as const) {
    const srcNotes = pick(src)
    const outNotes = pick(out)
    const lost = [...srcNotes].filter((n) => !outNotes.has(n))
    if (lost.length > 0) {
      issues.push({
        level: 'error',
        chapter,
        check: label,
        message: `${lost.length} footnote ${kind}(s) dropped: ${lost.join(', ')}`,
      })
    }
    const added = [...outNotes].filter((n) => !srcNotes.has(n))
    if (added.length > 0) {
      issues.push({
        level: 'error',
        chapter,
        check: label,
        message: `footnote ${kind}(s) not present in source: ${added.join(', ')}`,
      })
    }
  }

  // An orphan means the citation will not render as a link. Report only orphans this
  // stage introduced: contents/english carries a few of its own (a [^Ngrams] marker
  // against an [^ngrams] definition, for one), and failing a contributor for an
  // upstream defect they cannot fix here would make the check unusable.
  const orphans = (md: string) => ({
    refs: [...footnoteRefs(md)].filter((n) => !footnoteDefs(md).has(n)),
    defs: [...footnoteDefs(md)].filter((n) => !footnoteRefs(md).has(n)),
  })
  const before = orphans(src)
  const after = orphans(out)

  const newDangling = after.refs.filter((n) => !before.refs.includes(n))
  if (newDangling.length > 0) {
    issues.push({
      level: 'error',
      chapter,
      check: label,
      message: `footnote marker(s) left with no definition: ${newDangling.join(', ')}`,
    })
  }
  const newOrphanDefs = after.defs.filter((n) => !before.defs.includes(n))
  if (newOrphanDefs.length > 0) {
    issues.push({
      level: 'error',
      chapter,
      check: label,
      message: `footnote definition(s) left unreferenced: ${newOrphanDefs.join(', ')}`,
    })
  }

  const lostFigs = [...figureRefs(src)].filter((f) => !figureRefs(out).has(f))
  if (lostFigs.length > 0) {
    issues.push({
      level: 'error',
      chapter,
      check: label,
      message: `${lostFigs.length} figure(s) dropped: ${lostFigs.join(', ')}`,
    })
  }
  return issues
}

function checkCrossRefs(
  chapter: string,
  englishMd: string,
  outMd: string,
  titles: ReturnType<typeof readChapterTitles>,
): Issue[] {
  const issues: Issue[] = []
  const byId = new Map(titles.map((t) => [t.chapterId, t]))
  // A chapter is commonly linked several times; report each problem once per target.
  const reported = new Set<string>()
  const once = (key: string, issue: Issue) => {
    if (reported.has(key)) return
    reported.add(key)
    issues.push(issue)
  }

  for (const ref of crossRefs(outMd)) {
    if (!byId.has(ref.target)) {
      once(`target:${ref.target}`, {
        level: 'error',
        chapter,
        check: 'xref:target',
        message: `link points at unknown chapter ${ref.target}`,
      })
    }
  }

  // Only constrain link text where the English used the chapter's actual title.
  // English routinely links with prose ("later chapter", "identity/personhood"),
  // which carries no title commitment and must not be flagged.
  const enRefs = crossRefs(englishMd)
  const outRefs = crossRefs(outMd)
  for (const enRef of enRefs) {
    const entry = byId.get(enRef.target)
    if (!entry || !entry.enTitle || !titleLike(enRef.text, entry.enTitle)) continue
    const match = outRefs.find((r) => r.target === enRef.target)
    if (!match || !entry.noTitle) continue
    if (!titleLike(match.text, entry.noTitle)) {
      once(`title:${enRef.target}`, {
        level: 'error',
        chapter,
        check: 'xref:title',
        message: `link to ${enRef.target} reads "${match.text}" but the registry title is "${entry.noTitle}"`,
      })
    }
  }
  return issues
}

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Finds the English term as a standalone word, ignoring occurrences that sit inside a
 * larger proper name — "Venture Capital" inside "National Venture Capital Association",
 * "Plurality" inside "Plurality Institute". An adjacent capitalised word is the signal.
 */
function standaloneMatch(prose: string, term: string): boolean {
  const re = new RegExp(`(\\S+\\s+)?(?<![\\p{L}])${escapeRe(term)}(?![\\p{L}])(\\s+\\S+)?`, 'gu')
  for (const m of prose.matchAll(re)) {
    const before = (m[1] ?? '').trim()
    const after = (m[2] ?? '').trim()
    const capitalised = (w: string) => /^[\p{Lu}]/u.test(w)
    if (capitalised(before) || capitalised(after)) continue
    return true
  }
  return false
}

/**
 * Glossary conformance is advisory. Unlike footnote parity it rests on judgement —
 * English legitimately survives in quotation, citation and proper names — so findings
 * are warnings that prompt a human look rather than errors that block a merge.
 */
function checkGlossary(chapter: string, outMd: string, glossary: GlossaryEntry[]): Issue[] {
  const issues: Issue[] = []
  const prose = proseOnly(outMd)

  for (const entry of glossary) {
    if (entry.policy === 'todo' || !entry.noTerm) continue
    // A rendering that differs only in capitalisation imposes nothing to check.
    if (entry.noTerm.toLowerCase() === entry.enTerm.toLowerCase()) continue
    if (!standaloneMatch(prose, entry.enTerm)) continue

    if (entry.policy === 'translate') {
      issues.push({
        level: 'warn',
        chapter,
        check: 'glossary',
        message: `"${entry.enTerm}" appears untranslated; glossary prefers "${entry.noTerm}"`,
      })
    }
    if (entry.policy === 'gloss' && !standaloneMatch(prose, entry.noTerm)) {
      issues.push({
        level: 'warn',
        chapter,
        check: 'glossary',
        message: `"${entry.enTerm}" appears without its Norwegian gloss "${entry.noTerm}"`,
      })
    }
  }
  return issues
}

export function validateTranslation(root: string): Issue[] {
  const issues: Issue[] = []
  const titles = readChapterTitles(root)
  const glossary = readGlossary(root)
  const known = new Set(titles.map((t) => t.file))

  for (const stage of ['simplify', 'translate'] as Stage[]) {
    const { from, to } = STAGE_LAYERS[stage]

    for (const file of chapterFiles(root, to)) {
      if (!known.has(file)) {
        issues.push({
          level: 'error',
          chapter: file,
          check: `${stage}:pairing`,
          message: `no row in chapter-titles.tsv; filenames must match contents/english exactly`,
        })
        continue
      }
      const srcPath = join(root, 'contents', from, file)
      if (!existsSync(srcPath)) {
        issues.push({
          level: 'error',
          chapter: file,
          check: `${stage}:pairing`,
          message: `source missing at contents/${from}/${file}`,
        })
        continue
      }

      const src = readFileSync(srcPath, 'utf8')
      const out = readFileSync(join(root, 'contents', to, file), 'utf8')
      issues.push(...checkParity(file, stage, src, out))

      const ratio = wordCount(out) / Math.max(wordCount(src), 1)
      const band = RATIO_BANDS[stage]
      if (wordCount(src) >= 500 && (ratio < band.min || ratio > band.max)) {
        issues.push({
          level: 'warn',
          chapter: file,
          check: `${stage}:length`,
          message: `word ratio ${ratio.toFixed(2)} outside expected ${band.min}–${band.max}; check for dropped passages`,
        })
      }

      if (stage === 'translate') {
        const englishPath = join(root, 'contents', 'english', file)
        if (existsSync(englishPath)) {
          issues.push(...checkCrossRefs(file, readFileSync(englishPath, 'utf8'), out, titles))
        }
        issues.push(...checkGlossary(file, out, glossary))
      }
    }
  }

  const missingTitle = titles.filter((t) => !t.noTitle)
  for (const t of missingTitle) {
    issues.push({
      level: 'error',
      chapter: t.file,
      check: 'registry',
      message: `no Norwegian title registered; cross-references to ${t.chapterId} cannot be checked`,
    })
  }

  return issues
}

export function formatIssues(issues: Issue[]): string {
  if (issues.length === 0) return 'translation: all checks passed'
  const lines = issues
    .slice()
    .sort((a, b) => (a.level === b.level ? a.chapter.localeCompare(b.chapter) : a.level === 'error' ? -1 : 1))
    .map((i) => `${i.level === 'error' ? 'ERROR' : 'warn '}  ${i.chapter}  [${i.check}]  ${i.message}`)
  const errors = issues.filter((i) => i.level === 'error').length
  const warns = issues.length - errors
  return [...lines, '', `${errors} error(s), ${warns} warning(s)`].join('\n')
}

if (import.meta.main) {
  const root = process.argv[2] ?? process.cwd()
  const issues = validateTranslation(root)
  console.log(formatIssues(issues))
  if (issues.some((i) => i.level === 'error')) process.exit(1)
}
