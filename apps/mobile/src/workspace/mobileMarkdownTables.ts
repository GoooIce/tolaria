export type MobileMarkdownTable = {
  endLine: number
  headers: string[]
  key: string
  rows: string[][]
  startLine: number
}

type MarkdownTableUpdate = {
  headers: string[]
  key: string
  rows: string[][]
}

type TableMatch = {
  nextLine: number
  table: MobileMarkdownTable
}

export function readMobileMarkdownTables({ markdown }: { markdown: string }): MobileMarkdownTable[] {
  const lines = markdownLines({ markdown })
  const tables: MobileMarkdownTable[] = []
  let lineNumber = 0

  while (lineNumber < lines.length) {
    const match = readMarkdownTableAt({ lineNumber, lines })
    if (!match) {
      lineNumber += 1
      continue
    }

    tables.push(match.table)
    lineNumber = match.nextLine
  }

  return tables
}

export function updateMobileMarkdownTable({
  markdown,
  update,
}: {
  markdown: string
  update: MarkdownTableUpdate
}): { markdown: string; updated: boolean } {
  const lines = markdownLines({ markdown })
  const table = readMobileMarkdownTables({ markdown }).find((candidate) => candidate.key === update.key)
  if (!table) return { markdown, updated: false }

  const nextSource = mobileMarkdownTableSource({
    headers: update.headers,
    rows: update.rows,
  })
  return {
    markdown: [
      ...lines.slice(0, table.startLine),
      ...nextSource.split('\n'),
      ...lines.slice(table.endLine + 1),
    ].join('\n'),
    updated: true,
  }
}

export function mobileMarkdownTableSource({
  headers,
  rows,
}: {
  headers: string[]
  rows: string[][]
}): string {
  const columnCount = normalizedColumnCount({ headers, rows })
  const normalizedHeaders = normalizedCells({ cells: headers, columnCount })
  const normalizedRows = rows.map((cells) => normalizedCells({ cells, columnCount }))
  return [
    tableRowSource({ cells: normalizedHeaders }),
    tableRowSource({ cells: normalizedHeaders.map(() => '---') }),
    ...normalizedRows.map((cells) => tableRowSource({ cells })),
  ].join('\n')
}

function readMarkdownTableAt({
  lineNumber,
  lines,
}: {
  lineNumber: number
  lines: string[]
}): TableMatch | null {
  const headers = tableCells({ line: lines[lineNumber] ?? '' })
  const divider = tableCells({ line: lines[lineNumber + 1] ?? '' })
  if (!isTableHeader({ cells: headers })) return null
  if (!isTableDivider({ cells: divider })) return null
  if (divider.length !== headers.length) return null

  const rows: string[][] = []
  let nextLine = lineNumber + 2
  while (nextLine < lines.length) {
    const cells = tableCells({ line: lines[nextLine] ?? '' })
    if (!isTableBodyRow({ cells })) break
    rows.push(normalizedCells({ cells, columnCount: headers.length }))
    nextLine += 1
  }

  return {
    nextLine,
    table: {
      endLine: nextLine - 1,
      headers,
      key: `line:${lineNumber}`,
      rows,
      startLine: lineNumber,
    },
  }
}

function isTableHeader({ cells }: { cells: string[] }): boolean {
  return cells.length >= 2 && cells.some((cell) => cell.trim().length > 0)
}

function isTableDivider({ cells }: { cells: string[] }): boolean {
  return cells.length >= 2 && cells.every((cell) => /^:?-{3,}:?$/u.test(cell.trim()))
}

function isTableBodyRow({ cells }: { cells: string[] }): boolean {
  return cells.length > 1
}

function normalizedColumnCount({
  headers,
  rows,
}: {
  headers: string[]
  rows: string[][]
}): number {
  return Math.max(1, headers.length, ...rows.map((row) => row.length))
}

function normalizedCells({ cells, columnCount }: { cells: string[]; columnCount: number }): string[] {
  return Array.from({ length: columnCount }, (_value, index) => cells[index]?.trim() ?? '')
}

function tableCells({ line }: { line: string }): string[] {
  const row = trimmedOuterPipes({ line })
  if (!row.includes('|')) return []

  const cells: string[] = []
  let cell = ''
  for (let index = 0; index < row.length; index += 1) {
    const char = row[index] ?? ''
    if (char === '\\' && row[index + 1] === '|') {
      cell += '|'
      index += 1
    } else if (char === '|') {
      cells.push(cell.trim())
      cell = ''
    } else {
      cell += char
    }
  }
  cells.push(cell.trim())
  return cells
}

function tableRowSource({ cells }: { cells: string[] }): string {
  return `| ${cells.map(tableCellSource).join(' | ')} |`
}

function tableCellSource(cell: string): string {
  return cell.replace(/\r?\n/gu, ' ').replaceAll('|', '\\|').trim()
}

function trimmedOuterPipes({ line }: { line: string }): string {
  const trimmed = line.trim()
  const withoutLeading = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed
  return withoutLeading.endsWith('|') ? withoutLeading.slice(0, -1) : withoutLeading
}

function markdownLines({ markdown }: { markdown: string }): string[] {
  return markdown.replace(/\r\n/g, '\n').split('\n')
}
