import type { MobileNote } from './demoData'

export function selectMobileNoteAfterDelete({
  deletedNoteId,
  notes,
}: {
  deletedNoteId: string
  notes: MobileNote[]
}) {
  return notes.find((note) => note.id !== deletedNoteId)?.id ?? null
}
