import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Stat {
  value: string;
  label: string;
}

const defaultStats: Stat[] = [
  { value: '50K+', label: 'Active Users' },
  { value: '1M+', label: 'Items Recommended' },
  { value: '4.9', label: 'App Store Rating' },
];

interface StatsSectionProps {
  stats?: Stat[];
}

export function StatsSection({ stats = defaultStats }: StatsSectionProps) {
  return (
    <View style={styles.container}>
      {stats.map((stat, index) => (
        <React.Fragment key={index}>
          <View style={styles.stat}>
            <Text style={styles.value}>{stat.value}</Text>
            <Text style={styles.label}>{stat.label}</Text>
          </View>
          {index < stats.length - 1 && <View style={styles.divider} />}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#f9fafb',
    gap: 40,
    flexWrap: 'wrap',
  },
  stat: {
    alignItems: 'center',
  },
  value: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
  },
});
