import React from 'react';
import { View, StyleSheet, Platform, AccessibilityInfo } from 'react-native';
import { BlurView } from 'expo-blur';
import { GLASS_VARIANTS, HIGH_CONTRAST_VARIANTS, GLASS_PERFORMANCE } from '../../constants/glassmorphism';

interface GlassContainerProps {
  children: React.ReactNode;
  variant?: 'minimal' | 'card' | 'agent' | 'overlay' | 'navigation' | 'fab';
  style?: any;
  disabled?: boolean;
  highContrast?: boolean;
  performanceMode?: boolean;
}

export function GlassContainer({
  children,
  variant = 'card',
  style,
  disabled = false,
  highContrast = false,
  performanceMode = false,
}: GlassContainerProps) {
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
        blur: Math.floor(selectedVariant.blur * GLASS_PERFORMANCE.performanceMode.blurMultiplier),
      };
    }

    return selectedVariant;
  };

  const currentVariant = getVariant();

  // If disabled or blur is disabled, render simple view
  if (disabled || (isLowEndDevice && GLASS_PERFORMANCE.disableBlurOnLowEnd)) {
    return (
      <View
        style={[
          styles.fallbackContainer,
          {
            backgroundColor: `rgba(255, 255, 255, ${currentVariant.opacity})`,
            borderRadius: currentVariant.radius,
            borderWidth: currentVariant.borderWidth,
            borderColor: currentVariant.borderColor,
            boxShadow: currentVariant.boxShadow,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  // Render glass effect with BlurView
  return (
    <BlurView
      intensity={currentVariant.blur}
      tint={variant === 'agent' ? 'light' : 'default'}
      style={[
        styles.glassContainer,
        {
          backgroundColor: currentVariant.tint,
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
    </BlurView>
  );
}

const styles = StyleSheet.create({
  glassContainer: {
    // Base styles are applied dynamically via props
  },
  
  fallbackContainer: {
    // Fallback styles for devices that don't support blur
  },
});
