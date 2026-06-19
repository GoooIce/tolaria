import { describe, expect, it } from 'vitest'
import {
  assertNativeWysiwygMarkdownBlockProofs,
  formatNativeWysiwygMarkdownBlockFailures,
  nativeWysiwygMarkdownBlockLogLine,
  nativeWysiwygMarkdownBlockProbeEnabled,
  nativeWysiwygMarkdownBlockProbePayloads,
  nativeWysiwygMarkdownBlockProof,
  parseNativeWysiwygMarkdownBlockProofs,
} from './nativeWysiwygMarkdownBlockProbe'

describe('native WYSIWYG markdown block probe', () => {
  it('uses the canonical native markdown block payloads', () => {
    expect(nativeWysiwygMarkdownBlockProbePayloads()).toEqual([
      { action: 'divider' },
      { action: 'codeBlock' },
      { action: 'table' },
    ])
  })

  it('builds a passing proof when inserted blocks save as desktop markdown', () => {
    expect(nativeWysiwygMarkdownBlockProof({
      content: [
        '# Note',
        '',
        '---',
        '',
        '```text',
        'code',
        '```',
        '',
        '| Column | Value |',
        '| --- | --- |',
        '| Item | Detail |',
      ].join('\n'),
      noteId: 'note.md',
    })).toMatchObject({
      codeBlockSaved: true,
      dividerSaved: true,
      noteId: 'note.md',
      tableSaved: true,
    })
  })

  it('does not confuse frontmatter delimiters with an inserted divider', () => {
    expect(nativeWysiwygMarkdownBlockProof({
      content: [
        '---',
        'title: Note',
        '---',
        '',
        '```text',
        'code',
        '```',
        '',
        '| Column | Value |',
        '| --- | --- |',
        '| Item | Detail |',
      ].join('\n'),
      noteId: 'note.md',
    })).toMatchObject({
      codeBlockSaved: true,
      dividerSaved: false,
      tableSaved: true,
    })
  })

  it('parses and asserts simulator log proofs', () => {
    const proof = nativeWysiwygMarkdownBlockProof({
      content: [
        'Intro',
        '',
        '---',
        '',
        '```text',
        'code',
        '```',
        '',
        '| Column | Value |',
        '| --- | --- |',
        '| Item | Detail |',
      ].join('\n'),
      noteId: 'note.md',
    })

    expect(parseNativeWysiwygMarkdownBlockProofs(nativeWysiwygMarkdownBlockLogLine(proof))).toEqual([proof])
    expect(assertNativeWysiwygMarkdownBlockProofs([proof])).toEqual([])
  })

  it('reports missing and failed block proofs', () => {
    expect(formatNativeWysiwygMarkdownBlockFailures(
      assertNativeWysiwygMarkdownBlockProofs([]),
    )).toContain('editor.wysiwyg.markdownBlocks')
    expect(assertNativeWysiwygMarkdownBlockProofs([
      nativeWysiwygMarkdownBlockProof({ content: '# Note', noteId: 'note.md' }),
    ])).toEqual([
      {
        id: 'editor.wysiwyg.markdownBlocks.divider',
        message: 'Native WYSIWYG divider insertion saves as desktop horizontal-rule markdown',
      },
      {
        id: 'editor.wysiwyg.markdownBlocks.codeBlock',
        message: 'Native WYSIWYG code-block insertion saves as desktop fenced-code markdown',
      },
      {
        id: 'editor.wysiwyg.markdownBlocks.table',
        message: 'Native WYSIWYG table insertion saves as desktop markdown table source lines',
      },
    ])
  })

  it('detects the native QA query flag', () => {
    expect(nativeWysiwygMarkdownBlockProbeEnabled(new globalThis.URLSearchParams('wysiwygMarkdownBlockProbe=1'))).toBe(true)
    expect(nativeWysiwygMarkdownBlockProbeEnabled(new globalThis.URLSearchParams('wysiwygMarkdownBlockProbe=0'))).toBe(false)
  })
})
