import { describe, expect, it } from 'vitest'
import {
  assertNativeWysiwygAutocompleteProofs,
  formatNativeWysiwygAutocompleteFailures,
  nativeWysiwygAutocompleteLogLine,
  nativeWysiwygAutocompleteProbeContent,
  nativeWysiwygAutocompleteProbeEnabled,
  nativeWysiwygAutocompleteProbeSelection,
  nativeWysiwygAutocompleteProbeSteps,
  nativeWysiwygAutocompleteProof,
  parseNativeWysiwygAutocompleteProofs,
} from './nativeWysiwygAutocompleteProbe'

describe('native WYSIWYG autocomplete probe', () => {
  it('keeps the legacy single-step helpers pointed at the wikilink probe', () => {
    expect(nativeWysiwygAutocompleteProbeContent()).toMatchObject({
      content: [{ content: [{ text: 'See [[AI' }] }],
      type: 'doc',
    })
    expect(nativeWysiwygAutocompleteProbeSelection()).toEqual({ from: 9, to: 9 })
  })

  it('runs native documents for wikilink and person mention autocomplete', () => {
    expect(nativeWysiwygAutocompleteProbeSteps()).toEqual([
      {
        content: {
          content: [{ content: [{ text: 'See [[AI', type: 'text' }], type: 'paragraph' }],
          type: 'doc',
        },
        selection: { from: 9, to: 9 },
      },
      {
        content: {
          content: [{ content: [{ text: 'Ask @Lu', type: 'text' }], type: 'paragraph' }],
          type: 'doc',
        },
        selection: { from: 8, to: 8 },
      },
    ])
  })

  it('parses and asserts simulator log proofs for both autocomplete families', () => {
    const wikilinkProof = nativeWysiwygAutocompleteProof({
      kind: 'wikilink',
      query: 'AI',
      range: { from: 5, to: 9 },
    })
    const personMentionProof = nativeWysiwygAutocompleteProof({
      kind: 'personMention',
      query: 'Lu',
      range: { from: 5, to: 8 },
    })
    const log = [
      nativeWysiwygAutocompleteLogLine(wikilinkProof),
      nativeWysiwygAutocompleteLogLine(personMentionProof),
    ].join('\n')

    expect(parseNativeWysiwygAutocompleteProofs(log)).toEqual([wikilinkProof, personMentionProof])
    expect(assertNativeWysiwygAutocompleteProofs([wikilinkProof, personMentionProof])).toEqual([])
  })

  it('reports missing and failed autocomplete proofs', () => {
    expect(formatNativeWysiwygAutocompleteFailures(assertNativeWysiwygAutocompleteProofs([]))).toContain('editor.wysiwyg.autocomplete')
    expect(assertNativeWysiwygAutocompleteProofs([
      nativeWysiwygAutocompleteProof(null),
    ])).toEqual([
      {
        id: 'editor.wysiwyg.autocomplete.wikilink',
        message: 'Native WYSIWYG detects wikilink autocomplete with the exact replacement range',
      },
      {
        id: 'editor.wysiwyg.autocomplete.personMention',
        message: 'Native WYSIWYG detects person mention autocomplete with the exact replacement range',
      },
    ])
  })

  it('detects the native QA query flag', () => {
    expect(nativeWysiwygAutocompleteProbeEnabled(new globalThis.URLSearchParams('wysiwygAutocompleteProbe=1'))).toBe(true)
    expect(nativeWysiwygAutocompleteProbeEnabled(new globalThis.URLSearchParams('wysiwygAutocompleteProbe=0'))).toBe(false)
  })
})
