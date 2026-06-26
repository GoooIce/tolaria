import { describe, expect, it } from 'vitest'
import type { VaultEntry } from '../types'
import { entriesToGraph, buildAdjacency, collapseNodesByType } from './graphData'

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

describe('buildAdjacency', () => {
  it('maps each node to its 1-hop neighbors (undirected)', () => {
    const links = [
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c' },
    ]
    const adj = buildAdjacency(links)
    expect(adj.get('a')).toEqual(new Set(['b']))
    expect(adj.get('b')).toEqual(new Set(['a', 'c']))
    expect(adj.get('c')).toEqual(new Set(['b']))
  })

  it('returns empty map for no links', () => {
    expect(buildAdjacency([]).size).toBe(0)
  })

  it('handles isolated nodes in links gracefully', () => {
    const adj = buildAdjacency([{ source: 'x', target: 'y' }])
    expect(adj.size).toBe(2)
    expect(adj.get('x')).toEqual(new Set(['y']))
  })

  it('produces neighbor sets usable for hover-highlight highlight decisions', () => {
    // Triangle: a-b, b-c, c-a — hovering 'a' should highlight a,b,c
    const links = [
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c' },
      { source: 'c', target: 'a' },
    ]
    const adj = buildAdjacency(links)
    const hovered = 'a'
    const highlightIds = new Set([hovered, ...(adj.get(hovered) ?? [])])
    expect(highlightIds).toEqual(new Set(['a', 'b', 'c']))
  })
})

describe('collapseNodesByType', () => {
  it('groups nodes by type when type is in collapsedTypes', () => {
    const { nodes } = entriesToGraph([
      makeEntry({ path: '/p1.md', title: 'P1', isA: 'Project' }),
      makeEntry({ path: '/p2.md', title: 'P2', isA: 'Project' }),
      makeEntry({ path: '/n1.md', title: 'N1', isA: 'Note' }),
    ])
    const collapsed = new Set(['Project'])
    const { nodes: result, groups } = collapseNodesByType(nodes, collapsed)
    // 1 super-node (Project) + 1 normal node (Note)
    expect(result).toHaveLength(2)
    expect(groups).toHaveLength(1)
    expect(groups[0].type).toBe('Project')
    expect(groups[0].members).toHaveLength(2)
    expect(groups[0].superNode.id).toBe('__type__Project')
    expect(groups[0].superNode.label).toBe('Project (2)')
  })

  it('leaves all nodes individual when collapsedTypes is empty', () => {
    const { nodes } = entriesToGraph([
      makeEntry({ path: '/p1.md', title: 'P1', isA: 'Project' }),
      makeEntry({ path: '/n1.md', title: 'N1', isA: 'Note' }),
    ])
    const { nodes: result, groups } = collapseNodesByType(nodes, new Set())
    expect(result).toHaveLength(2)
    expect(groups).toHaveLength(0)
  })

  it('super-node id is clickable-toggleable (expand/collapse contract)', () => {
    const { nodes } = entriesToGraph([
      makeEntry({ path: '/p1.md', title: 'P1', isA: 'Project' }),
    ])
    const { nodes: result } = collapseNodesByType(nodes, new Set(['Project']))
    expect(result[0].id.startsWith('__type__')).toBe(true)
    // Stripping the prefix yields the original type, enabling toggle.
    expect(result[0].id.replace('__type__', '')).toBe('Project')
  })
})
