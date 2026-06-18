import { mobileWikilinkHref } from '../../workspace/mobileWikilinks'
import type { TiptapJsonNode } from '../../workspace/mobileDocumentContent'

type NativeWysiwygWikilinkTextNode = {
  marks?: Array<{ attrs: { href: string }; type: 'link' }>
  text: string
  type: 'text'
}
type NativeWysiwygInsertionResult = { inserted: boolean; node: TiptapJsonNode }

export type NativeWysiwygWikilinkPayload = {
  label: string
  target: string
}

export type NativeWysiwygSelection = {
  from: number
  to: number
}

export function nativeWysiwygWikilinkContent(
  payload: NativeWysiwygWikilinkPayload,
): NativeWysiwygWikilinkTextNode[] | null {
  const target = payload.target.trim()
  if (!target) return null

  const label = payload.label.trim() || target
  return [
    {
      marks: [{ attrs: { href: mobileWikilinkHref(target) }, type: 'link' }],
      text: label,
      type: 'text',
    },
    { text: ' ', type: 'text' },
  ]
}

export function nativeWysiwygDocumentWithInsertedWikilink({
  json,
  payload,
  selection,
}: {
  json: unknown
  payload: NativeWysiwygWikilinkPayload,
  selection?: NativeWysiwygSelection
}): TiptapJsonNode | null {
  if (!isTiptapDocument(json)) return null
  const content = nativeWysiwygWikilinkContent(payload)
  if (!content) return null

  const selectedDocument = selection
    ? insertWikilinkAtSelection(json, content, normalizedSelection(selection))
    : null
  if (selectedDocument?.inserted) return selectedDocument.node

  return appendWikilinkToFirstParagraph(json, content)?.node ?? null
}

function insertWikilinkAtSelection(
  node: TiptapJsonNode,
  wikilinkContent: TiptapJsonNode[],
  selection: NativeWysiwygSelection,
  nodeStart = 0,
): NativeWysiwygInsertionResult | null {
  if (isInlineContainer(node)) {
    return insertWikilinkIntoInlineContainer(node, wikilinkContent, selection, nodeStart + 1)
  }

  const children = node.content ?? []
  let childStart = node.type === 'doc' ? nodeStart : nodeStart + 1
  for (const [index, child] of children.entries()) {
    const childEnd = childStart + tiptapNodeSize(child)
    if (selection.from >= childStart && selection.from <= childEnd) {
      const childResult = insertWikilinkAtSelection(child, wikilinkContent, selection, childStart)
      if (childResult?.inserted) return withReplacedChild(node, index, childResult.node)
    }
    childStart = childEnd
  }

  return null
}

function appendWikilinkToFirstParagraph(
  node: TiptapJsonNode,
  wikilinkContent: TiptapJsonNode[],
): NativeWysiwygInsertionResult | null {
  return appendWikilinkToNodeType(node, wikilinkContent, 'paragraph')
    ?? appendWikilinkToNodeType(node, wikilinkContent, 'heading')
}

function appendWikilinkToNodeType(
  node: TiptapJsonNode,
  wikilinkContent: TiptapJsonNode[],
  type: string,
): NativeWysiwygInsertionResult | null {
  if (node.type === type) {
    return {
      inserted: true,
      node: {
        ...node,
        content: [...(node.content ?? []), ...wikilinkContent.map(cloneNode)],
      },
    }
  }

  for (const [index, child] of (node.content ?? []).entries()) {
    const childResult = appendWikilinkToNodeType(child, wikilinkContent, type)
    if (childResult?.inserted) return withReplacedChild(node, index, childResult.node)
  }

  return null
}

function insertWikilinkIntoInlineContainer(
  node: TiptapJsonNode,
  wikilinkContent: TiptapJsonNode[],
  selection: NativeWysiwygSelection,
  contentStart: number,
): NativeWysiwygInsertionResult {
  return {
    inserted: true,
    node: {
      ...node,
      content: inlineContentWithInsertedWikilink(node.content ?? [], wikilinkContent, selection, contentStart),
    },
  }
}

function inlineContentWithInsertedWikilink(
  nodes: TiptapJsonNode[],
  wikilinkContent: TiptapJsonNode[],
  selection: NativeWysiwygSelection,
  contentStart: number,
): TiptapJsonNode[] {
  if (nodes.length === 0) return wikilinkContent.map(cloneNode)

  return [
    ...inlineNodesBefore(nodes, selection.from, contentStart),
    ...wikilinkContent.map(cloneNode),
    ...inlineNodesAfter(nodes, wikilinkContent, selection.to, contentStart),
  ]
}

function inlineNodesBefore(
  nodes: TiptapJsonNode[],
  position: number,
  contentStart: number,
): TiptapJsonNode[] {
  const before: TiptapJsonNode[] = []
  let cursor = contentStart

  for (const node of nodes) {
    const nodeEnd = cursor + tiptapNodeSize(node)
    appendInlineSlice(before, node, 0, Math.min(position, nodeEnd) - cursor)
    if (position <= nodeEnd) break
    cursor = nodeEnd
  }

  return before
}

function inlineNodesAfter(
  nodes: TiptapJsonNode[],
  wikilinkContent: TiptapJsonNode[],
  position: number,
  contentStart: number,
): TiptapJsonNode[] {
  const after: TiptapJsonNode[] = []
  let cursor = contentStart
  let trimLeadingSpace = wikilinkContent.at(-1)?.text === ' '

  for (const node of nodes) {
    const nodeEnd = cursor + tiptapNodeSize(node)
    if (position < nodeEnd) {
      const beforeLength = after.length
      appendInlineSlice(after, node, Math.max(position - cursor, 0), nodeEnd - cursor, { trimLeadingSpace })
      trimLeadingSpace = trimLeadingSpace && after.length === beforeLength
    }
    cursor = nodeEnd
  }

  return after
}

function appendInlineSlice(
  nodes: TiptapJsonNode[],
  node: TiptapJsonNode,
  from: number,
  to: number,
  options: { trimLeadingSpace?: boolean } = {},
): void {
  if (from >= to) return
  if (typeof node.text === 'string') {
    const text = node.text.slice(from, to)
    const normalizedText = options.trimLeadingSpace && text.startsWith(' ') ? text.slice(1) : text
    if (normalizedText) nodes.push(textNodeWithText(node, normalizedText))
    return
  }
  if (from === 0 && to >= tiptapNodeSize(node)) nodes.push(cloneNode(node))
}

function withReplacedChild(
  node: TiptapJsonNode,
  index: number,
  child: TiptapJsonNode,
): NativeWysiwygInsertionResult {
  return {
    inserted: true,
    node: {
      ...node,
      content: (node.content ?? []).map((candidate, candidateIndex) => (
        candidateIndex === index ? child : cloneNode(candidate)
      )),
    },
  }
}

function normalizedSelection(selection: NativeWysiwygSelection): NativeWysiwygSelection {
  return {
    from: Math.max(0, Math.min(selection.from, selection.to)),
    to: Math.max(0, Math.max(selection.from, selection.to)),
  }
}

function isInlineContainer(node: TiptapJsonNode): boolean {
  return node.type === 'paragraph' || node.type === 'heading'
}

function isTiptapDocument(value: unknown): value is TiptapJsonNode {
  return Boolean(value && typeof value === 'object' && (value as TiptapJsonNode).type === 'doc')
}

function tiptapNodeSize(node: TiptapJsonNode): number {
  if (typeof node.text === 'string') return node.text.length
  if (!node.content) return 1

  return node.content.reduce((size, child) => size + tiptapNodeSize(child), 2)
}

function textNodeWithText(node: TiptapJsonNode, text: string): TiptapJsonNode {
  return { ...cloneNode(node), text }
}

function cloneNode(node: TiptapJsonNode): TiptapJsonNode {
  return {
    ...node,
    attrs: node.attrs ? { ...node.attrs } : undefined,
    content: node.content?.map(cloneNode),
    marks: node.marks?.map((mark) => ({
      ...mark,
      attrs: mark.attrs ? { ...mark.attrs } : undefined,
    })),
  }
}
