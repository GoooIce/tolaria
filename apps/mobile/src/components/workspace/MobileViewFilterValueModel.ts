import type { MobileViewFilterCondition, MobileViewFilterOp } from '../../workspace/mobileWorkspaceModel'
import { compileSafeUserRegex } from '../../../../../src/utils/safeRegex'
import { parseDateFilterInput } from '../../../../../src/utils/filterDates'

type MobileViewFilterValueInputKind = 'date' | 'text'

const dateFilterOps = new Set<MobileViewFilterOp>(['after', 'before'])
const regexFilterOps = new Set<MobileViewFilterOp>(['contains', 'equals', 'not_contains', 'not_equals'])
const datePreviewFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function mobileViewFilterValueInputKind(op: MobileViewFilterOp): MobileViewFilterValueInputKind {
  return dateFilterOps.has(op) ? 'date' : 'text'
}

export function mobileViewFilterRegexSupported(op: MobileViewFilterOp): boolean {
  return regexFilterOps.has(op)
}

export function mobileViewFilterRegexIsInvalid(condition: MobileViewFilterCondition): boolean {
  if (!mobileViewFilterRegexSupported(condition.op) || condition.regex !== true) return false
  return !compileSafeUserRegex(String(condition.value ?? ''), 'i').ok
}

export function mobileViewFilterDatePreviewLabel(value: string, reference = new Date()): string | null {
  const parsed = parseDateFilterInput(value, reference)
  return parsed ? datePreviewFormatter.format(parsed) : null
}
