import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outline';
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({ 
  children, 
  variant = 'default', 
  padding = 'md',
  style,
  ...props 
}: CardProps) {
  const paddingStyles = {
    sm: styles.paddingSM,
    md: styles.paddingMD,
    lg: styles.paddingLG,
  };

  return (
    <View 
      style={[
        styles.card,
        styles[variant],
        paddingStyles[padding],
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  default: {
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  elevated: {
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
    elevation: 5,
  },
  outline: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowOpacity: 0,
    elevation: 0,
  },
  paddingSM: {
    padding: 16,
  },
  paddingMD: {
    padding: 24,
  },
  paddingLG: {
    padding: 32,
  },
});
