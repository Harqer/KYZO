import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HelpCircle } from 'lucide-react-native';
import { Card } from '../elements/Card';

interface FaqItemProps {
  question: string;
  answer: string;
}

export function FaqItem({ question, answer }: FaqItemProps) {
  return (
    <Card variant="outline" padding="md" style={styles.card}>
      <View style={styles.header}>
        <HelpCircle size={20} color="#6366f1" />
        <Text style={styles.question}>{question}</Text>
      </View>
      <Text style={styles.answer}>{answer}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  answer: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
    paddingLeft: 32,
  },
});
