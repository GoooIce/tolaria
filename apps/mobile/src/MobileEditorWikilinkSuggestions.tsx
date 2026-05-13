import { useMemo } from 'react'
import { Pressable, Text, View } from 'react-native'
import type { MobileNote } from './mobileNoteProjection'
import { mobileNoteSuggestions } from './mobileWikilinkAutocomplete'
import { styles } from './styles'

export function MobileEditorWikilinkSuggestions({
  excludeNoteId,
  notes,
  onSelectNote,
  query,
}: {
  excludeNoteId: string
  notes: MobileNote[]
  onSelectNote: (note: MobileNote) => void
  query: string | null
}) {
  const suggestions = useMemo(() => {
    return query === null
      ? []
      : mobileNoteSuggestions({ excludeNoteId, notes, query })
  }, [excludeNoteId, notes, query])

  if (!query || suggestions.length === 0) {
    return null
  }

  return (
    <View style={styles.rawEditorSuggestionMenu}>
      {suggestions.map((suggestion) => (
        <Pressable
          key={suggestion.id}
          onPress={() => onSelectNote(suggestion)}
          style={({ pressed }) => [styles.rawEditorSuggestion, pressed ? styles.pressed : null]}
        >
          <Text style={styles.rawEditorSuggestionTitle}>{suggestion.title}</Text>
          <Text style={styles.rawEditorSuggestionMeta}>{suggestion.id}</Text>
        </Pressable>
      ))}
    </View>
  )
}
