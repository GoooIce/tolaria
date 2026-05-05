import { StyleSheet } from 'react-native'
import { colors, radii, spacing } from '../theme'

export const vaultManagementStyles = StyleSheet.create({
  vaultManagementAction: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.primarySoft,
  },
  vaultManagementActionText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  vaultManagementCard: {
    gap: spacing.md,
    marginBottom: spacing.lg,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.canvas,
  },
  vaultManagementDetail: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '600',
  },
  vaultManagementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  vaultManagementIcon: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    backgroundColor: colors.primarySoft,
  },
  vaultManagementRemoteLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  vaultManagementRemoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  vaultManagementRemoteText: {
    flex: 1,
  },
  vaultManagementTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  vaultManagementTitleGroup: {
    flex: 1,
  },
})
