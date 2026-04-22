/**
 * AuthButton - Atomic Component
 * Basic authentication button that can't be broken down further
 * Handles different authentication states and providers
 */

import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, View } from 'react-native';
import * as Haptics from 'expo-haptics';

interface AuthButtonProps {
  title?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  provider?: 'google' | 'github' | 'microsoft' | 'slack' | 'email';
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  provider,
  icon,
  style,
  textStyle,
}) => {

  const handlePress = async () => {
    if (disabled || loading) return;
    
    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    onPress();
  };

  const getButtonStyles = (): ViewStyle => {
    const baseStyles: ViewStyle = {
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      ...style,
    };

    const sizeStyles: ViewStyle = {
      small: { paddingHorizontal: 16, paddingVertical: 8, minHeight: 36 },
      medium: { paddingHorizontal: 24, paddingVertical: 12, minHeight: 44 },
      large: { paddingHorizontal: 32, paddingVertical: 16, minHeight: 52 },
    }[size];

    const variantStyles: ViewStyle = {
      primary: {
        backgroundColor: '#3B82F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
      secondary: {
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#D1D5DB',
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#3B82F6',
      },
    }[variant];

    const providerStyles: ViewStyle = provider ? {
      backgroundColor: getProviderColor(provider),
    } : {};

    return { ...baseStyles, ...sizeStyles, ...variantStyles, ...providerStyles };
  };

  const getTextStyles = (): TextStyle => {
    const baseStyles: TextStyle = {
      fontWeight: '600',
      ...textStyle,
    };

    const sizeStyles: TextStyle = {
      small: { fontSize: 14 },
      medium: { fontSize: 16 },
      large: { fontSize: 18 },
    }[size];

    const variantStyles: TextStyle = {
      primary: { color: '#FFFFFF' },
      secondary: { color: '#111827' },
      outline: { color: '#3B82F6' },
    }[variant];

    return { ...baseStyles, ...sizeStyles, ...variantStyles };
  };

  const getProviderColor = (provider: string): string => {
    const colors = {
      google: '#4285F4',
      github: '#24292E',
      microsoft: '#0078D4',
      slack: '#4A154B',
      email: '#3B82F6',
    };
    return colors[provider as keyof typeof colors] || '#3B82F6';
  };

  const getIcon = () => {
    switch (provider) {
      case 'google':
        return 'logo-google';
      case 'github':
        return 'logo-github';
      case 'microsoft':
        return 'logo-microsoft';
      case 'slack':
        return 'logo-slack';
      case 'email':
      default:
        return 'mail';
    }
  };

  const getLabel = () => {
    switch (provider) {
      case 'google':
        return 'Continue with Google';
      case 'github':
        return 'Continue with GitHub';
      case 'microsoft':
        return 'Continue with Microsoft';
      case 'slack':
        return 'Continue with Slack';
      case 'email':
      default:
        return 'Continue with Email';
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        getButtonStyles(),
        {
          opacity: (pressed || disabled || loading) ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? '#FFFFFF' : '#3B82F6'} 
        />
      ) : (
        <>
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text style={getTextStyles()}>{title || getLabel()}</Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    minWidth: 120,
  },
});

export default AuthButton;
