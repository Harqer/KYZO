import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Heading } from '../elements/Heading';

interface Step {
  number: number;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: 1,
    title: 'Create Your Profile',
    description: 'Sign up and tell us about your style preferences',
  },
  {
    number: 2,
    title: 'AI Analysis',
    description: 'Our AI learns your unique fashion taste',
  },
  {
    number: 3,
    title: 'Get Recommendations',
    description: 'Receive personalized fashion suggestions',
  },
];

export function HowItWorksSection() {
  return (
    <View style={styles.container}>
      <Heading level={2} align="center">How KYZO Works</Heading>
      
      <View style={styles.steps}>
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{step.number}</Text>
              </View>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
            </View>
            {index < steps.length - 1 && <View style={styles.connector} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    backgroundColor: '#f9fafb',
  },
  steps: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 24,
    flexWrap: 'wrap',
    marginTop: 32,
  },
  step: {
    alignItems: 'center',
    width: 200,
  },
  stepNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  connector: {
    width: 40,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginTop: 24,
  },
});
