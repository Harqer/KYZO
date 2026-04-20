import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface HeadingProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4;
  align?: 'left' | 'center' | 'right';
  color?: string;
}

export function Heading({ 
  children, 
  level = 1, 
  align = 'left',
  color = '#1f2937'
}: HeadingProps) {
  const headingStyles = [
    styles.base,
    styles[`h${level}`],
    { textAlign: align, color }
  ];

  return <Text style={headingStyles}>{children}</Text>;
}

const styles = StyleSheet.create({
  base: {
    fontWeight: 'bold',
  },
  h1: {
    fontSize: 48,
    letterSpacing: -1,
  },
  h2: {
    fontSize: 32,
    marginBottom: 8,
  },
  h3: {
    fontSize: 24,
    marginBottom: 8,
  },
  h4: {
    fontSize: 20,
    marginBottom: 4,
  },
});
