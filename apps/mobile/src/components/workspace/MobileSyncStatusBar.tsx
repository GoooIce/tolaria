import { Tray } from 'phosphor-react-native'
import { StyleSheet, View } from 'react-native'
import { Text } from '../ui/text'
import { mobileText } from '../../i18n/mobileText'
import { MobileButton } from '../../ui/MobileButton'
import { mobileColors, mobileSpace, mobileType } from '../../ui/tokens'
import type { MobileSyncStatus } from '../../workspace/mobileWorkspaceModel'

export function MobileSyncStatusBar({ sync }: { sync: MobileSyncStatus }) {
  return (
    <View style={styles.syncBar}>
      <View style={styles.syncStatusGroup}>
        <Tray color={syncStatusColor(sync)} size={16} />
        <Text numberOfLines={1} style={styles.syncStatusText}>{syncStatusLabel(sync)}</Text>
        <Text numberOfLines={1} style={styles.syncDetailText}>{syncStatusDetail(sync)}</Text>
      </View>
      <MobileButton icon={<Tray color={mobileColors.text} size={14} />} label={mobileText('status.sync.now')} variant="ghost" />
    </View>
  )
}

function syncStatusColor(sync: MobileSyncStatus) {
  if (sync.kind === 'conflict') return mobileColors.danger
  if (sync.kind === 'pullRequired') return mobileColors.orange

  return mobileColors.green
}

function syncStatusDetail(sync: MobileSyncStatus) {
  if (sync.kind === 'conflict') return mobileText('status.sync.resolveConflicts')
  if (sync.kind === 'pullRequired') return mobileText('status.sync.pullAndPush')
  if (sync.minutesAgo) return mobileText('status.sync.minutesAgo').replace('{minutes}', `${sync.minutesAgo}`)

  return mobileText('status.sync.justNow')
}

function syncStatusLabel(sync: MobileSyncStatus) {
  if (sync.kind === 'conflict') return mobileText('status.sync.conflict')
  if (sync.kind === 'pullRequired') return mobileText('status.sync.pullRequired')

  return mobileText('status.sync.synced')
}

const styles = StyleSheet.create({
  syncBar: {
    alignItems: 'center',
    backgroundColor: mobileColors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: mobileColors.border,
    flexDirection: 'row',
    gap: mobileSpace.md,
    justifyContent: 'space-between',
    minHeight: 40,
    paddingHorizontal: mobileSpace.lg,
  },
  syncDetailText: {
    color: mobileColors.textMuted,
    fontSize: mobileType.micro,
  },
  syncStatusGroup: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: mobileSpace.sm,
    minWidth: 0,
  },
  syncStatusText: {
    color: mobileColors.text,
    fontSize: mobileType.body,
    fontWeight: '600',
  },
})
