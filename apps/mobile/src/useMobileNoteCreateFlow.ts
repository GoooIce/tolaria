import { useCallback, useState } from 'react'
import type { MobileNote } from './demoData'

export function useMobileNoteCreateFlow({
  createNote,
  onCreated,
}: {
  createNote: (title: string) => Promise<MobileNote | null>
  onCreated: (note: MobileNote) => void
}) {
  const [failed, setFailed] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isPromptOpen, setIsPromptOpen] = useState(false)
  const [title, setTitle] = useState('')

  const cancel = useCallback(() => {
    if (isCreating) {
      return
    }

    setFailed(false)
    setIsPromptOpen(false)
    setTitle('')
  }, [isCreating])

  const open = useCallback(() => {
    setFailed(false)
    setIsPromptOpen(true)
  }, [])

  const submit = useCallback(() => {
    if (isCreating) {
      return
    }

    setFailed(false)
    setIsCreating(true)
    void createNote(title)
      .then((note) => {
        if (note) {
          setIsPromptOpen(false)
          setTitle('')
          onCreated(note)
        }
      })
      .catch(() => {
        setFailed(true)
      })
      .finally(() => {
        setIsCreating(false)
      })
  }, [createNote, isCreating, onCreated, title])

  return {
    cancel,
    failed,
    isCreating,
    isPromptOpen,
    open,
    setTitle,
    submit,
    title,
  }
}
