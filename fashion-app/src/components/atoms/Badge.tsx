import React from 'react';
import { View, Text, StyleSheet, StyleProp } from 'react-native';
import { getResponsiveSpacing } from '../../constants/responsive';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<any>;
}

const BADGE_COLORS = {
  primary: '#6366F1',
  secondary: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

const BADGE_SIZES = {
  sm: {
    paddingHorizontal: getResponsiveSpacing('xs'),
    paddingVertical: 2,
    fontSize: 10,
    borderRadius: 10,
  },
  md: {
    paddingHorizontal: getResponsiveSpacing('sm'),
    paddingVertical: 4,
    fontSize: 12,
    borderRadius: 12,
  },
  lg: {
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: 6,
    fontSize: 14,
    borderRadius: 16,
  },
};

export function Badge({ children, variant = 'primary', size = 'md', style }: BadgeProps) {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: BADGE_COLORS[variant],
          ...BADGE_SIZES[size],
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize: BADGE_SIZES[size].fontSize,
          },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  
  text: {
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
