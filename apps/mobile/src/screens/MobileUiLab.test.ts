import { describe, expect, it } from 'vitest'
import { workspaceScenarioForId } from '../fixtures/workspaceFixtures'
import {
  mobileSnapshotWithRequestedSelectedNote,
  requestedSelectedNoteId,
} from './mobileUiLabSelectedNote'
import { requestedActionSheetQaTarget } from './mobileActionSheetQaTarget'

describe('requestedSelectedNoteId', () => {
  it('reads selectedNoteId and the shorter noteId alias from URL params', () => {
    expect(requestedSelectedNoteId(new URLSearchParams('selectedNoteId=note-a.md'))).toBe('note-a.md')
    expect(requestedSelectedNoteId(new URLSearchParams('noteId=note-b.md'))).toBe('note-b.md')
    expect(requestedSelectedNoteId(new URLSearchParams('selectedNoteId=%20'))).toBeNull()
  })
})

describe('requestedActionSheetQaTarget', () => {
  it('allows deterministic native QA entry points for workspace sheets', () => {
    expect(requestedActionSheetQaTarget(new URLSearchParams('actionSheet=editView'))).toBe('editView')
    expect(requestedActionSheetQaTarget(new URLSearchParams('actionSheet=editTypeSection'))).toBe('editTypeSection')
    expect(requestedActionSheetQaTarget(new URLSearchParams('actionSheet=addProperty'))).toBe('addProperty')
  })

  it('ignores unknown action sheet targets', () => {
    expect(requestedActionSheetQaTarget(new URLSearchParams('actionSheet=deleteEverything'))).toBeUndefined()
    expect(requestedActionSheetQaTarget(new URLSearchParams(''))).toBeUndefined()
  })
})

describe('mobileSnapshotWithRequestedSelectedNote', () => {
  it('selects a requested note that exists in the visible snapshot', () => {
    const snapshot = workspaceScenarioForId('default')
    const noteId = snapshot.notes[1]!.id

    expect(mobileSnapshotWithRequestedSelectedNote(snapshot, noteId).selectedNoteId).toBe(noteId)
  })

  it('selects a requested note that only exists in allNotes', () => {
    const snapshot = workspaceScenarioForId('default')
    const hiddenNote = {
      ...snapshot.notes[0]!,
      id: 'hidden-relationship-note.md',
      title: 'Hidden relationship note',
    }

    expect(mobileSnapshotWithRequestedSelectedNote({
      ...snapshot,
      allNotes: [...snapshot.notes, hiddenNote],
    }, hiddenNote.id).selectedNoteId).toBe(hiddenNote.id)
  })

  it('ignores blank or missing requested note IDs', () => {
    const snapshot = workspaceScenarioForId('default')

    expect(mobileSnapshotWithRequestedSelectedNote(snapshot, null)).toBe(snapshot)
    expect(mobileSnapshotWithRequestedSelectedNote(snapshot, 'missing.md')).toBe(snapshot)
  })
})
