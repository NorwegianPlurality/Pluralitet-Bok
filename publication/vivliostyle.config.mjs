import { join } from 'node:path'

const locale = process.env.BOOK_LOCALE || 'en'
const buildDir = process.env.BUILD_DIR || `dist/candidate/${locale}`
const outputRoot = process.env.OUTPUT_ROOT || join(buildDir, '..')

// The document fields come from the edition's own metadata, passed in by the renderer,
// so a new edition needs no change here. The zh-TW/en pair below is the fallback for a
// direct `vivliostyle build --config` invocation with nothing but BOOK_LOCALE set.
const isZh = locale === 'zh-TW'
const title = process.env.BOOK_TITLE || (isZh ? '多元宇宙' : 'Plurality')
const author = process.env.BOOK_AUTHOR || (isZh ? '衛谷倫、唐鳳、⿻社群' : 'E. Glen Weyl, Audrey Tang and ⿻ Community')
const language = process.env.BOOK_LANGUAGE || (isZh ? 'zh-TW' : 'en')
const cover = process.env.BOOK_COVER || (isZh ? 'scripts/cover-image.zh-tw.png' : 'scripts/cover-image.png')

// An excerpt is written beside the full book rather than over it, so a reviewer can hold
// one chapter without destroying the edition's own output.
const suffix = process.env.BOOK_OUTPUT_SUFFIX || ''
const prefix = `vivliostyle-${locale}${suffix}-candidate`

export default {
  title,
  author,
  language,
  size: 'A4',
  theme: 'publication/book.css',
  cover,
  viteConfigFile: false,
  entry: [
    join(buildDir, 'manuscript.md')
  ],
  toc: {
    sectionDepth: 2
  },
  vfm: {
    footnote: 'dpub'
  },
  output: [
    {
      path: join(outputRoot, 'candidate', `${prefix}.pdf`),
      format: 'pdf'
    },
    {
      path: join(outputRoot, 'candidate', `${prefix}.epub`),
      format: 'epub'
    }
  ]
}
