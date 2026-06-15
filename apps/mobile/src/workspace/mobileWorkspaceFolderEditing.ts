import { buildMobileSidebarSections } from './mobileSidebarSections'
import type { MobileNote, MobileWorkspaceSnapshot } from './mobileWorkspaceModel'
import {
  folderPathsWithCreated,
  folderPathsWithDeleted,
  folderPathsWithRenamed,
  mobileFolderChildPath,
  mobileFolderParentPath,
  mobileFolderPathContains,
  mobileFolderPathsForNotes,
  normalizedMobileFolderPath,
  renamedFolderPath,
  uniqueMobileFolderPaths,
} from './mobileWorkspaceFolders'
import {
  movedNoteWikilinkRewrite,
  noteWithWritePath,
  noteWritePath,
  rewriteMovedNoteWikilinks,
} from './mobileWorkspacePathRewrites'
import type {
  MobileWorkspaceEdit,
  MobileWorkspaceEditResult,
  MobileWorkspaceWrite,
} from './mobileWorkspaceEditing'

type FolderPath = string
type MobileFolderEdit = Extract<MobileWorkspaceEdit, { type: 'createFolder' | 'deleteFolder' | 'renameFolder' }>
type RebuildMobileWorkspaceSnapshot = (
  snapshot: MobileWorkspaceSnapshot,
  notes: MobileNote[],
  allNotes?: MobileNote[],
) => MobileWorkspaceSnapshot

export function applyMobileFolderEdit(
  snapshot: MobileWorkspaceSnapshot,
  edit: MobileFolderEdit,
  rebuildSnapshot: RebuildMobileWorkspaceSnapshot,
): MobileWorkspaceEditResult {
  if (edit.type === 'createFolder') return createMobileFolder(snapshot, edit)
  if (edit.type === 'renameFolder') return renameMobileFolder(snapshot, edit, rebuildSnapshot)
  return deleteMobileFolder(snapshot, edit.folderPath, rebuildSnapshot)
}

function createMobileFolder(
  snapshot: MobileWorkspaceSnapshot,
  edit: Extract<MobileWorkspaceEdit, { type: 'createFolder' }>,
): MobileWorkspaceEditResult {
  const path = mobileFolderChildPath(edit.parentPath, edit.name)
  if (!path || workspaceFolderPathExists(snapshot, path)) return { snapshot, writes: [] }

  return {
    snapshot: snapshotWithFolderPaths(snapshot, folderPathsWithCreated(workspaceFolderPaths(snapshot), path)),
    writes: [{ kind: 'createFolder', path }],
  }
}

function renameMobileFolder(
  snapshot: MobileWorkspaceSnapshot,
  edit: Extract<MobileWorkspaceEdit, { type: 'renameFolder' }>,
  rebuildSnapshot: RebuildMobileWorkspaceSnapshot,
): MobileWorkspaceEditResult {
  const previousPath = normalizedMobileFolderPath(edit.folderPath)
  const nextPath = mobileFolderChildPath(mobileFolderParentPath(previousPath), edit.name)
  if (!previousPath || !nextPath || previousPath === nextPath) return { snapshot, writes: [] }
  if (!workspaceFolderPathExists(snapshot, previousPath) || workspaceFolderPathExists(snapshot, nextPath)) return { snapshot, writes: [] }

  return renameFolderSubtree(snapshot, previousPath, nextPath, rebuildSnapshot)
}

function deleteMobileFolder(
  snapshot: MobileWorkspaceSnapshot,
  folderPath: FolderPath,
  rebuildSnapshot: RebuildMobileWorkspaceSnapshot,
): MobileWorkspaceEditResult {
  const path = normalizedMobileFolderPath(folderPath)
  if (!path || !workspaceFolderPathExists(snapshot, path)) return { snapshot, writes: [] }

  const notes = snapshot.notes.filter((note) => !noteBelongsToFolder(note, path))
  const allNotes = snapshot.allNotes?.filter((note) => !noteBelongsToFolder(note, path))
  const folderPaths = folderPathsWithDeleted(workspaceFolderPaths(snapshot), path)
  const nextSnapshot = rebuildSnapshot({ ...snapshot, allNotes, folderPaths }, notes, allNotes)

  return {
    snapshot: nextSnapshot,
    writes: [{ kind: 'deleteFolder', path }],
  }
}

function renameFolderSubtree(
  snapshot: MobileWorkspaceSnapshot,
  previousPath: FolderPath,
  nextPath: FolderPath,
  rebuildSnapshot: RebuildMobileWorkspaceSnapshot,
): MobileWorkspaceEditResult {
  const previousPool = workspaceNotePool(snapshot)
  const nextPool = renameFolderWorkspaceNotes(previousPool, previousPath, nextPath)
  const nextNotes = renameFolderWorkspaceNotes(snapshot.notes, previousPath, nextPath)
  const nextAllNotes = snapshot.allNotes ? nextPool : undefined
  const folderPaths = folderPathsWithRenamed(workspaceFolderPaths(snapshot), previousPath, nextPath)
  const nextSnapshot = rebuildSnapshot({ ...snapshot, allNotes: nextAllNotes, folderPaths }, nextNotes, nextAllNotes)

  return {
    snapshot: nextSnapshot,
    writes: renameFolderWrites(previousPool, nextPool, previousPath, nextPath),
  }
}

function renameFolderWorkspaceNotes(
  notes: MobileNote[],
  previousPath: FolderPath,
  nextPath: FolderPath,
): MobileNote[] {
  const movedNotes = notes
    .filter((note) => noteBelongsToFolder(note, previousPath))
    .map((note) => [note, renamedFolderNote(note, previousPath, nextPath)] as const)
  const rewrites = movedNotes.map(([previousNote, nextNote]) => movedNoteWikilinkRewrite(previousNote, nextNote))

  return notes.map((note) => {
    const movedNote = movedNotes.find(([previousNote]) => previousNote.id === note.id)?.[1] ?? note
    return rewrites.reduce(rewriteMovedNoteWikilinks, movedNote)
  })
}

function renamedFolderNote(note: MobileNote, previousPath: FolderPath, nextPath: FolderPath): MobileNote {
  return noteWithWritePath(note, renamedFolderPath(noteWritePath(note), previousPath, nextPath))
}

function renameFolderWrites(
  previousPool: MobileNote[],
  nextPool: MobileNote[],
  previousPath: FolderPath,
  nextPath: FolderPath,
): MobileWorkspaceWrite[] {
  return [
    { kind: 'renameFolder', path: previousPath, toPath: nextPath },
    ...folderRenameContentWrites(previousPool, nextPool, previousPath, nextPath),
  ]
}

function folderRenameContentWrites(
  previousPool: MobileNote[],
  nextPool: MobileNote[],
  previousPath: FolderPath,
  nextPath: FolderPath,
): MobileWorkspaceWrite[] {
  const previousRawContent = new Map(previousPool.map((note) => [noteWritePath(note), note.rawContent]))
  return nextPool.flatMap((note) => {
    const path = noteWritePath(note)
    const oldPath = renamedFolderPath(path, nextPath, previousPath)
    if (note.rawContent === undefined || previousRawContent.get(oldPath) === note.rawContent) return []
    return [{ content: note.rawContent, kind: 'saveNote', path }]
  })
}

function snapshotWithFolderPaths(
  snapshot: MobileWorkspaceSnapshot,
  folderPaths: FolderPath[],
): MobileWorkspaceSnapshot {
  return {
    ...snapshot,
    folderPaths,
    sidebarSections: buildMobileSidebarSections({
      folderPaths,
      notes: workspaceNotePool(snapshot),
      previousSections: snapshot.sidebarSections,
      typeDefinitions: snapshot.typeDefinitions,
      views: snapshot.views,
    }),
  }
}

function workspaceFolderPathExists(snapshot: MobileWorkspaceSnapshot, folderPath: FolderPath): boolean {
  const normalizedPath = normalizedMobileFolderPath(folderPath)
  return workspaceFolderPaths(snapshot).some((path) => normalizedMobileFolderPath(path) === normalizedPath)
}

function workspaceFolderPaths(snapshot: MobileWorkspaceSnapshot): FolderPath[] {
  return uniqueMobileFolderPaths([
    ...(snapshot.folderPaths ?? []),
    ...mobileFolderPathsForNotes(workspaceNotePool(snapshot)),
  ])
}

function workspaceNotePool(snapshot: MobileWorkspaceSnapshot): MobileNote[] {
  return snapshot.allNotes ?? snapshot.notes
}

function noteBelongsToFolder(note: MobileNote, folderPath: FolderPath): boolean {
  return mobileFolderPathContains(folderPath, mobileFolderParentPath(noteWritePath(note)))
}
