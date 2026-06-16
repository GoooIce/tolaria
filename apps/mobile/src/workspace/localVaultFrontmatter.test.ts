import { describe, expect, it } from 'vitest'
import {
  frontmatterList,
  frontmatterProperties,
  frontmatterRelationships,
  frontmatterScalar,
  parseLocalVaultDocument,
} from './localVaultFrontmatter'

describe('local vault frontmatter', () => {
  it('reads desktop-normalized metadata aliases without exposing them as properties', () => {
    const document = parseLocalVaultDocument(`---
is a: Project
STATUS: Active
TAGS:
  - Design
custom: value
related to:
  - "[[Target]]"
---
Body.
`)

    expect(frontmatterScalar(document.frontmatter, ['type', 'Is A', 'is_a'])).toBe('Project')
    expect(frontmatterScalar(document.frontmatter, ['status'])).toBe('Active')
    expect(frontmatterList(document.frontmatter, ['tags'])).toEqual(['Design'])
    expect(frontmatterProperties(document.frontmatter)).toEqual({ custom: 'value' })
  })

  it('prefers exact frontmatter keys before normalized aliases', () => {
    expect(frontmatterScalar({
      'is a': 'Project',
      type: 'Note',
    }, ['type', 'Is A', 'is_a'])).toBe('Note')
  })

  it('keeps quoted commas inside desktop inline array frontmatter values', () => {
    const document = parseLocalVaultDocument(`---
aliases: ["Mobile, UI", "Tablet"]
tags: ['AI, UX', Design]
score: [1, true, "Needs, Review"]
---
Body.
`)

    expect(frontmatterList(document.frontmatter, ['aliases'])).toEqual(['Mobile, UI', 'Tablet'])
    expect(frontmatterList(document.frontmatter, ['tags'])).toEqual(['AI, UX', 'Design'])
    expect(document.frontmatter.score).toEqual([1, true, 'Needs, Review'])
  })

  it('ignores desktop block-scalar frontmatter placeholders instead of exposing bogus properties', () => {
    const document = parseLocalVaultDocument(`---
summary: |
  Mobile should not surface the YAML pipe marker.
notes: >
  Folded text is not parsed by the lightweight desktop parser.
status: Active
---
Body.
`)

    expect(frontmatterScalar(document.frontmatter, ['status'])).toBe('Active')
    expect(frontmatterProperties(document.frontmatter)).toEqual({})
  })

  it('uses desktop canonical last-wins semantics for colliding frontmatter keys', () => {
    const document = parseLocalVaultDocument(`---
Status: Draft
status: Active
is a: Project
type: Essay
Owner: Luca
owner: Giulia
Belongs to:
  - "[[Old Project]]"
belongs_to:
  - "[[New Project]]"
---
Body.
`)

    expect(frontmatterScalar(document.frontmatter, ['Status', 'status'])).toBe('Active')
    expect(frontmatterScalar(document.frontmatter, ['type', 'Is A', 'is_a'])).toBe('Essay')
    expect(frontmatterProperties(document.frontmatter)).toEqual({ owner: 'Giulia' })
    expect(frontmatterRelationships(document.frontmatter)).toEqual({ belongs_to: ['[[New Project]]'] })
  })

  it('keeps desktop blank scalar frontmatter values unless list items follow', () => {
    const document = parseLocalVaultDocument(`---
type: Book
start date:
rating:
tags:
  - Reading
---
Body.
`)

    expect(document.frontmatter['start date']).toBe('')
    expect(document.frontmatter.rating).toBe('')
    expect(frontmatterList(document.frontmatter, ['tags'])).toEqual(['Reading'])
  })
})
