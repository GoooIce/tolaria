import { describe, expect, it } from 'vitest'
import { workspaceScenarios } from '../fixtures/workspaceFixtures'
import { fixtureReadOnlyWorkspaceRepository } from './readOnlyWorkspaceRepository'

describe('fixtureReadOnlyWorkspaceRepository', () => {
  it('returns the default read-only workspace snapshot when no scenario is requested', () => {
    const snapshot = fixtureReadOnlyWorkspaceRepository.readSnapshot()

    expect(snapshot).toBe(workspaceScenarios.default)
    expect(snapshot.notes[0]?.title).toBe('Workflow Orchestration Essay')
  })

  it('returns scenario snapshots through the read-only workspace boundary', () => {
    const snapshot = fixtureReadOnlyWorkspaceRepository.readSnapshot({ scenarioId: 'property-heavy' })

    expect(snapshot).toBe(workspaceScenarios['property-heavy'])
    expect(snapshot.sidebarSections.some((section) => section.id === 'folders')).toBe(true)
  })
})
