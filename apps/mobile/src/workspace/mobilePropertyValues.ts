import type { MobilePropertyDisplayMode, MobilePropertyValue } from './mobileWorkspaceModel'
import {
  isMobileColorProperty,
  isMobileColorPropertyKey,
  isMobileDatePropertyKey,
  isMobileDatePropertyValue,
  isMobileListPropertyKey,
  isMobileStatusProperty,
  isMobileStatusPropertyKey,
  isMobileUrlPropertyKey,
  isMobileUrlPropertyValue,
} from './mobilePropertyValueDetectors'

export { isMobileListPropertyKey } from './mobilePropertyValueDetectors'

type MobilePropertyKey = string
type MobilePropertyValueText = string
type MobileStringPropertyValueKind = Exclude<MobilePropertyValueKind, 'boolean' | 'list' | 'number' | 'string'>

export type MobilePropertyValueKind = 'boolean' | 'color' | 'date' | 'list' | 'number' | 'status' | 'string' | 'url'

export type MobilePropertyValueInput = {
  kind: MobilePropertyValueKind
  key: MobilePropertyKey
  valueText: MobilePropertyValueText
}

export type MobilePropertySuggestionValueInput = MobilePropertyValueInput & {
  suggestion: string
}

export function mobilePropertyValueFormText(value: MobilePropertyValue): string {
  if (Array.isArray(value)) return formatListPropertyValue(value)
  return String(value)
}

export function mobilePropertyValueKind(
  key: MobilePropertyKey,
  value: MobilePropertyValue,
  displayModes: Record<string, MobilePropertyDisplayMode> | null | undefined = null,
): MobilePropertyValueKind {
  const configuredKind = mobilePropertyValueKindFromDisplayMode(displayModes?.[key])
  if (configuredKind) return configuredKind
  if (isMobileListPropertyKey(key) || Array.isArray(value)) return 'list'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'
  return mobileStringPropertyValueKind(key, value)
}

export function mobilePropertyValueKindForKey(
  key: MobilePropertyKey,
  currentKind: MobilePropertyValueKind,
  displayModes: Record<string, MobilePropertyDisplayMode> | null | undefined = null,
): MobilePropertyValueKind {
  const configuredKind = mobilePropertyValueKindFromDisplayMode(displayModes?.[key])
  if (configuredKind) return configuredKind
  if (isMobileListPropertyKey(key)) return 'list'
  if (isMobileStatusPropertyKey(key)) return 'status'
  if (isMobileDatePropertyKey(key)) return 'date'
  if (isMobileUrlPropertyKey(key)) return 'url'
  if (isMobileColorPropertyKey(key)) return 'color'
  return currentKind
}

export function mobilePropertyValueTextForKindChange(
  currentValueText: MobilePropertyValueText,
  nextKind: MobilePropertyValueKind,
): string {
  if (nextKind !== 'boolean') return currentValueText
  if (isBooleanFalseText(currentValueText)) return 'false'
  return 'true'
}

export function mobilePropertyDisplayModeFromValueKind(
  kind: MobilePropertyValueKind,
): MobilePropertyDisplayMode | null {
  if (kind === 'string') return null
  if (kind === 'list') return 'tags'
  return kind
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

function mobileStringPropertyValueKind(key: MobilePropertyKey, value: string): MobilePropertyValueKind {
  return stringPropertyValueKindDetectors.find((detector) => detector.matches(key, value))?.kind ?? 'string'
}

function listPropertyValue(value: MobilePropertyValueText): string[] {
  return splitListPropertyValue(value).map(listPropertyItemValue).filter(Boolean)
}

function listPropertySuggestionValue(valueText: MobilePropertyValueText, suggestion: string): string {
  const parts = splitListPropertyValue(valueText).map(listPropertyItemValue)
  const existing = parts.slice(0, -1).filter(Boolean)
  const withoutSuggestion = existing.filter((part) => part.toLowerCase() !== suggestion.toLowerCase())
  return formatListPropertyValue([...withoutSuggestion, suggestion])
}

function formatListPropertyValue(values: string[]): string {
  return values.map(listPropertyItemFormText).join(', ')
}

function listPropertyItemFormText(value: string): string {
  return shouldQuoteListPropertyItem(value) ? JSON.stringify(value) : value
}

function shouldQuoteListPropertyItem(value: string): boolean {
  return value.trim() !== value || value.includes(',')
}

function listPropertyItemValue(value: string): string {
  const trimmed = value.trim()
  const quote = listPropertyItemQuote(trimmed)
  if (quote === null) return trimmed
  return unquoteListPropertyItem(trimmed.slice(1, -1), quote)
}

function splitListPropertyValue(value: MobilePropertyValueText): string[] {
  const parts: string[] = []
  let quote: '"' | '\'' | null = null
  let startIndex = 0

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index]
    if (char === '\\' && quote === '"') {
      index += 1
      continue
    }
    if (isListPropertyQuote(char)) {
      quote = quote === char ? null : quote ?? char
      continue
    }
    if (char === ',' && quote === null) {
      parts.push(value.slice(startIndex, index))
      startIndex = index + 1
    }
  }

  parts.push(value.slice(startIndex))
  return parts
}

function listPropertyItemQuote(value: string): '"' | '\'' | null {
  const quote = value.at(0)
  if (isListPropertyQuote(quote) && value.at(-1) === quote) return quote
  return null
}

function unquoteListPropertyItem(value: string, quote: '"' | '\''): string {
  if (quote === '\'') return value.replaceAll("''", "'")

  try {
    return JSON.parse(`"${value}"`) as string
  } catch {
    return value.replace(/\\"/gu, '"')
  }
}

function isListPropertyQuote(value: string | undefined): value is '"' | '\'' {
  return value === '"' || value === '\''
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

const stringPropertyValueKindDetectors: readonly {
  kind: MobileStringPropertyValueKind
  matches: (key: MobilePropertyKey, value: MobilePropertyValueText) => boolean
}[] = [
  { kind: 'status', matches: isMobileStatusProperty },
  { kind: 'date', matches: (_key, value) => isMobileDatePropertyValue(value) },
  { kind: 'url', matches: (key, value) => isMobileUrlPropertyKey(key) || isMobileUrlPropertyValue(value) },
  { kind: 'color', matches: isMobileColorProperty },
]

function mobilePropertyValueKindFromDisplayMode(
  mode: MobilePropertyDisplayMode | null | undefined,
): MobilePropertyValueKind | null {
  if (!mode || mode === 'text') return null
  if (mode === 'tags') return 'list'
  return mode
}
