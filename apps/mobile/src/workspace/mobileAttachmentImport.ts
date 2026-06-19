import { useCallback } from 'react'
import type { MobileAttachmentImport } from './mobileAttachments'

export type MobileAttachmentImporter = () => Promise<MobileAttachmentImport | null>

export const MOBILE_ATTACHMENT_IMPORTS_GLOBAL_KEY = '__TOLARIA_MOBILE_ATTACHMENT_IMPORTS__'

export function useMobileAttachmentImporter(vaultRootUri?: string | null): MobileAttachmentImporter {
  void vaultRootUri
  return useCallback(async () => readMobileAttachmentImportFromGlobal(), [])
}

export function readMobileAttachmentImportFromGlobal(): MobileAttachmentImport | null {
  const target = globalThis as Record<string, unknown>
  const imports = target[MOBILE_ATTACHMENT_IMPORTS_GLOBAL_KEY]
  if (Array.isArray(imports)) return readNextAttachmentImport(target, imports)

  Reflect.deleteProperty(target, MOBILE_ATTACHMENT_IMPORTS_GLOBAL_KEY)
  return isMobileAttachmentImport(imports) ? imports : null
}

function readNextAttachmentImport(
  target: Record<string, unknown>,
  imports: unknown[],
): MobileAttachmentImport | null {
  const [nextImport, ...remainingImports] = imports
  target[MOBILE_ATTACHMENT_IMPORTS_GLOBAL_KEY] = remainingImports
  return isMobileAttachmentImport(nextImport) ? nextImport : null
}

function isMobileAttachmentImport(value: unknown): value is MobileAttachmentImport {
  if (!isRecord(value)) return false

  return typeof value.name === 'string'
    && typeof value.path === 'string'
    && (
      value.mimeType === undefined
      || value.mimeType === null
      || typeof value.mimeType === 'string'
    )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
