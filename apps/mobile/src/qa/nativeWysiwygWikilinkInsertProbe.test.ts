import { describe, expect, it } from 'vitest'
import {
  assertNativeWysiwygWikilinkInsertProofs,
  formatNativeWysiwygWikilinkInsertFailures,
  nativeWysiwygWikilinkInsertLogLine,
  nativeWysiwygWikilinkInsertProbeEnabled,
  nativeWysiwygWikilinkInsertProbePayload,
  nativeWysiwygWikilinkInsertProof,
  parseNativeWysiwygWikilinkInsertProofs,
} from './nativeWysiwygWikilinkInsertProbe'

describe('native WYSIWYG wikilink insert probe', () => {
  it('uses the canonical native insertion payload', () => {
    expect(nativeWysiwygWikilinkInsertProbePayload()).toEqual({
      label: 'AI Ops Guide',
      target: 'AI Ops Guide',
    })
  })

  it('builds a passing proof when the inserted link saved as desktop markdown', () => {
    expect(nativeWysiwygWikilinkInsertProof({
      content: '# Note\n\nSee [[AI Ops Guide]] for details.',
      noteId: 'note.md',
    })).toMatchObject({
      insertedWikilinkSaved: true,
      noteId: 'note.md',
    })
  })

  it('parses and asserts simulator log proofs', () => {
    const proof = nativeWysiwygWikilinkInsertProof({
      content: '# Note\n\n[[AI Ops Guide]] ',
      noteId: 'note.md',
    })

    expect(parseNativeWysiwygWikilinkInsertProofs(nativeWysiwygWikilinkInsertLogLine(proof))).toEqual([proof])
    expect(assertNativeWysiwygWikilinkInsertProofs([proof])).toEqual([])
  })

  it('reports missing and failed insert proofs', () => {
    expect(formatNativeWysiwygWikilinkInsertFailures(
      assertNativeWysiwygWikilinkInsertProofs([]),
    )).toContain('editor.wysiwyg.wikilinkInsert')
    expect(assertNativeWysiwygWikilinkInsertProofs([
      nativeWysiwygWikilinkInsertProof({ content: '# Note', noteId: 'note.md' }),
    ])).toEqual([{
      id: 'editor.wysiwyg.wikilinkInsert.saved',
      message: 'Native WYSIWYG picker insertion saves as desktop wikilink markdown',
    }])
  })

  it('detects the native QA query flag', () => {
    expect(nativeWysiwygWikilinkInsertProbeEnabled(new globalThis.URLSearchParams('wysiwygWikilinkInsertProbe=1'))).toBe(true)
    expect(nativeWysiwygWikilinkInsertProbeEnabled(new globalThis.URLSearchParams('wysiwygWikilinkInsertProbe=0'))).toBe(false)
  })
})
