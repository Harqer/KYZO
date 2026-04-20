import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';

interface HeadingProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4;
  align?: 'left' | 'center' | 'right';
  color?: string;
  style?: StyleProp<TextStyle>;
}

const headingSizes = {
  1: 32,
  2: 24,
  3: 20,
  4: 18,
};

export function Heading({ 
  children, 
  level = 1, 
  align = 'left', 
  color = '#1f2937',
  style 
}: HeadingProps) {
  return (
    <Text
      style={[
        {
          fontSize: headingSizes[level],
          fontWeight: 'bold',
          textAlign: align,
          color,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
