import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({ 
  onPress, 
  children, 
  variant = 'primary', 
  disabled = false, 
  loading = false,
  icon 
}: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        styles[variant],
        (disabled || loading) && styles.disabled
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#ffffff' : '#6366f1'} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, styles[`${variant}Text`]]}>
            {children}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  primary: {
    backgroundColor: '#6366f1',
  },
  secondary: {
    backgroundColor: '#ffffff',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: '#6366f1',
  },
  outlineText: {
    color: '#6366f1',
  },
});
