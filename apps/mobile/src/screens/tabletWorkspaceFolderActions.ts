import type { MobileWorkspaceAction } from '../components/workspace/MobileWorkspaceActionSheet'
import type { MobileSidebarFolderSelection } from '../components/workspace/MobileWorkspaceSidebar'
import type { MobileWorkspaceEdit } from '../workspace/mobileWorkspaceEditing'
import { mobileFolderParentPath } from '../workspace/mobileWorkspaceFolders'
import type { TabletReadOnlyForm } from './tabletWorkspaceTypes'
import type { TabletSidebarSelection } from './tabletWorkspaceNavigation'

type ApplyWorkspaceEdit = (edit: MobileWorkspaceEdit) => void
type CloseWorkspaceAction = () => void
type ReadOnlyFormUpdater = <Key extends keyof TabletReadOnlyForm>(key: Key, value: TabletReadOnlyForm[Key]) => void
type SetOpenAction = (action: MobileWorkspaceAction | null) => void
type ReadOnlyFormField = {
  [Key in keyof TabletReadOnlyForm]: { key: Key; value: TabletReadOnlyForm[Key] }
}[keyof TabletReadOnlyForm]

export function folderWorkspaceActions({
  applyEdit,
  closeAction,
  readOnlyForm,
  setOpenAction,
  updateReadOnlyForm,
}: {
  applyEdit: ApplyWorkspaceEdit
  closeAction: CloseWorkspaceAction
  readOnlyForm: TabletReadOnlyForm
  setOpenAction: SetOpenAction
  updateReadOnlyForm: ReadOnlyFormUpdater
}) {
  return {
    onCreateFolder: () => commitFolderEdit({
      applyEdit,
      closeAction,
      edit: {
        name: readOnlyForm.folderName,
        parentPath: readOnlyForm.folderParentPath,
        type: 'createFolder',
      },
    }),
    onDeleteFolder: () => deleteFolder({
      applyEdit,
      closeAction,
      folderPath: readOnlyForm.editingFolderPath,
    }),
    onFolderNameChange: (value: string) => updateReadOnlyForm('folderName', value),
    onOpenCreateChildFolder: () => openCreateFolderAction({
      parentPath: readOnlyForm.editingFolderPath,
      setOpenAction,
      updateReadOnlyForm,
    }),
    onRenameFolder: () => commitFolderEdit({
      applyEdit,
      closeAction,
      edit: {
        folderPath: readOnlyForm.editingFolderPath,
        name: readOnlyForm.folderName,
        type: 'renameFolder',
      },
    }),
  }
}

export function createFolderFields(parentPath: string): ReadOnlyFormField[] {
  return [
    { key: 'editingFolderPath', value: '' },
    { key: 'folderName', value: '' },
    { key: 'folderParentPath', value: parentPath },
  ]
}

export function folderActionFields(selection: MobileSidebarFolderSelection): ReadOnlyFormField[] {
  return [
    { key: 'editingFolderPath', value: selection.id },
    { key: 'folderName', value: selection.name },
    { key: 'folderParentPath', value: mobileFolderParentPath(selection.id) },
  ]
}

export function folderParentPathForSelection(selection: TabletSidebarSelection): string {
  return selection.kind === 'folder' ? selection.id : ''
}

function openCreateFolderAction({
  parentPath,
  setOpenAction,
  updateReadOnlyForm,
}: {
  parentPath: string
  setOpenAction: SetOpenAction
  updateReadOnlyForm: ReadOnlyFormUpdater
}) {
  for (const field of createFolderFields(parentPath)) {
    updateReadOnlyForm(field.key, field.value)
  }
  setOpenAction('createFolder')
}

function commitFolderEdit({
  applyEdit,
  closeAction,
  edit,
}: {
  applyEdit: ApplyWorkspaceEdit
  closeAction: CloseWorkspaceAction
  edit: MobileWorkspaceEdit
}) {
  applyEdit(edit)
  closeAction()
}

function deleteFolder({
  applyEdit,
  closeAction,
  folderPath,
}: {
  applyEdit: ApplyWorkspaceEdit
  closeAction: CloseWorkspaceAction
  folderPath: string
}) {
  if (!folderPath) return
  commitFolderEdit({ applyEdit, closeAction, edit: { folderPath, type: 'deleteFolder' } })
}
