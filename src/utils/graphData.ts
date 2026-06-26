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
