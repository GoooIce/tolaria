import { RichText, TenTapStartKit, useEditorBridge, type EditorBridge } from '@10play/tentap-editor'
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native'
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import {
  mobileDocumentBody,
  mobileMarkdownBodyToTentapHtml,
  mobileNoteEditableContent,
} from '../../workspace/mobileDocumentContent'
import type { MobileEditorBlock, MobileNote } from '../../workspace/mobileWorkspaceModel'
import { probeProps, type MobileLayoutProbe } from '../../qa/mobileLayoutProbe'
import { mobileColors, mobileSpace } from '../../ui/tokens'
import { MobileMarkdownFormattingToolbar } from './MobileMarkdownFormattingToolbar'
import { mobileTentapEditorCss } from './MobileWysiwygMarkdownEditorCss'
import {
  applyNativeWysiwygFormat,
  nativeWysiwygFormattingActions,
  type NativeWysiwygCommandBridge,
} from './MobileWysiwygFormatCommands'
import { nativeWysiwygDocumentContentFromJson } from './MobileWysiwygDocumentSerialization'
import { MobileWysiwygWikilinkPicker } from './MobileWysiwygWikilinkPicker'
import {
  nativeWysiwygDocumentWithInsertedWikilink,
  type NativeWysiwygSelection,
  type NativeWysiwygWikilinkPayload,
} from './MobileWysiwygWikilinkBridgeModel'
import {
  nativeWysiwygMutationLogLine,
  nativeWysiwygMutationProbeContent,
  nativeWysiwygMutationProof,
} from '../../qa/nativeWysiwygMutationProbe'
import {
  nativeWysiwygWikilinkInsertLogLine,
  nativeWysiwygWikilinkInsertProbePayload,
  nativeWysiwygWikilinkInsertProof,
} from '../../qa/nativeWysiwygWikilinkInsertProbe'

type MobileWysiwygMarkdownEditorProps = {
  blocks: MobileEditorBlock[]
  bullets: string[]
  compact: boolean
  layoutProbe?: MobileLayoutProbe
  note: MobileNote
  notes: MobileNote[]
  onUpdateContent: (noteId: string, content: string) => void
  wysiwygWikilinkInsertProbe?: boolean
  wysiwygMutationProbe?: boolean
}

type JsonReadableEditorBridge = EditorBridge & {
  getJSON: () => Promise<unknown>
}

type EditorStateReadableBridge = EditorBridge & {
  getEditorState: () => {
    selection?: {
      from?: unknown
      to?: unknown
    }
  }
}

type CssInjectableEditorBridge = EditorBridge & {
  injectCSS: (css: string, tag?: string) => void
}

type TimerHandle = ReturnType<typeof setTimeout>
type NativeTentapEditorBridgeOptions = Omit<MobileWysiwygMarkdownEditorProps, 'notes'> & {
  initialDocumentContent: string
}
type NativeTentapEditorSurfaceProps = {
  editor: EditorBridge
  injectEditorCss: () => void
  insertWikilink: (payload: NativeWysiwygWikilinkPayload) => void
  layoutProbe?: MobileLayoutProbe
  notes: MobileNote[]
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

type ContentSettableEditorBridge = EditorBridge & {
  setContent: (content: unknown) => void
}

export function MobileWysiwygMarkdownEditor({
  blocks,
  bullets,
  compact,
  layoutProbe,
  note,
  notes,
  onUpdateContent,
  wysiwygWikilinkInsertProbe = false,
  wysiwygMutationProbe = false,
}: MobileWysiwygMarkdownEditorProps) {
  const bridge = useNativeTentapEditorBridge({
    blocks,
    bullets,
    compact,
    initialDocumentContent: initialNativeEditorContent({ blocks, bullets, note }),
    note,
    onUpdateContent,
    wysiwygWikilinkInsertProbe,
    wysiwygMutationProbe,
  })

  return <NativeTentapEditorSurface {...bridge} layoutProbe={layoutProbe} notes={notes} />
}

function NativeTentapEditorSurface({
  editor,
  injectEditorCss,
  insertWikilink,
  layoutProbe,
  notes,
}: NativeTentapEditorSurfaceProps) {
  const [wikilinkPickerOpen, setWikilinkPickerOpen] = useState(false)
  const handleFormat = useCallback((action: Parameters<typeof applyNativeWysiwygFormat>[1]) => {
    if (action === 'wikilink') {
      setWikilinkPickerOpen(true)
      return
    }
    applyNativeWysiwygFormat(editor as NativeWysiwygCommandBridge, action)
  }, [editor])
  const handleInsertWikilink = useCallback((payload: NativeWysiwygWikilinkPayload) => {
    insertWikilink(payload)
    setWikilinkPickerOpen(false)
  }, [insertWikilink])

  return (
    <View {...probeProps(layoutProbe, 'editor.wysiwyg.form')} style={nativeEditorStyles.container} testID="editor-wysiwyg-form">
      <RichText
        editor={editor}
        {...probeProps(layoutProbe, 'editor.wysiwyg.richText')}
        style={nativeEditorStyles.richText}
        testID="editor-wysiwyg-input"
        onLoadEnd={injectEditorCss}
      />
      <KeyboardAvoidingView
        {...probeProps(layoutProbe, 'editor.wysiwyg.toolbarHost')}
        behavior="padding"
        style={nativeEditorStyles.toolbarHost}
      >
        <MobileMarkdownFormattingToolbar
          actions={nativeWysiwygFormattingActions}
          layoutProbe={layoutProbe}
          metricId="editor.wysiwyg.toolbar"
          onFormat={handleFormat}
        />
      </KeyboardAvoidingView>
      {wikilinkPickerOpen ? (
        <MobileWysiwygWikilinkPicker
          notes={notes}
          onClose={() => setWikilinkPickerOpen(false)}
          onSelect={handleInsertWikilink}
        />
      ) : null}
    </View>
  )
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
  wysiwygWikilinkInsertProbe = false,
  wysiwygMutationProbe = false,
}: NativeTentapEditorBridgeOptions) {
  const initialBody = mobileDocumentBody(initialDocumentContent)
  const initialBodyHasContent = initialBody.trim().length > 0
  const [initialContent] = useState(() => mobileMarkdownBodyToTentapHtml(initialBody))
  const refs = useNativeTentapEditorRefs(initialDocumentContent)

  const flushEditorDocument = useFlushEditorDocument({
    initialBodyHasContent,
    mutationProbeEnabled: wysiwygMutationProbe,
    noteId: note.id,
    onUpdateContent,
    refs,
    wikilinkInsertProbeEnabled: wysiwygWikilinkInsertProbe,
  })
  const scheduleDocumentFlush = useScheduleDocumentFlush(refs, flushEditorDocument)
  const injectEditorCss = useEditorCssInjection({ compact, refs })
  const insertWikilink = useNativeWysiwygWikilinkInserter({ flushEditorDocument, refs })

  const editor = useEditorBridge({
    avoidIosKeyboard: true,
    bridgeExtensions: TenTapStartKit,
    initialContent,
    onChange: scheduleDocumentFlush,
  })

  useEditorBridgeRef(refs.editorRef, editor)
  useEditableContentRef({ blocks, bullets, note, refs })
  useResetEditorChangeGate({ initialContent, noteId: note.id, refs })
  useNativeWysiwygWikilinkInsertProbe({ enabled: wysiwygWikilinkInsertProbe, flushEditorDocument, refs })
  useNativeWysiwygMutationProbe({ enabled: wysiwygMutationProbe, flushEditorDocument, refs })
  useFlushOnUnmount(refs, flushEditorDocument)

  return { editor, injectEditorCss, insertWikilink }
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
  mutationProbeEnabled,
  noteId,
  onUpdateContent,
  refs,
  wikilinkInsertProbeEnabled,
}: {
  initialBodyHasContent: boolean
  mutationProbeEnabled: boolean
  noteId: string
  onUpdateContent: (noteId: string, content: string) => void
  refs: NativeTentapEditorRefs
  wikilinkInsertProbeEnabled: boolean
}) {
  return useCallback(() => {
    flushEditorDocumentFromBridge({
      initialBodyHasContent,
      mutationProbeEnabled,
      noteId,
      onUpdateContent,
      refs,
      wikilinkInsertProbeEnabled,
    })
  }, [initialBodyHasContent, mutationProbeEnabled, noteId, onUpdateContent, refs, wikilinkInsertProbeEnabled])
}

function flushEditorDocumentFromBridge({
  initialBodyHasContent,
  mutationProbeEnabled,
  noteId,
  onUpdateContent,
  refs,
  wikilinkInsertProbeEnabled,
}: {
  initialBodyHasContent: boolean
  mutationProbeEnabled: boolean
  noteId: string
  onUpdateContent: (noteId: string, content: string) => void
  refs: NativeTentapEditorRefs
  wikilinkInsertProbeEnabled: boolean
}) {
  const editor = refs.editorRef.current
  if (!isJsonReadableEditorBridge(editor)) return

  void editor.getJSON()
    .then((json) => writeEditorJsonToMarkdown({
      initialBodyHasContent,
      json,
      mutationProbeEnabled,
      noteId,
      onUpdateContent,
      refs,
      wikilinkInsertProbeEnabled,
    }))
    .catch((error: unknown) => {
      console.warn('[mobile-editor] Failed to read TenTap JSON:', error)
    })
}

function writeEditorJsonToMarkdown({
  initialBodyHasContent,
  json,
  mutationProbeEnabled,
  noteId,
  onUpdateContent,
  refs,
  wikilinkInsertProbeEnabled,
}: {
  initialBodyHasContent: boolean
  json: unknown
  mutationProbeEnabled: boolean
  noteId: string
  onUpdateContent: (noteId: string, content: string) => void
  refs: NativeTentapEditorRefs
  wikilinkInsertProbeEnabled: boolean
}) {
  const nextContent = nativeWysiwygDocumentContentFromJson({
    currentContent: refs.contentRef.current,
    initialBodyHasContent,
    isFirstSerialization: refs.firstEditorSerializationRef.current,
    json,
  })
  refs.firstEditorSerializationRef.current = false
  if (!nextContent.skipped && nextContent.content !== refs.contentRef.current) {
    onUpdateContent(noteId, nextContent.content)
    if (mutationProbeEnabled) publishNativeWysiwygMutationProof(noteId, nextContent.content)
    if (wikilinkInsertProbeEnabled) publishNativeWysiwygWikilinkInsertProof(noteId, nextContent.content)
  }
}

function useNativeWysiwygMutationProbe({
  enabled,
  flushEditorDocument,
  refs,
}: {
  enabled: boolean
  flushEditorDocument: () => void
  refs: NativeTentapEditorRefs
}) {
  useEffect(() => {
    if (!enabled) return undefined

    const contentTimer = setTimeout(() => {
      const editor = refs.editorRef.current
      if (!isContentSettableEditorBridge(editor)) return

      refs.hasAcceptedEditorChangeRef.current = true
      editor.setContent(nativeWysiwygMutationProbeContent())
      refs.saveTimerRef.current = setTimeout(flushEditorDocument, 500)
    }, 1500)

    return () => {
      clearTimeout(contentTimer)
      if (refs.saveTimerRef.current) clearTimeout(refs.saveTimerRef.current)
    }
  }, [enabled, flushEditorDocument, refs])
}

function publishNativeWysiwygMutationProof(noteId: string, content: string): void {
  if (Platform.OS === 'web') return

  console.info(nativeWysiwygMutationLogLine(nativeWysiwygMutationProof({ content, noteId })))
}

function publishNativeWysiwygWikilinkInsertProof(noteId: string, content: string): void {
  if (Platform.OS === 'web') return

  console.info(nativeWysiwygWikilinkInsertLogLine(nativeWysiwygWikilinkInsertProof({ content, noteId })))
}

function useNativeWysiwygWikilinkInserter({
  flushEditorDocument,
  refs,
}: {
  flushEditorDocument: () => void
  refs: NativeTentapEditorRefs
}) {
  const { editorRef, hasAcceptedEditorChangeRef, saveTimerRef } = refs

  return useCallback((payload: NativeWysiwygWikilinkPayload) => {
    void insertWikilinkIntoNativeEditor(editorRef.current, payload)
      .then((inserted) => {
        if (!inserted) return

        hasAcceptedEditorChangeRef.current = true
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(flushEditorDocument, 250)
      })
      .catch((error: unknown) => {
        console.warn('[mobile-editor] Failed to insert native WYSIWYG wikilink:', error)
      })
  }, [editorRef, flushEditorDocument, hasAcceptedEditorChangeRef, saveTimerRef])
}

async function insertWikilinkIntoNativeEditor(
  editor: EditorBridge | null,
  payload: NativeWysiwygWikilinkPayload,
): Promise<boolean> {
  if (!isJsonReadableEditorBridge(editor) || !isContentSettableEditorBridge(editor)) return false

  const json = await editor.getJSON()
  const nextJson = nativeWysiwygDocumentWithInsertedWikilink({
    json,
    payload,
    selection: nativeWysiwygEditorSelection(editor),
  })
  if (!nextJson) return false

  editor.setContent(nextJson)
  return true
}

function nativeWysiwygEditorSelection(editor: EditorBridge): NativeWysiwygSelection | undefined {
  if (!isEditorStateReadableBridge(editor)) return undefined

  const selection = editor.getEditorState().selection
  if (typeof selection?.from !== 'number' || typeof selection.to !== 'number') return undefined

  return {
    from: selection.from,
    to: selection.to,
  }
}

function useNativeWysiwygWikilinkInsertProbe({
  enabled,
  flushEditorDocument,
  refs,
}: {
  enabled: boolean
  flushEditorDocument: () => void
  refs: NativeTentapEditorRefs
}) {
  const hasInsertedProbeWikilinkRef = useRef(false)

  useEffect(() => {
    if (!enabled) {
      hasInsertedProbeWikilinkRef.current = false
      return undefined
    }
    if (hasInsertedProbeWikilinkRef.current) return undefined

    let insertTimer: TimerHandle | null = null
    const insertWhenReady = () => {
      if (!refs.acceptsEditorChangesRef.current) {
        insertTimer = setTimeout(insertWhenReady, 250)
        return
      }

      const editor = refs.editorRef.current
      hasInsertedProbeWikilinkRef.current = true
      void insertWikilinkIntoNativeEditor(editor, nativeWysiwygWikilinkInsertProbePayload())
        .then((inserted) => {
          if (!inserted) {
            hasInsertedProbeWikilinkRef.current = false
            return
          }

          refs.hasAcceptedEditorChangeRef.current = true
          refs.saveTimerRef.current = setTimeout(flushEditorDocument, 500)
        })
        .catch((error: unknown) => {
          hasInsertedProbeWikilinkRef.current = false
          console.warn('[mobile-editor] Failed to run native WYSIWYG wikilink insert probe:', error)
        })
    }

    insertTimer = setTimeout(insertWhenReady, 250)

    return () => {
      if (insertTimer) clearTimeout(insertTimer)
      if (refs.saveTimerRef.current) clearTimeout(refs.saveTimerRef.current)
    }
  }, [enabled, flushEditorDocument, refs])
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

function isEditorStateReadableBridge(editor: EditorBridge | null): editor is EditorStateReadableBridge {
  return typeof (editor as Partial<EditorStateReadableBridge> | null)?.getEditorState === 'function'
}

function isContentSettableEditorBridge(editor: EditorBridge | null): editor is ContentSettableEditorBridge {
  return typeof (editor as Partial<ContentSettableEditorBridge> | null)?.setContent === 'function'
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
