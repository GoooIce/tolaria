import { describe, expect, it } from 'vitest'
import type { VaultEntry } from '../types'
import { displayLabel } from './noteLabel'

const makeEntry = (overrides: Partial<VaultEntry> = {}): VaultEntry => ({
  path: '/test.md',
  filename: 'test.md',
  title: 'Test Title',
  isA: null,
  aliases: [],
  belongsTo: [],
  relatedTo: [],
  status: null,
  archived: false,
  modifiedAt: null,
  createdAt: null,
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
  organized: false,
  favorite: false,
  favoriteIndex: null,
  listPropertiesDisplay: [],
  outgoingLinks: [],
  properties: {},
  hasH1: false,
  isIndex: false,
  ...overrides,
})

describe('displayLabel', () => {
  it('returns the first alias when aliases is non-empty', () => {
    const entry = makeEntry({
      title: '2605-12825-orthrus',
      aliases: ['Orthrus：双视图扩散', 'Orthrus'],
    })
    expect(displayLabel(entry)).toBe('Orthrus：双视图扩散')
  })

  it('falls back to title when aliases is empty', () => {
    const entry = makeEntry({ title: 'Speculative Decoding', aliases: [] })
    expect(displayLabel(entry)).toBe('Speculative Decoding')
  })

  it('falls back to title when aliases is absent', () => {
    const entry = makeEntry({ title: 'Hello' })
    expect(displayLabel(entry)).toBe('Hello')
  })

  it('skips blank aliases and falls back to title', () => {
    const entry = makeEntry({ title: 'Fallback', aliases: ['', '  ', 'Second'] })
    expect(displayLabel(entry)).toBe('Second')
  })

  it('falls back to title when all aliases are blank', () => {
    const entry = makeEntry({ title: 'Only Title', aliases: ['', '  '] })
    expect(displayLabel(entry)).toBe('Only Title')
  })

  it('returns empty string when both title and aliases are absent', () => {
    const entry = makeEntry({ title: '', aliases: [] })
    expect(displayLabel(entry)).toBe('')
  })
})
