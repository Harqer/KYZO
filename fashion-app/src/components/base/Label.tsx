import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface LabelProps {
  children: React.ReactNode;
  required?: boolean;
}

export function Label({ children, required = false }: LabelProps) {
  return (
    <Text style={styles.label}>
      {children}
      {required && <Text style={styles.required}> *</Text>}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  required: {
    color: '#ff4444',
  },
});
