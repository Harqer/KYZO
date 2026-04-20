import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Heading } from '../elements/Heading';

export function DownloadSection() {
  return (
    <View style={styles.container}>
      <Heading level={2} align="center">Get KYZO Today</Heading>
      <Text style={styles.description}>
        Download the app and start your AI-powered fashion journey
      </Text>
      
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.storeButton}>
          <Text style={styles.storeTitle}>App Store</Text>
          <Text style={styles.storeSubtitle}>Download on iOS</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.storeButton}>
          <Text style={styles.storeTitle}>Google Play</Text>
          <Text style={styles.storeSubtitle}>Download on Android</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
    maxWidth: 500,
  },
  buttons: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  storeButton: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 180,
    alignItems: 'center',
  },
  storeTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  storeSubtitle: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
});
