import { describe, expect, it } from 'vitest'
import { desktopEditorParity } from '../../ui/desktopParity'
import { mobileTentapEditorCss } from './MobileWysiwygMarkdownEditorCss'

describe('mobile TenTap editor CSS', () => {
  it('keeps H4 spacing separate from H3 using desktop editor tokens', () => {
    const css = mobileTentapEditorCss(false)

    expect(cssBlock(css, '.ProseMirror h3')).toContain(
      `margin: ${desktopEditorParity.h3MarginTop}px 0 ${desktopEditorParity.h3MarginBottom}px;`,
    )
    expect(cssBlock(css, '.ProseMirror h4')).toContain(
      `margin: ${desktopEditorParity.h4MarginTop}px 0 ${desktopEditorParity.h4MarginBottom}px;`,
    )
  })
})

function cssBlock(css: string, selector: string): string {
  const opening = `    ${selector} {\n`
  const start = css.indexOf(opening)
  if (start === -1) return ''

  const bodyStart = start + opening.length
  const end = css.indexOf('\n    }', bodyStart)
  return end === -1 ? '' : css.slice(bodyStart, end)
}
