import { useState, type ReactNode } from 'react'
import {
  Archive,
  CaretLeft,
  CaretRight,
  DotsThree,
  FileText,
  FolderOpen,
  Info,
  List,
  MagnifyingGlass,
} from 'phosphor-react-native'
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'
import { Button } from '../components/ui/button'
import { Text } from '../components/ui/text'
import { cn } from '../components/ui/utils'
import { MobileTypeIcon } from '../components/workspace/MobileWorkspaceIcons'
import { mobileCopy, mobileText } from '../i18n/mobileText'
import { mobileColors, mobileRadius, mobileSpace, mobileType } from '../ui/tokens'
import type { MobileNote, MobileSidebarSection, MobileWorkspaceSnapshot } from '../workspace/mobileWorkspaceModel'

export type PhoneWorkspaceState = 'editor' | 'list' | 'sidebar'

export function PhoneWorkspaceMock({
  initialState = 'list',
  snapshot,
}: {
  initialState?: PhoneWorkspaceState
  snapshot: MobileWorkspaceSnapshot
}) {
  const [phoneState, setPhoneState] = useState(initialState)
  const selectedNote = snapshot.notes.find((note) => note.id === snapshot.selectedNoteId) ?? snapshot.notes[0] ?? null

  if (phoneState === 'sidebar') {
    return <PhoneSidebarDrawer snapshot={snapshot} onClose={() => setPhoneState('list')} onOpenEditor={() => setPhoneState('editor')} />
  }

  if (phoneState === 'editor' && selectedNote) {
    return <PhoneEditor note={selectedNote} bullets={snapshot.editorBullets} onBack={() => setPhoneState('list')} />
  }

  return <PhoneNoteList notes={snapshot.notes} onOpenEditor={() => setPhoneState('editor')} onOpenSidebar={() => setPhoneState('sidebar')} />
}

function PhoneNoteList({
  notes,
  onOpenEditor,
  onOpenSidebar,
}: {
  notes: MobileNote[]
  onOpenEditor: () => void
  onOpenSidebar: () => void
}) {
  return (
    <View style={phoneStyles.screen}>
      <PhoneListHeader onOpenSidebar={onOpenSidebar} />
      <ScrollView contentContainerStyle={phoneStyles.listContent}>
        {notes.map((note) => <PhoneNoteRow key={note.id} note={note} onPress={onOpenEditor} />)}
      </ScrollView>
    </View>
  )
}

function PhoneListHeader({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  return (
    <View style={phoneStyles.header}>
      <CircleButton accessibilityLabel={mobileText('sidebar.action.expand')} onPress={onOpenSidebar}>
        <List color={mobileColors.textMuted} size={30} />
      </CircleButton>
      <View style={phoneStyles.headerTitleGroup}>
        <Text style={phoneStyles.headerTitle}>{mobileCopy.inbox}</Text>
      </View>
      <CircleButton accessibilityLabel={mobileCopy.searchNotes}>
        <MagnifyingGlass color={mobileColors.textMuted} size={30} />
      </CircleButton>
    </View>
  )
}

function PhoneNoteRow({
  note,
  onPress,
}: {
  note: MobileNote
  onPress: () => void
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [phoneStyles.noteRow, pressed ? phoneStyles.pressed : null]}>
      <View style={phoneStyles.noteTitleRow}>
        <MobileTypeIcon size={20} tone={note.typeTone} type={note.type} />
        <Text numberOfLines={2} style={phoneStyles.noteTitle}>{note.title}</Text>
      </View>
      <Text numberOfLines={2} style={phoneStyles.noteSnippet}>{note.snippet}</Text>
      <Text style={phoneStyles.noteDate}>{note.modified}</Text>
    </Pressable>
  )
}

function PhoneSidebarDrawer({
  onClose,
  onOpenEditor,
  snapshot,
}: {
  onClose: () => void
  onOpenEditor: () => void
  snapshot: MobileWorkspaceSnapshot
}) {
  const { width } = useWindowDimensions()
  const drawerWidth = Math.min(310, Math.round(width * 0.76))

  return (
    <View style={phoneStyles.drawerRoot}>
      <View style={[phoneStyles.drawerPreview, { left: drawerWidth, width }]}>
        <PhoneNoteList notes={snapshot.notes} onOpenEditor={onOpenEditor} onOpenSidebar={onClose} />
      </View>
      <View style={[phoneStyles.drawerPanel, { width: drawerWidth }]}>
        <CircleButton accessibilityLabel={mobileText('command.group.note')} dark>
          <DotsThree color={phoneColors.drawerMuted} size={24} weight="bold" />
        </CircleButton>
        <View style={phoneStyles.drawerNav}>
          <PhoneSidebarItem active icon={<FileText color={phoneColors.drawerActiveText} size={18} />} label={mobileCopy.inbox} />
          <PhoneSidebarItem icon={<Archive color={phoneColors.drawerMuted} size={18} />} label={mobileCopy.archive} />
          {snapshot.sidebarSections.map((section) => (
            <PhoneSidebarSection key={section.id} section={section} />
          ))}
        </View>
      </View>
    </View>
  )
}

function PhoneSidebarSection({ section }: { section: MobileSidebarSection }) {
  if (section.id !== 'folders') return null

  return (
    <View style={phoneStyles.drawerSection}>
      {section.folders?.map((folder) => (
        <PhoneSidebarItem
          key={folder.id}
          icon={folder.active ? <FolderOpen color={phoneColors.drawerActiveText} size={18} weight="fill" /> : <FolderOpen color={phoneColors.drawerMuted} size={18} />}
          label={folder.name}
          trailing={folder.children.length > 0 ? <CaretRight color={phoneColors.drawerMuted} size={16} /> : null}
        />
      ))}
    </View>
  )
}

function PhoneSidebarItem({
  active = false,
  icon,
  label,
  trailing,
}: {
  active?: boolean
  icon: ReactNode
  label: string
  trailing?: ReactNode
}) {
  return (
    <View style={[phoneStyles.drawerItem, active ? phoneStyles.drawerItemActive : null]}>
      {icon}
      <Text numberOfLines={1} style={[phoneStyles.drawerItemText, active ? phoneStyles.drawerItemTextActive : null]}>{label}</Text>
      {trailing}
    </View>
  )
}

function PhoneEditor({
  bullets,
  note,
  onBack,
}: {
  bullets: string[]
  note: MobileNote
  onBack: () => void
}) {
  return (
    <View style={phoneStyles.screen}>
      <View style={phoneStyles.editorHeader}>
        <CircleButton accessibilityLabel="Back" onPress={onBack}>
          <CaretLeft color={mobileColors.textMuted} size={32} />
        </CircleButton>
        <View style={phoneStyles.editorActions}>
          <Info color={mobileColors.textMuted} size={26} />
          <DotsThree color={mobileColors.textMuted} size={26} weight="bold" />
        </View>
      </View>
      <ScrollView contentContainerStyle={phoneStyles.editorContent}>
        <View style={phoneStyles.editorTitleBlock}>
          <Text style={phoneStyles.editorTitle}>{note.title}</Text>
        </View>
        {bullets.map((item) => (
          <View key={item} style={phoneStyles.editorBulletRow}>
            <Text style={phoneStyles.editorBullet}>•</Text>
            <Text style={phoneStyles.editorText}>{item}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

function CircleButton({
  accessibilityLabel,
  children,
  dark = false,
  onPress,
}: {
  accessibilityLabel: string
  children: ReactNode
  dark?: boolean
  onPress?: () => void
}) {
  return (
    <Button
      accessibilityLabel={accessibilityLabel}
      className={cn(
        'h-[52px] w-[52px] rounded-full bg-white p-0 shadow-md shadow-black/10 active:opacity-75 [&_svg]:!h-[24px] [&_svg]:!w-[24px]',
        dark ? 'border border-[#E9E9E7] bg-white shadow-none' : null,
      )}
      onPress={onPress}
      size="icon"
      style={phoneStyles.circleButtonShadow}
      variant="ghost"
    >
      {children}
    </Button>
  )
}

const phoneColors = {
  drawer: mobileColors.sidebar,
  drawerActiveText: mobileColors.primary,
  drawerCard: mobileColors.selected,
  drawerMuted: mobileColors.textMuted,
  drawerText: mobileColors.text,
}

const sharedPhoneStyles = StyleSheet.create({
  circleButtonShadow: {
    shadowColor: '#000000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  pressed: {
    opacity: 0.72,
  },
  screen: {
    flex: 1,
    backgroundColor: mobileColors.app,
  },
})

const drawerPhoneStyles = StyleSheet.create({
  drawerItem: {
    minHeight: 42,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.md,
    borderRadius: mobileRadius.md,
    paddingHorizontal: mobileSpace.md,
  },
  drawerItemActive: {
    backgroundColor: phoneColors.drawerCard,
  },
  drawerItemText: {
    flex: 1,
    color: phoneColors.drawerMuted,
    fontSize: 15,
    fontWeight: '500',
  },
  drawerItemTextActive: {
    color: phoneColors.drawerActiveText,
    fontWeight: '600',
  },
  drawerNav: {
    marginTop: mobileSpace.xl,
    gap: mobileSpace.sm,
  },
  drawerPanel: {
    flex: 1,
    backgroundColor: phoneColors.drawer,
    borderRightColor: mobileColors.border,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: mobileSpace.lg,
    paddingTop: 52,
  },
  drawerPreview: {
    bottom: 0,
    position: 'absolute',
    top: 0,
  },
  drawerRoot: {
    flex: 1,
    backgroundColor: phoneColors.drawer,
    overflow: 'hidden',
  },
  drawerSection: {
    marginTop: mobileSpace.md,
    gap: mobileSpace.xs,
  },
})

const editorPhoneStyles = StyleSheet.create({
  editorActions: {
    minWidth: 104,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: mobileSpace.lg,
    borderRadius: mobileRadius.pill,
    backgroundColor: mobileColors.card,
    shadowColor: '#000000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  editorBullet: {
    color: mobileColors.primary,
    fontSize: 24,
    lineHeight: 23,
    minWidth: 24,
  },
  editorBulletRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: mobileSpace.sm,
  },
  editorContent: {
    paddingHorizontal: mobileSpace.xl,
    paddingBottom: 56,
  },
  editorHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: mobileSpace.xl,
    paddingTop: 44,
    paddingBottom: mobileSpace.xl,
  },
  editorText: {
    flex: 1,
    color: mobileColors.text,
    fontSize: 15,
    lineHeight: 23,
  },
  editorTitle: {
    color: mobileColors.text,
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
  },
  editorTitleBlock: {
    borderBottomColor: mobileColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: mobileSpace.xl,
    paddingBottom: mobileSpace.lg,
  },
})

const listPhoneStyles = StyleSheet.create({
  header: {
    minHeight: 96,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: mobileSpace.xl,
    paddingTop: 36,
  },
  headerTitle: {
    color: mobileColors.text,
    fontSize: mobileType.bodyLarge,
    fontWeight: '600',
  },
  headerTitleGroup: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: mobileSpace.xl,
    paddingBottom: 56,
  },
  noteDate: {
    color: mobileColors.textMuted,
    fontSize: mobileType.caption,
    marginTop: mobileSpace.lg,
  },
  noteRow: {
    borderBottomColor: mobileColors.borderStrong,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: mobileSpace.lg,
  },
  noteSnippet: {
    color: mobileColors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: mobileSpace.sm,
  },
  noteTitle: {
    flex: 1,
    color: mobileColors.text,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  noteTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.sm,
  },
})

const phoneStyles = {
  ...sharedPhoneStyles,
  ...drawerPhoneStyles,
  ...editorPhoneStyles,
  ...listPhoneStyles,
}
