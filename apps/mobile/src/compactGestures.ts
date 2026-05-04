import type { CompactNavigationEvent, CompactPanel } from './compactNavigation'

export type SwipeDirection = 'left' | 'right'

export type SwipeSample = {
  translationX: number
  velocityX: number
}

const MIN_TRANSLATION = 56
const MIN_VELOCITY = 420
const compactGestureEvents: Partial<Record<`${CompactPanel}:${SwipeDirection}`, CompactNavigationEvent>> = {
  'list:left': { type: 'openSidebar' },
  'sidebar:right': { type: 'closeSidebar' },
  'note:right': { type: 'openProperties' },
  'properties:left': { type: 'closeProperties' },
}

export function detectHorizontalSwipe(sample: SwipeSample): SwipeDirection | null {
  if (!isCommittedSwipe(sample)) {
    return null
  }

  return sample.translationX < 0 ? 'left' : 'right'
}

export function compactSwipeEvent(
  panel: CompactPanel,
  direction: SwipeDirection,
): CompactNavigationEvent | null {
  return compactGestureEvents[`${panel}:${direction}`] ?? null
}

function isCommittedSwipe(sample: SwipeSample) {
  return Math.abs(sample.translationX) >= MIN_TRANSLATION || Math.abs(sample.velocityX) >= MIN_VELOCITY
}
