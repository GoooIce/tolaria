import type { MobileNote } from './mobileWorkspaceModel'

type MarkdownContent = string
type NotePath = string
type WikilinkTarget = string

export type MovedNoteWikilinkRewrite = {
  newTarget: WikilinkTarget
  oldTargets: Set<WikilinkTarget>
}

export function noteWritePath(note: MobileNote): NotePath {
  return note.path ?? note.id
}

export function noteWithWritePath(note: MobileNote, nextPath: NotePath): MobileNote {
  const previousPath = noteWritePath(note)
  if (nextPath === previousPath) return note

  return {
    ...note,
    id: note.id === previousPath ? nextPath : note.id,
    path: nextPath,
  }
}

export function movedNoteWikilinkRewrite(
  previousNote: MobileNote,
  nextNote: MobileNote,
): MovedNoteWikilinkRewrite {
  return {
    newTarget: notePathStem(noteWritePath(nextNote)),
    oldTargets: new Set([
      previousNote.title,
      notePathStem(noteWritePath(previousNote)),
      noteFilename(noteWritePath(previousNote)).replace(/\.md$/u, ''),
    ].filter(Boolean)),
  }
}

export function rewriteMovedNoteWikilinks(
  note: MobileNote,
  rewrite: MovedNoteWikilinkRewrite,
): MobileNote {
  if (note.rawContent === undefined) return note

  const rawContent = replaceMovedWikilinks(note.rawContent, rewrite)
  return rawContent === note.rawContent ? note : { ...note, rawContent }
}

export function noteFilename(path: NotePath): string {
  return path.split('/').filter(Boolean).at(-1) ?? path
}

function replaceMovedWikilinks(
  content: MarkdownContent,
  rewrite: MovedNoteWikilinkRewrite,
): MarkdownContent {
  return content.replace(/\[\[([^\]|]+)(\|[^\]]*)?\]\]/g, (match, target: string, alias: string | undefined) => {
    return rewrite.oldTargets.has(target.trim()) ? `[[${rewrite.newTarget}${alias ?? ''}]]` : match
  })
}

function notePathStem(path: NotePath): string {
  return path.replace(/\.md$/u, '')
}
