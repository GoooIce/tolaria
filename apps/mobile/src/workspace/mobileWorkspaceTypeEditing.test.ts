import { describe, expect, it } from 'vitest'
import { workspaceScenarioForId } from '../fixtures/workspaceFixtures'
import { applyMobileWorkspaceEditWithWrites } from './mobileWorkspaceEditing'
import type { MobileNote, MobileWorkspaceSnapshot } from './mobileWorkspaceModel'

describe('mobile Type document editing', () => {
  it.each([
    {
      expectedPath: 'note.md',
      expectedTypeName: 'Note',
      requestedTypeName: 'notes',
    },
    {
      expectedPath: 'person.md',
      expectedTypeName: 'Person',
      requestedTypeName: 'person',
    },
  ])('creates $expectedTypeName Type documents from desktop naming rules', ({
    expectedPath,
    expectedTypeName,
    requestedTypeName,
  }) => {
    const result = applyMobileWorkspaceEditWithWrites(workspaceScenarioForId('default'), {
      type: 'createTypeDefinition',
      typeName: requestedTypeName,
    })

    expect(result.snapshot.typeDefinitions?.[expectedTypeName]).toMatchObject({
      path: expectedPath,
      rawContent: expect.stringContaining(`# ${expectedTypeName}`),
    })
    expect(result.snapshot.typeDefinitions?.[requestedTypeName]).toBeUndefined()
    expect(result.writes).toEqual([{
      content: expect.stringContaining(`# ${expectedTypeName}`),
      kind: 'createNote',
      path: expectedPath,
    }])
  })

  it('does not create duplicate Type documents for slug-equivalent names', () => {
    const result = applyMobileWorkspaceEditWithWrites(workspaceScenarioForId('default'), {
      type: 'createTypeDefinition',
      typeName: 'procedure',
    })

    expect(result.snapshot.typeDefinitions?.Procedure).toBeDefined()
    expect(result.snapshot.typeDefinitions?.procedure).toBeUndefined()
    expect(result.writes).toEqual([])
  })

  it('renames Type documents and rewrites assigned notes like desktop', () => {
    const result = applyMobileWorkspaceEditWithWrites(typeRenameSnapshot(), {
      nextTypeName: 'Playbook',
      type: 'renameTypeDefinition',
      typeName: 'Procedure',
    })

    expect(result.snapshot.typeDefinitions?.Procedure).toBeUndefined()
    expect(result.snapshot.typeDefinitions?.Playbook).toMatchObject({
      label: null,
      path: 'playbook.md',
      tone: 'purple',
    })
    expect(result.snapshot.typeDefinitions?.Playbook?.rawContent).toContain('# Playbook')
    expect(result.snapshot.typeDefinitions?.Playbook?.rawContent).not.toContain('_sidebar_label')
    expect(noteById(result.snapshot, 'playbook.md')).toMatchObject({
      path: 'playbook.md',
      title: 'Playbook',
      type: 'Type',
    })
    expect(noteById(result.snapshot, 'open-source-project')).toMatchObject({
      type: 'Playbook',
      typeTone: 'purple',
    })
    expect(noteById(result.snapshot, 'open-source-project').rawContent).toContain('type: Playbook')
    expect(noteById(result.snapshot, 'metadata-only-procedure')).toMatchObject({
      rawContent: undefined,
      type: 'Playbook',
    })
    expect(result.writes).toEqual([
      { kind: 'moveNote', path: 'procedure.md', toPath: 'playbook.md' },
      {
        content: expect.stringContaining('# Playbook'),
        kind: 'saveNote',
        path: 'playbook.md',
      },
      {
        content: expect.stringContaining('type: Playbook'),
        kind: 'saveNote',
        path: 'Tolaria/Mobile UI/How I Run an Open Source Project.md',
      },
    ])
  })

  it('does not rename a Type over an existing slug-equivalent Type', () => {
    const result = applyMobileWorkspaceEditWithWrites(typeRenameSnapshot(), {
      nextTypeName: 'essay',
      type: 'renameTypeDefinition',
      typeName: 'Procedure',
    })

    expect(result.snapshot.typeDefinitions?.Procedure).toBeDefined()
    expect(result.snapshot.typeDefinitions?.Essay).toBeDefined()
    expect(result.snapshot.typeDefinitions?.essay).toBeUndefined()
    expect(result.writes).toEqual([])
  })
})

function typeRenameSnapshot(): MobileWorkspaceSnapshot {
  const base = workspaceScenarioForId('default')
  const procedureDefinition = base.typeDefinitions?.Procedure
  const typeDocument = {
    ...base.notes[0],
    id: 'procedure.md',
    path: 'procedure.md',
    rawContent: procedureDefinition?.rawContent,
    title: 'Procedure',
    type: 'Type',
    typeTone: 'purple' as const,
  }
  const editableProcedure = {
    ...noteById(base, 'open-source-project'),
    rawContent: '---\ntype: Procedure\nStatus: Active\n---\n# How I Run an Open Source Project\n\nBody.\n',
  }
  const metadataOnlyProcedure = {
    ...base.notes[2],
    id: 'metadata-only-procedure',
    path: 'metadata-only-procedure.md',
    title: 'Metadata Only Procedure',
    type: 'Procedure',
    typeTone: 'purple' as const,
    rawContent: undefined,
  }
  const notes = [typeDocument, editableProcedure, metadataOnlyProcedure]

  return {
    ...base,
    allNotes: notes,
    notes,
    selectedNoteId: editableProcedure.id,
    typeDefinitions: {
      ...base.typeDefinitions,
      Procedure: {
        ...procedureDefinition,
        label: 'Procedures',
        rawContent: '---\ntype: Type\n_sidebar_label: Procedures\ncolor: purple\nicon: stack\n---\n# Procedure\n',
      },
    },
  }
}

function noteById(snapshot: MobileWorkspaceSnapshot, noteId: string): MobileNote {
  const note = (snapshot.allNotes ?? snapshot.notes).find((candidate) => candidate.id === noteId)
  if (!note) throw new Error(`Expected note ${noteId}`)
  return note
}
