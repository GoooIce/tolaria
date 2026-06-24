import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { mobileText } from '../../i18n/mobileText'
import { mobileColors } from '../../ui/tokens'
import { MobileButton } from '../../ui/MobileButton'
import { mobileWorkspaceActionGroupLayoutContract } from './MobileWorkspaceActionSheetModel'

type MoveActionsProps = {
  canMoveDown: boolean
  canMoveUp: boolean
  onMoveDown: () => void
  onMoveUp: () => void
}

type SavedViewActionsProps = MoveActionsProps & {
  onDelete: () => void
}

type TypeSectionActionsProps = MoveActionsProps & {
  canDelete: boolean
  onDelete: () => void
}

type MoveActionLabels = {
  downLabel: string
  downTestID: string
  upLabel: string
  upTestID: string
}

const typeSectionMoveLabels = {
  downLabel: mobileText('sidebar.action.moveSectionDown'),
  downTestID: 'workspace-move-type-down-action',
  upLabel: mobileText('sidebar.action.moveSectionUp'),
  upTestID: 'workspace-move-type-up-action',
}

const savedViewMoveLabels = {
  downLabel: mobileText('sidebar.action.moveViewDown'),
  downTestID: 'workspace-move-view-down-action',
  upLabel: mobileText('sidebar.action.moveViewUp'),
  upTestID: 'workspace-move-view-up-action',
}

const favoriteMoveLabels = {
  downLabel: mobileText('sidebar.action.moveFavoriteDown'),
  downTestID: 'workspace-move-favorite-down-action',
  upLabel: mobileText('sidebar.action.moveFavoriteUp'),
  upTestID: 'workspace-move-favorite-up-action',
}

export const MobileTypeSectionActions = moveActionComponent<TypeSectionActionsProps>(
  typeSectionMoveLabels,
  ({ canDelete, onDelete }) => canDelete ? <DeleteTypeButton onPress={onDelete} /> : null,
)

export const MobileFavoriteActions = moveActionComponent<MoveActionsProps>(
  favoriteMoveLabels,
  () => null,
)

export const MobileSavedViewActions = moveActionComponent<SavedViewActionsProps>(
  savedViewMoveLabels,
  ({ onDelete }) => <DeleteViewButton onPress={onDelete} />,
)

function moveActionComponent<Props extends MoveActionsProps>(
  labels: MoveActionLabels,
  trailingAction: (props: Props) => ReactNode,
) {
  return function ConfiguredMoveActions(props: Props) {
    return <SectionActions {...props} {...labels} trailingAction={trailingAction(props)} />
  }
}

function SectionActions({
  canMoveDown,
  canMoveUp,
  downLabel,
  downTestID,
  onMoveDown,
  onMoveUp,
  trailingAction,
  upLabel,
  upTestID,
}: MoveActionsProps & {
  downLabel: string
  downTestID: string
  trailingAction?: ReactNode
  upLabel: string
  upTestID: string
}) {
  return (
    <View style={styles.actions}>
      <MoveButton disabled={!canMoveUp} label={upLabel} testID={upTestID} onPress={onMoveUp} />
      <MoveButton disabled={!canMoveDown} label={downLabel} testID={downTestID} onPress={onMoveDown} />
      {trailingAction}
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
    <MobileButton
      accessibilityLabel={label}
      disabled={disabled}
      label={label}
      style={styles.actionButton}
      testID={testID}
      variant="secondary"
      onPress={onPress}
    />
  )
}

function DeleteViewButton({ onPress }: { onPress: () => void }) {
  return (
    <DeleteButton
      label={mobileText('sidebar.action.deleteView')}
      testID="workspace-delete-view-action"
      onPress={onPress}
    />
  )
}

function DeleteTypeButton({ onPress }: { onPress: () => void }) {
  return (
    <DeleteButton
      label={mobileText('sidebar.action.deleteType')}
      testID="workspace-delete-type-action"
      onPress={onPress}
    />
  )
}

function DeleteButton({
  label,
  onPress,
  testID,
}: {
  label: string
  onPress: () => void
  testID: string
}) {
  return (
    <MobileButton
      accessibilityLabel={label}
      label={label}
      style={[styles.actionButton, styles.deleteButton]}
      testID={testID}
      tone="danger"
      variant="secondary"
      onPress={onPress}
    />
  )
}

const styles = StyleSheet.create({
  actions: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mobileWorkspaceActionGroupLayoutContract.gap,
  },
  actionButton: {
    borderRadius: mobileWorkspaceActionGroupLayoutContract.radius,
    minHeight: mobileWorkspaceActionGroupLayoutContract.minHeight,
    paddingHorizontal: mobileWorkspaceActionGroupLayoutContract.paddingHorizontal,
    paddingVertical: mobileWorkspaceActionGroupLayoutContract.paddingVertical,
  },
  deleteButton: {
    backgroundColor: mobileColors.dangerSoft,
  },
})
