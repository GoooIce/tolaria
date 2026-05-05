import { Pressable, Text, View } from 'react-native'
import { GitBranch, HardDrive, SlidersHorizontal } from 'phosphor-react-native'
import { styles } from './styles'
import { colors } from './theme'
import type { MobileVaultMetadata } from './mobileVaultMetadata'
import { createMobileVaultManagementSummary } from './mobileVaultManagementSummary'

export function MobileVaultManagementCard({
  onOpenRemoteSetup,
  vault,
}: {
  onOpenRemoteSetup: () => void
  vault: MobileVaultMetadata
}) {
  const summary = createMobileVaultManagementSummary(vault)

  return (
    <View style={styles.vaultManagementCard}>
      <View style={styles.vaultManagementHeader}>
        <View style={styles.vaultManagementIcon}>
          <HardDrive size={18} color={colors.primary} />
        </View>
        <View style={styles.vaultManagementTitleGroup}>
          <Text numberOfLines={1} style={styles.vaultManagementTitle}>{summary.name}</Text>
          <Text style={styles.vaultManagementDetail}>{summary.storageLabel}</Text>
        </View>
      </View>
      <View style={styles.vaultManagementRemoteRow}>
        <GitBranch size={17} color={colors.iconMuted} />
        <View style={styles.vaultManagementRemoteText}>
          <Text style={styles.vaultManagementRemoteLabel}>{summary.remoteLabel}</Text>
          <Text numberOfLines={1} style={styles.vaultManagementDetail}>{summary.remoteDetail}</Text>
        </View>
      </View>
      <Pressable
        accessibilityLabel="Configure Git remote"
        onPress={onOpenRemoteSetup}
        style={({ pressed }) => [styles.vaultManagementAction, pressed ? styles.pressed : null]}
      >
        <SlidersHorizontal size={17} color={colors.primary} />
        <Text style={styles.vaultManagementActionText}>{summary.actionLabel}</Text>
      </Pressable>
    </View>
  )
}
