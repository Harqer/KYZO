import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Sparkles, Smartphone, Shield, Zap } from 'lucide-react-native';
import { Heading } from '../base/Heading';
import { FeatureCard } from '../composites/FeatureCard';

const features = [
  {
    icon: <Sparkles size={32} color="#6366f1" />,
    title: 'AI-Powered Discovery',
    description: 'Our advanced AI learns your style preferences and curates personalized fashion recommendations just for you.',
  },
  {
    icon: <Smartphone size={32} color="#6366f1" />,
    title: 'Mobile First',
    description: 'Take KYZO with you everywhere. Available on iOS and Android for fashion discovery on the go.',
  },
  {
    icon: <Shield size={32} color="#6366f1" />,
    title: 'Privacy Focused',
    description: 'Your data is encrypted and secure. We never share your personal information with third parties.',
  },
  {
    icon: <Zap size={32} color="#6366f1" />,
    title: 'Instant Recommendations',
    description: 'Get real-time fashion suggestions powered by Claude AI and LangChain technology.',
  },
];

export function FeaturesSection() {
  return (
    <View style={styles.container}>
      <Heading level={2} align="center">Why Choose KYZO?</Heading>
      <Heading level={4} align="center" color="#6b7280">
        Experience fashion discovery like never before
      </Heading>
      
      <View style={styles.grid}>
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'center',
    marginTop: 48,
  },
});
