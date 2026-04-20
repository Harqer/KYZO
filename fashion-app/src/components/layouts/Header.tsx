import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface HeaderProps {
  title: string;
  subtitle?: string;
  variant?: 'default' | 'hero';
}

export function Header({ title, subtitle, variant = 'default' }: HeaderProps) {
  const isHero = variant === 'hero';
  
  return (
    <View style={[styles.container, isHero ? styles.hero : styles.default]}>
      <Text style={[styles.title, isHero && styles.heroTitle]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, isHero && styles.heroSubtitle]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  default: {
    backgroundColor: '#6366f1',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  hero: {
    backgroundColor: '#6366f1',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 4,
  },
  heroTitle: {
    fontSize: 48,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#e0e7ff',
    marginTop: 8,
    letterSpacing: 1,
  },
  heroSubtitle: {
    fontSize: 16,
    marginTop: 8,
  },
});
