import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Heading } from '../src/components/elements/Heading';
import { Header } from '../src/components/layouts/Header';
import { Footer } from '../src/components/layouts/Footer';
import { SupportOptions } from '../src/components/layouts/SupportOptions';
import { ContactForm } from '../src/components/layouts/ContactForm';
import { FaqSection } from '../src/components/layouts/FaqSection';

/**
 * Support Page - Page Level Component
 * Composed of atomic design organisms:
 * - Header (layout)
 * - SupportOptions (layout)
 * - ContactForm (layout)
 * - FaqSection (layout)
 * - Footer (layout)
 */
export default function SupportPage() {
  return (
    <ScrollView style={styles.container}>
      <StatusBar style="dark" />
      
      <Header 
        title="KYZO" 
        subtitle="AI-Powered Fashion Discovery"
        variant="hero"
      />

      <View style={styles.section}>
        <Heading level={2} align="center">
          How Can We Help?
        </Heading>
        <SupportOptions />
      </View>

      <View style={styles.section}>
        <Heading level={2} align="center">
          Send Us a Message
        </Heading>
        <ContactForm />
      </View>

      <View style={styles.section}>
        <FaqSection />
      </View>

      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  section: {
    padding: 24,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
});
