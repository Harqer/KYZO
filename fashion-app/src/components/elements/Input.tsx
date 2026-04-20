import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  multiline?: boolean;
  rows?: number;
}

export function Input({ multiline = false, rows = 1, style, ...props }: InputProps) {
  return (
    <TextInput
      style={[
        styles.input,
        multiline && { height: rows * 24 + 24 },
        style
      ]}
      placeholderTextColor="#9ca3af"
      multiline={multiline}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
});
