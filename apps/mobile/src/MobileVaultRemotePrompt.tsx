import { Pressable, Text, TextInput, View } from 'react-native'
import { styles } from './styles'

export function MobileVaultRemotePrompt({
  failed,
  hasGitHubOAuthClientId,
  isSaving,
  onCancel,
  onChangeRemoteUrl,
  onSubmit,
  remoteUrl,
}: {
  failed: boolean
  hasGitHubOAuthClientId: boolean
  isSaving: boolean
  onCancel: () => void
  onChangeRemoteUrl: (remoteUrl: string) => void
  onSubmit: () => void
  remoteUrl: string
}) {
  return (
    <View style={styles.createNotePrompt}>
      <Text style={styles.remotePromptTitle}>Git remote</Text>
      <TextInput
        accessibilityLabel="Git remote URL"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isSaving}
        onChangeText={onChangeRemoteUrl}
        onSubmitEditing={onSubmit}
        placeholder="https://github.com/owner/repo.git"
        returnKeyType="done"
        style={styles.createNoteInput}
        value={remoteUrl}
      />
      {!hasGitHubOAuthClientId ? (
        <Text style={styles.createNoteError}>GitHub login needs EXPO_PUBLIC_GITHUB_OAUTH_CLIENT_ID</Text>
      ) : null}
      {failed ? <Text style={styles.createNoteError}>Enter a valid Git remote URL</Text> : null}
      <View style={styles.createNoteActions}>
        <PromptButton label="Cancel" onPress={onCancel} />
        <PromptButton label={isSaving ? 'Saving' : 'Save'} onPress={onSubmit} disabled={isSaving} primary />
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
