import { describe, expect, it } from 'vitest'
import type { MobileNote } from '../../workspace/mobileWorkspaceModel'
import {
  mobileWysiwygWikilinkPayloadForNote,
  mobileWysiwygWikilinkPickerSuggestions,
} from './MobileWysiwygWikilinkPickerModel'

describe('native WYSIWYG wikilink picker model', () => {
  it('uses the shared mobile wikilink autocomplete candidates', () => {
    const suggestions = mobileWysiwygWikilinkPickerSuggestions([
      note({
        aliases: ['Important Alpha'],
        path: 'projects/project-alpha.md',
        title: 'Project Alpha',
        type: 'Project',
      }),
      note({ archived: true, path: 'archive/alpha.md', title: 'Archived Alpha' }),
    ], 'important')

    expect(suggestions.map((suggestion) => suggestion.title)).toEqual(['Project Alpha'])
  })

  it('builds the native insertion payload with the note title as label and canonical path target', () => {
    expect(mobileWysiwygWikilinkPayloadForNote(note({
      path: 'Tolaria/Mobile UI/How I Run an Open Source Project.md',
      title: 'How I Run an Open Source Project',
    }))).toEqual({
      label: 'How I Run an Open Source Project',
      target: 'Tolaria/Mobile UI/How I Run an Open Source Project',
    })
  })
})

function note(overrides: Partial<MobileNote>): MobileNote {
  return {
    created: 'today',
    date: 'today',
    favorite: false,
    id: overrides.path ?? `${overrides.title ?? 'Note'}.md`,
    links: 0,
    modified: 'today',
    relationships: [],
    snippet: '',
    status: '',
    tags: [],
    title: 'Note',
    type: 'Note',
    typeTone: 'gray',
    workspace: 'Vault',
    ...overrides,
  }
}
