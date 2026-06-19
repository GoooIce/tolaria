import type { TiptapJsonNode } from '../workspace/mobileDocumentContent'

type ProbeLogText = string
type ProbeLine = string
type StepId = 'arrow' | 'escapedArrow' | 'highlight'

export type NativeWysiwygInputTransformProof = {
  highlightMarkApplied: boolean
  markdown: string
  step: StepId
  transformed: boolean
}

export type NativeWysiwygInputTransformProbeStep = {
  content: TiptapJsonNode
  input: string
  selection: { from: number; to: number }
  step: StepId
}

export type NativeWysiwygInputTransformAssertionFailure = {
  id: string
  message: string
}

export const nativeWysiwygInputTransformLogPrefix = 'TOLARIA_MOBILE_WYSIWYG_INPUT_TRANSFORM_PROBE'

export function nativeWysiwygInputTransformProbeSteps(): NativeWysiwygInputTransformProbeStep[] {
  return [
    {
      content: textProbeContent('Flow -'),
      input: '>',
      selection: { from: 7, to: 7 },
      step: 'arrow',
    },
    {
      content: textProbeContent('Flow \\-'),
      input: '>',
      selection: { from: 8, to: 8 },
      step: 'escapedArrow',
    },
    {
      content: textProbeContent('Use ==marked= today.'),
      input: '=',
      selection: { from: 14, to: 14 },
      step: 'highlight',
    },
  ]
}

export function nativeWysiwygInputTransformProof({
  json,
  step,
  transformed,
}: {
  json: unknown
  step: StepId
  transformed: boolean
}): NativeWysiwygInputTransformProof {
  return {
    highlightMarkApplied: containsHighlightMark(json),
    markdown: probeMarkdownFromJson(json),
    step,
    transformed,
  }
}

export function nativeWysiwygInputTransformLogLine(
  proof: NativeWysiwygInputTransformProof,
): ProbeLine {
  return `${nativeWysiwygInputTransformLogPrefix} ${JSON.stringify(proof)}`
}

export function parseNativeWysiwygInputTransformProofs(
  logText: ProbeLogText,
): NativeWysiwygInputTransformProof[] {
  return logText
    .split('\n')
    .map(parseProofLine)
    .filter((proof): proof is NativeWysiwygInputTransformProof => proof !== null)
}

export function assertNativeWysiwygInputTransformProofs(
  proofs: NativeWysiwygInputTransformProof[],
): NativeWysiwygInputTransformAssertionFailure[] {
  return [
    proofFailure(
      hasProof(proofs, { markdown: 'Flow →', step: 'arrow', transformed: true }),
      'editor.wysiwyg.inputTransform.arrow',
      'Native WYSIWYG applies desktop arrow ligature input transforms',
    ),
    proofFailure(
      hasProof(proofs, { markdown: 'Flow ->', step: 'escapedArrow', transformed: true }),
      'editor.wysiwyg.inputTransform.escapedArrow',
      'Native WYSIWYG keeps escaped desktop arrow input literal',
    ),
    proofFailure(
      hasProof(proofs, { highlightMarkApplied: true, markdown: 'Use ==marked== today.', step: 'highlight', transformed: true }),
      'editor.wysiwyg.inputTransform.highlight',
      'Native WYSIWYG applies completed desktop highlight syntax as a mark',
    ),
  ].filter((failure): failure is NativeWysiwygInputTransformAssertionFailure => failure !== null)
}

export function formatNativeWysiwygInputTransformFailures(
  failures: NativeWysiwygInputTransformAssertionFailure[],
): string {
  return failures.map((failure) => `${failure.id}: ${failure.message}`).join('\n')
}

export function nativeWysiwygInputTransformProbeEnabled(searchParams: URLSearchParams): boolean {
  return searchParams.get('wysiwygInputTransformProbe') === '1'
}

function textProbeContent(text: string): TiptapJsonNode {
  return {
    content: [
      {
        content: [{ text, type: 'text' }],
        type: 'paragraph',
      },
    ],
    type: 'doc',
  }
}

function parseProofLine(line: ProbeLine): NativeWysiwygInputTransformProof | null {
  const prefixIndex = line.indexOf(nativeWysiwygInputTransformLogPrefix)
  if (prefixIndex === -1) return null

  const rawJson = line.slice(prefixIndex + nativeWysiwygInputTransformLogPrefix.length).trim()
  try {
    return parsedProof(JSON.parse(rawJson))
  } catch {
    return null
  }
}

function parsedProof(value: unknown): NativeWysiwygInputTransformProof | null {
  if (!value || typeof value !== 'object') return null

  const candidate = value as Partial<NativeWysiwygInputTransformProof>
  if (!isStepId(candidate.step)) return null
  if (typeof candidate.markdown !== 'string') return null
  if (typeof candidate.transformed !== 'boolean') return null
  if (typeof candidate.highlightMarkApplied !== 'boolean') return null

  return {
    highlightMarkApplied: candidate.highlightMarkApplied,
    markdown: candidate.markdown,
    step: candidate.step,
    transformed: candidate.transformed,
  }
}

function hasProof(
  proofs: NativeWysiwygInputTransformProof[],
  expected: Partial<NativeWysiwygInputTransformProof> & Pick<NativeWysiwygInputTransformProof, 'step'>,
): boolean {
  return proofs.some((proof) => (
    proof.step === expected.step
    && (expected.markdown === undefined || proof.markdown === expected.markdown)
    && (expected.transformed === undefined || proof.transformed === expected.transformed)
    && (expected.highlightMarkApplied === undefined || proof.highlightMarkApplied === expected.highlightMarkApplied)
  ))
}

function proofFailure(
  passed: boolean,
  id: string,
  message: string,
): NativeWysiwygInputTransformAssertionFailure | null {
  return passed ? null : { id, message }
}

function isStepId(value: unknown): value is StepId {
  return value === 'arrow' || value === 'escapedArrow' || value === 'highlight'
}

function containsHighlightMark(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const node = value as Partial<TiptapJsonNode>
  if (node.marks?.some((mark) => mark.type === 'highlight')) return true
  return node.content?.some(containsHighlightMark) ?? false
}

function probeMarkdownFromJson(value: unknown): string {
  if (!value || typeof value !== 'object') return ''
  const node = value as Partial<TiptapJsonNode>
  if (node.type === 'text') return markedProbeText(node)
  return node.content?.map(probeMarkdownFromJson).join(node.type === 'doc' ? '\n\n' : '') ?? ''
}

function markedProbeText(node: Partial<TiptapJsonNode>): string {
  const text = node.text ?? ''
  return node.marks?.some((mark) => mark.type === 'highlight') ? `==${text}==` : text
}
