import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { Button } from '../base/Button';

export function HeroSection() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.badge}>✨ AI-POWERED FASHION</Text>
        <Text style={styles.title}>Discover Your Style with KYZO</Text>
        <Text style={styles.subtitle}>
          The future of fashion discovery is here. Let our AI find the perfect pieces 
          that match your unique taste and style preferences.
        </Text>
        
        <View style={styles.buttons}>
          <Button 
            variant="secondary" 
            icon={<ArrowRight size={20} color="#6366f1" />}
            onPress={() => {}}
          >
            Download the App
          </Button>
          
          <Button 
            variant="outline" 
            onPress={() => window.open('/support', '_self')}
          >
            Contact Support
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#6366f1',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  content: {
    maxWidth: 800,
    alignSelf: 'center',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 24,
    overflow: 'hidden',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: '#e0e7ff',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 28,
    maxWidth: 600,
  },
  buttons: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});
