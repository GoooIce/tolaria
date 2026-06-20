import { describe, expect, it } from 'vitest'
import { tiptapJsonToMobileMarkdown, type TiptapJsonNode } from '../workspace/mobileDocumentContent'
import {
  assertNativeWysiwygTableCommandMutationProofs,
  formatNativeWysiwygTableCommandMutationFailures,
  nativeWysiwygTableCommandMutationLogLine,
  nativeWysiwygTableCommandMutationProbeEnabled,
  nativeWysiwygTableCommandMutationProbeJson,
  nativeWysiwygTableCommandMutationProof,
  parseNativeWysiwygTableCommandMutationProofs,
} from './nativeWysiwygTableCommandMutationProbe'

describe('native WYSIWYG table command mutation probe', () => {
  it('starts from a structured probe table', () => {
    expect(nativeWysiwygTableCommandMutationProbeJson()).toMatchObject({
      content: [{
        content: [
          tableRowWithCellTypes('tableHeader', 2),
          tableRowWithCellTypes('tableCell', 2),
        ],
        type: 'table',
      }],
      type: 'doc',
    })
  })

  it('builds a passing proof when a native table command adds a row and column', () => {
    const json = mutatedProbeJson()
    const content = `${tiptapJsonToMobileMarkdown(json)}\n`

    expect(nativeWysiwygTableCommandMutationProof({ content, json, noteId: 'note.md' })).toEqual({
      columnCount: 3,
      contentLength: content.length,
      jsonMutated: true,
      markdownSaved: true,
      noteId: 'note.md',
      rowCount: 3,
    })
  })

  it('parses and asserts simulator log proofs', () => {
    const json = mutatedProbeJson()
    const proof = nativeWysiwygTableCommandMutationProof({
      content: `${tiptapJsonToMobileMarkdown(json)}\n`,
      json,
      noteId: 'note.md',
    })

    expect(parseNativeWysiwygTableCommandMutationProofs(
      nativeWysiwygTableCommandMutationLogLine(proof),
    )).toEqual([proof])
    expect(assertNativeWysiwygTableCommandMutationProofs([proof])).toEqual([])
  })

  it('reports missing and failed table command mutation proofs', () => {
    expect(formatNativeWysiwygTableCommandMutationFailures(
      assertNativeWysiwygTableCommandMutationProofs([]),
    )).toContain('editor.wysiwyg.tableCommandMutation')

    expect(assertNativeWysiwygTableCommandMutationProofs([
      nativeWysiwygTableCommandMutationProof({
        content: `${tiptapJsonToMobileMarkdown(nativeWysiwygTableCommandMutationProbeJson())}\n`,
        json: nativeWysiwygTableCommandMutationProbeJson(),
        noteId: 'note.md',
      }),
    ])).toEqual([
      {
        id: 'editor.wysiwyg.tableCommandMutation.json',
        message: 'Native WYSIWYG table command mutates structured TenTap table JSON',
      },
      {
        id: 'editor.wysiwyg.tableCommandMutation.markdown',
        message: 'Native WYSIWYG table command mutation saves as desktop markdown table lines',
      },
    ])
  })

  it('detects the native QA query flag', () => {
    expect(nativeWysiwygTableCommandMutationProbeEnabled(
      new globalThis.URLSearchParams('wysiwygTableCommandMutationProbe=1'),
    )).toBe(true)
    expect(nativeWysiwygTableCommandMutationProbeEnabled(
      new globalThis.URLSearchParams('wysiwygTableCommandMutationProbe=0'),
    )).toBe(false)
  })
})

function mutatedProbeJson(): TiptapJsonNode {
  return {
    content: [{
      content: [
        tableRowNode('tableHeader', ['Column', '', 'Value']),
        tableRowNode('tableCell', ['Item', '', 'Detail']),
        tableRowNode('tableCell', ['', '', '']),
      ],
      type: 'table',
    }],
    type: 'doc',
  }
}

function tableRowNode(cellType: 'tableCell' | 'tableHeader', cells: string[]): TiptapJsonNode {
  return {
    content: cells.map((text) => ({
      content: text ? [{ content: [{ text, type: 'text' }], type: 'paragraph' }] : [{ type: 'paragraph' }],
      type: cellType,
    })),
    type: 'tableRow',
  }
}

function tableRowWithCellTypes(cellType: 'tableCell' | 'tableHeader', count: number) {
  return {
    content: Array.from({ length: count }, () => ({ type: cellType })),
    type: 'tableRow',
  }
}
