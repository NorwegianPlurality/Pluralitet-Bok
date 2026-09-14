import { spawnSync } from 'node:child_process'

/**
 * Rebuilds the `simplify` publication branch from `norwegian`.
 *
 * The branch is output, not a place anyone commits: it carries the English and
 * simplified-English layers plus the tooling, and not the Norwegian translation. Three
 * properties are worth keeping, and they are what this script exists to guarantee.
 *
 * It rebuilds rather than merges. `simplify` is an ancestor of `norwegian`, so a commit
 * built on top of `norwegian` is a descendant of `simplify` and moving the branch is a
 * fast-forward — no force-push, no rewritten history for anyone who has cloned it. A
 * merge would instead drag contents/norwegian/ in, and deleting it again on each refresh
 * produces a delete-versus-modify conflict against every later merge, growing with each
 * translated chapter.
 *
 * It runs entirely in git plumbing, against a temporary index. Nothing is checked out,
 * no branch is switched, and the working tree is never touched, so it is safe to run from
 * a worktree that has `norwegian` or anything else checked out.
 *
 * And it applies the overlay below rather than leaving per-branch files to be edited by
 * hand on a branch that is overwritten on every refresh.
 */

/**
 * Root files replaced on the publication branch, source path to destination path.
 *
 * `ReadMe.md` and `AGENTS.md` are the two files that address a reader or an assistant
 * directly, and both are wrong on this branch if carried over from `norwegian`: one is
 * the Norwegian edition's front page, the other tells you to translate into a layer the
 * branch does not have. They live here, on the branch that is actually worked, so that
 * editing them is an ordinary reviewed change and the next rebuild picks them up.
 */
export const OVERLAY_DIR = 'publication/simplified-english'

/** Paths dropped from the snapshot: the Norwegian layer, and the overlay's own home. */
export const OMITTED = ['contents/norwegian', OVERLAY_DIR]

export type Git = (args: string[]) => string

const defaultGit: Git = (args) => {
  const res = spawnSync('git', args, { encoding: 'utf8' })
  if (res.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${res.stderr.trim() || res.stdout.trim()}`)
  }
  return res.stdout
}

export interface TreeEntry {
  mode: string
  type: string
  oid: string
  path: string
}

/** Parses `git ls-tree -r -z`, which is NUL-delimited so paths with spaces survive. */
export function parseTree(out: string): TreeEntry[] {
  return out
    .split('\0')
    .filter((line) => line.length > 0)
    .map((line) => {
      const [meta, path] = line.split('\t')
      const [mode, type, oid] = meta.split(/\s+/)
      return { mode, type, oid, path }
    })
}

const under = (path: string, dir: string): boolean => path === dir || path.startsWith(`${dir}/`)

/**
 * Maps the source branch's tree onto the publication branch's tree: drop the omitted
 * paths, and lift each overlay file to the root name it replaces.
 *
 * Kept pure and separate from the git calls so the mapping — the part with judgment in
 * it — is testable without a repository.
 */
export function publicationTree(entries: TreeEntry[]): TreeEntry[] {
  const kept = entries.filter((e) => !OMITTED.some((dir) => under(e.path, dir)))
  const overlaid = entries
    .filter((e) => under(e.path, OVERLAY_DIR))
    .map((e) => ({ ...e, path: e.path.slice(OVERLAY_DIR.length + 1) }))

  const byPath = new Map(kept.map((e) => [e.path, e]))
  for (const e of overlaid) byPath.set(e.path, e)
  return [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path))
}

export interface RebuildResult {
  commit: string
  source: string
  replaced: string[]
  removed: number
}

export function rebuildSimplify(
  source = 'norwegian',
  target = 'simplify',
  git: Git = defaultGit,
): RebuildResult {
  const sourceOid = git(['rev-parse', '--verify', `${source}^{commit}`]).trim()
  const entries = parseTree(git(['ls-tree', '-r', '-z', sourceOid]))

  const overlay = entries.filter((e) => under(e.path, OVERLAY_DIR))
  if (overlay.length === 0) {
    throw new Error(`${source} has no ${OVERLAY_DIR}/; nothing would replace the Norwegian front page`)
  }
  const removed = entries.filter((e) => under(e.path, 'contents/norwegian')).length
  if (removed === 0) {
    throw new Error(`${source} has no contents/norwegian/; is ${source} really the working branch?`)
  }

  // A temporary index keeps the working tree and the real index untouched.
  const index = `${process.env.TMPDIR ?? '/tmp'}/rebuild-simplify-${process.pid}.index`
  const withIndex: Git = (args) => {
    const res = spawnSync('git', args, { encoding: 'utf8', env: { ...process.env, GIT_INDEX_FILE: index } })
    if (res.status !== 0) {
      throw new Error(`git ${args.join(' ')} failed: ${res.stderr.trim() || res.stdout.trim()}`)
    }
    return res.stdout
  }

  const tree = publicationTree(entries)
  const input = tree.map((e) => `${e.mode} ${e.type} ${e.oid}\t${e.path}\0`).join('')
  spawnSync('git', ['update-index', '-z', '--index-info'], {
    input,
    encoding: 'utf8',
    env: { ...process.env, GIT_INDEX_FILE: index },
  })
  const treeOid = withIndex(['write-tree']).trim()

  const replaced = overlay.map((e) => e.path.slice(OVERLAY_DIR.length + 1)).sort()
  const message = [
    `Rebuild the simplified-English edition from ${source}`,
    '',
    `Publication snapshot: ${source} without contents/norwegian/ (${removed} chapters),`,
    `with ${replaced.join(' and ')} taken from ${OVERLAY_DIR}/.`,
    '',
    'Generated by `vp run translation:rebuild-simplify`. Do not commit to this branch;',
    'the next rebuild discards it. Work happens on ' + source + '.',
  ].join('\n')

  const commit = git(['commit-tree', treeOid, '-p', sourceOid, '-m', message]).trim()

  // Refuse anything that is not a fast-forward, so a clone of the branch never has to
  // reconcile rewritten history. This is the property the whole rebuild approach buys.
  const exists = spawnSync('git', ['rev-parse', '--verify', `${target}^{commit}`], { encoding: 'utf8' })
  if (exists.status === 0) {
    const previous = exists.stdout.trim()
    const ff = spawnSync('git', ['merge-base', '--is-ancestor', previous, commit])
    if (ff.status !== 0) {
      throw new Error(
        `refusing to move ${target}: ${previous.slice(0, 7)} is not an ancestor of the rebuilt ` +
          `${commit.slice(0, 7)}. ${target} has commits of its own, which it must not have.`,
      )
    }
  }
  git(['branch', '-f', target, commit])

  return { commit, source: sourceOid, replaced, removed }
}

if (import.meta.main) {
  const source = process.argv[2] ?? 'norwegian'
  const target = process.argv[3] ?? 'simplify'
  const { commit, replaced, removed } = rebuildSimplify(source, target)
  console.log(
    [
      `${target} -> ${commit.slice(0, 7)} (rebuilt from ${source})`,
      `  removed  contents/norwegian/ (${removed} files)`,
      ...replaced.map((p) => `  replaced ${p} from ${OVERLAY_DIR}/`),
      '',
      `Publish with: git push origin ${target}`,
    ].join('\n'),
  )
}
