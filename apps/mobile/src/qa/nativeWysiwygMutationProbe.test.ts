import { describe, expect, it } from 'vitest'
import {
  assertNativeWysiwygMutationProofs,
  nativeWysiwygMutationLogLine,
  nativeWysiwygMutationProof,
  nativeWysiwygMutationPreProofLogText,
  nativeWysiwygMutationProbeContent,
  nativeWysiwygMutationProbeInitialContent,
  parseNativeWysiwygMutationProofs,
} from './nativeWysiwygMutationProbe'

describe('native WYSIWYG mutation probe', () => {
  it('seeds metadata-only fixture notes with desktop-style markdown frontmatter', () => {
    expect(nativeWysiwygMutationProbeInitialContent({
      favorite: true,
      snippet: 'The current narrative and temptation: everything routed through an LLM.',
      status: 'Draft',
      tags: ['Design', 'AI'],
      title: 'Workflow Orchestration Essay',
      type: 'Essay',
    })).toBe([
      '---',
      'type: Essay',
      'Status: Draft',
      'tags:',
      '  - Design',
      '  - AI',
      '_favorite: true',
      '---',
      '# Workflow Orchestration Essay',
      '',
      'The current narrative and temptation: everything routed through an LLM.',
      '',
    ].join('\n'))
  })

  it('builds a passing proof from the saved markdown content', () => {
    const proof = nativeWysiwygMutationProof({
      content: savedMutationContent(),
      json: nativeWysiwygMutationProbeContent(),
      noteId: 'workflow-orchestration',
    })

    expect(assertNativeWysiwygMutationProofs([proof])).toEqual([])
  })

  it('seeds native file attachment links when the active vault root is available', () => {
    expect(nativeWysiwygMutationProbeContent('file:///vault/root/')).toMatchObject({
      content: expect.arrayContaining([
        expect.objectContaining({
          content: expect.arrayContaining([
            expect.objectContaining({
              marks: [{ attrs: { href: 'file:///vault/root/attachments/project%20brief.pdf' }, type: 'link' }],
              text: 'project brief.pdf',
            }),
          ]),
        }),
        expect.objectContaining({
          attrs: {
            alt: 'mobile diagram.png',
            src: 'file:///vault/root/attachments/mobile%20diagram.png',
          },
          type: 'image',
        }),
        expect.objectContaining({
          type: 'codeBlock',
        }),
        expect.objectContaining({
          content: expect.arrayContaining([
            expect.objectContaining({
              content: expect.arrayContaining([
                expect.objectContaining({
                  attrs: { tolariaAlignment: 'left' },
                  type: 'tableHeader',
                }),
                expect.objectContaining({
                  attrs: { tolariaAlignment: 'right' },
                  type: 'tableHeader',
                }),
              ]),
            }),
          ]),
          type: 'table',
        }),
      ]),
    })
  })

  it('parses native simulator log lines and reports missing invariants', () => {
    const proof = nativeWysiwygMutationProof({
      content: '# Native WYSIWYG Mutation Probe\n\nNative bridge mutation saved through TenTap.\n',
      noteId: 'workflow-orchestration',
    })
    const parsed = parseNativeWysiwygMutationProofs(`noise\n${nativeWysiwygMutationLogLine(proof)}\n`)

    expect(parsed).toEqual([proof])
    expect(assertNativeWysiwygMutationProofs(parsed).map((failure) => failure.id)).toEqual([
      'editor.wysiwyg.mutation.frontmatter',
      'editor.wysiwyg.mutation.attachment',
      'editor.wysiwyg.mutation.imageAttachment',
      'editor.wysiwyg.mutation.type',
      'editor.wysiwyg.mutation.status',
      'editor.wysiwyg.mutation.tags',
      'editor.wysiwyg.mutation.favorite',
      'editor.wysiwyg.mutation.inline',
      'editor.wysiwyg.mutation.wikilink',
      'editor.wysiwyg.mutation.lists',
      'editor.wysiwyg.mutation.quote',
      'editor.wysiwyg.mutation.codeBlock',
      'editor.wysiwyg.mutation.codeBlockStructured',
      'editor.wysiwyg.mutation.divider',
      'editor.wysiwyg.mutation.table',
      'editor.wysiwyg.mutation.tableAlignment',
      'editor.wysiwyg.mutation.tableStructured',
    ])
  })

  it('keeps layout assertions on pre-mutation logs while still parsing the proof', () => {
    const proof = nativeWysiwygMutationProof({
      content: savedMutationContent(),
      json: nativeWysiwygMutationProbeContent(),
      noteId: 'workflow-orchestration',
    })
    const logText = [
      'TOLARIA_MOBILE_LAYOUT_METRIC {"id":"before"}',
      nativeWysiwygMutationLogLine(proof),
      'TOLARIA_MOBILE_LAYOUT_METRIC {"id":"after"}',
    ].join('\n')

    expect(nativeWysiwygMutationPreProofLogText(logText)).toBe('TOLARIA_MOBILE_LAYOUT_METRIC {"id":"before"}\n')
    expect(assertNativeWysiwygMutationProofs(parseNativeWysiwygMutationProofs(logText))).toEqual([])
  })

  it('keeps current layout logs when a stale native proof is inside the log window', () => {
    const proof = nativeWysiwygMutationProof({
      content: savedMutationContent(),
      json: nativeWysiwygMutationProbeContent(),
      noteId: 'workflow-orchestration',
    })
    const staleProof = nativeWysiwygMutationLogLine(proof)
    const currentProof = nativeWysiwygMutationLogLine({ ...proof, noteId: 'current-run' })
    const logText = [
      staleProof,
      'TOLARIA_MOBILE_LAYOUT_METRIC {"id":"current"}',
      currentProof,
      'TOLARIA_MOBILE_LAYOUT_METRIC {"id":"late"}',
    ].join('\n')

    expect(nativeWysiwygMutationPreProofLogText(logText)).toBe(`${staleProof}\nTOLARIA_MOBILE_LAYOUT_METRIC {"id":"current"}\n`)
    expect(assertNativeWysiwygMutationProofs(parseNativeWysiwygMutationProofs(logText))).toEqual([])
  })
})

function savedMutationContent(): string {
  return [
    '---',
    'type: Essay',
    'Status: Draft',
    'tags:',
    '  - Design',
    '  - AI',
    '_favorite: true',
    '---',
    '# Native WYSIWYG Mutation Probe',
    '',
    'Native bridge mutation saved through TenTap.',
    '',
    'Formatting: **bold**, *italic*, ~~strike~~, `code`, ==highlight==, [[AI Ops Guide]].',
    '',
    '[project brief.pdf](<attachments/project brief.pdf>)',
    '',
    '![mobile diagram.png](<attachments/mobile diagram.png>)',
    '',
    '- Bullet item',
    '',
    '1. Ordered item',
    '',
    '- [x] Task item',
    '',
    '> Quoted desktop parity',
    '',
    '```ts',
    'const parity = "desktop";',
    'ship(parity)',
    '```',
    '',
    '---',
    '',
    '| Surface | Target |',
    '| :--- | ---: |',
    '| Editor | Native WYSIWYG |',
    '',
  ].join('\n')
}
