import { describe, expect, it } from 'vitest'
import { workspaceScenarioForId } from '../fixtures/workspaceFixtures'
import { applyMobileWorkspaceEdit } from './mobileWorkspaceEditing'
import {
  mobilePropertyKeySuggestions,
  mobilePropertyValueSuggestions,
  mobileRelationshipKeySuggestions,
} from './mobileWorkspaceSuggestions'

describe('mobile workspace suggestions', () => {
  it('suggests safe desktop property keys and existing custom keys', () => {
    const withPriority = applyMobileWorkspaceEdit(workspaceScenarioForId('default'), {
      key: 'Priority',
      noteId: 'open-source-project',
      type: 'updateProperty',
      value: 'High',
    })
    const selectedNote = withPriority.notes.find((note) => note.id === 'workflow-orchestration') ?? null

    expect(mobilePropertyKeySuggestions(withPriority.notes, selectedNote, '')).toEqual(
      expect.arrayContaining(['Date', 'URL', 'Priority']),
    )
    expect(mobilePropertyKeySuggestions(withPriority.notes, selectedNote, 'prio')).toEqual(['Priority'])
    expect(mobilePropertyKeySuggestions(withPriority.notes, selectedNote, '')).not.toContain('Status')
  })

  it('suggests existing property values for the selected key', () => {
    const withPriority = applyMobileWorkspaceEdit(workspaceScenarioForId('default'), {
      key: 'Priority',
      noteId: 'workflow-orchestration',
      type: 'updateProperty',
      value: 'High',
    })

    expect(mobilePropertyValueSuggestions(withPriority.notes, 'Priority', '')).toContain('High')
    expect(mobilePropertyValueSuggestions(withPriority.notes, 'Status', 'ship')).toEqual(['Shipped'])
  })

  it('suggests canonical relationship keys plus custom vault relationship keys', () => {
    const suggestions = mobileRelationshipKeySuggestions(workspaceScenarioForId('default').notes, '')

    expect(suggestions.slice(0, 3)).toEqual(['belongs_to', 'related_to', 'has'])
    expect(mobileRelationshipKeySuggestions(workspaceScenarioForId('default').notes, 'ment')).toEqual(['Mentions'])
  })
})
