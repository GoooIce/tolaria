import { useEffect } from 'react'

type KeyboardShortcutHandlers = {
  onCreateNote?: () => void
  onOpenFindInNote?: () => void
  onOpenCommandPalette: () => void
  onOpenSearch: () => void
  onSelectNextNote?: () => void
  onSelectPreviousNote?: () => void
  onToggleRawEditor?: () => void
}
type MobileWorkspaceKeyboardAction =
  | 'commandPalette'
  | 'createNote'
  | 'findInNote'
  | 'nextNote'
  | 'previousNote'
  | 'search'
  | 'toggleRawEditor'

type KeyboardDocument = {
  addEventListener: (type: 'keydown', listener: (event: KeyboardEvent) => void, options?: KeyboardListenerOptions) => void
  removeEventListener: (type: 'keydown', listener: (event: KeyboardEvent) => void, options?: KeyboardListenerOptions) => void
}
type KeyboardListenerOptions = { capture?: boolean } | boolean
type KeyboardTargetCandidate = Partial<KeyboardDocument> | null | undefined
type KeyboardTargetHost = {
  document?: (Partial<KeyboardDocument> & { body?: KeyboardTargetCandidate }) | null
  window?: KeyboardTargetCandidate
}

export function useMobileWorkspaceKeyboardShortcuts({
  onCreateNote,
  onOpenFindInNote,
  onOpenCommandPalette,
  onOpenSearch,
  onSelectNextNote,
  onSelectPreviousNote,
  onToggleRawEditor,
}: KeyboardShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const action = mobileWorkspaceKeyboardAction(event)
      if (!action) return
      if (noteNavigationAction(action) && keyboardEventTargetAcceptsTextInput(event)) return

      event.preventDefault()
      if (action === 'commandPalette') onOpenCommandPalette()
      else if (action === 'findInNote') onOpenFindInNote?.()
      else if (action === 'nextNote') onSelectNextNote?.()
      else if (action === 'previousNote') onSelectPreviousNote?.()
      else if (action === 'search') onOpenSearch()
      else if (action === 'toggleRawEditor') onToggleRawEditor?.()
      else onCreateNote?.()
    }

    return installMobileWorkspaceKeyboardShortcuts(handleKeyDown)
  }, [
    onCreateNote,
    onOpenCommandPalette,
    onOpenFindInNote,
    onOpenSearch,
    onSelectNextNote,
    onSelectPreviousNote,
    onToggleRawEditor,
  ])
}

export function installMobileWorkspaceKeyboardShortcuts(
  listener: (event: KeyboardEvent) => void,
  host: KeyboardTargetHost = globalThis as KeyboardTargetHost,
) {
  const targets = keyboardTargets(host)
  if (targets.length === 0) return undefined

  const options = { capture: true }
  targets.forEach((target) => target.addEventListener('keydown', listener, options))
  return () => targets.forEach((target) => target.removeEventListener('keydown', listener, options))
}

export function keyboardTargets(host: KeyboardTargetHost): KeyboardDocument[] {
  return uniqueKeyboardTargets([
    host.document,
    host.window,
    host.document?.body ?? undefined,
  ])
}

function uniqueKeyboardTargets(targets: KeyboardTargetCandidate[]) {
  const seen = new Set<KeyboardDocument>()
  return targets.filter((target): target is KeyboardDocument => {
    if (!isKeyboardTarget(target) || seen.has(target)) return false
    seen.add(target)
    return true
  })
}

function isKeyboardTarget(target: KeyboardTargetCandidate): target is KeyboardDocument {
  return (
    typeof target?.addEventListener === 'function' &&
    typeof target.removeEventListener === 'function'
  )
}

export function mobileWorkspaceKeyboardAction(
  event: Pick<KeyboardEvent, 'altKey' | 'ctrlKey' | 'key' | 'metaKey' | 'shiftKey'> & Partial<Pick<KeyboardEvent, 'code'>>,
): MobileWorkspaceKeyboardAction | null {
  const key = normalizedKeyboardKey(event)
  if (!event.metaKey && !event.ctrlKey) {
    if (event.altKey || event.shiftKey) return null
    if (key === 'arrowdown') return 'nextNote'
    if (key === 'arrowup') return 'previousNote'
    return null
  }
  if (event.altKey || event.shiftKey) return null

  if (key === 'k' || key === 'keyk') return 'commandPalette'
  if (key === 'f' || key === 'keyf') return 'findInNote'
  if (key === 'o' || key === 'keyo' || key === 'p' || key === 'keyp') return 'search'
  if (key === '\\' || key === 'backslash') return 'toggleRawEditor'
  if (key === 'n' || key === 'keyn') return 'createNote'
  return null
}

function normalizedKeyboardKey(
  event: Pick<KeyboardEvent, 'key'> & Partial<Pick<KeyboardEvent, 'code'>>,
) {
  const key = event.key.toLowerCase()
  if (key === 'unidentified' || key.length === 0) return event.code?.toLowerCase() ?? ''
  if (key === '\\') return '\\'
  return key
}

function noteNavigationAction(action: MobileWorkspaceKeyboardAction) {
  return action === 'nextNote' || action === 'previousNote'
}

function keyboardEventTargetAcceptsTextInput(event: KeyboardEvent) {
  const target = event.target as { isContentEditable?: boolean; tagName?: string } | null
  if (!target) return false
  const tagName = target.tagName?.toLowerCase()

  return target.isContentEditable === true || tagName === 'input' || tagName === 'textarea'
}
