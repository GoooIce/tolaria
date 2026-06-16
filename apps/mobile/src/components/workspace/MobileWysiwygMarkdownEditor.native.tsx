import { RichText, TenTapStartKit, useEditorBridge, type EditorBridge } from '@10play/tentap-editor'
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native'
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import {
  mobileDocumentBody,
  mobileDocumentWithBody,
  mobileMarkdownBodyToTentapHtml,
  mobileNoteEditableContent,
  tiptapJsonToMobileMarkdown,
} from '../../workspace/mobileDocumentContent'
import type { MobileMarkdownFormatAction } from '../../workspace/mobileMarkdownFormatting'
import type { MobileEditorBlock, MobileNote } from '../../workspace/mobileWorkspaceModel'
import { mobileColors, mobileSpace } from '../../ui/tokens'
import { MobileMarkdownFormattingToolbar } from './MobileMarkdownFormattingToolbar'
import { mobileTentapEditorCss } from './MobileWysiwygMarkdownEditorCss'

type MobileWysiwygMarkdownEditorProps = {
  blocks: MobileEditorBlock[]
  bullets: string[]
  compact: boolean
  note: MobileNote
  notes: MobileNote[]
  onUpdateContent: (noteId: string, content: string) => void
}

type JsonReadableEditorBridge = EditorBridge & {
  getJSON: () => Promise<unknown>
}

type CssInjectableEditorBridge = EditorBridge & {
  injectCSS: (css: string, tag?: string) => void
}
type NativeWysiwygCommandBridge = EditorBridge & {
  toggleBlockquote?: () => void
  toggleBold?: () => void
  toggleBulletList?: () => void
  toggleCode?: () => void
  toggleHeading?: (level: 1 | 2 | 3 | 4 | 5 | 6) => void
  toggleHighlight?: (color: string) => void
  toggleItalic?: () => void
  toggleOrderedList?: () => void
  toggleStrike?: () => void
  toggleTaskList?: () => void
}
type NativeWysiwygFormatCommand = (editor: NativeWysiwygCommandBridge) => void

type TimerHandle = ReturnType<typeof setTimeout>
type NativeTentapEditorBridgeOptions = Omit<MobileWysiwygMarkdownEditorProps, 'notes'> & {
  initialDocumentContent: string
}
type NativeTentapEditorSurfaceProps = {
  editor: EditorBridge
  injectEditorCss: () => void
}
type NativeTentapEditorRefs = {
  acceptsEditorChangesRef: MutableRefObject<boolean>
  contentRef: MutableRefObject<string>
  editorReadyTimerRef: MutableRefObject<TimerHandle | null>
  editorRef: MutableRefObject<EditorBridge | null>
  firstEditorSerializationRef: MutableRefObject<boolean>
  hasAcceptedEditorChangeRef: MutableRefObject<boolean>
  saveTimerRef: MutableRefObject<TimerHandle | null>
}

const wysiwygFormattingActions = [
  'bold',
  'italic',
  'strike',
  'code',
  'highlight',
  'heading2',
  'heading3',
  'bulletList',
  'orderedList',
  'taskList',
  'quote',
] as const satisfies readonly MobileMarkdownFormatAction[]

const wysiwygFormatCommands: Partial<Record<MobileMarkdownFormatAction, NativeWysiwygFormatCommand>> = {
  bold: (editor) => editor.toggleBold?.(),
  bulletList: (editor) => editor.toggleBulletList?.(),
  code: (editor) => editor.toggleCode?.(),
  heading2: (editor) => editor.toggleHeading?.(2),
  heading3: (editor) => editor.toggleHeading?.(3),
  highlight: (editor) => editor.toggleHighlight?.(mobileColors.yellowSoft),
  italic: (editor) => editor.toggleItalic?.(),
  orderedList: (editor) => editor.toggleOrderedList?.(),
  quote: (editor) => editor.toggleBlockquote?.(),
  strike: (editor) => editor.toggleStrike?.(),
  taskList: (editor) => editor.toggleTaskList?.(),
}

export function MobileWysiwygMarkdownEditor({
  blocks,
  bullets,
  compact,
  note,
  onUpdateContent,
}: MobileWysiwygMarkdownEditorProps) {
  const bridge = useNativeTentapEditorBridge({
    blocks,
    bullets,
    compact,
    initialDocumentContent: initialNativeEditorContent({ blocks, bullets, note }),
    note,
    onUpdateContent,
  })

  return <NativeTentapEditorSurface {...bridge} />
}

function NativeTentapEditorSurface({ editor, injectEditorCss }: NativeTentapEditorSurfaceProps) {
  return (
    <View style={nativeEditorStyles.container} testID="editor-wysiwyg-form">
      <RichText
        editor={editor}
        style={nativeEditorStyles.richText}
        testID="editor-wysiwyg-input"
        onLoadEnd={injectEditorCss}
      />
      <KeyboardAvoidingView behavior="padding" style={nativeEditorStyles.toolbarHost}>
        <MobileMarkdownFormattingToolbar
          actions={wysiwygFormattingActions}
          onFormat={(action) => applyNativeWysiwygFormat(editor, action)}
        />
      </KeyboardAvoidingView>
    </View>
  )
}

function applyNativeWysiwygFormat(editor: EditorBridge, action: MobileMarkdownFormatAction): void {
  wysiwygFormatCommands[action]?.(editor as NativeWysiwygCommandBridge)
}

function initialNativeEditorContent(
  props: Pick<MobileWysiwygMarkdownEditorProps, 'blocks' | 'bullets' | 'note'>,
): string {
  const { blocks, bullets, note } = props
  return mobileNoteEditableContent({
    ...note,
    editorBlocks: note.editorBlocks ?? blocks,
    editorBullets: bullets,
  })
}

function useNativeTentapEditorBridge({
  blocks,
  bullets,
  compact,
  initialDocumentContent,
  note,
  onUpdateContent,
}: NativeTentapEditorBridgeOptions) {
  const initialBody = mobileDocumentBody(initialDocumentContent)
  const initialBodyHasContent = initialBody.trim().length > 0
  const [initialContent] = useState(() => mobileMarkdownBodyToTentapHtml(initialBody))
  const refs = useNativeTentapEditorRefs(initialDocumentContent)

  const flushEditorDocument = useFlushEditorDocument({
    initialBodyHasContent,
    noteId: note.id,
    onUpdateContent,
    refs,
  })
  const scheduleDocumentFlush = useScheduleDocumentFlush(refs, flushEditorDocument)
  const injectEditorCss = useEditorCssInjection({ compact, refs })

  const editor = useEditorBridge({
    avoidIosKeyboard: true,
    bridgeExtensions: TenTapStartKit,
    initialContent,
    onChange: scheduleDocumentFlush,
  })

  useEditorBridgeRef(refs.editorRef, editor)
  useEditableContentRef({ blocks, bullets, note, refs })
  useResetEditorChangeGate({ initialContent, noteId: note.id, refs })
  useFlushOnUnmount(refs, flushEditorDocument)

  return { editor, injectEditorCss }
}

function useNativeTentapEditorRefs(initialDocumentContent: string): NativeTentapEditorRefs {
  const acceptsEditorChangesRef = useRef(false)
  const contentRef = useRef(initialDocumentContent)
  const editorReadyTimerRef = useRef<TimerHandle | null>(null)
  const editorRef = useRef<EditorBridge | null>(null)
  const firstEditorSerializationRef = useRef(true)
  const hasAcceptedEditorChangeRef = useRef(false)
  const saveTimerRef = useRef<TimerHandle | null>(null)

  return useMemo(() => ({
    acceptsEditorChangesRef,
    contentRef,
    editorReadyTimerRef,
    editorRef,
    firstEditorSerializationRef,
    hasAcceptedEditorChangeRef,
    saveTimerRef,
  }), [
    acceptsEditorChangesRef,
    contentRef,
    editorReadyTimerRef,
    editorRef,
    firstEditorSerializationRef,
    hasAcceptedEditorChangeRef,
    saveTimerRef,
  ])
}

function useFlushEditorDocument({
  initialBodyHasContent,
  noteId,
  onUpdateContent,
  refs,
}: {
  initialBodyHasContent: boolean
  noteId: string
  onUpdateContent: (noteId: string, content: string) => void
  refs: NativeTentapEditorRefs
}) {
  return useCallback(() => {
    flushEditorDocumentFromBridge({
      initialBodyHasContent,
      noteId,
      onUpdateContent,
      refs,
    })
  }, [initialBodyHasContent, noteId, onUpdateContent, refs])
}

function flushEditorDocumentFromBridge({
  initialBodyHasContent,
  noteId,
  onUpdateContent,
  refs,
}: {
  initialBodyHasContent: boolean
  noteId: string
  onUpdateContent: (noteId: string, content: string) => void
  refs: NativeTentapEditorRefs
}) {
  const editor = refs.editorRef.current
  if (!isJsonReadableEditorBridge(editor)) return

  void editor.getJSON()
    .then((json) => writeEditorJsonToMarkdown({ initialBodyHasContent, json, noteId, onUpdateContent, refs }))
    .catch((error: unknown) => {
      console.warn('[mobile-editor] Failed to read TenTap JSON:', error)
    })
}

function writeEditorJsonToMarkdown({
  initialBodyHasContent,
  json,
  noteId,
  onUpdateContent,
  refs,
}: {
  initialBodyHasContent: boolean
  json: unknown
  noteId: string
  onUpdateContent: (noteId: string, content: string) => void
  refs: NativeTentapEditorRefs
}) {
  const nextMarkdown = tiptapJsonToMobileMarkdown(json)
  if (shouldSkipFirstEmptySerialization(refs, initialBodyHasContent, nextMarkdown)) return

  const nextContent = mobileDocumentWithBody(refs.contentRef.current, `${nextMarkdown}\n`)
  refs.firstEditorSerializationRef.current = false
  if (nextContent !== refs.contentRef.current) onUpdateContent(noteId, nextContent)
}

function shouldSkipFirstEmptySerialization(
  refs: NativeTentapEditorRefs,
  initialBodyHasContent: boolean,
  nextMarkdown: string,
) {
  const shouldSkip = refs.firstEditorSerializationRef.current && initialBodyHasContent && nextMarkdown.trim() === ''
  if (shouldSkip) refs.firstEditorSerializationRef.current = false
  return shouldSkip
}

function useScheduleDocumentFlush(
  refs: NativeTentapEditorRefs,
  flushEditorDocument: () => void,
) {
  const { acceptsEditorChangesRef, hasAcceptedEditorChangeRef, saveTimerRef } = refs

  return useCallback(() => {
    if (!acceptsEditorChangesRef.current) return
    hasAcceptedEditorChangeRef.current = true
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(flushEditorDocument, 250)
  }, [acceptsEditorChangesRef, flushEditorDocument, hasAcceptedEditorChangeRef, saveTimerRef])
}

function useEditorCssInjection({
  compact,
  refs,
}: {
  compact: boolean
  refs: NativeTentapEditorRefs
}) {
  const { acceptsEditorChangesRef, editorReadyTimerRef, editorRef } = refs

  return useCallback(() => {
    if (isCssInjectableEditorBridge(editorRef.current)) {
      editorRef.current.injectCSS(mobileTentapEditorCss(compact), 'tolaria-editor')
    }
    if (editorReadyTimerRef.current) clearTimeout(editorReadyTimerRef.current)
    editorReadyTimerRef.current = setTimeout(() => {
      acceptsEditorChangesRef.current = true
    }, 750)
  }, [acceptsEditorChangesRef, compact, editorReadyTimerRef, editorRef])
}

function useEditorBridgeRef(
  editorRef: MutableRefObject<EditorBridge | null>,
  editor: EditorBridge,
) {
  useEffect(() => {
    editorRef.current = editor
  }, [editor, editorRef])
}

function useEditableContentRef({
  blocks,
  bullets,
  note,
  refs,
}: {
  blocks: MobileEditorBlock[]
  bullets: string[]
  note: MobileNote
  refs: NativeTentapEditorRefs
}) {
  const { contentRef } = refs

  useEffect(() => {
    contentRef.current = mobileNoteEditableContent({
      ...note,
      editorBlocks: note.editorBlocks ?? blocks,
      editorBullets: bullets,
    })
  }, [blocks, bullets, contentRef, note])
}

function useResetEditorChangeGate({
  initialContent,
  noteId,
  refs,
}: {
  initialContent: string
  noteId: string
  refs: NativeTentapEditorRefs
}) {
  const { acceptsEditorChangesRef, firstEditorSerializationRef, hasAcceptedEditorChangeRef } = refs

  useEffect(() => {
    acceptsEditorChangesRef.current = false
    firstEditorSerializationRef.current = true
    hasAcceptedEditorChangeRef.current = false
  }, [acceptsEditorChangesRef, firstEditorSerializationRef, hasAcceptedEditorChangeRef, initialContent, noteId])
}

function useFlushOnUnmount(
  refs: NativeTentapEditorRefs,
  flushEditorDocument: () => void,
) {
  useEffect(() => () => {
    if (refs.editorReadyTimerRef.current) clearTimeout(refs.editorReadyTimerRef.current)
    if (refs.saveTimerRef.current) clearTimeout(refs.saveTimerRef.current)
    if (refs.hasAcceptedEditorChangeRef.current) flushEditorDocument()
  }, [flushEditorDocument, refs])
}

function isJsonReadableEditorBridge(editor: EditorBridge | null): editor is JsonReadableEditorBridge {
  return typeof (editor as Partial<JsonReadableEditorBridge> | null)?.getJSON === 'function'
}

function isCssInjectableEditorBridge(editor: EditorBridge | null): editor is CssInjectableEditorBridge {
  return typeof (editor as Partial<CssInjectableEditorBridge> | null)?.injectCSS === 'function'
}

const nativeEditorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mobileColors.editor,
  },
  richText: {
    flex: 1,
    backgroundColor: mobileColors.editor,
  },
  toolbarHost: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: mobileColors.editor,
    borderTopColor: mobileColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: mobileSpace.md,
    paddingTop: mobileSpace.xs,
  },
})
