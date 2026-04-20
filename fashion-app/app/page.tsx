import React from 'react';
import { StyleSheet, ScrollView, StatusBar } from 'react-native';
import { HeroSection } from '../src/components/layouts/HeroSection';
import { StatsSection } from '../src/components/layouts/StatsSection';
import { FeaturesSection } from '../src/components/layouts/FeaturesSection';
import { HowItWorksSection } from '../src/components/layouts/HowItWorksSection';
import { SupportCTASection } from '../src/components/layouts/SupportCTASection';
import { DownloadSection } from '../src/components/layouts/DownloadSection';
import { Footer } from '../src/components/layouts/Footer';

/**
 * Landing Page - Page Level Component
 * Composed of atomic design organisms:
 * - HeroSection (layout)
 * - StatsSection (layout)
 * - FeaturesSection (layout)
 * - HowItWorksSection (layout)
 * - SupportCTASection (layout)
 * - DownloadSection (layout)
 * - Footer (layout)
 */
export default function LandingPage() {
  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SupportCTASection />
      <DownloadSection />
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
