import { BridgeExtension } from '@10play/tentap-editor'
import { mergeAttributes, Node } from '@tiptap/core'

const MATH_INLINE_TYPE = 'mathInline'

type MathInlineAttributes = {
  latex: string
}

const MathInlineNode = Node.create({
  name: MATH_INLINE_TYPE,
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-latex') ?? '',
      },
    }
  },

  parseHTML() {
    return [
      { tag: 'span[data-type="mathInline"]' },
      { tag: 'span.math[data-latex]' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = HTMLAttributes as Partial<MathInlineAttributes>
    const latex = attrs.latex ?? ''

    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        class: 'math math--inline',
        'data-latex': latex,
        'data-type': MATH_INLINE_TYPE,
        title: `$${latex}$`,
      }),
      `$${latex}$`,
    ]
  },
})

export const MobileMathInlineBridge = new BridgeExtension({
  tiptapExtension: MathInlineNode,
  extendCSS: `
    .math.math--inline {
      white-space: nowrap;
    }
  `,
})
