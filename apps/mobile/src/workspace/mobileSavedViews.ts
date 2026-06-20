import type {
  MobileNote,
  MobileSavedView,
  MobileViewDefinition,
  MobileViewFilterCondition,
  MobileViewFilterGroup,
  MobileViewFilterNode,
  MobileViewFilterOp,
} from './mobileWorkspaceModel'
import {
  compareSortableValues,
  isBuiltInSortOption,
  parseSortConfig,
  statusSortRank,
  type SortDirection,
} from '../../../../src/utils/noteSort'
import { relationshipLookupKeys } from '../../../../src/utils/relationshipKeys'
import { createViewFilename } from '../../../../src/utils/viewFilename'
import {
  evaluateViewEntries,
  type ViewFilterEntry,
  type ViewFilterPropertyValue,
} from '../../../../src/utils/viewFilterEvaluation'
import {
  canMoveView,
  moveView,
  nextViewOrder,
  type ViewMoveDirection,
} from '../../../../src/utils/viewOrdering'

type ViewFileSource = {
  content: string
  relativePath: string
}

type YamlLine = {
  indent: number
  text: string
}

type FilterParseResult = {
  group: MobileViewFilterGroup
  nextIndex: number
}

type FieldKey = string
type FilterGroupKind = 'all' | 'any'
type IndentLevel = number
type LineIndex = number
type MobileViewEntry = ViewFilterEntry & { mobileNote: MobileNote }
type SortField = { key: FieldKey; kind: 'builtIn' | 'property' }
type SortFieldValue = string | number | boolean | string[] | null
type SortValue = string | null
type ViewFilename = string
type ViewIndex = number
type ViewPath = string
type YamlText = string
type YamlScalar = string | number | boolean | null


const supportedFilterOps = new Set<MobileViewFilterOp>([
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'any_of',
  'none_of',
  'is_empty',
  'is_not_empty',
  'before',
  'after',
])
const doubleQuote = '"'
const singleQuote = '\''
const doubleQuotedScalarEscapes: Record<string, string> = {
  '\\\\': '\\',
  '\\"': '"',
  '\\/': '/',
  '\\b': '\b',
  '\\f': '\f',
  '\\n': '\n',
  '\\r': '\r',
  '\\t': '\t',
}

export function parseMobileSavedViewFile(file: ViewFileSource, index: ViewIndex): MobileSavedView | null {
  if (!isViewFile(file.relativePath)) return null

  const lines = yamlLines(file.content)
  const filename = file.relativePath.split('/').at(-1) ?? `view-${index + 1}.yml`
  const definition = parseViewDefinition(lines, filename, index)

  return {
    definition,
    filename,
    id: mobileSavedViewId(filename),
  }
}

export function orderedMobileSavedViews(views: MobileSavedView[]): MobileSavedView[] {
  return [...views].sort(compareSavedViews)
}

export type MobileViewMoveDirection = ViewMoveDirection

export function nextMobileSavedViewOrder(views: MobileSavedView[]): number {
  return nextViewOrder(views)
}

export function canMoveMobileSavedView(
  views: MobileSavedView[],
  viewId: string,
  direction: MobileViewMoveDirection,
): boolean {
  const filename = savedViewFilename(views, viewId)
  return filename ? canMoveView(views, filename, direction) : false
}

export function moveMobileSavedView(
  views: MobileSavedView[],
  viewId: string,
  direction: MobileViewMoveDirection,
): MobileSavedView[] | null {
  const filename = savedViewFilename(views, viewId)
  return filename ? moveView(views, filename, direction) : null
}

export function mobileSavedViewOrderUpdates(views: MobileSavedView[]): MobileSavedView[] {
  return views.map((view, order) => ({
    ...view,
    definition: { ...view.definition, order },
  }))
}

export function evaluateMobileSavedView(view: MobileSavedView, notes: MobileNote[]): MobileNote[] {
  const matchingNotes = evaluateViewEntries(view.definition, notes.map(mobileNoteToViewEntry))
    .map((entry) => entry.mobileNote)
  return sortMobileNotesBySort(matchingNotes, view.definition.sort)
}

export function mobileSavedViewId(filename: string) {
  return `view-${slugify(filename.replace(/\.[^.]+$/, ''))}`
}

export function createMobileSavedViewFilename(name: string, existingFilenames: string[] = []): string {
  return createViewFilename(name, existingFilenames)
}

export function mobileSavedViewPath(filename: ViewFilename): ViewPath {
  return `views/${filename}`
}

export function serializeMobileSavedViewDefinition(definition: MobileViewDefinition): string {
  const lines = [
    `name: ${yamlScalar(definition.name)}`,
    `icon: ${yamlScalar(definition.icon)}`,
    `color: ${yamlScalar(definition.color)}`,
    `sort: ${yamlScalar(definition.sort)}`,
  ]

  if (typeof definition.order === 'number') lines.push(`order: ${definition.order}`)
  if (definition.listPropertiesDisplay?.length) {
    lines.push('listPropertiesDisplay:')
    lines.push(...definition.listPropertiesDisplay.map((item) => `  - ${yamlScalar(item)}`))
  }

  lines.push('filters:')
  lines.push(...serializedFilterGroup(definition.filters, 2))

  return `${lines.join('\n')}\n`
}

function isViewFile(path: ViewPath) {
  return /^(?:views|\.laputa\/views)\/[^/]+\.ya?ml$/u.test(path)
}

function parseViewDefinition(lines: YamlLine[], filename: ViewFilename, index: ViewIndex): MobileViewDefinition {
  return {
    color: optionalTopLevelString(lines, 'color'),
    filters: parseFilters(lines),
    icon: optionalTopLevelString(lines, 'icon'),
    listPropertiesDisplay: topLevelList(lines, 'listPropertiesDisplay'),
    name: optionalTopLevelString(lines, 'name') ?? fallbackViewName(filename, index),
    order: topLevelNumber(lines, 'order'),
    sort: optionalTopLevelString(lines, 'sort'),
  }
}

function parseFilters(lines: YamlLine[]): MobileViewFilterGroup {
  const filtersIndex = lines.findIndex((line) => line.indent === 0 && line.text === 'filters:')
  if (filtersIndex === -1) return { all: [] }

  const groupLine = lines[filtersIndex + 1]
  if (!groupLine || groupLine.indent !== 2) return { all: [] }

  return parseGroupAt(lines, filtersIndex + 1).group
}

function parseGroupAt(lines: YamlLine[], index: LineIndex): FilterParseResult {
  const line = lines[index]
  const kind = groupKind(line?.text ?? '')
  if (!line || !kind) return { group: { all: [] }, nextIndex: index + 1 }

  return parseGroupItems(lines, index + 1, line.indent + 2, kind)
}

function parseGroupItems(
  lines: YamlLine[],
  startIndex: LineIndex,
  itemIndent: IndentLevel,
  kind: FilterGroupKind,
): FilterParseResult {
  const nodes: MobileViewFilterNode[] = []
  let index = startIndex

  while (index < lines.length) {
    const line = lines[index]
    if (line.indent < itemIndent) break
    if (line.indent !== itemIndent || !line.text.startsWith('- ')) {
      index += 1
      continue
    }

    const parsed = parseFilterNode(lines, index, itemIndent)
    nodes.push(parsed.node)
    index = parsed.nextIndex
  }

  return { group: kind === 'any' ? { any: nodes } : { all: nodes }, nextIndex: index }
}

function parseFilterNode(
  lines: YamlLine[],
  index: LineIndex,
  itemIndent: IndentLevel,
): { nextIndex: number; node: MobileViewFilterNode } {
  const inlineText = lines[index].text.slice(2).trim()
  const inlineGroup = groupKind(inlineText)
  if (inlineGroup) {
    const result = parseGroupItems(lines, index + 1, itemIndent + 4, inlineGroup)
    return { nextIndex: result.nextIndex, node: result.group }
  }

  return parseCondition(lines, index, itemIndent, inlineText)
}

function parseCondition(
  lines: YamlLine[],
  index: LineIndex,
  itemIndent: IndentLevel,
  inlineText: YamlText,
): { nextIndex: number; node: MobileViewFilterCondition } {
  const entries: Record<string, unknown> = {}
  applyKeyValue(entries, inlineText)

  let nextIndex = index + 1
  while (nextIndex < lines.length && lines[nextIndex].indent > itemIndent) {
    const line = lines[nextIndex]
    if (line.indent === itemIndent + 2) {
      const parsed = parseConditionProperty(lines, nextIndex, itemIndent + 2)
      if (parsed) {
        Reflect.set(entries, parsed.key, parsed.value)
        nextIndex = parsed.nextIndex
        continue
      }
    }
    nextIndex += 1
  }

  return {
    nextIndex,
    node: normalizeCondition(entries),
  }
}

function parseConditionProperty(lines: YamlLine[], index: LineIndex, indent: IndentLevel) {
  const keyValue = keyValueText(lines[index].text)
  if (!keyValue) return null

  if (keyValue.value !== '') {
    return { key: keyValue.key, nextIndex: index + 1, value: parseYamlValue(keyValue.value) }
  }

  const list = listValues(lines, index + 1, indent + 2)
  return {
    key: keyValue.key,
    nextIndex: index + 1 + list.consumed,
    value: list.values.length > 0 ? list.values : null,
  }
}

function normalizeCondition(entries: Record<string, unknown>): MobileViewFilterCondition {
  return {
    field: typeof entries.field === 'string' ? entries.field : '',
    op: normalizedFilterOp(entries.op),
    regex: entries.regex === true,
    value: entries.value,
  }
}

function normalizedFilterOp(value: unknown): MobileViewFilterOp {
  if (typeof value !== 'string') return 'equals'
  return supportedFilterOps.has(value as MobileViewFilterOp) ? value as MobileViewFilterOp : 'equals'
}

function mobileNoteToViewEntry(note: MobileNote): MobileViewEntry {
  const path = note.path ?? note.id
  const relationships = mobileNoteViewRelationships(note)
  return {
    archived: note.archived === true,
    createdAt: note.createdAt ?? null,
    favorite: note.favorite,
    filename: path.split('/').at(-1) ?? path,
    isA: note.type || null,
    modifiedAt: note.modifiedAt ?? null,
    path,
    properties: mobileNoteViewProperties(note),
    relationships,
    snippet: note.snippet,
    status: note.status || null,
    title: note.title,
    mobileNote: note,
  }
}

function mobileNoteViewProperties(note: MobileNote): Record<string, ViewFilterPropertyValue> {
  const properties = Object.fromEntries(
    (note.properties ?? []).map((property) => [property.key, property.value]),
  ) as Record<string, ViewFilterPropertyValue>
  if (!hasCaseInsensitiveKey(properties, 'tags')) properties.tags = note.tags
  return properties
}

function mobileNoteViewRelationships(note: MobileNote): Record<string, string[]> {
  const relationships: Record<string, string[]> = {}
  for (const relationship of note.relationships) {
    for (const key of relationshipLookupKeys(relationship)) {
      relationships[key] = relationship.values.map((value) => value.ref ?? value.title)
    }
  }
  return relationships
}

function hasCaseInsensitiveKey(record: Record<string, unknown>, key: string): boolean {
  const lowerKey = key.toLowerCase()
  return Object.keys(record).some((candidate) => candidate.toLowerCase() === lowerKey)
}

export function sortMobileNotesBySort(notes: MobileNote[], sort: SortValue): MobileNote[] {
  const sortSpec = sortConfig(sort)
  if (!sortSpec) return notes

  return [...notes].sort((left, right) => compareNotes(left, right, sortSpec.field, sortSpec.direction))
}

function compareNotes(left: MobileNote, right: MobileNote, field: SortField, direction: SortDirection) {
  if (field.kind === 'builtIn' && field.key === 'status') return compareStatusNotes(left, right, direction)

  const leftValue = sortFieldValue(left, field)
  const rightValue = sortFieldValue(right, field)
  const missingResult = compareMissingValues(leftValue, rightValue)
  if (missingResult !== null) return missingResult

  const result = comparePresentFieldValue(leftValue, rightValue)
  return direction === 'asc' ? result : -result
}

function sortFieldValue(note: MobileNote, field: SortField): SortFieldValue {
  if (field.kind === 'property') return sortPropertyValue(note, field.key)
  if (field.key === 'modified') return displayTimestamp(note)
  if (field.key === 'created') return note.createdAt ?? note.modifiedAt ?? 0
  if (field.key === 'title') return note.title
  if (field.key === 'type') return note.type
  if (field.key === 'status') return note.status
  return null
}

function compareStatusNotes(left: MobileNote, right: MobileNote, direction: SortDirection) {
  const leftOrder = statusSortRank(left.status)
  const rightOrder = statusSortRank(right.status)
  if (leftOrder !== rightOrder) {
    const result = leftOrder - rightOrder
    return direction === 'asc' ? result : -result
  }

  return displayTimestamp(right) - displayTimestamp(left)
}

function displayTimestamp(note: MobileNote) {
  return note.modifiedAt ?? note.createdAt ?? 0
}

function sortPropertyValue(note: MobileNote, key: FieldKey): SortFieldValue {
  const property = note.properties?.find((candidate) => candidate.key.toLowerCase() === key.toLowerCase())
  return property?.value ?? null
}

function sortConfig(sort: SortValue): { direction: SortDirection; field: SortField } | null {
  const parsed = parseSortConfig(sort)
  if (!parsed) return null
  return { direction: parsed.direction, field: sortField(parsed.option) }
}

function sortField(rawField: FieldKey): SortField {
  const propertyPrefix = 'property:'
  if (rawField.startsWith(propertyPrefix)) {
    return { key: rawField.slice(propertyPrefix.length), kind: 'property' }
  }

  const field = rawField.toLowerCase()
  return isBuiltInSortOption(field) ? { key: field, kind: 'builtIn' } : { key: rawField, kind: 'property' }
}

function compareMissingValues(left: SortFieldValue, right: SortFieldValue) {
  if (left === null && right === null) return 0
  if (left === null) return 1
  if (right === null) return -1
  return null
}

function comparePresentFieldValue(left: SortFieldValue, right: SortFieldValue) {
  return compareSortableValues(left, right)
}

function yamlLines(content: string): YamlLine[] {
  return content
    .split(/\r?\n/u)
    .map(stripYamlComment)
    .filter((line) => line.trim().length > 0)
    .map((line) => ({ indent: line.search(/\S/u), text: line.trim() }))
}

function stripYamlComment(line: YamlText): YamlText {
  const commentIndex = yamlCommentIndex(line)
  return commentIndex === -1 ? line : line.slice(0, commentIndex).trimEnd()
}

function yamlCommentIndex(line: YamlText): number {
  let quote: '"' | '\'' | null = null

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '\\' && quote === '"') {
      index += 1
      continue
    }
    if (isQuote(char)) {
      quote = quote === char ? null : quote ?? char
      continue
    }
    if (quote === null && isYamlCommentStart(line, index)) return index
  }

  return -1
}

function isYamlCommentStart(line: YamlText, index: number): boolean {
  return line[index] === '#' && (index === 0 || /\s/u.test(line[index - 1] ?? ''))
}

function optionalTopLevelString(lines: YamlLine[], key: FieldKey) {
  const value = topLevelValue(lines, key)
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function topLevelNumber(lines: YamlLine[], key: FieldKey) {
  const value = topLevelValue(lines, key)
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function topLevelList(lines: YamlLine[], key: FieldKey) {
  const inlineValue = topLevelValue(lines, key)
  if (Array.isArray(inlineValue)) return inlineValue.map(String)

  const index = lines.findIndex((line) => line.indent === 0 && line.text === `${key}:`)
  if (index === -1) return undefined

  const { values } = listValues(lines, index + 1, 2)
  return values.length > 0 ? values.map(String) : undefined
}

function topLevelValue(lines: YamlLine[], key: FieldKey): unknown {
  const prefix = `${key}:`
  const line = lines.find((candidate) => candidate.indent === 0 && candidate.text.startsWith(prefix))
  if (!line) return null
  return parseYamlValue(line.text.slice(prefix.length).trim())
}

function listValues(lines: YamlLine[], startIndex: LineIndex, indent: IndentLevel) {
  const values: unknown[] = []
  let index = startIndex
  while (isListValue(lines[index], indent)) {
    values.push(parseYamlValue(lines[index].text.slice(2).trim()))
    index += 1
  }
  return { consumed: index - startIndex, values }
}

function isListValue(line: YamlLine | undefined, indent: number) {
  return line?.indent === indent && line.text.startsWith('- ')
}

function applyKeyValue(target: Record<string, unknown>, text: YamlText) {
  const parsed = keyValueText(text)
  if (parsed) Reflect.set(target, parsed.key, parseYamlValue(parsed.value))
}

function keyValueText(text: YamlText) {
  const separatorIndex = text.indexOf(':')
  if (separatorIndex === -1) return null

  return {
    key: text.slice(0, separatorIndex).trim(),
    value: text.slice(separatorIndex + 1).trim(),
  }
}

function parseYamlValue(value: YamlText): unknown {
  const scalar = yamlScalarToken(value)
  return scalar.quoted ? scalar.text : parseUnquotedYamlValue(scalar.text)
}

function yamlScalarToken(value: YamlText) {
  const quote = scalarQuote(value)

  return {
    quoted: quote !== null,
    text: unquotedScalar(value, quote),
  }
}

function parseUnquotedYamlValue(value: YamlText): unknown {
  const literal = yamlLiteralValue(value)
  if (literal !== undefined) return literal
  return isInlineListLiteral(value) ? parseInlineList(value) : value
}

function yamlLiteralValue(value: YamlText): unknown {
  const lower = value.toLowerCase()
  if (lower === 'true') return true
  if (lower === 'false') return false
  if (lower === 'null' || lower === '~') return null
  return /^-?\d+(?:\.\d+)?$/u.test(value) ? Number(value) : undefined
}

function isInlineListLiteral(value: YamlText) {
  if (value.startsWith('[[')) return false
  return value.startsWith('[') && value.endsWith(']')
}

function parseInlineList(value: YamlText) {
  const inner = value.slice(1, -1)
  if (!inner.trim()) return []
  return splitInlineListItems(inner).map((item) => parseYamlValue(item.trim()))
}

function splitInlineListItems(value: YamlText): YamlText[] {
  const items: YamlText[] = []
  let quote: '"' | '\'' | null = null
  let startIndex = 0

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index]
    if (char === '\\' && quote === '"') {
      index += 1
      continue
    }
    if (isQuote(char)) {
      quote = quote === char ? null : quote ?? char
      continue
    }
    if (char === ',' && quote === null) {
      items.push(value.slice(startIndex, index))
      startIndex = index + 1
    }
  }

  items.push(value.slice(startIndex))
  return items
}

function unquotedScalar(value: YamlText, quote: '"' | '\'' | null) {
  if (quote === null) return value

  const inner = value.slice(1, -1)
  return quote === doubleQuote ? unescapeDoubleQuotedScalar(inner) : inner.replaceAll("''", "'")
}

function unescapeDoubleQuotedScalar(value: YamlText) {
  return value.replace(/\\(?:["\\/bfnrt]|x[\da-fA-F]{2}|u[\da-fA-F]{4}|U[\da-fA-F]{8})/gu, (escape) => {
    const shortEscape = doubleQuotedScalarEscape(escape)
    return shortEscape ?? unicodeEscapeText(escape)
  })
}

function doubleQuotedScalarEscape(value: YamlText): string | null {
  return doubleQuotedScalarEscapes[value] ?? null
}

function unicodeEscapeText(value: YamlText) {
  const codePoint = Number.parseInt(value.slice(2), 16)
  if (!Number.isFinite(codePoint)) return value

  try {
    return String.fromCodePoint(codePoint)
  } catch {
    return value
  }
}

function scalarQuote(value: YamlText): '"' | '\'' | null {
  const quote = value.at(0)
  if (isQuote(quote) && value.at(-1) === quote) return quote
  return null
}

function isQuote(value: string | undefined): value is '"' | '\'' {
  if (value === doubleQuote) return true
  return value === singleQuote
}

function groupKind(text: YamlText): FilterGroupKind | null {
  if (text === 'all:') return 'all'
  if (text === 'any:') return 'any'
  return null
}

function isFilterGroup(node: MobileViewFilterNode): node is MobileViewFilterGroup {
  return 'all' in node || 'any' in node
}

function fallbackViewName(filename: ViewFilename, index: ViewIndex) {
  const fallback = filename.replace(/\.[^.]+$/, '').replaceAll('-', ' ').trim()
  return fallback ? titleCase(fallback) : `View ${index + 1}`
}

function titleCase(value: YamlText) {
  return value.replace(/\b\w/gu, (char) => char.toUpperCase())
}

function serializedFilterGroup(group: MobileViewFilterGroup, indent: number): string[] {
  const kind = 'any' in group ? 'any' : 'all'
  const nodes = 'any' in group ? group.any : group.all
  const prefix = spaces(indent)

  return [
    `${prefix}${kind}:`,
    ...nodes.flatMap((node) => serializedFilterNode(node, indent + 2)),
  ]
}

function serializedFilterNode(node: MobileViewFilterNode, indent: number): string[] {
  if (isFilterGroup(node)) return serializedNestedFilterGroup(node, indent)
  return serializedFilterCondition(node, indent)
}

function serializedNestedFilterGroup(group: MobileViewFilterGroup, indent: number): string[] {
  const kind = 'any' in group ? 'any' : 'all'
  const nodes = 'any' in group ? group.any : group.all
  const prefix = spaces(indent)

  return [
    `${prefix}- ${kind}:`,
    ...nodes.flatMap((node) => serializedFilterNode(node, indent + 4)),
  ]
}

function serializedFilterCondition(condition: MobileViewFilterCondition, indent: number): string[] {
  const prefix = spaces(indent)
  const childPrefix = spaces(indent + 2)
  const lines = [
    `${prefix}- field: ${yamlScalar(condition.field)}`,
    `${childPrefix}op: ${yamlScalar(condition.op)}`,
  ]

  if (condition.regex === true) lines.push(`${childPrefix}regex: true`)
  if (condition.value !== undefined) lines.push(...serializedYamlValue('value', condition.value, indent + 2))

  return lines
}

function serializedYamlValue(key: string, value: unknown, indent: number): string[] {
  const prefix = spaces(indent)
  if (!Array.isArray(value)) return [`${prefix}${key}: ${yamlScalar(yamlSerializableScalar(value))}`]

  return [
    `${prefix}${key}:`,
    ...value.map((item) => `${spaces(indent + 2)}- ${yamlScalar(yamlSerializableScalar(item))}`),
  ]
}

function yamlSerializableScalar(value: unknown): YamlScalar {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) return value
  return String(value)
}

function yamlScalar(value: YamlScalar): string {
  if (value === null) return 'null'
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

function spaces(count: number) {
  return ' '.repeat(count)
}

function compareSavedViews(left: MobileSavedView, right: MobileSavedView) {
  const leftOrder = left.definition.order
  const rightOrder = right.definition.order
  if (typeof leftOrder === 'number' && typeof rightOrder === 'number') return leftOrder - rightOrder
  if (typeof leftOrder === 'number') return -1
  if (typeof rightOrder === 'number') return 1
  return left.filename.localeCompare(right.filename)
}

function savedViewFilename(views: MobileSavedView[], viewId: string): ViewFilename | null {
  const view = views.find((candidate) => candidate.id === viewId || candidate.filename === viewId)
  return view?.filename ?? null
}

function slugify(value: YamlText) {
  return value.toLowerCase().replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '') || 'view'
}
