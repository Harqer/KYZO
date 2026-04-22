import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Label } from '../base/Label';
import { Input } from '../base/Input';

interface FormFieldProps {
  label: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
}

export function FormField({
  label,
  required = false,
  multiline = false,
  rows = 1,
  ...inputProps
}: FormFieldProps) {
  return (
    <View style={styles.container}>
      <Label required={required}>{label}</Label>
      <Input multiline={multiline} rows={rows} {...inputProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
});
