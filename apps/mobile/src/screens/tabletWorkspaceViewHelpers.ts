import type {
  MobileNote,
  MobileTypeDefinitions,
  MobileViewDefinition,
  MobileViewFilterGroup,
  MobileViewFilterNode,
  MobileWorkspaceSnapshot,
} from '../workspace/mobileWorkspaceModel'
import type { TabletSidebarSelection } from './tabletWorkspaceNavigation'

export function viewFiltersForSelection(
  selection: TabletSidebarSelection,
  notes: MobileNote[],
  selectedNote: MobileNote | null,
  views: NonNullable<MobileWorkspaceSnapshot['views']>,
): MobileViewFilterGroup {
  if (selection.kind === 'folder') return allFilters([{ field: 'path', op: 'contains', value: selection.id }])

  return itemViewFiltersForSelection(selection, notes, selectedNote, views)
}

export function viewColorForSelection(
  selection: TabletSidebarSelection,
  selectedNote: MobileNote | null,
  typeDefinitions?: MobileTypeDefinitions,
): MobileViewDefinition['color'] {
  if (selection.kind === 'item' && selection.sectionId === 'types') {
    return selection.typeName ? typeDefinitions?.[selection.typeName]?.tone ?? selectedNote?.typeTone ?? 'gray' : selectedNote?.typeTone ?? 'gray'
  }
  return selectedNote?.typeTone ?? 'gray'
}

function itemViewFiltersForSelection(
  selection: Extract<TabletSidebarSelection, { kind: 'item' }>,
  notes: MobileNote[],
  selectedNote: MobileNote | null,
  views: NonNullable<MobileWorkspaceSnapshot['views']>,
): MobileViewFilterGroup {
  const sectionFilters = sectionViewFilters(selection, selectedNote, views)
  if (sectionFilters) return sectionFilters
  return primaryViewFilters(selection, notes)
}

function sectionViewFilters(
  selection: Extract<TabletSidebarSelection, { kind: 'item' }>,
  selectedNote: MobileNote | null,
  views: NonNullable<MobileWorkspaceSnapshot['views']>,
): MobileViewFilterGroup | null {
  if (selection.sectionId === 'views') return existingViewFilters(selection, views)
  if (selection.sectionId === 'types') return typeViewFilters(selection, selectedNote)
  if (selection.sectionId === 'favorites') return allFilters([{ field: 'favorite', op: 'equals', value: true }])
  return null
}

function primaryViewFilters(
  selection: Extract<TabletSidebarSelection, { kind: 'item' }>,
  notes: MobileNote[],
): MobileViewFilterGroup {
  if (selection.id === 'archive') return allFilters([{ field: 'archived', op: 'equals', value: true }])
  if (selection.id === 'all-notes') return allFilters([{ field: 'archived', op: 'equals', value: false }])
  if (selection.id === 'inbox') return allFilters([
    { field: 'archived', op: 'equals', value: false },
    { field: 'organized', op: 'equals', value: false },
    { field: 'type', op: 'not_equals', value: 'Type' },
  ])

  return allFilters([{ field: 'title', op: 'contains', value: notes[0]?.title ?? selection.label }])
}

function typeViewFilters(
  selection: Extract<TabletSidebarSelection, { kind: 'item' }>,
  selectedNote: MobileNote | null,
): MobileViewFilterGroup {
  return allFilters([{ field: 'type', op: 'equals', value: selection.typeName ?? selectedNote?.type ?? singularLabel(selection.label) }])
}

function existingViewFilters(
  selection: Extract<TabletSidebarSelection, { kind: 'item' }>,
  views: NonNullable<MobileWorkspaceSnapshot['views']>,
): MobileViewFilterGroup {
  return views.find((view) => view.id === selection.viewId || view.id === selection.id)?.definition.filters ?? allFilters([])
}

function allFilters(filters: MobileViewFilterNode[]): MobileViewFilterGroup {
  return { all: filters }
}

function singularLabel(label: string) {
  return label.replace(/s$/u, '')
}
