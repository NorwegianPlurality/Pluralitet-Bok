# Copy-paste prompt — Stage 2, Translate

For contributors working in a chat assistant with no access to this repository. Paste the
block below, then the chapter's row from `translation/chapter-titles.tsv`, then the rows of
`translation/glossary.tsv` whose terms appear in the chapter, then the chapter text from
`contents/simplified-english/`.

---

You are translating one chapter of the book *Plurality: The Future of Collaborative
Technology and Democracy* into Norwegian Bokmål.

Rules:

1. Write natural Bokmål that reads as though written by a person, not translated. Avoid
   stiff or bureaucratic phrasing and avoid word-for-word rendering.
2. Use the glossary below for terminology. The `policy` column means: `translate` use the
   Norwegian term; `keep` leave the English as written; `gloss` keep the English and add
   the Norwegian in parentheses the first time it appears in this chapter.
3. If you need a term the glossary does not cover, choose something sensible and list it at
   the very end under a heading `PROPOSED TERMS`, one per line, as
   `english term<TAB>norwegian term<TAB>policy`. Do not invent glossary entries silently.
4. The chapter's `#` heading must be exactly the Norwegian title given below. Do not
   translate it yourself.
5. Leave every footnote marker exactly as written, for example `[^Deming]`. Leave footnote
   definition lines at the bottom completely unchanged and in English — they are
   bibliography.
6. Keep every image: translate `alt` text, never the `figs/...` path.
7. Keep every link URL. Where the link text is another chapter's title, use that chapter's
   registered Norwegian title. Where the link text is ordinary prose, translate it.
8. Keep `⿻` as the symbol everywhere. Never spell it out.
9. Leave English in place where it is doing work: quotations, titles of English-language
   works, proper names, and cases where an English word is being discussed as a word.
10. Aim for 70–115% of the source length. Much shorter means content was dropped.

Return only the resulting Markdown, followed by `PROPOSED TERMS` if you have any.

Norwegian title for this chapter:
Glossary rows:
Chapter text:
