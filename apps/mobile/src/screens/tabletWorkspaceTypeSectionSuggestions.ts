import {
  typeSchemaRelationshipTargetSuggestions,
} from '../workspace/mobileTypeDefinitionSchema'
import type {
  MobileNote,
  MobileWorkspaceSnapshot,
} from '../workspace/mobileWorkspaceModel'
import {
  mobileListPropertySuggestions,
  mobilePropertyKeySuggestions,
  mobileRelationshipKeySuggestions,
  mobileSortablePropertySuggestions,
} from '../workspace/mobileWorkspaceSuggestions'
import type { TabletReadOnlyForm } from './tabletWorkspaceTypes'

export function typeSectionSuggestionOptions({
  notes,
  readOnlyForm,
  sourceNote,
  workspaceSnapshot,
}: {
  notes: MobileNote[]
  readOnlyForm: TabletReadOnlyForm
  sourceNote: MobileNote | null
  workspaceSnapshot: MobileWorkspaceSnapshot
}) {
  const typedSourceNote = typeSchemaSuggestionNote(sourceNote, readOnlyForm.typeName)
  const editableNotes = editableTypePropertyNotes(readOnlyForm, workspaceSnapshot)

  return {
    typePropertyOptions: mobileListPropertySuggestions(
      editableNotes,
      readOnlyForm.typePropertyQuery,
      workspaceSnapshot.typeDefinitions,
    ),
    typeSchemaPropertyNameOptions: mobilePropertyKeySuggestions(
      notes,
      typedSourceNote,
      readOnlyForm.typeSchemaPropertyName,
      workspaceSnapshot.typeDefinitions,
    ),
    typeSchemaRelationshipNameOptions: mobileRelationshipKeySuggestions(
      notes,
      readOnlyForm.typeSchemaRelationshipName,
      typedSourceNote,
      workspaceSnapshot.typeDefinitions,
    ),
    typeRelationshipTargetOptions: typeSchemaRelationshipTargetSuggestions(
      notes,
      readOnlyForm.typeSchemaRelationshipTarget,
      sourceNote,
    ),
    typeSortPropertyOptions: mobileSortablePropertySuggestions(
      editableNotes,
      '',
      workspaceSnapshot.typeDefinitions,
    ),
  }
}

function typeSchemaSuggestionNote(
  sourceNote: MobileNote | null,
  typeName: string,
): MobileNote | null {
  const type = typeName.trim()
  if (!type || !sourceNote) return sourceNote
  return { ...sourceNote, type }
}

function editableTypePropertyNotes(
  form: TabletReadOnlyForm,
  snapshot: MobileWorkspaceSnapshot,
): MobileNote[] {
  const normalizedType = normalizedLabel(form.typeName)
  if (!normalizedType) return workspaceNotes(snapshot)
  return workspaceNotes(snapshot).filter((note) => normalizedLabel(note.type) === normalizedType)
}

function workspaceNotes(snapshot: MobileWorkspaceSnapshot) {
  return snapshot.allNotes ?? snapshot.notes
}

function normalizedLabel(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '')
}
