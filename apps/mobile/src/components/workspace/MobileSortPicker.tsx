import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from '../ui/text'
import { mobileText } from '../../i18n/mobileText'
import { mobileColors, mobileSpace, mobileType } from '../../ui/tokens'

const mobileSortOptions = [
  { label: `${mobileText('noteList.sort.modified')} ${mobileText('noteList.sort.descending')}`, value: 'modified:desc' },
  { label: `${mobileText('noteList.sort.modified')} ${mobileText('noteList.sort.ascending')}`, value: 'modified:asc' },
  { label: `${mobileText('noteList.sort.created')} ${mobileText('noteList.sort.descending')}`, value: 'created:desc' },
  { label: `${mobileText('noteList.sort.created')} ${mobileText('noteList.sort.ascending')}`, value: 'created:asc' },
  { label: `${mobileText('noteList.sort.title')} ${mobileText('noteList.sort.ascending')}`, value: 'title:asc' },
  { label: `${mobileText('noteList.sort.title')} ${mobileText('noteList.sort.descending')}`, value: 'title:desc' },
  { label: `${mobileText('noteList.sort.status')} ${mobileText('noteList.sort.ascending')}`, value: 'status:asc' },
  { label: `${mobileText('noteList.sort.status')} ${mobileText('noteList.sort.descending')}`, value: 'status:desc' },
]

export function MobileSortPicker({
  selectedSort,
  testID = 'workspace-sort-picker',
  testIDPrefix = 'workspace-sort',
  onSelect,
}: {
  selectedSort: string
  testID?: string
  testIDPrefix?: string
  onSelect: (value: string) => void
}) {
  return (
    <View style={styles.section} testID={testID}>
      <Text style={styles.label}>{sortLabel()}</Text>
      {mobileSortOptions.map((option) => (
        <SortRow
          key={option.value}
          label={option.label}
          selected={selectedSort === option.value}
          testIDPrefix={testIDPrefix}
          value={option.value}
          onSelect={onSelect}
        />
      ))}
    </View>
  )
}

function SortRow({
  label,
  onSelect,
  selected,
  testIDPrefix,
  value,
}: {
  label: string
  selected: boolean
  testIDPrefix: string
  value: string
  onSelect: (value: string) => void
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.sortRow,
        selected ? styles.sortRowSelected : null,
        pressed ? styles.pressed : null,
      ]}
      testID={`${testIDPrefix}-${value.replace(/[^a-z0-9]+/gu, '-')}`}
      onPress={() => onSelect(value)}
    >
      <Text style={[styles.rowText, selected ? styles.selectedText : null]}>{label}</Text>
    </Pressable>
  )
}

function sortLabel() {
  return mobileText('noteList.sort.menu').replace(/\s*\{label\}/u, '').trim()
}

const styles = StyleSheet.create({
  label: {
    color: mobileColors.textMuted,
    fontSize: mobileType.caption,
  },
  pressed: {
    backgroundColor: mobileColors.graySoft,
  },
  rowText: {
    flex: 1,
    color: mobileColors.text,
    fontSize: mobileType.body,
  },
  section: {
    gap: mobileSpace.xs,
  },
  selectedText: {
    color: mobileColors.primary,
    fontWeight: '600',
  },
  sortRow: {
    minHeight: 32,
    justifyContent: 'center',
    borderRadius: 6,
    paddingHorizontal: mobileSpace.sm,
  },
  sortRowSelected: {
    backgroundColor: mobileColors.primarySoft,
  },
})
