import { Pressable, Text, TextInput, View } from 'react-native'
import { styles } from './styles'

export function MobileNoteCreatePrompt({
  failed,
  isCreating,
  onCancel,
  onChangeTitle,
  onSubmit,
  title,
}: {
  failed: boolean
  isCreating: boolean
  onCancel: () => void
  onChangeTitle: (title: string) => void
  onSubmit: () => void
  title: string
}) {
  return (
    <View style={styles.createNotePrompt}>
      <TextInput
        accessibilityLabel="New note title"
        autoCapitalize="sentences"
        editable={!isCreating}
        onChangeText={onChangeTitle}
        onSubmitEditing={onSubmit}
        placeholder="Note title"
        returnKeyType="done"
        style={styles.createNoteInput}
        value={title}
      />
      {failed ? <Text style={styles.createNoteError}>Could not create note</Text> : null}
      <View style={styles.createNoteActions}>
        <PromptButton label="Cancel" onPress={onCancel} />
        <PromptButton label={isCreating ? 'Creating' : 'Create'} onPress={onSubmit} disabled={isCreating} primary />
      </View>
    </View>
  )
}

function PromptButton({
  disabled,
  label,
  onPress,
  primary,
}: {
  disabled?: boolean
  label: string
  onPress: () => void
  primary?: boolean
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.createNoteAction,
        primary ? styles.createNoteActionPrimary : null,
        disabled ? styles.createNoteActionDisabled : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <Text style={[styles.createNoteActionText, primary ? styles.createNoteActionTextPrimary : null]}>{label}</Text>
    </Pressable>
  )
}
