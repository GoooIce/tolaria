import { describe, expect, it } from 'vitest'
import { workspaceScenarioForId } from '../fixtures/workspaceFixtures'
import { applyMobileWorkspaceEditWithWrites } from './mobileWorkspaceEditing'

describe('primary note-list property overrides', () => {
  it('updates primary note-list display overrides without repository writes', () => {
    const base = workspaceScenarioForId('default')
    const result = applyMobileWorkspaceEditWithWrites(base, {
      listPropertiesDisplay: [' status ', 'belongs_to', 'Status', ''],
      target: 'allNotes',
      type: 'updatePrimaryNoteListProperties',
    })

    expect(result.writes).toEqual([])
    expect(result.snapshot.noteListPropertyOverrides).toEqual({
      allNotes: ['status', 'belongs_to'],
    })

    const reset = applyMobileWorkspaceEditWithWrites(result.snapshot, {
      listPropertiesDisplay: [],
      target: 'allNotes',
      type: 'updatePrimaryNoteListProperties',
    })

    expect(reset.writes).toEqual([])
    expect(reset.snapshot.noteListPropertyOverrides).toBeUndefined()
  })
})
