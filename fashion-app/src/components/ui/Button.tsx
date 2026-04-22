import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { getResponsiveSpacing } from '../../constants/responsive';

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: any;
  analyticsEvent?: string;
  analyticsData?: any;
}

export function Button({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  analyticsEvent,
  analyticsData,
}: ButtonProps) {
  
  const handlePress = async () => {
    if (disabled || loading) return;
    
    // Track analytics event if provided
    if (analyticsEvent) {
      try {
        // In a real app, this would send to analytics service
        console.log('Analytics Event:', analyticsEvent, analyticsData);
      } catch (error) {
        console.error('Failed to track analytics:', error);
      }
    }
    
    // Call the onPress handler
    await onPress();
  };

  const renderContent = () => {
    const content = [];
    
    if (icon && iconPosition === 'left') {
      content.push(
        <View key="icon-left" style={styles.iconLeft}>
          {icon}
        </View>
      );
    }
    
    content.push(
      <Text 
        key="text" 
        style={[
          styles.text, 
          styles[`${variant}Text`], 
          styles[`${size}Text`],
          loading && styles.loadingText
        ]}
      >
        {children}
      </Text>
    );
    
    if (icon && iconPosition === 'right') {
      content.push(
        <View key="icon-right" style={styles.iconRight}>
          {icon}
        </View>
      );
    }
    
    if (loading) {
      content.push(
        <ActivityIndicator 
          key="loading" 
          size="small" 
          color={getLoadingColor(variant)} 
          style={styles.loadingIndicator}
        />
      );
    }
    
    return <>{content}</>;
  };

  const getLoadingColor = (buttonVariant: string) => {
    switch (buttonVariant) {
      case 'primary':
      case 'danger':
        return '#FFFFFF';
      case 'secondary':
      case 'outline':
      case 'ghost':
        return '#6366F1';
      default:
        return '#FFFFFF';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    position: 'relative',
  },
  
  // Variants
  primary: {
    backgroundColor: '#6366F1',
  },
  
  secondary: {
    backgroundColor: '#1F2937',
  },
  
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  
  ghost: {
    backgroundColor: 'transparent',
  },
  
  danger: {
    backgroundColor: '#EF4444',
  },
  
  // Sizes
  sm: {
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('xs'),
    minHeight: 36,
  },
  
  md: {
    paddingHorizontal: getResponsiveSpacing('lg'),
    paddingVertical: getResponsiveSpacing('sm'),
    minHeight: 44,
  },
  
  lg: {
    paddingHorizontal: getResponsiveSpacing('xl'),
    paddingVertical: getResponsiveSpacing('md'),
    minHeight: 52,
  },
  
  // States
  disabled: {
    opacity: 0.5,
  },
  
  fullWidth: {
    width: '100%',
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
  
  ghostText: {
    color: '#6366F1',
  },
  
  dangerText: {
    color: '#FFFFFF',
  },
  
  smText: {
    fontSize: 14,
  },
  
  mdText: {
    fontSize: 16,
  },
  
  lgText: {
    fontSize: 18,
  },
  
  loadingText: {
    opacity: 0.7,
  },
  
  // Icon styles
  iconLeft: {
    marginRight: getResponsiveSpacing('xs'),
  },
  
  iconRight: {
    marginLeft: getResponsiveSpacing('xs'),
  },
  
  // Loading indicator
  loadingIndicator: {
    marginLeft: getResponsiveSpacing('xs'),
  },
});
