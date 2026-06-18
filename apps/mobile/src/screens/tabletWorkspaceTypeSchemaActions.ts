import type { MobileNote, MobileWorkspaceSnapshot } from '../workspace/mobileWorkspaceModel'
import {
  addTypeSchemaProperty,
  addTypeSchemaRelationshipRef,
} from '../workspace/mobileTypeDefinitionSchema'
import type { TabletReadOnlyForm } from './tabletWorkspaceTypes'

type TypeSchemaFormUpdater = <Key extends keyof TabletReadOnlyForm>(
  key: Key,
  value: TabletReadOnlyForm[Key],
) => void

export function addTypeSchemaPropertyFormValue({
  form,
  updateReadOnlyForm,
}: {
  form: TabletReadOnlyForm
  updateReadOnlyForm: TypeSchemaFormUpdater
}) {
  updateReadOnlyForm('typeSchemaProperties', addTypeSchemaProperty(
    form.typeSchemaProperties,
    form.typeSchemaPropertyName,
    form.typeSchemaPropertyValue,
  ))
  updateReadOnlyForm('typeSchemaPropertyName', '')
  updateReadOnlyForm('typeSchemaPropertyValue', '')
}

export function addTypeSchemaRelationshipFormValue({
  form,
  notes,
  sourceNote,
  updateReadOnlyForm,
}: {
  form: TabletReadOnlyForm
  notes: MobileNote[]
  sourceNote?: MobileNote | null
  updateReadOnlyForm: TypeSchemaFormUpdater
}) {
  updateReadOnlyForm('typeSchemaRelationships', addTypeSchemaRelationshipRef({
    key: form.typeSchemaRelationshipName,
    notes,
    relationships: form.typeSchemaRelationships,
    sourceNote,
    targetRef: form.typeSchemaRelationshipTargetRef,
    targetTitle: form.typeSchemaRelationshipTarget,
  }))
  updateReadOnlyForm('typeSchemaRelationshipName', '')
  updateReadOnlyForm('typeSchemaRelationshipTargetRef', '')
  updateReadOnlyForm('typeSchemaRelationshipTarget', '')
}

export function typeSchemaSourceNote(
  snapshot: MobileWorkspaceSnapshot,
  typeName: string,
): MobileNote | null {
  const notes = workspaceNotes(snapshot)
  const definitionPath = snapshot.typeDefinitions?.[typeName]?.path
  if (definitionPath) {
    const pathMatch = notes.find((note) => note.path === definitionPath || note.id === definitionPath)
    if (pathMatch) return pathMatch
  }

  return notes.find((note) => note.type === 'Type' && note.title === typeName) ?? null
}

function workspaceNotes(snapshot: MobileWorkspaceSnapshot): MobileNote[] {
  return snapshot.allNotes ?? snapshot.notes
}
