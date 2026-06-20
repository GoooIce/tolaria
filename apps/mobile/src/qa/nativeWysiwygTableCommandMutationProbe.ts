import type { TiptapJsonNode } from '../workspace/mobileDocumentContent'

type MarkdownContent = string
type NoteId = string
type ProbeLogText = string
type ProbeLine = string

export type NativeWysiwygTableCommandMutationProof = {
  columnCount: number
  contentLength: number
  jsonMutated: boolean
  markdownSaved: boolean
  noteId: NoteId
  rowCount: number
}

export type NativeWysiwygTableCommandMutationAssertionFailure = {
  id: string
  message: string
}

type NativeWysiwygTableCommandMutationProofInput = {
  content: MarkdownContent
  json: unknown
  noteId: NoteId
}
type ProofFieldName = keyof NativeWysiwygTableCommandMutationProof
type ProofFieldType = 'boolean' | 'number' | 'string'
type ProofFieldMap = {
  [Field in ProofFieldName]: NativeWysiwygTableCommandMutationProof[Field]
}
type TableDimensions = {
  columns: number
  rows: number
}

export const nativeWysiwygTableCommandMutationLogPrefix = 'TOLARIA_MOBILE_WYSIWYG_TABLE_COMMAND_MUTATION_PROBE'

const proofFieldTypes = {
  columnCount: 'number',
  contentLength: 'number',
  jsonMutated: 'boolean',
  markdownSaved: 'boolean',
  noteId: 'string',
  rowCount: 'number',
} as const satisfies Record<ProofFieldName, ProofFieldType>
const proofFields = Object.keys(proofFieldTypes) as ProofFieldName[]

export function nativeWysiwygTableCommandMutationProbeJson(): TiptapJsonNode {
  return {
    content: [
      {
        content: [
          tableRowNode('tableHeader', ['Column', 'Value']),
          tableRowNode('tableCell', ['Item', 'Detail']),
        ],
        type: 'table',
      },
    ],
    type: 'doc',
  }
}

export function nativeWysiwygTableCommandMutationProof({
  content,
  json,
  noteId,
}: NativeWysiwygTableCommandMutationProofInput): NativeWysiwygTableCommandMutationProof {
  const dimensions = firstProbeTableDimensions(json)

  return {
    columnCount: dimensions.columns,
    contentLength: content.length,
    jsonMutated: dimensions.columns >= 3 && dimensions.rows >= 3,
    markdownSaved: hasCommandMutatedProbeTable(content),
    noteId,
    rowCount: dimensions.rows,
  }
}

export function nativeWysiwygTableCommandMutationLogLine(
  proof: NativeWysiwygTableCommandMutationProof,
): ProbeLine {
  return `${nativeWysiwygTableCommandMutationLogPrefix} ${JSON.stringify(proof)}`
}

export function parseNativeWysiwygTableCommandMutationProofs(
  logText: ProbeLogText,
): NativeWysiwygTableCommandMutationProof[] {
  return logText
    .split('\n')
    .map(parseProofLine)
    .filter((proof): proof is NativeWysiwygTableCommandMutationProof => proof !== null)
}

export function assertNativeWysiwygTableCommandMutationProofs(
  proofs: NativeWysiwygTableCommandMutationProof[],
): NativeWysiwygTableCommandMutationAssertionFailure[] {
  const latest = proofs.at(-1)
  if (!latest) {
    return [{
      id: 'editor.wysiwyg.tableCommandMutation',
      message: 'Native WYSIWYG table command mutation proof was not logged',
    }]
  }

  return [
    proofFailure(
      latest.jsonMutated,
      'editor.wysiwyg.tableCommandMutation.json',
      'Native WYSIWYG table command mutates structured TenTap table JSON',
    ),
    proofFailure(
      latest.markdownSaved,
      'editor.wysiwyg.tableCommandMutation.markdown',
      'Native WYSIWYG table command mutation saves as desktop markdown table lines',
    ),
  ].filter((failure): failure is NativeWysiwygTableCommandMutationAssertionFailure => failure !== null)
}

export function formatNativeWysiwygTableCommandMutationFailures(
  failures: NativeWysiwygTableCommandMutationAssertionFailure[],
): string {
  return failures.map((failure) => `${failure.id}: ${failure.message}`).join('\n')
}

export function nativeWysiwygTableCommandMutationProbeEnabled(searchParams: URLSearchParams): boolean {
  return searchParams.get('wysiwygTableCommandMutationProbe') === '1'
}

function parseProofLine(line: ProbeLine): NativeWysiwygTableCommandMutationProof | null {
  const prefixIndex = line.indexOf(nativeWysiwygTableCommandMutationLogPrefix)
  if (prefixIndex === -1) return null

  const rawJson = line.slice(prefixIndex + nativeWysiwygTableCommandMutationLogPrefix.length).trim()
  try {
    return parsedProof(JSON.parse(rawJson))
  } catch {
    return null
  }
}

function parsedProof(value: unknown): NativeWysiwygTableCommandMutationProof | null {
  if (!isRecord(value)) return null
  if (!isNativeWysiwygTableCommandMutationProof(value)) return null

  return {
    columnCount: value.columnCount,
    contentLength: value.contentLength,
    jsonMutated: value.jsonMutated,
    markdownSaved: value.markdownSaved,
    noteId: value.noteId,
    rowCount: value.rowCount,
  }
}

function isNativeWysiwygTableCommandMutationProof(
  value: Record<string, unknown>,
): value is ProofFieldMap {
  return proofFields.every((field) => typeof value[field] === proofFieldTypes[field])
}

function firstProbeTableDimensions(json: unknown): TableDimensions {
  const table = firstProbeTable(json)
  if (!table) return { columns: 0, rows: 0 }

  const rows = tiptapChildNodes(table)
  const columns = Math.max(0, ...rows.map((row) => tiptapChildNodes(row).length))
  return { columns, rows: rows.length }
}

function firstProbeTable(value: unknown): TiptapJsonNode | null {
  if (!isTiptapJsonNode(value)) return null
  if (isProbeTableNode(value)) return value

  for (const child of tiptapChildNodes(value)) {
    const table = firstProbeTable(child)
    if (table) return table
  }

  return null
}

function isProbeTableNode(node: TiptapJsonNode): boolean {
  if (node.type !== 'table') return false

  const text = plainText(tiptapChildNodes(node))
  return text.includes('Column')
    && text.includes('Value')
    && text.includes('Item')
    && text.includes('Detail')
}

function hasCommandMutatedProbeTable(markdown: MarkdownContent): boolean {
  return markdownTables(normalizedMarkdown(markdown)).some((table) => tableHasCommandMutation(table))
}

function tableHasCommandMutation(table: string[][]): boolean {
  const [header, , ...bodyRows] = table
  if (!header || !header.includes('Column') || !header.includes('Value')) return false
  if (header.length < 3 || bodyRows.length < 2) return false

  return bodyRows.some((row) => row.length >= 3 && row.includes('Item') && row.includes('Detail'))
}

function markdownTables(markdown: MarkdownContent): string[][][] {
  const lines = markdown.split('\n')
  const tables: string[][][] = []
  let index = 0

  while (index < lines.length) {
    const current = lines[index] ?? ''
    const next = lines[index + 1] ?? ''
    if (!isMarkdownTableRow(current) || !isMarkdownTableDivider(next)) {
      index += 1
      continue
    }

    const table: string[][] = [markdownTableCells(current), markdownTableCells(next)]
    index += 2
    while (index < lines.length && isMarkdownTableRow(lines[index] ?? '')) {
      table.push(markdownTableCells(lines[index] ?? ''))
      index += 1
    }
    tables.push(table)
  }

  return tables
}

function isMarkdownTableRow(line: string): boolean {
  return /^\s*\|.*\|\s*$/u.test(line)
}

function isMarkdownTableDivider(line: string): boolean {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/u.test(line)
}

function markdownTableCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/u, '')
    .replace(/\|$/u, '')
    .split('|')
    .map((cell) => cell.trim())
}

function tableRowNode(cellType: 'tableCell' | 'tableHeader', cells: string[]): TiptapJsonNode {
  return {
    content: cells.map((text) => ({
      content: [{ content: [{ text, type: 'text' }], type: 'paragraph' }],
      type: cellType,
    })),
    type: 'tableRow',
  }
}

function plainText(nodes: TiptapJsonNode[]): string {
  return nodes.map((node) => (
    node.type === 'text' ? node.text ?? '' : plainText(tiptapChildNodes(node))
  )).join(' ')
}

function tiptapChildNodes(node: TiptapJsonNode): TiptapJsonNode[] {
  return Array.isArray(node.content) ? node.content : []
}

function isTiptapJsonNode(value: unknown): value is TiptapJsonNode {
  return Boolean(value && typeof value === 'object')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function normalizedMarkdown(content: MarkdownContent): MarkdownContent {
  return content.replace(/\r\n/g, '\n')
}

function proofFailure(
  passed: boolean,
  id: string,
  message: string,
): NativeWysiwygTableCommandMutationAssertionFailure | null {
  return passed ? null : { id, message }
}
