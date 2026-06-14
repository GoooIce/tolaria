import { describe, expect, it } from 'vitest'
import { createFileSystemWorkspaceRepository, normalizedWorkspaceRelativePath, type WorkspaceFileSystem } from './fileSystemWorkspaceRepository'
import type { LocalVaultFile } from './localVaultSnapshot'

describe('createFileSystemWorkspaceRepository', () => {
  it('builds snapshots from markdown and saved-view files in the selected native vault root', () => {
    const fileSystem = fakeWorkspaceFileSystem({
      'views/active-essays.yml': 'name: Active Essays\nfilters:\n  type: Essay\n',
      'Writing/Workflow.md': `---
type: Essay
status: Active
belongs_to:
  - "[[Projects/Tolaria MVP]]"
tags:
  - Design
---
# Workflow

Body with [[Projects/Tolaria MVP]].
`,
      'Projects/Tolaria MVP.md': `---
type: Project
---
# Tolaria MVP
`,
    })
    const repository = createFileSystemWorkspaceRepository(fileSystem)

    const snapshot = repository.readSnapshot({ source: 'native', vaultLabel: 'Laputa', vaultRootUri: 'file:///vault' })
    const workflow = snapshot.allNotes?.find((note) => note.path === 'Writing/Workflow.md')

    expect(snapshot.source).toMatchObject({ kind: 'localVault', label: 'Laputa', totalNotes: 2 })
    expect(workflow).toMatchObject({
      path: 'Writing/Workflow.md',
      relationships: [expect.objectContaining({ key: 'belongs_to' })],
      title: 'Workflow',
    })
    expect(snapshot.notes.find((note) => note.path === 'Writing/Workflow.md')?.rawContent).toContain('# Workflow')
    expect(snapshot.sidebarSections.find((section) => section.id === 'views')?.items?.[0]).toMatchObject({
      icon: 'view',
      label: 'Active Essays',
    })
  })

  it('hydrates and persists note content through relative vault paths', async () => {
    const fileSystem = fakeWorkspaceFileSystem({
      'Writing/Workflow.md': '# Workflow\n\nOriginal body.\n',
    })
    const repository = createFileSystemWorkspaceRepository(fileSystem)

    await expect(repository.readNoteContent({
      created: '-',
      date: '-',
      favorite: false,
      id: 'Writing/Workflow.md',
      links: 0,
      modified: '-',
      path: 'Writing/Workflow.md',
      relationships: [],
      snippet: '',
      status: '',
      tags: [],
      title: 'Workflow',
      type: 'Note',
      typeTone: 'gray',
      workspace: 'Laputa',
    }, { source: 'native', vaultRootUri: 'file:///vault' })).resolves.toBe('# Workflow\n\nOriginal body.\n')

    await repository.persistWrites([{
      content: '# Workflow\n\nUpdated body.\n',
      kind: 'saveNote',
      path: 'Writing/Workflow.md',
    }, {
      content: '# New Note\n\n',
      kind: 'createNote',
      path: 'New Note.md',
    }, {
      content: 'name: Mobile View\nfilters:\n  all: []\n',
      kind: 'saveView',
      path: 'views/mobile-view.yml',
    }], { source: 'native', vaultRootUri: 'file:///vault' })

    expect(fileSystem.files()).toMatchObject({
      'New Note.md': '# New Note\n\n',
      'Writing/Workflow.md': '# Workflow\n\nUpdated body.\n',
      'views/mobile-view.yml': 'name: Mobile View\nfilters:\n  all: []\n',
    })
  })

  it('deletes saved-view files through relative vault paths', async () => {
    const fileSystem = fakeWorkspaceFileSystem({
      'views/mobile-view.yml': 'name: Mobile View\nfilters:\n  all: []\n',
    })
    const repository = createFileSystemWorkspaceRepository(fileSystem)

    await repository.persistWrites([{
      kind: 'deleteView',
      path: 'views/mobile-view.yml',
    }], { source: 'native', vaultRootUri: 'file:///vault' })

    expect(fileSystem.files()).toEqual({})
  })

  it('rejects absolute and parent-traversal write paths', async () => {
    const fileSystem = fakeWorkspaceFileSystem({})
    const repository = createFileSystemWorkspaceRepository(fileSystem)

    await repository.persistWrites([{
      content: 'nope',
      kind: 'saveNote',
      path: '../outside.md',
    }, {
      content: 'nope',
      kind: 'saveNote',
      path: 'file:///outside.md',
    }], { source: 'native', vaultRootUri: 'file:///vault' })

    expect(fileSystem.files()).toEqual({})
    expect(normalizedWorkspaceRelativePath('Folder\\Note.md')).toBe('Folder/Note.md')
    expect(normalizedWorkspaceRelativePath('/absolute.md')).toBeNull()
  })
})

function fakeWorkspaceFileSystem(initialFiles: Record<string, string>): WorkspaceFileSystem & { files: () => Record<string, string> } {
  const files = new Map(Object.entries(initialFiles))

  return {
    defaultRootUri: () => 'file:///default-vault',
    deleteTextFile: (_rootUri, relativePath) => {
      files.delete(relativePath)
    },
    files: () => Object.fromEntries(files),
    readTextFile: (_rootUri, relativePath) => files.get(relativePath) ?? null,
    readVaultFiles: (rootUri) => [...files.entries()].map(([relativePath, content], index) => localVaultFile(rootUri, relativePath, content, index)),
    writeTextFile: (_rootUri, relativePath, content) => {
      files.set(relativePath, content)
    },
  }
}

function localVaultFile(rootUri: string, relativePath: string, content: string, index: number): LocalVaultFile {
  return {
    absolutePath: `${rootUri}/${relativePath}`,
    content,
    createdAt: 1_700_000_000_000 + index,
    modifiedAt: 1_700_000_000_000 + index,
    relativePath,
    size: content.length,
  }
}
