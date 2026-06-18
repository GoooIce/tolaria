import type { NativeWysiwygWikilinkPayload } from '../components/workspace/MobileWysiwygWikilinkBridgeModel'

type MarkdownContent = string
type NoteId = string
type ProbeLogText = string
type ProbeLine = string

export type NativeWysiwygWikilinkInsertProof = {
  contentLength: number
  insertedWikilinkSaved: boolean
  noteId: NoteId
}

export type NativeWysiwygWikilinkInsertAssertionFailure = {
  id: string
  message: string
}

export const nativeWysiwygWikilinkInsertLogPrefix = 'TOLARIA_MOBILE_WYSIWYG_WIKILINK_INSERT_PROBE'
const probeTarget = 'AI Ops Guide'
const expectedWikilink = `[[${probeTarget}]]`

export function nativeWysiwygWikilinkInsertProbePayload(): NativeWysiwygWikilinkPayload {
  return {
    label: probeTarget,
    target: probeTarget,
  }
}

export function nativeWysiwygWikilinkInsertProof({
  content,
  noteId,
}: {
  content: MarkdownContent
  noteId: NoteId
}): NativeWysiwygWikilinkInsertProof {
  return {
    contentLength: content.length,
    insertedWikilinkSaved: content.includes(expectedWikilink),
    noteId,
  }
}

export function nativeWysiwygWikilinkInsertLogLine(
  proof: NativeWysiwygWikilinkInsertProof,
): ProbeLine {
  return `${nativeWysiwygWikilinkInsertLogPrefix} ${JSON.stringify(proof)}`
}

export function parseNativeWysiwygWikilinkInsertProofs(
  logText: ProbeLogText,
): NativeWysiwygWikilinkInsertProof[] {
  return logText
    .split('\n')
    .map(parseProofLine)
    .filter((proof): proof is NativeWysiwygWikilinkInsertProof => proof !== null)
}

export function assertNativeWysiwygWikilinkInsertProofs(
  proofs: NativeWysiwygWikilinkInsertProof[],
): NativeWysiwygWikilinkInsertAssertionFailure[] {
  const latest = proofs.at(-1)
  if (!latest) {
    return [{ id: 'editor.wysiwyg.wikilinkInsert', message: 'Native WYSIWYG wikilink insert proof was not logged' }]
  }

  return [
    proofFailure(
      latest.insertedWikilinkSaved,
      'editor.wysiwyg.wikilinkInsert.saved',
      'Native WYSIWYG picker insertion saves as desktop wikilink markdown',
    ),
  ].filter((failure): failure is NativeWysiwygWikilinkInsertAssertionFailure => failure !== null)
}

export function formatNativeWysiwygWikilinkInsertFailures(
  failures: NativeWysiwygWikilinkInsertAssertionFailure[],
): string {
  return failures.map((failure) => `${failure.id}: ${failure.message}`).join('\n')
}

export function nativeWysiwygWikilinkInsertProbeEnabled(searchParams: URLSearchParams): boolean {
  return searchParams.get('wysiwygWikilinkInsertProbe') === '1'
}

function parseProofLine(line: ProbeLine): NativeWysiwygWikilinkInsertProof | null {
  const prefixIndex = line.indexOf(nativeWysiwygWikilinkInsertLogPrefix)
  if (prefixIndex === -1) return null

  const rawJson = line.slice(prefixIndex + nativeWysiwygWikilinkInsertLogPrefix.length).trim()
  try {
    return parsedProof(JSON.parse(rawJson))
  } catch {
    return null
  }
}

function parsedProof(value: unknown): NativeWysiwygWikilinkInsertProof | null {
  if (!value || typeof value !== 'object') return null

  const candidate = value as Partial<NativeWysiwygWikilinkInsertProof>
  if (typeof candidate.contentLength !== 'number') return null
  if (typeof candidate.insertedWikilinkSaved !== 'boolean') return null
  if (typeof candidate.noteId !== 'string') return null

  return {
    contentLength: candidate.contentLength,
    insertedWikilinkSaved: candidate.insertedWikilinkSaved,
    noteId: candidate.noteId,
  }
}

function proofFailure(
  passed: boolean,
  id: string,
  message: string,
): NativeWysiwygWikilinkInsertAssertionFailure | null {
  return passed ? null : { id, message }
}
