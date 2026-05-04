import { useCallback, useState } from 'react'
import type { MobileNote } from './demoData'
import { selectMobileNoteAfterDelete } from './mobileNoteDelete'

export function useMobileNoteDeleteFlow({
  deleteNote,
  loadNotes,
  notes,
  onNotesLoaded,
  onSelectedNoteId,
  selectedNoteId,
}: {
  deleteNote: (noteId: string) => Promise<void>
  loadNotes: () => Promise<MobileNote[]>
  notes: MobileNote[]
  onNotesLoaded: (notes: MobileNote[]) => void
  onSelectedNoteId: (noteId: string) => void
  selectedNoteId: string
}) {
  const [isDeleting, setIsDeleting] = useState(false)
  const canDelete = notes.length > 1

  const deleteSelectedNote = useCallback(() => {
    if (isDeleting || !canDelete) {
      return
    }

    setIsDeleting(true)
    void deleteNote(selectedNoteId)
      .then(async () => {
        const loadedNotes = await loadNotes()
        onNotesLoaded(loadedNotes)
        const nextNoteId = selectMobileNoteAfterDelete({ deletedNoteId: selectedNoteId, notes: loadedNotes })
        if (nextNoteId) {
          onSelectedNoteId(nextNoteId)
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsDeleting(false)
      })
  }, [canDelete, deleteNote, isDeleting, loadNotes, onNotesLoaded, onSelectedNoteId, selectedNoteId])

  return {
    canDelete,
    deleteSelectedNote,
    isDeleting,
  }
}
