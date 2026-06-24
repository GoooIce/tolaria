import type { ReactNode } from 'react'
import { Platform, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { Button, type ButtonProps } from '../components/ui/button'
import { Text } from '../components/ui/text'
import { cn } from '../components/ui/utils'
import { mobileColors } from './tokens'

type MobileButtonVariant = 'primary' | 'secondary' | 'ghost'
type MobileButtonDensity = 'default' | 'compact' | 'status'
type MobileButtonTone = 'default' | 'danger'

export function MobileButton({
  accessibilityLabel,
  accessibilityRole,
  accessibilityState,
  density = 'default',
  disabled = false,
  icon,
  label,
  onPress,
  style,
  testID,
  tone = 'default',
  variant = 'secondary',
}: {
  accessibilityLabel?: string
  accessibilityRole?: ButtonProps['accessibilityRole']
  accessibilityState?: ButtonProps['accessibilityState']
  density?: MobileButtonDensity
  disabled?: boolean
  icon?: ReactNode
  label: string
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  testID?: string
  tone?: MobileButtonTone
  variant?: MobileButtonVariant
}) {
  const buttonVariant = buttonVariantByMobileVariant[variant]
  const buttonStyle = Platform.OS === 'web' ? style : [styles.base, buttonDensityStyles[density], style]
  const labelStyle = Platform.OS === 'web' ? undefined : [labelDensityStyles[density], labelColorStyles[variant], tone === 'danger' ? styles.labelDanger : null]

  return (
    <Button
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      className={cn(buttonDensityClassNames[density], buttonClassNames[variant])}
      disabled={disabled}
      onPress={onPress}
      size="sm"
      style={buttonStyle}
      testID={testID}
      variant={buttonVariant}
    >
      {icon}
      <Text
        className={cn(labelDensityClassNames[density], tone === 'danger' ? 'text-destructive' : labelClassNames[variant])}
        numberOfLines={1}
        style={labelStyle}
      >
        {label}
      </Text>
    </Button>
  )
}

const buttonVariantByMobileVariant: Record<MobileButtonVariant, ButtonProps['variant']> = {
  ghost: 'ghost',
  primary: 'default',
  secondary: 'secondary',
}

const buttonClassNames: Record<MobileButtonVariant, string> = {
  ghost: 'bg-transparent shadow-none',
  primary: '',
  secondary: 'bg-secondary',
}

const buttonDensityClassNames: Record<MobileButtonDensity, string> = {
  compact: 'min-h-8 rounded-md px-2 py-1 active:opacity-75',
  default: 'min-h-9 rounded-md px-3 active:opacity-75',
  status: 'h-6 min-h-0 rounded-sm px-1 py-0.5 active:opacity-75',
}

const labelClassNames: Record<MobileButtonVariant, string> = {
  ghost: 'text-muted-foreground',
  primary: 'text-primary-foreground',
  secondary: 'text-secondary-foreground',
}

const labelDensityClassNames: Record<MobileButtonDensity, string> = {
  compact: 'text-xs font-medium',
  default: 'text-sm font-medium',
  status: 'text-xs font-medium',
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  default: {
    minHeight: 36,
    borderRadius: 6,
    paddingHorizontal: 12,
  },
  compact: {
    minHeight: 32,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  labelDefault: {
    fontSize: 14,
    fontWeight: '500',
  },
  labelCompact: {
    fontSize: 12,
    fontWeight: '500',
  },
  labelDanger: {
    color: mobileColors.red,
  },
  labelStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  labelGhost: {
    color: mobileColors.textMuted,
  },
  labelPrimary: {
    color: mobileColors.textInverse,
  },
  labelSecondary: {
    color: mobileColors.text,
  },
  status: {
    minHeight: 0,
    height: 24,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
})

const buttonDensityStyles = {
  compact: styles.compact,
  default: styles.default,
  status: styles.status,
} as const

const labelColorStyles = {
  ghost: styles.labelGhost,
  primary: styles.labelPrimary,
  secondary: styles.labelSecondary,
} as const

const labelDensityStyles = {
  compact: styles.labelCompact,
  default: styles.labelDefault,
  status: styles.labelStatus,
} as const
