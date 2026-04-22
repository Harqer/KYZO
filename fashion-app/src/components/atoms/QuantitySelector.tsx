import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { getResponsiveSpacing } from '../../constants/responsive';

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  disabled?: boolean;
  maxQuantity?: number;
  minQuantity?: number;
  size?: 'sm' | 'md' | 'lg';
  style?: any;
}

export function QuantitySelector({
  quantity,
  onIncrease,
  onDecrease,
  disabled = false,
  maxQuantity = 99,
  minQuantity = 1,
  size = 'md',
  style
}: QuantitySelectorProps) {
  
  const canDecrease = quantity > minQuantity && !disabled;
  const canIncrease = quantity < maxQuantity && !disabled;

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return { padding: getResponsiveSpacing('xs') };
      case 'lg': return { padding: getResponsiveSpacing('sm') };
      default: return { padding: getResponsiveSpacing('xs') };
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 12;
      case 'lg': return 20;
      default: return 16;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.button,
          getButtonSize(),
          !canDecrease && styles.disabledButton
        ]}
        onPress={onDecrease}
        disabled={!canDecrease}
      >
        <Minus 
          size={getIconSize()} 
          color={canDecrease ? '#1F2937' : '#9CA3AF'} 
        />
      </TouchableOpacity>
      
      <Text style={[styles.quantity, styles[`${size}Text`]]}>
        {quantity}
      </Text>
      
      <TouchableOpacity
        style={[
          styles.button,
          getButtonSize(),
          !canIncrease && styles.disabledButton
        ]}
        onPress={onIncrease}
        disabled={!canIncrease}
      >
        <Plus 
          size={getIconSize()} 
          color={canIncrease ? '#1F2937' : '#9CA3AF'} 
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  disabledButton: {
    opacity: 0.5,
  },
  
  quantity: {
    fontWeight: '600',
    color: '#1F2937',
    minWidth: 24,
    textAlign: 'center',
  },
  
  smText: {
    fontSize: 12,
  },
  
  mdText: {
    fontSize: 14,
  },
  
  lgText: {
    fontSize: 16,
  },
});
