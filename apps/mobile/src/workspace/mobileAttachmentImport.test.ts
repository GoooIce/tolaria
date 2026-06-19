import { afterEach, describe, expect, it } from 'vitest'
import {
  MOBILE_ATTACHMENT_IMPORTS_GLOBAL_KEY,
  readMobileAttachmentImportFromGlobal,
} from './mobileAttachmentImport'

describe('mobile attachment import web fallback', () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, MOBILE_ATTACHMENT_IMPORTS_GLOBAL_KEY)
  })

  it('reads one deterministic imported attachment from the QA global', () => {
    Reflect.set(globalThis, MOBILE_ATTACHMENT_IMPORTS_GLOBAL_KEY, {
      mimeType: 'application/pdf',
      name: 'Project Brief.pdf',
      path: 'attachments/project brief.pdf',
    })

    expect(readMobileAttachmentImportFromGlobal()).toEqual({
      mimeType: 'application/pdf',
      name: 'Project Brief.pdf',
      path: 'attachments/project brief.pdf',
    })
    expect(readMobileAttachmentImportFromGlobal()).toBeNull()
  })

  it('consumes queued deterministic imported attachments in order', () => {
    Reflect.set(globalThis, MOBILE_ATTACHMENT_IMPORTS_GLOBAL_KEY, [
      { name: 'First.png', path: 'attachments/first.png' },
      { mimeType: null, name: 'Second.pdf', path: 'attachments/second.pdf' },
    ])

    expect(readMobileAttachmentImportFromGlobal()).toEqual({
      name: 'First.png',
      path: 'attachments/first.png',
    })
    expect(readMobileAttachmentImportFromGlobal()).toEqual({
      mimeType: null,
      name: 'Second.pdf',
      path: 'attachments/second.pdf',
    })
    expect(readMobileAttachmentImportFromGlobal()).toBeNull()
  })

  it('ignores malformed deterministic imports', () => {
    Reflect.set(globalThis, MOBILE_ATTACHMENT_IMPORTS_GLOBAL_KEY, { name: 'Missing path' })

    expect(readMobileAttachmentImportFromGlobal()).toBeNull()
  })
})
