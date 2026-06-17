import type { MobileNote } from './mobileWorkspaceModel'

type MobileInboxCandidate = Pick<MobileNote, 'archived' | 'organized' | 'type'>

export function isMobileInboxNote(note: MobileInboxCandidate): boolean {
  return !note.archived && !note.organized && note.type !== 'Type'
}
