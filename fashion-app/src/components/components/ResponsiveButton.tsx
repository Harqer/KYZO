import React from 'react';
import { TouchableOpacity, Text, View, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { ScreenDimensions, BUTTONS, SHADOWS } from '../../constants/responsive';

interface ResponsiveButtonProps {
  title?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  children?: React.ReactNode;
}

export const ResponsiveButton: React.FC<ResponsiveButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  onPress,
  style,
  textStyle,
  children,
}) => {
  const getButtonStyles = (): ViewStyle => {
    const sizeStyles = BUTTONS.sizes[size];
    const baseStyle: ViewStyle = {
      ...sizeStyles,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: disabled || loading ? 0.6 : 1,
    };

    // Variant styles
    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: '#000000',
          ...SHADOWS.md,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: '#F8F8F8',
          borderWidth: 1,
          borderColor: '#E0E0E0',
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: '#000000',
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyles = (): TextStyle => {
    const sizeStyles = BUTTONS.sizes[size];
    const baseStyle: TextStyle = {
      ...sizeStyles,
      fontWeight: '600',
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          color: '#FFFFFF',
        };
      case 'secondary':
        return {
          ...baseStyle,
          color: '#000000',
        };
      case 'outline':
        return {
          ...baseStyle,
          color: '#000000',
        };
      case 'ghost':
        return {
          ...baseStyle,
          color: '#000000',
        };
      default:
        return baseStyle;
    }
  };

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : '#000000'} />;
    }

    const content = children || title;

    if (icon) {
      const iconSize = BUTTONS.icon[size];
      const iconElement = React.cloneElement(
        icon as React.ReactElement<any>,
        {
          size: iconSize,
          color: variant === 'primary' ? '#FFFFFF' : '#000000',
        }
      );

      if (iconPosition === 'right') {
        return (
          <>
            <Text style={[getTextStyles(), textStyle]}>{content}</Text>
            <View style={{ marginLeft: 8 }}>
              {iconElement}
            </View>
          </>
        );
      } else {
        return (
          <>
            <View style={{ marginRight: 8 }}>
              {iconElement}
            </View>
            <Text style={[getTextStyles(), textStyle]}>{content}</Text>
          </>
        );
      }
    }

    return <Text style={[getTextStyles(), textStyle]}>{content}</Text>;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyles(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};
