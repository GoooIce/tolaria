import { describe, expect, it } from 'vitest'
import {
  normalizeRelationshipKey,
  relationshipFrontmatterKey,
  relationshipKeyForKind,
  relationshipKindForKey,
} from './relationshipKeys'

describe('relationship key helpers', () => {
  it('normalizes desktop relationship labels to frontmatter keys', () => {
    expect(normalizeRelationshipKey('Belongs to')).toBe('belongs_to')
    expect(normalizeRelationshipKey(' Related To ')).toBe('related_to')
  })

  it('maps canonical and has-prefixed relationship keys to desktop relationship kinds', () => {
    expect(relationshipKindForKey('belongs_to')).toBe('belongsTo')
    expect(relationshipKindForKey('related to')).toBe('relatedTo')
    expect(relationshipKindForKey('has')).toBe('has')
    expect(relationshipKindForKey('has_part')).toBe('has')
    expect(relationshipKindForKey('mentioned_by')).toBe('custom')
  })

  it('maps relationship kinds back to canonical desktop frontmatter keys', () => {
    expect(relationshipKeyForKind('belongsTo')).toBe('belongs_to')
    expect(relationshipKeyForKind('relatedTo')).toBe('related_to')
    expect(relationshipKeyForKind('has')).toBe('has')
    expect(relationshipKeyForKind('custom')).toBeNull()
  })

  it('prefers persisted keys before kind and label fallbacks', () => {
    expect(relationshipFrontmatterKey({ key: 'has_part', kind: 'has' })).toBe('has_part')
    expect(relationshipFrontmatterKey({ kind: 'belongsTo' })).toBe('belongs_to')
    expect(relationshipFrontmatterKey({ kind: 'custom', label: 'Mentioned by' })).toBe('Mentioned by')
    expect(relationshipFrontmatterKey({ kind: 'custom' })).toBe('related_to')
  })
})
