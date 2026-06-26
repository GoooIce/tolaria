import type { VaultEntry } from '../types'
import { displayLabel } from './noteLabel'
import { resolveEntry } from './wikilink'
import { getTypeColor } from './typeColors'

export interface GraphNode {
  id: string
  label: string
  color: string
  entry: VaultEntry
}

export interface GraphLink {
  source: string
  target: string
}

export interface EntriesToGraphOptions {
  includeIndex?: boolean
}

/** Target keys on VaultEntry that hold wikilink relationship arrays. */
const RELATIONSHIP_KEYS: ReadonlyArray<keyof VaultEntry> = ['belongsTo', 'relatedTo']

/**
 * Transform VaultEntry[] into the { nodes, links } shape force-graph consumes.
 *
 * - Nodes: one per non-_index entry, labeled via `displayLabel` (alias-first),
 *   colored via `getTypeColor` keyed on `isA`.
 * - Links: derived from `outgoingLinks`, `belongsTo`, `relatedTo`, and generic
 *   `relationships`. Targets resolve via the same `resolveEntry` used for
 *   wikilinks, so links match real navigation behavior. Self-loops and
 *   duplicate pairs are removed.
 *
 * Pure function (deterministic given entries), so it is cheap to memoize.
 */
export function entriesToGraph(
  entries: VaultEntry[],
  options: EntriesToGraphOptions = {},
): { nodes: GraphNode[]; links: GraphLink[] } {
  const { includeIndex = false } = options

  const visibleEntries = entries.filter((e) => includeIndex || !e.isIndex)
  const nodes: GraphNode[] = visibleEntries.map((entry) => ({
    id: entry.path,
    label: displayLabel(entry),
    color: getTypeColor(entry.isA, entry.color),
    entry,
  }))

  const resolvable = visibleEntries
  const linkSet = new Set<string>()
  const links: GraphLink[] = []

  const addLink = (sourcePath: string, rawTarget: string) => {
    const source = resolvable.find((e) => e.path === sourcePath)
    if (!source) return
    const resolved = resolveEntry(resolvable, rawTarget, source)
    if (!resolved || resolved.path === sourcePath) return
    const key = `${sourcePath}\u0001${resolved.path}`
    if (linkSet.has(key)) return
    linkSet.add(key)
    links.push({ source: sourcePath, target: resolved.path })
  }

  for (const entry of resolvable) {
    entry.outgoingLinks.forEach((target) => addLink(entry.path, target))
    RELATIONSHIP_KEYS.forEach((key) => {
      const targets = entry[key] as string[] | undefined
      targets?.forEach((target) => addLink(entry.path, target))
    })
    for (const targets of Object.values(entry.relationships)) {
      targets.forEach((target) => addLink(entry.path, target))
    }
  }

  return { nodes, links }
}

/**
 * Build a 1-hop adjacency map from links (Phase 2 hover-highlight support).
 * Each node id maps to the set of its direct neighbors.
 */
export function buildAdjacency(
  links: ReadonlyArray<{ source: string; target: string }>,
): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>()
  for (const { source, target } of links) {
    if (!adj.has(source)) adj.set(source, new Set())
    if (!adj.has(target)) adj.set(target, new Set())
    adj.get(source)!.add(target)
    adj.get(target)!.add(source)
  }
  return adj
}

/** A node aggregated from collapsing a type group (Phase 3). */
export interface CollapsedGroup {
  type: string
  members: GraphNode[]
  superNode: GraphNode
}

/**
 * Collapse nodes by their `isA` type into super-nodes (Phase 3 aggregation).
 * Nodes whose type is in `collapsedTypes` are grouped; others stay individual.
 * Returns the merged node list (supers + individuals) and the group details.
 */
export function collapseNodesByType(
  nodes: GraphNode[],
  collapsedTypes: ReadonlySet<string>,
): { nodes: GraphNode[]; groups: CollapsedGroup[] } {
  const collapsedGroups: CollapsedGroup[] = []
  const normalNodes: GraphNode[] = []
  for (const node of nodes) {
    const type = node.entry.isA
    if (type && collapsedTypes.has(type)) {
      const existing = collapsedGroups.find((g) => g.type === type)
      if (existing) {
        existing.members.push(node)
      } else {
        collapsedGroups.push({
          type,
          members: [node],
          superNode: {
            id: `__type__${type}`,
            label: `${type} (${1})`,
            color: node.color,
            entry: node.entry,
          },
        })
      }
    } else {
      normalNodes.push(node)
    }
  }
  // Fix member counts in labels now that groups are complete.
  for (const group of collapsedGroups) {
    group.superNode.label = `${group.type} (${group.members.length})`
  }
  return { nodes: [...normalNodes, ...collapsedGroups.map((g) => g.superNode)], groups: collapsedGroups }
}
