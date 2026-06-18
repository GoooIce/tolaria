import type { MobileLayoutProbe } from '../../qa/mobileLayoutProbe'
import { MobileMarkdownSourceEditor, type MobileMarkdownSourceEditorProps } from './MobileMarkdownSourceEditor'

type MobileWysiwygMarkdownEditorProps = MobileMarkdownSourceEditorProps & {
  layoutProbe?: MobileLayoutProbe
  wysiwygWikilinkInsertProbe?: boolean
  wysiwygMutationProbe?: boolean
}

export function MobileWysiwygMarkdownEditor({
  layoutProbe,
  wysiwygWikilinkInsertProbe,
  wysiwygMutationProbe,
  ...props
}: MobileWysiwygMarkdownEditorProps) {
  void layoutProbe
  void wysiwygWikilinkInsertProbe
  void wysiwygMutationProbe
  return <MobileMarkdownSourceEditor {...props} />
}
