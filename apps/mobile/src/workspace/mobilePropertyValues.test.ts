import { describe, expect, it } from 'vitest'
import {
  mobilePropertyValueFormText,
  mobilePropertyValueKind,
  mobilePropertyValueKindForKey,
  mobilePropertySuggestionValue,
  mobilePropertyValueTextForKindChange,
  parseMobilePropertyValue,
} from './mobilePropertyValues'

describe('mobile property values', () => {
  it('infers the editable value kind from existing values', () => {
    expect(mobilePropertyValueKind('Priority', 'High')).toBe('string')
    expect(mobilePropertyValueKind('Estimate', 13)).toBe('number')
    expect(mobilePropertyValueKind('Shipped', true)).toBe('boolean')
    expect(mobilePropertyValueKind('Areas', ['Design'])).toBe('list')
    expect(mobilePropertyValueKind('tags', 'Design')).toBe('list')
  })

  it('forces tags to list mode while preserving other selected kinds', () => {
    expect(mobilePropertyValueKindForKey('tags', 'string')).toBe('list')
    expect(mobilePropertyValueKindForKey('Priority', 'number')).toBe('number')
  })

  it('serializes typed values from form text', () => {
    expect(parseMobilePropertyValue({ key: 'tags', kind: 'string', valueText: 'AI, Design' })).toEqual(['AI', 'Design'])
    expect(parseMobilePropertyValue({ key: 'Estimate', kind: 'number', valueText: '13.5' })).toBe(13.5)
    expect(parseMobilePropertyValue({ key: 'Estimate', kind: 'number', valueText: 'later' })).toBe('later')
    expect(parseMobilePropertyValue({ key: 'Published', kind: 'boolean', valueText: 'yes' })).toBe(true)
    expect(parseMobilePropertyValue({ key: 'Published', kind: 'boolean', valueText: 'false' })).toBe(false)
    expect(parseMobilePropertyValue({ key: 'Priority', kind: 'string', valueText: ' High ' })).toBe('High')
  })

  it('formats existing values for editing', () => {
    expect(mobilePropertyValueFormText(['AI', 'Design'])).toBe('AI, Design')
    expect(mobilePropertyValueFormText(false)).toBe('false')
    expect(mobilePropertyValueFormText(8)).toBe('8')
  })

  it('normalizes boolean value text when switching kinds', () => {
    expect(mobilePropertyValueTextForKindChange('no', 'boolean')).toBe('false')
    expect(mobilePropertyValueTextForKindChange('', 'boolean')).toBe('true')
    expect(mobilePropertyValueTextForKindChange('8', 'number')).toBe('8')
  })

  it('completes the active comma segment for every list-valued property', () => {
    expect(mobilePropertySuggestionValue({
      key: 'Areas',
      kind: 'list',
      suggestion: 'Research',
      valueText: 'Design, res',
    })).toBe('Design, Research')
    expect(mobilePropertySuggestionValue({
      key: 'Areas',
      kind: 'list',
      suggestion: 'Design',
      valueText: 'Design, des',
    })).toBe('Design')
    expect(mobilePropertySuggestionValue({
      key: 'Priority',
      kind: 'string',
      suggestion: 'High',
      valueText: 'H',
    })).toBe('High')
  })
})
