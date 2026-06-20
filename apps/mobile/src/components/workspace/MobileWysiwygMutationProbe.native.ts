import { useEffect, type MutableRefObject } from 'react'
import type { EditorBridge } from '@10play/tentap-editor'
import {
  nativeWysiwygMutationLogLine,
  nativeWysiwygMutationProbeContent,
  nativeWysiwygMutationProof,
} from '../../qa/nativeWysiwygMutationProbe'

type TimerHandle = ReturnType<typeof setTimeout>

type ContentSettableEditorBridge = EditorBridge & {
  setContent: (content: unknown) => void
}

export type NativeWysiwygMutationProbeRefs = {
  editorRef: MutableRefObject<EditorBridge | null>
  hasAcceptedEditorChangeRef: MutableRefObject<boolean>
  saveTimerRef: MutableRefObject<TimerHandle | null>
}

export function useNativeWysiwygMutationProbe({
  enabled,
  flushEditorDocument,
  refs,
  vaultRootUri,
}: {
  enabled: boolean
  flushEditorDocument: () => void
  refs: NativeWysiwygMutationProbeRefs
  vaultRootUri?: string | null
}) {
  useEffect(() => {
    if (!enabled) return undefined

    const contentTimer = setTimeout(() => {
      const editor = refs.editorRef.current
      if (!isContentSettableEditorBridge(editor)) return

      refs.hasAcceptedEditorChangeRef.current = true
      editor.setContent(nativeWysiwygMutationProbeContent(vaultRootUri))
      refs.saveTimerRef.current = setTimeout(flushEditorDocument, 500)
    }, 1500)

    return () => {
      clearTimeout(contentTimer)
      if (refs.saveTimerRef.current) clearTimeout(refs.saveTimerRef.current)
    }
  }, [enabled, flushEditorDocument, refs, vaultRootUri])
}

export function publishNativeWysiwygMutationProof(noteId: string, content: string): void {
  console.info(nativeWysiwygMutationLogLine(nativeWysiwygMutationProof({ content, noteId })))
}

function isContentSettableEditorBridge(editor: EditorBridge | null): editor is ContentSettableEditorBridge {
  return typeof (editor as Partial<ContentSettableEditorBridge> | null)?.setContent === 'function'
}
