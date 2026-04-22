/**
 * Index Page - Page Level Component
 * Complete user experience combining all Atomic Design components
 * Main entry point for the Fashion LangChain mobile app
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ApiManagerProvider from '../src/components/composites/ApiManager';  
import LangChainIntegration from '../src/components/composites/LangChainIntegration';

export default function IndexPage() {
  useEffect(() => {
    console.log('Fashion LangChain app initialized');
  }, []);

  return (
    <ApiManagerProvider>
      <View style={styles.container}>
        <StatusBar style="auto" />
        <LangChainIntegration
          onIntegrationComplete={() => {
            console.log('LangChain integration completed');
          }}
        />
      </View>
    </ApiManagerProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
