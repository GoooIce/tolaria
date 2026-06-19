import type { NativeWysiwygMarkdownBlockPayload } from '../components/workspace/MobileWysiwygWikilinkBridgeModel'

type MarkdownContent = string
type NoteId = string
type ProbeLogText = string
type ProbeLine = string

export type NativeWysiwygMarkdownBlockProof = {
  codeBlockSaved: boolean
  contentLength: number
  dividerSaved: boolean
  noteId: NoteId
  tableSaved: boolean
}

export type NativeWysiwygMarkdownBlockAssertionFailure = {
  id: string
  message: string
}

export const nativeWysiwygMarkdownBlockLogPrefix = 'TOLARIA_MOBILE_WYSIWYG_MARKDOWN_BLOCK_PROBE'

const expectedDivider = '---'
const expectedCodeBlock = '```text\ncode\n```'
const expectedTableLines = [
  '| Column | Value |',
  '| --- | --- |',
  '| Item | Detail |',
] as const

export function nativeWysiwygMarkdownBlockProbePayloads(): NativeWysiwygMarkdownBlockPayload[] {
  return [
    { action: 'divider' },
    { action: 'codeBlock' },
    { action: 'table' },
  ]
}

export function nativeWysiwygMarkdownBlockProof({
  content,
  noteId,
}: {
  content: MarkdownContent
  noteId: NoteId
}): NativeWysiwygMarkdownBlockProof {
  const normalizedContent = normalizedMarkdown(content)

  return {
    codeBlockSaved: normalizedContent.includes(expectedCodeBlock),
    contentLength: content.length,
    dividerSaved: markdownBlocks(normalizedContent).includes(expectedDivider),
    noteId,
    tableSaved: expectedTableLines.every((line) => normalizedContent.includes(line)),
  }
}

export function nativeWysiwygMarkdownBlockLogLine(
  proof: NativeWysiwygMarkdownBlockProof,
): ProbeLine {
  return `${nativeWysiwygMarkdownBlockLogPrefix} ${JSON.stringify(proof)}`
}

export function parseNativeWysiwygMarkdownBlockProofs(
  logText: ProbeLogText,
): NativeWysiwygMarkdownBlockProof[] {
  return logText
    .split('\n')
    .map(parseProofLine)
    .filter((proof): proof is NativeWysiwygMarkdownBlockProof => proof !== null)
}

export function assertNativeWysiwygMarkdownBlockProofs(
  proofs: NativeWysiwygMarkdownBlockProof[],
): NativeWysiwygMarkdownBlockAssertionFailure[] {
  const latest = proofs.at(-1)
  if (!latest) {
    return [{
      id: 'editor.wysiwyg.markdownBlocks',
      message: 'Native WYSIWYG markdown block insertion proof was not logged',
    }]
  }

  return [
    proofFailure(
      latest.dividerSaved,
      'editor.wysiwyg.markdownBlocks.divider',
      'Native WYSIWYG divider insertion saves as desktop horizontal-rule markdown',
    ),
    proofFailure(
      latest.codeBlockSaved,
      'editor.wysiwyg.markdownBlocks.codeBlock',
      'Native WYSIWYG code-block insertion saves as desktop fenced-code markdown',
    ),
    proofFailure(
      latest.tableSaved,
      'editor.wysiwyg.markdownBlocks.table',
      'Native WYSIWYG table insertion saves as desktop markdown table source lines',
    ),
  ].filter((failure): failure is NativeWysiwygMarkdownBlockAssertionFailure => failure !== null)
}

export function formatNativeWysiwygMarkdownBlockFailures(
  failures: NativeWysiwygMarkdownBlockAssertionFailure[],
): string {
  return failures.map((failure) => `${failure.id}: ${failure.message}`).join('\n')
}

export function nativeWysiwygMarkdownBlockProbeEnabled(searchParams: URLSearchParams): boolean {
  return searchParams.get('wysiwygMarkdownBlockProbe') === '1'
}

function parseProofLine(line: ProbeLine): NativeWysiwygMarkdownBlockProof | null {
  const prefixIndex = line.indexOf(nativeWysiwygMarkdownBlockLogPrefix)
  if (prefixIndex === -1) return null

  const rawJson = line.slice(prefixIndex + nativeWysiwygMarkdownBlockLogPrefix.length).trim()
  try {
    return parsedProof(JSON.parse(rawJson))
  } catch {
    return null
  }
}

function parsedProof(value: unknown): NativeWysiwygMarkdownBlockProof | null {
  if (!value || typeof value !== 'object') return null

  const candidate = value as Partial<NativeWysiwygMarkdownBlockProof>
  if (typeof candidate.codeBlockSaved !== 'boolean') return null
  if (typeof candidate.contentLength !== 'number') return null
  if (typeof candidate.dividerSaved !== 'boolean') return null
  if (typeof candidate.noteId !== 'string') return null
  if (typeof candidate.tableSaved !== 'boolean') return null

  return {
    codeBlockSaved: candidate.codeBlockSaved,
    contentLength: candidate.contentLength,
    dividerSaved: candidate.dividerSaved,
    noteId: candidate.noteId,
    tableSaved: candidate.tableSaved,
  }
}

function normalizedMarkdown(content: MarkdownContent): MarkdownContent {
  return content.replace(/\r\n/g, '\n')
}

function markdownBlocks(content: MarkdownContent): string[] {
  return content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
}

function proofFailure(
  passed: boolean,
  id: string,
  message: string,
): NativeWysiwygMarkdownBlockAssertionFailure | null {
  return passed ? null : { id, message }
}
