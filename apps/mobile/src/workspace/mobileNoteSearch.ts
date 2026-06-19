import { mobileNoteDisplayLabels } from './mobileNoteDisplay'
import type { MobileNote, MobilePropertyDisplayMode, MobileTypeDefinitions } from './mobileWorkspaceModel'

type DisplayPropertyKey = string
type DisplayModeOverrides = Record<string, MobilePropertyDisplayMode>
type SearchQuery = string
type SearchText = string

export type MobileNoteListSearchContext = {
  displayModes?: DisplayModeOverrides | null
  displayPropertyKeys?: DisplayPropertyKey[]
  typeDefinitions?: MobileTypeDefinitions
}

export function normalizedMobileSearchQuery(value: SearchQuery) {
  return normalizeSearchText(value)
}

export function mobileNoteIdentitySearchText(note: MobileNote) {
  return normalizeSearchText([
    note.title,
    ...(note.aliases ?? []),
    noteFilename(note),
    noteFilenameStem(note),
    note.type,
    note.tags.join(' '),
    note.path ?? '',
  ].join(' '))
}

export function mobileNoteIdentityMatchesQuery(note: MobileNote, query: SearchQuery) {
  const normalizedQuery = normalizedMobileSearchQuery(query)
  if (!normalizedQuery) return true

  return mobileNoteIdentitySearchText(note).includes(normalizedQuery)
}

export function mobileQuickOpenSearchText(note: MobileNote) {
  return normalizeSearchText([
    mobileNoteIdentitySearchText(note),
    note.snippet,
    note.status,
  ].join(' '))
}

export function mobileNoteListMatchesQuery(
  note: MobileNote,
  query: SearchQuery,
  context: MobileNoteListSearchContext = {},
) {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return true

  return mobileNoteListSearchText(note, context).includes(normalizedQuery)
}

export function mobileNoteListSearchText(
  note: MobileNote,
  context: MobileNoteListSearchContext = {},
) {
  const { displayModes, displayPropertyKeys = [], typeDefinitions } = context

  return normalizeSearchText([
    note.title,
    note.snippet,
    ...mobileNoteDisplayLabels(note, displayPropertyKeys, typeDefinitions, displayModes),
  ].join(' '))
}

function normalizeSearchText(value: SearchText) {
  return value.normalize('NFKD').replace(/\p{Mark}/gu, '').trim().toLowerCase()
}

function noteFilename(note: MobileNote) {
  return (note.path ?? note.id).split('/').at(-1) ?? note.id
}

function noteFilenameStem(note: MobileNote) {
  return noteFilename(note).replace(/\.md$/iu, '')
}
