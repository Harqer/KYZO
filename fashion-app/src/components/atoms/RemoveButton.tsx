import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { getResponsiveSpacing } from '../../constants/responsive';

interface RemoveButtonProps {
  onPress: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'danger';
  style?: any;
}

export function RemoveButton({
  onPress,
  disabled = false,
  size = 'md',
  variant = 'danger',
  style
}: RemoveButtonProps) {
  
  const getIconSize = () => {
    switch (size) {
      case 'sm': return 12;
      case 'lg': return 20;
      default: return 16;
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return { padding: getResponsiveSpacing('xs') };
      case 'lg': return { padding: getResponsiveSpacing('sm') };
      default: return { padding: getResponsiveSpacing('xs') };
    }
  };

  const getIconColor = () => {
    if (disabled) return '#9CA3AF';
    switch (variant) {
      case 'danger': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonSize(),
        disabled && styles.disabledButton,
        style
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Trash2
        size={getIconSize()}
        color={getIconColor()}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  disabledButton: {
    opacity: 0.5,
  },
});
