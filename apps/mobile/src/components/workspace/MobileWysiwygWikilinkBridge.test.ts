import { describe, expect, it } from 'vitest'
import { tiptapJsonToMobileMarkdown, type TiptapJsonNode } from '../../workspace/mobileDocumentContent'
import {
  nativeWysiwygDocumentWithInsertedWikilink,
  nativeWysiwygWikilinkContent,
  type NativeWysiwygSelection,
  type NativeWysiwygWikilinkPayload,
} from './MobileWysiwygWikilinkBridgeModel'

describe('native WYSIWYG wikilink bridge', () => {
  it('builds TenTap inline content that serializes as a desktop wikilink', () => {
    expect(nativeWysiwygWikilinkContent({
      label: 'Mobile UI',
      target: 'Tolaria/Mobile UI',
    })).toEqual([
      {
        marks: [{ attrs: { href: 'tolaria://wikilink/Tolaria%2FMobile%20UI' }, type: 'link' }],
        text: 'Mobile UI',
        type: 'text',
      },
      { text: ' ', type: 'text' },
    ])
  })

  it('falls back to the target when the display label is blank', () => {
    expect(nativeWysiwygWikilinkContent({
      label: '   ',
      target: 'AI Ops Guide',
    })?.[0]).toMatchObject({
      text: 'AI Ops Guide',
    })
  })

  it('ignores blank targets', () => {
    expect(nativeWysiwygWikilinkContent({ label: 'Empty', target: '  ' })).toBeNull()
  })

  it('inserts the wikilink at the current native editor selection', () => {
    expect(insertedWikilinkMarkdown({
      text: 'Read  today.',
      payload: {
        label: 'Mobile UI',
        target: 'Tolaria/Mobile UI',
      },
      selection: { from: 6, to: 6 },
    })).toBe('Read [[Tolaria/Mobile UI|Mobile UI]] today.')
  })

  it('replaces selected native editor text with the wikilink', () => {
    expect(insertedWikilinkMarkdown({
      payload: {
        label: 'AI Ops Guide',
        target: 'AI Ops Guide',
      },
      selection: { from: 6, to: 10 },
      text: 'Read this note.',
    })).toBe('Read [[AI Ops Guide]] note.')
  })

  it('falls back to appending to the first paragraph when native selection is unavailable', () => {
    const nextDocument = nativeWysiwygDocumentWithInsertedWikilink({
      json: documentNode(headingNode(1, 'Title'), paragraphNode('Body')),
      payload: {
        label: 'AI Ops Guide',
        target: 'AI Ops Guide',
      },
    })

    expect(tiptapJsonToMobileMarkdown(nextDocument)).toBe(['# Title', '', 'Body[[AI Ops Guide]]'].join('\n'))
  })
})

function insertedWikilinkMarkdown({
  payload,
  selection,
  text,
}: {
  payload: NativeWysiwygWikilinkPayload
  selection?: NativeWysiwygSelection
  text: string
}): string {
  return tiptapJsonToMobileMarkdown(nativeWysiwygDocumentWithInsertedWikilink({
    json: documentNode(paragraphNode(text)),
    payload,
    selection,
  }))
}

function documentNode(...content: TiptapJsonNode[]): TiptapJsonNode {
  return { content, type: 'doc' }
}

function headingNode(level: number, text: string): TiptapJsonNode {
  return {
    attrs: { level },
    content: [{ text, type: 'text' }],
    type: 'heading',
  }
}

function paragraphNode(text: string): TiptapJsonNode {
  return {
    content: [{ text, type: 'text' }],
    type: 'paragraph',
  }
}
