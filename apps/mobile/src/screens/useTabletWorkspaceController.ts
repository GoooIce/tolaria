import { useCallback, useEffect, useRef, useState } from 'react'
import type { MobileWorkspaceAction } from '../components/workspace/MobileWorkspaceActionSheet'
import type { MobileNote, MobilePropertyValue, MobileWorkspaceSnapshot } from '../workspace/mobileWorkspaceModel'
import {
  applyMobileWorkspaceEditWithWrites,
  type MobileWorkspaceEdit,
} from '../workspace/mobileWorkspaceEditing'
import type {
  ReadOnlyWorkspaceRepository,
  ReadOnlyWorkspaceRequest,
} from '../workspace/readOnlyWorkspaceRepository'
import { useTabletWorkspaceNavigation } from './tabletWorkspaceNavigation'
import type { TabletReadOnlyForm } from './tabletWorkspaceTypes'

const emptyReadOnlyForm: TabletReadOnlyForm = {
  createTitle: '',
  propertyName: '',
  propertyValue: '',
  relationshipName: '',
  relationshipNoteTitle: '',
}

export function useTabletWorkspaceController({
  repository,
  repositoryRequest,
  snapshot,
}: {
  repository: ReadOnlyWorkspaceRepository
  repositoryRequest?: ReadOnlyWorkspaceRequest
  snapshot: MobileWorkspaceSnapshot
}) {
  const { applyWorkspaceEdit, workspaceSnapshot } = useWorkspaceEditPipeline({
    repository,
    repositoryRequest,
    snapshot,
  })
  const [openAction, setOpenAction] = useState<MobileWorkspaceAction | null>(null)
  const { readOnlyForm, resetForm, updateReadOnlyForm } = useReadOnlyFormState()
  const [searchQuery, setSearchQuery] = useState('')
  const navigation = useTabletWorkspaceNavigation(workspaceSnapshot, searchQuery)
  const { selectedNote, setSelectedNoteId } = navigation
  const applyEdit = useCallback((edit: MobileWorkspaceEdit) => {
    const result = applyWorkspaceEdit(edit)
    if (edit.type === 'createNote' && result.snapshot.selectedNoteId) {
      setSelectedNoteId(result.snapshot.selectedNoteId)
    }
  }, [applyWorkspaceEdit, setSelectedNoteId])
  const closeAction = useCallback(() => {
    setOpenAction(null)
    resetForm()
  }, [resetForm])
  const saveSelectedEdit = useCallback((toEdit: (noteId: string) => MobileWorkspaceEdit) => {
    if (!selectedNote) return
    applyEdit(toEdit(selectedNote.id))
    closeAction()
  }, [applyEdit, closeAction, selectedNote])
  useHydrateSelectedNote({ applyEdit, repository, repositoryRequest, selectedNote })

  return {
    ...navigation,
    openAction,
    readOnlyForm,
    searchQuery,
    snapshot: workspaceSnapshot,
    onSelectFolder: navigation.selectFolder,
    onSelectNote: navigation.setSelectedNoteId,
    onSelectSidebarItem: navigation.selectSidebarItem,
    onAddProperty: () => setOpenAction('addProperty' as const),
    onAddRelationship: () => setOpenAction('addRelationship' as const),
    onCloseAction: closeAction,
    onCreateNote: () => createNote({ applyEdit, closeAction, title: readOnlyForm.createTitle }),
    onCreateTitleChange: (value: string) => updateReadOnlyForm('createTitle', value),
    onDeleteProperty: (noteId: string, key: string) => applyEdit({ key, noteId, type: 'deleteProperty' }),
    onOpenCreateNote: () => setOpenAction('createNote' as const),
    onOpenMoreActions: () => setOpenAction('moreActions' as const),
    onOpenSearch: () => setOpenAction('search' as const),
    onPropertyNameChange: (value: string) => updateReadOnlyForm('propertyName', value),
    onPropertyValueChange: (value: string) => updateReadOnlyForm('propertyValue', value),
    onRelationshipNameChange: (value: string) => updateReadOnlyForm('relationshipName', value),
    onRelationshipNoteTitleChange: (value: string) => updateReadOnlyForm('relationshipNoteTitle', value),
    onRemoveRelationship: (noteId: string, key: string, ref: string) => applyEdit({ key, noteId, ref, type: 'removeRelationship' }),
    onSaveProperty: () => saveSelectedEdit((noteId) => propertyEdit(readOnlyForm, noteId)),
    onSaveRelationship: () => saveSelectedEdit((noteId) => relationshipEdit(readOnlyForm, noteId)),
    onSearchQueryChange: setSearchQuery,
    onToggleFavorite: () => {
      if (selectedNote) applyEdit({ noteId: selectedNote.id, type: 'toggleFavorite' })
    },
    onUpdateNoteContent: (noteId: string, content: string) => applyEdit({ content, noteId, type: 'updateNoteContent' }),
    onUpdateNoteTitle: (noteId: string, title: string) => applyEdit({ noteId, title, type: 'renameNoteTitle' }),
    onUpdateProperty: (noteId: string, key: string, value: MobilePropertyValue) => applyEdit({ key, noteId, type: 'updateProperty', value }),
  }
}

function useWorkspaceEditPipeline({
  repository,
  repositoryRequest,
  snapshot,
}: {
  repository: ReadOnlyWorkspaceRepository
  repositoryRequest?: ReadOnlyWorkspaceRequest
  snapshot: MobileWorkspaceSnapshot
}) {
  const [workspaceSnapshot, setWorkspaceSnapshot] = useState(snapshot)
  const workspaceSnapshotRef = useRef(workspaceSnapshot)
  const applyWorkspaceEdit = useCallback((edit: MobileWorkspaceEdit) => {
    const result = applyMobileWorkspaceEditWithWrites(workspaceSnapshotRef.current, edit)
    workspaceSnapshotRef.current = result.snapshot
    setWorkspaceSnapshot(result.snapshot)
    if (result.writes.length > 0) void repository.persistWrites(result.writes, repositoryRequest)
    return result
  }, [repository, repositoryRequest])

  useEffect(() => {
    workspaceSnapshotRef.current = workspaceSnapshot
  }, [workspaceSnapshot])

  return {
    applyWorkspaceEdit,
    workspaceSnapshot,
  }
}

function useReadOnlyFormState() {
  const [readOnlyForm, setReadOnlyForm] = useState<TabletReadOnlyForm>(emptyReadOnlyForm)
  const updateReadOnlyForm = useCallback(<Key extends keyof TabletReadOnlyForm,>(key: Key, value: TabletReadOnlyForm[Key]) => {
    setReadOnlyForm((current) => ({ ...current, [key]: value }))
  }, [])

  return {
    readOnlyForm,
    resetForm: useCallback(() => setReadOnlyForm(emptyReadOnlyForm), []),
    updateReadOnlyForm,
  }
}

function useHydrateSelectedNote({
  applyEdit,
  repository,
  repositoryRequest,
  selectedNote,
}: {
  applyEdit: (edit: MobileWorkspaceEdit) => void
  repository: ReadOnlyWorkspaceRepository
  repositoryRequest?: ReadOnlyWorkspaceRequest
  selectedNote: MobileNote | null
}) {
  useEffect(() => {
    if (!selectedNote || selectedNote.rawContent !== undefined) return

    let cancelled = false
    void repository.readNoteContent(selectedNote, repositoryRequest).then((rawContent) => {
      if (cancelled || rawContent === null) return
      applyEdit({ noteId: selectedNote.id, rawContent, type: 'hydrateNoteContent' })
    })

    return () => {
      cancelled = true
    }
  }, [applyEdit, repository, repositoryRequest, selectedNote])
}

function createNote({
  applyEdit,
  closeAction,
  title,
}: {
  applyEdit: (edit: MobileWorkspaceEdit) => void
  closeAction: () => void
  title: string
}) {
  applyEdit({ title, type: 'createNote' })
  closeAction()
}

function propertyEdit(form: TabletReadOnlyForm, noteId: string): MobileWorkspaceEdit {
  return {
    key: form.propertyName,
    noteId,
    type: 'updateProperty',
    value: form.propertyValue,
  }
}

function relationshipEdit(form: TabletReadOnlyForm, noteId: string): MobileWorkspaceEdit {
  return {
    key: form.relationshipName,
    noteId,
    targetTitle: form.relationshipNoteTitle,
    type: 'addRelationship',
  }
}
