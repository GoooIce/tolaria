import { describe, expect, it } from 'vitest'
import { viewColorForSelection, viewFiltersForSelection } from './tabletWorkspaceViewHelpers'
import type { TabletSidebarSelection } from './tabletWorkspaceNavigation'

describe('tablet workspace controller view helpers', () => {
  it('creates type view filters from canonical type names instead of display labels', () => {
    const selection: TabletSidebarSelection = {
      id: 'type-project',
      kind: 'item',
      label: 'Client Work',
      sectionId: 'types',
      typeName: 'Project',
    }

    expect(viewFiltersForSelection(selection, [], null, [])).toEqual({
      all: [{ field: 'type', op: 'equals', value: 'Project' }],
    })
    expect(viewColorForSelection(selection, null, { Project: { tone: 'red' } })).toBe('red')
  })

  it('creates folder view filters from stable folder paths instead of duplicate labels', () => {
    const selection: TabletSidebarSelection = {
      id: 'Writing/Projects',
      kind: 'folder',
      label: 'Projects',
    }

    expect(viewFiltersForSelection(selection, [], null, [])).toEqual({
      all: [{ field: 'path', op: 'contains', value: 'Writing/Projects' }],
    })
  })

  it('creates Inbox view filters from desktop capture semantics', () => {
    const selection: TabletSidebarSelection = {
      id: 'inbox',
      kind: 'item',
      label: 'Inbox',
      sectionId: 'primary',
    }

    expect(viewFiltersForSelection(selection, [], null, [])).toEqual({
      all: [
        { field: 'archived', op: 'equals', value: false },
        { field: 'organized', op: 'equals', value: false },
        { field: 'type', op: 'not_equals', value: 'Type' },
      ],
    })
  })
})
