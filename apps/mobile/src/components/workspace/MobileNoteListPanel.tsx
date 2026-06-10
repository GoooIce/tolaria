import { MagnifyingGlass, Plus } from 'phosphor-react-native'
import { ScrollView, StyleSheet, View } from 'react-native'
import { Text } from '../ui/text'
import { mobileCopy, mobileText } from '../../i18n/mobileText'
import { MobileChip } from '../../ui/MobileChip'
import { MobileIconButton } from '../../ui/MobileIconButton'
import { MobileListRow } from '../../ui/MobileListRow'
import { MobilePanel, MobileToolbar, MobileToolbarSpacer, MobileToolbarTitle } from '../../ui/MobilePanel'
import { mobileColors, mobileRadius, mobileSpace, mobileType } from '../../ui/tokens'
import type { MobileNote } from '../../workspace/mobileWorkspaceModel'
import { MobileTypeIcon } from './MobileWorkspaceIcons'
import { statusTone, tagTone } from './mobileWorkspaceTone'

export function MobileNoteListPanel({
  compact,
  notes,
  onSelectNote,
  searchQuery,
  selectedNoteId,
  subtitle,
}: {
  compact: boolean
  notes: MobileNote[]
  onSelectNote: (noteId: string) => void
  searchQuery?: string
  selectedNoteId: string | null
  subtitle: string
}) {
  return (
    <MobilePanel style={[styles.panel, compact ? styles.panelCompact : null]}>
      <MobileToolbar>
        <View style={styles.toolbarTitleBlock}>
          <MobileToolbarTitle title={mobileCopy.inbox} />
          <Text style={styles.toolbarSubtitle}>{subtitle}</Text>
        </View>
        <MobileToolbarSpacer />
        <MobileIconButton accessibilityLabel={mobileCopy.searchNotes}>
          <MagnifyingGlass color={mobileColors.textMuted} size={20} />
        </MobileIconButton>
        <MobileIconButton accessibilityLabel={mobileCopy.createNote}>
          <Plus color={mobileColors.textMuted} size={20} />
        </MobileIconButton>
      </MobileToolbar>
      {searchQuery ? <SearchPill searchQuery={searchQuery} /> : null}
      {notes.length === 0 ? (
        <NoteListEmptyState />
      ) : (
        <ScrollView>
          {notes.map((note) => (
            <MobileListRow
              chips={<NoteRowChips note={note} />}
              key={note.id}
              leading={<NoteTypeDot note={note} />}
              selected={note.id === selectedNoteId}
              subtitle={note.snippet}
              title={note.title}
              trailing={<MobileTypeIcon size={16} tone={note.typeTone} type={note.type} />}
              onPress={() => onSelectNote(note.id)}
            />
          ))}
        </ScrollView>
      )}
    </MobilePanel>
  )
}

function SearchPill({ searchQuery }: { searchQuery: string }) {
  return (
    <View style={styles.searchPill}>
      <MagnifyingGlass color={mobileColors.textMuted} size={16} />
      <Text numberOfLines={1} style={styles.searchText}>{searchQuery}</Text>
    </View>
  )
}

function NoteListEmptyState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{mobileText('noteList.empty.allOrganized')}</Text>
      <Text style={styles.emptyText}>{mobileText('noteList.empty.noNotes')}</Text>
    </View>
  )
}

function NoteRowChips({ note }: { note: MobileNote }) {
  return (
    <View style={styles.chipRow}>
      <MobileChip label={note.type} tone={note.typeTone} />
      <MobileChip label={note.status} tone={statusTone(note.status)} />
      {note.tags.slice(0, 1).map((tag) => <MobileChip key={tag} label={tag} tone={tagTone(tag)} />)}
    </View>
  )
}

function NoteTypeDot({ note }: { note: MobileNote }) {
  return <View style={[styles.typeDot, noteTypeDotStyles[note.typeTone]]} />
}

const noteTypeDotStyles = StyleSheet.create({
  green: {
    backgroundColor: mobileColors.green,
  },
  orange: {
    backgroundColor: mobileColors.orange,
  },
  purple: {
    backgroundColor: mobileColors.purple,
  },
})

const styles = StyleSheet.create({
  chipRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mobileSpace.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: mobileSpace.xl,
  },
  emptyText: {
    marginTop: mobileSpace.sm,
    color: mobileColors.textMuted,
    fontSize: mobileType.body,
    textAlign: 'center',
  },
  emptyTitle: {
    color: mobileColors.text,
    fontSize: mobileType.title,
    fontWeight: '600',
    textAlign: 'center',
  },
  panel: {
    borderRightWidth: StyleSheet.hairlineWidth,
    width: 340,
  },
  panelCompact: {
    width: 336,
  },
  searchPill: {
    minHeight: 36,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.sm,
    borderBottomColor: mobileColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: mobileSpace.lg,
  },
  searchText: {
    flex: 1,
    color: mobileColors.text,
    fontSize: mobileType.body,
    fontWeight: '500',
  },
  toolbarSubtitle: {
    color: mobileColors.textMuted,
    fontSize: mobileType.caption,
    fontWeight: '500',
  },
  toolbarTitleBlock: {
    minWidth: 0,
  },
  typeDot: {
    borderRadius: mobileRadius.pill,
    height: 8,
    width: 8,
  },
})
