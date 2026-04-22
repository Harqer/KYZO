import React from 'react';
import { Text, TextStyle, TextProps } from 'react-native';
import { ScreenDimensions, TYPOGRAPHY } from '../../constants/responsive';

interface ResponsiveTextProps extends TextProps {
  variant?: keyof typeof TYPOGRAPHY.responsive;
  color?: string;
  textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  numberOfLines?: number;
  children: React.ReactNode;
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  variant = 'body',
  color,
  textAlign = 'auto',
  numberOfLines,
  children,
  style,
  ...props
}) => {
  const getTextStyles = (): TextStyle => {
    const baseStyles = TYPOGRAPHY.responsive[variant] || TYPOGRAPHY.responsive.body;
    
    return {
      ...baseStyles,
      color: color || (variant === 'caption' ? '#666666' : '#000000'),
      textAlign,
    };
  };

  return (
    <Text
      style={[getTextStyles(), style]}
      numberOfLines={numberOfLines}
      {...props}
    >
      {children}
    </Text>
  );
};

// Convenience components for common text variants
export const Heading = (props: Omit<ResponsiveTextProps, 'variant'>) => (
  <ResponsiveText variant="h1" {...props} />
);

export const Subheading = (props: Omit<ResponsiveTextProps, 'variant'>) => (
  <ResponsiveText variant="h2" {...props} />
);

export const Title = (props: Omit<ResponsiveTextProps, 'variant'>) => (
  <ResponsiveText variant="h3" {...props} />
);

export const Body = (props: Omit<ResponsiveTextProps, 'variant'>) => (
  <ResponsiveText variant="body" {...props} />
);

export const Caption = (props: Omit<ResponsiveTextProps, 'variant'>) => (
  <ResponsiveText variant="caption" {...props} />
);
