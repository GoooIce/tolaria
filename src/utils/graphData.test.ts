import { describe, expect, it } from 'vitest'
import type { VaultEntry } from '../types'
import { entriesToGraph } from './graphData'

const makeEntry = (overrides: Partial<VaultEntry> = {}): VaultEntry => ({
  path: '/vault/note.md',
  filename: 'note.md',
  title: 'Note',
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

describe('entriesToGraph', () => {
  it('produces one node per entry', () => {
    const entries = [
      makeEntry({ path: '/vault/a.md', title: 'Alpha' }),
      makeEntry({ path: '/vault/b.md', title: 'Beta' }),
      makeEntry({ path: '/vault/c.md', title: 'Gamma' }),
    ]
    const { nodes, links } = entriesToGraph(entries)
    expect(nodes).toHaveLength(3)
    expect(links).toEqual([])
  })

  it('uses displayLabel (first alias) as the node label', () => {
    const entries = [
      makeEntry({
        path: '/vault/orthrus.md',
        title: '2605-12825-orthrus',
        aliases: ['Orthrus：双视图扩散'],
      }),
    ]
    const { nodes } = entriesToGraph(entries)
    expect(nodes[0].label).toBe('Orthrus：双视图扩散')
  })

  it('falls back to entry.title when aliases is empty', () => {
    const entries = [makeEntry({ path: '/vault/x.md', title: 'Plain Title', aliases: [] })]
    const { nodes } = entriesToGraph(entries)
    expect(nodes[0].label).toBe('Plain Title')
  })

  it('creates a link for each outgoingLinks target that resolves to a node', () => {
    const entries = [
      makeEntry({ path: '/vault/a.md', title: 'Alpha', outgoingLinks: ['beta'] }),
      makeEntry({ path: '/vault/beta.md', filename: 'beta.md', title: 'Beta' }),
    ]
    const { nodes, links } = entriesToGraph(entries)
    expect(nodes).toHaveLength(2)
    // outgoingLinks target 'beta' resolves by filename stem to beta.md
    expect(links).toHaveLength(1)
    expect(links[0].source).toBe('/vault/a.md')
    expect(links[0].target).toBe('/vault/beta.md')
  })

  it('creates links from belongsTo and relatedTo relationship fields', () => {
    const entries = [
      makeEntry({
        path: '/vault/project.md',
        title: 'Project',
        belongsTo: ['area'],
        relatedTo: ['sprint-1'],
      }),
      makeEntry({ path: '/vault/area.md', filename: 'area.md', title: 'Area' }),
      makeEntry({ path: '/vault/sprint-1.md', filename: 'sprint-1.md', title: 'Sprint 1' }),
    ]
    const { links } = entriesToGraph(entries)
    const targets = links.map((l) => l.target).sort()
    expect(targets).toEqual(['/vault/area.md', '/vault/sprint-1.md'])
  })

  it('creates links from generic relationship frontmatter keys', () => {
    const entries = [
      makeEntry({
        path: '/vault/a.md',
        title: 'A',
        relationships: { references: ['b'] },
      }),
      makeEntry({ path: '/vault/b.md', filename: 'b.md', title: 'B' }),
    ]
    const { links } = entriesToGraph(entries)
    expect(links).toHaveLength(1)
    expect(links[0].source).toBe('/vault/a.md')
    expect(links[0].target).toBe('/vault/b.md')
  })

  it('deduplicates links between the same pair', () => {
    const entries = [
      makeEntry({
        path: '/vault/a.md',
        title: 'A',
        outgoingLinks: ['b'],
        belongsTo: ['b'],
        relatedTo: ['b'],
      }),
      makeEntry({ path: '/vault/b.md', filename: 'b.md', title: 'B' }),
    ]
    const { links } = entriesToGraph(entries)
    expect(links).toHaveLength(1)
  })

  it('maps isA type to a color via getTypeColor', () => {
    const entries = [
      makeEntry({ path: '/vault/p.md', title: 'P', isA: 'Project' }),
      makeEntry({ path: '/vault/n.md', title: 'N', isA: 'Note' }),
    ]
    const { nodes } = entriesToGraph(entries)
    // different types → different colors
    expect(nodes[0].color).toBeTruthy()
    expect(nodes[1].color).toBeTruthy()
    expect(nodes[0].color).not.toBe(nodes[1].color)
  })

  it('excludes _index notes by default', () => {
    const entries = [
      makeEntry({ path: '/vault/visible.md', title: 'Visible' }),
      makeEntry({ path: '/vault/_index.md', title: 'Index', isIndex: true }),
    ]
    const { nodes } = entriesToGraph(entries)
    expect(nodes.map((n) => n.id)).toEqual(['/vault/visible.md'])
  })

  it('includes _index notes when includeIndex=true', () => {
    const entries = [
      makeEntry({ path: '/vault/visible.md', title: 'Visible' }),
      makeEntry({ path: '/vault/_index.md', title: 'Index', isIndex: true }),
    ]
    const { nodes } = entriesToGraph(entries, { includeIndex: true })
    expect(nodes.map((n) => n.id).sort()).toEqual(['/vault/_index.md', '/vault/visible.md'])
  })

  it('drops links whose target does not resolve to any node', () => {
    const entries = [
      makeEntry({ path: '/vault/a.md', title: 'A', outgoingLinks: ['ghost', 'b'] }),
      makeEntry({ path: '/vault/b.md', filename: 'b.md', title: 'B' }),
    ]
    const { links } = entriesToGraph(entries)
    expect(links).toHaveLength(1)
    expect(links[0].target).toBe('/vault/b.md')
  })

  it('preserves entry reference on node for navigation', () => {
    const entries = [makeEntry({ path: '/vault/a.md', title: 'A' })]
    const { nodes } = entriesToGraph(entries)
    expect(nodes[0].entry).toBe(entries[0])
  })

  it('handles empty input', () => {
    const { nodes, links } = entriesToGraph([])
    expect(nodes).toEqual([])
    expect(links).toEqual([])
  })
})
