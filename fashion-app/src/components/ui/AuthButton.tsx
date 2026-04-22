import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { getResponsiveSpacing } from '../../constants/responsive';

interface AuthButtonProps {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  style?: any;
}

export function AuthButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  style
}: AuthButtonProps) {
  
  const getButtonStyle = () => {
    const baseStyle: any = [styles.button];
    
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primaryButton);
        break;
      case 'secondary':
        baseStyle.push(styles.secondaryButton);
        break;
      case 'outline':
        baseStyle.push(styles.outlineButton);
        break;
    }
    
    switch (size) {
      case 'sm':
        baseStyle.push(styles.smallButton);
        break;
      case 'lg':
        baseStyle.push(styles.largeButton);
        break;
      default:
        baseStyle.push(styles.mediumButton);
    }
    
    if (disabled || loading) {
      baseStyle.push(styles.disabledButton);
    }
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle: any = [styles.text];
    
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primaryText);
        break;
      case 'secondary':
        baseStyle.push(styles.secondaryText);
        break;
      case 'outline':
        baseStyle.push(styles.outlineText);
        break;
    }
    
    switch (size) {
      case 'sm':
        baseStyle.push(styles.smallText);
        break;
      case 'lg':
        baseStyle.push(styles.largeText);
        break;
      default:
        baseStyle.push(styles.mediumText);
    }
    
    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  
  // Variants
  primaryButton: {
    backgroundColor: '#6366F1',
  },
  
  secondaryButton: {
    backgroundColor: '#1F2937',
  },
  
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  
  // Sizes
  smallButton: {
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('xs'),
    minHeight: 36,
  },
  
  mediumButton: {
    paddingHorizontal: getResponsiveSpacing('lg'),
    paddingVertical: getResponsiveSpacing('sm'),
    minHeight: 44,
  },
  
  largeButton: {
    paddingHorizontal: getResponsiveSpacing('xl'),
    paddingVertical: getResponsiveSpacing('md'),
    minHeight: 52,
  },
  
  // States
  disabledButton: {
    opacity: 0.5,
  },
  
  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  
  primaryText: {
    color: '#FFFFFF',
  },
  
  secondaryText: {
    color: '#FFFFFF',
  },
  
  outlineText: {
    color: '#6366F1',
  },
  
  smallText: {
    fontSize: 14,
  },
  
  mediumText: {
    fontSize: 16,
  },
  
  largeText: {
    fontSize: 18,
  },
});
