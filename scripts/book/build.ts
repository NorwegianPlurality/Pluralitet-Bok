import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, basename } from 'node:path'
import { writeManifest } from './manifest'

/**
 * The editions this repository can assemble.
 *
 * `en` and `zh-TW` come from upstream and are complete. `en-simple` and `nb` are this
 * fork's, and are partial — a chapter appears in them as it is simplified or translated.
 * Each is assembled and verified on its own, because each is signed off on its own: an
 * editor reviews an edition before it is published, and cannot do that against a build
 * that only succeeds when every edition is finished.
 */
export type Locale = 'en' | 'zh-TW' | 'en-simple' | 'nb'

/** Upstream's editions, which `all` builds and the release pipeline publishes. */
export const UPSTREAM_EDITIONS: Locale[] = ['en', 'zh-TW']

/** This fork's editions, built and verified separately from upstream's. */
export const FORK_EDITIONS: Locale[] = ['en-simple', 'nb']

export const EDITIONS: Locale[] = [...UPSTREAM_EDITIONS, ...FORK_EDITIONS]

export const isEdition = (value: string): value is Locale => (EDITIONS as string[]).includes(value)

/** Reads `--chapters=1,2-0` (or `--chapter=1`) out of an argv slice. */
export function parseChapters(argv: string[]): string[] | undefined {
  const arg = argv.find((a) => a.startsWith('--chapters=') || a.startsWith('--chapter='))
  if (!arg) return undefined
  const ids = arg.slice(arg.indexOf('=') + 1).split(',').map((s) => s.trim()).filter(Boolean)
  if (ids.length === 0) throw new Error('--chapters needs at least one chapter id, e.g. --chapters=1')
  return ids
}

type CreditContributor = { name: string; pt: number }
type CreditCategory = { name: string; contributors: CreditContributor[] }
type Credits = { categories: CreditCategory[]; i18n?: Record<string, { categories?: Record<string, string> }> }
type LocaleConfig = {
  directory: string
  filePrefix: string
  metadata: string
  sections: Record<number, string>
  labels: 'en' | 'zh'
  endorsement: 'en' | 'zh'
  endorsementFile: string
  footnoteSeparator: string
  /**
   * True for an edition assembled while it is still being written, where a chapter joins
   * as it is simplified or translated. Upstream's editions are complete, and for them a
   * missing front-matter file is a broken checkout rather than work not yet done — so it
   * stays an error there, and publishing an upstream book minus its endorsements stays
   * impossible.
   */
  partial?: boolean
  /**
   * Credit category names for editions whose language is not in scripts/credits.json.
   * That file is upstream's; a fork edition overrides the labels here rather than adding
   * a key to it and creating a conflict on every sync.
   */
  categoryLabels?: Record<string, string>
}

const configs: Record<Locale, LocaleConfig> = {
  en: {
    directory: 'english', filePrefix: 'Plurality-english', labels: 'en', endorsement: 'en', endorsementFile: '0-0-endorsements.md', footnoteSeparator: '-',
    metadata: 'title: Plurality\nsubtitle: "The Future of Collaborative Technology and Democracy"\nauthor: "E. Glen Weyl, Audrey Tang and ⿻ Community"\nlang: en\ncover-image: scripts/cover-image.png \nmainfont: "Noto Serif"\nlinestretch: 1.25',
    sections: { 1: 'Section 1: Preface', 2: 'Section 2: Introduction', 3: 'Section 3: Plurality', 4: 'Section 4: Freedom', 5: 'Section 5: Democracy', 6: 'Section 6: Impact', 7: 'Section 7: Forward', 0: 'Endorsements' },
  },
  'zh-TW': {
    directory: 'traditional-mandarin', filePrefix: 'Plurality-traditional-mandarin', labels: 'zh', endorsement: 'zh', endorsementFile: '0-0-名家推薦.md', footnoteSeparator: '_',
    metadata: 'title: 多元宇宙\nsubtitle: 協作技術與民主的未來\nauthor: 衛谷倫、唐鳳、⿻社群\nlang: zh-TW\ncover-image: scripts/cover-image.zh-tw.png \nlinestretch: 1.25',
    sections: { 1: '一、序章', 2: '二、導論', 3: '三、多元', 4: '四、自由', 5: '五、民主', 6: '六、影響', 7: '七、前行', 0: '名家推薦' },
  },
  // Same language as `en`, so it shares the credit labels and the footnote separator, and
  // differs only in which directory it reads. The title stays the original's: this is the
  // same book in plainer English, not a different one.
  'en-simple': {
    directory: 'simplified-english', filePrefix: 'Plurality-simplified-english', labels: 'en', endorsement: 'en', endorsementFile: '0-0-endorsements.md', footnoteSeparator: '-', partial: true,
    metadata: 'title: Plurality\nsubtitle: "The Future of Collaborative Technology and Democracy"\nauthor: "E. Glen Weyl, Audrey Tang and ⿻ Community"\nlang: en\ncover-image: scripts/cover-image.png \nmainfont: "Noto Serif"\nlinestretch: 1.25',
    sections: { 1: 'Section 1: Preface', 2: 'Section 2: Introduction', 3: 'Section 3: Plurality', 4: 'Section 4: Freedom', 5: 'Section 5: Democracy', 6: 'Section 6: Impact', 7: 'Section 7: Forward', 0: 'Endorsements' },
  },
  // Section names and the endorsements heading follow translation/chapter-titles.tsv, so
  // the assembled book and the registry cannot drift apart. The cover is the edition's
  // own: the wordmark reads PLURALITET, matching the title below and the glossary, and
  // the subtitle and byline are Norwegian. `vp run design:cover:nb` rebuilds it.
  nb: {
    directory: 'norwegian', filePrefix: 'Plurality-norwegian', labels: 'en', endorsement: 'en', endorsementFile: '0-0-endorsements.md', footnoteSeparator: '-', partial: true,
    metadata: 'title: Pluralitet\nsubtitle: "Fremtiden til samarbeidsteknologi og demokrati"\nauthor: "E. Glen Weyl, Audrey Tang og ⿻-fellesskapet"\nlang: nb\ncover-image: scripts/cover-image.nb.png \nmainfont: "Noto Serif"\nlinestretch: 1.25',
    sections: { 1: 'Del 1: Forord', 2: 'Del 2: Innledning', 3: 'Del 3: Pluralitet', 4: 'Del 4: Frihet', 5: 'Del 5: Demokrati', 6: 'Del 6: Virkning', 7: 'Del 7: Veien videre', 0: 'Anbefalinger' },
    categoryLabels: {
      Writing: 'Skriving', Editing: 'Redigering', Technical: 'Teknisk', Translation: 'Oversettelse',
      Visuals: 'Visuelt', Data: 'Data', Management: 'Prosjektledelse',
      'Public relations': 'Kommunikasjon', Research: 'Research',
    },
  },
}

const readUtf8 = (path: string): string => readFileSync(path, 'utf8')

/**
 * The four document-level fields the Vivliostyle config needs, read back out of the
 * edition's metadata block so the PDF and the manuscript cannot disagree about what
 * edition they are. Parsed rather than duplicated for exactly that reason.
 */
export function editionMetadata(locale: Locale): { title: string; author: string; language: string; cover: string } {
  const field = (key: string): string => {
    const line = configs[locale].metadata.split('\n').find((l) => l.startsWith(`${key}:`))
    return (line ?? '').slice(key.length + 1).trim().replace(/^"(.*)"$/, '$1')
  }
  return { title: field('title'), author: field('author'), language: field('lang'), cover: field('cover-image') }
}

export function validateCredits(value: unknown, locale: Locale = 'en'): Credits {
  if (!value || typeof value !== 'object') throw new Error('Invalid credits: expected an object')
  const credits = value as Partial<Credits>
  if (!Array.isArray(credits.categories)) throw new Error('Invalid credits: categories must be an array')
  const categories = credits.categories.map((category, index) => {
    if (!category || typeof category !== 'object' || typeof category.name !== 'string' || !Array.isArray(category.contributors)) throw new Error(`Invalid credits: category ${index}`)
    const contributors = category.contributors.map((contributor, contributorIndex) => {
      if (!contributor || typeof contributor !== 'object' || typeof contributor.name !== 'string' || typeof contributor.pt !== 'number' || !Number.isFinite(contributor.pt)) throw new Error(`Invalid credits: contributor ${index}.${contributorIndex}`)
      return { name: contributor.name, pt: contributor.pt }
    })
    return { name: category.name, contributors }
  })
  const localeKey = locale === 'zh-TW' ? 'zh' : 'en'
  const labels = credits.i18n?.[localeKey]?.categories
  if (!labels || typeof labels !== 'object') throw new Error(`Invalid credits: missing i18n.${localeKey}.categories`)
  return { categories, i18n: { [localeKey]: { categories: labels } } }
}

function markdownImgAlt(alt: string): string { return alt.replaceAll('\\', '\\\\').replaceAll('[', '\\[').replaceAll(']', '\\]') }
function imgTagToMarkdown(tag: string): string {
  const src = tag.match(/\bsrc="([^"]+)"/)?.[1] ?? tag.match(/\bsrc='([^']+)'/)?.[1]
  if (!src) return tag
  const alt = tag.match(/\balt="([^"]*)"/)?.[1] ?? tag.match(/\balt='([^']*)'/)?.[1] ?? 'figure'
  return `![${markdownImgAlt(alt)}](${src}){ width=100% }`
}

function transformChapter(path: string, headingBase: string, footnoteBase: string, config: LocaleConfig, isEndorsement: boolean): string {
  let content = readUtf8(path)
  if (isEndorsement) {
    content = content.replace(/^(.*\n){6}/, '').replace(/^> /gm, '---\n\n').replace(/^— /gm, '— ').replace(/\s*<br><\/br>\s*/g, '\n\n')
    content += '\n---\n'
    content = content.replace(/---\n\n/, '')
  }
  if (config.endorsement === 'zh') content = content.replace(/(<(br|img)\b[^>]*)(?<!\/)\>/g, '$1 />')
  content = content.replace(/# /, `## ${headingBase} `).replace(/^( +|&nbsp;)+/gm, '')
  content = content.replace(/(\[\^)(.*?\])/g, `$1${footnoteBase}-$2`)
  content = content.replace(/!\[https?:\/\/[^\]]+\]\(([^)]+)\)(\{[^}]*\})?/g, `![figure]($1)$2`)
  content = content.replace(/!\[image\]\(([^)]+)\)/g, '![Gitcoin screenshot]($1)')
  content = content.replace(/!<br\s*\/?>\s*<\/br>!/g, '!')
  content = content.replace(/<img\b[^>]*>/g, (tag) => imgTagToMarkdown(tag))
  if (config.endorsement === 'zh') {
    content = content.replace(/(^\s*\|?\s*(?:原文|作者|譯者)：.*\n)(^\s*\|?\s*(?:原文|作者|譯者)：.*\n|^\s*\n|^---\n)+/gm, '\n')
  }
  return content
}

function numberedPart(file: string): number { return Number(basename(file).match(/^(\d+)/)?.[1] ?? 0) }

/**
 * Restricts an assembly to particular chapters, by chapter id as it appears in
 * translation/chapter-titles.tsv — `['1']`, `['2-0', '2-1']`.
 *
 * A single chapter is what a reviewer actually reads. Asking someone to sign off on an
 * adaptation means handing them that chapter in all three editions side by side, and a
 * pipeline that can only emit the whole book cannot produce that until the whole book
 * exists. The filter lives here because this is the one place chapter files are gathered,
 * so every consumer — the manuscript, the PDF, the EPUB — inherits it for free.
 */
export interface AssembleOptions {
  chapters?: string[]
}

/** A chapter id owns the file whose name is the id followed by a hyphen, or the id alone. */
const inChapters = (file: string, chapters: string[]): boolean =>
  chapters.some((id) => file === `${id}.md` || file.startsWith(`${id}-`))

export function assembleLocale(root: string, locale: Locale, bookDate: string, creditsValue: unknown, options: AssembleOptions = {}): { markdown: string; preTex: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(bookDate)) throw new Error(`Invalid BOOK_DATE: ${bookDate}`)
  const config = configs[locale]
  const credits = validateCredits(creditsValue, locale)
  const labels = { ...(credits.i18n?.[config.labels]?.categories ?? {}), ...(config.categoryLabels ?? {}) }
  const source = join(root, 'contents', config.directory)
  if (!existsSync(source)) throw new Error(`Edition ${locale} has no contents/${config.directory}/`)
  const excerpt = (options.chapters?.length ?? 0) > 0
  let all = `---\n${config.metadata.replace('\nlang:', `\ndate: "${bookDate}"\nlang:`)}\n---\n`
  // An excerpt skips the opening pages and the credit ledger: they belong to the book, not
  // to the chapter, and they would dwarf a single chapter in the reviewer's hands.
  if (!excerpt) for (const name of (readdirSync(source) as string[]).filter((name: string) => /^0-[13]-.*\.md$/.test(name)).sort()) all += `${readUtf8(join(source, name)).replace(/^#+\s+(.+)/, '\n**$1**')}\n\n`
  let tex = '\n```{=latex}\n\\interfootnotelinepenalty=10000\n\\begin{center}\n\n'
  let html = '\n```{=html}\n<div style="text-align: center">\n'
  credits.categories.forEach((category, ci) => {
    const label = labels[category.name] ?? category.name
    tex += `\\textbf{${label}}\\\\[6pt]\n`
    category.contributors.forEach((contributor, ni) => { const baseline = (contributor.pt * 1.2).toFixed(1); const end = ni === category.contributors.length - 1 ? (ci < credits.categories.length - 1 ? '\\\\[16pt]' : '') : '\\\\'; tex += `{\\fontsize{${contributor.pt}pt}{${baseline}pt}\\selectfont ${contributor.name}${end}}\n` })
    html += ci > 0 ? `<p style="margin-top: 16pt"><strong>${label}</strong></p>\n` : `<p><strong>${label}</strong></p>\n`
    category.contributors.forEach((contributor) => { html += `<p style="font-size: ${contributor.pt}pt; margin: 2pt 0">${contributor.name}</p>\n` })
  })
  if (!excerpt) all += tex + '\n\\end{center}\n```\n' + html + '</div>\n```\n\n'
  // A partial edition is assembled while it is still being written, so its front matter is
  // optional — otherwise no edition could be built, and no editor could review one, until
  // its last chapter landed. A complete edition keeps the old guarantee.
  const endorsement = join(source, config.endorsementFile)
  if (!existsSync(endorsement) && !config.partial && !excerpt) {
    throw new Error(`Edition ${locale} is missing contents/${config.directory}/${config.endorsementFile}`)
  }
  const chapterNames = (readdirSync(source) as string[])
    .filter((name: string) => /^[1234567].*\.md$/.test(name))
    .filter((name: string) => !options.chapters || inChapters(name, options.chapters))
    .sort()
  if (excerpt && chapterNames.length === 0) {
    throw new Error(`Edition ${locale} has no chapter matching ${options.chapters!.join(', ')} in contents/${config.directory}/`)
  }
  const files = [
    ...(!excerpt && existsSync(endorsement) ? [endorsement] : []),
    ...chapterNames.map((name: string) => join(source, name)),
  ]
  const remaining = { ...config.sections }
  for (const file of files) { const number = numberedPart(file); if (remaining[number]) { all += `# ${remaining[number]}\n\n`; delete remaining[number] }; const rawBase = basename(file).replace(/^([-\d]+)-.*/, '$1'); const footnoteBase = config.footnoteSeparator === '_' ? `${rawBase.replaceAll('-', '_')}_` : rawBase; all += `${transformChapter(file, rawBase, footnoteBase, config, number === 0)}\n\n` }
  const preTex = (excerpt ? [] : (readdirSync(source) as string[])).filter((name: string) => /^0-2-.*\.md$/.test(name)).sort().map((name: string) => readUtf8(join(source, name)).replace(/\*\*(.*?)\*\*/g, '\\textbf{$1}').replace(/^#+\s+(.+)/gm, '\\textbf{$1}').replace(/&/g, '\\&').replace(/\[(.*?)\]\((.*?)\)/g, '\\href{$2}{$1}').replace(/ \*(.*?)\*/g, ' \\emph{$1}').replace(/(\#\w)/g, '\\$1')).join('')
  return { markdown: all, preTex }
}

export function assembleEnglish(root: string, bookDate: string, creditsValue: unknown) { return assembleLocale(root, 'en', bookDate, creditsValue) }
export function assembleChinese(root: string, bookDate: string, creditsValue: unknown) { return assembleLocale(root, 'zh-TW', bookDate, creditsValue) }

export function buildBook(root: string, locale: Locale, outputDir: string, bookDate: string, options: AssembleOptions = {}): void {
  const result = assembleLocale(root, locale, bookDate, JSON.parse(readUtf8(join(root, 'scripts', 'credits.json'))), options)
  mkdirSync(outputDir, { recursive: true })
  const stem = configs[locale].filePrefix
  writeFileSync(join(outputDir, `${stem}.md`), result.markdown)
  writeFileSync(join(outputDir, 'pre.tex'), result.preTex)
}

// Cast import.meta to read Bun-specific main property during direct script execution
const meta = import.meta as unknown as { main: boolean }
if (meta.main) {
  const argv = process.argv.slice(2)
  const chapters = parseChapters(argv)
  const [locale, outputDir] = argv.filter((a) => !a.startsWith('--'))
  if ((locale !== 'all' && !isEdition(locale)) || !outputDir) {
    throw new Error(
      `Usage: BOOK_DATE=YYYY-MM-DD bun scripts/book/build.ts <${EDITIONS.join('|')}|all> OUTPUT_DIR [--chapters=1,2-0]`,
    )
  }
  if (chapters && locale === 'all') throw new Error('--chapters applies to a single edition, not to `all`')
  const bookDate = process.env.BOOK_DATE
  if (!bookDate) throw new Error('BOOK_DATE is required')
  if (locale === 'all') {
    // `all` stays upstream's two editions, and the manifest with them. The fork's editions
    // are partial and are built one at a time; folding them in here would put a
    // half-translated book into the release pipeline's manifest.
    const sourceRevision = process.env.SOURCE_REVISION ?? process.env.GITHUB_SHA
    if (!sourceRevision) throw new Error('SOURCE_REVISION or GITHUB_SHA is required')
    for (const edition of UPSTREAM_EDITIONS) buildBook(process.cwd(), edition, join(outputDir, edition), bookDate)
    writeManifest(process.cwd(), outputDir, bookDate, sourceRevision)
  } else {
    buildBook(process.cwd(), locale, outputDir, bookDate, chapters ? { chapters } : {})
  }
}
