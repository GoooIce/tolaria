import {
  Code,
  CodeBlock,
  LinkSimple,
  ListBullets,
  ListChecks,
  ListNumbers,
  Minus,
  Quotes,
  Table,
  TextB,
  TextHThree,
  TextHTwo,
  TextItalic,
  TextStrikethrough,
} from 'phosphor-react-native'
import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { mobileText } from '../../i18n/mobileText'
import { MobileIconButton } from '../../ui/MobileIconButton'
import { desktopToolbarActionParity } from '../../ui/desktopParity'
import { mobileColors, mobileSpace } from '../../ui/tokens'
import type { MobileMarkdownFormatAction } from '../../workspace/mobileMarkdownFormatting'

type FormattingCommand = {
  action: MobileMarkdownFormatAction
  icon: (color: string) => ReactNode
  label: string
  testID: string
}

const formattingCommands: FormattingCommand[] = [
  {
    action: 'bold',
    icon: (color) => <TextB color={color} size={desktopToolbarActionParity.iconSize} />,
    label: mobileText('editor.formatting.bold'),
    testID: 'editor-format-bold',
  },
  {
    action: 'italic',
    icon: (color) => <TextItalic color={color} size={desktopToolbarActionParity.iconSize} />,
    label: mobileText('editor.formatting.italic'),
    testID: 'editor-format-italic',
  },
  {
    action: 'strike',
    icon: (color) => <TextStrikethrough color={color} size={desktopToolbarActionParity.iconSize} />,
    label: mobileText('editor.formatting.strikethrough'),
    testID: 'editor-format-strike',
  },
  {
    action: 'code',
    icon: (color) => <Code color={color} size={desktopToolbarActionParity.iconSize} />,
    label: mobileText('editor.formatting.code'),
    testID: 'editor-format-code',
  },
  {
    action: 'highlight',
    icon: (color) => <TextB color={color} size={desktopToolbarActionParity.iconSize} weight="fill" />,
    label: mobileText('editor.formatting.highlight'),
    testID: 'editor-format-highlight',
  },
  {
    action: 'wikilink',
    icon: (color) => <LinkSimple color={color} size={desktopToolbarActionParity.iconSize} />,
    label: mobileText('editor.formatting.wikilink'),
    testID: 'editor-format-wikilink',
  },
  {
    action: 'heading2',
    icon: (color) => <TextHTwo color={color} size={desktopToolbarActionParity.iconSize} />,
    label: mobileText('editor.formatting.heading2'),
    testID: 'editor-format-heading-2',
  },
  {
    action: 'heading3',
    icon: (color) => <TextHThree color={color} size={desktopToolbarActionParity.iconSize} />,
    label: mobileText('editor.formatting.heading3'),
    testID: 'editor-format-heading-3',
  },
  {
    action: 'bulletList',
    icon: (color) => <ListBullets color={color} size={desktopToolbarActionParity.iconSize} />,
    label: mobileText('editor.formatting.bulletList'),
    testID: 'editor-format-bullet-list',
  },
  {
    action: 'orderedList',
    icon: (color) => <ListNumbers color={color} size={desktopToolbarActionParity.iconSize} />,
    label: mobileText('editor.formatting.orderedList'),
    testID: 'editor-format-ordered-list',
  },
  {
    action: 'taskList',
    icon: (color) => <ListChecks color={color} size={desktopToolbarActionParity.iconSize} />,
    label: mobileText('editor.formatting.taskList'),
    testID: 'editor-format-task-list',
  },
  {
    action: 'quote',
    icon: (color) => <Quotes color={color} size={desktopToolbarActionParity.iconSize} />,
    label: mobileText('editor.formatting.quote'),
    testID: 'editor-format-quote',
  },
  {
    action: 'divider',
    icon: (color) => <Minus color={color} size={desktopToolbarActionParity.iconSize} />,
    label: mobileText('editor.formatting.divider'),
    testID: 'editor-format-divider',
  },
  {
    action: 'codeBlock',
    icon: (color) => <CodeBlock color={color} size={desktopToolbarActionParity.iconSize} />,
    label: mobileText('editor.formatting.codeBlock'),
    testID: 'editor-format-code-block',
  },
  {
    action: 'table',
    icon: (color) => <Table color={color} size={desktopToolbarActionParity.iconSize} />,
    label: mobileText('editor.formatting.table'),
    testID: 'editor-format-table',
  },
]

export function MobileMarkdownFormattingToolbar({
  actions,
  onFormat,
}: {
  actions?: readonly MobileMarkdownFormatAction[]
  onFormat: (action: MobileMarkdownFormatAction) => void
}) {
  const visibleActions = new Set(actions ?? formattingCommands.map((command) => command.action))

  return (
    <View
      accessibilityLabel={mobileText('editor.formatting.toolbar')}
      style={styles.toolbar}
      testID="editor-formatting-toolbar"
    >
      {formattingCommands.filter((command) => visibleActions.has(command.action)).map((command) => (
        <MobileIconButton
          accessibilityLabel={command.label}
          key={command.action}
          testID={command.testID}
          onPress={() => onFormat(command.action)}
        >
          {command.icon(mobileColors.textMuted)}
        </MobileIconButton>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mobileSpace.xs,
    paddingBottom: mobileSpace.xs,
  },
})
