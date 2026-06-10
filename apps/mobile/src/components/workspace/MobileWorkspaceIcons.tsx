import {
  Archive,
  FileText,
  FolderOpen,
  StackSimple,
} from 'phosphor-react-native'
import type { MobileTone } from '../../workspace/mobileWorkspaceModel'
import { noteTypeColor } from './mobileWorkspaceTone'

export function MobileTypeIcon({
  size,
  tone,
  type,
}: {
  size: number
  tone: MobileTone
  type: string
}) {
  const color = noteTypeColor(tone)
  const normalizedType = type.toLowerCase()

  if (normalizedType.includes('release')) {
    return <Archive color={color} size={size} />
  }

  if (normalizedType.includes('procedure')) {
    return <StackSimple color={color} size={size} />
  }

  if (normalizedType.includes('project')) {
    return <FolderOpen color={color} size={size} />
  }

  return <FileText color={color} size={size} />
}
