import { desktopEditorParity } from '../../ui/desktopParity'
import { mobileColors, mobileSpace } from '../../ui/tokens'

type CssDeclaration = readonly [property: string, value: string | number]

export function mobileTentapEditorCss(compact: boolean): string {
  const horizontalPadding = compact ? mobileSpace.xl : desktopEditorParity.contentPaddingHorizontal
  const h1FontSize = compact ? 30 : desktopEditorParity.h1FontSize
  const h1LineHeight = compact ? 36 : desktopEditorParity.h1LineHeight

  return [
    ...documentRules(horizontalPadding),
    ...headingRules({ h1FontSize, h1LineHeight }),
    ...blockRules(),
    ...tableRules(),
  ].join('\n')
}

function documentRules(horizontalPadding: number): string[] {
  return [
    cssRule('html, body', [
      ['background', mobileColors.editor],
      ['color', mobileColors.text],
      ['font-family', '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'],
      ['font-size', `${desktopEditorParity.bodyFontSize}px`],
      ['line-height', `${desktopEditorParity.bodyLineHeight}px`],
      ['margin', 0],
      ['padding', 0],
    ]),
    cssRule('.ProseMirror', [
      ['box-sizing', 'border-box'],
      ['caret-color', mobileColors.primary],
      ['margin', '0 auto'],
      ['max-width', `${desktopEditorParity.contentMaxWidth}px`],
      ['min-height', '100vh'],
      ['outline', 'none'],
      ['padding', `${desktopEditorParity.contentPaddingVertical}px ${horizontalPadding}px 96px`],
      ['width', '100%'],
    ]),
  ]
}

function headingRules({ h1FontSize, h1LineHeight }: { h1FontSize: number; h1LineHeight: number }): string[] {
  return [
    cssRule('.ProseMirror h1', [
      ['border-bottom', `1px solid ${mobileColors.border}`],
      ['color', mobileColors.text],
      ['font-size', `${h1FontSize}px`],
      ['font-weight', 700],
      ['line-height', `${h1LineHeight}px`],
      ['margin', `0 0 ${desktopEditorParity.h1MarginBottom}px`],
      ['padding-bottom', `${desktopEditorParity.h1PaddingBottom}px`],
    ]),
    headingRule('.ProseMirror h2', {
      fontSize: desktopEditorParity.h2FontSize,
      lineHeight: desktopEditorParity.h2LineHeight,
      marginBottom: desktopEditorParity.h2MarginBottom,
      marginTop: desktopEditorParity.h2MarginTop,
    }),
    headingRule('.ProseMirror h3', {
      fontSize: desktopEditorParity.h3FontSize,
      lineHeight: desktopEditorParity.h3LineHeight,
      marginBottom: desktopEditorParity.h3MarginBottom,
      marginTop: desktopEditorParity.h3MarginTop,
    }),
    headingRule('.ProseMirror h4', {
      fontSize: desktopEditorParity.h4FontSize,
      lineHeight: desktopEditorParity.h4LineHeight,
      marginBottom: desktopEditorParity.h4MarginBottom,
      marginTop: desktopEditorParity.h4MarginTop,
    }),
  ]
}

function blockRules(): string[] {
  return [
    cssRule('.ProseMirror p', [
      ['margin', `0 0 ${desktopEditorParity.paragraphSpacing}px`],
    ]),
    cssRule('.ProseMirror blockquote', [
      ['border-left', `3px solid ${mobileColors.primary}`],
      ['color', mobileColors.textMuted],
      ['font-style', 'italic'],
      ['margin', `${desktopEditorParity.quoteMarginVertical}px 0`],
      ['padding-left', `${desktopEditorParity.quotePaddingLeft}px`],
    ]),
    cssRule('.ProseMirror code', [
      ['background', mobileColors.graySoft],
      ['border-radius', '4px'],
      ['font-family', 'Menlo, monospace'],
      ['font-size', `${desktopEditorParity.inlineCodeFontSize}px`],
      ['padding', `${desktopEditorParity.inlineCodePaddingVertical}px ${desktopEditorParity.inlineCodePaddingHorizontal}px`],
    ]),
    cssRule('.ProseMirror pre', [
      ['background', mobileColors.graySoft],
      ['border-radius', '6px'],
      ['overflow-x', 'auto'],
      ['padding', `${mobileSpace.md}px`],
    ]),
    cssRule('.ProseMirror ul, .ProseMirror ol', [
      ['margin', `0 0 ${desktopEditorParity.paragraphSpacing}px`],
      ['padding-left', `${desktopEditorParity.listIndentSize + desktopEditorParity.listPaddingLeft}px`],
    ]),
    cssRule('.ProseMirror li', [
      ['margin', `${desktopEditorParity.listItemSpacing}px 0`],
    ]),
    cssRule('.ProseMirror hr', [
      ['border', 0],
      ['border-top', `${desktopEditorParity.horizontalRuleThickness}px solid ${mobileColors.border}`],
      ['margin', `${desktopEditorParity.horizontalRuleMarginVertical}px 0`],
    ]),
  ]
}

function tableRules(): string[] {
  return [
    cssRule('.ProseMirror table', [
      ['border-collapse', 'collapse'],
      ['font-size', `${desktopEditorParity.tableFontSize}px`],
      ['margin', `${mobileSpace.md}px 0`],
      ['width', '100%'],
    ]),
    cssRule('.ProseMirror th, .ProseMirror td', [
      ['border', `1px solid ${mobileColors.border}`],
      ['padding', `${desktopEditorParity.tableCellPaddingVertical}px ${desktopEditorParity.tableCellPaddingHorizontal}px`],
      ['text-align', 'left'],
    ]),
    cssRule('.ProseMirror a', [
      ['color', mobileColors.primary],
    ]),
  ]
}

function headingRule(
  selector: string,
  tokens: { fontSize: number; lineHeight: number; marginBottom: number; marginTop: number },
): string {
  return cssRule(selector, [
    ['color', mobileColors.text],
    ['font-size', `${tokens.fontSize}px`],
    ['font-weight', 700],
    ['line-height', `${tokens.lineHeight}px`],
    ['margin', `${tokens.marginTop}px 0 ${tokens.marginBottom}px`],
  ])
}

function cssRule(selector: string, declarations: readonly CssDeclaration[]): string {
  const body = declarations.map(([property, value]) => `      ${property}: ${value};`).join('\n')
  return `    ${selector} {\n${body}\n    }`
}
