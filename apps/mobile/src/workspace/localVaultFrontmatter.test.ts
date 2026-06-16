import { describe, expect, it } from 'vitest'
import {
  frontmatterList,
  frontmatterProperties,
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
})
