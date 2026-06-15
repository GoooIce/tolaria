import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from '../ui/text'
import { mobileText } from '../../i18n/mobileText'
import { mobileColors, mobileSpace, mobileType } from '../../ui/tokens'

type MoveActionsProps = {
  canMoveDown: boolean
  canMoveUp: boolean
  onMoveDown: () => void
  onMoveUp: () => void
}

type SavedViewActionsProps = MoveActionsProps & {
  onDelete: () => void
}

export function MobileTypeSectionActions(props: MoveActionsProps) {
  return (
    <MoveActions
      {...props}
      downLabel={mobileText('sidebar.action.moveSectionDown')}
      downTestID="workspace-move-type-down-action"
      upLabel={mobileText('sidebar.action.moveSectionUp')}
      upTestID="workspace-move-type-up-action"
    />
  )
}

export function MobileSavedViewActions({ onDelete, ...props }: SavedViewActionsProps) {
  return (
    <View style={styles.actions}>
      <MoveActions
        {...props}
        downLabel={mobileText('sidebar.action.moveViewDown')}
        downTestID="workspace-move-view-down-action"
        upLabel={mobileText('sidebar.action.moveViewUp')}
        upTestID="workspace-move-view-up-action"
      />
      <DeleteViewButton onPress={onDelete} />
    </View>
  )
}

function MoveActions({
  canMoveDown,
  canMoveUp,
  downLabel,
  downTestID,
  onMoveDown,
  onMoveUp,
  upLabel,
  upTestID,
}: MoveActionsProps & {
  downLabel: string
  downTestID: string
  upLabel: string
  upTestID: string
}) {
  return (
    <View style={styles.actions}>
      <MoveButton disabled={!canMoveUp} label={upLabel} testID={upTestID} onPress={onMoveUp} />
      <MoveButton disabled={!canMoveDown} label={downLabel} testID={downTestID} onPress={onMoveDown} />
    </View>
  )
}

function MoveButton({
  disabled,
  label,
  onPress,
  testID,
}: {
  disabled: boolean
  label: string
  onPress: () => void
  testID: string
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        disabled ? styles.disabledButton : null,
        pressed && !disabled ? styles.pressedButton : null,
      ]}
      testID={testID}
      onPress={() => {
        if (!disabled) onPress()
      }}
    >
      <Text style={[styles.buttonText, disabled ? styles.disabledText : null]}>{label}</Text>
    </Pressable>
  )
}

function DeleteViewButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel={mobileText('sidebar.action.deleteView')}
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, pressed ? styles.pressedButton : null]}
      testID="workspace-delete-view-action"
      onPress={onPress}
    >
      <Text style={styles.deleteText}>{mobileText('sidebar.action.deleteView')}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: mobileSpace.xs,
    marginRight: 'auto',
  },
  button: {
    borderRadius: 6,
    paddingHorizontal: mobileSpace.sm,
    paddingVertical: mobileSpace.xs,
  },
  buttonText: {
    color: mobileColors.textMuted,
    fontSize: mobileType.body,
    fontWeight: '500',
  },
  deleteText: {
    color: mobileColors.red,
    fontSize: mobileType.body,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.45,
  },
  disabledText: {
    color: mobileColors.textFaint,
  },
  pressedButton: {
    backgroundColor: mobileColors.graySoft,
  },
})
