import { useEffect, useRef, type MutableRefObject } from 'react'
import type { EditorBridge } from '@10play/tentap-editor'
import {
  nativeWysiwygFormatCommandLogLine,
  nativeWysiwygFormatCommandProbeActions,
  nativeWysiwygFormatCommandProof,
} from '../../qa/nativeWysiwygFormatCommandProbe'
import {
  applyNativeWysiwygFormat,
  type NativeWysiwygCommandBridge,
} from './MobileWysiwygFormatCommands'

type TimerHandle = ReturnType<typeof setTimeout>

export type NativeWysiwygFormatCommandProbeRefs = {
  acceptsEditorChangesRef: MutableRefObject<boolean>
  editorRef: MutableRefObject<EditorBridge | null>
}

export function useNativeWysiwygFormatCommandProbe({
  enabled,
  refs,
}: {
  enabled: boolean
  refs: NativeWysiwygFormatCommandProbeRefs
}) {
  const hasRunProbeRef = useRef(false)

  useEffect(() => {
    if (!enabled) {
      hasRunProbeRef.current = false
      return undefined
    }
    if (hasRunProbeRef.current) return undefined

    let probeTimer: TimerHandle | null = null
    const runProbe = () => {
      if (!refs.acceptsEditorChangesRef.current) {
        probeTimer = setTimeout(runProbe, 250)
        return
      }

      const editor = refs.editorRef.current
      hasRunProbeRef.current = true
      for (const action of nativeWysiwygFormatCommandProbeActions) {
        if (editor) applyNativeWysiwygFormat(editor as NativeWysiwygCommandBridge, action)
        console.info(nativeWysiwygFormatCommandLogLine(nativeWysiwygFormatCommandProof({ action, editor })))
      }
    }

    probeTimer = setTimeout(runProbe, 500)

    return () => {
      if (probeTimer) clearTimeout(probeTimer)
    }
  }, [enabled, refs])
}
