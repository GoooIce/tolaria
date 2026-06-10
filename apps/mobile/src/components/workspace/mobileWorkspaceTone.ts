import type { MobileTone } from '../../workspace/mobileWorkspaceModel'
import { mobileColors } from '../../ui/tokens'

export type MobileTagTone = 'blue' | 'green' | 'orange' | 'purple' | 'red'

export function noteTypeColor(tone: MobileTone) {
  if (tone === 'green') return mobileColors.green
  if (tone === 'orange') return mobileColors.orange
  return mobileColors.purple
}

export function statusTone(status: string): 'blue' | 'green' | 'orange' {
  if (status === 'Shipped') return 'green'
  if (status === 'Active') return 'blue'
  return 'orange'
}

export function tagTone(label: string): MobileTagTone {
  const tones = ['blue', 'green', 'orange', 'purple', 'red'] as const
  const index = Array.from(label).reduce((sum, char) => sum + char.charCodeAt(0), 0) % tones.length

  return tones[index]
}
