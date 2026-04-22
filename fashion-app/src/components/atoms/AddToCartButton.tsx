import React from 'react';
import { TouchableOpacity, View, StyleSheet, ActivityIndicator } from 'react-native';
import { ShoppingCart } from 'lucide-react-native';
import { getResponsiveSpacing } from '../../constants/responsive';

interface AddToCartButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact';
  style?: any;
}

export function AddToCartButton({ 
  onPress, 
  loading = false, 
  disabled = false,
  size = 'md',
  variant = 'default',
  style 
}: AddToCartButtonProps) {
  
  const getIconSize = () => {
    switch (size) {
      case 'sm': return 14;
      case 'lg': return 22;
      default: return 18;
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return { width: 28, height: 28 };
      case 'lg': return { width: 40, height: 40 };
      default: return { width: 32, height: 32 };
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonSize(),
        disabled && styles.disabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <ShoppingCart
          size={getIconSize()}
          color="#FFFFFF"
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#6366F1',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  disabled: {
    backgroundColor: '#D1D5DB',
  },
});
