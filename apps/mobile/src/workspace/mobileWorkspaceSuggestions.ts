import type { MobileNote, MobileRelationship } from './mobileWorkspaceModel'

type PropertyKey = string
type PropertyValueText = string
type RelationshipKey = string
type SuggestionQuery = string
type SuggestionText = string
type NormalizedSuggestionKey = string

const DESKTOP_SUGGESTED_PROPERTY_KEYS = ['Status', 'Date', 'URL'] as const
const DESKTOP_SUGGESTED_RELATIONSHIP_KEYS = ['belongs_to', 'related_to', 'has'] as const
const CANONICAL_RELATIONSHIP_KEYS: Partial<Record<NormalizedSuggestionKey, RelationshipKey>> = {
  belongs_to: 'belongs_to',
  has: 'has',
  related_to: 'related_to',
}
const RELATIONSHIP_KIND_KEYS: Partial<Record<MobileRelationship['kind'], RelationshipKey>> = {
  belongsTo: 'belongs_to',
  has: 'has',
  relatedTo: 'related_to',
}

export function mobilePropertyKeySuggestions(
  notes: MobileNote[],
  selectedNote: MobileNote | null,
  query: SuggestionQuery,
): PropertyKey[] {
  const selectedKeys = selectedPropertyKeys(selectedNote)
  return visibleSuggestions(propertyKeyCandidates(notes), query)
    .filter((key) => !selectedKeys.has(canonicalSuggestionKey(key)))
}

export function mobilePropertyValueSuggestions(
  notes: MobileNote[],
  key: PropertyKey,
  query: SuggestionQuery,
): PropertyValueText[] {
  const normalizedKey = canonicalSuggestionKey(key)
  if (!normalizedKey) return []
  return visibleSuggestions(propertyValueCandidates(notes, normalizedKey), query)
}

export function mobileRelationshipKeySuggestions(
  notes: MobileNote[],
  query: SuggestionQuery,
): RelationshipKey[] {
  return visibleSuggestions(relationshipKeyCandidates(notes), query)
}

export function normalizeRelationshipKey(key: RelationshipKey): RelationshipKey {
  const trimmed = key.trim()
  const canonical = canonicalSuggestionKey(trimmed)
  const relationshipKey = CANONICAL_RELATIONSHIP_KEYS[canonical]
  return relationshipKey === undefined ? trimmed : relationshipKey
}

function propertyKeyCandidates(notes: MobileNote[]): PropertyKey[] {
  return [
    ...DESKTOP_SUGGESTED_PROPERTY_KEYS,
    ...notes.flatMap((note) => propertiesForNote(note).map((property) => property.key)),
  ]
}

function propertyValueCandidates(
  notes: MobileNote[],
  normalizedKey: NormalizedSuggestionKey,
): PropertyValueText[] {
  return notes.flatMap((note) => propertyValuesForSuggestion(note, normalizedKey))
}

function relationshipKeyCandidates(notes: MobileNote[]): RelationshipKey[] {
  return [
    ...DESKTOP_SUGGESTED_RELATIONSHIP_KEYS,
    ...notes.flatMap((note) => note.relationships.map(relationshipFrontmatterKey)),
  ]
}

function visibleSuggestions(
  values: readonly SuggestionText[],
  query: SuggestionQuery,
): SuggestionText[] {
  return uniqueSuggestedKeys(values)
    .filter((value) => matchesSuggestionQuery(value, query))
    .slice(0, 8)
}

function selectedPropertyKeys(note: MobileNote | null): Set<NormalizedSuggestionKey> {
  if (!note) return new Set()

  const keys = new Set(propertiesForNote(note).map((property) => canonicalSuggestionKey(property.key)))
  if (note.status) keys.add('status')
  if (note.tags.length > 0) keys.add('tags')
  return keys
}

function propertyValuesForSuggestion(
  note: MobileNote,
  normalizedKey: NormalizedSuggestionKey,
): PropertyValueText[] {
  const specialValues = specialPropertyValuesForSuggestion(note, normalizedKey)
  if (specialValues !== null) return specialValues
  return propertyValueTexts(note, normalizedKey)
}

function specialPropertyValuesForSuggestion(
  note: MobileNote,
  normalizedKey: NormalizedSuggestionKey,
): PropertyValueText[] | null {
  if (normalizedKey === 'status') return note.status ? [note.status] : []
  if (normalizedKey === 'tags') return note.tags
  return null
}

function propertyValueTexts(
  note: MobileNote,
  normalizedKey: NormalizedSuggestionKey,
): PropertyValueText[] {
  const property = propertiesForNote(note).find((candidate) => canonicalSuggestionKey(candidate.key) === normalizedKey)
  if (!property) return []
  return Array.isArray(property.value) ? property.value : [String(property.value)]
}

function relationshipFrontmatterKey(relationship: MobileRelationship): RelationshipKey {
  const kindKey = relationshipKeyForKind(relationship)
  if (relationship.key) return relationship.key
  if (kindKey) return kindKey
  return relationship.label ? relationship.label : 'related_to'
}

function propertiesForNote(note: MobileNote) {
  return note.properties ? note.properties : []
}

function relationshipKeyForKind(relationship: MobileRelationship): RelationshipKey | null {
  return RELATIONSHIP_KIND_KEYS[relationship.kind] ?? null
}

function uniqueSuggestedKeys(values: readonly SuggestionText[]): SuggestionText[] {
  const seen = new Set<NormalizedSuggestionKey>()
  const result: SuggestionText[] = []

  for (const value of values) {
    const trimmed = value.trim()
    const canonical = canonicalSuggestionKey(trimmed)
    if (!trimmed || seen.has(canonical)) continue
    seen.add(canonical)
    result.push(trimmed)
  }

  return result
}

function matchesSuggestionQuery(value: SuggestionText, query: SuggestionQuery): boolean {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true
  return value.toLowerCase().includes(normalizedQuery)
    || humanizeSuggestionLabel(value).toLowerCase().includes(normalizedQuery)
}

function canonicalSuggestionKey(key: SuggestionText): NormalizedSuggestionKey {
  return key.trim().toLowerCase().replace(/[-\s]+/g, '_')
}

function humanizeSuggestionLabel(label: SuggestionText): SuggestionText {
  return label
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
