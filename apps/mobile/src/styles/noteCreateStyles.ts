import { StyleSheet } from 'react-native'
import { colors, spacing } from '../theme'

export const noteCreateStyles = StyleSheet.create({
  composeButtonDisabled: {
    opacity: 0.55,
  },
  createNoteAction: {
    minWidth: 82,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primarySoft,
  },
  createNoteActionDisabled: {
    opacity: 0.55,
  },
  createNoteActionPrimary: {
    backgroundColor: colors.primary,
  },
  createNoteActionText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  createNoteActionTextPrimary: {
    color: colors.canvas,
  },
  createNoteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  createNoteError: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: '600',
  },
  createNoteInput: {
    minHeight: 44,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    color: colors.text,
    backgroundColor: colors.canvas,
    fontSize: 16,
    fontWeight: '600',
  },
  createNotePrompt: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl + 76,
    width: 280,
    gap: spacing.sm,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    padding: spacing.md,
    backgroundColor: colors.canvas,
  },
})
