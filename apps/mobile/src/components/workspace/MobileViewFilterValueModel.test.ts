import { describe, expect, it } from 'vitest'
import type { MobileViewFilterCondition } from '../../workspace/mobileWorkspaceModel'
import {
  mobileViewFilterDatePreviewLabel,
  mobileViewFilterRegexIsInvalid,
  mobileViewFilterRegexSupported,
  mobileViewFilterValueInputKind,
} from './MobileViewFilterValueModel'

describe('MobileViewFilterValueModel', () => {
  it('uses desktop date value semantics for before and after operators', () => {
    expect(mobileViewFilterValueInputKind('before')).toBe('date')
    expect(mobileViewFilterValueInputKind('after')).toBe('date')
    expect(mobileViewFilterValueInputKind('contains')).toBe('text')
  })

  it('previews parsed date filter values with desktop relative-date semantics', () => {
    const reference = new Date('2026-04-07T12:00:00Z')

    expect(mobileViewFilterDatePreviewLabel('2026-04-01', reference)).toBe('April 1, 2026')
    expect(mobileViewFilterDatePreviewLabel('10 days ago', reference)).toBe('March 28, 2026')
    expect(mobileViewFilterDatePreviewLabel('eventually', reference)).toBeNull()
  })

  it('validates regex-enabled text filters like desktop', () => {
    expect(mobileViewFilterRegexSupported('contains')).toBe(true)
    expect(mobileViewFilterRegexSupported('before')).toBe(false)
    expect(mobileViewFilterRegexIsInvalid(filterCondition({ value: '(' }))).toBe(true)
    expect(mobileViewFilterRegexIsInvalid(filterCondition({ regex: false, value: '(' }))).toBe(false)
    expect(mobileViewFilterRegexIsInvalid(filterCondition({ op: 'before', value: '(' }))).toBe(false)
    expect(mobileViewFilterRegexIsInvalid(filterCondition({ value: 'workflow|essay' }))).toBe(false)
  })
})

function filterCondition(
  overrides: Partial<MobileViewFilterCondition>,
): MobileViewFilterCondition {
  return {
    field: 'title',
    op: 'contains',
    regex: true,
    value: '',
    ...overrides,
  }
}
