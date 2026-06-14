import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from '../ui/text'
import { mobileColors, mobileSpace, mobileType } from '../../ui/tokens'

export function MobileWorkspaceSuggestionList({
  labels,
  onSelect,
  testID,
  testIDPrefix,
}: {
  labels: string[]
  onSelect: (value: string) => void
  testID: string
  testIDPrefix: string
}) {
  if (labels.length === 0) return null

  return (
    <View style={styles.list} testID={testID}>
      {labels.map((label) => (
        <Pressable
          accessibilityLabel={humanizeSuggestionLabel(label)}
          accessibilityRole="button"
          key={label}
          style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
          testID={`${testIDPrefix}-${testIdSegment(label)}`}
          onPress={() => onSelect(label)}
        >
          <Text numberOfLines={1} style={styles.title}>{humanizeSuggestionLabel(label)}</Text>
          <Text numberOfLines={1} style={styles.meta}>{label}</Text>
        </Pressable>
      ))}
    </View>
  )
}

function humanizeSuggestionLabel(label: string) {
  return label
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function testIdSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const styles = StyleSheet.create({
  list: {
    gap: mobileSpace.xs,
  },
  meta: {
    maxWidth: 160,
    color: mobileColors.textMuted,
    fontSize: mobileType.caption,
  },
  row: {
    minHeight: 34,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.sm,
    borderRadius: 6,
    paddingHorizontal: mobileSpace.sm,
    paddingVertical: mobileSpace.xs,
  },
  rowPressed: {
    backgroundColor: mobileColors.graySoft,
  },
  title: {
    minWidth: 0,
    flex: 1,
    color: mobileColors.text,
    fontSize: mobileType.body,
    fontWeight: '500',
  },
})
