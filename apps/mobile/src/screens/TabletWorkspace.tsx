import { useState } from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import { MobileNoteListPanel } from '../components/workspace/MobileNoteListPanel'
import { MobilePropertiesPanel } from '../components/workspace/MobilePropertiesPanel'
import { MobileSyncStatusBar } from '../components/workspace/MobileSyncStatusBar'
import { MobileWorkspaceSidebar } from '../components/workspace/MobileWorkspaceSidebar'
import type { MobileWorkspaceSnapshot } from '../workspace/mobileWorkspaceModel'
import { mobileColors } from '../ui/tokens'
import { TabletEditorPanel } from './TabletEditorPanel'

export function TabletWorkspace({
  snapshot,
}: {
  snapshot: MobileWorkspaceSnapshot
}) {
  const { width } = useWindowDimensions()
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(snapshot.selectedNoteId ?? snapshot.notes[0]?.id ?? null)
  const selectedNote = snapshot.notes.find((note) => note.id === selectedNoteId) ?? snapshot.notes[0] ?? null
  const compactTablet = width < 1180

  return (
    <View style={styles.shellRoot}>
      <View style={styles.shell}>
        {compactTablet ? null : <MobileWorkspaceSidebar sections={snapshot.sidebarSections} />}
        <MobileNoteListPanel
          compact={compactTablet}
          notes={snapshot.notes}
          searchQuery={snapshot.searchQuery}
          selectedNoteId={selectedNoteId}
          subtitle={snapshot.noteListSubtitle}
          onSelectNote={setSelectedNoteId}
        />
        <TabletEditorPanel blocks={snapshot.editorBlocks} compact={compactTablet} note={selectedNote} bullets={snapshot.editorBullets} />
        <MobilePropertiesPanel compact={compactTablet} note={selectedNote} />
      </View>
      <MobileSyncStatusBar sync={snapshot.sync} />
    </View>
  )
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: mobileColors.app,
  },
  shellRoot: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: mobileColors.app,
  },
})
