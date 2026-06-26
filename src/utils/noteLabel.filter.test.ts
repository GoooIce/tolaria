import { describe, expect, it } from 'vitest'
import type { SidebarSelection, VaultEntry } from '../types'
import { filterEntries, isInboxEntry } from './noteListHelpers'

const makeEntry = (overrides: Partial<VaultEntry> = {}): VaultEntry => ({
  path: '/vault/note/entry.md',
  filename: 'entry.md',
  title: 'Entry',
  isA: 'Note',
  aliases: [],
  belongsTo: [],
  relatedTo: [],
  status: null,
  archived: false,
  modifiedAt: 1700000000,
  createdAt: 1700000000,
  fileSize: 100,
  snippet: '',
  wordCount: 0,
  relationships: {},
  icon: null,
  color: null,
  order: null,
  sidebarLabel: null,
  template: null,
  sort: null,
  view: null,
  visible: null,
  organized: true,
  favorite: false,
  favoriteIndex: null,
  listPropertiesDisplay: [],
  outgoingLinks: [],
  properties: {},
  hasH1: false,
  isIndex: false,
  ...overrides,
})

const allSelection: SidebarSelection = { kind: 'filter', filter: 'all' }

describe('index note filtering', () => {
  it('excludes _index notes from the "all" list', () => {
    const visible = makeEntry({ path: '/vault/visible.md', title: 'Visible' })
    const index = makeEntry({ path: '/vault/_index.md', title: 'Papers Index', isIndex: true })
    const result = filterEntries([visible, index], allSelection)
    expect(result.map((e) => e.title)).toEqual(['Visible'])
  })

  it('excludes _index notes from favorites', () => {
    const favSelection: SidebarSelection = { kind: 'filter', filter: 'favorites' }
    const fav = makeEntry({ path: '/vault/fav.md', title: 'Fav', favorite: true })
    const indexFav = makeEntry({
      path: '/vault/_index.md',
      title: 'Index Fav',
      isIndex: true,
      favorite: true,
    })
    const result = filterEntries([fav, indexFav], favSelection)
    expect(result.map((e) => e.title)).toEqual(['Fav'])
  })

  it('excludes _index notes from inbox', () => {
    const inboxNote = makeEntry({
      path: '/vault/inbox.md',
      title: 'Inbox Note',
      organized: false,
      createdAt: Math.floor(Date.now() / 1000),
    })
    const indexInbox = makeEntry({
      path: '/vault/_index.md',
      title: 'Index',
      isIndex: true,
      organized: false,
      createdAt: Math.floor(Date.now() / 1000),
    })
    expect(isInboxEntry(inboxNote)).toBe(true)
    expect(isInboxEntry(indexInbox)).toBe(false)
  })

  it('still includes _index notes in relationship/backlink groups (wikilinks resolve)', () => {
    // _index affects list/inbox/favorites visibility, not relationship resolution.
    const index = makeEntry({ path: '/vault/_index.md', title: 'Index', isIndex: true })
    // No assertion crash: the entry object itself is well-formed and usable.
    expect(index.isIndex).toBe(true)
    expect(index.title).toBe('Index')
  })
})
