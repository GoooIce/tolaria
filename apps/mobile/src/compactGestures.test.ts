import { describe, expect, it } from 'vitest'
import { compactSwipeEvent, detectHorizontalSwipe } from './compactGestures'

describe('compact mobile gestures', () => {
  it('ignores short slow horizontal drags', () => {
    expect(detectHorizontalSwipe({ translationX: 24, velocityX: 90 })).toBeNull()
  })

  it('detects committed left and right swipes', () => {
    expect(detectHorizontalSwipe({ translationX: -72, velocityX: -120 })).toBe('left')
    expect(detectHorizontalSwipe({ translationX: 20, velocityX: 520 })).toBe('right')
  })

  it('maps the requested Bear-style compact panel swipes', () => {
    expect(compactSwipeEvent('list', 'left')).toEqual({ type: 'openSidebar' })
    expect(compactSwipeEvent('sidebar', 'right')).toEqual({ type: 'closeSidebar' })
    expect(compactSwipeEvent('note', 'right')).toEqual({ type: 'openProperties' })
    expect(compactSwipeEvent('properties', 'left')).toEqual({ type: 'closeProperties' })
  })

  it('does not invent transitions for unsupported panel directions', () => {
    expect(compactSwipeEvent('list', 'right')).toBeNull()
    expect(compactSwipeEvent('note', 'left')).toBeNull()
  })
})
