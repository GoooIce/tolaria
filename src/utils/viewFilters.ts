import type { VaultEntry, ViewDefinition } from '../types'
import { evaluateViewEntries } from './viewFilterEvaluation'

/** Evaluate a view's filters against a list of entries, returning only matches. */
export function evaluateView(definition: ViewDefinition, entries: VaultEntry[]): VaultEntry[] {
  return evaluateViewEntries(definition, entries)
}
