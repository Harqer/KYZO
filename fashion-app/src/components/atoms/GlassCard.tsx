import React from 'react';
import { View, StyleSheet, Platform, AccessibilityInfo } from 'react-native';
import { GLASS_VARIANTS, HIGH_CONTRAST_VARIANTS, GLASS_PERFORMANCE } from '../../constants/glassmorphism';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'minimal' | 'card' | 'agent' | 'overlay' | 'navigation' | 'fab';
  style?: any;
  disabled?: boolean;
  highContrast?: boolean;
  performanceMode?: boolean;
}

export function GlassCard({
  children,
  variant = 'card',
  style,
  disabled = false,
  highContrast = false,
  performanceMode = false,
}: GlassCardProps) {
  const [useHighContrast, setUseHighContrast] = React.useState(highContrast);
  const [isLowEndDevice, setIsLowEndDevice] = React.useState(performanceMode);

  // Check accessibility settings on mount
  React.useEffect(() => {
    const checkAccessibilitySettings = async () => {
      const prefersReducedTransparency = await AccessibilityInfo.isReduceTransparencyEnabled();
      setUseHighContrast(highContrast || prefersReducedTransparency);
    };

    checkAccessibilitySettings();
    
    // Listen for accessibility changes
    const subscription = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      checkAccessibilitySettings
    );

    return () => subscription?.remove();
  }, [highContrast]);

  // Get the appropriate variant based on settings
  const getVariant = () => {
    const variants = useHighContrast ? HIGH_CONTRAST_VARIANTS : GLASS_VARIANTS;
    let selectedVariant = variants[variant];

    // Apply performance optimizations if needed
    if (isLowEndDevice || GLASS_PERFORMANCE.disableBlurOnLowEnd) {
      selectedVariant = {
        ...selectedVariant,
        blur: Math.floor(selectedVariant.blur * 0.7),
      };
    }

    return selectedVariant;
  };

  const currentVariant = getVariant();

  return (
    <View
      style={[
        styles.glassCard,
        {
          backgroundColor: disabled ? 'rgba(255, 255, 255, 0.8)' : currentVariant.tint,
          borderRadius: currentVariant.radius,
          borderWidth: currentVariant.borderWidth,
          borderColor: currentVariant.borderColor,
          boxShadow: currentVariant.boxShadow,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    // Base glass card styling
  },
});
