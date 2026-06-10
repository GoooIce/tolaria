import type { ReactNode } from 'react'
import {
  Archive,
  CaretDown,
  CaretRight,
  FileText,
  Folder,
  FolderOpen,
  SidebarSimple,
  StackSimple,
  Star,
  Tag,
  Tray,
} from 'phosphor-react-native'
import { ScrollView, StyleSheet, View } from 'react-native'
import { Text } from '../ui/text'
import { mobileCopy, mobileText } from '../../i18n/mobileText'
import { MobileIconButton } from '../../ui/MobileIconButton'
import { MobilePanel, MobileToolbar } from '../../ui/MobilePanel'
import { mobileColors, mobileRadius, mobileSpace, mobileType } from '../../ui/tokens'
import type {
  MobileNote,
  MobileSidebarFolder,
  MobileSidebarIcon,
  MobileSidebarSection,
} from '../../workspace/mobileWorkspaceModel'

export function MobileWorkspaceSidebar({
  sections,
  title = 'Tolaria Vault',
}: {
  sections: MobileSidebarSection[]
  title?: string
}) {
  return (
    <MobilePanel style={styles.panel}>
      <MobileToolbar>
        <MobileIconButton accessibilityLabel={mobileText('sidebar.action.collapse')}>
          <SidebarSimple color={mobileColors.textMuted} size={20} />
        </MobileIconButton>
        <Text numberOfLines={1} style={styles.vaultTitle}>{title}</Text>
      </MobileToolbar>
      <ScrollView contentContainerStyle={styles.content}>
        {sections.map((section) => (
          <View key={section.id}>
            {section.label ? <SectionTitle count={section.count} label={sidebarSectionLabel(section.id, section.label)} /> : null}
            {section.items?.map((item) => (
              <SidebarItem
                active={item.active}
                count={item.count}
                icon={sidebarIcon(item.icon, item.active ? 'primary' : item.tone)}
                key={item.id}
                label={sidebarLabel(item.id, item.label)}
              />
            ))}
            {section.folders ? <FolderTree folders={section.folders} /> : null}
          </View>
        ))}
      </ScrollView>
    </MobilePanel>
  )
}

function SidebarItem({
  active = false,
  count,
  icon,
  label,
}: {
  active?: boolean
  count?: string
  icon: ReactNode
  label: string
}) {
  return (
    <View style={[styles.item, active ? styles.itemActive : null]}>
      {icon}
      <Text numberOfLines={1} style={[styles.itemText, active ? styles.itemTextActive : null]}>{label}</Text>
      {count ? <Text style={[styles.count, active ? styles.countActive : null]}>{count}</Text> : null}
    </View>
  )
}

function SectionTitle({
  count,
  label,
}: {
  count?: string
  label: string
}) {
  return (
    <View style={styles.sectionTitleRow}>
      <CaretDown color={mobileColors.textMuted} size={11} />
      <Text style={styles.sectionTitle}>{label}</Text>
      {count ? <Text style={styles.sectionCount}>{count}</Text> : null}
    </View>
  )
}

function FolderTree({ folders }: { folders: MobileSidebarFolder[] }) {
  return (
    <View style={folderTreeStyles.tree}>
      {folders.map((folder) => <FolderTreeRow depth={0} folder={folder} key={folder.id} />)}
    </View>
  )
}

function FolderTreeRow({
  depth,
  folder,
}: {
  depth: number
  folder: MobileSidebarFolder
}) {
  const hasChildren = folder.children.length > 0

  return (
    <View>
      <View style={[folderTreeStyles.row, folder.active ? folderTreeStyles.rowActive : null, folderTreeIndent(depth)]}>
        <FolderTreeCaret expanded={folder.expanded} hasChildren={hasChildren} />
        <FolderTreeIcon active={folder.active} expanded={folder.expanded} />
        <Text numberOfLines={1} style={[folderTreeStyles.rowText, folder.active ? folderTreeStyles.rowTextActive : null]}>{folder.name}</Text>
      </View>
      {folder.expanded && hasChildren ? (
        <View style={folderTreeStyles.children}>
          {folder.children.map((child) => <FolderTreeRow depth={depth + 1} folder={child} key={child.id} />)}
        </View>
      ) : null}
    </View>
  )
}

function FolderTreeCaret({
  expanded,
  hasChildren,
}: {
  expanded?: boolean
  hasChildren: boolean
}) {
  if (!hasChildren) {
    return <View style={folderTreeStyles.caretSpacer} />
  }

  return expanded ? <CaretDown color={mobileColors.textMuted} size={11} /> : <CaretRight color={mobileColors.textMuted} size={11} />
}

function FolderTreeIcon({
  active,
  expanded,
}: {
  active?: boolean
  expanded?: boolean
}) {
  const iconColor = active ? mobileColors.primary : mobileColors.textMuted

  if (active || expanded) {
    return <FolderOpen color={iconColor} size={16} weight={active ? 'fill' : 'regular'} />
  }

  return <Folder color={iconColor} size={16} />
}

function folderTreeIndent(depth: number) {
  return { paddingLeft: mobileSpace.md + depth * 16 }
}

function sidebarIcon(icon: MobileSidebarIcon, tone?: MobileNote['typeTone'] | 'primary') {
  const color = sidebarIconColor(tone)

  if (icon === 'archive') return <Archive color={color} size={15} />
  if (icon === 'folder') return <FolderOpen color={color} size={15} />
  if (icon === 'inbox') return <Tray color={color} size={15} />
  if (icon === 'procedure') return <StackSimple color={color} size={15} />
  if (icon === 'star') return <Star color={color} size={15} />
  if (icon === 'tag') return <Tag color={color} size={15} />

  return <FileText color={color} size={15} />
}

function sidebarIconColor(tone?: MobileNote['typeTone'] | 'primary') {
  if (tone === 'primary') return mobileColors.primary
  if (tone === 'green') return mobileColors.green
  if (tone === 'orange') return mobileColors.orange
  if (tone === 'purple') return mobileColors.purple

  return mobileColors.textMuted
}

function sidebarLabel(id: string, fallback: string) {
  if (id === 'all-notes') return mobileCopy.allNotes
  if (id === 'archive') return mobileCopy.archive
  if (id === 'inbox') return mobileCopy.inbox

  return fallback
}

function sidebarSectionLabel(id: string, fallback: string) {
  if (id === 'folders') return mobileText('sidebar.group.folders')
  if (id === 'favorites') return mobileCopy.favorites
  if (id === 'types') return mobileCopy.types

  return fallback
}

const styles = StyleSheet.create({
  content: {
    padding: mobileSpace.sm,
  },
  count: {
    minWidth: 22,
    height: 18,
    overflow: 'hidden',
    borderRadius: mobileRadius.pill,
    backgroundColor: mobileColors.graySoft,
    color: mobileColors.textMuted,
    fontSize: mobileType.micro,
    fontWeight: '400',
    paddingHorizontal: 6,
    textAlign: 'center',
  },
  countActive: {
    backgroundColor: mobileColors.primary,
    color: mobileColors.textInverse,
  },
  item: {
    minHeight: 34,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.sm,
    borderRadius: mobileRadius.md,
    paddingHorizontal: mobileSpace.md,
  },
  itemActive: {
    backgroundColor: mobileColors.selected,
  },
  itemText: {
    flex: 1,
    color: mobileColors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  itemTextActive: {
    color: mobileColors.primary,
    fontWeight: '600',
  },
  panel: {
    width: 260,
    backgroundColor: mobileColors.sidebar,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  sectionCount: {
    color: mobileColors.textMuted,
    fontSize: mobileType.micro,
    fontWeight: '400',
  },
  sectionTitle: {
    flex: 1,
    color: mobileColors.textMuted,
    fontSize: mobileType.micro,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sectionTitleRow: {
    minHeight: 32,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.xs,
    marginTop: mobileSpace.md,
    paddingHorizontal: mobileSpace.sm,
  },
  vaultTitle: {
    flex: 1,
    color: mobileColors.text,
    fontSize: mobileType.body,
    fontWeight: '600',
  },
})

const folderTreeStyles = StyleSheet.create({
  caretSpacer: {
    width: 11,
  },
  children: {
    position: 'relative',
  },
  row: {
    minHeight: 32,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.sm,
    borderRadius: mobileRadius.sm,
    paddingRight: mobileSpace.md,
  },
  rowActive: {
    backgroundColor: mobileColors.selected,
  },
  rowText: {
    flex: 1,
    color: mobileColors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  rowTextActive: {
    color: mobileColors.primary,
    fontWeight: '600',
  },
  tree: {
    gap: mobileSpace.xs,
    paddingBottom: mobileSpace.sm,
  },
})
