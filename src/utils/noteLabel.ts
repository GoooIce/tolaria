import type { VaultEntry } from '../types'

/**
 * Pick the human-facing label for a note in navigation surfaces.
 *
 * Prefers the first non-blank alias (e.g. a localized/Chinese title) and
 * falls back to the resolved display title. This is a display-layer override
 * only — it never changes the on-disk title resolution (ADR-0044) or wikilink
 * targets, which keep using `entry.title` / filename.
 */
export function displayLabel(entry: Pick<VaultEntry, 'title' | 'aliases'>): string {
  const firstAlias = entry.aliases?.find((alias) => alias.trim().length > 0)
  return firstAlias ?? entry.title ?? ''
}
