import { describe, expect, it } from 'vitest'
import {
  mobileMarkdownBodyToTentapHtml,
  tiptapJsonToMobileMarkdown,
  type TiptapJsonNode,
} from './mobileDocumentContent'

describe('mobile document list continuations', () => {
  it('keeps list items with continuation lines editable as source', () => {
    const html = mobileMarkdownBodyToTentapHtml('- Provide instructions\n  Teach your AI agent the workflow context\n- Run workflow\n')

    expect(html).toBe('<p>- Provide instructions<br>  Teach your AI agent the workflow context<br>- Run workflow</p>')
    expect(html).not.toContain('<ul>')
  })

  it('keeps list items with indented images editable as source', () => {
    const html = mobileMarkdownBodyToTentapHtml('- Internet access\n  ![](https://example.com/search.png)\n')

    expect(html).toBe('<p>- Internet access<br>  ![](https://example.com/search.png)</p>')
    expect(html).not.toContain('<img')
  })

  it('keeps list continuation source lines after native saves', () => {
    const document: TiptapJsonNode = {
      type: 'doc',
      content: [
        paragraphNode('- Provide instructions', '  Teach your AI agent the workflow context', '- Run workflow'),
      ],
    }

    expect(tiptapJsonToMobileMarkdown(document)).toBe(
      '- Provide instructions\n  Teach your AI agent the workflow context\n- Run workflow',
    )
  })
})

function paragraphNode(...lines: string[]): TiptapJsonNode {
  return {
    type: 'paragraph',
    content: lines.flatMap((line, index): TiptapJsonNode[] => [
      ...(index > 0 ? [{ type: 'hardBreak' }] : []),
      ...(line ? [{ text: line, type: 'text' }] : []),
    ]),
  }
}
