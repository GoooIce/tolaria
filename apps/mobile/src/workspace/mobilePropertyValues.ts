import type { MobilePropertyValue } from './mobileWorkspaceModel'

type MobilePropertyKey = string
type MobilePropertyValueText = string

export type MobilePropertyValueKind = 'boolean' | 'list' | 'number' | 'string'

export type MobilePropertyValueInput = {
  kind: MobilePropertyValueKind
  key: MobilePropertyKey
  valueText: MobilePropertyValueText
}

export type MobilePropertySuggestionValueInput = MobilePropertyValueInput & {
  suggestion: string
}

export function mobilePropertyValueFormText(value: MobilePropertyValue): string {
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

export function mobilePropertyValueKind(
  key: MobilePropertyKey,
  value: MobilePropertyValue,
): MobilePropertyValueKind {
  if (isMobileListPropertyKey(key) || Array.isArray(value)) return 'list'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'
  return 'string'
}

export function mobilePropertyValueKindForKey(
  key: MobilePropertyKey,
  currentKind: MobilePropertyValueKind,
): MobilePropertyValueKind {
  return isMobileListPropertyKey(key) ? 'list' : currentKind
}

export function mobilePropertyValueTextForKindChange(
  currentValueText: MobilePropertyValueText,
  nextKind: MobilePropertyValueKind,
): string {
  if (nextKind !== 'boolean') return currentValueText
  if (isBooleanFalseText(currentValueText)) return 'false'
  return 'true'
}

export function parseMobilePropertyValue(input: MobilePropertyValueInput): MobilePropertyValue {
  const kind = mobilePropertyValueKindForKey(input.key, input.kind)
  if (kind === 'list') return listPropertyValue(input.valueText)
  if (kind === 'boolean') return booleanPropertyValue(input.valueText)
  if (kind === 'number') return numberPropertyValue(input.valueText)
  return input.valueText.trim()
}

export function mobilePropertySuggestionValue(input: MobilePropertySuggestionValueInput): string {
  const kind = mobilePropertyValueKindForKey(input.key, input.kind)
  if (kind !== 'list') return input.suggestion
  return listPropertySuggestionValue(input.valueText, input.suggestion)
}

export function isMobileListPropertyKey(key: MobilePropertyKey): boolean {
  return key.trim().toLowerCase() === 'tags'
}

function listPropertyValue(value: MobilePropertyValueText): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function listPropertySuggestionValue(valueText: MobilePropertyValueText, suggestion: string): string {
  const parts = valueText.split(',').map((part) => part.trim())
  const existing = parts.slice(0, -1).filter(Boolean)
  const withoutSuggestion = existing.filter((part) => part.toLowerCase() !== suggestion.toLowerCase())
  return [...withoutSuggestion, suggestion].join(', ')
}

function booleanPropertyValue(value: MobilePropertyValueText): boolean {
  return /^(true|yes|1|on)$/iu.test(value.trim())
}

function isBooleanFalseText(value: MobilePropertyValueText): boolean {
  return /^(false|no|0|off)$/iu.test(value.trim())
}

function numberPropertyValue(value: MobilePropertyValueText): number | string {
  const parsed = Number(value.trim())
  return Number.isFinite(parsed) ? parsed : value.trim()
}
