import { buildLocalVaultWorkspaceSnapshot, type LocalVaultFile } from './localVaultSnapshot'
import type { MobileNote, MobileWorkspaceSnapshot } from './mobileWorkspaceModel'
import type { MobileWorkspaceWrite } from './mobileWorkspaceEditing'
import type { ReadOnlyWorkspaceRepository, ReadOnlyWorkspaceRequest } from './readOnlyWorkspaceRepository'

export type WorkspaceFileSystem = {
  defaultRootUri: () => string | null
  deleteTextFile: (rootUri: string, relativePath: string) => void
  readTextFile: (rootUri: string, relativePath: string) => string | null
  readVaultFiles: (rootUri: string) => LocalVaultFile[]
  writeTextFile: (rootUri: string, relativePath: string, content: string) => void
}

export function createFileSystemWorkspaceRepository(fileSystem: WorkspaceFileSystem): ReadOnlyWorkspaceRepository {
  return {
    persistWrites: async (writes, request) => {
      const rootUri = workspaceRootUri(fileSystem, request)
      if (!rootUri) return

      for (const write of writes) {
        persistWorkspaceWrite(fileSystem, rootUri, write)
      }
    },
    readNoteContent: async (note, request) => {
      if (note.rawContent !== undefined) return note.rawContent

      const rootUri = workspaceRootUri(fileSystem, request)
      const relativePath = noteRelativePath(note)
      if (!rootUri || !relativePath) return null

      return fileSystem.readTextFile(rootUri, relativePath)
    },
    readSnapshot: (request) => {
      const rootUri = workspaceRootUri(fileSystem, request)
      if (!rootUri) return emptyFileSystemSnapshot(request)

      return buildLocalVaultWorkspaceSnapshot({
        files: fileSystem.readVaultFiles(rootUri),
        vaultLabel: workspaceLabel(rootUri, request),
        vaultPath: rootUri,
      })
    },
  }
}

function persistWorkspaceWrite(
  fileSystem: WorkspaceFileSystem,
  rootUri: string,
  write: MobileWorkspaceWrite,
) {
  const relativePath = normalizedWorkspaceRelativePath(write.path)
  if (!relativePath) return

  if (write.kind === 'deleteView') {
    fileSystem.deleteTextFile(rootUri, relativePath)
    return
  }

  fileSystem.writeTextFile(rootUri, relativePath, write.content)
}

function workspaceRootUri(
  fileSystem: WorkspaceFileSystem,
  request?: ReadOnlyWorkspaceRequest,
): string | null {
  return request?.vaultRootUri ?? fileSystem.defaultRootUri()
}

function workspaceLabel(rootUri: string, request?: ReadOnlyWorkspaceRequest) {
  return request?.vaultLabel?.trim() || rootUri.split('/').filter(Boolean).at(-1) || 'Tolaria Vault'
}

function emptyFileSystemSnapshot(request?: ReadOnlyWorkspaceRequest): MobileWorkspaceSnapshot {
  return buildLocalVaultWorkspaceSnapshot({
    files: [],
    vaultLabel: request?.vaultLabel ?? 'Tolaria Vault',
    vaultPath: request?.vaultRootUri ?? '',
  })
}

function noteRelativePath(note: MobileNote): string | null {
  return normalizedWorkspaceRelativePath(note.path ?? note.id)
}

export function normalizedWorkspaceRelativePath(path: string): string | null {
  const normalized = path.replaceAll('\\', '/').trim()
  if (!normalized || normalized.startsWith('/') || normalized.includes('://')) return null

  const parts = normalized.split('/').filter(Boolean)
  if (parts.some((part) => part === '.' || part === '..')) return null

  return parts.join('/')
}
