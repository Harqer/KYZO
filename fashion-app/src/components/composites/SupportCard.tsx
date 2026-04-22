import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Card } from '../base/Card';

interface SupportCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
}

export function SupportCard({ icon, title, description, onPress }: SupportCardProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.touchable}>
      <Card variant="default" padding="md" style={styles.card}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    width: '45%',
    minWidth: 150,
  },
  card: {
    alignItems: 'center',
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
