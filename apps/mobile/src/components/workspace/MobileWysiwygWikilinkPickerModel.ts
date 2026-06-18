import {
  mobileWikilinkAutocompleteSuggestions,
  mobileWikilinkAutocompleteTarget,
} from '../../workspace/mobileWikilinkAutocomplete'
import type { MobileNote } from '../../workspace/mobileWorkspaceModel'
import type { NativeWysiwygWikilinkPayload } from './MobileWysiwygWikilinkBridgeModel'

export function mobileWysiwygWikilinkPickerSuggestions(
  notes: MobileNote[],
  query: string,
): MobileNote[] {
  return mobileWikilinkAutocompleteSuggestions(notes, query)
}

export function mobileWysiwygWikilinkPayloadForNote(
  note: MobileNote,
): NativeWysiwygWikilinkPayload {
  return {
    label: note.title,
    target: mobileWikilinkAutocompleteTarget(note),
  }
}
