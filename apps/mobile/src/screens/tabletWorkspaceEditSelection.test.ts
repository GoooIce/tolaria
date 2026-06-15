import { describe, expect, it } from 'vitest'
import { workspaceScenarioForId } from '../fixtures/workspaceFixtures'
import { applyMobileWorkspaceEditWithWrites, type MobileWorkspaceEdit } from '../workspace/mobileWorkspaceEditing'
import { selectAfterWorkspaceEdit } from './tabletWorkspaceEditSelection'
import type { TabletSidebarSelection } from './tabletWorkspaceNavigation'

describe('tablet workspace edit selection', () => {
  it('selects the newly created relationship target note', () => {
    const base = workspaceScenarioForId('default')
    const sourceNote = {
      ...base.notes[0],
      rawContent: '# Workflow Orchestration Essay\n\nSource body.\n',
    }
    const snapshot = {
      ...base,
      allNotes: [sourceNote, ...base.notes.slice(1)],
      notes: [sourceNote, ...base.notes.slice(1)],
      selectedNoteId: sourceNote.id,
    }
    const edit: MobileWorkspaceEdit = {
      key: 'related_to',
      sourceNoteId: sourceNote.id,
      targetTitle: 'Brand New Target',
      type: 'createRelationshipTarget',
    }
    const result = applyMobileWorkspaceEditWithWrites(snapshot, edit)
    const selectedNoteIds: Array<string | null> = []

    selectAfterWorkspaceEdit({
      edit,
      navigation: inertNavigation(),
      result,
      setSelectedNoteId: (noteId) => selectedNoteIds.push(noteId),
    })

    expect(selectedNoteIds).toEqual(['Tolaria/Mobile UI/brand-new-target.md'])
  })
})

function inertNavigation() {
  const sidebarSelection: TabletSidebarSelection = {
    count: '7',
    id: 'inbox',
    kind: 'item',
    label: 'Inbox',
    sectionId: 'primary',
  }

  return {
    selectDefaultSidebarItem: () => {},
    selectFolder: () => {},
    selectSavedView: () => {},
    sidebarSelection,
  }
}
