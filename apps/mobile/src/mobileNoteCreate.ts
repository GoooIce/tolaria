import type { MobileVaultFile } from './mobileVaultStorage'

export function createMobileNoteFile({
  now = new Date(),
  title = 'Untitled',
}: {
  now?: Date
  title?: string
} = {}): MobileVaultFile {
  const id = `note-${now.getTime().toString(36)}`
  const displayTitle = normalizeMobileNoteCreateTitle(title)

  return {
    path: `${id}.md`,
    content: [
      '---',
      `title: ${displayTitle}`,
      'type: Note',
      `created: ${now.toISOString()}`,
      '---',
      '',
      `# ${displayTitle}`,
      '',
    ].join('\n'),
  }
}

export function normalizeMobileNoteCreateTitle(title: string) {
  return title.trim() || 'Untitled'
}
