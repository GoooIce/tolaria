import { View } from 'react-native'
import {
  PanGestureHandler,
  State,
  type PanGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler'
import { compactSwipeEvent, detectHorizontalSwipe } from './compactGestures'
import type { CompactNavigationEvent, CompactPanel } from './compactNavigation'
import { styles } from './styles'

export function SwipeSurface({
  children,
  panel,
  onNavigate,
}: {
  children: React.ReactNode
  panel: CompactPanel
  onNavigate: (event: CompactNavigationEvent) => void
}) {
  const handleStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.state !== State.END) {
      return
    }

    const direction = detectHorizontalSwipe(event.nativeEvent)
    const navigationEvent = direction ? compactSwipeEvent(panel, direction) : null
    if (navigationEvent) {
      onNavigate(navigationEvent)
    }
  }

  return (
    <PanGestureHandler activeOffsetX={[-18, 18]} failOffsetY={[-24, 24]} onHandlerStateChange={handleStateChange}>
      <View style={styles.swipeSurface}>{children}</View>
    </PanGestureHandler>
  )
}
