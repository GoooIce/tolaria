import type {
  MobileCreateNoteDefaults,
  MobileTypeDefinitions,
} from '../workspace/mobileWorkspaceModel'
import { mobileCreateNoteDefaultsForType } from '../workspace/mobileCreateNoteDefaults'
import type { TabletSidebarSelection } from './tabletWorkspaceNavigation'

export function createNoteDefaultsForSelection(
  selection: TabletSidebarSelection,
  typeDefinitions?: MobileTypeDefinitions,
): MobileCreateNoteDefaults {
  if (selection.kind === 'folder') return { folderPath: selection.id }
  if (selection.kind === 'item' && selection.sectionId === 'types') return defaultsForTypeSection(selection, typeDefinitions)

  return {}
}

function defaultsForTypeSection(
  selection: Extract<TabletSidebarSelection, { kind: 'item' }>,
  typeDefinitions: MobileTypeDefinitions | undefined,
): MobileCreateNoteDefaults {
  const type = selection.typeName ?? singularLabel(selection.label)
  return mobileCreateNoteDefaultsForType(type, typeDefinitions)
}

function singularLabel(label: string) {
  return label.replace(/s$/u, '')
}
