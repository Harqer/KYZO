import React from 'react';
import { TextInput, StyleSheet } from 'react-native';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
}

export function Input({
  value,
  onChangeText,
  placeholder,
  multiline = false,
  rows = 1,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: InputProps) {
  return (
    <TextInput
      style={[styles.input, multiline && styles.multilineInput]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      multiline={multiline}
      numberOfLines={rows}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
});
