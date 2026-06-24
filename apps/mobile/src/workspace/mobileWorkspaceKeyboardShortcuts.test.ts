import { describe, expect, it } from 'vitest'
import {
  installMobileWorkspaceKeyboardShortcuts,
  keyboardTargets,
  mobileWorkspaceKeyboardAction,
} from './mobileWorkspaceKeyboardShortcuts'

describe('mobile workspace keyboard shortcuts', () => {
  it('opens quick search from desktop quick-open shortcuts', () => {
    expect(shortcut('o')).toBe('search')
    expect(shortcut('p')).toBe('search')
  })

  it('opens the command palette from the desktop command palette shortcut', () => {
    expect(shortcut('k')).toBe('commandPalette')
  })

  it('opens find in note from the desktop find shortcut', () => {
    expect(shortcut('f')).toBe('findInNote')
  })

  it('toggles the raw editor from the desktop raw-editor shortcut', () => {
    expect(shortcut('\\')).toBe('toggleRawEditor')
    expect(shortcut('Backslash')).toBe('toggleRawEditor')
    expect(shortcut('Unidentified', { code: 'Backslash' })).toBe('toggleRawEditor')
  })

  it('moves across visible notes with unmodified arrow keys', () => {
    expect(unmodifiedShortcut('ArrowDown')).toBe('nextNote')
    expect(unmodifiedShortcut('ArrowUp')).toBe('previousNote')
  })

  it('ignores shifted or unmodified keys', () => {
    expect(shortcut('k', { shiftKey: true })).toBeNull()
    expect(unmodifiedShortcut('k')).toBeNull()
  })

  it('uses document, window, and body key targets when the native runtime exposes them', () => {
    const document = keyboardTarget()
    const window = keyboardTarget()
    const body = keyboardTarget()

    expect(keyboardTargets({ document: { ...document, body }, window })).toHaveLength(3)
  })

  it('deduplicates native key targets before installing listeners', () => {
    const document = keyboardTarget()
    const remove = installMobileWorkspaceKeyboardShortcuts(() => undefined, {
      document: { ...document, body: document },
      window: document,
    })

    expect(document.added).toBe(1)
    remove?.()
    expect(document.removed).toBe(1)
  })

  it('ignores native runtime shims that do not expose key listeners', () => {
    const document = Object.assign(keyboardTarget(), { body: {} })
    const remove = installMobileWorkspaceKeyboardShortcuts(() => undefined, {
      document,
      window: {},
    })

    expect(document.added).toBe(1)
    remove?.()
    expect(document.removed).toBe(1)
  })
})

function shortcut(
  key: string,
  overrides: Partial<Pick<KeyboardEvent, 'altKey' | 'code' | 'ctrlKey' | 'metaKey' | 'shiftKey'>> = {},
) {
  return mobileWorkspaceKeyboardAction({
    altKey: false,
    ctrlKey: false,
    key,
    metaKey: true,
    shiftKey: false,
    ...overrides,
  })
}

function unmodifiedShortcut(key: string) {
  return mobileWorkspaceKeyboardAction({
    altKey: false,
    ctrlKey: false,
    key,
    metaKey: false,
    shiftKey: false,
  })
}

function keyboardTarget() {
  return {
    added: 0,
    removed: 0,
    addEventListener() {
      this.added += 1
    },
    removeEventListener() {
      this.removed += 1
    },
  }
}
